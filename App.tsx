import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Booking, Branch } from './types';
import CalendarView from './components/CalendarView';
import SlotView from './components/SlotView';
import CarUsageView from './components/CarUsageView';
import DashboardView from './components/DashboardView';
import BookingModal from './components/BookingModal';
import { CalendarIcon, ListIcon, GridIcon, ChartIcon } from './components/icons';
import LoginPage from './components/LoginPage';
import { getBookings, addBooking } from './services/apiService';

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

    const fetchBookings = useCallback(async (branch: Branch, token: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getBookings(branch, token);
            setBookings(data);
        } catch (err) {
            setError('ไม่สามารถดึงข้อมูลการจองได้');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentBranch && authToken) {
            fetchBookings(currentBranch, authToken);
        }
    }, [currentBranch, authToken, fetchBookings]);

    const openBookingModal = useCallback((data?: Partial<Booking>) => {
        setModalInitialData(data);
        setIsModalOpen(true);
    }, []);

    const handleSaveBooking = async (newBookingData: Omit<Booking, 'id' | 'branch'>) => {
        if (!currentBranch || !authToken) return;
        
        try {
            await addBooking(newBookingData, currentBranch, authToken);
            // After saving, refetch all bookings to get the latest data
            fetchBookings(currentBranch, authToken);
            setIsModalOpen(false);
        } catch(err) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleLoginSuccess = (branch: Branch, token: string) => {
        setCurrentBranch(branch);
        setAuthToken(token);
    };

    const handleLogout = () => {
        setAuthToken(null);
        setCurrentBranch(null);
        setBookings([]);
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
                return <CalendarView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openBookingModal={openBookingModal} />;
            case 'slots':
                return <SlotView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openBookingModal={openBookingModal} />;
            case 'usage':
                return <CarUsageView bookings={bookings} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
            case 'dashboard':
                return <DashboardView bookings={bookings} />;
            default:
                return null;
        }
    };

    const NavItem = ({ page, label, icon }: { page: Page, label: string, icon: React.ReactNode }) => (
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
            {/* Desktop sidebar */}
            <nav style={{ backgroundColor: '#98B6D7' }} className="hidden md:flex fixed top-0 left-0 h-screen w-24 flex-col items-center justify-between py-6 z-20">
                <div className="flex flex-col items-center w-full space-y-4">
                    <div className="p-2 text-center">
                        <h2 className="text-white font-bold text-lg">BYD</h2>
                        <span className="text-blue-100 text-xs">{currentBranch}</span>
                    </div>
                    <NavItem page="calendar" label="ปฏิทิน" icon={<CalendarIcon className="w-7 h-7" />} />
                    <NavItem page="slots" label="Slots" icon={<ListIcon className="w-7 h-7" />} />
                    <NavItem page="usage" label="ตารางรถ" icon={<GridIcon className="w-7 h-7" />} />
                    <NavItem page="dashboard" label="Dashboard" icon={<ChartIcon className="w-7 h-7" />} />
                </div>
                 <button onClick={handleLogout} className="text-blue-200 hover:text-white p-2 text-xs w-full">
                    ออกจากระบบ
                </button>
            </nav>

            {/* Content area */}
            <div className="md:pl-24">
                <header style={{ backgroundColor: '#98B6D7' }} className="text-white p-4 shadow-md text-center sticky top-0 z-10 md:hidden">
                    <div className="flex justify-between items-center">
                        <div className="text-left">
                           <h1 className="text-xl font-bold">Test Drive Booker</h1>
                           <p className="text-sm text-blue-100">สาขา: {currentBranch}</p>
                        </div>
                        <button onClick={handleLogout} className="text-white bg-white/20 px-3 py-1 rounded text-xs">
                            ออกจากระบบ
                        </button>
                    </div>
                </header>
                <main className="flex-grow pb-20 md:pb-0">
                    {renderPage()}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <nav style={{ backgroundColor: '#98B6D7' }} className="fixed bottom-0 left-0 right-0 h-16 shadow-lg flex justify-around items-center md:hidden z-20">
                <NavItem page="calendar" label="ปฏิทิน" icon={<CalendarIcon className="w-6 h-6" />} />
                <NavItem page="slots" label="Slots" icon={<ListIcon className="w-6 h-6" />} />
                <NavItem page="usage" label="ตารางรถ" icon={<GridIcon className="w-6 h-6" />} />
                <NavItem page="dashboard" label="Dashboard" icon={<ChartIcon className="w-6 h-6" />} />
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
