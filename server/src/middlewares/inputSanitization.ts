import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Input sanitization middleware
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize MongoDB queries
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  
  // Basic XSS protection - remove potentially dangerous HTML/JS
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  
  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous patterns
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
          .replace(/on\w+='[^']*'/gi, '') // Remove event handlers
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
          .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
          .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
}

/**
 * Validate and sanitize specific field types
 */
export const validateFieldTypes = (req: Request, res: Response, next: NextFunction): void => {
  // Validate email format
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
  }
  
  // Validate numeric fields
  if (req.body.amount !== undefined) {
    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount < 0 || amount > 999999999) {
      res.status(400).json({ error: 'Invalid amount value' });
      return;
    }
    req.body.amount = amount;
  }
  
  // Validate date fields
  if (req.body.date) {
    const date = new Date(req.body.date);
    if (isNaN(date.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }
  }
  
  next();
};

/**
 * Rate limiting for specific operations
 */
export const operationRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number, resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }
    
    const clientRequests = requests.get(clientId);
    
    if (!clientRequests) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (clientRequests.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests for this operation' });
      return;
    }
    
    clientRequests.count++;
    next();
  };
};