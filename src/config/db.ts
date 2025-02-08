import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const dbUri: string = process.env.MONGO_URI as string;
    await mongoose.connect(dbUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error: ', error);
    process.exit(1);
  }
};

export default connectDB;