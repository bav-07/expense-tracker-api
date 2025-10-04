import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce HTTPS in production
 */
export const httpsEnforcement = (req: Request, res: Response, next: NextFunction): void => {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is not secure
    if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
      // Redirect to HTTPS
      const httpsUrl = `https://${req.get('Host')}${req.url}`;
      res.redirect(301, httpsUrl);
      return;
    }
  }
  next();
};

/**
 * Additional security headers middleware
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};