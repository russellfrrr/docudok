import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { countWords } from '@/lib/text-stats';
import type { DocumentChunk } from '@/types/document';

interface DocumentChunkListProps {
  chunks: DocumentChunk[];
  copiedTextId: string | null;
  onCopyText: (copyId: string, text: string) => void;
}

export const DocumentChunkList = ({
  chunks,
  copiedTextId,
  onCopyText,
}: DocumentChunkListProps) => {
  return (
    <>
      {chunks.map((chunk) => (
        <div key={chunk._id} className="rounded-md border bg-background p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                Chunk {chunk.chunkIndex}
              </span>
              <span>{chunk.chunkText.length} characters</span>
              <span>{countWords(chunk.chunkText)} words</span>
              <span>Saved {formatDate(chunk.createdAt)}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onCopyText(chunk._id, chunk.chunkText)}
            >
              {copiedTextId === chunk._id ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedTextId === chunk._id ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-foreground">
            {chunk.chunkText}
          </p>
        </div>
      ))}
    </>
  );
};
