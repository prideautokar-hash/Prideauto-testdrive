import React, { useState, useEffect } from 'react';
import { Booking, CarModel, Unavailability, Car, Salesperson } from '../types';
import { CAR_MODELS, TIME_SLOTS, AVAILABLE_CAR_MODELS } from '../constants';
import SearchableSelect from './SearchableSelect';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'branch' | 'carId'>) => void;
  initialData?: Partial<Booking>;
  bookings: Booking[];
  unavailability: Unavailability[];
  canSave: boolean;
  carModels: Car[];
  salespeople: Salesperson[];
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, initialData, bookings, unavailability, canSave, carModels, salespeople }) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [carModel, setCarModel] = useState<CarModel>('' as CarModel);
  const [notes, setNotes] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [error, setError] = useState('');
  const [availableCarModels, setAvailableCarModels] = useState<Car[]>(carModels);

  // Effect to initialize form state when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      setCustomerName(initialData.customerName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      const initialDate = initialData.date || new Date().toISOString().split('T')[0];
      const initialTimeSlot = initialData.timeSlot || TIME_SLOTS[0];
      setDate(initialDate);
      setTimeSlot(initialTimeSlot);
      setNotes(initialData.notes || '');
      setSalesperson(initialData.salesperson || '');
    }
  }, [initialData, isOpen]);

  // Effect to update available car models whenever the date or time slot changes
  useEffect(() => {
    if (!isOpen) return;

    const bookedCarModelsInSlot = new Set(
        bookings
            .filter(b => b.date === date && b.timeSlot === timeSlot)
            .map(b => b.carModel)
    );

    const unavailableCarModelsInSlot = new Set(
        unavailability
            .filter(u => u.date === date && timeSlot >= u.startTime && timeSlot < u.endTime)
            .map(u => u.carModel)
    );

    const availableModels = carModels.filter(m => 
        !bookedCarModelsInSlot.has(m.modelName as CarModel) && !unavailableCarModelsInSlot.has(m.modelName as CarModel)
    );
    
    setAvailableCarModels(availableModels);
    
    // If the previously selected car model is no longer available,
    // switch to the first available one. Otherwise, keep the selection.
    if (carModel && !availableModels.some(m => m.modelName === carModel)) {
      setCarModel('' as CarModel);
    }
  }, [isOpen, date, timeSlot, bookings, unavailability, carModels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (availableCarModels.length === 0) {
        setError('ไม่มีรถว่างในเวลานี้ ไม่สามารถทำการจองได้');
        return;
    }
    
    if (!customerName || !date || !timeSlot || !carModel || !salesperson) {
      setError('กรุณากรอกข้อมูลที่จำเป็นทุกช่อง (ยกเว้นเบอร์โทรและหมายเหตุ)');
      return;
    }
    
    const selectedCar = carModels.find(m => m.modelName === carModel);
    const carBranch = selectedCar?.branch || '';

    onSave({
      customerName,
      phoneNumber,
      date,
      timeSlot,
      carModel,
      carBranch,
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
    setCarModel('' as CarModel);
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
                <SearchableSelect
                    value={timeSlot}
                    onChange={setTimeSlot}
                    options={TIME_SLOTS.map(slot => ({ value: slot, label: slot }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รุ่นรถ*</label>
              {availableCarModels.length > 0 ? (
                <SearchableSelect 
                  value={carModel} 
                  onChange={val => setCarModel(val as CarModel)} 
                  options={availableCarModels.map(car => ({
                    value: car.modelName,
                    label: `${car.modelName} (${car.branch})`
                  }))}
                  placeholder="เลือกรุ่นรถ"
                />
              ) : (
                <div className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm p-2 text-gray-500">
                    ไม่มีรถว่างในเวลานี้
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อเซลส์*</label>
              <SearchableSelect 
                value={salesperson} 
                onChange={setSalesperson} 
                options={salespeople.map(s => ({ value: s.name, label: s.name }))}
                placeholder="เลือกเซลส์"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">ยกเลิก</button>
              <button type="submit" style={{ backgroundColor: '#7D9AB9' }} className="text-white px-4 py-2 rounded-md hover:opacity-90 disabled:bg-gray-400" disabled={availableCarModels.length === 0 || !canSave}>บันทึก</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
