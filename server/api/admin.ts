import { Express, Request, Response } from 'express';
import Doctor from '../models/Doctor';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Treatment from '../models/Treatment';
import multer from 'multer';
import path from 'path';

// Configure multer for storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Set up multer with our configuration
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Helper function to generate URL for uploaded files
const getUploadedFileUrl = (filename: string): string => {
  // Make sure the URL is properly formed for the client to access
  return `/uploads/${filename}`;
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  console.log('Admin check for user:', req.user);
  if (req.isAuthenticated() && req.user && ((req.user as any).role === 'admin')) {
    console.log('Admin access granted');
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

export function registerAdminRoutes(app: Express) {
  // Protect all admin routes
  app.use('/api/admin', isAdmin);
  
  // Get all users (admin only)
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      console.log('Admin access granted to:', (req.user as any).username);
      // Only return necessary fields to improve performance
      const users = await User.find({}, 'username email fullName role createdAt').sort({ createdAt: -1 }).lean();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  // Get all doctors (admin view)
  app.get('/api/admin/doctors', async (req: Request, res: Response) => {
    try {
      // Use field selection and lean() for better performance
      const doctors = await Doctor.find()
        .select('id name specialty location imageUrl consultationFee yearsOfExperience createdAt')
        .sort({ createdAt: -1 })
        .lean();
      
      console.log('Admin fetching doctors:', doctors.length);
      
      // Add cache-control header for better performance
      res.set('Cache-Control', 'private, max-age=30'); // Cache for 30 seconds for admin users
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Error fetching doctors' });
    }
  });

  // Add a new doctor
  app.post('/api/admin/doctors', upload.single('imageFile'), async (req: Request, res: Response) => {
    try {
      // Find the highest doctor ID and increment by 1
      const highestDoctor = await Doctor.findOne().sort({ id: -1 }).select('id');
      const nextId = highestDoctor ? (highestDoctor.id || 0) + 1 : 1;

      // Convert string numbers to actual numbers
      const doctorData = {
        ...req.body,
        id: nextId, // Set the ID explicitly
        consultationFee: Number(req.body.consultationFee),
        yearsOfExperience: Number(req.body.yearsOfExperience)
      };

      // Handle uploaded file if present
      if (req.file) {
        const uploadedFileUrl = getUploadedFileUrl(req.file.filename);
        doctorData.imageUrl = uploadedFileUrl;
      }

      console.log('Creating doctor with data:', doctorData);
      const newDoctor = new Doctor(doctorData);
      await newDoctor.save();
      res.status(201).json(newDoctor);
    } catch (error: any) {
      console.error('Error creating doctor:', error);
      
      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A doctor with this email already exists' });
      }
      
      res.status(500).json({ message: 'Error creating doctor' });
    }
  });

  // Update a doctor
  app.patch('/api/admin/doctors/:id', upload.single('imageFile'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Convert string numbers to actual numbers if they exist
      const updateData = { ...req.body };
      // Don't update the ID field
      delete updateData.id;
      
      if (updateData.consultationFee) {
        updateData.consultationFee = Number(updateData.consultationFee);
      }
      if (updateData.yearsOfExperience) {
        updateData.yearsOfExperience = Number(updateData.yearsOfExperience);
      }

      // Handle uploaded file if present
      if (req.file) {
        const uploadedFileUrl = getUploadedFileUrl(req.file.filename);
        updateData.imageUrl = uploadedFileUrl;
      }

      console.log('Updating doctor with data:', updateData);
      
      // First find the doctor to get the correct MongoDB ID
      let doctor;
      try {
        // Try to find by MongoDB _id
        doctor = await Doctor.findById(id);
      } catch (err) {
        // If an error occurs (likely due to invalid ObjectId format), try by numeric id
        console.log('Error finding doctor by MongoDB ID, trying numeric ID');
      }
      
      // If not found by MongoDB _id, try numeric id
      if (!doctor) {
        doctor = await Doctor.findOne({ id: Number(id) });
      }
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      const doctorMongoId = (doctor as { _id: any })._id.toString();

      console.log(`Found doctor with MongoDB ID ${doctorMongoId} and numeric ID ${doctor.id}`);
      
      // Update using the MongoDB _id for consistency
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorMongoId, 
        updateData, 
        { new: true, runValidators: true }
      );

      if (!updatedDoctor) {
        return res.status(404).json({ message: 'Doctor not found during update' });
      }

      res.json(updatedDoctor);
    } catch (error: any) {
      console.error('Error updating doctor:', error);
      
      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A doctor with this email already exists' });
      }
      
      res.status(500).json({ message: 'Error updating doctor' });
    }
  });

  // Delete a doctor
  app.delete('/api/admin/doctors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // First, try to find the doctor to get both IDs
      let doctor;
      try {
        doctor = await Doctor.findById(id);
      } catch (err) {
        // If there's an error with ObjectId format, try numeric id
        doctor = await Doctor.findOne({ id: Number(id) });
      }
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
     const doctorMongoId = (doctor as { _id: any })._id.toString();

      const doctorNumericId = doctor.id;
      
      // Check if the doctor has any appointments using MongoDB _id
      console.log(`Checking appointments for doctor MongoDB ID: ${doctorMongoId} and numeric ID: ${doctorNumericId}`);
      
      // Check appointments with either MongoDB _id or numeric id
      const appointmentCount = await Appointment.countDocuments({
        $or: [
          { 'doctorId': doctorMongoId },
          { 'doctorId._id': doctorMongoId }
        ]
      });
      
      if (appointmentCount > 0) {
        return res.status(400).json({
          message: 'Cannot delete doctor with existing appointments. Please cancel or reassign appointments first.'
        });
      }

      // Delete the doctor using the MongoDB _id
      const deletedDoctor = await Doctor.findByIdAndDelete(doctorMongoId);
      
      if (!deletedDoctor) {
        return res.status(404).json({ message: 'Doctor not found during deletion' });
      }

      res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      res.status(500).json({ message: 'Error deleting doctor' });
    }
  });

  // Get all treatments (admin view)
  app.get('/api/admin/treatments', async (req: Request, res: Response) => {
    try {
      // Use lean() for better performance
      const treatments = await Treatment.find()
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Admin fetching treatments: ${treatments.length}`);
      
      // Add cache-control header for better performance
      res.set('Cache-Control', 'private, max-age=30'); // Cache for 30 seconds
      res.json(treatments);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      res.status(500).json({ message: 'Error fetching treatments' });
    }
  });
  
  // Get a single treatment by ID
  app.get('/api/admin/treatments/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Find treatment by MongoDB _id or numeric id
      let treatment;
      try {
        treatment = await Treatment.findById(id);
      } catch (err) {
        console.log('Error finding treatment by MongoDB ID, trying numeric ID');
      }
      
      // If not found by MongoDB _id, try by numeric id
      if (!treatment) {
        treatment = await Treatment.findOne({ id: Number(id) });
      }
      
      if (!treatment) {
        return res.status(404).json({ message: 'Treatment not found' });
      }
      
      res.json(treatment);
    } catch (error) {
      console.error('Error fetching treatment:', error);
      res.status(500).json({ message: 'Error fetching treatment' });
    }
  });
  
  // Add a new treatment
  app.post('/api/admin/treatments', upload.single('imageFile'), async (req: Request, res: Response) => {
    try {
      console.log('Received treatment creation request:', {
        body: req.body,
        filePresent: !!req.file,
        file: req.file ? `File uploaded: ${req.file.filename}` : 'No file uploaded'
      });
      
      // Detailed logging of request body
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request body complete:', JSON.stringify(req.body, null, 2));
      
      // First check if the user has the necessary permissions
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Debugging form data with more details
      console.log('Form data analysis:');
      console.log('- name:', req.body.name, typeof req.body.name);
      console.log('- category:', req.body.category, typeof req.body.category);
      console.log('- description:', req.body.description, typeof req.body.description);
      console.log('- imageUrl:', req.body.imageUrl, typeof req.body.imageUrl);
      console.log('- benefits:', req.body.benefits, typeof req.body.benefits);
      console.log('- relatedMedicines:', req.body.relatedMedicines, typeof req.body.relatedMedicines);
      
      // Parse the benefits and related medicines from JSON strings to arrays
      let benefits: string[] = [];
      let relatedMedicines: string[] = [];
      
      try {
        benefits = req.body.benefits ? JSON.parse(req.body.benefits) : [];
        console.log('Parsed benefits:', benefits);
      } catch (e) {
        console.error('Error parsing benefits:', e);
        benefits = Array.isArray(req.body.benefits) ? req.body.benefits : [];
      }
      
      try {
        relatedMedicines = req.body.relatedMedicines ? JSON.parse(req.body.relatedMedicines) : [];
        console.log('Parsed related medicines:', relatedMedicines);
      } catch (e) {
        console.error('Error parsing related medicines:', e);
        relatedMedicines = Array.isArray(req.body.relatedMedicines) ? req.body.relatedMedicines : [];
      }
      
      // Find the highest treatment ID and increment by 1
      const highestTreatment = await Treatment.findOne().sort({ id: -1 }).select('id');
      const nextId = highestTreatment ? (highestTreatment.id || 0) + 1 : 1;
      
      // Get image URL either from uploaded file or direct URL input
      let imageUrl = req.body.imageUrl || '';
      
      // Handle uploaded file if present - override imageUrl with the file path
      if (req.file) {
        console.log('File uploaded, generating URL for:', req.file.filename);
        imageUrl = getUploadedFileUrl(req.file.filename);
        console.log('Generated image URL:', imageUrl);
      }
      
      // Debug form values after processing
      console.log('Processed name:', req.body.name || 'MISSING');
      console.log('Processed category:', req.body.category || 'MISSING');
      console.log('Processed description:', req.body.description || 'MISSING');
      console.log('Processed imageUrl:', imageUrl || 'MISSING');
      
      // Ensure required fields have values
      const name = req.body.name || '';
      const category = req.body.category || '';
      const description = req.body.description || '';
      
      if (!name || !category || !description) {
        console.error('Required fields missing in form submission:',
          !name ? 'name is missing' : '',
          !category ? 'category is missing' : '',
          !description ? 'description is missing' : ''
        );
        return res.status(400).json({ 
          message: 'Required fields are missing', 
          missingFields: {
            name: !name,
            category: !category,
            description: !description
          }
        });
      }
      
      if (!imageUrl && !req.file) {
        console.error('Image URL is missing and no file was uploaded');
        return res.status(400).json({ message: 'An image URL or uploaded file is required' });
      }
      
      // Prepare treatment data
      const treatmentData = {
        id: nextId,
        name: name,
        category: category,
        description: description,
        imageUrl: imageUrl,
        benefits: benefits,
        relatedMedicines: relatedMedicines,
        createdAt: new Date()
      };
      
      console.log('Creating treatment with data:', treatmentData);
      
      // Create a new treatment document directly with the validated data
      const treatmentDoc = {
        id: nextId,
        name: name,
        category: category,
        description: description,
        imageUrl: imageUrl,
        benefits: benefits,
        relatedMedicines: relatedMedicines,
        createdAt: new Date()
      };

      console.log('Creating treatment with validated data:', JSON.stringify(treatmentDoc, null, 2));
      
      // Use create method instead of new/save to avoid potential validation issues
      const newTreatment = await Treatment.create(treatmentDoc);
      
      console.log('Treatment created successfully with ID:', newTreatment.id);
      
      // Invalidate cache to ensure fresh data is returned
      if (req.app.locals.treatmentsCache) {
        req.app.locals.treatmentsCache.timestamp = 0;
        req.app.locals.treatmentsCache.data = [];
      }
      
      // Also invalidate any other caches
      try {
        const treatmentModule = require('./treatments');
        if (treatmentModule.treatmentsCache) {
          treatmentModule.treatmentsCache.timestamp = 0;
          treatmentModule.treatmentsCache.data = [];
          console.log('Successfully invalidated treatments module cache');
        }
      } catch (cacheError) {
        console.error('Error clearing treatments module cache:', cacheError);
      }
      
      res.status(201).json(newTreatment);
    } catch (error: any) {
      console.error('Error creating treatment:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors: Record<string, string> = {};
        Object.keys(error.errors).forEach(key => {
          errors[key] = error.errors[key].message;
        });
        return res.status(400).json({ message: 'Validation Error', errors });
      }
      
      res.status(500).json({ message: 'Error creating treatment' });
    }
  });
  
  // Update a treatment
  app.patch('/api/admin/treatments/:id', upload.single('imageFile'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log('Received treatment update request:', {
        id,
        body: req.body,
        file: req.file ? `File uploaded: ${req.file.filename}` : 'No file uploaded'
      });
      
      // Parse arrays from JSON strings if present
      const updateData = { ...req.body };
      
      if (updateData.benefits) {
        updateData.benefits = JSON.parse(updateData.benefits);
      }
      
      if (updateData.relatedMedicines) {
        updateData.relatedMedicines = JSON.parse(updateData.relatedMedicines);
      }
      
      // Don't update the ID field
      delete updateData.id;
      
      // Handle uploaded file if present
      if (req.file) {
        console.log('File uploaded during update, generating URL for:', req.file.filename);
        const uploadedFileUrl = getUploadedFileUrl(req.file.filename);
        updateData.imageUrl = uploadedFileUrl;
        console.log('Generated image URL for update:', uploadedFileUrl);
      }
      
      console.log('Updating treatment with data:', updateData);
      
      // First find the treatment by ID
      let treatment;
      try {
        // Try to find by MongoDB _id
        treatment = await Treatment.findById(id);
      } catch (err) {
        // If an error occurs, try numeric id
        console.log('Error finding treatment by MongoDB ID, trying numeric ID');
      }
      
      // If not found by MongoDB _id, try numeric id
      if (!treatment) {
        treatment = await Treatment.findOne({ id: Number(id) });
      }
      
      if (!treatment) {
        return res.status(404).json({ message: 'Treatment not found' });
      }
      
      const treatmentMongoId = treatment._id.toString();
      console.log(`Found treatment with MongoDB ID ${treatmentMongoId} and numeric ID ${treatment.id}`);
      
      // Update using explicit property assignment instead of findByIdAndUpdate
      // This prevents issues with Mongoose validation during updates
      const treatmentToUpdate = await Treatment.findById(treatmentMongoId);
      
      if (!treatmentToUpdate) {
        return res.status(404).json({ message: 'Treatment not found during update preparation' });
      }
      
      // Explicitly set each property to avoid validation issues
      if (updateData.name) treatmentToUpdate.name = updateData.name;
      if (updateData.category) treatmentToUpdate.category = updateData.category;
      if (updateData.description) treatmentToUpdate.description = updateData.description;
      if (updateData.imageUrl) treatmentToUpdate.imageUrl = updateData.imageUrl;
      if (updateData.benefits) treatmentToUpdate.benefits = updateData.benefits;
      if (updateData.relatedMedicines) treatmentToUpdate.relatedMedicines = updateData.relatedMedicines;
      
      console.log('Treatment object before update save:', {
        id: treatmentToUpdate.id,
        name: treatmentToUpdate.name,
        category: treatmentToUpdate.category,
        description: treatmentToUpdate.description,
        imageUrl: treatmentToUpdate.imageUrl
      });
      
      // Save with full validation
      const updatedTreatment = await treatmentToUpdate.save();
      
      if (!updatedTreatment) {
        return res.status(404).json({ message: 'Treatment not found during update' });
      }
      
      // Invalidate cache to ensure fresh data is returned
      if (req.app.locals.treatmentsCache) {
        req.app.locals.treatmentsCache.timestamp = 0;
        req.app.locals.treatmentsCache.data = [];
      }
      
      // Also invalidate any other caches
      try {
        const treatmentModule = require('./treatments');
        if (treatmentModule.treatmentsCache) {
          treatmentModule.treatmentsCache.timestamp = 0;
          treatmentModule.treatmentsCache.data = [];
          console.log('Successfully invalidated treatments module cache');
        }
      } catch (cacheError) {
        console.error('Error clearing treatments module cache:', cacheError);
      }
      
      console.log('Treatment updated successfully:', updatedTreatment.name);
      res.json(updatedTreatment);
    } catch (error: any) {
      console.error('Error updating treatment:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors: Record<string, string> = {};
        Object.keys(error.errors).forEach(key => {
          errors[key] = error.errors[key].message;
        });
        return res.status(400).json({ message: 'Validation Error', errors });
      }
      
      res.status(500).json({ message: 'Error updating treatment' });
    }
  });
  
  // Delete a treatment - use this method instead of the one in treatments.ts
  app.delete('/api/admin/treatments/:id', async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      console.log(`Admin deleting treatment with parameter ID: ${idParam}, type: ${typeof idParam}`);
      
      let treatment;
      
      // Check if the ID is a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idParam);
      
      if (isValidObjectId) {
        // If it's a valid ObjectId, try to find the treatment by _id
        console.log('Finding treatment by MongoDB ObjectId');
        treatment = await Treatment.findById(idParam).exec();
      } else {
        // Otherwise, try to find by numeric id
        const numericId = Number(idParam);
        console.log('Finding treatment by numeric ID:', numericId);
        
        if (isNaN(numericId)) {
          // If it's not a number and not a valid ObjectId, it might be a name
          console.log('ID is not numeric and not a valid ObjectId, searching by name');
          treatment = await Treatment.findOne({ 
            name: { $regex: new RegExp(decodeURIComponent(idParam), 'i') } 
          }).exec();
        } else {
          treatment = await Treatment.findOne({ id: numericId }).exec();
        }
      }
      
      if (!treatment) {
        console.log(`Treatment with ID ${idParam} not found in database`);
        return res.status(404).json({ message: `Treatment with id ${idParam} not found` });
      }
      
      // Log the found treatment for debugging
      console.log('Found treatment for deletion:', {
        name: treatment.name,
        id: treatment.id,
        _id: treatment._id.toString(),
        mongoId: treatment._id
      });
      
      // Attempt multiple deletion methods to ensure success
      let deleteResult;
      
      try {
        // First try deleting by MongoDB ObjectId
        deleteResult = await Treatment.findByIdAndDelete(treatment._id);
        console.log('Deletion result using findByIdAndDelete:', !!deleteResult);
        
        if (!deleteResult) {
          // If that fails, try deleteOne with ObjectId criteria
          const deleteOneResult = await Treatment.deleteOne({ _id: treatment._id });
          console.log('Deletion result using deleteOne with _id:', deleteOneResult);
          
          if (deleteOneResult.deletedCount === 0) {
            // Last resort: try deleting by numeric id if available
            const deleteByNumericId = await Treatment.deleteOne({ id: treatment.id });
            console.log('Deletion result using deleteOne with numeric id:', deleteByNumericId);
            
            if (deleteByNumericId.deletedCount === 0) {
              throw new Error('All deletion attempts failed');
            }
          }
        }
      } catch (deleteError) {
        console.error('Error during treatment deletion:', deleteError);
        throw deleteError;
      }
      
      // Clear treatment cache to make sure changes are reflected
      console.log('Invalidating treatment cache after deletion');
      if (req.app.locals.treatmentsCache) {
        req.app.locals.treatmentsCache.timestamp = 0;
        req.app.locals.treatmentsCache.data = [];
      }
      
      // Also clear our local cache from treatments.ts
      try {
        const treatmentModule = require('./treatments');
        if (treatmentModule.treatmentsCache) {
          treatmentModule.treatmentsCache.timestamp = 0;
          treatmentModule.treatmentsCache.data = [];
          console.log('Successfully invalidated treatments module cache');
        }
      } catch (cacheError) {
        console.error('Error clearing treatments module cache:', cacheError);
        // Non-critical error, continue with response
      }
      
      // Return success
      console.log(`Successfully deleted treatment: ${treatment.name}`);
      res.json({ message: 'Treatment deleted successfully' });
    } catch (error) {
      console.error('Error deleting treatment:', error);
      res.status(500).json({ message: 'Error deleting treatment', error: String(error) });
    }
  });
  
  // Get admin dashboard stats
  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
      // Execute all queries in parallel for better performance
      const [
        totalDoctors,
        totalPatients,
        appointmentsByStatus,
        recentAppointments
      ] = await Promise.all([
        Doctor.countDocuments(),
        User.countDocuments({ role: 'user' }),
        // Use aggregation to count appointments by status in a single query
        Appointment.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Appointment.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('doctorId', 'name specialty')
          .populate('userId', 'username email')
          .lean()
      ]);

      // Process appointment status counts
      const appointmentStats = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      };
      
      let totalAppointments = 0;
      appointmentsByStatus.forEach((statusGroup: { _id: string, count: number }) => {
        if (statusGroup._id in appointmentStats) {
          appointmentStats[statusGroup._id as keyof typeof appointmentStats] = statusGroup.count;
          totalAppointments += statusGroup.count;
        }
      });

      // Add cache-control headers to improve performance
      res.set('Cache-Control', 'private, max-age=30'); // Cache for 30 seconds
      
      res.json({
        totalDoctors,
        totalPatients,
        totalAppointments,
        appointmentStats,
        recentAppointments
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin statistics' });
    }
  });
}