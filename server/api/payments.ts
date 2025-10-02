import { Express, Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export function registerPaymentRoutes(app: Express) {
  /**
   * Create a payment intent for an appointment
   * POST /api/payments/create-payment-intenta
   */
  app.post('/api/payments/create-payment-intent', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { appointmentId } = req.body;

      if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID is required' });
      }

      // Get the appointment details
      const appointment = await storage.getAppointment(Number(appointmentId));
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if appointment belongs to the current user
      if (appointment.userId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized access to this appointment' });
      }

      // Get the doctor to determine the amount
      const doctor = await storage.getDoctor(appointment.doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const amount = doctor.consultationFee || 29.99; // Default to $50 if no fee is set

      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert Sri Lanka Rupee to cents
        currency: 'LKR',
        metadata: {
          appointmentId: appointmentId.toString(),
          userId: req.user.id.toString(),
          doctorId: appointment.doctorId.toString(),
        },
      });

      // Return the client secret to the frontend
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
    }
  });

  /**
   * Handle Stripe webhook events
   * POST /api/payments/webhook
   */
  app.post('/api/payments/webhook', async (req: Request, res: Response) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    let event;

    // Verify webhook signature and extract the event.
    // Only use this in a production webhook handler.
    // if (process.env.STRIPE_WEBHOOK_SECRET) {
    //   try {
    //     event = stripe.webhooks.constructEvent(
    //       payload,
    //       sig,
    //       process.env.STRIPE_WEBHOOK_SECRET
    //     );
    //   } catch (err) {
    //     return res.status(400).send(`Webhook Error: ${err.message}`);
    //   }
    // } else {
    //   event = payload;
    // }

    // For development, just use the payload directly
    event = payload;

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        // Update the appointment payment status
        const appointmentId = paymentIntent.metadata.appointmentId;
        if (appointmentId) {
          await storage.updateAppointmentPaymentStatus(Number(appointmentId), 'completed');
          console.log(`Payment for appointment ${appointmentId} completed successfully`);
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Update the appointment payment status
        const appointmentId = paymentIntent.metadata.appointmentId;
        if (appointmentId) {
          await storage.updateAppointmentPaymentStatus(Number(appointmentId), 'failed');
          console.log(`Payment for appointment ${appointmentId} failed`);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  });

  /**
   * Update appointment payment status manually
   * PATCH /api/payments/appointments/:id/status
   */
  app.patch('/api/payments/appointments/:id/status', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: 'Appointment ID and status are required' });
      }

      // Validate status
      if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }

      const appointment = await storage.getAppointment(Number(id));
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Only allow admins or the appointment owner to update payment status
      const isAdmin = req.user.role === 'admin';
      const isOwner = appointment.userId === req.user.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized to update this appointment' });
      }

      // Update payment status
      const updatedAppointment = await storage.updateAppointmentPaymentStatus(Number(id), status);
      
      res.status(200).json(updatedAppointment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Failed to update payment status', error: error.message });
    }
  });

  /**
   * Get payment details for an appointment
   * GET /api/payments/appointments/:id
   */
  app.get('/api/payments/appointments/:id', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'Appointment ID is required' });
      }

      const appointment = await storage.getAppointment(Number(id));
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Only allow admins or the appointment owner to view payment details
      const isAdmin = req.user.role === 'admin';
      const isOwner = appointment.userId === req.user.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized to view this appointment' });
      }

      // Get the doctor to determine the amount
      const doctor = await storage.getDoctor(appointment.doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const amount = doctor.consultationFee || 29.99; // Default to $50 if no fee is set

      // Return payment information
      res.status(200).json({
        appointmentId: appointment.id,
        amount,
        paymentStatus: appointment.paymentStatus,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
        },
        date: appointment.date,
        time: appointment.time,
      });
    } catch (error) {
      console.error('Error fetching payment details:', error);
      res.status(500).json({ message: 'Failed to fetch payment details', error: error.message });
    }
  });
}