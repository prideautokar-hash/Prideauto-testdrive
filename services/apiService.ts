// services/apiService.ts
import { API_BASE_URL } from '../config';
import { Booking, Branch } from '../types';

/**
 * Handles login by sending credentials to the backend.
 * @param username - The user's username.
 * @param password - The user's password.
 * @returns A promise that resolves with the authentication token.
 */
export const login = async (username: string, password: string): Promise<{ token: string }> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

/**
 * Fetches all bookings for a specific branch from the backend.
 * @param branch - The branch to filter bookings by.
 * @param token - The auth token for authorization.
 * @returns A promise that resolves with an array of bookings.
 */
export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  const response = await fetch(`${API_BASE_URL}/bookings?branch=${encodeURIComponent(branch)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถดึงข้อมูลการจองได้');
  }
  return response.json();
};

/**
 * Adds a new booking by sending the data to the backend.
 * @param bookingData - The new booking data.
 * @param branch - The branch where the booking is made.
 * @param token - The auth token for authorization.
 * @returns A promise that resolves with the newly created booking.
 */
export const addBooking = async (
  bookingData: Omit<Booking, 'id' | 'branch'>,
  branch: Branch,
  token: string
): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingData, branch }),
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถบันทึกการจองได้');
  }
  return response.json();
};
