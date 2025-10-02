import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {
      // Add potential MongoDB document methods
      toObject?: () => any;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Make sure we have a valid stored password
  if (!stored || !stored.includes(".")) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  
  // Additional validation to prevent errors
  if (!hashed || !salt) {
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ayurcura-secret-key",
    resave: true, // Changed to true to ensure session is saved
    saveUninitialized: true, // Allow saving uninitialized sessions
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: maxAge,
      path: '/'
    }
  };
  console.log('Setting up session with cookie maxAge:', maxAge);

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Make sure we have a username and password
        if (!username || !password) {
          return done(null, false, { message: 'Missing credentials' });
        }
        
        // We're going to use a direct MongoDB query instead of the storage interface
        // This is specifically for login due to MongoDB document format considerations
        try {
          const { MongoClient } = await import('mongodb');
          const client = new MongoClient(process.env.MONGODB_URI!);
          await client.connect();
          
          console.log('Connected to MongoDB for direct auth');
          const db = client.db();
          const usersCollection = db.collection('users');
          
          // Find user by username
          const mongoUser = await usersCollection.findOne({ username });
          
          await client.close();
          
          // If no user found, return error
          if (!mongoUser) {
            return done(null, false, { message: 'Invalid username' });
          }
          
          // Verify password
          const isValidPassword = await comparePasswords(password, mongoUser.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid password' });
          }
          
          // Create a usable user object for the session
          const sessionUser = {
            id: mongoUser._id.toString(), // Convert ObjectId to string
            _id: mongoUser._id,
            username: mongoUser.username || '',
            email: mongoUser.email || '',
            fullName: mongoUser.fullName || '',
            role: mongoUser.role || 'user',
            password: mongoUser.password || '',
            createdAt: mongoUser.createdAt || new Date(),
          };
          
          // Return user object
          return done(null, sessionUser);
        } catch (mongoError) {
          console.error('MongoDB direct query error:', mongoError);
          
          // Fall back to storage interface as backup
          const user = await storage.getUserByUsername(username);
          
          // If no user found, return error
          if (!user) {
            return done(null, false, { message: 'Invalid username' });
          }
          
          // Verify password
          const isValidPassword = await comparePasswords(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid password' });
          }
          
          // Create a plain JavaScript object with defined values for compatibility
          const plainUser = {
            id: user.id || (user._id ? user._id.toString() : ''),
            _id: user._id,
            username: user.username || '',
            email: user.email || '',
            fullName: user.fullName || '',
            role: user.role || 'user',
            password: user.password || '',
            createdAt: user.createdAt || new Date(),
          };
          
          // Return plain JavaScript object
          return done(null, plainUser);
        }
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: any, done) => {
    try {
      // Safely handle user serialization whether it's a MongoDB document or plain object
      // For MongoDB documents, convert to safe format
      let userToSerialize = user;
      
      // Check if it's a MongoDB document with _id
      if (user._id && !user.id) {
        userToSerialize = {
          ...user,
          id: user._id.toString() // Use _id as id if missing
        };
      }
      
      // Use username as the session key if id is still missing
      if (userToSerialize.id === undefined && userToSerialize.username) {
        return done(null, userToSerialize.username);
      } else if (userToSerialize.id !== undefined) {
        return done(null, userToSerialize.id);
      } else {
        return done(new Error('Cannot serialize user: no id or username found'), null);
      }
    } catch (error) {
      console.error('Serialization error:', error);
      done(error, null);
    }
  });
  
  passport.deserializeUser(async (idOrUsername: string | number, done) => {
    try {
      // Special handling for MongoDB - try direct query first
      if (typeof idOrUsername === 'string') {
        try {
          const { MongoClient, ObjectId } = await import('mongodb');
          const client = new MongoClient(process.env.MONGODB_URI!);
          await client.connect();
          
          console.log('Deserializing user with MongoDB, id:', idOrUsername);
          const db = client.db();
          const usersCollection = db.collection('users');
          
          let mongoUser;
          
          // Try to find by ObjectId first (assuming the ID is a valid ObjectId string)
          try {
            // Check if the ID is a valid MongoDB ObjectId
            if (ObjectId.isValid(idOrUsername) && idOrUsername.length === 24) {
              mongoUser = await usersCollection.findOne({ _id: new ObjectId(idOrUsername) });
            }
          } catch (err) {
            console.log('Not a valid ObjectId:', idOrUsername);
          }
          
          // If not found or not a valid ObjectId, try username
          if (!mongoUser && isNaN(Number(idOrUsername))) {
            mongoUser = await usersCollection.findOne({ username: idOrUsername });
          }
          
          await client.close();
          
          if (mongoUser) {
            // Found user in MongoDB
            const sessionUser = {
              id: mongoUser._id.toString(),
              _id: mongoUser._id,
              username: mongoUser.username || '',
              email: mongoUser.email || '',
              fullName: mongoUser.fullName || '',
              role: mongoUser.role || 'user',
              password: mongoUser.password || '',
              createdAt: mongoUser.createdAt || new Date(),
            };
            
            console.log('User deserialized from MongoDB:', mongoUser.username);
            return done(null, sessionUser);
          }
        } catch (mongoError) {
          console.error('MongoDB direct query error during deserialization:', mongoError);
          // Continue to fallback
        }
      }
      
      // Fallback to storage interface
      let user;
      
      // Check if we've serialized by username or id
      if (typeof idOrUsername === 'string' && isNaN(Number(idOrUsername))) {
        // This is a username
        user = await storage.getUserByUsername(idOrUsername);
      } else {
        // This is an ID (either number or string that can be converted to number)
        user = await storage.getUser(Number(idOrUsername));
      }
      
      // If no user found, return error
      if (!user) {
        console.error('User not found during deserialization:', idOrUsername);
        return done(null, false);
      }
      
      // Convert to simple object with fallbacks for MongoDB compatibility
      const plainUser = {
        id: user.id || (user._id ? user._id.toString() : undefined),
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        role: user.role || 'user',
        password: user.password || '', // Include password for proper typing
        createdAt: user.createdAt || new Date(),
      };
      
      done(null, plainUser);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, fullName, role = "user" } = req.body;

      if (!username || !password || !email || !fullName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role,
      });

      // Convert to simple object with fallbacks for MongoDB compatibility
      const plainUser = {
        id: user.id,
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        role: user.role || 'user',
        password: user.password || '',
        createdAt: user.createdAt || new Date(),
      };
      
      // Remove password from the response
      const userWithoutPassword = { ...plainUser, password: undefined };

      req.login(plainUser, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return next(err);
        }
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      // Use a Promise to ensure session is saved before responding
      const loginPromise = new Promise((resolve, reject) => {
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            reject(loginErr);
          } else {
            resolve(user);
          }
        });
      });
      
      loginPromise
        .then((user) => {
          // Explicitly save the session to ensure it's written to the store
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return next(saveErr);
            }
            
            console.log("Login successful, session saved for user:", user.username);
            
            // Remove password from the response
            const userWithoutPassword = { ...user, password: undefined };
            return res.status(200).json(userWithoutPassword);
          });
        })
        .catch(next);
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from the response
    const userWithoutPassword = { ...req.user, password: undefined };
    res.json(userWithoutPassword);
  });

  // Middleware to check if user is admin
  app.use("/api/admin/*", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      console.log('Admin route access denied - not authenticated');
      return res.status(401).json({ message: "You must be logged in" });
    }
    
    console.log('Admin route access attempt by:', req.user);
    
    // Double-check admin status directly from database for security
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      
      const db = client.db();
      const usersCollection = db.collection('users');
      
      // Find user by username
      const mongoUser = await usersCollection.findOne({ 
        $or: [
          { username: req.user.username },
          { _id: req.user._id } // Try ObjectId if available
        ]
      });
      
      await client.close();
      
      if (!mongoUser) {
        console.log('User not found in database during admin check');
        return res.status(403).json({ message: "Invalid user" });
      }
      
      if (mongoUser.role !== "admin") {
        console.log('Non-admin attempted to access admin route:', mongoUser.username);
        return res.status(403).json({ message: "Admin access required" });
      }
      
      console.log('Admin access granted to:', mongoUser.username);
      next();
    } catch (error) {
      console.error('Error during admin check:', error);
      
      // Fallback to regular check if MongoDB direct access fails
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    }
  });
}
