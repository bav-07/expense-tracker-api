import { Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import dotenv from 'dotenv';

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
      res.status(400).json({ error: 'Invalid email or password'});
      return;
    }
    // Generate a JWT token
    const token = generateToken(user.id);
    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login'});
  }
};