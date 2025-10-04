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
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

/**
 * Configure strict Content Security Policy
 */
export const getCSPConfig = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(',') || ['http://localhost:3000'];
  
  // Build script-src based on environment
  const scriptSrc = ["'self'"];
  
  if (process.env.NODE_ENV === 'production') {
    // Production: No unsafe-inline, only allow self and specific trusted sources
    // For any inline scripts in production, they should be moved to external files
    // or use nonces/hashes on a per-request basis
  } else {
    // Development: Allow unsafe-inline for hot reload and development tools
    scriptSrc.push("'unsafe-inline'");
  }

  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc,
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // CSS requires this for many frameworks
        'https://fonts.googleapis.com'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      connectSrc: [
        "'self'",
        ...allowedOrigins,
        ...(process.env.NODE_ENV === 'development' ? ['ws:', 'wss:'] : [])
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
    reportOnly: process.env.NODE_ENV === 'development',
    // Enable CSP violation reporting
    reportUri: '/api/csp-report'
  };
};