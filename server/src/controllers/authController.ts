import { Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import dotenv from 'dotenv';
import { IGetUserAuthInfoRequest } from '../config/definitions';
import { AppError } from '../middlewares/errorHandler';
import catchAsync from '../utils/catchAsync';
import JWTSecurityManager from '../utils/jwtSecurity';
import { redisTokenManager } from '../utils/redisTokenManager';
import crypto from 'crypto';

dotenv.config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: "strict" as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}

const generateToken = (userId: string): string => {
  const jwtConfig = JWTSecurityManager.getJWTConfig();
  return jwt.sign({ id: userId }, jwtConfig.secret, { expiresIn: '1h' });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('All fields are required', 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  const user = new User({ name, email, password });
  await user.save();

  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token (expires in 7 days)
  const refreshExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  await redisTokenManager.storeRefreshToken(refreshToken, user.id, refreshExpiry);
  
  res.cookie('token', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, { 
    ...cookieOptions, 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days 
  });
  
  res.status(201).json({ 
    token, 
    refreshToken,
    user: { id: user.id, name, email } 
  });
});

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('All fields are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if account is locked
  if (user.isLocked) {
    // Just increment to refresh the lockout timer if needed
    await user.incLoginAttempts();
    throw new AppError('Account temporarily locked due to too many failed login attempts. Please try again later.', 423);
  }

  // Check password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    // Increment failed attempts and potentially lock account
    await user.incLoginAttempts();
    
    // Refresh user data to check if account is now locked
    const updatedUser = await User.findById(user._id);
    if (updatedUser?.isLocked) {
      throw new AppError('Too many failed login attempts. Account temporarily locked.', 423);
    }
    
    throw new AppError('Invalid email or password', 401);
  }

  // Successful login - reset login attempts
  await user.resetLoginAttempts();
  
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token (expires in 7 days)
  const refreshExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  await redisTokenManager.storeRefreshToken(refreshToken, user.id, refreshExpiry);
  
  res.cookie('token', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, { 
    ...cookieOptions, 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days 
  });
  
  res.status(200).json({ 
    token, 
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email } 
  });
});

export const getUserProfile = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }
  res.status(200).json(user);
});

export const updatePreferences = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { weekStart, monthStart } = req.body;
  const user = await User.findByIdAndUpdate(req.user?.id, { weekStart, monthStart }, { new: true });
  res.status(200).json(user);
});

export const logout = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies.refreshToken;
  
  if (token) {
    // Blacklist the access token
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded && decoded.exp) {
      await redisTokenManager.blacklistToken(token, decoded.exp * 1000);
    }
  }
  
  if (refreshToken) {
    // Revoke refresh token
    await redisTokenManager.revokeRefreshToken(refreshToken);
  }
  
  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  
  res.status(200).json({ message: 'Logged out successfully' });
});

export const refreshAccessToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }
  
  const userId = await redisTokenManager.validateRefreshToken(refreshToken);
  if (!userId) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Revoke the old refresh token (rotation)
  await redisTokenManager.revokeRefreshToken(refreshToken);
  
  // Generate new tokens
  const newToken = generateToken(user.id);
  const newRefreshToken = generateRefreshToken();
  
  // Store new refresh token (expires in 7 days)
  const refreshExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  await redisTokenManager.storeRefreshToken(newRefreshToken, user.id, refreshExpiry);
  
  res.status(200).json({ 
    token: newToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, name: user.name, email: user.email }
  });
});