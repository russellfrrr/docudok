import { openai } from './openai-client.service';

export const createEmbedding = async (text: string): Promise<number[]> => {
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  const response = await openai.embeddings.create({
    model,
    input: text,
    encoding_format: 'float',
  });

  return response.data[0].embedding;
};
