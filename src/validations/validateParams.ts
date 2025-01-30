import { Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from "../config/definitions";
import mongoose from 'mongoose';

export const validateObjectId = (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): void => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid ID format" });
    return;
  }
  next();
}