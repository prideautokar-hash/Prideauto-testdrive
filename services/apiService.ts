import { Booking, Branch } from '../types';
import api from '../api';

export const login = async (username: string, password: string): Promise<{ token: string }> => {
  if (!username || !password) {
      throw new Error('Username and password are required');
  }
  // This is a mock login endpoint. A real backend would validate credentials.
  return api<{ token: string }>('auth/login', {
    data: { username, password },
    method: 'POST'
  });
};

export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  return api<Booking[]>(`bookings?branch=${encodeURIComponent(branch)}`, { token });
};

export const addBooking = async (
  bookingData: Omit<Booking, 'id' | 'branch'>,
  branch: Branch,
  token: string
): Promise<Booking> => {
  return api<Booking>('bookings', {
    data: { ...bookingData, branch },
    token,
    method: 'POST'
  });
};
