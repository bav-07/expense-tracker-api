import { Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import dotenv from 'dotenv';
import { IGetUserAuthInfoRequest } from '../config/definitions';

dotenv.config();

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId}, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({ error: 'All fields are required'});
      return;
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email});
    if (existingUser) {
      res.status(400).json({ error: 'User already exists'});
      return;
    }

    // Create and save the user
    const user = new User({ name, email, password });
    await user.save();

    // Generate a JWT token
    const token = generateToken(user.id);
    res.status(201).json({ token, user: { id: user.id, name, email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user'});
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'All fields are required'});
      return;
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid email or password'});
      return;
    }
    // Generate a JWT token
    const token = generateToken(user.id);
    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login'});
  }
};

// Get authenticated user profile
export const getUserProfile = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.status(200).json(user);
};

// Update user preferences
export const updatePreferences = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { weekStart, monthStart } = req.body;
    const user = await User.findByIdAndUpdate(req.user?.id, { weekStart, monthStart }, { new: true });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}