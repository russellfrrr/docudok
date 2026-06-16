import { openai } from './openai-client.service';
import { SearchResult } from './vector.service';

interface RerankedSource extends SearchResult {
  rerankScore?: number;
}

const extractJsonArrayText = (text: string): string => {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  return arrayMatch ? arrayMatch[0] : text;
};

const parseRerankIndexes = (text: string): number[] => {
  try {
    const parsed = JSON.parse(extractJsonArrayText(text));

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0);
  } catch {
    return [];
  }
};

export const rerankSources = async (
  question: string,
  sources: SearchResult[],
  limit: number
): Promise<RerankedSource[]> => {
  if (sources.length <= limit) {
    return sources;
  }

  const context = sources
    .map((source, index) => {
      return [
        `Index: ${index}`,
        `Chunk: ${source.chunkIndex}`,
        `Text: ${source.chunkText}`,
      ].join('\n');
    })
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'You rerank document chunks for question answering. Return only a JSON array of source indexes, ordered from most useful to least useful. Do not explain.',
      },
      {
        role: 'user',
        content: [
          `Question: ${question}`,
          '',
          `Chunks:`,
          context,
          '',
          `Return the best ${limit} indexes as JSON, like [2,0,4].`,
        ].join('\n'),
      },
    ],
  });

  const text = response.choices[0].message.content || '[]';
  const indexes = parseRerankIndexes(text);
  const seen = new Set<number>();

  const reranked = indexes
    .filter((index) => {
      if (seen.has(index)) {
        return false;
      }

      seen.add(index);
      return index < sources.length;
    })
    .map((index, position) => {
      return {
        ...sources[index],
        rerankScore: Number((1 - position / Math.max(limit, 1)).toFixed(3)),
      };
    });

  const missingSources = sources.filter((_, index) => {
    return !seen.has(index);
  });

  return [...reranked, ...missingSources].slice(0, limit);
};

