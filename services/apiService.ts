// services/apiService.ts
import { Booking, Branch, CarModel } from '../types';

// --- Start of Mock Backend Logic ---
// This logic is moved from api/index.ts to run directly in the client.
// This avoids network errors (Failed to fetch) in a serverless environment.

// In-memory store for bookings.
let bookings: Booking[] = [
    {
        id: '1',
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // tomorrow
        timeSlot: '10:00',
        carModel: CarModel.SEAL_PERF,
        notes: 'Wants to test acceleration.',
        salesperson: 'Alice',
        branch: Branch.MAHASARAKHAM,
    },
    {
        id: '2',
        customerName: 'Jane Smith',
        phoneNumber: '0987654321',
        date: new Date().toISOString().split('T')[0], // today
        timeSlot: '14:00',
        carModel: CarModel.ATTO3,
        notes: '',
        salesperson: 'Bob',
        branch: Branch.KALASIN,
    },
     {
        id: '3',
        customerName: 'Peter Jones',
        phoneNumber: '5555555555',
        date: new Date().toISOString().split('T')[0], // today
        timeSlot: '10:00',
        carModel: CarModel.DOLPHIN,
        notes: 'Interested in city driving.',
        salesperson: 'Alice',
        branch: Branch.MAHASARAKHAM,
    },
];
let nextId = 4;

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- End of Mock Backend Logic ---


/**
 * Simulates logging in.
 * @param username - The username
 * @param password - The password
 * @returns A promise that resolves with a fake token.
 */
export const login = async (username: string, password: string): Promise<{ token: string }> => {
  await delay(500); // Simulate network latency

  // WARNING: INSECURE plaintext password check for demonstration purposes ONLY.
  // In a real application, you MUST hash passwords.
  if (username === 'admin' && password === 'password') {
    return Promise.resolve({ token: 'fake-jwt-token-for-client-side-demo' });
  } else {
    return Promise.reject(new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
  }
};

/**
 * Simulates fetching all bookings for a specific branch.
 * @param branch - The branch to filter bookings by.
 * @param token - The auth token (unused in this mock, but kept for API consistency).
 * @returns A promise that resolves with an array of bookings.
 */
export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  await delay(800);
  
  if (!token) {
      return Promise.reject(new Error('Unauthorized'));
  }

  const branchBookings = bookings.filter(b => b.branch === branch);
  return Promise.resolve(branchBookings);
};

/**
 * Simulates adding a new booking.
 * @param bookingData - The new booking data.
 * @param branch - The branch where the booking is made.
 * @param token - The auth token.
 * @returns A promise that resolves with the newly created booking.
 */
export const addBooking = async (bookingData: Omit<Booking, 'id' | 'branch'>, branch: Branch, token: string): Promise<Booking> => {
    await delay(600);
    
    if (!token) {
        return Promise.reject(new Error('Unauthorized'));
    }

    const newBooking: Booking = { 
        ...bookingData,
        branch,
        id: String(nextId++) 
    };
    bookings.push(newBooking);
    return Promise.resolve(newBooking);
};