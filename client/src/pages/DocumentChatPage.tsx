import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  FileText,
} from 'lucide-react';
import { getDocumentById, searchDocument } from '@/services/document.service';
import { createChat, deleteChat, sendMessage } from '@/services/chat.service';
import { useChats } from '@/hooks/useChats';
import { useDocumentChunks } from '@/hooks/useDocumentChunks';
import { useMessages } from '@/hooks/useMessages';
import type { Chat } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/layout/AppLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { DocumentChunkStats } from '@/components/document/DocumentChunkStats';
import { DocumentStatusBadge } from '@/components/document/DocumentStatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { PendingUserMessage } from '@/components/chat/PendingUserMessage';
import { RetrievalTester } from '@/components/chat/RetrievalTester';
import { ThinkingMessage } from '@/components/chat/ThinkingMessage';
import { copyToClipboard } from '@/lib/clipboard';
import {
  getDocumentFailureMessage,
  getDocumentStatusSummary,
} from '@/lib/document';
import { formatDate } from '@/lib/format';
import { countWords } from '@/lib/text-stats';
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
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <AppLogo />

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="truncate">
                  {document?.fileName || 'Loading document...'}
                </span>
              </div>
              <h1 className="truncate text-2xl font-semibold text-foreground">
                {document?.title || 'Document'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {document
                  ? getDocumentStatusSummary(document)
                  : 'Loading document details'}
              </p>
            </div>

            <DocumentStatusBadge status={document?.status || 'loading'} />
          </div>
        </div>
      </header>

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

                {chunksQuery.data?.chunks.map((chunk) => (
                  <div
                    key={chunk._id}
                    className="rounded-md border bg-background p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          Chunk {chunk.chunkIndex}
                        </span>
                        <span>{chunk.chunkText.length} characters</span>
                        <span>{countWords(chunk.chunkText)} words</span>
                        <span>Saved {formatDate(chunk.createdAt)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyText(chunk._id, chunk.chunkText)}
                      >
                        {copiedTextId === chunk._id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedTextId === chunk._id ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {chunk.chunkText}
                    </p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
};
