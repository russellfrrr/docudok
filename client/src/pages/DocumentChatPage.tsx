import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { askDocument, getDocumentById } from '@/services/document.service';
import type { AskDocumentResponse } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DocumentChatPage = () => {
  const { documentId } = useParams();
  const [question, setQuestion] = useState('');
  const [lastAnswer, setLastAnswer] = useState<AskDocumentResponse | null>(null);

  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId || ''),
    enabled: Boolean(documentId),
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      if (!documentId) {
        throw new Error('Document ID is missing');
      }

      if (!question.trim()) {
        throw new Error('Question is required');
      }

      return askDocument(documentId, question.trim());
    },
    onSuccess: (data) => {
      setLastAnswer(data);
      setQuestion('');
    },
  })

  if (!documentId) {
    return <Navigate to="/" />;
  }

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground">
              {documentQuery.data?.document.title || 'Document'}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">
              {documentQuery.data?.document.status || 'loading'}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        {documentQuery.isLoading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading document...
            </CardContent>
          </Card>
        )}

        {documentQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load document.</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ask this document</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="flex gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                askMutation.mutate();
              }}
            >
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about this PDF"
              />

              <Button type="submit" disabled={askMutation.isPending}>
                {askMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Ask
              </Button>
            </form>

            {askMutation.isError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  {askMutation.error instanceof Error
                    ? askMutation.error.message
                    : 'Ask failed'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {lastAnswer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Answer</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {lastAnswer.answer}
              </p>

              <div>
                <h2 className="mb-2 text-sm font-medium text-foreground">
                  Sources
                </h2>

                <div className="grid gap-3">
                  {lastAnswer.sources.map((source) => (
                    <div
                      key={`${source.chunkIndex}-${source.score}`}
                      className="rounded-md border bg-background p-3"
                    >
                      <div className="mb-2 text-xs text-muted-foreground">
                        Chunk {source.chunkIndex} - Score{source.score.toFixed(3)}
                        {source.score.toFixed(3)}
                      </div>
                      <p className="line-clamp-4 text-sm text-muted-foreground">
                        {source.chunkText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}