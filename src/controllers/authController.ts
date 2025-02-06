import { Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import dotenv from 'dotenv';
import { IGetUserAuthInfoRequest } from '../config/definitions';
import { AppError } from '../middlewares/errorHandler';
import catchAsync from '../utils/catchAsync';

dotenv.config();

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
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
  res.status(201).json({ token, user: { id: user.id, name, email } });
});

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('All fields are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  const token = generateToken(user.id);
  res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
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