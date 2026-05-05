import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

const collectionName = process.env.QDRANT_COLLECTION || 'document_chunks';

export const ensureVectorCollection = async () => {
  try {
    await qdrant.getCollection(collectionName);
  } catch (err) {
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: Number(process.env.EMBEDDING_DIMENSIONS || 1536),
        distance: 'Cosine',
      },
    });
  }
}

interface SaveVectorInput {
  id: string;
  vector: number[];
  userId: string;
  documentId: string;
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
}

export const saveChunkVectors = async (items: SaveVectorInput[]) => {
  await ensureVectorCollection();

  await qdrant.upsert(collectionName, {
    wait: true,
    points: items.map((item) => ({
      id: item.id,
      vector: item.vector,
      payload: {
        userId: item.userId,
        documentId: item.documentId,
        chunkId: item.chunkId,
        chunkText: item.chunkText,
        chunkIndex: item.chunkIndex,
      },
    })),
  });
}