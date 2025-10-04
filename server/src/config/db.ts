import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    // Enable MongoDB security features
    mongoose.set('sanitizeFilter', true); // Prevent NoSQL injection
    mongoose.set('strictQuery', true); // Enforce strict query mode
    
    // Use test database in test environment
    let dbUri: string;
    if (process.env.NODE_ENV === 'test') {
      dbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/express-jwt-auth-test';
    } else {
      dbUri = process.env.MONGO_URI as string;
    }
    
    // Enhanced connection options for security
    await mongoose.connect(dbUri, {
      maxPoolSize: 10, // Limit connection pool
      serverSelectionTimeoutMS: 5000, // Keep a short timeout
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log(`MongoDB connected to: ${dbUri}`);
  } catch (error) {
    console.error('Database connection error: ', error);
    process.exit(1);
  }
};

export default connectDB;