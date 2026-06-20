import { formatNumber } from '@/lib/format';
import type { DocumentChunksResponse } from '@/types/document';

interface DocumentChunkStatsProps {
  stats: DocumentChunksResponse['stats'];
}

export const DocumentChunkStats = ({ stats }: DocumentChunkStatsProps) => {
  const statItems = [
    {
      label: 'Total chunks',
      value: stats.totalChunks,
    },
    {
      label: 'Total characters',
      value: stats.totalCharacters,
    },
    {
      label: 'Total words',
      value: stats.totalWords,
    },
    {
      label: 'Avg. characters',
      value: stats.averageChunkLength,
    },
    {
      label: 'Avg. words',
      value: stats.averageChunkWords,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => (
        <div key={item.label} className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="text-lg font-semibold text-foreground">
            {formatNumber(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
};
