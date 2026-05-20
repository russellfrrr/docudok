import type { DocumentStatus } from '@/types/document';
import { cn } from '@/lib/utils';

interface DocumentStatusBadgeProps {
  status: DocumentStatus | 'loading';
  className?: string;
}

const statusClassNames: Record<DocumentStatus | 'loading', string> = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  processing: 'border-amber-200 bg-amber-50 text-amber-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
  loading: 'border-muted bg-muted text-muted-foreground',
};

export const DocumentStatusBadge = ({
  status,
  className,
}: DocumentStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'w-fit rounded-md border px-2 py-1 text-xs capitalize',
        statusClassNames[status],
        className
      )}
    >
      {status}
    </span>
  );
};
