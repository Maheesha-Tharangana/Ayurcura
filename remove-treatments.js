// Script to remove specific treatments from the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv configuration
dotenv.config();

// Define Treatment model schema
const treatmentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  benefits: { type: [String], default: [] },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true },
  relatedMedicines: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/ayurcare';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function removeTreatments() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Create Treatment model
    const Treatment = mongoose.model('Treatment', treatmentSchema);
    
    // Treatments to remove
    const treatmentsToRemove = ['Abhyanga', 'Nasya', 'Svedana'];
    
    console.log(`Attempting to remove the following treatments: ${treatmentsToRemove.join(', ')}`);
    
    // Find and delete each treatment
    for (const treatmentName of treatmentsToRemove) {
      const regex = new RegExp(treatmentName, 'i'); // Case-insensitive search
      const treatment = await Treatment.findOne({ name: regex });
      
      if (treatment) {
        console.log(`Found treatment: ${treatment.name} (ID: ${treatment.id})`);
        
        // Delete the treatment
        const result = await Treatment.deleteOne({ _id: treatment._id });
        if (result.deletedCount === 1) {
          console.log(`Successfully deleted treatment: ${treatment.name}`);
        } else {
          console.log(`Failed to delete treatment: ${treatment.name}`);
        }
      } else {
        console.log(`Treatment not found: ${treatmentName}`);
      }
    }
    
    // Clear caches by setting timestamp to 0
    console.log('Note: Make sure to restart your application to clear caches');
    
    console.log('Treatment removal complete');
  } catch (error) {
    console.error('Error removing treatments:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the removal function
removeTreatments(); 