import { MessageContent } from './MessageContent';

interface PendingUserMessageProps {
  content: string;
}

export const PendingUserMessage = ({ content }: PendingUserMessageProps) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-lg border bg-primary p-4 text-primary-foreground">
        <div className="mb-2 text-xs font-medium uppercase text-primary-foreground/70">
          user
        </div>
        <MessageContent text={content} enabled={false} />
      </div>
    </div>
  );
};
