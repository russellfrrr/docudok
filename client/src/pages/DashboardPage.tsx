import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LogOut,
  RefreshCcw,
  Trash2,
  Upload,
  X,
  RotateCcw,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const documentsQuery = useDocuments();

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Please choose a PDF file');
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
      return;
    }

    setSelectedFile(file);
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  const getStatusClassName = (status: string) => {
    if (status === 'ready') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'failed') {
      return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700';
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
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
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
                        {selectedFile ? 'Ready to upload' : 'PDF files only'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose file
                    </Button>

                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clearSelectedFile}
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
                disabled={!selectedFile || uploadMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload document'}
              </Button>
            </form>

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
              const isReady = document.status === 'ready';

              const documentContent = (
                <>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {document.title}
                      </CardTitle>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {document.fileName}
                      </p>
                    </div>

                    <span
                      className={`rounded-md border px-2 py-1 text-xs capitalize ${getStatusClassName(document.status)}`}
                    >
                      {document.status}
                    </span>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {isReady
                        ? `${document.totalChunks} chunks`
                        : document.status === 'processing'
                          ? 'Processing document'
                          : 'Upload failed'}
                    </span>
                    <span>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </>
              );

              return (
                <Card
                  key={document._id}
                  className="flex border bg-card shadow-sm transition hover:bg-accent"
                >
                  {isReady ? (
                    <Link
                      to={`/documents/${document._id}`}
                      className="block min-w-0 flex-1"
                    >
                      {documentContent}
                    </Link>
                  ) : (
                    <div className="block min-w-0 flex-1">
                      {documentContent}
                    </div>
                  )}

                  <div className="mr-3 mt-3 flex gap-1">
                    {document.status === 'failed' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleRetryDocument(document._id)}
                        disabled={retryMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteDocument(document._id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
