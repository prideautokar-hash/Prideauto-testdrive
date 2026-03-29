import React, { useState } from 'react';
import { Car, Branch, Salesperson } from '../types';
import { TrashIcon, WrenchIcon, UserIcon, CarIcon } from './icons';

interface CarManagementViewProps {
    cars: Car[];
    branches: { id: number; name: string }[];
    salespeople: Salesperson[];
    onAddCar: (car: Omit<Car, 'id'>) => Promise<void>;
    onUpdateCar: (car: Car) => Promise<void>;
    onDeleteCar: (id: number) => Promise<void>;
    onAddSalesperson: (salesperson: Omit<Salesperson, 'id'>) => Promise<void>;
    onUpdateSalesperson: (salesperson: Salesperson) => Promise<void>;
}

const CarManagementView: React.FC<CarManagementViewProps> = ({ 
    cars, 
    branches, 
    salespeople,
    onAddCar, 
    onUpdateCar, 
    onDeleteCar,
    onAddSalesperson,
    onUpdateSalesperson
}) => {
    const [activeTab, setActiveTab] = useState<'cars' | 'salespeople'>('cars');
    const [isAdding, setIsAdding] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
    
    const [modelName, setModelName] = useState('');
    const [carBranchId, setCarBranchId] = useState<number>(0);
    const [isActive, setIsActive] = useState(true);
    
    const [salespersonName, setSalespersonName] = useState('');
    const [salespersonBranchId, setSalespersonBranchId] = useState<number>(0);
    const [salespersonIsActive, setSalespersonIsActive] = useState(true);
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setModelName('');
        setCarBranchId(branches.length > 0 ? branches[0].id : 0);
        setIsActive(true);
        
        setSalespersonName('');
        setSalespersonBranchId(branches.length > 0 ? branches[0].id : 0);
        setSalespersonIsActive(true);
        
        setIsAdding(false);
        setEditingCar(null);
        setEditingSalesperson(null);
        setError('');
    };

    const handleEditCar = (car: Car) => {
        setEditingCar(car);
        setModelName(car.modelName);
        setCarBranchId(car.branchId);
        setIsActive(car.isActive);
        setIsAdding(true);
    };

    const handleEditSalesperson = (sp: Salesperson) => {
        setEditingSalesperson(sp);
        setSalespersonName(sp.name);
        setSalespersonBranchId(sp.branchId);
        setSalespersonIsActive(sp.isActive);
        setIsAdding(true);
    };

    const handleStartAdding = () => {
        setIsAdding(true);
        if (activeTab === 'cars') {
            if (branches.length > 0) setCarBranchId(branches[0].id);
        } else {
            if (branches.length > 0) setSalespersonBranchId(branches[0].id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (activeTab === 'cars') {
                if (!modelName) throw new Error('กรุณาระบุชื่อรุ่นรถ');
                if (editingCar) {
                    await onUpdateCar({ ...editingCar, modelName, branchId: carBranchId, isActive });
                } else {
                    await onAddCar({ modelName, branchId: carBranchId, isActive });
                }
            } else {
                if (!salespersonName) throw new Error('กรุณาระบุชื่อเซลส์');
                if (editingSalesperson) {
                    await onUpdateSalesperson({ ...editingSalesperson, name: salespersonName, branchId: salespersonBranchId, isActive: salespersonIsActive });
                } else {
                    await onAddSalesperson({ name: salespersonName, branchId: salespersonBranchId, isActive: salespersonIsActive });
                }
            }
            resetForm();
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
            try {
                await onDeleteCar(id);
            } catch (err: any) {
                setError(err.message || 'ไม่สามารถลบข้อมูลได้');
            }
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Setting</h1>
                    <p className="text-gray-500">จัดการข้อมูลรถและพนักงานขายในระบบ</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={handleStartAdding}
                        style={{ backgroundColor: '#7D9AB9' }}
                        className="text-white px-4 py-2 rounded-md hover:opacity-90 shadow-sm"
                    >
                        {activeTab === 'cars' ? '+ เพิ่มรถใหม่' : '+ เพิ่มเซลส์ใหม่'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button 
                    onClick={() => { setActiveTab('cars'); resetForm(); }}
                    className={`px-6 py-2 font-medium text-sm transition-colors ${activeTab === 'cars' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <CarIcon className="w-4 h-4 inline mr-2" />
                    จัดการรถ
                </button>
                <button 
                    onClick={() => { setActiveTab('salespeople'); resetForm(); }}
                    className={`px-6 py-2 font-medium text-sm transition-colors ${activeTab === 'salespeople' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    จัดการเซลส์
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {activeTab === 'cars' 
                            ? (editingCar ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถใหม่') 
                            : (editingSalesperson ? 'แก้ไขข้อมูลเซลส์' : 'เพิ่มเซลส์ใหม่')}
                    </h2>
                    {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'cars' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ชื่อรุ่นรถ (และสี)*</label>
                                    <input 
                                        type="text" 
                                        value={modelName} 
                                        onChange={e => setModelName(e.target.value)}
                                        placeholder="เช่น BYD Atto 3 (สีขาว)"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">สังกัดสาขา*</label>
                                    <select 
                                        value={carBranchId} 
                                        onChange={e => setCarBranchId(Number(e.target.value))}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ชื่อเซลส์*</label>
                                    <input 
                                        type="text" 
                                        value={salespersonName} 
                                        onChange={e => setSalespersonName(e.target.value)}
                                        placeholder="ระบุชื่อเซลส์"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">สังกัดสาขา*</label>
                                    <select 
                                        value={salespersonBranchId} 
                                        onChange={e => setSalespersonBranchId(Number(e.target.value))}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                checked={activeTab === 'cars' ? isActive : salespersonIsActive} 
                                onChange={e => activeTab === 'cars' ? setIsActive(e.target.checked) : setSalespersonIsActive(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">พร้อมใช้งาน (Active)</label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button 
                                type="button" 
                                onClick={resetForm}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={{ backgroundColor: '#7D9AB9' }}
                                className="text-white px-6 py-2 rounded-md hover:opacity-90 disabled:bg-gray-400"
                            >
                                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {activeTab === 'cars' ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รุ่นรถ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สังกัดสาขา</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cars.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">ไม่มีข้อมูลรถในระบบ</td>
                                </tr>
                            ) : (
                                cars.map(car => (
                                    <tr key={car.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{car.modelName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {branches.find(b => b.id === car.branchId)?.name || 'ไม่ระบุ'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${car.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {car.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button 
                                                onClick={() => handleEditCar(car)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="แก้ไข"
                                            >
                                                <WrenchIcon className="w-5 h-5 inline" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(car.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="ลบ"
                                            >
                                                <TrashIcon className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อเซลส์</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สังกัดสาขา</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salespeople.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">ไม่มีข้อมูลเซลส์ในระบบ</td>
                                </tr>
                            ) : (
                                salespeople.map(sp => (
                                    <tr key={sp.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sp.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {branches.find(b => b.id === sp.branchId)?.name || 'ไม่ระบุ'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {sp.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button 
                                                onClick={() => handleEditSalesperson(sp)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="แก้ไข"
                                            >
                                                <WrenchIcon className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CarManagementView;
