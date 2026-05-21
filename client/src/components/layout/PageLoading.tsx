import { Loader2 } from 'lucide-react';

export const PageLoading = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading...
    </main>
  );
};
