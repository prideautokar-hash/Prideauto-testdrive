export enum CarModel {
  SEAL_DYN = 'BYD Seal Dynamic',
  SEAL_PERF = 'BYD Seal Performance',
  ATTO3 = 'BYD Atto 3',
  DOLPHIN = 'BYD Dolphin',
  SEALION6 = 'BYD Sealion 6 DM-i',
  SEALION7 = 'BYD Sealion 7',
  SEAL5 = 'BYD Seal 5 DM-i Premium',
  M6 = 'BYD M6',
  ATTO1 = 'BYD Atto1',
  ATTO2 = 'BYD Atto2',
  SEAL6 = 'BYD Seal 6',
  SEALION5 = 'BYD Sealion 5 DM-i',
  SEAL5_STD = 'BYD Seal 5 DM-i Standard',
}

export enum Branch {
  MAHASARAKHAM = 'มหาสารคาม',
  KALASIN = 'กาฬสินธุ์',
}

export interface Car {
  id: number;
  modelName: string;
  isActive: boolean;
  branchId: number;
  branch?: string;
}

export interface Salesperson {
  id: number;
  name: string;
  isActive: boolean;
  branchId: number;
}

export interface Booking {
  id: string;
  customerName: string;
  phoneNumber?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  carModel: CarModel;
  carId: number; // Added for mapping
  carBranch: string; // Added for car affiliation
  notes?: string;
  salesperson: string;
  branch: Branch;
}

export interface Unavailability {
    id: number;
    carModel: CarModel;
    carId: number;
    carBranch: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    reason?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'executive';
  status: 'approved' | 'not approved';
  note?: string;
}
