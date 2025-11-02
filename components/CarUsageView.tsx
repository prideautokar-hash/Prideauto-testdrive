import React, { useMemo } from 'react';
import { Booking, CarModel, Unavailability } from '../types';
import { TIME_SLOTS, CAR_MODELS } from '../constants';
import { CheckIcon, XIcon } from './icons';

interface CarUsageViewProps {
  bookings: Booking[];
  unavailability: Unavailability[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

// Helper to format date to YYYY-MM-DD in local timezone
const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SHORT_CAR_MODEL_NAMES: Record<CarModel, string> = {
  [CarModel.SEAL_DYN]: 'Seal Dyn',
  [CarModel.SEAL_PERF]: 'Seal Perf',
  [CarModel.ATTO3]: 'Atto 3',
  [CarModel.DOLPHIN]: 'Dolphin',
  [CarModel.SEALION6]: 'Sealion 6',
  [CarModel.SEALION7]: 'Sealion 7',
  [CarModel.SEAL5]: 'Seal 5',
  [CarModel.M6]: 'M6',
};


const CarUsageView: React.FC<CarUsageViewProps> = ({ bookings, unavailability, selectedDate, setSelectedDate }) => {
  
  const selectedDateStringForInput = toYYYYMMDD(selectedDate);
  
  const bookingsForSelectedDate = useMemo(() => {
    return bookings.filter(b => b.date === selectedDateStringForInput);
  }, [bookings, selectedDateStringForInput]);

  const unavailabilityForSelectedDate = useMemo(() => {
    return unavailability.filter(u => u.date === selectedDateStringForInput);
  }, [unavailability, selectedDateStringForInput]);
  
  type GridCell = { type: 'booking', data: Booking } | { type: 'unavailable', data: Unavailability } | null;

  const usageGrid = useMemo(() => {
    const grid = new Map<string, Map<CarModel, GridCell>>();
    
    TIME_SLOTS.forEach(slot => {
      const slotMap = new Map<CarModel, GridCell>();
      CAR_MODELS.forEach(model => slotMap.set(model, null));
      grid.set(slot, slotMap);
    });

    bookingsForSelectedDate.forEach(booking => {
      if (grid.has(booking.timeSlot)) {
        grid.get(booking.timeSlot)?.set(booking.carModel, { type: 'booking', data: booking });
      }
    });

    unavailabilityForSelectedDate.forEach(u => {
        TIME_SLOTS.forEach(slot => {
            if (slot >= u.startTime && slot < u.endTime) {
                if (grid.has(slot)) {
                    grid.get(slot)?.set(u.carModel, { type: 'unavailable', data: u });
                }
            }
        });
    });
    
    return grid;
  }, [bookingsForSelectedDate, unavailabilityForSelectedDate]);
  
  const carUsageStatus = useMemo(() => {
    const statusMap = new Map<CarModel, boolean>();
    CAR_MODELS.forEach(model => statusMap.set(model, false));
    
    bookingsForSelectedDate.forEach(booking => {
        statusMap.set(booking.carModel, true);
    });

    unavailabilityForSelectedDate.forEach(unavail => {
        statusMap.set(unavail.carModel, true);
    });

    return statusMap;
  }, [bookingsForSelectedDate, unavailabilityForSelectedDate]);

  const thaiDateFormat = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ตารางการใช้รถ</h1>
           <p className="text-gray-500">
             สำหรับวันที่ {thaiDateFormat.format(selectedDate)}
           </p>
        </div>
        <input
            type="date"
            value={selectedDateStringForInput}
            onChange={(e) => {
                if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                }
            }}
            className="border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">เวลา</th>
                      {CAR_MODELS.map(model => (
                          <th key={model} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{SHORT_CAR_MODEL_NAMES[model]}</th>
                      ))}
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="font-semibold text-xs">
                        <td className="px-2 py-2 sticky left-0 bg-gray-50 z-10 text-gray-600 uppercase">สถานะ</td>
                        {CAR_MODELS.map(model => {
                            const isUsed = carUsageStatus.get(model);
                            return (
                                <td key={`status-${model}`} className={`px-2 py-2 text-center ${isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {isUsed ? 'Used' : 'Available'}
                                </td>
                            );
                        })}
                  </tr>
                  {Array.from(usageGrid.entries()).map(([slot, carMap]) => (
                      <tr key={slot}>
                          <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white">{slot}</td>
                          {Array.from(carMap.entries()).map(([model, cellData]) => (
                              <td key={`${slot}-${model}`} className={`px-2 py-2 whitespace-nowrap text-center ${cellData?.type === 'unavailable' ? 'bg-gray-100' : ''}`}>
                                  {cellData?.type === 'booking' ? (
                                      <div className="flex flex-col items-center justify-center text-xs text-center group relative">
                                          <CheckIcon className="w-5 h-5 text-green-500" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded-md p-2 z-20 text-left">
                                              <p className="font-bold">ลูกค้า: {cellData.data.customerName}</p>
                                              <p>{cellData.data.phoneNumber}</p>
                                              <p>เซลล์: {cellData.data.salesperson}</p>
                                              {cellData.data.notes && <p>หมายเหตุ: {cellData.data.notes}</p>}
                                          </div>
                                      </div>
                                  ) : cellData?.type === 'unavailable' ? (
                                      <div className="flex items-center justify-center text-xs text-gray-500 group relative">
                                        ไม่ว่าง
                                        {cellData.data.reason && (
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded-md p-2 z-20 text-left">
                                                <p>เหตุผล: {cellData.data.reason}</p>
                                            </div>
                                        )}
                                      </div>
                                  ) : (
                                     <XIcon className="w-4 h-4 text-gray-300 mx-auto" />
                                  )}
                              </td>
                          ))}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default CarUsageView;