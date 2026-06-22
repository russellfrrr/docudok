import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSourceScore, getSourceScoreLabel } from '@/lib/source-score';
import type { SourceSnippet } from '@/types/document';

interface SourceCardProps {
  source: SourceSnippet;
  index: number;
  copyId: string;
  copiedTextId: string | null;
  onCopyText: (copyId: string, text: string) => void;
}

export const SourceCard = ({
  source,
  index,
  copyId,
  copiedTextId,
  onCopyText,
}: SourceCardProps) => {
  const sourceLabel = `Source ${index + 1} - Chunk ${source.chunkIndex}`;

  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {sourceLabel} -{' '}
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
          aria-label={`Copy ${sourceLabel}`}
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
};
