import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Send, Plus, MessageSquare } from 'lucide-react';
import { getDocumentById } from '@/services/document.service';
import { createChat, sendMessage } from '@/services/chat.service';
import { useChats } from '@/hooks/useChats';
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

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId || ''),
    enabled: Boolean(documentId),
  });

  const chatsQuery = useChats(documentId);
  const messagesQuery = useMessages(selectedChatId);

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
  })

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

  if (!documentId) {
    return <Navigate to="/" />;
  }

  const chats: Chat[] = chatsQuery.data?.chats || [];
  const messages = messagesQuery.data?.messages || [];
  const documentIsReady = documentQuery.data?.document.status === 'ready';

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

        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-foreground">
              {documentQuery.data?.document.title || 'Document'}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">
              {documentQuery.data?.document.status || 'loading'}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Button
            className="w-full"
            onClick={() => createChatMutation.mutate()}
            disabled={createChatMutation.isPending}
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

        <div className="space-y-4">
          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!selectedChatId && (
                <div className="rounded-md border bg-background p-6 text-center text-sm text-muted-foreground">
                  Create a chat to start asking questions.
                </div>
              )}

              {messagesQuery.isLoading && selectedChatId && (
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              )}

              {selectedChatId && messages.length === 0 && !messagesQuery.isLoading && (
                <div className="rounded-md border bg-background p-6 text-center text-sm text-muted-foreground">
                  Ask your first question about this document.
                </div>
              )}

              {messages.map((chatMessage) => (
                <div
                  key={chatMessage._id}
                  className={`rounded-md border p-4 ${
                    chatMessage.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-background'
                      : 'mr-auto max-w-[85%] bg-secondary'
                  }`}
                >
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    {chatMessage.role}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {chatMessage.content}
                  </p>

                  {chatMessage.sources.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Sources
                      </div>

                      {chatMessage.sources.map((source) => (
                        <div
                          key={`${chatMessage._id}-${source.chunkIndex}-${source.score}`}
                          className="rounded-md border bg-background p-3"
                        >
                          <div className="mb-1 text-xs text-muted-foreground">
                            Chunk {source.chunkIndex} - Score{' '}
                            {source.score.toFixed(3)}
                          </div>
                          <p className="line-clamp-3 text-sm text-muted-foreground">
                            {source.chunkText}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
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
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm">
            <CardContent className="pt-6">
              <form
                className="flex gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessageMutation.mutate();
                }}
              >
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask a question about this document"
                  disabled={!selectedChatId || !documentIsReady || sendMessageMutation.isPending}
                />

                <Button
                  type="submit"
                  disabled={!selectedChatId || !documentIsReady || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
