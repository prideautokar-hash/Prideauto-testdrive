import React, { useMemo, useState } from 'react';
import { Booking, CarModel, Unavailability } from '../types';
import { TrashIcon } from './icons';

interface UnavailableCarsViewProps {
    bookings: Booking[];
    unavailability: Unavailability[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    carModels: CarModel[];
    onAddUnavailability: (carModel: CarModel, date: string, period: 'morning' | 'afternoon' | 'all-day', reason: string) => void;
    onDeleteUnavailability: (id: number) => void;
}

// Helper to format date to YYYY-MM-DD in local timezone
const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const UnavailableCarsView: React.FC<UnavailableCarsViewProps> = ({
    bookings,
    unavailability,
    selectedDate,
    setSelectedDate,
    carModels,
    onAddUnavailability,
    onDeleteUnavailability
}) => {
    const [selectedCarModel, setSelectedCarModel] = useState<CarModel>(carModels[0]);
    const [period, setPeriod] = useState<'morning' | 'afternoon' | 'all-day'>('morning');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const selectedDateString = toYYYYMMDD(selectedDate);

    const unavailabilityForSelectedDate = useMemo(() => {
        return unavailability
            .filter(u => u.date === selectedDateString)
            .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.carModel.localeCompare(b.carModel));
    }, [unavailability, selectedDateString]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedCarModel || !selectedDateString || !period) {
            setError('กรุณาเลือกข้อมูลให้ครบถ้วน');
            return;
        }

        // --- Client-side Conflict Check ---
        let startTime, endTime;
        if (period === 'morning') {
            startTime = '08:00'; endTime = '13:00';
        } else if (period === 'afternoon') {
            startTime = '13:00'; endTime = '17:00';
        } else { // all-day
            startTime = '08:00'; endTime = '17:00';
        }

        const conflictingBooking = bookings.find(booking =>
            booking.carModel === selectedCarModel &&
            booking.date === selectedDateString &&
            booking.timeSlot >= startTime &&
            booking.timeSlot < endTime
        );

        if (conflictingBooking) {
            setError(`มีคิวจอง Test Drive สำหรับรถคันนี้เวลา ${conflictingBooking.timeSlot} กรุณายกเลิกก่อน`);
            return;
        }
        // --- End of Conflict Check ---

        onAddUnavailability(selectedCarModel, selectedDateString, period, reason);
        // Reset form
        setReason('');
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">รถไม่พร้อมใช้งาน</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">แจ้งรถไม่พร้อมใช้งาน</h2>
                        {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">วันที่</label>
                                <input
                                    type="date"
                                    value={selectedDateString}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const [year, month, day] = e.target.value.split('-').map(Number);
                                            setSelectedDate(new Date(year, month - 1, day));
                                        }
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">รุ่นรถ</label>
                                <select value={selectedCarModel} onChange={e => setSelectedCarModel(e.target.value as CarModel)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                                    {carModels.map(model => <option key={model} value={model}>{model}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ช่วงเวลา</label>
                                <select value={period} onChange={e => setPeriod(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="morning">ครึ่งเช้า (08:00 - 13:00)</option>
                                    <option value="afternoon">ครึ่งบ่าย (13:00 - 17:00)</option>
                                    <option value="all-day">ทั้งวัน (08:00 - 17:00)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">เหตุผล (ถ้ามี)</label>
                                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" style={{ backgroundColor: '#7D9AB9' }} className="text-white px-4 py-2 rounded-md hover:opacity-90">
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            รายการสำหรับวันที่ {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h2>
                        {unavailabilityForSelectedDate.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {unavailabilityForSelectedDate.map(item => (
                                    <li key={item.id} className="py-3 group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-800">{item.carModel}</p>
                                                <p className="text-sm text-gray-600">
                                                    เวลา: {item.startTime} - {item.endTime}
                                                </p>
                                                {item.reason && <p className="text-sm text-gray-500">เหตุผล: {item.reason}</p>}
                                            </div>
                                            <button 
                                                onClick={() => onDeleteUnavailability(item.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1 rounded-full"
                                                title="ลบรายการ"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-8">ไม่มีรายการรถไม่พร้อมใช้งานสำหรับวันที่เลือก</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnavailableCarsView;