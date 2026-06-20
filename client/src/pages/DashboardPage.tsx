import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LogOut,
  Loader2,
  RefreshCcw,
  Upload,
  X,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  uploadDocument,
  deleteDocument,
  retryDocumentProcessing,
} from '@/services/document.service';
import { useAuthStore } from '@/store/auth.store';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppLogo } from '@/components/layout/AppLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { DocumentListItem } from '@/components/document/DocumentListItem';
import { formatFileSize } from '@/lib/format';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const documentsQuery = useDocuments();
  const documentsAreRefreshing =
    documentsQuery.isFetching && !documentsQuery.isLoading;

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Please choose a PDF file');
      }

      if (fileError) {
        throw new Error(fileError);
      }

      return uploadDocument(selectedFile, title);
    },
    onSuccess: () => {
      setTitle('');
      clearSelectedFile();

      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryDocumentProcessing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleRetryDocument = (documentId: string) => {
    retryMutation.mutate(documentId);
  };

  const handleDeleteDocument = (documentId: string) => {
    const confirmed = window.confirm(
      `Delete this document? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(documentId);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setFileError('');
      return;
    }

    if (file.type !== 'application/pdf') {
      setSelectedFile(null);
      setFileError('Only PDF files are allowed');
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setSelectedFile(null);
      setFileError('PDF file must be 10MB or smaller');
      return;
    }

    setFileError('');
    setSelectedFile(file);
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <AppLogo />

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
            )}

            <ThemeToggle />

            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Your uploaded PDFs will appear here.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => documentsQuery.refetch()}
            disabled={documentsQuery.isFetching}
          >
            {documentsAreRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {documentsAreRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <Card className="mb-6 border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Upload PDF</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                uploadMutation.mutate();
              }}
            >
              <Input
                placeholder="Document title optional"
                aria-label="Document title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <div className="rounded-lg border border-dashed bg-background p-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {selectedFile ? selectedFile.name : 'Choose a PDF document'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile
                          ? `Ready to upload - ${formatFileSize(selectedFile.size)}`
                          : 'PDF files only, up to 10MB'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Choose PDF file"
                    >
                      Choose file
                    </Button>

                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clearSelectedFile}
                        aria-label="Clear selected file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-fit"
                disabled={!selectedFile || Boolean(fileError) || uploadMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload document'}
              </Button>
            </form>

            {fileError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            {uploadMutation.isSuccess && (
              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Document uploaded. It may take a moment to finish processing.
                </AlertDescription>
              </Alert>
            )}

            {uploadMutation.isError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadMutation.error instanceof Error
                    ? uploadMutation.error.message
                    : 'Upload failed'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {documentsQuery.isLoading && (
          <Card className="border bg-card shadow-sm">
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading documents...
            </CardContent>
          </Card>
        )}

        {documentsQuery.isError && (
          <Card>
            <CardContent className="py-6 text-sm text-destructive">
              Failed to load documents.
            </CardContent>
          </Card>
        )}

        {documentsQuery.data?.documents.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-1 text-center">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="text-base font-medium text-foreground">
                No documents yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Upload your first PDF and it will show up here.
              </p>
            </CardContent>
          </Card>
        )}

        {documentsQuery.data && documentsQuery.data.documents.length > 0 && (
          <div className="grid gap-3">
            {documentsQuery.data.documents.map((document) => {
              const isRetryingDocument =
                retryMutation.isPending &&
                retryMutation.variables === document._id;
              const isDeletingDocument =
                deleteMutation.isPending &&
                deleteMutation.variables === document._id;

              return (
                <DocumentListItem
                  key={document._id}
                  document={document}
                  isRetrying={isRetryingDocument}
                  isDeleting={isDeletingDocument}
                  onRetry={handleRetryDocument}
                  onDelete={handleDeleteDocument}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
