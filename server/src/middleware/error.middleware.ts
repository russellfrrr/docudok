import { ErrorRequestHandler } from 'express';
import multer from 'multer';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'PDF file must be 10MB or smaller'
          : err.message,
    });
  }

  if (err instanceof Error && err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }

  const requestId = res.locals.requestId;

  console.error('Unhandled API error', {
    requestId,
    error: err,
  });

  return res.status(500).json({
    message: 'Internal server error',
    requestId,
  });
};
