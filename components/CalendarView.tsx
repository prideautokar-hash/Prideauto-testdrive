import React, { useState, useMemo, useEffect } from 'react';
import { Booking } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
  const [viewDate, setViewDate] = useState(selectedDate);

  useEffect(() => {
    // Sync view date with selected date if month/year changes from outside
    if (selectedDate.getFullYear() !== viewDate.getFullYear() || selectedDate.getMonth() !== viewDate.getMonth()) {
        setViewDate(selectedDate);
    }
  }, [selectedDate, viewDate]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(booking => {
      const dateStr = booking.date; // Already YYYY-MM-DD
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

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };
  
  const renderCalendarDays = () => {
    const days = [];
    // Padding for days before start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-start-${i}`} className="border border-transparent"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      const dayBookings = bookingsByDate.get(dateStr) || [];

      const dayClasses = [
        'p-2 border rounded-md cursor-pointer transition-colors relative flex flex-col group h-24 md:h-32',
        isSelected ? 'bg-blue-200 border-blue-400 font-bold' : 'border-gray-200 hover:bg-gray-100',
        !isSelected && isToday ? 'bg-yellow-100' : '',
        'text-gray-700',
      ].join(' ');

      const dayNumberClasses = [
        'text-right text-sm',
        isToday ? 'text-red-500 font-bold' : '',
      ].join(' ');

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={dayClasses}
        >
          <div className={dayNumberClasses}>{day}</div>
          
          <div className="flex-grow overflow-y-auto text-xs space-y-1 mt-1">
            {dayBookings.slice(0, 3).map(b => (
              <div key={b.id} className="bg-blue-100 text-blue-800 rounded p-1 truncate" title={`${b.customerName} - ${b.carModel}`}>
                {b.customerName}
              </div>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-gray-500 font-medium">+{dayBookings.length - 3} เพิ่มเติม</div>
            )}
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openBookingModal({ date: dateStr });
            }} 
            className="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-lg"
            aria-label="Add booking"
          >
            +
          </button>
        </div>
      );
    }
    return days;
  };
  

  return (
    <div className="p-4 md:p-6">
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
          {dayNames.map(day => <div key={day} className="py-2">{day}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
            {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
