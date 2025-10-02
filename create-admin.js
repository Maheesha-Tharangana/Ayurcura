// Script to create an admin user in MongoDB
import mongoose from 'mongoose';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create a simple User schema for this script
    const userSchema = new mongoose.Schema({
      id: { type: Number, required: true, unique: true },
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      fullName: { type: String, required: true },
      role: { type: String, required: true, default: 'user' },
      createdAt: { type: Date, default: Date.now }
    });
    
    const User = mongoose.model('User', userSchema);
    
    try {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ username: 'admin' });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
      } else {
        // Create admin user
        const hashedPassword = await hashPassword('admin123');
        
        const adminUser = new User({
          id: 1,
          username: 'admin',
          password: hashedPassword,
          email: 'admin@ayurcura.com',
          fullName: 'Admin User',
          role: 'admin',
          createdAt: new Date()
        });
        
        await adminUser.save();
        console.log('Admin user created successfully');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });