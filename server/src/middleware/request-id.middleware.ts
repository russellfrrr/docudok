import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};
