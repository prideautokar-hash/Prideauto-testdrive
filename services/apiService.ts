// services/apiService.ts
import { Booking, CarModel, Branch } from '../types';
import { API_BASE_URL, API_KEY } from '../config';

// --- DATA จำลอง (ปกติจะอยู่ใน Database จริง) ---
let bookingsDB: Booking[] = [
    { id: '1', customerName: 'สมชาย ใจดี', date: '2024-07-28', timeSlot: '09:00', carModel: CarModel.SEAL_DYN, notes: 'สนใจสีขาว', salesperson: 'สมศรี', phoneNumber: '0812345678', branch: Branch.MAHASARAKHAM },
    { id: '2', customerName: 'มานี รักเรียน', date: '2024-07-28', timeSlot: '10:30', carModel: CarModel.ATTO3, notes: 'สอบถามโปรโมชั่น', salesperson: 'สมศักดิ์', branch: Branch.KALASIN },
    { id: '3', customerName: 'Peter Pan', date: '2024-07-29', timeSlot: '09:00', carModel: CarModel.DOLPHIN, notes: 'ต้องการทดลองขับทางไกล', salesperson: 'สมศรี', branch: Branch.MAHASARAKHAM },
    { id: '4', customerName: 'John Doe', date: '2024-07-29', timeSlot: '11:00', carModel: CarModel.SEALION6, salesperson: 'สมศักดิ์', branch: Branch.KALASIN, notes: '' },
];
// --------------------------------------------------

// ฟังก์ชันจำลองการดีเลย์ของ Network
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


/**
 * จำลองการ Login
 * @param username - ชื่อผู้ใช้
 * @param password - รหัสผ่าน
 * @returns Promise ที่ resolve เป็น token จำลอง
 */
export const login = async (username: string, password: string): Promise<{ token: string }> => {
  console.log(`POST ${API_BASE_URL}/login`);
  console.log('Headers:', { 'x-api-key': API_KEY });
  await delay(500); // Simulate network delay

  if (username === 'admin' && password === 'password') {
    // ในระบบจริง token นี้จะถูกสร้างโดย server
    const token = 'fake-jwt-token-' + Math.random().toString(36).substring(2);
    return Promise.resolve({ token });
  } else {
    return Promise.reject(new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
  }
};

/**
 * จำลองการดึงข้อมูลการจองทั้งหมดของสาขา
 * @param branch - สาขาที่ต้องการข้อมูล
 * @param token - Token สำหรับยืนยันตัวตน
 * @returns Promise ที่ resolve เป็น array ของ Bookings
 */
export const getBookings = async (branch: Branch, token: string): Promise<Booking[]> => {
  console.log(`GET ${API_BASE_URL}/bookings?branch=${branch}`);
  console.log('Headers:', { 'Authorization': `Bearer ${token}`, 'x-api-key': API_KEY });
  await delay(800); // Simulate network delay

  if (!token.startsWith('fake-jwt-token')) {
      return Promise.reject(new Error('Unauthorized'));
  }

  const branchBookings = bookingsDB.filter(b => b.branch === branch);
  return Promise.resolve(branchBookings);
};

/**
 * จำลองการเพิ่มการจองใหม่
 * @param bookingData - ข้อมูลการจอง
 * @param branch - สาขาที่ทำการจอง
 * @param token - Token สำหรับยืนยันตัวตน
 * @returns Promise ที่ resolve เป็น Booking ที่ถูกสร้างขึ้น
 */
export const addBooking = async (bookingData: Omit<Booking, 'id' | 'branch'>, branch: Branch, token: string): Promise<Booking> => {
    console.log(`POST ${API_BASE_URL}/bookings`);
    console.log('Headers:', { 'Authorization': `Bearer ${token}`, 'x-api-key': API_KEY });
    console.log('Body:', { ...bookingData, branch });
    await delay(600); // Simulate network delay

    if (!token.startsWith('fake-jwt-token')) {
        return Promise.reject(new Error('Unauthorized'));
    }

    const newBooking: Booking = {
        ...bookingData,
        id: new Date().toISOString() + Math.random(),
        branch: branch,
    };

    bookingsDB.push(newBooking);
    bookingsDB.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.timeSlot.localeCompare(b.timeSlot));

    return Promise.resolve(newBooking);
};
