import { Check, Copy, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatSourceScore, getSourceScoreLabel } from '@/lib/source-score';
import type { SourceSnippet } from '@/types/document';

interface RetrievalTesterProps {
  question: string;
  sources: SourceSnippet[] | undefined;
  isPending: boolean;
  isError: boolean;
  errorMessage: string | null;
  documentIsReady: boolean;
  copiedTextId: string | null;
  onQuestionChange: (question: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onCopyText: (copyId: string, text: string) => void;
}

export const RetrievalTester = ({
  question,
  sources,
  isPending,
  isError,
  errorMessage,
  documentIsReady,
  copiedTextId,
  onQuestionChange,
  onSubmit,
  onClear,
  onCopyText,
}: RetrievalTesterProps) => {
  return (
    <>
      <form
        className="rounded-md border bg-background p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Test retrieval
          </h3>
          <p className="text-xs text-muted-foreground">
            Ask a question to see which source chunks the backend picks.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="Example: What is this document about?"
            disabled={isPending || !documentIsReady}
          />
          <Button
            type="submit"
            className="sm:w-fit"
            disabled={isPending || !documentIsReady || !question.trim()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Test
          </Button>
          {(question || sources) && (
            <Button
              type="button"
              variant="outline"
              className="sm:w-fit"
              onClick={onClear}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage || 'Search failed'}</AlertDescription>
        </Alert>
      )}

      {sources && (
        <div className="space-y-2 rounded-md border bg-background p-4">
          <div className="text-sm font-medium text-foreground">
            Retrieved sources
          </div>

          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sources matched this question. Try rephrasing it or checking
              whether the document chunks contain the answer.
            </p>
          ) : (
            sources.map((source, index) => {
              const copyId = `retrieval-source-${source.chunkIndex}-${index}`;

              return (
                <div
                  key={`${source.chunkIndex}-${source.score}`}
                  className="rounded-md border bg-muted/50 p-3"
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
                  <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {source.chunkText}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
};
