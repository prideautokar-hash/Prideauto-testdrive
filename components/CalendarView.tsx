import React, { useMemo } from 'react';
import { Booking } from '../types';

interface CalendarViewProps {
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

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
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

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
        <h2 className="text-xl font-bold text-gray-700">{monthNames[currentMonth]} {currentYear}</h2>
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
          className={`border-t border-gray-200 p-1 h-28 flex flex-col cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className={`self-end font-medium text-sm p-1 rounded-full w-7 h-7 flex items-center justify-center ${isSelected ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>{day}</span>
          <div className="flex-grow overflow-y-auto text-xs mt-1 space-y-1">
             {dayBookings.slice(0, 3).map(b => (
                 <div key={b.id} className="bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 truncate" title={`${b.customerName} - ${b.carModel}`}>{b.customerName}</div>
             ))}
             {dayBookings.length > 3 && (
                 <div className="text-gray-500 text-center">+{dayBookings.length - 3} more</div>
             )}
          </div>
        </div>
      );
    }
    
    return <div className="grid grid-cols-7 gap-1">{cells}</div>;
  };
  
  return (
    <div className="p-4 md:p-6">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">ปฏิทินการจอง</h1>
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
    </div>
  );
};

export default CalendarView;
