import React, { useMemo, useState, useEffect } from 'react';
import { Booking, CarModel, Unavailability, Car } from '../types';
import { TrashIcon } from './icons';
import { TIME_SLOTS } from '../constants';
import SearchableSelect from './SearchableSelect';

interface UnavailableCarsViewProps {
    bookings: Booking[];
    unavailability: Unavailability[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    carModels: Car[];
    onAddUnavailability: (carModel: CarModel, date: string, period: string, reason: string) => Promise<void>;
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

const formatThaiDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    // Use UTC to prevent timezone shift issues when creating the date object
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
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
    const [selectedCarModel, setSelectedCarModel] = useState<CarModel>('' as CarModel);
    const [period, setPeriod] = useState<string>('morning');
    const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[0]);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (carModels.length > 0 && selectedCarModel && !carModels.some(m => m.modelName === selectedCarModel)) {
            setSelectedCarModel('' as CarModel);
        }
    }, [carModels]);

    const selectedDateString = toYYYYMMDD(selectedDate);
    const todayString = toYYYYMMDD(new Date());

    const upcomingUnavailability = useMemo(() => {
        return unavailability
            .filter(u => u.date >= todayString)
            .sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
                return a.carModel.localeCompare(b.carModel);
            });
    }, [unavailability, todayString]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
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
        } else if (period === 'all-day') {
            startTime = '08:00'; endTime = '17:00';
        } else {
            // Custom slot
            startTime = selectedSlot;
            const [h, m] = selectedSlot.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m + 30, 0, 0);
            endTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

        try {
            const finalPeriod = period === 'custom-slot' ? selectedSlot : period;
            await onAddUnavailability(selectedCarModel, selectedDateString, finalPeriod, reason);
            setSuccessMessage('การบันทึกสำเร็จแล้ว');
            setReason(''); // Reset form on success
            setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">รถไม่พร้อมใช้งาน</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">แจ้งรถไม่พร้อมใช้งาน</h2>
                        {successMessage && <p className="bg-green-100 text-green-700 p-2 rounded mb-4 text-sm">{successMessage}</p>}
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
                                <SearchableSelect 
                                    value={selectedCarModel} 
                                    onChange={val => setSelectedCarModel(val as CarModel)} 
                                    options={carModels.map(car => ({
                                        value: car.modelName,
                                        label: `${car.modelName} (${car.branch})`
                                    }))}
                                    placeholder="เลือกรุ่นรถ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ช่วงเวลา</label>
                                <SearchableSelect 
                                    value={period} 
                                    onChange={setPeriod} 
                                    options={[
                                        { value: 'morning', label: 'ครึ่งเช้า (08:00 - 13:00)' },
                                        { value: 'afternoon', label: 'ครึ่งบ่าย (13:00 - 17:00)' },
                                        { value: 'all-day', label: 'ทั้งวัน (08:00 - 17:00)' },
                                        { value: 'custom-slot', label: 'ระบุตามช่วงเวลา (Slot)' }
                                    ]}
                                />
                            </div>
                            {period === 'custom-slot' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">เลือก Slot เวลา (30 นาที)</label>
                                    <SearchableSelect 
                                        value={selectedSlot} 
                                        onChange={setSelectedSlot} 
                                        options={TIME_SLOTS.map(slot => ({ value: slot, label: slot }))}
                                    />
                                </div>
                            )}
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
                            รายการทั้งหมดที่ยังมาไม่ถึง
                        </h2>
                        {upcomingUnavailability.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {upcomingUnavailability.map(item => (
                                    <li key={item.id} className="py-3 group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-800">{item.carModel}</p>
                                                <p className="text-sm text-gray-600">
                                                   วันที่: {formatThaiDate(item.date)}
                                                </p>
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
                            <p className="text-gray-500 text-center py-8">ไม่มีรายการรถไม่พร้อมใช้งานที่กำลังจะมาถึง</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnavailableCarsView;