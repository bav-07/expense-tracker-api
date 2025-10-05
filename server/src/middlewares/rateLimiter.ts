import rateLimit from "express-rate-limit";
import logger from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: ((req) => {
    return (
      req.path.startsWith('/api/users/login') || req.path.startsWith('/api/users/register')
    )
  }),
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const forwardedFor = req.get('X-Forwarded-For') || 'none';
    
    logger.warn('Rate limit exceeded - General', {
      ip: clientIP,
      userAgent,
      forwardedFor,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      rateLimitType: 'general',
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    });

    res.status(429).json({ 
      error: "Too many requests from this IP, please try again later",
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    });
  }
});

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { error: "Too many login attempts. Try again later" },
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const email = req.body?.email || 'unknown';
    const forwardedFor = req.get('X-Forwarded-For') || 'none';
    
    logger.warn('Rate limit exceeded - Login', {
      ip: clientIP,
      userAgent,
      forwardedFor,
      email,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      rateLimitType: 'login',
      windowMs: 5 * 60 * 1000,
      maxRequests: 5,
      severity: 'HIGH' // Login attempts are more critical
    });

    res.status(429).json({ 
      error: "Too many login attempts. Try again later",
      retryAfter: Math.ceil(5 * 60) // 5 minutes in seconds
    });
  }
});

export const registerRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { error: "Too many register attempts. Try again later" },
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const email = req.body?.email || 'unknown';
    const forwardedFor = req.get('X-Forwarded-For') || 'none';
    
    logger.warn('Rate limit exceeded - Register', {
      ip: clientIP,
      userAgent,
      forwardedFor,
      email,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      rateLimitType: 'register',
      windowMs: 5 * 60 * 1000,
      maxRequests: 5,
      severity: 'HIGH'
    });

    res.status(429).json({ 
      error: "Too many register attempts. Try again later",
      retryAfter: Math.ceil(5 * 60) // 5 minutes in seconds
    });
  }
});