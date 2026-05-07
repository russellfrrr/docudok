import { FileText, LogOut, RefreshCcw, AlertCircle, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { uploadDocument } from '@/services/document.service';
import { useAuthStore } from '@/store/auth.store';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Please choose a PDF file');
      }

      return uploadDocument(selectedFile, title);
    },
    onSuccess: () => {
      setTitle('');
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

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
  }

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">DocuDok</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your uploaded documents.
            </p>
          </div>

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
            <h2 className="text-lg font-semibold text-foreground">
              Documents
            </h2>
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Upload PDF</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
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

              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />

              <Button type="submit" disabled={!selectedFile || uploadMutation.isPending}>
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </form>

            {selectedFile && (
              <p className="mt-3 text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
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
          <Card>
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
            {documentsQuery.data.documents.map((document) => (
              <Card key={document._id} className="transition hover:bg-accent">
                <Link to={`/documents/${document._id}`} className="block">
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
                    <span>{document.totalChunks} chunks</span>
                    <span>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};