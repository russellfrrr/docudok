import type { Message } from '@/types/chat';
import { MessageContent } from './MessageContent';
import { MessageSources } from './MessageSources';

interface ChatMessageBubbleProps {
  message: Message;
  shouldTypeResponse: boolean;
  sourcesExpanded: boolean;
  copiedTextId: string | null;
  onTypingComplete: (messageId: string) => void;
  onToggleSources: (messageId: string) => void;
  onCopyText: (copyId: string, text: string) => void;
}

export const ChatMessageBubble = ({
  message,
  shouldTypeResponse,
  sourcesExpanded,
  copiedTextId,
  onTypingComplete,
  onToggleSources,
  onCopyText,
}: ChatMessageBubbleProps) => {
  const isUserMessage = message.role === 'user';

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-lg border p-4 ${
          isUserMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-foreground'
        }`}
      >
        <div
          className={`mb-2 text-xs font-medium uppercase ${
            isUserMessage
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground'
          }`}
        >
          {message.role}
        </div>

        <MessageContent
          text={message.content}
          enabled={shouldTypeResponse}
          markdown={!isUserMessage}
          onComplete={() => onTypingComplete(message._id)}
        />

        {!isUserMessage && message.sources.length > 0 && (
          <MessageSources
            messageId={message._id}
            sources={message.sources}
            expanded={sourcesExpanded}
            copiedTextId={copiedTextId}
            onToggle={onToggleSources}
            onCopyText={onCopyText}
          />
        )}
      </div>
    </div>
  );
};
