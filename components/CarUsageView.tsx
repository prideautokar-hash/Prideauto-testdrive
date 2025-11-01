import React, { useMemo } from 'react';
import { Booking, CarModel } from '../types';
import { TIME_SLOTS, CAR_MODELS } from '../constants';
import { CheckIcon, XIcon } from './icons';

interface CarUsageViewProps {
  bookings: Booking[];
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

const CarUsageView: React.FC<CarUsageViewProps> = ({ bookings, selectedDate, setSelectedDate }) => {
  
  const selectedDateStringForInput = toYYYYMMDD(selectedDate);
  
  const bookingsForSelectedDate = useMemo(() => {
    return bookings.filter(b => b.date === selectedDateStringForInput);
  }, [bookings, selectedDateStringForInput]);
  
  const usageGrid = useMemo(() => {
    const grid = new Map<string, Map<CarModel, Booking | null>>();
    TIME_SLOTS.forEach(slot => {
      const slotMap = new Map<CarModel, Booking | null>();
      CAR_MODELS.forEach(model => {
        slotMap.set(model, null);
      });
      grid.set(slot, slotMap);
    });

    bookingsForSelectedDate.forEach(booking => {
      if (grid.has(booking.timeSlot)) {
        grid.get(booking.timeSlot)?.set(booking.carModel, booking);
      }
    });
    
    return grid;
  }, [bookingsForSelectedDate]);

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
                const [year, month, day] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, day));
            }}
            className="border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">เวลา</th>
                      {CAR_MODELS.map(model => (
                          <th key={model} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{model}</th>
                      ))}
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from(usageGrid.entries()).map(([slot, carMap]) => (
                      <tr key={slot}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white">{slot}</td>
                          {Array.from(carMap.entries()).map(([model, booking]) => (
                              <td key={`${slot}-${model}`} className="px-6 py-4 whitespace-nowrap text-center">
                                  {booking ? (
                                      <div className="flex flex-col items-center justify-center text-xs text-center group relative">
                                          <CheckIcon className="w-6 h-6 text-green-500" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded-md p-2 z-20">
                                              <p className="font-bold">{booking.customerName}</p>
                                              <p>{booking.phoneNumber}</p>
                                              <p>เซลล์: {booking.salesperson}</p>
                                              {booking.notes && <p>หมายเหตุ: {booking.notes}</p>}
                                          </div>
                                      </div>
                                  ) : (
                                     <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
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
