import User from '../models/userModel';
import { Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from '../config/definitions';
import { TokenBindingService } from '../utils/tokenBindingService';
import { redisTokenManager } from '../utils/redisTokenManager';

export const protect = async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Not authorized to access this route' });
      return;
    }

    // Check if token is blacklisted (legacy support)
    const isBlacklisted = await redisTokenManager.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    // Validate bound token with client fingerprint
    const validation = await TokenBindingService.validateBoundToken(token, req);
    if (!validation.isValid) {
      res.status(401).json({ 
        error: 'Token validation failed',
        reason: validation.reason 
      });
      return;
    }

    // Get user from validated token
    const user = await User.findById(validation.payload!.id).select('-password'); 
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}