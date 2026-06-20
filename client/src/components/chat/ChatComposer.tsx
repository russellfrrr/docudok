import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_MESSAGE_LENGTH } from '@/constants/chat';

interface ChatComposerProps {
  message: string;
  disabled: boolean;
  isSending: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
}

export const ChatComposer = ({
  message,
  disabled,
  isSending,
  onMessageChange,
  onSubmit,
}: ChatComposerProps) => {
  const messageIsTooLong = message.length > MAX_MESSAGE_LENGTH;
  const submitIsDisabled = disabled || !message.trim() || messageIsTooLong;

  return (
    <div className="border-t bg-background/80 p-3 sm:p-4">
      <form
        className="flex flex-col gap-3 rounded-lg border bg-card p-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Input
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Ask a question about this document"
          aria-label="Ask a question about this document"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          maxLength={MAX_MESSAGE_LENGTH + 1}
          disabled={disabled}
        />

        <Button type="submit" className="sm:w-fit" disabled={submitIsDisabled}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSending ? 'Thinking...' : 'Send'}
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
  );
};
