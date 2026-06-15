import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatEmptyStateProps {
  title: string;
  description: string;
  suggestedQuestions?: string[];
  onSelectQuestion?: (question: string) => void;
}

export const ChatEmptyState = ({
  title,
  description,
  suggestedQuestions = [],
  onSelectQuestion,
}: ChatEmptyStateProps) => {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border bg-background p-6 text-center">
      <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      {suggestedQuestions.length > 0 && onSelectQuestion && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestedQuestions.map((question) => (
            <Button
              key={question}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
