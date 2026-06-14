import { Check, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SourceSnippet } from '@/types/document';
import { formatSourceScore, getSourceScoreLabel } from '@/lib/source-score';

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
              <div
                key={`${messageId}-${source.chunkIndex}-${source.score}`}
                className="rounded-md border bg-background/70 p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Source {index + 1} - Chunk {source.chunkIndex} -{' '}
                    {formatSourceScore(
                      source.score,
                      source.relevanceScore,
                      source.rerankScore,
                      source.keywordScore,
                      source.finalScore
                    )}{' '}
                    - {getSourceScoreLabel(source.relevanceScore)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyText(copyId, source.chunkText)}
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
  );
};
