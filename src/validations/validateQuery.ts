import Joi from "joi";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import { Response, NextFunction } from "express";
import logger from "../utils/logger";

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);

      logger.error({
        message: 'Validation error',
        statusCode: 400,
        errors: errorMessages,
        route: req.originalUrl,
        method: req.method,
      })

      res.status(400).json({ error: error.details.map(detail => detail.message) });
      return;
    }
    next();
  }
}