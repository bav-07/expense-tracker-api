import { Request, Response} from 'express';
import User from '../models/userModel';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { IGetUserAuthInfoRequest } from '../config/definitions';
import { AppError } from '../middlewares/errorHandler';
import catchAsync from '../utils/catchAsync';
import { TokenBindingService } from '../utils/tokenBindingService';
import { redisTokenManager } from '../utils/redisTokenManager';

dotenv.config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: "strict" as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}

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

  const { token, jti: accessJti } = await TokenBindingService.createBoundAccessToken(user.id, req);
  const { token: refreshToken, jti: refreshJti } = await TokenBindingService.createBoundRefreshToken(user.id, req);
  
  // Add tokens to user registry for management
  await TokenBindingService.addTokenToUserRegistry(user.id, accessJti);
  await TokenBindingService.addTokenToUserRegistry(user.id, refreshJti);
  
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
  
  try {
    const { token, jti: accessJti } = await TokenBindingService.createBoundAccessToken(user.id, req);
    const { token: refreshToken, jti: refreshJti } = await TokenBindingService.createBoundRefreshToken(user.id, req);
    
    // Add tokens to user registry for management
    await TokenBindingService.addTokenToUserRegistry(user.id, accessJti);
    await TokenBindingService.addTokenToUserRegistry(user.id, refreshJti);
    
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
  } catch (tokenError) {
    // If token creation fails, still increment login attempts to prevent abuse
    await user.incLoginAttempts();
    throw new AppError('Authentication system temporarily unavailable', 500);
  }
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
    // Validate and revoke bound token
    const validation = await TokenBindingService.validateBoundToken(token, req);
    if (validation.isValid && validation.payload?.jti) {
      await TokenBindingService.revokeTokenBinding(validation.payload.jti);
    }
    // Also blacklist the token as backup
    await redisTokenManager.blacklistToken(token, Date.now() + (60 * 60 * 1000));
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
  
  // Generate new bound tokens
  const { token: newToken, jti: newAccessJti } = await TokenBindingService.createBoundAccessToken(user.id, req);
  const { token: newRefreshToken, jti: newRefreshJti } = await TokenBindingService.createBoundRefreshToken(user.id, req);
  
  // Add new tokens to user registry
  await TokenBindingService.addTokenToUserRegistry(user.id, newAccessJti);
  await TokenBindingService.addTokenToUserRegistry(user.id, newRefreshJti);
  
  res.status(200).json({ 
    token: newToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

export const getSecurityInfo = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const securityInfo = await TokenBindingService.getClientSecurityInfo(userId);
  
  res.status(200).json({
    userId,
    activeTokens: securityInfo.activeTokens,
    recentDevices: securityInfo.recentFingerprints.map(fp => ({
      ip: fp.ip,
      userAgent: fp.userAgent,
      lastSeen: new Date(fp.lastSeen).toISOString(),
      isCurrentDevice: TokenBindingService.createClientFingerprint(req).fingerprintHash === 
        crypto.createHash('sha256').update(`${fp.ip}:${fp.userAgent}`).digest('hex')
    }))
  });
});

export const revokeAllTokens = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Revoke all tokens except the current one
  const currentToken = req.headers.authorization?.split(' ')[1];
  if (currentToken) {
    const validation = await TokenBindingService.validateBoundToken(currentToken, req);
    if (validation.isValid && validation.payload?.jti) {
      // Save current token's JTI to exclude from revocation
      await TokenBindingService.revokeAllUserTokens(userId);
      
      // Re-create the current session token
      const { token: newToken, jti: newJti } = await TokenBindingService.createBoundAccessToken(userId, req);
      await TokenBindingService.addTokenToUserRegistry(userId, newJti);
      
      res.status(200).json({
        message: 'All other sessions have been terminated',
        newToken
      });
      return;
    }
  }
  
  // If no valid current token, revoke everything
  await TokenBindingService.revokeAllUserTokens(userId);
  res.status(200).json({
    message: 'All sessions have been terminated. Please log in again.'
  });
});





