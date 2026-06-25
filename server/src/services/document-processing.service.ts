import { v4 as uuidv4 } from 'uuid';
import DocumentModel from '../models/Document';
import DocumentChunkModel from '../models/DocumentChunk';
import { extractTextFromPdf } from './pdf.service';
import { createEmbedding } from './ai/embedding.service';
import { deleteDocumentVectors, saveChunkVectors } from './vector.service';
import { cleanText, splitTextIntoChunks } from '../utils/text';
import { getErrorMessage } from '../utils/error';

interface ProcessDocumentInput {
  documentId: string;
  userId: string;
  filePath: string;
}

export const processDocument = async ({
  documentId,
  userId,
  filePath,
}: ProcessDocumentInput) => {
  try {
    const document = await DocumentModel.findOne({
      _id: documentId,
      userId,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    await DocumentChunkModel.deleteMany({
      documentId,
      userId,
    });

    await deleteDocumentVectors(userId, documentId);

    const rawText = await extractTextFromPdf(filePath);
    const cleanedText = cleanText(rawText);

    if (!cleanedText) {
      throw new Error('No readable text found in PDF');
    }

    const chunks = await splitTextIntoChunks(cleanedText);

    if (chunks.length === 0) {
      throw new Error('No usable chunks created from PDF');
    }

    const chunkDocuments = chunks.map((chunkText, index) => {
      return {
        userId,
        documentId: document._id,
        chunkText,
        chunkIndex: index,
      };
    });

    const savedChunks = await DocumentChunkModel.insertMany(chunkDocuments);
    const vectorItems = [];

    for (const chunk of savedChunks) {
      const vector = await createEmbedding(chunk.chunkText);

      vectorItems.push({
        id: uuidv4(),
        vector,
        userId,
        documentId: document._id.toString(),
        chunkId: chunk._id.toString(),
        chunkText: chunk.chunkText,
        chunkIndex: chunk.chunkIndex,
      });
    }

    await saveChunkVectors(vectorItems);

    document.status = 'ready';
    document.processingError = '';
    document.totalChunks = chunks.length;
    await document.save();

    return document;
  } catch (err) {
    console.error('Process document failed', err);

    const message = getErrorMessage(err, 'Document processing failed');

    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'failed',
      processingError: message,
    });

    await DocumentChunkModel.deleteMany({
      documentId,
      userId,
    });

    await deleteDocumentVectors(userId, documentId);

    throw err;
  }
};
