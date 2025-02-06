import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import logger from '../utils/logger';

const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);

      logger.error({
        message: 'Validation error',
        statusCode: 400,
        errors: errorMessages,
        route: req.originalUrl,
        method: req.method,
      })

      res.status(400).json({ error: errorMessages });
      return;
    }
    next();
  };
};

export default validate;