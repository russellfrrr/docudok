import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { getDocumentById, searchDocument } from '@/services/document.service';
import { createChat, deleteChat, sendMessage } from '@/services/chat.service';
import { useChats } from '@/hooks/useChats';
import { useDocumentChunks } from '@/hooks/useDocumentChunks';
import { useMessages } from '@/hooks/useMessages';
import type { Chat } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/layout/AppLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { DocumentStatusBadge } from '@/components/document/DocumentStatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { copyToClipboard } from '@/lib/clipboard';
import {
  getDocumentFailureMessage,
  getDocumentStatusSummary,
} from '@/lib/document';
import { formatDate, formatNumber } from '@/lib/format';
import { formatSourceScore, getSourceScoreLabel } from '@/lib/source-score';
import { countWords } from '@/lib/text-stats';

const SUGGESTED_QUESTIONS = [
  'Summarize this document.',
  'What are the most important details?',
  'What should I review carefully?',
];
const MAX_MESSAGE_LENGTH = 2000;

export const DocumentChatPage = () => {
  const { documentId } = useParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'chunks'>('chat');
  const [debugQuestion, setDebugQuestion] = useState('');
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId || ''),
    enabled: Boolean(documentId),
  });

  const chatsQuery = useChats(documentId);
  const messagesQuery = useMessages(selectedChatId);
  const chunksQuery = useDocumentChunks(documentId, activeView === 'chunks');

  useEffect(() => {
    if (!selectedChatId && chatsQuery.data?.chats.length) {
      setSelectedChatId(chatsQuery.data.chats[0]._id);
    }
  }, [chatsQuery.data, selectedChatId]);

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
    mutationFn: async () => {
      if (!message.trim()) {
        throw new Error('Message is required');
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
      }

      const content = message.trim();
      let chatId = selectedChatId;

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
    onSuccess: (data) => {
      setSelectedChatId(data.chatId);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chats', documentId] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.chatId] });
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
  }, [messagesQuery.data?.messages.length, askQuestionMutation.isPending]);

  if (!documentId) {
    return <Navigate to="/" />;
  }

  const chats: Chat[] = chatsQuery.data?.chats || [];
  const messages = messagesQuery.data?.messages || [];
  const document = documentQuery.data?.document;
  const documentIsReady = document?.status === 'ready';
  const documentFailed = document?.status === 'failed';
  const hasSelectedChat = Boolean(selectedChatId);
  const hasMessages = messages.length > 0;
  const showEmptyChat =
    hasSelectedChat && !hasMessages && !messagesQuery.isLoading;
  const inputIsDisabled =
    !documentIsReady || askQuestionMutation.isPending;
  const messageIsTooLong = message.length > MAX_MESSAGE_LENGTH;

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
        <aside className="space-y-4">
          <Card className="border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Chats</CardTitle>

              <Button
                size="sm"
                onClick={() => createChatMutation.mutate()}
                disabled={!documentIsReady || createChatMutation.isPending}
              >
                {createChatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                New
              </Button>
            </CardHeader>

            <CardContent className="space-y-2">
              {!documentIsReady && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Chat is available after the document is ready.
                  </AlertDescription>
                </Alert>
              )}

              {chatsQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Loading chats...</p>
              )}

              {chats.length === 0 && !chatsQuery.isLoading && (
                <p className="text-sm text-muted-foreground">
                  No chats yet. Start a new one.
                </p>
              )}

              {deleteChatMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {deleteChatMutation.error instanceof Error
                      ? deleteChatMutation.error.message
                      : 'Delete chat failed'}
                  </AlertDescription>
                </Alert>
              )}

              {chats.map((chat) => {
                const isSelected = selectedChatId === chat._id;
                const isDeleting =
                  deleteChatMutation.isPending &&
                  deleteChatMutation.variables === chat._id;

                return (
                  <div
                    key={chat._id}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 transition ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-accent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(chat._id)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-sm"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 shrink-0 ${
                        isSelected
                          ? 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                          : 'text-muted-foreground hover:text-destructive'
                      }`}
                      onClick={() => handleDeleteChat(chat._id)}
                      disabled={isDeleting}
                      aria-label={`Delete ${chat.title}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-h-[620px] flex-col">
          <Card className="flex min-h-0 flex-1 flex-col border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
              <CardTitle className="text-base">
                {activeView === 'chat'
                  ? selectedChatId
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

                {!selectedChatId && (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border bg-background p-6 text-center">
                    <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-base font-medium text-foreground">
                      Ask a question about this document
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Type below to start a new chat, or create one from the
                      chat list.
                    </p>
                  </div>
                )}

                {messagesQuery.isLoading && hasSelectedChat && (
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                )}

                {showEmptyChat && (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border bg-background p-6 text-center">
                    <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-base font-medium text-foreground">
                      Ask your first question
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      The assistant will answer only from the document context and
                      show the source snippets it used.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {SUGGESTED_QUESTIONS.map((question) => (
                        <Button
                          key={question}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMessage(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((chatMessage) => (
                  <div
                    key={chatMessage._id}
                    className={`flex ${
                      chatMessage.role === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-lg border p-4 ${
                        chatMessage.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground'
                      }`}
                    >
                      <div
                        className={`mb-2 text-xs font-medium uppercase ${
                          chatMessage.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {chatMessage.role}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {chatMessage.content}
                      </p>

                      {chatMessage.role === 'assistant' &&
                        chatMessage.sources.length > 0 && (
                          <div className="mt-4 space-y-2 border-t pt-4">
                            <div className="text-xs font-medium text-muted-foreground">
                              Sources
                            </div>

                            {chatMessage.sources.map((source, index) => {
                              const copyId = `${chatMessage._id}-source-${source.chunkIndex}-${index}`;

                              return (
                                <div
                                  key={`${chatMessage._id}-${source.chunkIndex}-${source.score}`}
                                  className="rounded-md border bg-muted/50 p-3"
                                >
                                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span>
                                      Source {index + 1} - Chunk {source.chunkIndex} -
                                      {' '}
                                      {formatSourceScore(source.score, source.relevanceScore, source.rerankScore)}
                                      {' - '}
                                      {getSourceScoreLabel(source.relevanceScore)}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleCopyText(copyId, source.chunkText)
                                      }
                                    >
                                      {copiedTextId === copyId ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                      {copiedTextId === copyId ? 'Copied' : 'Copy'}
                                    </Button>
                                  </div>
                                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                                    {source.chunkText}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

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

              <div className="border-t bg-background/80 p-3 sm:p-4">
                <form
                  className="flex flex-col gap-3 rounded-lg border bg-card p-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    askQuestionMutation.mutate();
                  }}
                >
                  <Input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ask a question about this document"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                    maxLength={MAX_MESSAGE_LENGTH + 1}
                    disabled={inputIsDisabled}
                  />

                  <Button
                    type="submit"
                    className="sm:w-fit"
                    disabled={inputIsDisabled || !message.trim() || messageIsTooLong}
                  >
                    {askQuestionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {askQuestionMutation.isPending ? 'Thinking...' : 'Send'}
                  </Button>
                </form>
                <div
                  className={`mt-2 text-right text-xs ${
                    messageIsTooLong ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  {message.length}/{MAX_MESSAGE_LENGTH}
                  {messageIsTooLong && ' - message is too long'}
                </div>
              </div>
            </CardContent>
            ) : (
              <CardContent className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                <form
                  className="rounded-md border bg-background p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    searchMutation.mutate();
                  }}
                >
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Test retrieval
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Ask a question to see which source chunks the backend picks.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={debugQuestion}
                      onChange={(event) => setDebugQuestion(event.target.value)}
                      placeholder="Example: What is this document about?"
                      disabled={searchMutation.isPending || !documentIsReady}
                    />
                    <Button
                      type="submit"
                      className="sm:w-fit"
                      disabled={
                        searchMutation.isPending ||
                        !documentIsReady ||
                        !debugQuestion.trim()
                      }
                    >
                      {searchMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                    {(debugQuestion || searchMutation.data) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="sm:w-fit"
                        onClick={clearRetrievalTest}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>

                {searchMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {searchMutation.error instanceof Error
                        ? searchMutation.error.message
                        : 'Search failed'}
                    </AlertDescription>
                  </Alert>
                )}

                {searchMutation.data && (
                  <div className="space-y-2 rounded-md border bg-background p-4">
                    <div className="text-sm font-medium text-foreground">
                      Retrieved sources
                    </div>

                    {searchMutation.data.sources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No sources matched this question. Try rephrasing it or
                        checking whether the document chunks contain the answer.
                      </p>
                    ) : (
                      searchMutation.data.sources.map((source, index) => {
                        const copyId = `retrieval-source-${source.chunkIndex}-${index}`;

                        return (
                          <div
                            key={`${source.chunkIndex}-${source.score}`}
                            className="rounded-md border bg-muted/50 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span>
                                Source {index + 1} - Chunk {source.chunkIndex} -
                                {' '}
                                {formatSourceScore(source.score, source.relevanceScore)}
                                {' - '}
                                {getSourceScoreLabel(source.relevanceScore)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCopyText(copyId, source.chunkText)
                                }
                              >
                                {copiedTextId === copyId ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                {copiedTextId === copyId ? 'Copied' : 'Copy'}
                              </Button>
                            </div>
                            <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                              {source.chunkText}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {chunksQuery.data && (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Total chunks
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatNumber(chunksQuery.data.stats.totalChunks)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Total characters
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatNumber(chunksQuery.data.stats.totalCharacters)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Total words
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatNumber(chunksQuery.data.stats.totalWords)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Avg. characters
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatNumber(chunksQuery.data.stats.averageChunkLength)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Avg. words
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatNumber(chunksQuery.data.stats.averageChunkWords)}
                      </div>
                    </div>
                  </div>
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
                        <span>{formatNumber(countWords(chunk.chunkText))} words</span>
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
