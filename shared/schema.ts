import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// MongoDB compatibility extension - these fields are added to support MongoDB fields
// in our TypeScript types without changing the PostgreSQL schema
export interface MongoFields {
  _id?: string;
  __v?: number;
  updatedAt?: string | Date;
  firstName?: string;
  lastName?: string;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  bio: text("bio").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  availability: json("availability").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
});

// Original schema from Drizzle
export const insertDoctorSchema = createInsertSchema(doctors).pick({
  name: true,
  specialty: true,
  location: true,
  address: true,
  bio: true,
  contactNumber: true,
  email: true,
  latitude: true,
  longitude: true,
  availability: true,
  createdBy: true,
});

// Custom schema for MongoDB compatibility
export const mongoInsertDoctorSchema = z.object({
  name: z.string(),
  specialty: z.string(),
  location: z.string(),
  address: z.string(),
  bio: z.string(),
  contactNumber: z.string(),
  email: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  availability: z.array(z.string()).optional().default([]),
  createdBy: z.number()
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  doctorId: integer("doctor_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  rating: true,
  comment: true,
  doctorId: true,
  userId: true,
});

export const treatments = pgTable("treatments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  benefits: json("benefits").$type<string[]>().default([]),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  relatedMedicines: json("related_medicines").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTreatmentSchema = createInsertSchema(treatments).pick({
  name: true,
  description: true,
  benefits: true,
  imageUrl: true,
  category: true,
  relatedMedicines: true,
});

// Custom schema for MongoDB compatibility
export const mongoInsertTreatmentSchema = z.object({
  name: z.string(),
  description: z.string(),
  benefits: z.array(z.string()).optional().default([]),
  imageUrl: z.string(),
  category: z.string(),
  relatedMedicines: z.array(z.string()).optional().default([])
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  userId: integer("user_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  paymentStatus: text("payment_status").default("pending"),
  paymentIntentId: text("payment_intent_id"),
  paymentAmount: integer("payment_amount"),
  paymentDate: timestamp("payment_date"),
  updatedAt: timestamp("updated_at"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  doctorId: true,
  userId: true,
  appointmentDate: true,
  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect & MongoFields;

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect & MongoFields;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect & MongoFields;

export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type Treatment = typeof treatments.$inferSelect & MongoFields;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect & MongoFields;
