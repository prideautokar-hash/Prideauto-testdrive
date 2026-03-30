import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Booking, Branch, Unavailability, CarModel, Car, Salesperson } from './types';
import { CAR_MODELS, AVAILABLE_CAR_MODELS } from './constants';
import CalendarView from './components/CalendarView';
import SlotView from './components/SlotView';
import CarUsageView from './components/CarUsageView';
import DashboardView from './components/DashboardView';
import BookingModal from './components/BookingModal';
import { CalendarIcon, ListIcon, GridIcon, ChartIcon, WrenchIcon, SettingsIcon } from './components/icons';
import LoginPage from './components/LoginPage';
import { getBookings, addBooking, deleteBooking, getAppSetting, setAppSetting, getUnavailability, addUnavailability, deleteUnavailability, getCars, getBranches, getSalespeople } from './services/apiService';
import { Logo } from './components/Logo';
import UnavailableCarsView from './components/UnavailableCarsView';
import CarManagementView from './components/CarManagementView';
import { addCar, updateCar, deleteCar, addSalesperson, updateSalesperson } from './services/apiService';

type Page = 'calendar' | 'slots' | 'usage' | 'dashboard' | 'unavailable' | 'cars';

const App: React.FC = () => {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null); // 'admin' or 'user'
    
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [unavailability, setUnavailability] = useState<Unavailability[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
    const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
    
    const [currentPage, setCurrentPage] = useState<Page>('calendar');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState<Partial<Booking> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [error, setError] = useState<string | null>(null);
    const [appLogo, setAppLogo] = useState<string | null>(null);

    const fetchData = useCallback(async (token: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled([
                // Fetch for both branches
                getBookings(Branch.MAHASARAKHAM, token),
                getBookings(Branch.KALASIN, token),
                getUnavailability(Branch.MAHASARAKHAM, token),
                getUnavailability(Branch.KALASIN, token),
                getAppSetting('app_logo', token),
                getCars(token),
                getBranches(token),
                getSalespeople(Branch.MAHASARAKHAM, token),
                getSalespeople(Branch.KALASIN, token)
            ]);

            const mskBookings = results[0].status === 'fulfilled' ? results[0].value : [];
            const klsBookings = results[1].status === 'fulfilled' ? results[1].value : [];
            setBookings([...mskBookings, ...klsBookings]);

            const mskUnavailability = results[2].status === 'fulfilled' ? results[2].value : [];
            const klsUnavailability = results[3].status === 'fulfilled' ? results[3].value : [];
            setUnavailability([...mskUnavailability, ...klsUnavailability]);
            
            if (results[4].status === 'fulfilled') {
                setAppLogo(results[4].value.value);
            } else {
                 setAppLogo(null);
            }

            if (results[5].status === 'fulfilled') {
                setCars(results[5].value);
            }

            if (results[6].status === 'fulfilled') {
                setBranches(results[6].value);
            }

            const mskSalespeople = results[7].status === 'fulfilled' ? results[7].value : [];
            const klsSalespeople = results[8].status === 'fulfilled' ? results[8].value : [];
            setSalespeople([...mskSalespeople, ...klsSalespeople]);

        } catch (err) {
            setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUserRole = localStorage.getItem('userRole');

        if (storedToken && storedUserRole) {
            setAuthToken(storedToken);
            setUserRole(storedUserRole);
            fetchData(storedToken);
        } else {
            setIsLoading(false); // Not logged in, stop loading
        }
    }, [fetchData]);

    const isAdmin = userRole === 'admin' || userRole === 'executive';
    const isExecutive = userRole === 'executive';

    const openBookingModal = useCallback((data?: Partial<Booking>) => {
        if (!isAdmin) return;
        setModalInitialData(data);
        setIsModalOpen(true);
    }, [isAdmin]);

    const handleSaveBooking = async (newBookingData: Omit<Booking, 'id' | 'branch' | 'carId'>) => {
        if (!authToken) return;
        if (!isAdmin) {
            alert('คุณไม่มีสิทธิ์ในการบันทึกข้อมูล');
            return;
        }
        
        try {
            const branch = newBookingData.carBranch as Branch;
            await addBooking(newBookingData, branch, authToken);
            fetchData(authToken);
            setIsModalOpen(false);
        } catch(err: any) {
            console.error(err);
            alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };
    
    const handleDeleteBooking = async (bookingId: string) => {
        if (!authToken || !isAdmin) {
            alert('คุณไม่มีสิทธิ์ในการลบข้อมูล');
            return;
        };

        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการจองนี้?')) {
            try {
                await deleteBooking(bookingId, authToken);
                fetchData(authToken);
            } catch (err: any) {
                console.error(err);
                alert(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    };

    const handleAddUnavailability = async (carModel: CarModel, date: string, period: string, reason: string) => {
        if (!authToken) {
            throw new Error("Authentication error. Please log in again.");
        }
        try {
            const selectedCar = cars.find(c => c.modelName === carModel);
            const branch = (selectedCar?.branch || Branch.MAHASARAKHAM) as Branch;
            await addUnavailability({ carModel, date, period, reason, branch }, authToken);
            fetchData(authToken);
        } catch (err: any) {
            throw err;
        }
    };

    const handleDeleteUnavailability = async (id: number) => {
        if (!authToken) return;
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
            try {
                await deleteUnavailability(id, authToken);
                fetchData(authToken);
            } catch (err: any) {
                console.error(err);
                alert(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    };

    const handleAddCar = async (carData: Omit<Car, 'id'>) => {
        if (!authToken) return;
        try {
            await addCar(carData, authToken);
            fetchData(authToken);
        } catch (err: any) {
            throw err;
        }
    };

    const handleUpdateCar = async (carData: Car) => {
        if (!authToken) return;
        try {
            await updateCar(carData, authToken);
            fetchData(authToken);
        } catch (err: any) {
            throw err;
        }
    };

    const handleDeleteCar = async (id: number) => {
        if (!authToken) return;
        try {
            await deleteCar(id, authToken);
            fetchData(authToken);
        } catch (err: any) {
            throw err;
        }
    };

    const handleAddSalesperson = async (salespersonData: Omit<Salesperson, 'id'>) => {
        if (!authToken) return;
        try {
            await addSalesperson(salespersonData, authToken);
            fetchData(authToken);
        } catch (err: any) {
            throw err;
        }
    };

    const handleUpdateSalesperson = async (salespersonData: Salesperson) => {
        if (!authToken) return;
        try {
            await updateSalesperson(salespersonData, authToken);
            fetchData(authToken);
        } catch (err: any) {
            throw err;
        }
    };


    const handleLoginSuccess = (token: string, role: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', role);
        setAuthToken(token);
        setUserRole(role);
        fetchData(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        setAuthToken(null);
        setUserRole(null);
        setBookings([]);
        setUnavailability([]);
        setAppLogo(null);
        setCurrentPage('calendar');
    };
    
    const handleLogoUpload = async (base64String: string) => {
        if (!authToken) return;
        try {
            await setAppSetting('app_logo', base64String, authToken);
            setAppLogo(base64String);
            alert("อัปเดตโลโก้สำเร็จ");
        } catch (err: any) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการอัปเดตโลโก้: " + err.message);
        }
    };

    const activeCars = useMemo(() => {
        return cars.filter(c => c.isActive);
    }, [cars]);

    const renderPage = () => {
        if (isLoading) {
            return <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
        }
        if (error) {
            return <div className="p-10 text-center text-red-500">{error}</div>;
        }

        switch (currentPage) {
            case 'calendar':
                return <CalendarView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openBookingModal={openBookingModal} onDeleteBooking={handleDeleteBooking} canDelete={isAdmin} canAdd={isAdmin} carModels={cars} />;
            case 'slots':
                return <SlotView bookings={bookings} unavailability={unavailability} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openBookingModal={openBookingModal} onDeleteBooking={handleDeleteBooking} canDelete={isAdmin} canAdd={isAdmin} carModels={cars} />;
            case 'usage':
                return <CarUsageView bookings={bookings} unavailability={unavailability} selectedDate={selectedDate} setSelectedDate={setSelectedDate} carModels={cars} />;
            case 'dashboard':
                return <DashboardView bookings={bookings} authToken={authToken!} />;
            case 'unavailable':
                return isAdmin ? <UnavailableCarsView 
                            bookings={bookings}
                            unavailability={unavailability} 
                            selectedDate={selectedDate} 
                            setSelectedDate={setSelectedDate} 
                            carModels={activeCars}
                            onAddUnavailability={handleAddUnavailability}
                            onDeleteUnavailability={handleDeleteUnavailability}
                        /> : <p className="p-6 text-center">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
            case 'cars':
                return isExecutive ? <CarManagementView 
                            cars={cars}
                            branches={branches}
                            salespeople={salespeople}
                            onAddCar={handleAddCar}
                            onUpdateCar={handleUpdateCar}
                            onDeleteCar={handleDeleteCar}
                            onAddSalesperson={handleAddSalesperson}
                            onUpdateSalesperson={handleUpdateSalesperson}
                            authToken={authToken!}
                        /> : <p className="p-6 text-center">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
            default:
                return null;
        }
    };

    // FIX: Changed icon prop type from React.ReactNode to React.ReactElement for type safety with React.cloneElement.
    // FIX: The type for icon prop is made more specific to ensure it accepts a className, which resolves the TypeScript error with cloneElement.
    const DesktopNavItem = ({ page, label, icon }: { page: Page, label: string, icon: React.ReactElement<{ className?: string }> }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 ${currentPage === page ? 'font-semibold bg-blue-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
            style={{ color: currentPage === page ? '#7D9AB9' : undefined }}
        >
            {React.cloneElement(icon, { className: "w-5 h-5" })}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    const MobileNavItem = ({ page, label, icon }: { page: Page, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${currentPage === page ? 'text-white' : 'text-blue-200 hover:text-white'}`}
        >
            {icon}
            <span className="text-xs">{label}</span>
        </button>
    );

    if (!authToken) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop top nav */}
            <header className="bg-white border-b hidden md:flex fixed top-0 left-0 right-0 h-16 items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <Logo className="h-12 w-48" logoSrc={appLogo} onUpload={isAdmin ? handleLogoUpload : undefined} />
                </div>
                <nav className="flex items-center gap-2">
                    <DesktopNavItem page="calendar" label="ปฏิทิน" icon={<CalendarIcon />} />
                    <DesktopNavItem page="slots" label="Slots" icon={<ListIcon />} />
                    <DesktopNavItem page="usage" label="ตารางรถ" icon={<GridIcon />} />
                    {isAdmin && <DesktopNavItem page="unavailable" label="รถไม่พร้อม" icon={<WrenchIcon />} />}
                    <DesktopNavItem page="dashboard" label="Dashboard" icon={<ChartIcon />} />
                    {isExecutive && <DesktopNavItem page="cars" label="Setting" icon={<SettingsIcon />} />}
                </nav>
                 <button onClick={handleLogout} style={{ backgroundColor: '#7D9AB9' }} className="text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-colors">
                    ออกจากระบบ
                </button>
            </header>

            {/* Content area */}
            <div className="md:pt-16">
                <header className="bg-white p-4 shadow-sm sticky top-0 z-30 md:hidden border-b">
                    <div className="flex justify-between items-center w-full">
                        <Logo className="h-12 w-48" logoSrc={appLogo} onUpload={isAdmin ? handleLogoUpload : undefined} />
                        <div className="text-right">
                           <button onClick={handleLogout} style={{ backgroundColor: '#7D9AB9' }} className="text-white px-2 py-0.5 rounded text-xs mt-1 hover:opacity-90 transition-colors">
                               ออกจากระบบ
                           </button>
                        </div>
                    </div>
                </header>
                <main className="flex-grow pb-20 md:pb-0">
                    {renderPage()}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <nav style={{ backgroundColor: '#98B6D7' }} className="fixed bottom-0 left-0 right-0 h-16 shadow-lg flex justify-around items-center md:hidden z-20">
                <MobileNavItem page="calendar" label="ปฏิทิน" icon={<CalendarIcon className="w-6 h-6" />} />
                <MobileNavItem page="slots" label="Slots" icon={<ListIcon className="w-6 h-6" />} />
                <MobileNavItem page="usage" label="ตารางรถ" icon={<GridIcon className="w-6 h-6" />} />
                {isAdmin && <MobileNavItem page="unavailable" label="รถไม่พร้อม" icon={<WrenchIcon className="w-6 h-6" />} />}
                <MobileNavItem page="dashboard" label="Dashboard" icon={<ChartIcon className="w-6 h-6" />} />
                {isExecutive && <MobileNavItem page="cars" label="Setting" icon={<SettingsIcon className="w-6 h-6" />} />}
            </nav>
            
            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveBooking}
                initialData={modalInitialData}
                bookings={bookings}
                unavailability={unavailability}
                canSave={isAdmin}
                carModels={activeCars}
                salespeople={salespeople.filter(s => s.isActive)}
            />
        </div>
    );
};

export default App;