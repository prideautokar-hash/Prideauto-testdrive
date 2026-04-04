import React, { useMemo } from 'react';
import { Booking, CarModel, Unavailability, Car } from '../types';
import { TIME_SLOTS } from '../constants';
import { CheckIcon, XIcon } from './icons';

interface CarUsageViewProps {
  bookings: Booking[];
  unavailability: Unavailability[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  carModels: Car[];
}

// Helper to format date to YYYY-MM-DD in local timezone
const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SHORT_CAR_MODEL_NAMES: Record<string, string> = {
  'BYD Seal Dynamic': 'Seal Dyn',
  'BYD Seal Performance': 'Seal Perf',
  'BYD Atto 3': 'Atto 3',
  'BYD Dolphin': 'Dolphin',
  'BYD Sealion 6 DM-i': 'Sealion 6',
  'BYD Sealion 7': 'Sealion 7',
  'BYD Seal 5 DM-i Premium': 'Seal 5 PRE',
  'BYD M6': 'M6',
  'BYD Atto1': 'Atto 1',
  'BYD Atto2': 'Atto 2',
  'BYD Seal 6': 'Seal 6',
  'BYD Sealion 5 DM-i': 'Sealion 5',
  'BYD Seal 5 DM-i Standard': 'Seal 5 Std',
};

const CarUsageView: React.FC<CarUsageViewProps> = ({ bookings, unavailability, selectedDate, setSelectedDate, carModels }) => {
  
  const selectedDateStringForInput = toYYYYMMDD(selectedDate);

  const carModelToBranch = useMemo(() => {
    const map = new Map<string, string>();
    carModels.forEach(c => map.set(c.modelName, c.branch));
    return map;
  }, [carModels]);
  
  const bookingsForSelectedDate = useMemo(() => {
    return bookings.filter(b => b.date === selectedDateStringForInput);
  }, [bookings, selectedDateStringForInput]);

  const unavailabilityForSelectedDate = useMemo(() => {
    return unavailability.filter(u => u.date === selectedDateStringForInput);
  }, [unavailability, selectedDateStringForInput]);
  
  const displayCars = useMemo(() => {
    const activeCars = carModels.filter(c => c.isActive);
    
    // Sort by branch: มหาสารคาม first, then others
    return activeCars.sort((a, b) => {
      if (a.branch === 'มหาสารคาม' && b.branch !== 'มหาสารคาม') return -1;
      if (a.branch !== 'มหาสารคาม' && b.branch === 'มหาสารคาม') return 1;
      return a.modelName.localeCompare(b.modelName);
    });
  }, [carModels]);

  type GridCell = { type: 'booking', data: Booking } | { type: 'unavailable', data: Unavailability } | null;

  const usageGrid = useMemo(() => {
    const grid = new Map<string, Map<string, GridCell>>();
    
    TIME_SLOTS.forEach(slot => {
      const slotMap = new Map<string, GridCell>();
      displayCars.forEach(car => slotMap.set(car.modelName, null));
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
  }, [bookingsForSelectedDate, unavailabilityForSelectedDate, displayCars]);
  
  const carUsageStatus = useMemo(() => {
    const statusMap = new Map<string, boolean>();
    displayCars.forEach(car => statusMap.set(car.modelName, false));
    
    bookingsForSelectedDate.forEach(booking => {
        statusMap.set(booking.carModel, true);
    });

    unavailabilityForSelectedDate.forEach(unavail => {
        statusMap.set(unavail.carModel, true);
    });

    return statusMap;
  }, [bookingsForSelectedDate, unavailabilityForSelectedDate, displayCars]);

  const thaiDateFormat = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
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
                      {displayCars.map(car => (
                          <th key={car.id} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {car.shortModelName || SHORT_CAR_MODEL_NAMES[car.modelName] || car.modelName}
                              <br />
                              <span className="text-[10px] font-normal lowercase">({car.branch})</span>
                          </th>
                      ))}
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="font-semibold text-xs">
                        <td className="px-2 py-2 sticky left-0 bg-gray-50 z-10 text-gray-600 uppercase">สถานะ</td>
                        {displayCars.map(car => {
                            const isUsed = carUsageStatus.get(car.modelName);
                            return (
                                <td key={`status-${car.id}`} className={`px-2 py-2 text-center ${isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {isUsed ? 'Used' : 'Available'}
                                </td>
                            );
                        })}
                  </tr>
                  {Array.from(usageGrid.entries()).map(([slot, carMap]) => (
                      <tr key={slot}>
                          <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white z-10">{slot}</td>
                          {displayCars.map(car => {
                              const cellData = carMap.get(car.modelName);
                              return (
                                <td key={`${slot}-${car.id}`} className={`px-2 py-2 whitespace-nowrap text-center ${cellData?.type === 'unavailable' ? 'bg-gray-100' : ''}`}>
                                    {cellData?.type === 'booking' ? (
                                        <div className="flex flex-col items-center justify-center text-xs text-center group relative">
                                            <CheckIcon className="w-5 h-5 text-green-500" />
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded-md p-2 z-20 text-left">
                                                <p className="font-bold">ลูกค้า: {cellData.data.customerName}</p>
                                                <p>{cellData.data.phoneNumber}</p>
                                                <p>เซลส์: {cellData.data.salesperson}</p>
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
                              );
                          })}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default CarUsageView;
