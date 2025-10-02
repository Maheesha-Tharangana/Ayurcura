import { 
  users, 
  type User, 
  type InsertUser,
  doctors,
  type Doctor,
  type InsertDoctor,
  reviews,
  type Review,
  type InsertReview,
  treatments,
  type Treatment,
  type InsertTreatment,
  appointments,
  type Appointment,
  type InsertAppointment
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";
import { Store as SessionStore } from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Doctor operations
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctors(): Promise<Doctor[]>;
  getDoctorsByLocation(location: string): Promise<Doctor[]>;
  getDoctorsBySpecialty(specialty: string): Promise<Doctor[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<Doctor>): Promise<Doctor>;
  deleteDoctor(id: number): Promise<void>;
  
  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByDoctor(doctorId: number): Promise<Review[]>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Treatment operations
  getTreatment(id: number): Promise<Treatment | undefined>;
  getTreatments(): Promise<Treatment[]>;
  getTreatmentsByCategory(category: string): Promise<Treatment[]>;
  createTreatment(treatment: InsertTreatment): Promise<Treatment>;
  updateTreatment(id: number, treatment: Partial<Treatment>): Promise<Treatment>;
  deleteTreatment(id: number): Promise<void>;
  
  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByUser(userId: number): Promise<Appointment[]>;
  getAppointmentsByStatus(status: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  updateAppointmentPaymentStatus(id: number, paymentStatus: string): Promise<Appointment>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private reviews: Map<number, Review>;
  private treatments: Map<number, Treatment>;
  private appointments: Map<number, Appointment>;
  
  currentUserId: number;
  currentDoctorId: number;
  currentReviewId: number;
  currentTreatmentId: number;
  currentAppointmentId: number;
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.reviews = new Map();
    this.treatments = new Map();
    this.appointments = new Map();
    
    this.currentUserId = 1;
    this.currentDoctorId = 1;
    this.currentReviewId = 1;
    this.currentTreatmentId = 1;
    this.currentAppointmentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize with sample data
    this.initializeTreatments();
    this.initializeDoctors();
  }

  private initializeDoctors() {
    const sampleDoctors = [
      {
        name: "Dr. Nimal Perera",
        email: "nimal.perera@ayurcura.com",
        specialty: "Ayurvedic Practitioner",
        location: "Colombo",
        address: "123 Temple Road, Colombo 7",
        bio: "Dr. Nimal Perera is a leading Ayurvedic practitioner with over 20 years of experience in traditional Sri Lankan healing methods. His approach blends ancient wisdom with modern medical understanding.",
        contactNumber: "+94 11 234 5678",
        latitude: "6.9271",
        longitude: "79.8612",
        availability: ["Monday", "Wednesday", "Friday"],
        createdBy: 1
      },
      {
        name: "Dr. Kumari Silva",
        email: "kumari.silva@ayurcura.com",
        specialty: "Herbal Medicine",
        location: "Kandy",
        address: "45 Hill Street, Kandy",
        bio: "Dr. Kumari Silva specializes in herbal remedies and natural treatments based on traditional Ayurvedic principles. She has conducted extensive research on native medicinal plants of Sri Lanka.",
        contactNumber: "+94 81 234 5678",
        latitude: "7.2906",
        longitude: "80.6337",
        availability: ["Tuesday", "Thursday", "Saturday"],
        createdBy: 1
      },
      {
        name: "Dr. Rajith Fernando",
        email: "rajith.fernando@ayurcura.com",
        specialty: "Panchakarma",
        location: "Galle",
        address: "78 Beach Road, Galle",
        bio: "Dr. Rajith Fernando is a Panchakarma specialist who has helped hundreds of patients with detoxification and rejuvenation treatments. His clinic is known for its traditional approach to wellness.",
        contactNumber: "+94 91 234 5678",
        latitude: "6.0535",
        longitude: "80.2210",
        availability: ["Monday", "Tuesday", "Wednesday"],
        createdBy: 1
      },
      {
        name: "Dr. Samanthi Bandara",
        email: "samanthi.bandara@ayurcura.com",
        specialty: "Nutrition",
        location: "Colombo",
        address: "205 Galle Road, Colombo 4",
        bio: "Dr. Samanthi Bandara combines Ayurvedic principles with modern nutrition science to create personalized diet plans. She has written several books on Ayurvedic nutrition for common health issues.",
        contactNumber: "+94 11 345 6789",
        latitude: "6.8865",
        longitude: "79.8588",
        availability: ["Wednesday", "Thursday", "Friday"],
        createdBy: 1
      },
      {
        name: "Dr. Ajith Gunasekara",
        email: "ajith.gunasekara@ayurcura.com",
        specialty: "Massage Therapy",
        location: "Negombo",
        address: "15 Beach Road, Negombo",
        bio: "Dr. Ajith Gunasekara is renowned for his therapeutic massage techniques that blend Ayurvedic principles with modern physiotherapy. His holistic approach treats both body and mind.",
        contactNumber: "+94 31 234 5678",
        latitude: "7.2081",
        longitude: "79.8371",
        availability: ["Monday", "Thursday", "Saturday"],
        createdBy: 1
      }
    ];

    sampleDoctors.forEach(doctor => {
      const id = this.currentDoctorId++;
      const createdAt = new Date();
      this.doctors.set(id, {
        id,
        createdAt,
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        location: doctor.location,
        address: doctor.address,
        bio: doctor.bio,
        contactNumber: doctor.contactNumber,
        latitude: doctor.latitude,
        longitude: doctor.longitude,
        rating: Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
        reviewCount: Math.floor(Math.random() * 20) + 5, // Random number of reviews
        availability: doctor.availability,
        createdBy: doctor.createdBy
      });
    });
  }

  private initializeTreatments() {
    const sampleTreatments = [
      {
        name: "Panchakarma",
        description: "A five-fold detoxification treatment to remove toxins and restore balance to the body's systems.",
        imageUrl: "https://images.unsplash.com/photo-1545620783-8356e780469d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Detoxification",
        benefits: ["Removes toxins", "Restores balance", "Improves immunity"],
        relatedMedicines: ["Triphala", "Castor oil"]
      },
      {
        name: "Abhyanga",
        description: "A full-body massage with herb-infused oils to improve circulation and promote relaxation.",
        imageUrl: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Massage",
        benefits: ["Improves circulation", "Promotes relaxation", "Relieves muscle tension"],
        relatedMedicines: ["Sesame oil", "Coconut oil"]
      },
      {
        name: "Shirodhara",
        description: "A gentle pouring of warm oil over the forehead to calm the nervous system and enhance mental clarity.",
        imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Mental Wellness",
        benefits: ["Calms nervous system", "Enhances mental clarity", "Reduces anxiety"],
        relatedMedicines: ["Brahmi oil", "Ashwagandha oil"]
      },
      {
        name: "Nasya",
        description: "Administration of herbal oils through the nasal passage to clear sinus and improve respiratory function.",
        imageUrl: "https://images.unsplash.com/photo-1598887142487-3c854d51d2c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Respiratory Health",
        benefits: ["Clears sinuses", "Improves respiratory function", "Enhances sensory perception"],
        relatedMedicines: ["Anu oil", "Eucalyptus oil"]
      },
      {
        name: "Kati Basti",
        description: "A specialized treatment for lower back pain where warm medicated oil is pooled over the affected area.",
        imageUrl: "https://images.unsplash.com/photo-1591343395082-e120087004b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Pain Relief",
        benefits: ["Relieves back pain", "Strengthens spine", "Improves mobility"],
        relatedMedicines: ["Dhanwantharam oil", "Ksheerabala oil"]
      },
      {
        name: "Udvartana",
        description: "A herbal powder massage that exfoliates skin, reduces cellulite, and aids in weight management.",
        imageUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Skin Care",
        benefits: ["Exfoliates skin", "Reduces cellulite", "Aids weight management"],
        relatedMedicines: ["Triphala powder", "Calamus powder"]
      }
    ];

    sampleTreatments.forEach(treatment => {
      const id = this.currentTreatmentId++;
      const createdAt = new Date();
      this.treatments.set(id, {
        id,
        createdAt,
        name: treatment.name,
        description: treatment.description,
        imageUrl: treatment.imageUrl,
        category: treatment.category,
        benefits: treatment.benefits,
        relatedMedicines: treatment.relatedMedicines
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    // Set default role to "user" if not provided
    const role = insertUser.role || "user";
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      role // Ensure role is always set
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Doctor methods
  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }
  
  async getDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }
  
  async getDoctorsByLocation(location: string): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(
      (doctor) => doctor.location.toLowerCase().includes(location.toLowerCase()),
    );
  }
  
  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(
      (doctor) => doctor.specialty.toLowerCase().includes(specialty.toLowerCase()),
    );
  }
  
  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.currentDoctorId++;
    const createdAt = new Date();
    const doctor: Doctor = { 
      ...insertDoctor, 
      id, 
      createdAt,
      rating: 0,
      reviewCount: 0
    };
    this.doctors.set(id, doctor);
    return doctor;
  }
  
  async updateDoctor(id: number, partialDoctor: Partial<Doctor>): Promise<Doctor> {
    const doctor = await this.getDoctor(id);
    if (!doctor) {
      throw new Error(`Doctor with id ${id} not found`);
    }
    
    const updatedDoctor = { ...doctor, ...partialDoctor };
    this.doctors.set(id, updatedDoctor);
    return updatedDoctor;
  }
  
  async deleteDoctor(id: number): Promise<void> {
    this.doctors.delete(id);
  }

  // Review methods
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsByDoctor(doctorId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.doctorId === doctorId,
    );
  }
  
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.userId === userId,
    );
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const createdAt = new Date();
    const review: Review = { ...insertReview, id, createdAt };
    this.reviews.set(id, review);
    
    // Update doctor rating
    const doctor = await this.getDoctor(review.doctorId);
    if (doctor) {
      const doctorReviews = await this.getReviewsByDoctor(doctor.id);
      const totalRating = doctorReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = Math.round(totalRating / doctorReviews.length);
      
      await this.updateDoctor(doctor.id, {
        rating: averageRating,
        reviewCount: doctorReviews.length
      });
    }
    
    return review;
  }

  // Treatment methods
  async getTreatment(id: number): Promise<Treatment | undefined> {
    return this.treatments.get(id);
  }
  
  async getTreatments(): Promise<Treatment[]> {
    return Array.from(this.treatments.values());
  }
  
  async getTreatmentsByCategory(category: string): Promise<Treatment[]> {
    return Array.from(this.treatments.values()).filter(
      (treatment) => treatment.category.toLowerCase().includes(category.toLowerCase()),
    );
  }
  
  async createTreatment(insertTreatment: InsertTreatment): Promise<Treatment> {
    const id = this.currentTreatmentId++;
    const createdAt = new Date();
    const treatment: Treatment = { ...insertTreatment, id, createdAt };
    this.treatments.set(id, treatment);
    return treatment;
  }
  
  async updateTreatment(id: number, partialTreatment: Partial<Treatment>): Promise<Treatment> {
    const treatment = await this.getTreatment(id);
    if (!treatment) {
      throw new Error(`Treatment with id ${id} not found`);
    }
    
    const updatedTreatment = { ...treatment, ...partialTreatment, updatedAt: new Date() };
    this.treatments.set(id, updatedTreatment);
    return updatedTreatment;
  }
  
  async deleteTreatment(id: number): Promise<void> {
    const exists = this.treatments.has(id);
    if (!exists) {
      throw new Error(`Treatment with id ${id} not found`);
    }
    this.treatments.delete(id);
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }
  
  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.doctorId === doctorId,
    );
  }
  
  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId,
    );
  }
  
  async getAppointmentsByStatus(status: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.status === status,
    );
  }
  
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const createdAt = new Date();
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt,
      status: "pending" 
    };
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const appointment = await this.getAppointment(id);
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    
    const updatedAppointment = { ...appointment, status };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async updateAppointmentPaymentStatus(id: number, paymentStatus: string): Promise<Appointment> {
    const appointment = await this.getAppointment(id);
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    
    const updatedAppointment = { 
      ...appointment, 
      paymentStatus, 
      updatedAt: new Date() 
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
}

// Use MongoDB storage with fallback to memory storage
import { MongoStorage } from './mongoStorage';

let storageImpl: IStorage;

try {
  storageImpl = new MongoStorage();
  console.log('Using MongoDB storage');
} catch (error) {
  console.warn('Failed to initialize MongoDB storage, falling back to memory storage:', error);
  storageImpl = new MemStorage();
}

export const storage = storageImpl;

// Import the hash function from crypto for password hashing
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Seed the database with an admin user if it doesn't exist
(async () => {
  const adminExists = await storage.getUserByUsername("admin");
  if (!adminExists) {
    console.log("Creating admin user...");
    // Hash the password before storing
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      email: "admin@ayurcura.com",
      fullName: "Admin User",
      role: "admin"
    });
    console.log("Admin user created successfully");
  }
})();
