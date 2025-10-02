import { Express } from "express";
import { storage } from "../storage";
import { insertTreatmentSchema, mongoInsertTreatmentSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import Treatment from "../models/Treatment";
import mongoose from "mongoose";

// Define Wikipedia API response interfaces
interface WikipediaPageThumbnail {
  source: string;
  width: number;
  height: number;
}

interface WikipediaContentUrls {
  desktop: {
    page: string;
    revisions: string;
    edit: string;
    talk: string;
  };
  mobile: {
    page: string;
    revisions: string;
    edit: string;
    talk: string;
  };
}

interface WikipediaPageSummary {
  type: string;
  title: string;
  displaytitle: string;
  namespace: { id: number; text: string };
  wikibase_item: string;
  pageid: number;
  thumbnail?: WikipediaPageThumbnail;
  originalimage?: WikipediaPageThumbnail;
  lang: string;
  dir: string;
  revision: string;
  tid: string;
  timestamp: string;
  description?: string;
  description_source?: string;
  content_urls: WikipediaContentUrls;
  extract: string;
  extract_html: string;
}

// Cache for Ayurvedic treatments
export const treatmentsCache: {
  timestamp: number;
  data: WikiTreatment[];
} = {
  timestamp: 0,
  data: []
};

// Cache duration (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

// Wikipedia search terms for Ayurvedic treatments
const AYURVEDIC_TREATMENT_TERMS = [
  "Panchakarma", "Abhyanga", "Shirodhara", "Nasya", "Udvartana",
  "Ayurvedic_massage", "Basti_(Ayurveda)", "Rasayana", "Virechana",
  "Ayurvedic_treatments", "Swedana", "Pinda_Sweda"
];

// Define treatment interface
interface WikiTreatment {
  id: number | string;
  name: string;
  category: string;
  description: string;
  fullContent: string;
  benefits: string[];
  imageUrl: string;
  source: string;
  sourceUrl: string;
}

// Function to sync a treatment to MongoDB
async function syncTreatmentToMongoDB(wikiTreatment: WikiTreatment): Promise<void> {
  try {
    // Check if treatment already exists in MongoDB by ID or name
    const existingTreatment = await Treatment.findOne({
      $or: [
        { id: Number(wikiTreatment.id) },
        { name: wikiTreatment.name }
      ]
    });
    
    if (existingTreatment) {
      // Treatment exists, update it
      console.log(`Updating existing treatment in MongoDB: ${wikiTreatment.name}`);
      await Treatment.updateOne(
        { _id: existingTreatment._id },
        {
          name: wikiTreatment.name,
          description: wikiTreatment.description,
          benefits: wikiTreatment.benefits,
          imageUrl: wikiTreatment.imageUrl,
          category: wikiTreatment.category,
          relatedMedicines: [] // Optional field
        }
      );
    } else {
      // Create new treatment
      console.log(`Creating new treatment in MongoDB: ${wikiTreatment.name}`);
      const newTreatment = new Treatment({
        id: Number(wikiTreatment.id),
        name: wikiTreatment.name,
        description: wikiTreatment.description,
        benefits: wikiTreatment.benefits,
        imageUrl: wikiTreatment.imageUrl,
        category: wikiTreatment.category,
        relatedMedicines: []
      });
      
      await newTreatment.save();
    }
  } catch (error) {
    console.error(`Error syncing treatment to MongoDB: ${wikiTreatment.name}`, error);
  }
}

// Function to fetch Ayurvedic treatments from Wikipedia
async function fetchAyurvedicTreatmentsFromWikipedia(): Promise<WikiTreatment[]> {
  try {
    // Check if cache is still valid
    if (treatmentsCache.data.length > 0 && 
        Date.now() - treatmentsCache.timestamp < CACHE_DURATION) {
      console.log("Using cached treatment data");
      return treatmentsCache.data;
    }
    
    console.log("Fetching Ayurvedic treatments from Wikipedia");
    const treatments: WikiTreatment[] = [];
    
    // Fetch data for each treatment term
    for (const term of AYURVEDIC_TREATMENT_TERMS) {
      try {
        // First try to get the exact Wikipedia page
        const pageResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${term}`,
          { 
            headers: {
              "User-Agent": "AyurCuraHealth/1.0 (ayurveda health app)",
              "Accept": "application/json"
            }
          }
        );
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json() as WikipediaPageSummary;
          
          // Only add if it contains content
          if (pageData.extract && pageData.title) {
            // Split the extract to get benefits
            const extract = pageData.extract;
            const sentences = extract.split(/\.\s+/);
            const benefits = sentences
              .filter((s: string) => 
                s.toLowerCase().includes("benefit") || 
                s.toLowerCase().includes("help") || 
                s.toLowerCase().includes("treat") ||
                s.toLowerCase().includes("heal") ||
                s.toLowerCase().includes("improve")
              )
              .slice(0, 3);
              
            // Create treatment object
            const treatment = {
              id: pageData.pageid || Math.floor(Math.random() * 10000),
              name: pageData.title,
              category: "Ayurvedic Therapy",
              description: pageData.extract.substring(0, 300) + (pageData.extract.length > 300 ? "..." : ""),
              fullContent: pageData.extract,
              benefits: benefits.length > 0 ? benefits : ["Promotes overall wellness", "Traditional Ayurvedic therapy"],
              imageUrl: pageData.thumbnail?.source || `https://source.unsplash.com/featured/?ayurveda,${encodeURIComponent(pageData.title)}`,
              source: "wikipedia",
              sourceUrl: pageData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageData.title)}`
            };
            
            // Add to treatments list
            treatments.push(treatment);
            
            // Sync to MongoDB in background
            syncTreatmentToMongoDB(treatment).catch(err => {
              console.error(`Background sync error for ${treatment.name}:`, err);
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching treatment data for ${term}:`, err);
        // Continue with next term
      }
      
      // Short delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Found ${treatments.length} Ayurvedic treatments`);
    
    // Update cache
    treatmentsCache.data = treatments;
    treatmentsCache.timestamp = Date.now();
    
    return treatments;
  } catch (error) {
    console.error("Error fetching Ayurvedic treatments:", error);
    // Return empty array or cached data if available
    return treatmentsCache.data.length > 0 ? treatmentsCache.data : [];
  }
}

// Function to get all treatments stored in MongoDB
async function getMongoTreatments(): Promise<any[]> {
  try {
    // Try to find treatments in MongoDB first
    const mongoTreatments = await Treatment.find().lean();
    
    if (mongoTreatments && mongoTreatments.length > 0) {
      console.log(`Found ${mongoTreatments.length} treatments in MongoDB`);
      return mongoTreatments;
    }
    
    // If no treatments in MongoDB, fetch from Wikipedia and sync
    console.log("No treatments found in MongoDB, fetching from Wikipedia");
    return []; // Return empty array, Wikipedia treatments will be fetched and synced separately
  } catch (error) {
    console.error("Error fetching treatments from MongoDB:", error);
    return [];
  }
}

// Function to initialize treatments database by syncing from Wikipedia
async function initializeTreatmentsIfNeeded(): Promise<void> {
  try {
    // Check if we already have treatments in MongoDB
    const count = await Treatment.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} treatments, skipping initialization`);
      return;
    }
    
    console.log("Initializing treatments database from Wikipedia");
    // Fetch and sync Wikipedia treatments
    await fetchAyurvedicTreatmentsFromWikipedia();
    console.log("Treatments database initialized");
  } catch (error) {
    console.error("Error initializing treatments database:", error);
  }
}

export function registerTreatmentRoutes(app: Express) {
  // Initialize treatments on startup
  initializeTreatmentsIfNeeded().catch(err => {
    console.error("Failed to initialize treatments database:", err);
  });

  // Get all treatments
  app.get("/api/treatments", async (req, res, next) => {
    try {
      let treatments = [];
      
      // First check MongoDB for treatments
      const mongoTreatments = await getMongoTreatments();
      
      // If MongoDB has treatments, use those
      if (mongoTreatments && mongoTreatments.length > 0) {
        treatments = mongoTreatments;
        console.log(`Serving ${treatments.length} treatments from MongoDB`);
      } else {
        // If MongoDB has no treatments, fetch from Wikipedia
        const wikiTreatments = await fetchAyurvedicTreatmentsFromWikipedia();
        if (wikiTreatments && wikiTreatments.length > 0) {
          treatments = wikiTreatments;
          console.log(`Serving ${treatments.length} treatments from Wikipedia`);
        }
      }
      
      // Apply limit if specified
      if (req.query.limit) {
        const limit = parseInt(req.query.limit as string);
        treatments = treatments.slice(0, limit);
      }
      
      // Apply category filter if specified
      if (req.query.category && req.query.category !== 'all-categories') {
        treatments = treatments.filter(t => 
          t.category.toLowerCase().includes((req.query.category as string).toLowerCase())
        );
      }
      
      res.json(treatments);
    } catch (error) {
      console.error("Error fetching treatments:", error);
      next(error);
    }
  });

  // Get a specific treatment
  app.get("/api/treatments/:id", async (req, res, next) => {
    try {
      const id = req.params.id;
      console.log(`Fetching treatment with id: ${id}`);
      
      // First check cache for all treatments (from Wikipedia)
      const cachedTreatments = treatmentsCache.data;
      
      // Try to find treatment by ID in cache first (handle both string and number IDs)
      let treatment = cachedTreatments.find(t => String(t.id) === String(id));
      
      // If found in cache, return it
      if (treatment) {
        console.log(`Found treatment in cache: ${treatment.name}`);
        return res.json(treatment);
      }
      
      // If not found in cache, check if it's a number (coming from database)
      if (!isNaN(parseInt(id))) {
        // Try database lookup 
        const dbTreatment = await storage.getTreatment(parseInt(id));
        
        if (dbTreatment) {
          console.log(`Found treatment in database: ${dbTreatment.name}`);
          return res.json(dbTreatment);
        }
      }
      
      // If not in cache or database, try to fetch directly from Wikipedia by name
      try {
        // Decode the ID in case it's a URL-encoded name
        const decodedId = decodeURIComponent(id);
        
        const pageResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(decodedId)}`,
          { 
            headers: {
              "User-Agent": "AyurCuraHealth/1.0 (ayurveda health app)",
              "Accept": "application/json"
            }
          }
        );
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json() as WikipediaPageSummary;
          
          // Only proceed if it contains content
          if (pageData.extract && pageData.title) {
            console.log(`Found treatment from Wikipedia API: ${pageData.title}`);
            
            // Split the extract to get benefits
            const extract = pageData.extract;
            const sentences = extract.split(/\.\s+/);
            const benefits = sentences
              .filter((s: string) => 
                s.toLowerCase().includes("benefit") || 
                s.toLowerCase().includes("help") || 
                s.toLowerCase().includes("treat") ||
                s.toLowerCase().includes("heal") ||
                s.toLowerCase().includes("improve")
              )
              .slice(0, 3);
              
            // Create treatment object
            const treatment: WikiTreatment = {
              id: pageData.pageid || id,
              name: pageData.title,
              category: "Ayurvedic Therapy",
              description: pageData.extract.substring(0, 300) + (pageData.extract.length > 300 ? "..." : ""),
              fullContent: pageData.extract,
              benefits: benefits.length > 0 ? benefits : ["Promotes overall wellness", "Traditional Ayurvedic therapy"],
              imageUrl: pageData.thumbnail?.source || `https://source.unsplash.com/featured/?ayurveda,${encodeURIComponent(pageData.title)}`,
              source: "wikipedia",
              sourceUrl: pageData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageData.title)}`
            };
            
            return res.json(treatment);
          }
        }
        
        console.log(`Treatment not found for ID: ${id}`);
        return res.status(404).json({ message: "Treatment not found" });
      } catch (err) {
        console.error("Error fetching treatment:", err);
        return res.status(500).json({ message: "Error fetching treatment details" });
      }
    } catch (error) {
      console.error("Error in treatment detail route:", error);
      next(error);
    }
  });

  // IMPORTANT: This route is NOT USED - see admin.ts for file upload implementation
  // The actual route used for treatment creation is in admin.ts with upload.single('imageFile')
  // This endpoint is kept for API compatibility but redirects to the proper endpoint
  app.post("/api/admin/treatments", (req, res) => {
    // Redirect to the actual implementation in admin.ts
    console.log("Treatment creation request received on non-file upload endpoint");
    console.log("This endpoint does not support multipart form data with file uploads");
    console.log("Redirecting to correct endpoint");
    
    res.status(400).json({
      message: "Please use the endpoint with file upload support in admin.ts",
      error: "Wrong API endpoint used for file upload"
    });
  });
  
  // Admin: Update an existing treatment
  app.patch("/api/admin/treatments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      console.log(`Updating treatment with id: ${id}, data:`, req.body);
      
      // Manual validation for MongoDB compatibility
      const validatedData = {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.description && { description: req.body.description }),
        ...(req.body.benefits && { benefits: Array.isArray(req.body.benefits) ? req.body.benefits : [] }),
        ...(req.body.imageUrl && { imageUrl: req.body.imageUrl }),
        ...(req.body.category && { category: req.body.category }),
        ...(req.body.relatedMedicines && { relatedMedicines: Array.isArray(req.body.relatedMedicines) ? req.body.relatedMedicines : [] })
      };
      
      // Make sure we're not submitting an empty object
      if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      console.log("Validated treatment update data:", validatedData);
      
      const updatedTreatment = await storage.updateTreatment(id, validatedData);
      
      // Clear the Wikipedia cache to make sure our database changes are reflected
      treatmentsCache.timestamp = 0;
      treatmentsCache.data = [];
      
      res.json(updatedTreatment);
    } catch (error) {
      console.error("Error updating treatment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });
  
  // Admin: Delete a treatment endpoint moved to admin.ts
}
