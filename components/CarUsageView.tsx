
import React, { useState } from 'react';
import { Booking } from '../types';
import { TIME_SLOTS, CAR_MODELS } from '../constants';
import { CheckIcon, XIcon } from './icons';

interface CarUsageViewProps {
  bookings: Booking[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const CarUsageView: React.FC<CarUsageViewProps> = ({ bookings, selectedDate, setSelectedDate }) => {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const dateStr = selectedDate.toISOString().split('T')[0];
  const bookingsForDate = bookings.filter(b => b.date === dateStr);

  const bookingMap = new Map<string, Booking>();
  bookingsForDate.forEach(b => {
    const key = `${b.carModel}-${b.timeSlot}`;
    bookingMap.set(key, b);
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700 mb-2 md:mb-0">ตารางการใช้รถ</h2>
        <input 
          type="date" 
          value={dateStr}
          onChange={e => setSelectedDate(new Date(e.target.value))}
          className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border border-gray-200 sticky left-0 bg-gray-100 min-w-[150px] md:min-w-[200px]">รุ่นรถ</th>
              {TIME_SLOTS.map(slot => <th key={slot} className="p-2 border border-gray-200">{slot}</th>)}
            </tr>
          </thead>
          <tbody>
            {CAR_MODELS.map(model => (
              <tr key={model}>
                <td className="p-2 border border-gray-200 font-semibold sticky left-0 bg-white min-w-[150px] md:min-w-[200px]">{model}</td>
                {TIME_SLOTS.map(slot => {
                  const booking = bookingMap.get(`${model}-${slot}`);
                  return (
                    <td key={slot} className="p-2 border border-gray-200 text-center">
                      {booking ? (
                        <button onClick={() => setActiveBooking(booking)} className="text-green-500">
                          <CheckIcon className="w-5 h-5 mx-auto" />
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={() => setActiveBooking(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 relative">
                    <button onClick={() => setActiveBooking(null)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <h3 className="text-lg font-bold mb-3 text-gray-800">รายละเอียดการจอง</h3>
                    <p><strong>เวลา:</strong> {activeBooking.timeSlot}</p>
                    <p><strong>รุ่นรถ:</strong> {activeBooking.carModel}</p>
                    <p><strong>ลูกค้า:</strong> {activeBooking.customerName}</p>
                    <p><strong>เบอร์โทร:</strong> {activeBooking.phoneNumber || '-'}</p>
                    <p><strong>เซลล์:</strong> {activeBooking.salesperson}</p>
                    <p><strong>หมายเหตุ:</strong> {activeBooking.notes}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CarUsageView;
