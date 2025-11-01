import React, { useMemo } from 'react';
import { Booking } from '../types';
import { TIME_SLOTS } from '../constants';

interface SlotViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
}

// Helper to format date to YYYY-MM-DD in local timezone
const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const SlotView: React.FC<SlotViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
  
  const selectedDateStringForInput = toYYYYMMDD(selectedDate);

  const bookingsForSelectedDate = useMemo(() => {
    return bookings
      .filter(b => b.date === selectedDateStringForInput)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings, selectedDateStringForInput]);
  
  const bookingsByTimeSlot = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookingsForSelectedDate.forEach(booking => {
        if (!map.has(booking.timeSlot)) {
            map.set(booking.timeSlot, []);
        }
        map.get(booking.timeSlot)!.push(booking);
    });
    return map;
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
          <h1 className="text-3xl font-bold text-gray-800">Time Slots</h1>
          <p className="text-gray-500">
            การจองสำหรับวันที่ {thaiDateFormat.format(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDateStringForInput}
            onChange={(e) => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, day));
            }}
            className="border border-gray-300 rounded-md shadow-sm p-2"
          />
          <button
            onClick={() => openBookingModal({ date: selectedDateStringForInput })}
            style={{ backgroundColor: '#98B6D7' }}
            className="text-white px-4 py-2 rounded-md hover:opacity-90 shadow-sm whitespace-nowrap"
          >
            + เพิ่มการจอง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIME_SLOTS.map(slot => {
            const slotBookings = bookingsByTimeSlot.get(slot) || [];
            return (
                <div key={slot} className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="font-bold text-lg mb-2 text-gray-700">{slot}</h3>
                    {slotBookings.length > 0 ? (
                        <ul className="space-y-2">
                           {slotBookings.map(booking => (
                               <li key={booking.id} className="bg-blue-50 border border-blue-200 p-2 rounded-md">
                                   <p className="font-semibold text-blue-800">{booking.customerName}</p>
                                   <p className="text-sm text-blue-700">{booking.carModel}</p>
                                   <p className="text-xs text-gray-500 mt-1">เซลล์: {booking.salesperson}</p>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400">ว่าง</p>
                    )}
                     <button
                        onClick={() => openBookingModal({ date: selectedDateStringForInput, timeSlot: slot })}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-3 w-full text-left"
                    >
                        + จองเวลานี้
                    </button>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default SlotView;
