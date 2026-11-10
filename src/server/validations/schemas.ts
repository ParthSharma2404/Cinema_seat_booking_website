import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']).optional().default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const holdSeatsSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat must be selected').max(10, 'Maximum 10 seats per booking'),
  holdToken: z.string().optional(),
});

export const releaseHoldSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat must be specified'),
  holdToken: z.string().optional(),
});

export const createBookingSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat must be selected'),
  holdToken: z.string().optional(),
});

export const processPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  method: z.enum(['SIMULATED_CARD', 'SIMULATED_UPI', 'SANDBOX_WALLET']).default('SIMULATED_CARD'),
  simulateScenario: z.enum(['SUCCESS', 'FAILED', 'TIMEOUT']).default('SUCCESS'),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
});

export const validateTicketSchema = z.object({
  qrValidationToken: z.string().min(1, 'QR validation token or booking reference is required'),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be provided').max(200),
});

export const createMovieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  durationMins: z.number().int().positive('Duration must be positive'),
  language: z.string().min(1, 'Language is required'),
  genre: z.string().min(1, 'Genre is required'),
  posterUrl: z.string().url('Must be a valid URL'),
  rating: z.string().default('PG-13'),
  releaseDate: z.string().or(z.date()).optional(),
});

export const createShowSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
  screenId: z.string().min(1, 'Screen ID is required'),
  startTime: z.string().datetime('Start time must be a valid ISO string'),
  endTime: z.string().datetime('End time must be a valid ISO string'),
  basePrice: z.number().positive('Base price must be positive'),
  format: z.enum(['2D', '3D', 'IMAX']).default('2D'),
});
