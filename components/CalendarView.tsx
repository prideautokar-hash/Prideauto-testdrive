import React, { useMemo } from 'react';
import { Booking } from '../types';
import { TrashIcon } from './icons';

interface CalendarViewProps {
  bookings: Booking[];
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

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal, onDeleteBooking }) => {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(booking => {
      const dateStr = booking.date; // already YYYY-MM-DD
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(booking);
    });
    return map;
  }, [bookings]);
  
  const bookingsForSelectedDate = useMemo(() => {
    const dateStr = toYYYYMMDD(selectedDate);
    return bookingsByDate.get(dateStr)?.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)) || [];
  }, [bookingsByDate, selectedDate]);

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
        <h2 className="text-lg md:text-xl font-bold text-gray-700">{monthNames[currentMonth]} {currentYear}</h2>
        <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const daysOfWeek = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    return (
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
        {daysOfWeek.map(day => <div key={day} className="font-medium">{day}</div>)}
      </div>
    );
  };
  
  const renderCells = () => {
    const totalDays = daysInMonth(currentMonth, currentYear);
    const startDay = firstDayOfMonth(currentMonth, currentYear);
    const cells = [];
    
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="border-t border-gray-200"></div>);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = toYYYYMMDD(date);
      const dayBookings = bookingsByDate.get(dateStr) || [];
      const isSelected = toYYYYMMDD(selectedDate) === dateStr;

      cells.push(
        <div 
          key={day}
          className={`border-t border-gray-200 p-1 h-20 flex flex-col cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => {
            setSelectedDate(date);
            openBookingModal({ date: toYYYYMMDD(date) });
          }}
        >
          <span className={`self-end font-medium text-sm p-1 rounded-full w-6 h-6 flex items-center justify-center ${isSelected ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>{day}</span>
          
          {dayBookings.length > 0 && (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-green-600 font-bold text-xl flex items-baseline gap-1">
                {dayBookings.length}
                <span className="text-xs font-medium text-gray-500">คิว</span>
              </p>
            </div>
          )}
        </div>
      );
    }
    
    return <div className="grid grid-cols-7 gap-1">{cells}</div>;
  };
  
  return (
    <div className="p-4 md:p-6">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">ปฏิทินการจอง</h1>
        <button
          onClick={() => openBookingModal({ date: toYYYYMMDD(selectedDate) })}
          style={{ backgroundColor: '#98B6D7' }}
          className="text-white px-4 py-2 rounded-md hover:opacity-90 shadow-sm"
        >
          + เพิ่มการจอง
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-xl font-bold text-gray-800">
                สรุปการจอง
            </h3>
            <input
                type="date"
                value={toYYYYMMDD(selectedDate)}
                onChange={(e) => {
                    if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        setSelectedDate(new Date(year, month - 1, day));
                    }
                }}
                className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="เลือกวันที่สำหรับสรุปการจอง"
            />
        </div>
        <p className="text-gray-600 mb-4 -mt-2">
             {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {bookingsForSelectedDate.length > 0 ? (
          <div className="bg-white rounded-lg border shadow">
            <ul className="divide-y divide-gray-200">
              {bookingsForSelectedDate.map(booking => (
                <li key={booking.id} className="p-4 hover:bg-gray-50 transition-colors duration-150 group">
                  <div className="flex items-center justify-between gap-4">
                      <div>
                          <p className="font-semibold text-gray-800">{booking.timeSlot} - <span className="text-gray-500 font-medium">ลูกค้า:</span> {booking.customerName}</p>
                          <p className="text-sm text-gray-600">{booking.carModel}</p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <div>
                            <p className="text-sm text-gray-500">เซลล์</p>
                            <p className="text-sm font-medium text-gray-800">{booking.salesperson}</p>
                          </div>
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBooking(booking.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1 rounded-full"
                            title="ลบการจอง"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border shadow text-center">
            <p className="text-gray-500">ไม่มีการจองสำหรับวันที่เลือก</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;