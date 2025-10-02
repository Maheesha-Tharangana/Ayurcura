import { Express, Request, Response } from 'express';
import Doctor from '../models/Doctor';
import Review from '../models/Review';
import Appointment from '../models/Appointment';

export function registerDoctorRoutes(app: Express) {
  // Get all doctors (public)
  app.get('/api/doctors', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const specialty = req.query.specialty as string;
      const location = req.query.location as string;
      
      let query: any = {};
      
      // Add filters if provided
      if (specialty) {
        query.specialty = specialty;
      }
      
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      
      const doctors = await Doctor.find(query)
        .sort({ createdAt: -1 })
        .limit(limit || 0)
        .select('id name specialty location imageUrl consultationFee yearsOfExperience')
        .lean(); // Use lean() for better performance
        
      console.log('Fetching doctors:', doctors.length);
      
      // Add cache-control header to improve performance
      res.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Error fetching doctors' });
    }
  });

  // Get doctor by ID
  app.get('/api/doctors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let doctor;
      
      // Try to find by MongoDB _id first
      try {
        doctor = await Doctor.findById(id).lean();
      } catch (err) {
        // If error in ObjectId format, try numeric id instead
        console.log('Error with ObjectId, trying numeric id');
      }
      
      // If not found by MongoDB _id, try by the numeric id field
      if (!doctor) {
        doctor = await Doctor.findOne({ id: Number(id) }).lean();
      }
      
      console.log('Doctor details found:', doctor ? 'Yes' : 'No', 'for ID:', id);
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      // Get availability status (simple logic - if has appointments today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const hasAppointmentsToday = await Appointment.exists({
        doctorId: id,
        date: { $gte: today, $lt: tomorrow }
      });
      
      // Add cache-control header for better performance
      res.set('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds
      
      res.json({
        ...doctor,
        reviews: [], // Return empty array instead of fetching reviews here
        availability: {
          isAvailableToday: !hasAppointmentsToday,
          nextAvailable: hasAppointmentsToday ? tomorrow : today
        }
      });
    } catch (error) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ message: 'Error fetching doctor details' });
    }
  });
  
  // Get reviews for a doctor
  app.get('/api/doctors/:id/reviews', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      let doctorExists = false;
      
      // Try to find by MongoDB _id first
      try {
        doctorExists = await Doctor.exists({ _id: id });
      } catch (err) {
        // If error in ObjectId format, try numeric id instead
        console.log('Error with ObjectId in reviews, trying numeric id');
      }
      
      // If not found by MongoDB _id, try by numeric id
      if (!doctorExists) {
        doctorExists = await Doctor.exists({ id: Number(id) });
      }
      
      if (!doctorExists) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      // Get the doctor's MongoDB _id 
      const doctor = await Doctor.findOne({ id: Number(id) }).select('_id').lean();
      const doctorId = doctor ? doctor._id : id;
      
      // Get reviews for this doctor
      const reviews = await Review.find({ doctorId: doctorId })
        .sort({ createdAt: -1 })
        .limit(10) // Limit to 10 most recent reviews for performance
        .lean();
      
      console.log('Reviews found for doctor', id, ':', reviews.length);
      
      // Return a proper array (even if empty)
      res.json(reviews || []);
    } catch (error) {
      console.error('Error fetching doctor reviews:', error);
      // Return an empty array instead of error to prevent client-side parsing errors
      res.json([]);
    }
  });
  
  // Add review for a doctor
  app.post('/api/doctors/:id/reviews', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to leave a review' });
      }
      
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = (req.user as any)._id;
      
      let doctorExists = false;
      let doctorId = id;
      
      // Try to find by MongoDB _id first
      try {
        doctorExists = await Doctor.exists({ _id: id });
      } catch (err) {
        // If error in ObjectId format, try numeric id instead
        console.log('Error with ObjectId in review posting, trying numeric id');
      }
      
      // If not found by MongoDB _id, try by numeric id
      if (!doctorExists) {
        const doctor = await Doctor.findOne({ id: Number(id) }).select('_id').lean();
        if (doctor) {
          doctorExists = true;
          doctorId = doctor._id;
        }
      }
      
      if (!doctorExists) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      // Check if user has an appointment with this doctor
      const hasAppointment = await Appointment.exists({
        doctorId: doctorId,
        userId,
        status: 'completed'
      });
      
      if (!hasAppointment) {
        return res.status(403).json({
          message: 'You can only review doctors after completing an appointment with them'
        });
      }
      
      // Check if user already left a review
      const existingReview = await Review.findOne({ doctorId: doctorId, userId });
      
      if (existingReview) {
        // Update existing review
        existingReview.rating = rating;
        existingReview.comment = comment;
        await existingReview.save();
        
        return res.json(existingReview);
      }
      
      // Create new review
      const newReview = new Review({
        doctorId: doctorId,
        userId,
        rating,
        comment
      });
      
      await newReview.save();
      console.log('Added new review for doctor:', doctorId);
      res.status(201).json(newReview);
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({ message: 'Error adding review' });
    }
  });
}