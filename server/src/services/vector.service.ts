import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

const collectionName = process.env.QDRANT_COLLECTION || 'document_chunks';

const createPayloadIndexIfNeeded = async (fieldName: string) => {
  try {
    await qdrant.createPayloadIndex(collectionName, {
      field_name: fieldName,
      field_schema: 'keyword',
      wait: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';

    if (!message.toLowerCase().includes('already exists')) {
      console.warn(`Could not create Qdrant payload index for ${fieldName}`, err);
    }
  }
};

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

  await createPayloadIndexIfNeeded('userId');
  await createPayloadIndexIfNeeded('documentId');
};

interface SaveVectorInput {
  id: string;
  vector: number[];
  userId: string;
  documentId: string;
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
};

export interface SearchResult {
  chunkText: string;
  chunkIndex: number;
  score: number; // raw vector score from qdrant
  keywordScore?: number;
  finalScore?: number;
  relevanceScore?: number;
  rerankScore?: number;
}

export const searchDocumentChunks = async (
  vector: number[],
  userId: string,
  documentId: string,
  limit = 5
): Promise<SearchResult[]> => {
  await ensureVectorCollection();

  const results = await qdrant.search(collectionName, {
    vector,
    limit,
    filter: {
      must: [
        {
          key: 'userId',
          match: {
            value: userId,
          },
        },
        {
          key: 'documentId',
          match: {
            value: documentId,
          },
        },
      ],
    },
    with_payload: true,
  });

  return results.map((result) => {
    const payload = result.payload || {};

    return {
      chunkText: String(payload.chunkText || ''),
      chunkIndex: Number(payload.chunkIndex || 0),
      score: result.score,
    };
  });
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

export const deleteDocumentVectors = async (
  userId: string,
  documentId: string
) => {
  await ensureVectorCollection();

  await qdrant.delete(collectionName, {
    wait: true,
    filter: {
      must: [
        {
          key: 'userId',
          match: {
            value: userId,
          },
        },
        {
          key: 'documentId',
          match: {
            value: documentId,
          },
        },
      ],
    },
  });
};
