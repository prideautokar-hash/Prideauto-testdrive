
import { CarModel } from './types';

export const CAR_MODELS: CarModel[] = Object.values(CarModel);

export const AVAILABLE_CAR_MODELS: CarModel[] = CAR_MODELS.filter(model => 
  model !== CarModel.SEAL_DYN && model !== CarModel.SEAL_PERF
);

export const TIME_SLOTS: string[] = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];
