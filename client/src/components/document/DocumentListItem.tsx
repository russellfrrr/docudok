import { Link } from 'react-router-dom';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import {
  getDocumentFailureMessage,
  getDocumentStatusSummary,
} from '@/lib/document';
import { formatDate } from '@/lib/format';
import type { Document } from '@/types/document';

interface DocumentListItemProps {
  document: Document;
  isRetrying: boolean;
  isDeleting: boolean;
  onRetry: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

export const DocumentListItem = ({
  document,
  isRetrying,
  isDeleting,
  onRetry,
  onDelete,
}: DocumentListItemProps) => {
  const isReady = document.status === 'ready';

  const documentContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{document.title}</CardTitle>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {document.fileName}
          </p>
        </div>

        <DocumentStatusBadge status={document.status} />
      </CardHeader>

      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="min-w-0">
          <p>{getDocumentStatusSummary(document)}</p>
          {document.status === 'failed' && document.processingError && (
            <p className="mt-1 truncate text-xs text-destructive">
              {getDocumentFailureMessage(document)}
            </p>
          )}
        </div>
        <span>{formatDate(document.createdAt)}</span>
      </CardContent>
    </>
  );

  return (
    <Card className="flex border bg-card shadow-sm transition hover:bg-accent">
      {isReady ? (
        <Link to={`/documents/${document._id}`} className="block min-w-0 flex-1">
          {documentContent}
        </Link>
      ) : (
        <div className="block min-w-0 flex-1">{documentContent}</div>
      )}

      <div className="mr-3 mt-3 flex gap-1">
        {document.status === 'failed' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onRetry(document._id)}
            disabled={isRetrying || isDeleting}
            aria-label={`Retry processing ${document.title}`}
          >
            <RotateCcw
              className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
            />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(document._id)}
          disabled={isDeleting || isRetrying}
          aria-label={`Delete ${document.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
