import OpenAI from 'openai';
import { SearchResult } from './vector.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const generateAnswer = async (
  question: string,
  sources: SearchResult[]
): Promise<string> => {
  const model = process.env.CHAT_MODEL || 'gpt-4o-mini';

  const context = sources
    .map((source, index) => {
      return `Source ${index + 1}:\n${source.chunkText}`;
    })
    .join('\n\n');

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a document question-answering assistant. Answer using only the provided document context. If the answer is not in the context, say that the document does not contain enough information. If the user asks in Filipino/Tagalog, answer in Filipino/Tagalog. If the user asks in English, answer in English. Do not invent information.',
        },
        {
          role: 'user',
          content: `Document context: \n\n${context}\n\nQuestion\n${question}`,
        },
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content || '';
}