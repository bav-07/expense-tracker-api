import { Request, Response, NextFunction } from "express";
import logger from "./logger";
import { IGetUserAuthInfoRequest } from "../config/definitions";

/**
 * Wraps an async function so that any errors are 
 * caught and passed to the next middleware
 */
const catchAsync = (fn: (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

export default catchAsync;