import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  id: number;
  name: string;
  specialty: string;
  location: string;
  phone: string;
  email: string;
  bio: string;
  imageUrl?: string;
  consultationFee: number;
  yearsOfExperience: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String, required: true },
    imageUrl: { type: String },
    consultationFee: { type: Number, required: true },
    yearsOfExperience: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);