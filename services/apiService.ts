// services/apiService.ts
import { Booking, Branch } from '../types';
import { API_BASE_URL, API_KEY } from '../config';

/**
 * ติดต่อ Server เพื่อทำการ Login
 * @param username - ชื่อผู้ใช้
 * @param password - รหัสผ่าน
 * @returns Promise ที่ resolve เป็น { token: string }
 */
export const login = async (username: string, password: string): Promise<{ token: string }> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY, // Key สำหรับ Server เพื่อยืนยันว่ามาจากแอปเรา
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }));
    throw new Error(errorData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  return response.json();
};

/**
 * ดึงข้อมูลการจองทั้งหมดของสาขาจาก Server
 * @param branch - สาขาที่ต้องการข้อมูล
 * @param token - Token สำหรับยืนยันตัวตน
 * @returns Promise ที่ resolve เป็น array ของ Bookings
 */
export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  const response = await fetch(`${API_BASE_URL}/bookings?branch=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถดึงข้อมูลการจองได้');
  }

  return response.json();
};

/**
 * ส่งข้อมูลการจองใหม่ไปบันทึกที่ Server
 * @param bookingData - ข้อมูลการจอง
 * @param branch - สาขาที่ทำการจอง
 * @param token - Token สำหรับยืนยันตัวตน
 * @returns Promise ที่ resolve เป็น Booking ที่ถูกสร้างขึ้น
 */
export const addBooking = async (bookingData: Omit<Booking, 'id' | 'branch'>, branch: Branch, token: string): Promise<Booking> => {
    const payload = { ...bookingData, branch };
    
    const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-api-key': API_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('ไม่สามารถบันทึกการจองได้');
    }

    return response.json();
};
