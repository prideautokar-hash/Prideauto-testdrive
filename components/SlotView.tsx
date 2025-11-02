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
                if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                }
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TIME_SLOTS.map(slot => {
            const slotBookings = bookingsByTimeSlot.get(slot) || [];
            
            let cardClasses = 'border-green-300 bg-green-100 hover:bg-green-200 text-green-800';
            if (slotBookings.length === 1) {
              cardClasses = 'border-red-300 bg-red-100 hover:bg-red-200 text-red-800';
            } else if (slotBookings.length > 1) {
              cardClasses = 'border-red-400 bg-red-200 hover:bg-red-300 text-red-900';
            }

            return (
                <div 
                    key={slot} 
                    className={`p-4 rounded-lg shadow-sm border cursor-pointer transition-all duration-200 flex flex-col ${cardClasses}`}
                    onClick={() => openBookingModal({ date: selectedDateStringForInput, timeSlot: slot })}
                    role="button"
                    tabIndex={0}
                    aria-label={`จองเวลา ${slot}`}
                >
                    <h3 className="font-bold text-xl mb-3">{slot}</h3>
                    <div className="flex-grow">
                        {slotBookings.length > 0 ? (
                            <ul className="space-y-3">
                               {slotBookings.map(booking => (
                                   <li key={booking.id} className="text-sm">
                                       <p className="font-semibold">{booking.customerName}</p>
                                       <p className="text-gray-700">{booking.carModel}</p>
                                       <p className="text-xs text-gray-500 mt-1">เซลล์: {booking.salesperson}</p>
                                   </li>
                               ))}
                            </ul>
                        ) : (
                            <div className="flex items-center justify-center h-full min-h-[60px]">
                              <p className="text-lg font-medium text-green-700">ว่าง</p>
                            </div>
                        )}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default SlotView;