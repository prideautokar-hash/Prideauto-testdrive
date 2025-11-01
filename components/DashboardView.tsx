import React, { useMemo } from 'react';
import { Booking, CarModel } from '../types';

interface DashboardViewProps {
  bookings: Booking[];
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ bookings }) => {
    const stats = useMemo(() => {
        if (bookings.length === 0) {
            return {
                totalBookings: 0,
                upcomingBookings: 0,
                mostPopularCar: { name: 'N/A', count: 0 },
                busiestSalesperson: { name: 'N/A', count: 0 },
                carCounts: new Map<CarModel, number>(),
                salespersonCounts: new Map<string, number>()
            };
        }

        const carCounts = new Map<CarModel, number>();
        const salespersonCounts = new Map<string, number>();
        
        bookings.forEach(booking => {
            carCounts.set(booking.carModel, (carCounts.get(booking.carModel) || 0) + 1);
            salespersonCounts.set(booking.salesperson, (salespersonCounts.get(booking.salesperson) || 0) + 1);
        });

        const mostPopularCarEntry = [...carCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b);
        const busiestSalespersonEntry = [...salespersonCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b);
        
        const todayString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const upcomingBookings = bookings.filter(b => b.date >= todayString).length;

        return {
            totalBookings: bookings.length,
            upcomingBookings,
            mostPopularCar: { name: mostPopularCarEntry[0], count: mostPopularCarEntry[1] },
            busiestSalesperson: { name: busiestSalespersonEntry[0], count: busiestSalespersonEntry[1] },
            carCounts,
            salespersonCounts
        };
    }, [bookings]);
    

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bookings" value={stats.totalBookings} />
                <StatCard title="Upcoming Bookings" value={stats.upcomingBookings} />
                <StatCard title="Most Popular Car" value={stats.mostPopularCar.name} description={stats.mostPopularCar.count > 0 ? `${stats.mostPopularCar.count} bookings` : undefined} />
                <StatCard title="Busiest Salesperson" value={stats.busiestSalesperson.name} description={stats.busiestSalesperson.count > 0 ? `${stats.busiestSalesperson.count} bookings` : undefined} />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings by Car Model</h3>
                    <div className="space-y-4">
                        {[...stats.carCounts.entries()].sort((a,b) => b[1] - a[1]).map(([model, count]) => (
                            <div key={model}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{model}</span>
                                    <span>{count} / {stats.totalBookings}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        style={{ width: `${stats.totalBookings > 0 ? (count / stats.totalBookings) * 100 : 0}%`, backgroundColor: '#98B6D7' }} 
                                        className="h-2.5 rounded-full"
                                    ></div>
                                </div>
                            </div>
                        ))}
                         {stats.carCounts.size === 0 && <p className="text-gray-500">No bookings data.</p>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings by Salesperson</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                         {[...stats.salespersonCounts.entries()].sort((a,b) => b[1] - a[1]).map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                <span className="font-medium text-gray-800">{name}</span>
                                <span className="text-gray-600 font-semibold">{count}</span>
                            </div>
                        ))}
                         {stats.salespersonCounts.size === 0 && <p className="text-gray-500">No bookings data.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
