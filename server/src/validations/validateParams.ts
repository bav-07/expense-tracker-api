import { Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from "../config/definitions";
import mongoose from 'mongoose';
import logger from '../utils/logger';

export const validateObjectId = (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): void => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.error({
      message: 'Validation error',
      statusCode: 400,
      error: 'Invalid ID format',
      route: req.originalUrl,
      method: req.method,
    })
    res.status(400).json({ error: "Invalid ID format" });
    return;
  }
  next();
}