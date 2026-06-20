import { AlertCircle, Loader2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { Chat } from '@/types/chat';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  documentIsReady: boolean;
  chatsAreLoading: boolean;
  chatIsCreating: boolean;
  deleteErrorMessage: string | null;
  deletingChatId: string | null;
  onCreateChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export const ChatSidebar = ({
  chats,
  activeChatId,
  documentIsReady,
  chatsAreLoading,
  chatIsCreating,
  deleteErrorMessage,
  deletingChatId,
  onCreateChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) => {
  return (
    <aside className="space-y-4">
      <Card className="border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Chats</CardTitle>

          <Button
            size="sm"
            onClick={onCreateChat}
            disabled={!documentIsReady || chatIsCreating}
          >
            {chatIsCreating ? (
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

          {chatsAreLoading && (
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          )}

          {chats.length === 0 && !chatsAreLoading && (
            <p className="text-sm text-muted-foreground">
              No chats yet. Start a new one.
            </p>
          )}

          {deleteErrorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{deleteErrorMessage}</AlertDescription>
            </Alert>
          )}

          {chats.map((chat) => {
            const isSelected = activeChatId === chat._id;
            const isDeleting = deletingChatId === chat._id;

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
                  onClick={() => onSelectChat(chat._id)}
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
                  onClick={() => onDeleteChat(chat._id)}
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
  );
};
