import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { registerDoctorRoutes } from "./api/doctors";
import { registerTreatmentRoutes } from "./api/treatments";
import { registerArticleRoutes } from "./api/articles";
import { registerAppointmentRoutes } from "./api/appointments";
import { registerAdminRoutes } from "./api/admin";
import { registerMockPaymentRoutes } from "./api/mock-payments";

import { registerUploadRoutes } from "./api/upload";
import { storage } from "./storage";
import mongoose from "mongoose";

// Global WebSocket server instance for notifications
export let wss: WebSocketServer;
export const clients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Add health check route for diagnostics
  app.get('/api/healthcheck', async (req, res) => {
    try {
      // Check MongoDB connection
      const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      // Basic system info
      const healthInfo = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: {
          status: mongoStatus,
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        },
        memory: process.memoryUsage(),
        node: {
          version: process.version,
        }
      };
      
      res.json(healthInfo);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Special diagnostic route for appointments
  app.get('/api/diagnose/appointments', async (req, res) => {
    try {
      console.log('Running appointments diagnostics');
      
      // Check MongoDB connection
      const mongodbConnection = {
        readyState: mongoose.connection.readyState,
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
      
      // Try to import the Appointment model directly here to check
      let appointmentModel = null;
      let modelError = null;
      
      try {
        const Appointment = require('../models/Appointment').default;
        appointmentModel = !!Appointment ? 'loaded' : 'missing';
      } catch (err) {
        modelError = err instanceof Error ? err.message : 'Unknown error';
      }
      
      // Try to do a simple count query
      let appointmentsCount = null;
      let queryError = null;
      
      try {
        if (appointmentModel === 'loaded') {
          const Appointment = require('../models/Appointment').default;
          appointmentsCount = await Appointment.countDocuments().exec();
        }
      } catch (err) {
        queryError = err instanceof Error ? err.message : 'Unknown error';
      }
      
      const diagnosticInfo = {
        timestamp: new Date().toISOString(),
        mongodb: mongodbConnection,
        appointmentModel: {
          status: appointmentModel,
          error: modelError
        },
        appointmentsQuery: {
          success: appointmentsCount !== null,
          count: appointmentsCount,
          error: queryError
        }
      };
      
      console.log('Appointments diagnostic results:', JSON.stringify(diagnosticInfo, null, 2));
      res.json(diagnosticInfo);
    } catch (error) {
      console.error('Appointments diagnostics failed:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // setup auth routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // register API routes - Admin routes first to ensure they take precedence
  registerAdminRoutes(app);
  registerDoctorRoutes(app);
  registerTreatmentRoutes(app);
  registerArticleRoutes(app);
  registerAppointmentRoutes(app);
  registerUploadRoutes(app);
  
  // Only using mock payment routes for simplicity and reliability
  console.log('Setting up mock payment routes exclusively');
  registerMockPaymentRoutes(app);
  
 
  
  // Special route to initialize some treatments (temporary)
  app.post("/api/admin/initialize-treatments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Create sample treatments
      const treatments = await Promise.all([
        storage.createTreatment({
          name: "Panchakarma",
          description: "A five-fold detoxification treatment to remove toxins and restore balance to the body's systems.",
          imageUrl: "https://images.unsplash.com/photo-1545620783-8356e780469d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          category: "Detoxification",
          benefits: ["Removes toxins", "Restores balance", "Improves immunity"],
          relatedMedicines: ["Triphala", "Castor oil"]
        }),
        storage.createTreatment({
          name: "Abhyanga",
          description: "A full-body massage with herb-infused oils to improve circulation and promote relaxation.",
          imageUrl: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          category: "Massage",
          benefits: ["Improves circulation", "Promotes relaxation", "Relieves muscle tension"],
          relatedMedicines: ["Sesame oil", "Coconut oil"]
        }),
        storage.createTreatment({
          name: "Shirodhara",
          description: "A gentle pouring of warm oil over the forehead to calm the nervous system and enhance mental clarity.",
          imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          category: "Mental Wellness",
          benefits: ["Calms nervous system", "Enhances mental clarity", "Reduces anxiety"],
          relatedMedicines: ["Brahmi oil", "Ashwagandha oil"]
        })
      ]);
      
      res.status(201).json({
        message: "Treatments initialized successfully",
        count: treatments.length,
        treatments
      });
    } catch (error) {
      console.error("Error initializing treatments:", error);
      res.status(500).json({ 
        message: "Failed to initialize treatments",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Special route to initialize some doctors (temporary)
  app.post("/api/admin/initialize-doctors", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Create sample doctors with the fixed numeric ID for admin user
      const doctors = await Promise.all([
        storage.createDoctor({
          name: "Dr. Anand Sharma",
          specialty: "Ayurvedic Medicine",
          location: "Mumbai",
          address: "123 Wellness Street, Mumbai, India",
          bio: "Dr. Anand Sharma is an experienced Ayurvedic physician with over 15 years of practice specializing in traditional healing methods.",
          contactNumber: "+91 9876543210",
          email: "dr.anand@ayurcura.com",
          latitude: "19.0760",
          longitude: "72.8777",
          availability: ["Monday", "Wednesday", "Friday"],
          createdBy: 1
        }),
        storage.createDoctor({
          name: "Dr. Priya Patel",
          specialty: "Panchakarma",
          location: "Delhi",
          address: "456 Ayurveda Plaza, Delhi, India",
          bio: "Dr. Priya Patel is a specialist in Panchakarma detoxification treatments with a focus on chronic conditions.",
          contactNumber: "+91 9876543211",
          email: "dr.priya@ayurcura.com",
          latitude: "28.6139",
          longitude: "77.2090",
          availability: ["Tuesday", "Thursday", "Saturday"],
          createdBy: 1
        }),
        storage.createDoctor({
          name: "Dr. Rajesh Kumar",
          specialty: "Herbal Medicine",
          location: "Bangalore",
          address: "789 Health Center, Bangalore, India",
          bio: "Dr. Rajesh Kumar specializes in herbal formulations tailored to individual constitutions.",
          contactNumber: "+91 9876543212",
          email: "dr.rajesh@ayurcura.com",
          latitude: "12.9716",
          longitude: "77.5946",
          availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          createdBy: 1
        })
      ]);
      
      res.status(201).json({
        message: "Doctors initialized successfully",
        count: doctors.length,
        doctors
      });
    } catch (error) {
      console.error("Error initializing doctors:", error);
      res.status(500).json({ 
        message: "Failed to initialize doctors",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time notifications
  wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add ping/pong to detect dropped connections
    clientTracking: true,
  });
  
  // Set up ping/pong interval to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000); // Send ping every 30 seconds

  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Handle user authentication and store client connection
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // If the message contains a userId, store the connection
        if (data.type === 'auth' && data.userId) {
          const userId = data.userId;
          
          // If we already have a connection for this user, close it first
          const existingConnection = clients.get(userId);
          if (existingConnection && existingConnection !== ws && existingConnection.readyState === WebSocket.OPEN) {
            existingConnection.close();
          }
          
          console.log(`WebSocket client authenticated: User ${userId}`);
          clients.set(userId, ws);
          
          // Send a confirmation
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Respond to pong (useful for debugging connection issues)
    ws.on('pong', () => {
      // Connection is still alive
    });
    
    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    // Remove client on disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Find and remove client from the map
      // Convert entries to array first to fix TypeScript error
      Array.from(clients.entries()).forEach(([userId, client]) => {
        if (client === ws) {
          clients.delete(userId);
          console.log(`Removed client for user ${userId}`);
        }
      });
    });
  });

  return httpServer;
}
