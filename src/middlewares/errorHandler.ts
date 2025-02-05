import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Logging error: ', err.message);
  logger.error({
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
  });
  res.status(500).json({ error: err.message ?? 'Internal Server Error' });
};

export default errorHandler;