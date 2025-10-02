import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { storage } from "./storage";
import mongoose from "mongoose";
import path from "path";
import compression from "compression";

// Load environment variables
dotenv.config();

// Import the MongoDB connection function from models
import connectDB from "./models";

const app = express();

// Add compression middleware
app.use(compression());

// Optimize JSON parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Set security headers
app.use((req, res, next) => {
  // Set cache-control headers to improve performance
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Disable caching for API responses
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// Ensure uploads directory exists and serve it
import fs from "fs";
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  console.log(`Uploads directory configured: ${uploadsDir}`);
} catch (error) {
  console.error(`Error setting up uploads directory: ${error}`);
}

// Serve static files from the public/uploads directory with caching
app.use('/uploads', express.static(uploadsDir, {
  maxAge: 86400000 // 1 day cache
}));

// Minimal logging in production
const isProduction = app.get("env") === "production";
if (!isProduction) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        
        // Only log the response body in development for debugging
        if (capturedJsonResponse && process.env.NODE_ENV === 'development') {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });
}

(async () => {
  // Connect to MongoDB with optimized settings
  await connectDB();
  
  // Server is using in-memory storage as well as MongoDB
  
  const server = await registerRoutes(app);

  // Centralized error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Add proper logging in production
    if (isProduction && status === 500) {
      console.error('Server Error:', err);
    }

    res.status(status).json({ message });
    if (!isProduction) {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Always serve the app on port 5000 as required by Replit workflow
  // This is the port that's not firewalled
  const port = 5000;
  
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
