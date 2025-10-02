import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    // Ensure MongoDB URI is in the correct format
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`MongoDB URI length: ${uri.length}`);
    console.log(`MongoDB URI first 15 chars: ${uri.substring(0, 15)}...`);
    
    // Check if the URI is in wrong format (might contain "MONGODB_URI=" prefix)
    if (uri.includes('MONGODB_URI=')) {
      const parts = uri.split('MONGODB_URI=');
      if (parts.length > 1) {
        uri = parts[1];
        console.log('Removed MONGODB_URI= prefix from the connection string');
      }
    }
    
    // Validate that the URI starts with mongodb:// or mongodb+srv://
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      console.error('Invalid MongoDB URI format, must start with mongodb:// or mongodb+srv://');
      
      // Check if there are any prepended/appended quotes
      let sanitizedUri = uri.trim();
      if (sanitizedUri.startsWith('"') && sanitizedUri.endsWith('"')) {
        sanitizedUri = sanitizedUri.substring(1, sanitizedUri.length - 1);
        console.log('Removed quotes from URI');
      }
      
      // Additional sanitization for URI from this point
      console.log('URI does not start with mongodb:// or mongodb+srv://, cannot connect');
      process.exit(1);
    }

    // Configure mongoose connection with better timeout and retry settings
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // Increase timeout for server selection
      socketTimeoutMS: 30000, // Increase socket timeout
      connectTimeoutMS: 30000, // Increase connection timeout
      heartbeatFrequencyMS: 10000, // Reduce heartbeat frequency to catch disconnects faster
      maxPoolSize: 10, // Set maximum connection pool size
      minPoolSize: 2, // Set minimum connection pool size
    });
    
    // Add connection event listeners for better monitoring
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected - attempting to reconnect');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Export models
export { default as UserModel } from './User';
export { default as DoctorModel } from './Doctor';
export { default as ReviewModel } from './Review';
export { default as TreatmentModel } from './Treatment';
export { default as AppointmentModel } from './Appointment';

export default connectDB;