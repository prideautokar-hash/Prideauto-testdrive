// config.ts
// นี่คือไฟล์สำหรับกำหนดค่าการเชื่อมต่อของแอปพลิเคชัน
// เราจะชี้ไปที่ /api เพื่อให้ Frontend คุยกับ Backend (api/index.ts) ที่อยู่ในโปรเจกต์เดียวกัน

/**
 * URL หลักของ API Server ของคุณ
 * การตั้งค่าเป็น '/api' จะทำให้ Vercel หรือระบบ development จัดการเส้นทางให้อัตโนมัติ
 */
export const API_BASE_URL = '/api';

/**
 * API Key สำหรับให้ Server ตรวจสอบว่าคำขอมาจากแอปพลิเคชันของคุณจริงๆ
 * Key นี้ควรถูกเก็บเป็นความลับและจัดการผ่าน Environment Variables บน Vercel
 */
export const API_KEY = process.env.VITE_API_KEY || 'super-secret-api-key';