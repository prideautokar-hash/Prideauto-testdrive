
import React from 'react';
import { Booking, CarModel } from '../types';
import { TIME_SLOTS } from '../constants';

interface SlotViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
}

const SlotView: React.FC<SlotViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
  const dateStr = selectedDate.toISOString().split('T')[0];
  const bookingsForDate = bookings.filter(b => b.date === dateStr);

  const getSlotColor = (count: number) => {
    if (count === 0) return 'bg-green-100 border-green-200';
    if (count === 1) return 'bg-red-100 border-red-200';
    return 'bg-red-200 border-red-300';
  };
  
  const getTextColor = (count: number) => {
    if (count === 0) return 'text-green-800';
    return 'text-red-800';
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700 mb-2 md:mb-0">Slot การจอง</h2>
        <input 
          type="date" 
          value={dateStr}
          onChange={e => setSelectedDate(new Date(e.target.value))}
          className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIME_SLOTS.map(slot => {
          const bookingsInSlot = bookingsForDate.filter(b => b.timeSlot === slot);
          const bookingCount = bookingsInSlot.length;

          return (
            <div 
              key={slot} 
              className={`p-4 rounded-lg border cursor-pointer transition-transform transform hover:scale-105 ${getSlotColor(bookingCount)}`}
              onClick={() => openBookingModal({ date: dateStr, timeSlot: slot })}
            >
              <h3 className={`text-lg font-bold ${getTextColor(bookingCount)}`}>{slot}</h3>
              {bookingCount > 0 ? (
                <div className="mt-2 space-y-1">
                  {bookingsInSlot.map(b => (
                    <div key={b.id} className="text-sm text-gray-700">
                      <p className="font-semibold">{b.carModel}</p>
                      <p>{b.customerName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`mt-2 ${getTextColor(bookingCount)}`}>ว่าง</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlotView;
