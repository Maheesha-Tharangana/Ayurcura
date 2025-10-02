import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  id: number; // Adding id field to match schema
  doctorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  status: string; // "pending", "confirmed", "cancelled", "completed"
  symptoms: string;
  notes: string;
  paymentStatus: string; // "pending", "completed", "refunded"
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    id: { type: Number, unique: true, required: true, default: Date.now }, // Add auto-generated ID
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    symptoms: { type: String, required: true },
    notes: { type: String, default: '' },
    paymentStatus: { 
      type: String, 
      required: true,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);