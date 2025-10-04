import { Router } from 'express';
import { Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

/**
 * CSP violation reporting endpoint
 */
router.post('/csp-report', (req: Request, res: Response) => {
  const report = req.body;
  
  // Log CSP violations for security monitoring
  logger.warn('CSP Violation Report', {
    cspReport: report,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // In production, you might want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to security monitoring service
    // securityMonitoring.reportCSPViolation(report);
  }
  
  res.status(204).end();
});

export default router;