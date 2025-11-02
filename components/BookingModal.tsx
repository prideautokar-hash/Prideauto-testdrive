import React, { useState, useEffect } from 'react';
import { Booking, CarModel } from '../types';
import { CAR_MODELS, TIME_SLOTS } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'branch'>) => void;
  initialData?: Partial<Booking>;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [carModel, setCarModel] = useState<CarModel>(CAR_MODELS[0]);
  const [notes, setNotes] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTimeSlot(initialData.timeSlot || TIME_SLOTS[0]);
      setCarModel(initialData.carModel || CAR_MODELS[0]);
      setNotes(initialData.notes || '');
      setSalesperson(initialData.salesperson || '');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !date || !timeSlot || !carModel || !salesperson) {
      setError('กรุณากรอกข้อมูลที่จำเป็นทุกช่อง (ยกเว้นเบอร์โทรและหมายเหตุ)');
      return;
    }
    
    onSave({
      customerName,
      phoneNumber,
      date,
      timeSlot,
      carModel,
      notes,
      salesperson,
    });
    handleClose();
  };
  
  const handleClose = () => {
    setCustomerName('');
    setPhoneNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setTimeSlot(TIME_SLOTS[0]);
    setCarModel(CAR_MODELS[0]);
    setNotes('');
    setSalesperson('');
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">เพิ่มการจอง Test Drive</h2>
          {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อลูกค้า*</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">เบอร์โทร</label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">วันที่*</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">เวลา*</label>
                <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                  {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รุ่นรถ*</label>
              <select value={carModel} onChange={e => setCarModel(e.target.value as CarModel)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อเซลล์*</label>
              <input type="text" value={salesperson} onChange={e => setSalesperson(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">ยกเลิก</button>
              <button type="submit" style={{ backgroundColor: '#7D9AB9' }} className="text-white px-4 py-2 rounded-md hover:opacity-90">บันทึก</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;