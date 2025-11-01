// services/apiService.ts
// Fix: Import CarModel enum to use its members.
import { Booking, Branch, CarModel } from '../types';

// --- MOCK DATABASE ---
// This is a temporary, in-memory database to simulate a real backend.
// In a real application, this data would come from your Neon database via the API.
const initialBookings: Booking[] = [
    // Pre-populated data for demonstration
    // Fix: Use CarModel enum members instead of strings to satisfy TypeScript type checking.
    { id: '1', customerName: 'สมชาย รักดี', date: '2024-07-29', timeSlot: '10:00', carModel: CarModel.SEAL_DYN, salesperson: 'สมศรี', branch: Branch.MAHASARAKHAM },
    { id: '2', customerName: 'จิตรา ใจงาม', date: '2024-07-29', timeSlot: '10:00', carModel: CarModel.ATTO3, salesperson: 'สมศรี', branch: Branch.MAHASARAKHAM },
    { id: '3', customerName: 'วิชัย มีสุข', date: '2024-07-30', timeSlot: '14:30', carModel: CarModel.DOLPHIN, salesperson: 'มานะ', branch: Branch.KALASIN },
];
let bookingsDB: Booking[] = [...initialBookings];
// --- END MOCK DATABASE ---


// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Simulates a login request.
 * In a real app, this would make a fetch call to your backend.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves with a fake authentication token.
 */
export const login = async (username: string, password: string): Promise<{ token: string }> => {
    await delay(500); // Simulate network latency

    // --- MOCK LOGIN LOGIC ---
    // This is where the app checks the username and password.
    // It's hardcoded for this demo. It does NOT check your real database.
    const isUsernameCorrect = username === 'admin';
    const isPasswordCorrect = password === 'password';

    if (isUsernameCorrect && isPasswordCorrect) {
        // If login is successful, return a fake "token".
        return Promise.resolve({ token: 'fake-jwt-token-for-client-side-demo' });
    } else {
        // If login fails, return an error.
        return Promise.reject(new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
    }
};


/**
 * Simulates fetching all bookings for a specific branch.
 * @param branch The branch to filter bookings by.
 * @param token The auth token (unused in this mock version, but needed for the real API).
 * @returns A promise that resolves with an array of bookings for the given branch.
 */
export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
    await delay(500);
    console.log(`Fetching bookings for branch: ${branch} with token: ${token}`);
    
    const branchBookings = bookingsDB.filter(b => b.branch === branch);
    return Promise.resolve(branchBookings);
};


/**
 * Simulates adding a new booking.
 * @param bookingData The new booking data.
 * @param branch The branch where the booking is made.
 * @param token The auth token (unused in this mock version).
 * @returns A promise that resolves with the newly created booking.
 */
export const addBooking = async (
    bookingData: Omit<Booking, 'id' | 'branch'>,
    branch: Branch,
    token: string
): Promise<Booking> => {
    await delay(300);
    console.log(`Adding booking for branch: ${branch} with token: ${token}`);

    const newBooking: Booking = {
        id: new Date().getTime().toString(), // Generate a unique ID
        ...bookingData,
        branch: branch,
    };

    bookingsDB.push(newBooking);
    return Promise.resolve(newBooking);
};