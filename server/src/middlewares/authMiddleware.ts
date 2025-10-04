import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from '../config/definitions';
import JWTSecurityManager from '../utils/jwtSecurity';
import { redisTokenManager } from '../utils/redisTokenManager';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const protect = async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Not authorized to access this route' });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisTokenManager.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    // Verify the token
    const jwtConfig = JWTSecurityManager.getJWTConfig();
    const decoded = jwt.verify(token, jwtConfig.secret) as DecodedToken;
    const user = await User.findById(decoded.id).select('-password'); 
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