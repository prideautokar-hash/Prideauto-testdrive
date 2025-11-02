import React, { useState, useMemo } from 'react';
import { Unavailability, CarModel } from '../types';
import { CAR_MODELS } from '../constants';
import { TrashIcon } from './icons';

interface UnavailableCarsViewProps {
    unavailabilityRecords: Unavailability[];
    onAdd: (carModel: CarModel, date: string, blockType: 'morning' | 'afternoon' | 'all_day', reason: string) => void;
    onDelete: (unavailabilityId: string) => void;
}

type BlockType = 'morning' | 'afternoon' | 'all_day';

const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const UnavailabilityModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (carModel: CarModel, blockType: BlockType, reason: string) => void;
    defaultDate: string;
}> = ({ isOpen, onClose, onSave, defaultDate }) => {
    const [carModel, setCarModel] = useState<CarModel>(CAR_MODELS[0]);
    const [blockType, setBlockType] = useState<BlockType>('all_day');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!carModel || !blockType) {
            setError('กรุณาเลือกรุ่นรถและช่วงเวลา');
            return;
        }
        onSave(carModel, blockType, reason);
        onClose();
    };
    
    const BlockButton = ({ value, label }: { value: BlockType, label: string }) => (
        <button
          type="button"
          onClick={() => setBlockType(value)}
          className={`w-full p-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            blockType === value ? 'text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{ backgroundColor: blockType === value ? '#7D9AB9' : undefined }}
        >
          {label}
        </button>
      );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">บล็อกรถไม่พร้อมใช้งาน</h2>
                    <p className="text-sm text-gray-600 mb-4">สำหรับวันที่: {new Date(defaultDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">รุ่นรถ*</label>
                            <select value={carModel} onChange={e => setCarModel(e.target.value as CarModel)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                                {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ช่วงเวลา*</label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                <BlockButton value="morning" label="ครึ่งเช้า" />
                                <BlockButton value="afternoon" label="ครึ่งบ่าย" />
                                <BlockButton value="all_day" label="ทั้งวัน" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">เหตุผล/หมายเหตุ</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">ยกเลิก</button>
                            <button type="button" onClick={handleSubmit} style={{ backgroundColor: '#7D9AB9' }} className="text-white px-4 py-2 rounded-md hover:opacity-90">บันทึก</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const UnavailableCarsView: React.FC<UnavailableCarsViewProps> = ({ unavailabilityRecords, onAdd, onDelete }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedDateString = toYYYYMMDD(selectedDate);
    
    const recordsForSelectedDate = useMemo(() => {
        return unavailabilityRecords
            .filter(r => r.date === selectedDateString)
            .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.carModel.localeCompare(b.carModel));
    }, [unavailabilityRecords, selectedDateString]);

    const handleSave = (carModel: CarModel, blockType: BlockType, reason: string) => {
        onAdd(carModel, selectedDateString, blockType, reason);
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">รายงานรถไม่พร้อมใช้งาน</h1>
                    <p className="text-gray-500">จัดการบล็อกคิวรถยนต์สำหรับซ่อมบำรุงหรือเหตุผลอื่นๆ</p>
                </div>
                <div className="flex items-center gap-4">
                     <input
                        type="date"
                        value={selectedDateString}
                        onChange={(e) => {
                            if (e.target.value) {
                                const [year, month, day] = e.target.value.split('-').map(Number);
                                setSelectedDate(new Date(year, month - 1, day));
                            }
                        }}
                        className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ backgroundColor: '#98B6D7' }}
                        className="text-white px-4 py-2 rounded-md hover:opacity-90 shadow-sm"
                    >
                        + บล็อกรถ
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow">
                 <h3 className="text-xl font-bold text-gray-800 p-4 border-b">
                    รายการสำหรับวันที่ {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                {recordsForSelectedDate.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {recordsForSelectedDate.map(record => (
                        <li key={record.id} className="p-4 hover:bg-gray-50 transition-colors duration-150 group">
                          <div className="flex items-center justify-between gap-4">
                              <div>
                                  <p className="font-semibold text-gray-800">{record.carModel}</p>
                                  <p className="text-sm text-gray-600">เวลา: {record.startTime} - {record.endTime}</p>
                                  {record.reason && <p className="text-sm text-gray-500 mt-1">เหตุผล: {record.reason}</p>}
                              </div>
                              <button
                                onClick={() => onDelete(record.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1 rounded-full"
                                title="ลบการบล็อก"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                ) : (
                    <div className="p-6 text-center text-gray-500">
                        ไม่มีรายการรถไม่พร้อมใช้งานสำหรับวันที่เลือก
                    </div>
                )}
            </div>

            <UnavailabilityModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                defaultDate={selectedDateString}
            />
        </div>
    );
};

export default UnavailableCarsView;
