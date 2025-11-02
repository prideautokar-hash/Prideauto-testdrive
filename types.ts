export enum CarModel {
  SEAL_DYN = 'BYD Seal Dynamic',
  SEAL_PERF = 'BYD Seal Performance',
  ATTO3 = 'BYD Atto 3',
  DOLPHIN = 'BYD Dolphin',
  SEALION6 = 'BYD Sealion 6 DM-i',
  SEALION7 = 'BYD Sealion 7',
  SEAL5 = 'BYD Seal 5 DM-i',
  M6 = 'BYD M6',
}

export enum Branch {
  MAHASARAKHAM = 'มหาสารคาม',
  KALASIN = 'กาฬสินธุ์',
}

export interface Booking {
  id: string;
  customerName: string;
  phoneNumber?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  carModel: CarModel;
  carId: number; // Added for mapping
  notes?: string;
  salesperson: string;
  branch: Branch;
}

export interface Unavailability {
    id: number;
    carModel: CarModel;
    carId: number;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    reason?: string;
}
