import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Booking, Branch } from './types';
import CalendarView from './components/CalendarView';
import SlotView from './components/SlotView';
import CarUsageView from './components/CarUsageView';
import DashboardView from './components/DashboardView';
import BookingModal from './components/BookingModal';
import { CalendarIcon, ListIcon, GridIcon, ChartIcon } from './components/icons';
import LoginPage from './components/LoginPage';
import { getBookings, addBooking, deleteBooking, getAppSetting, setAppSetting } from './services/apiService';
import { Logo } from './components/Logo';

type Page = 'calendar' | 'slots' | 'usage' | 'dashboard';

const App: React.FC = () => {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [currentPage, setCurrentPage] = useState<Page>('calendar');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState<Partial<Booking> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appLogo, setAppLogo] = useState<string | null>(null);

    const fetchBookings = useCallback(async (branch: Branch, token: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getBookings(branch, token);
            setBookings(data);
        } catch (err) {
            setError('ไม่สามารถดึงข้อมูลการจองได้');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchAppSettings = useCallback(async (token: string) => {
        try {
            const { value } = await getAppSetting('app_logo', token);
            setAppLogo(value);
        } catch (err) {
            // It's okay if the logo is not found, so we don't set an error state
            console.log("App logo not found or couldn't be fetched.");
            setAppLogo(null);
        }
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedBranch = localStorage.getItem('currentBranch') as Branch;
        if (storedToken && storedBranch) {
            setAuthToken(storedToken);
            setCurrentBranch(storedBranch);
            fetchBookings(storedBranch, storedToken);
            fetchAppSettings(storedToken);
        }
    }, [fetchBookings, fetchAppSettings]);

    const openBookingModal = useCallback((data?: Partial<Booking>) => {
        setModalInitialData(data);
        setIsModalOpen(true);
    }, []);

    const handleSaveBooking = async (newBookingData: Omit<Booking, 'id' | 'branch'>) => {
        if (!currentBranch || !authToken) return;
        
        try {
            await addBooking(newBookingData, currentBranch, authToken);
            fetchBookings(currentBranch, authToken); // Refresh data after saving
            setIsModalOpen(false);
        } catch(err: any) {
            console.error(err);
            alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };
    
    const handleDeleteBooking = async (bookingId: string) => {
        if (!currentBranch || !authToken) return;

        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการจองนี้?')) {
            try {
                await deleteBooking(bookingId, authToken);
                fetchBookings(currentBranch, authToken);
            } catch (err: any) {
                console.error(err);
                alert(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    };


    const handleLoginSuccess = (branch: Branch, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentBranch', branch);
        setAuthToken(token);
        setCurrentBranch(branch);
        fetchBookings(branch, token);
        fetchAppSettings(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentBranch');
        setAuthToken(null);
        setCurrentBranch(null);
        setBookings([]);
        setAppLogo(null);
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

    const renderPage = () => {
        if (isLoading) {
            return <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
        }
        if (error) {
            return <div className="p-10 text-center text-red-500">{error}</div>;
        }

        switch (currentPage) {
            case 'calendar':
                return <CalendarView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openBookingModal={openBookingModal} onDeleteBooking={handleDeleteBooking} />;
            case 'slots':
                return <SlotView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openBookingModal={openBookingModal} onDeleteBooking={handleDeleteBooking} />;
            case 'usage':
                return <CarUsageView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
            case 'dashboard':
                return <DashboardView bookings={bookings} />;
            default:
                return null;
        }
    };

    const DesktopNavItem = ({ page, label, icon }: { page: Page, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 ${currentPage === page ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
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

    if (!authToken || !currentBranch) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop top nav */}
            <header style={{ backgroundColor: '#98B6D7' }} className="hidden md:flex fixed top-0 left-0 right-0 h-16 items-center justify-between px-6 shadow-md z-20">
                <div className="flex items-center gap-4">
                    <Logo className="h-12 w-48" logoSrc={appLogo} onUpload={handleLogoUpload} />
                     <span className="text-blue-100 text-sm font-medium">สาขา: {currentBranch}</span>
                </div>
                <nav className="flex items-center gap-2">
                    <DesktopNavItem page="calendar" label="ปฏิทิน" icon={<CalendarIcon />} />
                    <DesktopNavItem page="slots" label="Slots" icon={<ListIcon />} />
                    <DesktopNavItem page="usage" label="ตารางรถ" icon={<GridIcon />} />
                    <DesktopNavItem page="dashboard" label="Dashboard" icon={<ChartIcon />} />
                </nav>
                 <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md">
                    ออกจากระบบ
                </button>
            </header>

            {/* Content area */}
            <div className="md:pt-16">
                <header style={{ backgroundColor: '#98B6D7' }} className="text-white p-4 shadow-md sticky top-0 z-10 md:hidden">
                    <div className="flex justify-between items-center w-full">
                        <Logo className="h-12 w-48" logoSrc={appLogo} onUpload={handleLogoUpload} />
                        <div className="text-right">
                           <p className="text-sm font-semibold text-white">สาขา: {currentBranch}</p>
                           <button onClick={handleLogout} className="text-white bg-white/20 px-2 py-0.5 rounded text-xs mt-1">
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
                <MobileNavItem page="dashboard" label="Dashboard" icon={<ChartIcon className="w-6 h-6" />} />
            </nav>
            
            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveBooking}
                initialData={modalInitialData}
            />
        </div>
    );
};

export default App;