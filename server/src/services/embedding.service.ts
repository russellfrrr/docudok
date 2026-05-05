import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const createEmbedding = async (text: string): Promise<number[]> => {
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  const response = await openai.embeddings.create({
    model,
    input: text, 
    encoding_format: 'float',
  });

  return response.data[0].embedding;
}