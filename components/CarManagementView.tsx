import React, { useState, useEffect } from 'react';
import { Car, Branch, Salesperson, User, Booking, Unavailability } from '../types';
import { TrashIcon, WrenchIcon, UserIcon, CarIcon, ChartIcon, ListIcon } from './icons';
import { getUsers, addUser, updateUser, deleteUser, getReportBookings, getReportUnavailability, executeSql } from '../services/apiService';
import SearchableSelect from './SearchableSelect';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface CarManagementViewProps {
    cars: Car[];
    branches: { id: number; name: string }[];
    salespeople: Salesperson[];
    onAddCar: (car: Omit<Car, 'id'>) => Promise<void>;
    onUpdateCar: (car: Car) => Promise<void>;
    onDeleteCar: (id: number) => Promise<void>;
    onAddSalesperson: (salesperson: Omit<Salesperson, 'id'>) => Promise<void>;
    onUpdateSalesperson: (salesperson: Salesperson) => Promise<void>;
    authToken: string;
}

const CarManagementView: React.FC<CarManagementViewProps> = ({ 
    cars, 
    branches, 
    salespeople,
    onAddCar, 
    onUpdateCar, 
    onDeleteCar,
    onAddSalesperson,
    onUpdateSalesperson,
    authToken
}) => {
    const [activeTab, setActiveTab] = useState<'cars' | 'salespeople' | 'users' | 'reports' | 'sql'>('cars');
    const [isAdding, setIsAdding] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const [modelName, setModelName] = useState('');
    const [shortModelName, setShortModelName] = useState('');
    const [carModel, setCarModel] = useState('');
    const [carBranchId, setCarBranchId] = useState<number>(0);
    const [isActive, setIsActive] = useState(true);
    
    const [salespersonName, setSalespersonName] = useState('');
    const [salespersonBranchId, setSalespersonBranchId] = useState<number>(0);
    const [salespersonIsActive, setSalespersonIsActive] = useState(true);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userRole, setUserRole] = useState<'admin' | 'user' | 'executive'>('user');
    const [userStatus, setUserStatus] = useState<'approved' | 'not approved'>('not approved');
    const [userNote, setUserNote] = useState('');

    const [users, setUsers] = useState<User[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportBookings, setReportBookings] = useState<Booking[]>([]);
    const [reportUnavailability, setReportUnavailability] = useState<Unavailability[]>([]);
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers(authToken);
            setUsers(data);
        } catch (err: any) {
            setError('ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
        }
    };

    const fetchReports = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const [bookingsData, unavailabilityData] = await Promise.all([
                getReportBookings(startDate, endDate, authToken),
                getReportUnavailability(startDate, endDate, authToken)
            ]);
            setReportBookings(bookingsData);
            setReportUnavailability(unavailabilityData);
        } catch (err: any) {
            setError('ไม่สามารถดึงข้อมูลรายงานได้');
        } finally {
            setIsSubmitting(false);
        }
    };

    const exportBookingsToExcel = () => {
        console.log('Exporting bookings:', reportBookings.length, 'records');
        if (reportBookings.length === 0) {
            alert('ไม่มีข้อมูลสำหรับการส่งออก กรุณากดปุ่ม "ดึงข้อมูล" ก่อน');
            return;
        }

        const data = reportBookings.map(b => ({
            'วันที่ test drive': b.date,
            'เวลาที่ test drive': b.timeSlot,
            'ชื่อลูกค้า': b.customerName,
            'เบอร์โทร': b.phoneNumber || '',
            'รุ่นรถชื่อเต็ม': b.carModelFull || '',
            'รุ่นรถชื่อย่อ': b.carModelShort || '',
            'รุ่นรถ': b.carModelType || '',
            'สาขา': b.carBranch,
            'เซลส์': b.salesperson,
            'หมายเหตุ': b.notes || '',
            'ผู้ทำการบันทึก': b.recordedBy || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Test Drive Report");
        
        XLSX.writeFile(workbook, `TestDrive_Report_${startDate}_to_${endDate}.xlsx`);
    };

    const exportUnavailabilityToExcel = () => {
        console.log('Exporting unavailability:', reportUnavailability.length, 'records');
        if (reportUnavailability.length === 0) {
            alert('ไม่มีข้อมูลสำหรับการส่งออก กรุณากดปุ่ม "ดึงข้อมูล" ก่อน');
            return;
        }

        const data = reportUnavailability.map(u => ({
            'วันที่รถไม่ว่าง': u.date,
            'ช่วงเวลา': u.period || `${u.startTime} - ${u.endTime}`,
            'รุ่นรถชื่อเต็ม': u.carModelFull || '',
            'รุ่นรถชื่อย่อ': u.carModelShort || '',
            'รุ่นรถ': u.carModelType || '',
            'เหตุผล': u.reason || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Unavailability Report");
        
        XLSX.writeFile(workbook, `Unavailability_Report_${startDate}_to_${endDate}.xlsx`);
    };

    const resetForm = () => {
        setModelName('');
        setShortModelName('');
        setCarModel('');
        setCarBranchId(branches.length > 0 ? branches[0].id : 0);
        setIsActive(true);
        
        setSalespersonName('');
        setSalespersonBranchId(branches.length > 0 ? branches[0].id : 0);
        setSalespersonIsActive(true);

        setUsername('');
        setPassword('');
        setUserRole('user');
        setUserStatus('not approved');
        setUserNote('');
        
        setIsAdding(false);
        setEditingCar(null);
        setEditingSalesperson(null);
        setEditingUser(null);
        setError('');
    };

    const handleEditCar = (car: Car) => {
        setEditingCar(car);
        setModelName(car.modelName);
        setShortModelName(car.shortModelName || '');
        setCarModel(car.carModel || '');
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

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUsername(user.username);
        setPassword(''); // Don't show password
        setUserRole(user.role);
        setUserStatus(user.status);
        setUserNote(user.note || '');
        setIsAdding(true);
    };

    const handleStartAdding = () => {
        setIsAdding(true);
        if (activeTab === 'cars') {
            if (branches.length > 0) setCarBranchId(branches[0].id);
        } else if (activeTab === 'salespeople') {
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
                    await onUpdateCar({ ...editingCar, modelName, shortModelName, carModel, branchId: carBranchId, isActive });
                } else {
                    await onAddCar({ modelName, shortModelName, carModel, branchId: carBranchId, isActive });
                }
            } else if (activeTab === 'salespeople') {
                if (!salespersonName) throw new Error('กรุณาระบุชื่อเซลส์');
                if (editingSalesperson) {
                    await onUpdateSalesperson({ ...editingSalesperson, name: salespersonName, branchId: salespersonBranchId, isActive: salespersonIsActive });
                } else {
                    await onAddSalesperson({ name: salespersonName, branchId: salespersonBranchId, isActive: salespersonIsActive });
                }
            } else if (activeTab === 'users') {
                if (!username) throw new Error('กรุณาระบุชื่อผู้ใช้งาน');
                if (editingUser) {
                    await updateUser({ ...editingUser, username, role: userRole, status: userStatus, note: userNote, password: password || undefined }, authToken);
                } else {
                    if (!password) throw new Error('กรุณาระบุรหัสผ่านสำหรับผู้ใช้ใหม่');
                    await addUser({ username, password, role: userRole, status: userStatus, note: userNote }, authToken);
                }
                fetchUsers();
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
                if (activeTab === 'cars') {
                    await onDeleteCar(id);
                } else if (activeTab === 'users') {
                    await deleteUser(id, authToken);
                    fetchUsers();
                }
            } catch (err: any) {
                setError(err.message || 'ไม่สามารถลบข้อมูลได้');
            }
        }
    };

    const [sqlQuery, setSqlQuery] = useState('');
    const [sqlResult, setSqlResult] = useState<any>(null);

    const handleExecuteSql = async () => {
        setIsSubmitting(true);
        setError('');
        setSqlResult(null);
        try {
            const data = await executeSql(sqlQuery, authToken);
            setSqlResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Setting</h1>
                    <p className="text-gray-500">จัดการข้อมูลรถและพนักงานขายในระบบ</p>
                </div>
                {!isAdding && activeTab !== 'reports' && (
                    <button 
                        onClick={handleStartAdding}
                        style={{ backgroundColor: '#7D9AB9' }}
                        className="text-white px-4 py-2 rounded-md hover:opacity-90 shadow-sm"
                    >
                        {activeTab === 'cars' ? '+ เพิ่มรถใหม่' : activeTab === 'salespeople' ? '+ เพิ่มเซลส์ใหม่' : '+ เพิ่มผู้ใช้ใหม่'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto">
                <button 
                    onClick={() => { setActiveTab('cars'); resetForm(); }}
                    className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'cars' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <CarIcon className="w-4 h-4 inline mr-2" />
                    จัดการรถ
                </button>
                <button 
                    onClick={() => { setActiveTab('salespeople'); resetForm(); }}
                    className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'salespeople' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    จัดการเซลส์
                </button>
                <button 
                    onClick={() => { setActiveTab('users'); resetForm(); }}
                    className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    จัดการผู้ใช้
                </button>
                <button 
                    onClick={() => { setActiveTab('reports'); resetForm(); }}
                    className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'reports' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ChartIcon className="w-4 h-4 inline mr-2" />
                    รายงาน
                </button>
                <button 
                    onClick={() => { setActiveTab('sql'); resetForm(); }}
                    className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'sql' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <WrenchIcon className="w-4 h-4 inline mr-2" />
                    SQL Editor
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {activeTab === 'cars' 
                            ? (editingCar ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถใหม่') 
                            : activeTab === 'salespeople'
                            ? (editingSalesperson ? 'แก้ไขข้อมูลเซลส์' : 'เพิ่มเซลส์ใหม่')
                            : (editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่')}
                    </h2>
                    {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'cars' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
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
                                    <label className="block text-sm font-medium text-gray-700">ชื่อสั้น (Short Model Name)</label>
                                    <input 
                                        type="text" 
                                        value={shortModelName} 
                                        onChange={e => setShortModelName(e.target.value)}
                                        placeholder="เช่น Atto 3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">รุ่น (Car Model)</label>
                                    <input 
                                        type="text" 
                                        value={carModel} 
                                        onChange={e => setCarModel(e.target.value)}
                                        placeholder="เช่น Premium"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">สังกัดสาขา*</label>
                                    <SearchableSelect 
                                        value={carBranchId} 
                                        onChange={val => setCarBranchId(Number(val))}
                                        options={branches.map(b => ({ value: b.id, label: b.name }))}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'salespeople' && (
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
                                    <SearchableSelect 
                                        value={salespersonBranchId} 
                                        onChange={val => setSalespersonBranchId(Number(val))}
                                        options={branches.map(b => ({ value: b.id, label: b.name }))}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้งาน*</label>
                                    <input 
                                        type="text" 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="Username"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{editingUser ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน*'}</label>
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">บทบาท (Role)*</label>
                                    <SearchableSelect 
                                        value={userRole} 
                                        onChange={val => setUserRole(val as any)}
                                        options={[
                                            { value: 'user', label: 'User' },
                                            { value: 'admin', label: 'Admin' },
                                            { value: 'executive', label: 'Executive' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">สถานะ (Status)*</label>
                                    <SearchableSelect 
                                        value={userStatus} 
                                        onChange={val => setUserStatus(val as any)}
                                        options={[
                                            { value: 'not approved', label: 'Not Approved' },
                                            { value: 'approved', label: 'Approved' }
                                        ]}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">หมายเหตุ (Note)</label>
                                    <textarea 
                                        value={userNote} 
                                        onChange={e => setUserNote(e.target.value)}
                                        placeholder="หมายเหตุเพิ่มเติม"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {(activeTab === 'cars' || activeTab === 'salespeople') && (
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
                        )}

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

            {activeTab === 'reports' && (
                <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                    <h2 className="text-xl font-semibold mb-4">ดึงข้อมูลรายงาน</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">จากวันที่</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ถึงวันที่</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={fetchReports}
                            disabled={isSubmitting}
                            style={{ backgroundColor: '#7D9AB9' }}
                            className="text-white px-8 py-2 rounded-md hover:opacity-90 disabled:bg-gray-400 font-medium transition-all shadow-sm"
                        >
                            {isSubmitting ? 'กำลังโหลด...' : '1. ดึงข้อมูล'}
                        </button>
                        
                        <button 
                            onClick={exportBookingsToExcel}
                            disabled={isSubmitting}
                            className={`px-6 py-2 rounded-md font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                                reportBookings.length > 0 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            <ChartIcon className="w-4 h-4" />
                            2. Export Test Drive (Excel)
                        </button>
                        
                        <button 
                            onClick={exportUnavailabilityToExcel}
                            disabled={isSubmitting}
                            className={`px-6 py-2 rounded-md font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                                reportUnavailability.length > 0 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            <WrenchIcon className="w-4 h-4" />
                            3. Export Unavailability (Excel)
                        </button>
                    </div>
                    
                    {reportBookings.length === 0 && reportUnavailability.length === 0 && !isSubmitting && (
                        <p className="mt-4 text-sm text-gray-500 italic">
                            * กรุณากดปุ่ม "ดึงข้อมูล" ก่อนเพื่อเตรียมข้อมูลสำหรับการ Export
                        </p>
                    )}
                </div>
            )}

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {activeTab === 'cars' && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รุ่นรถ (Full)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อสั้น</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รุ่น</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สังกัดสาขา</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cars.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">ไม่มีข้อมูลรถในระบบ</td>
                                </tr>
                            ) : (
                                cars.map(car => (
                                    <tr key={car.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{car.modelName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.shortModelName || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.carModel || '-'}</td>
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
                )}

                {activeTab === 'salespeople' && (
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

                {activeTab === 'users' && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">ไม่มีข้อมูลผู้ใช้ในระบบ</td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {user.status === 'approved' ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button 
                                                onClick={() => handleEditUser(user)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="แก้ไข"
                                            >
                                                <WrenchIcon className="w-5 h-5 inline" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
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
                )}

                {activeTab === 'reports' && (
                    <div className="p-4 space-y-8">
                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center">
                                <ListIcon className="w-5 h-5 mr-2" />
                                รายการจอง (Bookings)
                            </h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">รุ่นรถ</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">เซลส์</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ผู้บันทึก</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportBookings.length === 0 ? (
                                            <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500 text-sm">ไม่มีข้อมูล</td></tr>
                                        ) : (
                                            reportBookings.map(b => (
                                                <tr key={b.id} className="text-sm">
                                                    <td className="px-4 py-2">{b.date}</td>
                                                    <td className="px-4 py-2">{b.timeSlot}</td>
                                                    <td className="px-4 py-2">{b.customerName}</td>
                                                    <td className="px-4 py-2">{b.carModelShort || b.carModel}</td>
                                                    <td className="px-4 py-2">{b.salesperson}</td>
                                                    <td className="px-4 py-2">{b.recordedBy || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center">
                                <WrenchIcon className="w-5 h-5 mr-2" />
                                รายการรถไม่พร้อม (Unavailability)
                            </h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ช่วงเวลา</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">รุ่นรถ</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportUnavailability.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500 text-sm">ไม่มีข้อมูล</td></tr>
                                        ) : (
                                            reportUnavailability.map(u => (
                                                <tr key={u.id} className="text-sm">
                                                    <td className="px-4 py-2">{u.date}</td>
                                                    <td className="px-4 py-2">{u.period || `${u.startTime} - ${u.endTime}`}</td>
                                                    <td className="px-4 py-2">{u.carModelShort || u.carModel}</td>
                                                    <td className="px-4 py-2">{u.reason}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'sql' && (
                    <div className="p-4 space-y-4">
                        <h3 className="text-lg font-medium">SQL Editor</h3>
                        <p className="text-xs text-red-500">คำเตือน: การรันคำสั่ง SQL โดยตรงอาจทำให้ข้อมูลเสียหายได้ โปรดระมัดระวัง</p>
                        <textarea 
                            value={sqlQuery}
                            onChange={e => setSqlQuery(e.target.value)}
                            placeholder="SELECT * FROM public.salespeople"
                            className="w-full h-32 p-2 font-mono text-sm border rounded-md"
                        />
                        <button 
                            onClick={handleExecuteSql}
                            disabled={isSubmitting || !sqlQuery}
                            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'กำลังรัน...' : 'รันคำสั่ง SQL'}
                        </button>
                        {sqlResult && (
                            <div className="mt-4 overflow-x-auto border rounded-lg max-h-96">
                                <div className="p-2 bg-gray-100 text-xs font-mono border-b">
                                    Command: {sqlResult.command} | Row Count: {sqlResult.rowCount}
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        {sqlResult.rows.length > 0 && (
                                            <tr>
                                                {Object.keys(sqlResult.rows[0]).map(key => (
                                                    <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>
                                                ))}
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sqlResult.rows.map((row: any, i: number) => (
                                            <tr key={i} className="text-xs">
                                                {Object.values(row).map((val: any, j: number) => (
                                                    <td key={j} className="px-4 py-2">{val === null ? 'NULL' : String(val)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarManagementView;
