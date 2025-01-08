import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from '../config/definitions';

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

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const user = await User.findById(decoded.id).select('-password'); 
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    req.user = user;
    console.log('Middleware req.user:', req.user);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}