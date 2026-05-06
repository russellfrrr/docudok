import { FileText, LogOut, RefreshCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
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

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auth flex max-w-5xl items-center justify-between px-4 py-4">
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
                Upload your first PDF text and it will show up here.
              </p>
            </CardContent>
          </Card>
        )}

        {documentsQuery.data && documentsQuery.data.documents.length > 0 && (
          <div className="grid gap-3">
            {documentsQuery.data.documents.map((document) => (
              <Card key={document._id}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {document.title}
                    </CardTitle>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {document.fileName}
                    </p>
                  </div>

                  <span className="rounded-md border px-2 py-1 text-xs capitalize text-muted-foreground">
                    {document.status}
                  </span>
                </CardHeader>

                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{document.totalChunks} chunks</span>
                  <span>
                    {new Date(document.createdAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main> 
  );
};