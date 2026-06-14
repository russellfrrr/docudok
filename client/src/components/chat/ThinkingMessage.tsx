export const ThinkingMessage = () => {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="max-w-[88%] rounded-lg border bg-background p-4 text-foreground">
        <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          assistant
        </div>
        <div
          className="flex h-6 items-center gap-1"
          role="status"
          aria-label="Assistant is responding"
        >
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
};
