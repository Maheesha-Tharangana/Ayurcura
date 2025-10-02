import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  doctorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5
    },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

// Ensure a user can only review a doctor once
ReviewSchema.index({ doctorId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);