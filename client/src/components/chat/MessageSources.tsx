import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SourceSnippet } from '@/types/document';
import { SourceCard } from './SourceCard';

interface MessageSourcesProps {
  messageId: string;
  sources: SourceSnippet[];
  expanded: boolean;
  copiedTextId: string | null;
  onToggle: (messageId: string) => void;
  onCopyText: (copyId: string, text: string) => void;
}

export const MessageSources = ({
  messageId,
  sources,
  expanded,
  copiedTextId,
  onToggle,
  onCopyText,
}: MessageSourcesProps) => {
  const sourcesId = `${messageId}-sources`;

  return (
    <div className="mt-4 border-t pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        onClick={() => onToggle(messageId)}
        aria-expanded={expanded}
        aria-controls={sourcesId}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
        {expanded ? 'Hide sources' : `Show sources (${sources.length})`}
      </Button>

      {expanded && (
        <div
          id={sourcesId}
          className="mt-3 space-y-3 rounded-md border border-dashed bg-muted/25 p-3"
        >
          {sources.map((source, index) => {
            const copyId = `${messageId}-source-${source.chunkIndex}-${index}`;

            return (
              <SourceCard
                key={`${messageId}-${source.chunkIndex}-${source.score}`}
                source={source}
                index={index}
                copyId={copyId}
                copiedTextId={copiedTextId}
                onCopyText={onCopyText}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
