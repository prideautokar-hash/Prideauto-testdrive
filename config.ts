// config.ts
// นี่คือไฟล์สำหรับกำหนดค่าการเชื่อมต่อของแอปพลิเคชัน
// ในอนาคต คุณสามารถเปลี่ยนค่าเหล่านี้เป็น URL และ Key จริงของ Backend Server ของคุณได้เลย

/**
 * URL หลักของ API Server ของคุณ
 * ที่อยู่ (Endpoint) ทั้งหมดจะถูกเรียกโดยใช้ URL นี้เป็นฐาน
 * ตัวอย่าง: https://your-backend-service.vercel.app/api
 */
export const API_BASE_URL = process.env.VITE_API_URL || 'https://api.testdrive-booker.com';

/**
 * API Key สำหรับให้ Server ตรวจสอบว่าคำขอมาจากแอปพลิเคชันของคุณจริงๆ
 * Key นี้ควรถูกเก็บเป็นความลับและจัดการผ่าน Environment Variables บน Vercel
 */
export const API_KEY = process.env.VITE_API_KEY || 'super-secret-api-key';
