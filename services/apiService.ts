import { Booking, Branch, Unavailability, CarModel, Car, Salesperson, User } from '../types';
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

export const getCars = async (token: string): Promise<Car[]> => {
  return apiClient<Car[]>('cars', { token });
};

export const getBranches = async (token: string): Promise<{ id: number; name: string }[]> => {
  return apiClient<{ id: number; name: string }[]>('branches', { token });
};

export const getSalespeople = async (branch: Branch, token: string): Promise<Salesperson[]> => {
  return apiClient<Salesperson[]>(`salespeople?branch=${encodeURIComponent(branch)}`, { token });
};

export const addSalesperson = async (salespersonData: Omit<Salesperson, 'id'>, token: string): Promise<Salesperson> => {
  return apiClient<Salesperson>('salespeople', {
    data: salespersonData,
    token,
    method: 'POST'
  });
};

export const updateSalesperson = async (salespersonData: Salesperson, token: string): Promise<Salesperson> => {
  return apiClient<Salesperson>('salespeople', {
    data: salespersonData,
    token,
    method: 'PUT'
  });
};

export const addCar = async (carData: Omit<Car, 'id'>, token: string): Promise<Car> => {
  return apiClient<Car>('cars', {
    data: carData,
    token,
    method: 'POST'
  });
};

export const updateCar = async (carData: Car, token: string): Promise<Car> => {
  return apiClient<Car>('cars', {
    data: carData,
    token,
    method: 'PUT'
  });
};

export const deleteCar = async (carId: number, token: string): Promise<void> => {
  return apiClient<void>(`cars?id=${carId}`, {
    token,
    method: 'DELETE'
  });
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
    data: { carModel: CarModel, date: string, period: string, reason: string, branch: Branch },
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

export const getStockData = async (token: string): Promise<{ model: string; count: number }[]> => {
    return apiClient<{ model: string; count: number }[]>('stock', { token });
};

export const executeSql = async (query: string, token: string): Promise<any> => {
    return apiClient<any>('sql', {
        data: { query },
        token,
        method: 'POST',
    });
};

// --- Users Management ---

export const getUsers = async (token: string): Promise<User[]> => {
    return apiClient<User[]>('users', { token });
};

export const addUser = async (userData: any, token: string): Promise<User> => {
    return apiClient<User>('users', {
        data: userData,
        token,
        method: 'POST'
    });
};

export const updateUser = async (userData: any, token: string): Promise<User> => {
    return apiClient<User>('users', {
        data: userData,
        token,
        method: 'PUT'
    });
};

export const deleteUser = async (id: number, token: string): Promise<void> => {
    return apiClient<void>('users', {
        data: { id },
        token,
        method: 'DELETE'
    });
};

// --- Reports ---

export const getReportBookings = async (startDate: string, endDate: string, token: string): Promise<Booking[]> => {
    return apiClient<Booking[]>(`reports/bookings?startDate=${startDate}&endDate=${endDate}`, { token });
};

export const getReportUnavailability = async (startDate: string, endDate: string, token: string): Promise<Unavailability[]> => {
    return apiClient<Unavailability[]>(`reports/unavailability?startDate=${startDate}&endDate=${endDate}`, { token });
};
