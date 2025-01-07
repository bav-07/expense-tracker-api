import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response): void => {
  res.status(200).json({ status: 'OK', message: 'API is healthy'});
};