import React from 'react';
import { Booking } from '../types';
import { TIME_SLOTS } from '../constants';

interface SlotViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
}

const SlotView: React.FC<SlotViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
  // Ensure date string is in YYYY-MM-DD format, compensating for timezone
  const tzoffset = selectedDate.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(selectedDate.getTime() - tzoffset)).toISOString().split('T')[0];
  
  const bookingsForDate = bookings.filter(b => b.date === localISOTime);

  const getSlotColorClasses = (count: number): string => {
    if (count === 0) return 'bg-green-100 hover:bg-green-200 border-green-300';
    if (count === 1) return 'bg-red-100 hover:bg-red-200 border-red-300';
    return 'bg-red-200 hover:bg-red-300 border-red-400'; // Darker red
  };
  
  const getTextColorClasses = (count: number): string => {
    if (count === 0) return 'text-green-800';
    return 'text-red-800';
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-700">
          Slot การจองสำหรับวันที่ {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
        </h2>
        <input 
          type="date" 
          value={localISOTime}
          onChange={e => {
              // Ensure we parse the date as local time, not UTC
              const parts = e.target.value.split('-').map(p => parseInt(p, 10));
              setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
          }}
          className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TIME_SLOTS.map(slot => {
          const bookingsInSlot = bookingsForDate.filter(b => b.timeSlot === slot);
          const bookingCount = bookingsInSlot.length;

          return (
            <div 
              key={slot} 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-transform transform hover:-translate-y-1 ${getSlotColorClasses(bookingCount)}`}
              onClick={() => openBookingModal({ date: localISOTime, timeSlot: slot })}
            >
              <h3 className={`text-lg font-bold ${getTextColorClasses(bookingCount)}`}>{slot}</h3>
              <div className="mt-2 space-y-2 min-h-[4rem]">
                {bookingCount > 0 ? (
                    bookingsInSlot.map(b => (
                        <div key={b.id} className="text-sm text-gray-800 bg-white/50 rounded p-1.5">
                            <p className="font-semibold truncate">{b.carModel}</p>
                            <p className="text-gray-600 truncate">ลูกค้า: {b.customerName}</p>
                        </div>
                    ))
                ) : (
                    <p className={`mt-2 text-center font-semibold ${getTextColorClasses(bookingCount)}`}>ว่าง</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlotView;
