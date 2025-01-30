import Joi from "joi";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import { Response, NextFunction } from "express";

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      res.status(400).json({ error: error.details.map(detail => detail.message) });
      return;
    }
    next();
  }
}