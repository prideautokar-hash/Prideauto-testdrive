import React, { useState, useMemo } from 'react';
import { Booking } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(booking => {
      const dateStr = booking.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(booking);
    });
    return map;
  }, [bookings]);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const bookingsForSelectedDate = bookingsByDate.get(selectedDateStr) || [];
  
  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="border border-gray-100 rounded-md"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const dayBookingsCount = bookingsByDate.get(dateStr)?.length || 0;

      const dayClasses = `p-2 border rounded-md cursor-pointer transition-colors relative flex flex-col h-24 md:h-28 ${isSelected ? 'bg-blue-200 border-blue-400 font-bold' : 'border-gray-200 hover:bg-gray-100'}`;

      days.push(
        <div key={day} onClick={() => handleDayClick(day)} className={dayClasses}>
          <div className="text-right text-sm text-gray-700">{day}</div>
          {dayBookingsCount > 0 && (
            <div className="mt-auto flex justify-start">
              <span className="bg-green-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {dayBookingsCount}
              </span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow w-full">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Previous month">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">{monthNames[currentMonth]} {currentYear + 543}</h2>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Next month">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2">
          {dayNames.map(day => <div key={day} className="py-2 text-xs md:text-sm">{day}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
            {renderCalendarDays()}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow w-full">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">
                สรุปการจองวันที่ {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button
                onClick={() => openBookingModal({ date: selectedDateStr })}
                style={{ backgroundColor: '#98B6D7' }}
                className="text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-semibold"
            >
                + เพิ่มการจอง
            </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
            {bookingsForSelectedDate.length > 0 ? (
                bookingsForSelectedDate
                  .sort((a,b) => a.timeSlot.localeCompare(b.timeSlot))
                  .map(booking => (
                    <div key={booking.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p className="font-bold">{booking.timeSlot} - {booking.carModel}</p>
                        <p className="text-sm text-gray-600">ลูกค้า: {booking.customerName} (เซลล์: {booking.salesperson})</p>
                    </div>
                ))
            ) : (
                <p className="text-gray-500 text-center py-4">ไม่มีการจองในวันนี้</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
