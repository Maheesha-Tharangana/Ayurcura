import { Express, Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import { sendAppointmentStatusNotification } from '../notifications';
import mongoose from 'mongoose';

export function registerAppointmentRoutes(app: Express) {
  // Database connection test route
  app.get('/api/appointments/connection-test', async (_req: Request, res: Response) => {
    try {
      // Check MongoDB connection
      const connectionState = mongoose.connection.readyState;
      const connectionStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized'
      };
      
      // Log about this diagnostic request
      console.log(`[DIAGNOSTIC] Running connection test. MongoDB readyState=${connectionState}`);
      
      // Try a simple test query that doesn't depend on authentication
      let testQuery = null;
      let error = null;
      
      try {
        // Simple count query to test the database connection
        testQuery = await Appointment.countDocuments().exec();
        console.log(`[DIAGNOSTIC] Test query success. Count=${testQuery}`);
      } catch (queryError) {
        error = queryError;
        console.error('[DIAGNOSTIC] Test query error:', queryError);
      }
      
      const result = {
        database: {
          connection: {
            readyState: connectionState,
            status: connectionStatus[connectionState] || 'unknown',
            host: mongoose.connection.host,
            name: mongoose.connection.name
          },
          test: {
            success: testQuery !== null,
            count: testQuery,
            error: error ? (error.message || 'Unknown error') : null
          }
        },
        server: {
          time: new Date().toISOString(),
          uptime: process.uptime()
        }
      };
      
      console.log(`[DIAGNOSTIC] Connection test completed. Result: ${JSON.stringify(result)}`);
      res.json(result);
    } catch (error) {
      console.error('[DIAGNOSTIC] Connection test failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin route to get all appointments
  app.get('/api/admin/appointments', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
        console.log('Admin route access attempt by:', req.user);
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      console.log('Admin access granted to:', (req.user as any).username);
      
      // Get limit from query params (default to 100)
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      // Only select fields we actually need to improve performance
      const appointments = await Appointment.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .lean() // Use lean() for better performance by returning plain objects instead of Mongoose documents
        .populate('doctorId', 'name specialty imageUrl location consultationFee')
        .populate('userId', 'username email');
      
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching admin appointments:', error);
      res.status(500).json({ message: 'Error fetching appointments' });
    }
  });

  // Create a new appointment
  app.post('/api/appointments', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to make appointments' });
      }
      
      const { doctorId, date, time, symptoms } = req.body;
      const userId = (req.user as any)._id;
      
      console.log(`Creating appointment for user ${userId}, doctor ${doctorId}, date ${date}, time ${time}`);
      
      // Validate required fields
      if (!doctorId || !date || !time || !symptoms) {
        console.error('Missing required fields:', { doctorId, date, time, symptoms });
        return res.status(400).json({ 
          message: 'Missing required fields. Required: doctorId, date, time, symptoms',
          received: { doctorId, date, time, symptoms: symptoms ? 'provided' : 'missing' }
        });
      }
      
      // Check if doctor exists
      try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
          console.error(`Doctor not found with ID: ${doctorId}`);
          return res.status(404).json({ message: 'Doctor not found' });
        }
      } catch (doctorErr) {
        console.error(`Error finding doctor with ID ${doctorId}:`, doctorErr);
        return res.status(500).json({ 
          message: 'Error finding doctor',
          error: doctorErr.message
        });
      }
      
      // Check for conflicting appointments
      try {
        const appointmentDate = new Date(date);
        console.log(`Checking for conflicting appointments on ${appointmentDate.toISOString()} at ${time}`);
        
        const conflictingAppointment = await Appointment.findOne({
          doctorId,
          date: appointmentDate,
          time,
          status: { $in: ['pending', 'confirmed'] }
        });
        
        if (conflictingAppointment) {
          console.log(`Conflicting appointment found: ${conflictingAppointment._id}`);
          return res.status(400).json({ 
            message: 'This time slot is already booked. Please select another time.' 
          });
        }
      } catch (conflictErr) {
        console.error('Error checking for conflicting appointments:', conflictErr);
        return res.status(500).json({ 
          message: 'Error checking appointment availability',
          error: conflictErr.message
        });
      }
      
      // Generate a unique ID for the appointment
      const uniqueId = Math.floor(Date.now() + Math.random() * 1000);
      console.log(`Generated unique ID for new appointment: ${uniqueId}`);
      
      try {
        // Create new appointment with the unique ID
        const newAppointment = new Appointment({
          id: uniqueId, // Set unique numeric ID
          doctorId,
          userId,
          date: new Date(date),
          time,
          symptoms,
          status: 'pending',
          paymentStatus: 'pending'
        });
        
        await newAppointment.save();
        console.log(`Appointment created with ID: ${newAppointment._id}, numeric ID: ${uniqueId}`);
        
        const populatedAppointment = await Appointment.findById(newAppointment._id)
          .populate('doctorId', 'name specialty imageUrl')
          .populate('userId', 'username fullName email');
        
        res.status(201).json(populatedAppointment);
      } catch (saveErr) {
        console.error('Error saving new appointment:', saveErr);
        console.error('Error details:', JSON.stringify(saveErr, null, 2));
        return res.status(500).json({ 
          message: 'Error creating appointment',
          error: saveErr.message
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      res.status(500).json({ 
        message: 'Error creating appointment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get appointments for logged-in user
  app.get('/api/appointments', async (req: Request, res: Response) => {
    try {
      // Check MongoDB connection first in all cases
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB connection not ready. Current state:', mongoose.connection.readyState);
        return res.status(500).json({ 
          message: 'Database connection issue', 
          error: 'Database connection is not ready. Please try again later.' 
        });
      }
      
      // DEBUG: Allow skipping auth for testing with a special query param
      const skipAuth = req.query.debug_skip_auth === 'true';
      
      // Only check authentication if not in debug mode
      if (!skipAuth && !req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to view appointments' });
      }
      
      // For debug mode, just return a simple test response
      if (skipAuth) {
        console.log('Debug mode: Skipping authentication');
        return res.status(200).json({
          debug: true,
          message: 'Database connection successful, authentication skipped for testing',
          mongodbState: mongoose.connection.readyState,
          time: new Date().toISOString()
        });
      }
      
      const userId = (req.user as any)._id;
      console.log(`Fetching appointments for user ID: ${userId}`);
      
      // Validate userId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Invalid user ID format: ${userId}`);
        return res.status(400).json({ 
          message: 'Invalid user ID format', 
          error: 'The user ID is not in a valid format' 
        });
      }
      
      const status = req.query.status as string;
      
      let query: any = { userId };
      
      if (status) {
        query.status = status;
      }
      
      console.log('Using query criteria:', JSON.stringify(query));
      
      try {
        // Use lean() and select() to optimize the query
        const appointments = await Appointment.find(query)
          .sort({ date: 1 })
          .lean()
          .populate('doctorId', 'name specialty imageUrl location consultationFee')
          .populate('userId', 'username fullName')
          .select('-__v');
        
        console.log(`Successfully fetched ${appointments.length} appointments`);
        res.json(appointments);
      } catch (dbError) {
        console.error('Database error when fetching appointments:', dbError);
        console.error('Error details:', JSON.stringify(dbError, null, 2));
        
        // Check if this is a timeout error
        if (dbError.name === 'MongooseError' && dbError.message.includes('timeout')) {
          return res.status(504).json({ 
            message: 'Database timeout', 
            error: 'The database operation timed out. Please try again later.' 
          });
        }
        
        return res.status(500).json({ 
          message: 'Database error when fetching appointments',
          error: dbError.message
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      res.status(500).json({ 
        message: 'Error fetching appointments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get appointment details by ID
  app.get('/api/appointments/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to view appointment details' });
      }
      
      const { id } = req.params;
      const userId = (req.user as any)._id;
      const isAdmin = (req.user as any).role === 'admin';
      
      // Try to find by _id (MongoDB ObjectId)
      let appointment;
      const { Types } = mongoose;
      const { ObjectId } = Types;
      
      try {
        if (ObjectId.isValid(id)) {
          appointment = await Appointment.findById(id)
            .populate('doctorId', 'name specialty imageUrl location consultationFee email phone')
            .populate('userId', 'username fullName email');
        }
      } catch (err) {
        console.log('Not a valid ObjectId, trying alternative methods');
      }
      
      // If not found by ObjectId, try finding by the numeric ID
      if (!appointment) {
        appointment = await Appointment.findOne({ id: Number(id) })
          .populate('doctorId', 'name specialty imageUrl location consultationFee email phone')
          .populate('userId', 'username fullName email');
      }
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check if the appointment belongs to the user or if it's an admin
      if (!isAdmin && appointment.userId._id.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'You do not have permission to view this appointment' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      res.status(500).json({ message: 'Error fetching appointment details' });
    }
  });
  
  // Cancel appointment
  app.patch('/api/appointments/:id/cancel', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to cancel appointments' });
      }
      
      const { id } = req.params;
      const userId = (req.user as any)._id;
      const isAdmin = (req.user as any).role === 'admin';
      
      // First try parsing as a number for the numeric id field
      const numericId = parseInt(id, 10);
      
      // Find by numeric id instead of MongoDB's _id
      let appointment;
      try {
        // First try to find by the numeric id field
        appointment = await Appointment.findOne({ id: numericId });
        
        // If not found and the id looks like a valid MongoDB ObjectId, try that
        if (!appointment && /^[0-9a-fA-F]{24}$/.test(id)) {
          appointment = await Appointment.findById(id);
        }
      } catch (error) {
        console.error('Error finding appointment:', error);
        return res.status(500).json({ message: 'Error finding appointment' });
      }
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check if the appointment belongs to the user or if it's an admin
      if (!isAdmin && appointment.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'You do not have permission to cancel this appointment' });
      }
      
      // Check if appointment is not already cancelled or completed
      if (appointment.status === 'cancelled') {
        return res.status(400).json({ message: 'This appointment is already cancelled' });
      }
      
      if (appointment.status === 'completed') {
        return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
      }
      
      // Update appointment status
      appointment.status = 'cancelled';
      
      // If payment was made, mark as refund pending
      if (appointment.paymentStatus === 'completed') {
        appointment.paymentStatus = 'refunded';
      }
      
      await appointment.save();
      
      res.json(appointment);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ message: 'Error cancelling appointment' });
    }
  });
  
  // Confirm appointment (admin only)
  app.patch('/api/admin/appointments/:id/confirm', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      
      // First try parsing as a number for the numeric id field
      const numericId = parseInt(id, 10);
      
      // Find by numeric id instead of MongoDB's _id
      let appointment;
      try {
        // First try to find by the numeric id field
        appointment = await Appointment.findOne({ id: numericId });
        
        // If not found and the id looks like a valid MongoDB ObjectId, try that
        if (!appointment && /^[0-9a-fA-F]{24}$/.test(id)) {
          appointment = await Appointment.findById(id);
        }
      } catch (error) {
        console.error('Error finding appointment:', error);
        return res.status(500).json({ message: 'Error finding appointment' });
      }
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      if (appointment.status !== 'pending') {
        return res.status(400).json({ 
          message: `Cannot confirm appointment with status "${appointment.status}"` 
        });
      }
      
      appointment.status = 'confirmed';
      await appointment.save();
      
      // Use appointment._id which we know is a valid MongoDB ObjectId
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'name specialty')
        .populate('userId', 'username fullName email');
      
      res.json(populatedAppointment);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      res.status(500).json({ message: 'Error confirming appointment' });
    }
  });
  
  // Mark appointment as completed (admin only)
  app.patch('/api/admin/appointments/:id/complete', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      
      // First try parsing as a number for the numeric id field
      const numericId = parseInt(id, 10);
      
      // Find by numeric id instead of MongoDB's _id
      let appointment;
      try {
        // First try to find by the numeric id field
        appointment = await Appointment.findOne({ id: numericId });
        
        // If not found and the id looks like a valid MongoDB ObjectId, try that
        if (!appointment && /^[0-9a-fA-F]{24}$/.test(id)) {
          appointment = await Appointment.findById(id);
        }
      } catch (error) {
        console.error('Error finding appointment:', error);
        return res.status(500).json({ message: 'Error finding appointment' });
      }
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      if (appointment.status !== 'confirmed') {
        return res.status(400).json({ 
          message: 'Only confirmed appointments can be marked as completed' 
        });
      }
      
      const oldStatus = appointment.status;
      appointment.status = 'completed';
      await appointment.save();
      
      // Populate and send notification
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'name specialty')
        .populate('userId', 'username fullName email');
      
      if (populatedAppointment && populatedAppointment.userId) {
        const userId = populatedAppointment.userId._id.toString();
        const doctorName = populatedAppointment.doctorId && typeof populatedAppointment.doctorId === 'object' 
          ? (populatedAppointment.doctorId as any).name || 'Your doctor'
          : 'Your doctor';
          
        sendAppointmentStatusNotification(
          id,
          userId,
          oldStatus,
          'completed',
          {
            doctorName,
            date: appointment.date,
            time: appointment.time
          }
        );
      }
      
      res.json(populatedAppointment);
    } catch (error) {
      console.error('Error completing appointment:', error);
      res.status(500).json({ message: 'Error completing appointment' });
    }
  });
  
  // Update payment status for an appointment
  app.patch('/api/appointments/:id/payment-status', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to update payment status' });
      }
      
      const { id } = req.params;
      const { paymentStatus } = req.body;
      
      if (!paymentStatus) {
        return res.status(400).json({ message: 'Payment status is required' });
      }
      
      if (!['pending', 'paid', 'refunded', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({ 
          message: 'Invalid payment status. Must be one of: pending, paid, refunded, failed' 
        });
      }
      
      // Find appointment by numeric id
      const numericId = parseInt(id, 10);
      
      let appointment;
      try {
        // First try to find by the numeric id field
        appointment = await Appointment.findOne({ id: numericId });
        
        // If not found and the id looks like a valid MongoDB ObjectId, try that
        if (!appointment && /^[0-9a-fA-F]{24}$/.test(id)) {
          appointment = await Appointment.findById(id);
        }
      } catch (error) {
        console.error('Error finding appointment:', error);
        return res.status(500).json({ message: 'Error finding appointment' });
      }
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Update payment status
      appointment.paymentStatus = paymentStatus;
      
      // If payment is completed, also update the appointment status if it's still pending
      if (paymentStatus === 'paid' && appointment.status === 'pending') {
        appointment.status = 'confirmed';
      }
      
      await appointment.save();
      
      // Return the updated appointment
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'name specialty')
        .populate('userId', 'username fullName email');
      
      res.json(populatedAppointment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Error updating payment status' });
    }
  });
  
  // Generic appointment status update endpoint (admin only)
  app.patch('/api/admin/appointments/:id/status', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      console.log('Admin route access attempt by:', req.user);
      console.log('Admin access granted to:', (req.user as any).username);
      
      const { id } = req.params;
      const { status, notes } = req.body;
      
      console.log(`Trying to update appointment with id: ${id}, status: ${status}`);
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed' 
        });
      }
      
      // IMPORTANT FIX: Use the numeric id field rather than MongoDB's _id field
      // First try parsing as a number for the numeric id field
      const numericId = parseInt(id, 10);
      
      // Find by numeric id instead of MongoDB's _id
      let appointment;
      try {
        // First try to find by the numeric id field
        appointment = await Appointment.findOne({ id: numericId });
        
        // If not found and the id looks like a valid MongoDB ObjectId, try that
        if (!appointment && /^[0-9a-fA-F]{24}$/.test(id)) {
          appointment = await Appointment.findById(id);
        }
      } catch (error) {
        console.error('Error updating appointment status:', error);
        return res.status(500).json({ message: 'Error finding appointment' });
      }
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Store the old status for notification
      const oldStatus = appointment.status;
      
      // Update status and notes
      appointment.status = status;
      if (notes !== undefined) {
        appointment.notes = notes;
      }
      
      await appointment.save();
      
      // Populate appointment for response and notification
      // Use appointment._id which we know is a valid MongoDB ObjectId
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'name specialty')
        .populate('userId', 'username fullName email');
      
      // Send notification to the user
      if (populatedAppointment && populatedAppointment.userId) {
        const userId = populatedAppointment.userId._id.toString();
        const doctorName = populatedAppointment.doctorId && typeof populatedAppointment.doctorId === 'object'
          ? (populatedAppointment.doctorId as any).name || 'Your doctor'
          : 'Your doctor';
          
        sendAppointmentStatusNotification(
          id,
          userId,
          oldStatus,
          status,
          {
            doctorName,
            date: appointment.date,
            time: appointment.time,
            notes: appointment.notes
          }
        );
      }
      
      res.json(populatedAppointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ message: 'Error updating appointment status' });
    }
  });
}