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
} from 'lucide-react';
import { getDocumentById, searchDocument } from '@/services/document.service';
import { createChat, sendMessage } from '@/services/chat.service';
import { useChats } from '@/hooks/useChats';
import { useDocumentChunks } from '@/hooks/useDocumentChunks';
import { useMessages } from '@/hooks/useMessages';
import type { Chat } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/layout/AppLogo';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DocumentChatPage = () => {
  const { documentId } = useParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'chunks'>('chat');
  const [debugQuestion, setDebugQuestion] = useState('');
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

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

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChatId) {
        throw new Error('Create or select a chat first');
      }

      if (!message.trim()) {
        throw new Error('Message is required');
      }

      return sendMessage({
        chatId: selectedChatId,
        content: message.trim(),
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChatId] });
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
  }, [messagesQuery.data?.messages.length, sendMessageMutation.isPending]);

  if (!documentId) {
    return <Navigate to="/" />;
  }

  const chats: Chat[] = chatsQuery.data?.chats || [];
  const messages = messagesQuery.data?.messages || [];
  const document = documentQuery.data?.document;
  const documentIsReady = document?.status === 'ready';
  const inputIsDisabled =
    !selectedChatId || !documentIsReady || sendMessageMutation.isPending;

  const getStatusClassName = (status: string) => {
    if (status === 'ready') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'failed') {
      return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.75) {
      return 'strong match';
    }

    if (score >= 0.5) {
      return 'possible match';
    }

    return 'weak match';
  };

  const handleCopyChunk = async (chunkId: string, chunkText: string) => {
    await navigator.clipboard.writeText(chunkText);
    setCopiedChunkId(chunkId);

    window.setTimeout(() => {
      setCopiedChunkId(null);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <AppLogo />

          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
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
                {documentIsReady
                  ? `${document.totalChunks} chunks indexed`
                  : document?.status === 'processing'
                    ? 'Processing document before chat is available'
                    : document?.status === 'failed'
                      ? 'Processing failed. Retry from the dashboard.'
                      : 'Loading document details'}
              </p>
            </div>

            <span
              className={`w-fit rounded-md border px-2 py-1 text-xs capitalize ${
                document ? getStatusClassName(document.status) : ''
              }`}
            >
              {document?.status || 'loading'}
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Button
            className="w-full"
            onClick={() => createChatMutation.mutate()}
            disabled={!documentIsReady || createChatMutation.isPending}
          >
            {createChatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New chat
          </Button>

          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Chats</CardTitle>
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

              {chats.map((chat) => (
                <button
                  key={chat._id}
                  type="button"
                  onClick={() => setSelectedChatId(chat._id)}
                  className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
                    selectedChatId === chat._id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
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
                {!selectedChatId && (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border bg-background p-6 text-center">
                    <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-base font-medium text-foreground">
                      Ask a question about this document
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Create a chat when the document is ready, then ask anything
                      that can be answered from its contents.
                    </p>
                  </div>
                )}

                {messagesQuery.isLoading && selectedChatId && (
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                )}

                {selectedChatId && messages.length === 0 && !messagesQuery.isLoading && (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border bg-background p-6 text-center">
                    <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-base font-medium text-foreground">
                      Ask your first question
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      The assistant will answer only from the document context and
                      show the source snippets it used.
                    </p>
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

                            {chatMessage.sources.map((source, index) => (
                              <div
                                key={`${chatMessage._id}-${source.chunkIndex}-${source.score}`}
                                className="rounded-md border bg-muted/50 p-3"
                              >
                                <div className="mb-1 text-xs text-muted-foreground">
                                  Source {index + 1} - Chunk {source.chunkIndex}
                                </div>
                                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                                  {source.chunkText}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {sendMessageMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {sendMessageMutation.error instanceof Error
                        ? sendMessageMutation.error.message
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
                    sendMessageMutation.mutate();
                  }}
                >
                  <Input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ask a question about this document"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                    disabled={inputIsDisabled}
                  />

                  <Button
                    type="submit"
                    className="sm:w-fit"
                    disabled={inputIsDisabled || !message.trim()}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {sendMessageMutation.isPending ? 'Thinking...' : 'Send'}
                  </Button>
                </form>
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
                      searchMutation.data.sources.map((source, index) => (
                        <div
                          key={`${source.chunkIndex}-${source.score}`}
                          className="rounded-md border bg-muted/50 p-3"
                        >
                          <div className="mb-1 text-xs text-muted-foreground">
                            Source {index + 1} - Chunk {source.chunkIndex} -
                            Score {source.score.toFixed(3)} -{' '}
                            {getScoreLabel(source.score)}
                          </div>
                          <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                            {source.chunkText}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {chunksQuery.data && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Total chunks
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {chunksQuery.data.stats.totalChunks}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Total characters
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {chunksQuery.data.stats.totalCharacters}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        Avg. chunk length
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {chunksQuery.data.stats.averageChunkLength}
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
                        <span>
                          Saved {new Date(chunk.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyChunk(chunk._id, chunk.chunkText)}
                      >
                        {copiedChunkId === chunk._id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedChunkId === chunk._id ? 'Copied' : 'Copy'}
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
