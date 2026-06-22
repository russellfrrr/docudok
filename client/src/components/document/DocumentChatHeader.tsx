import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/layout/AppLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { getDocumentStatusSummary } from '@/lib/document';
import type { Document } from '@/types/document';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface DocumentChatHeaderProps {
  document: Document | undefined;
}

export const DocumentChatHeader = ({ document }: DocumentChatHeaderProps) => {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <AppLogo />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="truncate">
                {document?.fileName || 'Loading document...'}
              </span>
            </div>
            <h1 className="truncate text-2xl font-semibold text-foreground">
              {document?.title || 'Document'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {document
                ? getDocumentStatusSummary(document)
                : 'Loading document details'}
            </p>
          </div>

          <DocumentStatusBadge status={document?.status || 'loading'} />
        </div>
      </div>
    </header>
  );
};
