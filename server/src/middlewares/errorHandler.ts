import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
};

const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  if (!err) return _next();
  const statusCode = err.statusCode ?? 500;
  logger.error({
    message: err.message,
    statusCode,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
  });
  res.status(statusCode).json({ error: err.message ?? 'Internal Server Error' });
};

export { AppError, errorHandler };