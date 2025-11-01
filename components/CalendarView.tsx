
import React, { useState } from 'react';
import { Booking } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openBookingModal: (data?: Partial<Booking>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, selectedDate, setSelectedDate, openBookingModal }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const bookingsByDate: { [key: string]: number } = bookings.reduce((acc, booking) => {
    acc[booking.date] = (acc[booking.date] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  const bookingsForSelectedDate = bookings.filter(b => b.date === selectedDate.toISOString().split('T')[0]);

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 rounded-full hover:bg-gray-200">
          &lt;
        </button>
        <h2 className="text-xl font-bold text-gray-700">
          {currentMonth.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 rounded-full hover:bg-gray-200">
          &gt;
        </button>
      </div>
    );
  };
  
  const renderDays = () => {
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    return (
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = new Date(startDate);
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateStr = day.toISOString().split('T')[0];
        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
        const isSelected = day.toDateString() === selectedDate.toDateString();
        const bookingCount = bookingsByDate[dateStr] || 0;

        days.push(
          <div
            key={day.toString()}
            className={`p-1 text-center rounded-lg cursor-pointer transition-colors duration-200 ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-800'} ${isSelected ? 'bg-[#98B6D7] text-white' : 'hover:bg-blue-100'}`}
            onClick={() => setSelectedDate(new Date(day))}
          >
            <div className="relative">
                <span>{day.getDate()}</span>
                {bookingCount > 0 && <span className="absolute top-0 right-0 text-xs text-green-600 font-bold">{bookingCount}</span>}
            </div>
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-1 mt-1" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-700">
                สรุปการจองวันที่ {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => openBookingModal({ date: selectedDate.toISOString().split('T')[0] })} style={{ backgroundColor: '#98B6D7' }} className="text-white px-4 py-2 text-sm rounded-md hover:opacity-90">
                เพิ่มการจอง
            </button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {bookingsForSelectedDate.length > 0 ? (
            bookingsForSelectedDate.map(booking => (
              <div key={booking.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-800">{booking.timeSlot} - {booking.carModel}</p>
                <p className="text-sm text-gray-600">ลูกค้า: {booking.customerName} (เซลล์: {booking.salesperson})</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">ไม่มีการจองในวันที่เลือก</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
