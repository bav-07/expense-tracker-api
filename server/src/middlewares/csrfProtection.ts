import { Request, Response, NextFunction, CookieOptions } from 'express';
import crypto from 'crypto';
import { Buffer } from 'buffer';

interface CSRFRequest extends Request {
  csrfToken?: string;
  session?: {
    csrfSecret?: string;
  };
}

/**
 * Modern CSRF protection middleware
 * Uses double submit cookie pattern and SameSite cookies
 */
class CSRFProtection {
  private readonly tokenName: string = 'X-CSRF-Token';
  private readonly cookieName: string = 'csrf-token';
  private readonly secretLength: number = 32;

  /**
   * Generate CSRF token
   */
  generateToken(secret?: string): { token: string; secret: string } {
    const tokenSecret = secret || crypto.randomBytes(this.secretLength).toString('hex');
    const token = crypto.createHmac('sha256', tokenSecret)
      .update(`csrf-${Date.now()}`)
      .digest('hex');
    
    return { token, secret: tokenSecret };
  }

  /**
   * Verify CSRF token
   */
  verifyToken(token: string, secret: string): boolean {
    if (!token || !secret) return false;
    
    try {
      // Extract timestamp from token (basic replay protection)
      const expectedHash = crypto.createHmac('sha256', secret)
        .update(`csrf-${Date.now()}`)
        .digest('hex');
      
      // Use crypto.timingSafeEqual for timing attack protection
      const tokenBuffer = Buffer.from(token, 'hex');
      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      
      if (tokenBuffer.length !== expectedBuffer.length) {
        return false;
      }
      
      // For CSRF, we're more lenient with timing as tokens are shorter-lived
      return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
    } catch (error) {
      return false;
    }
  }

  /**
   * CSRF protection middleware
   */
  protect = (req: CSRFRequest, res: Response, next: NextFunction): void => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for API endpoints using Bearer tokens (already protected)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // For cookie-based authentication, enforce CSRF protection
    const token = req.headers[this.tokenName.toLowerCase()] as string || 
                  req.body._csrf || 
                  req.query._csrf;
    
    const secret = req.cookies[this.cookieName];

    if (!this.verifyToken(token, secret)) {
      res.status(403).json({ 
        error: 'Invalid CSRF token',
        code: 'CSRF_INVALID'
      });
      return;
    }

    next();
  };

  /**
   * Middleware to provide CSRF token to client
   */
  provideToken = (req: CSRFRequest, res: Response, next: NextFunction): void => {
    let secret = req.cookies[this.cookieName];
    
    if (!secret) {
      const { token, secret: newSecret } = this.generateToken();
      secret = newSecret;
      
      // Set CSRF cookie with secure options
      res.cookie(this.cookieName, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
      
      req.csrfToken = token;
    } else {
      const { token } = this.generateToken(secret);
      req.csrfToken = token;
    }

    next();
  };

  /**
   * Get CSRF token for client
   */
  getToken(req: CSRFRequest): string | undefined {
    return req.csrfToken;
  }
}

/**
 * Enhanced cookie security middleware
 */
export const secureCookies = (req: Request, res: Response, next: NextFunction): void => {
  // Override res.cookie to enforce security defaults
  const originalCookie = res.cookie.bind(res);
  
  res.cookie = function(name: string, value: string | object, options: CookieOptions = {}) {
    const secureOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      ...options
    };
    
    return originalCookie(name, value, secureOptions);
  };

  next();
};

// Create singleton instance
export const csrfProtection = new CSRFProtection();

// Export middleware functions
export const csrfProtect = csrfProtection.protect;
export const csrfToken = csrfProtection.provideToken;