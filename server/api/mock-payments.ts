import { Express, Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Mock payment routes for prototype demonstration
 * These routes simulate payment processing without requiring actual Stripe integration
 */
export function registerMockPaymentRoutes(app: Express) {
  /**
   * Admin route to get all payments
   * GET /api/admin/payments
   */
  app.get('/api/admin/payments', async (req: Request, res: Response) => {
    try {
      // Check if the user is admin
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Get all appointments to create mock payment entries
      const appointments = await storage.getAppointments();
      
      // Create mock payment data from appointments
      const payments = appointments.map(appointment => {
        return {
          id: appointment.id,
          _id: appointment._id,
          amount: 2990,
          currency: 'LKR',
          status: appointment.paymentStatus === 'paid' ? 'completed' : 
                 appointment.paymentStatus === 'refunded' ? 'refunded' : 
                 appointment.paymentStatus === 'failed' ? 'failed' : 'pending',
          appointmentId: appointment.id,
          userId: appointment.userId,
          doctorId: appointment.doctorId,
          paymentMethod: 'Debit Card',
          transactionId: `TRANS-${appointment.id}`,
          createdAt: appointment.createdAt || new Date(),
          updatedAt: appointment.updatedAt || new Date()
        };
      });
      
      res.status(200).json(payments);
    } catch (error: any) {
      console.error('Error fetching admin payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
  });

  /**
   * Create a mock payment intent
   * POST /api/mock-payments/create-intent
   */
  app.post('/api/mock-payments/create-intent', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { appointmentId } = req.body;

      if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID is required' });
      }

      // For demo purposes, skip database verification and just generate a mock client secret
      // This helps when appointments are not actually in the database
      const amount = 2990; // Default amount
      const mockClientSecret = `mock_pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;

      // Return the mock client secret
      res.status(200).json({
        clientSecret: mockClientSecret,
        amount: amount,
        isMock: true
      });
    } catch (error: any) {
      console.error('Error creating mock payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
    }
  });

  /**
   * Process a mock payment
   * POST /api/mock-payments/process
   */
  app.post('/api/mock-payments/process', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { appointmentId, mockClientSecret } = req.body;

      if (!appointmentId || !mockClientSecret) {
        return res.status(400).json({ message: 'Appointment ID and client secret are required' });
      }

      // Validate that the client secret starts with our expected prefix
      if (!mockClientSecret.startsWith('mock_pi_')) {
        return res.status(400).json({ message: 'Invalid client secret' });
      }

      // Try to find the appointment
      let appointment;
      try {
        // First try parsing as a number for the numeric id field
        const numericId = parseInt(appointmentId, 10);
        
        appointment = await storage.getAppointment(numericId);
        
        if (appointment) {
          // Update the appointment payment status
          appointment = await storage.updateAppointmentPaymentStatus(numericId, 'paid');
          
          // If appointment is in pending status, confirm it
          if (appointment.status === 'pending') {
            appointment = await storage.updateAppointmentStatus(numericId, 'confirmed');
          }
        }
      } catch (error) {
        console.error('Error updating appointment after payment:', error);
        // Continue processing even if there was an error finding/updating the appointment
      }
      
      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        paymentId: `mock_payment_${Date.now()}`,
        appointment: appointment || {
          id: appointmentId,
          status: 'confirmed',
          paymentStatus: 'paid',
          date: new Date().toISOString(),
          time: '12:00 PM',
          userId: req.user.id
        }
      });
    } catch (error: any) {
      console.error('Error processing mock payment:', error);
      res.status(500).json({ message: 'Failed to process payment', error: error.message });
    }
  });

  /**
   * Admin route to update a payment status
   * PATCH /api/admin/payments/:id/status
   */
  app.patch('/api/admin/payments/:id/status', async (req: Request, res: Response) => {
    try {
      // Check if the user is admin
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || !status) {
        return res.status(400).json({ message: 'Payment ID and new status are required' });
      }
      
      if (!['pending', 'completed', 'refunded', 'failed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: pending, completed, refunded, failed' });
      }
      
      // Convert the status to match our appointment payment status format
      let paymentStatus;
      switch (status) {
        case 'completed':
          paymentStatus = 'paid';
          break;
        case 'pending':
          paymentStatus = 'pending';
          break;
        case 'refunded':
          paymentStatus = 'refunded';
          break;
        case 'failed':
          paymentStatus = 'failed';
          break;
        default:
          paymentStatus = 'pending';
      }
      
      // Find the appointment and update its payment status
      try {
        const appointmentId = parseInt(id, 10);
        const appointment = await storage.getAppointment(appointmentId);
        
        if (appointment) {
          // Update the appointment payment status
          const updatedAppointment = await storage.updateAppointmentPaymentStatus(appointmentId, paymentStatus);
          
          // Return a mock payment object with the updated status
          return res.status(200).json({
            id: appointmentId,
            _id: appointment._id,
            amount: 2990,
            currency: 'LKR',
            status: status,
            appointmentId: appointmentId,
            userId: appointment.userId,
            doctorId: appointment.doctorId,
            paymentMethod: 'Debit Card',
            transactionId: `TRANS-${appointmentId}`,
            createdAt: appointment.createdAt || new Date(),
            updatedAt: new Date()
          });
        } else {
          return res.status(404).json({ message: 'Appointment not found' });
        }
      } catch (error) {
        // If the appointment isn't found or ID is invalid, return a generic success
        // This is just for demo purposes
        console.error('Error updating payment status:', error);
        return res.status(200).json({
          id: parseInt(id, 10) || Math.floor(Math.random() * 1000),
          status: status,
          message: 'Payment status updated (mock)'
        });
      }
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Failed to update payment status', error: error.message });
    }
  });

  /**
   * Admin route to refund a payment
   * POST /api/admin/payments/:id/refund
   */
  app.post('/api/admin/payments/:id/refund', async (req: Request, res: Response) => {
    try {
      // Check if the user is admin
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: 'Payment ID is required' });
      }
      
      // Find the appointment and update its payment status
      try {
        const appointmentId = parseInt(id, 10);
        const appointment = await storage.getAppointment(appointmentId);
        
        if (appointment) {
          // Update the appointment payment status to refunded
          const updatedAppointment = await storage.updateAppointmentPaymentStatus(appointmentId, 'refunded');
          
          // Return a mock payment object with the updated status
          return res.status(200).json({
            id: appointmentId,
            _id: appointment._id,
            amount: 2990,
            currency: 'LKR',
            status: 'refunded',
            appointmentId: appointmentId,
            userId: appointment.userId,
            doctorId: appointment.doctorId,
            paymentMethod: 'Debit Card',
            transactionId: `TRANS-${appointmentId}`,
            refundId: `REFUND-${Date.now()}`,
            createdAt: appointment.createdAt || new Date(),
            updatedAt: new Date(),
            refundedAt: new Date()
          });
        } else {
          return res.status(404).json({ message: 'Appointment not found' });
        }
      } catch (error) {
        // If the appointment isn't found or ID is invalid, return a generic success
        // This is just for demo purposes
        console.error('Error processing refund:', error);
        return res.status(200).json({
          id: parseInt(id, 10) || Math.floor(Math.random() * 1000),
          status: 'refunded',
          refundId: `REFUND-${Date.now()}`,
          message: 'Payment refunded (mock)'
        });
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      res.status(500).json({ message: 'Failed to process refund', error: error.message });
    }
  });

  /**
   * Get payment details for an appointment
   * GET /api/mock-payments/appointments/:id
   */
  app.get('/api/mock-payments/appointments/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'Appointment ID is required' });
      }

      // For demo purposes, return mock appointment details
      // This helps when appointments are not actually in the database
      const doctors = await storage.getDoctors(); // Get all doctors
      const doctorData = doctors && doctors.length > 0 ? doctors[0] : null;
      
      // Return payment information with demo data
      res.status(200).json({
        appointmentId: id,
        amount: 2990,
        paymentStatus: 'pending',
        doctor: {
          id: doctorData ? doctorData.id : 1,
          name: doctorData ? doctorData.name : 'your doctor',
          specialty: doctorData ? doctorData.specialty : 'General'
        },
        date: new Date().toISOString(),
        time: '12:00 PM',
      });
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      res.status(500).json({ message: 'Failed to fetch payment details', error: error.message });
    }
  });
}