import mongoose from 'mongoose';
import { Treatment } from '@shared/schema';

const treatmentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  benefits: { 
    type: [String], 
    default: [],
    // Custom validator to ensure benefits is always an array
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: props => `benefits must be an array, got ${typeof props.value}`
    }
  },
  imageUrl: { 
    type: String, 
    required: true,
    // Custom validator to ensure imageUrl is not empty
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: props => 'imageUrl cannot be empty'
    }
  },
  category: { type: String, required: true },
  relatedMedicines: { 
    type: [String], 
    default: [],
    // Custom validator to ensure relatedMedicines is always an array
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: props => `relatedMedicines must be an array, got ${typeof props.value}`
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to sanitize data
treatmentSchema.pre('save', function(next) {
  // Ensure benefits and relatedMedicines are arrays
  if (!Array.isArray(this.benefits)) {
    this.benefits = [];
  }
  if (!Array.isArray(this.relatedMedicines)) {
    this.relatedMedicines = [];
  }
  next();
});

// Create and export the Treatment model
const TreatmentModel = mongoose.model<Treatment & mongoose.Document>('Treatment', treatmentSchema);

export default TreatmentModel;