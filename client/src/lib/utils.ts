import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

export function formatDateTime(date: Date | string) {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(parsedDate);
}

export function formatTime(date: Date | string) {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(parsedDate);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function getInitials(name: string = "") {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function truncateText(text: string, maxLength: number) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export type StarType = 'full' | 'half' | 'empty';

export function createStarRating(rating: number) {
  const stars: { type: StarType }[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push({ type: 'full' });
  }

  // Add half star if needed
  if (hasHalfStar) {
    stars.push({ type: 'half' });
  }

  // Fill with empty stars to reach 5
  while (stars.length < 5) {
    stars.push({ type: 'empty' });
  }

  return stars;
}

export const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'ri-calendar-check-line' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: 'ri-check-line' },
  completed: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'ri-task-line' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: 'ri-close-line' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'ri-time-line' }
};

export const specialties = [
  'Acupuncturist',
  'Ayurvedic Doctor',
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Family Medicine',
  'Gastroenterologist',
  'Gynecologist',
  'Herbalist',
  'Naturopathic Doctor',
  'Neurologist',
  'Nutritionist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Rheumatologist',
  'Urologist'
];

export const treatmentCategories = [
  'Ayurvedic Massage',
  'Herbal Medicine',
  'Meditation & Mindfulness',
  'Nutrition Therapy',
  'Panchakarma Detox',
  'Yoga Therapy',
  'Acupuncture',
  'Aromatherapy',
  'Sound Healing',
  'Stress Management'
];