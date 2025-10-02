import { IStorage } from "./storage";
import { 
  User, InsertUser, 
  Doctor, InsertDoctor, 
  Review, InsertReview, 
  Treatment, InsertTreatment, 
  Appointment, InsertAppointment
} from "@shared/schema";
import connectDB, { 
  UserModel, 
  DoctorModel, 
  ReviewModel, 
  TreatmentModel, 
  AppointmentModel 
} from "./models";
import createMemoryStore from "memorystore";
import session from "express-session";

// Connect to MongoDB
connectDB().catch(err => console.error("Error connecting to MongoDB", err));

const MemoryStore = createMemoryStore(session);

export class MongoStorage implements IStorage {
  sessionStore: any; // Express session store
  
  // Counter for the ID field to ensure uniqueness while keeping the same interface
  userIdCounter: number = 1;
  doctorIdCounter: number = 1;
  reviewIdCounter: number = 1;
  treatmentIdCounter: number = 1;
  appointmentIdCounter: number = 1;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize counters by finding the highest existing IDs
    this.initializeCounters();
  }
  
  private async initializeCounters() {
    try {
      // Use Promise.all to run all queries in parallel for better performance
      const [highestUserID, highestDoctorID, highestReviewID, highestTreatmentID, highestAppointmentID] = 
        await Promise.allSettled([
          UserModel.findOne().sort({ id: -1 }).select('id').exec(),
          DoctorModel.findOne().sort({ id: -1 }).select('id').exec(),
          ReviewModel.findOne().sort({ id: -1 }).select('id').exec(),
          TreatmentModel.findOne().sort({ id: -1 }).select('id').exec(),
          AppointmentModel.findOne().sort({ id: -1 }).select('id').exec()
        ]);
      
      // Handle results safely, accounting for rejected promises
      this.userIdCounter = (highestUserID.status === 'fulfilled' && highestUserID.value) 
        ? Math.max(highestUserID.value.id + 1, 1000) : 1000;
      
      this.doctorIdCounter = (highestDoctorID.status === 'fulfilled' && highestDoctorID.value) 
        ? Math.max(highestDoctorID.value.id + 1, 1000) : 1000;
      
      this.reviewIdCounter = (highestReviewID.status === 'fulfilled' && highestReviewID.value) 
        ? Math.max(highestReviewID.value.id + 1, 1000) : 1000;
      
      this.treatmentIdCounter = (highestTreatmentID.status === 'fulfilled' && highestTreatmentID.value) 
        ? Math.max(highestTreatmentID.value.id + 1, 1000) : 1000;
      
      this.appointmentIdCounter = (highestAppointmentID.status === 'fulfilled' && highestAppointmentID.value) 
        ? Math.max(highestAppointmentID.value.id + 1, 1000) : 1000;
      
      console.log('Initialized counters:', {
        userIdCounter: this.userIdCounter,
        doctorIdCounter: this.doctorIdCounter,
        reviewIdCounter: this.reviewIdCounter,
        treatmentIdCounter: this.treatmentIdCounter,
        appointmentIdCounter: this.appointmentIdCounter
      });
    } catch (error) {
      console.error("Error initializing counters:", error);
      // Set safe default values in case of error
      this.userIdCounter = 10000;
      this.doctorIdCounter = 10000;
      this.reviewIdCounter = 10000;
      this.treatmentIdCounter = 10000;
      this.appointmentIdCounter = 10000;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).lean();
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    return user as User | undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    
    const newUser = new UserModel({
      id,
      createdAt,
      ...user
    });
    
    await newUser.save();
    return newUser.toObject() as User;
  }

  async getUsers(): Promise<User[]> {
    const users = await UserModel.find().lean();
    return users as User[];
  }

  // Doctor operations
  async getDoctor(id: number): Promise<Doctor | undefined> {
    const doctor = await DoctorModel.findOne({ id }).lean();
    return doctor as Doctor | undefined;
  }

  async getDoctors(): Promise<Doctor[]> {
    const doctors = await DoctorModel.find().lean();
    return doctors as Doctor[];
  }

  async getDoctorsByLocation(location: string): Promise<Doctor[]> {
    const doctors = await DoctorModel.find({ 
      location: { $regex: location, $options: 'i' } 
    }).lean();
    return doctors as Doctor[];
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    const doctors = await DoctorModel.find({ 
      specialty: { $regex: specialty, $options: 'i' } 
    }).lean();
    return doctors as Doctor[];
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorIdCounter++;
    const createdAt = new Date();
    
    const newDoctor = new DoctorModel({
      id,
      createdAt,
      ...doctor
    });
    
    await newDoctor.save();
    return newDoctor.toObject() as Doctor;
  }

  async updateDoctor(id: number, partialDoctor: Partial<Doctor>): Promise<Doctor> {
    const doctor = await DoctorModel.findOneAndUpdate(
      { id },
      { $set: partialDoctor },
      { new: true }
    ).lean();
    
    if (!doctor) {
      throw new Error(`Doctor with id ${id} not found`);
    }
    
    return doctor as Doctor;
  }

  async deleteDoctor(id: number): Promise<void> {
    const result = await DoctorModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      throw new Error(`Doctor with id ${id} not found`);
    }
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const review = await ReviewModel.findOne({ id }).lean();
    return review as Review | undefined;
  }

  async getReviewsByDoctor(doctorId: number): Promise<Review[]> {
    const reviews = await ReviewModel.find({ doctorId }).lean();
    return reviews as Review[];
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    const reviews = await ReviewModel.find({ userId }).lean();
    return reviews as Review[];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const createdAt = new Date();
    
    const newReview = new ReviewModel({
      id,
      createdAt,
      ...review
    });
    
    await newReview.save();
    
    // Update doctor's rating
    const doctorReviews = await this.getReviewsByDoctor(review.doctorId);
    if (doctorReviews.length > 0) {
      const avgRating = doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length;
      await this.updateDoctor(review.doctorId, { 
        rating: Number(avgRating.toFixed(1)),
        reviewCount: doctorReviews.length
      });
    }
    
    return newReview.toObject() as Review;
  }

  // Treatment operations
  async getTreatment(id: number): Promise<Treatment | undefined> {
    const treatment = await TreatmentModel.findOne({ id }).lean();
    return treatment as Treatment | undefined;
  }

  async getTreatments(): Promise<Treatment[]> {
    const treatments = await TreatmentModel.find().lean();
    return treatments as Treatment[];
  }

  async getTreatmentsByCategory(category: string): Promise<Treatment[]> {
    const treatments = await TreatmentModel.find({ 
      category: { $regex: category, $options: 'i' } 
    }).lean();
    return treatments as Treatment[];
  }

  async createTreatment(treatment: InsertTreatment): Promise<Treatment> {
    try {
      // Generate a unique numeric ID
      const id = this.treatmentIdCounter++;
      const createdAt = new Date();
      
      // Ensure benefits and relatedMedicines are arrays
      const benefits = Array.isArray(treatment.benefits) ? treatment.benefits : [];
      const relatedMedicines = Array.isArray(treatment.relatedMedicines) ? treatment.relatedMedicines : [];
      
      // Create standardized treatment object with all required fields
      const treatmentData = {
        id,
        name: treatment.name,
        description: treatment.description,
        category: treatment.category,
        imageUrl: treatment.imageUrl || '', // Ensure imageUrl is not undefined
        benefits: benefits,
        relatedMedicines: relatedMedicines,
        createdAt
      };
      
      console.log('Creating treatment in MongoDB with data:', JSON.stringify(treatmentData, null, 2));
      
      // Use create method which handles validation better than new+save
      const newTreatment = await TreatmentModel.create(treatmentData);
      console.log('Treatment created successfully:', newTreatment.id);
      
      // Convert to plain object and return
      return newTreatment.toObject() as Treatment;
    } catch (error) {
      console.error('Error in createTreatment:', error);
      // Re-throw with a more descriptive message
      throw new Error(`Failed to create treatment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async updateTreatment(id: number, partialTreatment: Partial<Treatment>): Promise<Treatment> {
    const treatment = await TreatmentModel.findOneAndUpdate(
      { id },
      { $set: { ...partialTreatment, updatedAt: new Date() } },
      { new: true }
    ).lean();
    
    if (!treatment) {
      throw new Error(`Treatment with id ${id} not found`);
    }
    
    return treatment as Treatment;
  }
  
  async deleteTreatment(id: number): Promise<void> {
    // First check if the treatment exists
    const treatment = await TreatmentModel.findOne({ id });
    if (!treatment) {
      throw new Error(`Treatment with id ${id} not found`);
    }
    
    // Delete using MongoDB's ObjectId for more reliable deletion
    const result = await TreatmentModel.findByIdAndDelete(treatment._id);
    
    if (!result) {
      throw new Error(`Error during deletion of treatment with id ${id}`);
    }
    
    console.log(`Successfully deleted treatment with ID ${id} using MongoDB ObjectId`);
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    // Check if id is not a valid number, return undefined 
    if (isNaN(id) || id <= 0) {
      console.log(`Invalid appointment ID: ${id}`);
      return undefined;
    }
    
    try {
      const appointment = await AppointmentModel.findOne({ id }).lean();
      return appointment as Appointment | undefined;
    } catch (error) {
      console.error(`Error fetching appointment with ID ${id}:`, error);
      return undefined;
    }
  }

  async getAppointments(): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find().lean();
    return appointments as Appointment[];
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ doctorId }).lean();
    return appointments as Appointment[];
  }

  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ userId }).lean();
    return appointments as Appointment[];
  }

  async getAppointmentsByStatus(status: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ status }).lean();
    return appointments as Appointment[];
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const createdAt = new Date();
    
    const newAppointment = new AppointmentModel({
      id,
      createdAt,
      ...appointment
    });
    
    await newAppointment.save();
    return newAppointment.toObject() as Appointment;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const appointment = await AppointmentModel.findOneAndUpdate(
      { id },
      { $set: { status } },
      { new: true }
    ).lean();
    
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    
    return appointment as Appointment;
  }

  async updateAppointmentPaymentStatus(id: number, paymentStatus: string): Promise<Appointment> {
    const appointment = await AppointmentModel.findOneAndUpdate(
      { id },
      { $set: { paymentStatus, updatedAt: new Date() } },
      { new: true }
    ).lean();
    
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    
    return appointment as Appointment;
  }
}