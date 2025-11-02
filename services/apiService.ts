import { Booking, Branch, CarModel } from '../types';
import apiClient from './apiClient';

export const login = async (username: string, password: string): Promise<{ token: string }> => {
  if (!username || !password) {
      throw new Error('Username and password are required');
  }
  return apiClient<{ token:string }>('login', {
    data: { username, password },
    method: 'POST'
  });
};

export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  return apiClient<Booking[]>(`bookings?branch=${encodeURIComponent(branch)}`, { token });
};

export const addBooking = async (
  bookingData: Omit<Booking, 'id' | 'branch'>,
  branch: Branch,
  token: string
): Promise<Booking> => {
  return apiClient<Booking>('bookings', {
    data: { ...bookingData, branch },
    token,
    method: 'POST'
  });
};

export const deleteBooking = async (bookingId: string, token: string): Promise<void> => {
  return apiClient<void>('bookings', {
    data: { id: bookingId },
    token,
    method: 'DELETE',
  });
};

export const getAppSetting = async (key: string, token?: string): Promise<{ value: string }> => {
    return apiClient<{ value: string }>(`settings?key=${encodeURIComponent(key)}`, { token });
};

export const setAppSetting = async (key: string, value: string, token: string): Promise<void> => {
    return apiClient<void>('settings', {
        data: { key, value },
        token,
        method: 'POST',
    });
};

// FIX: Add executeSql function to be used by the SQL Editor view.
export const executeSql = async (query: string, token: string): Promise<any> => {
    return apiClient<any>('sql', {
        data: { query },
        token,
        method: 'POST',
    });
};

// --- Unavailability API services ---

export const getUnavailability = async (branch: Branch, token: string): Promise<any[]> => {
    return apiClient<any[]>(`unavailability?branch=${encodeURIComponent(branch)}`, { token });
};

export const addUnavailability = async (
    data: { carModel: CarModel; date: string; blockType: 'morning' | 'afternoon' | 'all_day'; reason: string },
    branch: Branch,
    token: string
): Promise<any> => {
    return apiClient<any>('unavailability', {
        data: { ...data, branch },
        token,
        method: 'POST',
    });
};

export const deleteUnavailability = async (unavailabilityId: string, token: string): Promise<void> => {
    return apiClient<void>('unavailability', {
        data: { id: unavailabilityId },
        token,
        method: 'DELETE',
    });
};
