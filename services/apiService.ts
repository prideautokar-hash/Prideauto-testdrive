import { Booking, Branch, Unavailability, CarModel } from '../types';
import apiClient from './apiClient';

export const login = async (username: string, password: string): Promise<{ token: string; role: string }> => {
  if (!username || !password) {
      throw new Error('Username and password are required');
  }
  return apiClient<{ token: string; role: string }>('login', {
    data: { username, password },
    method: 'POST'
  });
};

export const register = async (username: string, password: string, nickname: string): Promise<{ message: string }> => {
  if (!username || !password || !nickname) {
      throw new Error('Username, password and nickname are required');
  }
  return apiClient<{ message: string }>('register', {
    data: { username, password, nickname },
    method: 'POST'
  });
};

export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  return apiClient<Booking[]>(`bookings?branch=${encodeURIComponent(branch)}`, { token });
};

export const addBooking = async (
  bookingData: Omit<Booking, 'id' | 'branch' | 'carId'>,
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

// --- Unavailability API services ---

export const getUnavailability = async (branch: Branch, token: string): Promise<Unavailability[]> => {
    return apiClient<Unavailability[]>(`unavailability?branch=${encodeURIComponent(branch)}`, { token });
};

export const addUnavailability = async (
    data: { carModel: CarModel, date: string, period: 'morning' | 'afternoon' | 'all-day', reason: string, branch: Branch },
    token: string
): Promise<Unavailability> => {
    return apiClient<Unavailability>('unavailability', {
        data,
        token,
        method: 'POST'
    });
};

export const deleteUnavailability = async (id: number, token: string): Promise<void> => {
    return apiClient<void>('unavailability', {
        data: { id },
        token,
        method: 'DELETE'
    });
};


// --- App Settings ---

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

export const executeSql = async (query: string, token: string): Promise<any> => {
    return apiClient<any>('sql', {
        data: { query },
        token,
        method: 'POST',
    });
};
