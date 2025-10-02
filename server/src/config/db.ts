import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('sanitizeFilter', true);
    
    // Use test database in test environment
    let dbUri: string;
    if (process.env.NODE_ENV === 'test') {
      dbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/express-jwt-auth-test';
    } else {
      dbUri = process.env.MONGO_URI as string;
    }
    
    await mongoose.connect(dbUri);
    console.log(`MongoDB connected to: ${dbUri}`);
  } catch (error) {
    console.error('Database connection error: ', error);
    process.exit(1);
  }
};

export default connectDB;