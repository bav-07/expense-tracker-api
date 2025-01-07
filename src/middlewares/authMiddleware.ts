import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { Request, Response, NextFunction } from 'express';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Not authorized to access this route' });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    req.user = await User.findById(decoded.id).select('-password'); 
    if (!req.user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}