import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import {
  createChat,
  deleteChat,
  getDocumentById,
  searchDocument,
  sendMessage,
} from '@/services';
import { useChats } from '@/hooks/useChats';
import { useDocumentChunks } from '@/hooks/useDocumentChunks';
import { useMessages } from '@/hooks/useMessages';
import type { Chat } from '@/types/chat';
import {
  DocumentChatHeader,
  DocumentChunkList,
  DocumentChunkStats,
} from '@/components/document';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  ChatComposer,
  ChatEmptyState,
  ChatMessageBubble,
  ChatSidebar,
  PendingUserMessage,
  RetrievalTester,
  ThinkingMessage,
} from '@/components/chat';
import { copyToClipboard } from '@/lib/clipboard';
import { getDocumentFailureMessage } from '@/lib/document';
import { MAX_MESSAGE_LENGTH, SUGGESTED_QUESTIONS } from '@/constants/chat';

export const DocumentChatPage = () => {
  const { documentId } = useParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'chunks'>('chat');
  const [debugQuestion, setDebugQuestion] = useState('');
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [expandedSourceMessageIds, setExpandedSourceMessageIds] = useState<string[]>([]);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState('');

  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId || ''),
    enabled: Boolean(documentId),
  });

  const chatsQuery = useChats(documentId);
  const chats: Chat[] = chatsQuery.data?.chats || [];
  const firstChatId = chats[0]?._id || null;
  const activeChatId = selectedChatId || firstChatId;
  const messagesQuery = useMessages(activeChatId);
  const chunksQuery = useDocumentChunks(documentId, activeView === 'chunks');

  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (!documentId) {
        throw new Error('Document ID is missing');
      }

      return createChat({
        documentId,
        title: documentQuery.data?.document.title || 'Document chat',
      });
    },
    onSuccess: (data) => {
      setSelectedChatId(data.chat._id);
      queryClient.invalidateQueries({ queryKey: ['chats', documentId] });
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChat,
    onSuccess: (_data, deletedChatId) => {
      if (selectedChatId === deletedChatId) {
        setSelectedChatId(null);
        queryClient.removeQueries({ queryKey: ['messages', deletedChatId] });
      }

      queryClient.invalidateQueries({ queryKey: ['chats', documentId] });
    },
  });

  const askQuestionMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!content) {
        throw new Error('Message is required');
      }

      if (content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
      }

      let chatId = activeChatId;

      if (!chatId) {
        if (!documentId) {
          throw new Error('Document ID is missing');
        }

        const chatTitle =
          content.length > 48 ? `${content.slice(0, 48)}...` : content;

        const newChat = await createChat({
          documentId,
          title: chatTitle,
        });

        chatId = newChat.chat._id;
      }

      const response = await sendMessage({
        chatId,
        content,
      });

      return { chatId, response };
    },
    onMutate: (content) => {
      setPendingUserMessage(content);
      setMessage('');
    },
    onSuccess: (data) => {
      setSelectedChatId(data.chatId);
      setTypingMessageId(data.response.assistantMessage._id);
      setPendingUserMessage('');
      queryClient.invalidateQueries({ queryKey: ['chats', documentId] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.chatId] });
    },
    onError: (_error, content) => {
      setPendingUserMessage('');
      setMessage(content);
    },
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      if (!documentId) {
        throw new Error('Document ID is missing');
      }

      if (!debugQuestion.trim()) {
        throw new Error('Debug question is required');
      }

      return searchDocument(documentId, debugQuestion.trim());
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [
    messagesQuery.data?.messages.length,
    askQuestionMutation.isPending,
    pendingUserMessage,
  ]);

  const handleTypingComplete = useCallback((messageId: string) => {
    setTypingMessageId((currentMessageId) => {
      if (currentMessageId !== messageId) {
        return currentMessageId;
      }

      return null;
    });
  }, []);

  if (!documentId) {
    return <Navigate to="/" />;
  }

  const messages = messagesQuery.data?.messages || [];
  const document = documentQuery.data?.document;
  const documentIsReady = document?.status === 'ready';
  const documentFailed = document?.status === 'failed';
  const hasSelectedChat = Boolean(activeChatId);
  const hasMessages = messages.length > 0;
  const showEmptyChat =
    hasSelectedChat &&
    !hasMessages &&
    !messagesQuery.isLoading &&
    !pendingUserMessage;
  const inputIsDisabled = !documentIsReady || askQuestionMutation.isPending;

  const handleCopyText = async (copyId: string, text: string) => {
    await copyToClipboard(text);
    setCopiedTextId(copyId);

    window.setTimeout(() => {
      setCopiedTextId(null);
    }, 1500);
  };

  const clearRetrievalTest = () => {
    setDebugQuestion('');
    searchMutation.reset();
  };

  const toggleMessageSources = (messageId: string) => {
    setExpandedSourceMessageIds((currentIds) => {
      if (currentIds.includes(messageId)) {
        return currentIds.filter((id) => id !== messageId);
      }

      return [...currentIds, messageId];
    });
  };

  const handleDeleteChat = (chatId: string) => {
    const confirmed = window.confirm('Delete this chat? This cannot be undone.');

    if (!confirmed) {
      return;
    }

    deleteChatMutation.mutate(chatId);
  };

  return (
    <main className="min-h-screen bg-muted">
      <DocumentChatHeader document={document} />

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          documentIsReady={documentIsReady}
          chatsAreLoading={chatsQuery.isLoading}
          chatIsCreating={createChatMutation.isPending}
          deleteErrorMessage={
            deleteChatMutation.isError
              ? deleteChatMutation.error instanceof Error
                ? deleteChatMutation.error.message
                : 'Delete chat failed'
              : null
          }
          deletingChatId={
            deleteChatMutation.isPending ? deleteChatMutation.variables : null
          }
          onCreateChat={() => createChatMutation.mutate()}
          onSelectChat={setSelectedChatId}
          onDeleteChat={handleDeleteChat}
        />

        <div className="flex min-h-[620px] flex-col">
          <Card className="flex min-h-0 flex-1 flex-col border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
              <CardTitle className="text-base">
                {activeView === 'chat'
                  ? activeChatId
                    ? 'Document assistant'
                    : 'Messages'
                  : 'Chunk inspector'}
              </CardTitle>

              <div className="flex rounded-md border bg-background p-1">
                <Button
                  type="button"
                  variant={activeView === 'chat' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('chat')}
                >
                  Chat
                </Button>
                <Button
                  type="button"
                  variant={activeView === 'chunks' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('chunks')}
                >
                  Chunks
                </Button>
              </div>
            </CardHeader>

            {activeView === 'chat' ? (
              <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {documentFailed && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {getDocumentFailureMessage(document)}
                    </AlertDescription>
                  </Alert>
                )}

                {!activeChatId && !pendingUserMessage && (
                  <ChatEmptyState
                    title="Ask a question about this document"
                    description="Type below to start a new chat, or create one from the chat list."
                  />
                )}

                {messagesQuery.isLoading && hasSelectedChat && (
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                )}

                {showEmptyChat && (
                  <ChatEmptyState
                    title="Ask your first question"
                    description="The assistant will answer only from the document context and show the source snippets it used."
                    suggestedQuestions={SUGGESTED_QUESTIONS}
                    onSelectQuestion={setMessage}
                  />
                )}

                {messages.map((chatMessage) => {
                  const shouldTypeResponse =
                    chatMessage.role === 'assistant' &&
                    chatMessage._id === typingMessageId;

                  return (
                    <ChatMessageBubble
                      key={chatMessage._id}
                      message={chatMessage}
                      shouldTypeResponse={shouldTypeResponse}
                      sourcesExpanded={expandedSourceMessageIds.includes(
                        chatMessage._id
                      )}
                      copiedTextId={copiedTextId}
                      onTypingComplete={handleTypingComplete}
                      onToggleSources={toggleMessageSources}
                      onCopyText={handleCopyText}
                    />
                  );
                })}

                {pendingUserMessage && (
                  <PendingUserMessage content={pendingUserMessage} />
                )}

                {askQuestionMutation.isPending && <ThinkingMessage />}

                {askQuestionMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {askQuestionMutation.error instanceof Error
                        ? askQuestionMutation.error.message
                        : 'Send message failed'}
                    </AlertDescription>
                  </Alert>
                )}

                {createChatMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {createChatMutation.error instanceof Error
                        ? createChatMutation.error.message
                        : 'Create chat failed'}
                    </AlertDescription>
                  </Alert>
                )}

                <div ref={messagesEndRef} />
              </div>

              <ChatComposer
                message={message}
                disabled={inputIsDisabled}
                isSending={askQuestionMutation.isPending}
                onMessageChange={setMessage}
                onSubmit={() => askQuestionMutation.mutate(message.trim())}
              />
            </CardContent>
            ) : (
              <CardContent className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                <RetrievalTester
                  question={debugQuestion}
                  sources={searchMutation.data?.sources}
                  isPending={searchMutation.isPending}
                  isError={searchMutation.isError}
                  errorMessage={
                    searchMutation.error instanceof Error
                      ? searchMutation.error.message
                      : null
                  }
                  documentIsReady={documentIsReady}
                  copiedTextId={copiedTextId}
                  onQuestionChange={setDebugQuestion}
                  onSubmit={() => searchMutation.mutate()}
                  onClear={clearRetrievalTest}
                  onCopyText={handleCopyText}
                />

                {chunksQuery.data && (
                  <DocumentChunkStats stats={chunksQuery.data.stats} />
                )}

                {chunksQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading chunks...</p>
                )}

                {chunksQuery.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>Failed to load chunks.</AlertDescription>
                  </Alert>
                )}

                {chunksQuery.data?.chunks.length === 0 && (
                  <div className="rounded-md border bg-background p-6 text-center text-sm text-muted-foreground">
                    No chunks saved for this document yet.
                  </div>
                )}

                {chunksQuery.data?.chunks && (
                  <DocumentChunkList
                    chunks={chunksQuery.data.chunks}
                    copiedTextId={copiedTextId}
                    onCopyText={handleCopyText}
                  />
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
};
