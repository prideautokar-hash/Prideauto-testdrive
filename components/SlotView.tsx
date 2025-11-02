import React, { useMemo } from 'react';
import { Booking, Unavailability } from '../types';
import { TIME_SLOTS } from '../constants';
import { TrashIcon } from './icons';

interface SlotViewProps {
  bookings: Booking[];
  unavailability: Unavailability[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
  onDeleteBooking: (bookingId: string) => void;
}

// Helper to format date to YYYY-MM-DD in local timezone
const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const SlotView: React.FC<SlotViewProps> = ({ bookings, unavailability, selectedDate, setSelectedDate, openBookingModal, onDeleteBooking }) => {
  
  const selectedDateStringForInput = toYYYYMMDD(selectedDate);

  const bookingsForSelectedDate = useMemo(() => {
    return bookings
      .filter(b => b.date === selectedDateStringForInput)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings, selectedDateStringForInput]);

  const unavailabilityForSelectedDate = useMemo(() => {
    return unavailability.filter(u => u.date === selectedDateStringForInput);
  }, [unavailability, selectedDateStringForInput]);
  
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

  const unavailabilityByTimeSlot = useMemo(() => {
    const map = new Map<string, Unavailability[]>();
    for (const u of unavailabilityForSelectedDate) {
        for (const slot of TIME_SLOTS) {
            if (slot >= u.startTime && slot < u.endTime) {
                if (!map.has(slot)) {
                    map.set(slot, []);
                }
                map.get(slot)!.push(u);
            }
        }
    }
    return map;
  }, [unavailabilityForSelectedDate]);


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
            const slotUnavailability = unavailabilityByTimeSlot.get(slot) || [];
            
            const isAvailable = slotBookings.length === 0;

            return (
                <div 
                    key={slot} 
                    className={`p-4 rounded-lg shadow-sm border transition-all duration-200 flex flex-col ${isAvailable ? 'bg-white' : 'bg-red-50'}`}
                >
                    <h3 className={`font-bold text-xl mb-3 ${isAvailable ? 'text-gray-700' : 'text-red-800'}`}>{slot}</h3>
                    <div className="flex-grow space-y-3">
                        {slotBookings.length > 0 ? (
                            <ul className="space-y-3">
                               {slotBookings.map(booking => (
                                   <li key={booking.id} className="text-sm group relative bg-red-100 p-2 rounded">
                                       <p className="font-semibold"><span className="text-gray-600 font-medium">ลูกค้า: </span>{booking.customerName}</p>
                                       <p className="text-gray-700">{booking.carModel}</p>
                                       <p className="text-xs text-gray-500 mt-1">เซลล์: {booking.salesperson}</p>
                                       <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteBooking(booking.id);
                                          }}
                                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1 rounded-full bg-white/50"
                                          title="ลบการจอง"
                                       >
                                         <TrashIcon className="w-4 h-4" />
                                       </button>
                                   </li>
                               ))}
                            </ul>
                        ) : (
                             <button
                                className="w-full text-center py-4 rounded-md bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                                onClick={() => openBookingModal({ date: selectedDateStringForInput, timeSlot: slot })}
                                aria-label={`จองเวลา ${slot}`}
                             >
                                ว่าง
                            </button>
                        )}
                        {slotUnavailability.length > 0 && (
                             <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-500 mb-1">รถไม่พร้อมใช้:</p>
                                <ul className="space-y-1">
                                    {slotUnavailability.map(u => (
                                        <li key={`unavail-${u.id}-${slot}`} className="text-xs bg-gray-100 text-gray-600 p-1.5 rounded">
                                            {u.carModel} {u.reason ? `(${u.reason})` : ''}
                                        </li>
                                    ))}
                                </ul>
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