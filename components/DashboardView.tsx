import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Booking, CarModel } from '../types';
import { CAR_MODELS } from '../constants';

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

const COLORS = ['#98B6D7', '#7D9AB9', '#627E9B', '#4C637A', '#3A4C5E', '#2B3A47', '#1E2B33', '#131D21'];

const RADIAN = Math.PI / 180;
// Custom label renderer to position labels closer to the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  // Position the label slightly outside the pie slice, but closer than the default.
  const radius = outerRadius + 10; // Use a smaller offset for closer labels
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const text = `${name.replace('BYD ', '')} ${(percent * 100).toFixed(0)}%`;

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {text}
    </text>
  );
};


const DashboardView: React.FC<DashboardViewProps> = ({ bookings }) => {
    const [lineChartPeriod, setLineChartPeriod] = useState<'day' | 'month' | 'year'>('month');
    const [lineChartCarModel, setLineChartCarModel] = useState<string>('all');
    const [pieChartPeriod, setPieChartPeriod] = useState<'day' | 'month' | 'year'>('month');
    
    const generalStats = useMemo(() => {
         if (bookings.length === 0) {
            return {
                totalBookings: 0,
                upcomingBookings: 0,
                mostPopularCar: { name: 'N/A', count: 0 },
                busiestSalesperson: { name: 'N/A', count: 0 },
            };
        }

        const carCounts = new Map<CarModel, number>();
        const salespersonCounts = new Map<string, number>();
        
        bookings.forEach(booking => {
            carCounts.set(booking.carModel, (carCounts.get(booking.carModel) || 0) + 1);
            salespersonCounts.set(booking.salesperson, (salespersonCounts.get(booking.salesperson) || 0) + 1);
        });

        const mostPopularCarEntry = [...carCounts.entries()].reduce((a, b) => (a[1] > b[1] ? a : b), [undefined, 0]);
        const busiestSalespersonEntry = [...salespersonCounts.entries()].reduce((a, b) => (a[1] > b[1] ? a : b), [undefined, 0]);
        
        const todayString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const upcomingBookings = bookings.filter(b => b.date >= todayString).length;

        return {
            totalBookings: bookings.length,
            upcomingBookings,
            mostPopularCar: { name: mostPopularCarEntry[0] || 'N/A', count: mostPopularCarEntry[1] },
            busiestSalesperson: { name: busiestSalespersonEntry[0] || 'N/A', count: busiestSalespersonEntry[1] },
        };
    }, [bookings]);

    const lineChartData = useMemo(() => {
        const filteredBookings = lineChartCarModel === 'all'
            ? bookings
            : bookings.filter(b => b.carModel === lineChartCarModel);

        const countsByDate = new Map<string, number>();
        
        filteredBookings.forEach(booking => {
            let key;
            if (lineChartPeriod === 'day') {
                key = booking.date; // YYYY-MM-DD
            } else if (lineChartPeriod === 'month') {
                key = booking.date.substring(0, 7); // YYYY-MM
            } else { // year
                key = booking.date.substring(0, 4); // YYYY
            }
            countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
        });

        return Array.from(countsByDate.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

    }, [bookings, lineChartPeriod, lineChartCarModel]);

    const pieChartData = useMemo(() => {
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA');
        const thisMonthStr = todayStr.substring(0, 7);
        const thisYearStr = todayStr.substring(0, 4);

        const filteredBookings = bookings.filter(booking => {
            if (pieChartPeriod === 'day') return booking.date === todayStr;
            if (pieChartPeriod === 'month') return booking.date.startsWith(thisMonthStr);
            if (pieChartPeriod === 'year') return booking.date.startsWith(thisYearStr);
            return true;
        });

        const countsByModel = new Map<CarModel, number>();
        filteredBookings.forEach(booking => {
            countsByModel.set(booking.carModel, (countsByModel.get(booking.carModel) || 0) + 1);
        });

        return Array.from(countsByModel.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

    }, [bookings, pieChartPeriod]);

    const ChartButton = ({ label, period, current, setter }: any) => (
        <button
            onClick={() => setter(period)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${current === period ? 'text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            style={{ backgroundColor: current === period ? '#7D9AB9' : undefined }}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">สถิติการ Test Drive</h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <ChartButton label="วัน" period="day" current={lineChartPeriod} setter={setLineChartPeriod} />
                            <ChartButton label="เดือน" period="month" current={lineChartPeriod} setter={setLineChartPeriod} />
                            <ChartButton label="ปี" period="year" current={lineChartPeriod} setter={setLineChartPeriod} />
                        </div>
                        <select
                            value={lineChartCarModel}
                            onChange={(e) => setLineChartCarModel(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="all">รถทุกรุ่น</option>
                            {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" name="จำนวน" stroke="#7D9AB9" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">สัดส่วนการ Test Drive ตามรุ่นรถ</h3>
                    <div className="flex justify-center items-center gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                        <ChartButton label="วันนี้" period="day" current={pieChartPeriod} setter={setPieChartPeriod} />
                        <ChartButton label="เดือนนี้" period="month" current={pieChartPeriod} setter={setPieChartPeriod} />
                        <ChartButton label="ปีนี้" period="year" current={pieChartPeriod} setter={setPieChartPeriod} />
                    </div>
                    <div style={{ width: '100%', height: 300, fontSize: '12px' }}>
                         {pieChartData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={renderCustomizedLabel}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} ครั้ง`} />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก
                            </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bookings" value={generalStats.totalBookings} />
                <StatCard title="Upcoming Bookings" value={generalStats.upcomingBookings} />
                <StatCard title="Most Popular Car" value={generalStats.mostPopularCar.name} description={generalStats.mostPopularCar.count > 0 ? `${generalStats.mostPopularCar.count} bookings` : undefined} />
                <StatCard title="Busiest Salesperson" value={generalStats.busiestSalesperson.name} description={generalStats.busiestSalesperson.count > 0 ? `${generalStats.busiestSalesperson.count} bookings` : undefined} />
            </div>
        </div>
    );
};

export default DashboardView;