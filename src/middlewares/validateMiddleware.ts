import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({ error: error.details.map(detail => detail.message) });
      return;
    }
    next();
  };
};

export default validate;