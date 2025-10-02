import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env files
// First try .env.local, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    // Make sure the MongoDB URI is set
    if (!process.env.MONGODB_URI) {
      console.error('Missing MONGODB_URI environment variable');
      throw new Error('Missing MONGODB_URI environment variable');
    }

    // Configure Mongoose options for better stability
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection error handlers for later problems
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    console.log('Retrying connection in 5 seconds...');
    
    // Wait 5 seconds and try again - helps with initial connection issues
    setTimeout(() => {
      connectDB().catch(err => {
        console.error('Failed to reconnect to MongoDB:', err);
        console.error('Please check your MongoDB URI and network connection');
      });
    }, 5000);
  }
};

// Export models
export { default as UserModel } from './User';
export { default as DoctorModel } from './Doctor';
export { default as ReviewModel } from './Review';
export { default as TreatmentModel } from './Treatment';
export { default as AppointmentModel } from './Appointment';

export default connectDB;