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
      return [
        `Source ${index + 1}`,
        `Chunk: ${source.chunkIndex}`,
        `Similarity score: ${source.score.toFixed(3)}`,
        `Text:\n${source.chunkText}`,
      ].join('\n');
    })
    .join('\n\n');

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a document question-answering assistant. Answer using only the provided document context. You may make reasonable assessments or summaries if they are clearly supported by the context. Do not invent facts, credentials, dates, employers, or skills that are not in the context. If the context does not contain enough information to answer, say that clearly. If the user asks for an opinion or evaluation, give a cautious answer based only on the evidence in the document. If the user asks in Filipino/Tagalog, answer in Filipino/Tagalog. If the user asks in English, answer in English.',
        },
        {
          role: 'user',
          content: `Document context:\n\n${context}\n\nQuestion:\n${question}`,
        },
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content || '';
}
