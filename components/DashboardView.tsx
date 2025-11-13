import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList,
} from 'recharts';
import { Booking, CarModel } from '../types';
import { CAR_MODELS } from '../constants';
import { getStockData } from '../services/apiService';

interface DashboardViewProps {
  bookings: Booking[];
  authToken: string;
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
// Custom label renderer to position labels INSIDE the pie chart slices for a cleaner look.
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  // Position the label inside the pie slice for a cleaner, overlapping effect.
  const radius = outerRadius * 0.65; // Position at 65% from the center.
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Avoid clutter by hiding labels for very small slices.
  if (percent < 0.05) {
    return null;
  }

  const modelName = name.replace('BYD ', '');
  const percentage = `${(percent * 100).toFixed(0)}%`;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: '12px', fontWeight: 'bold' }}
    >
      <tspan x={x} dy="-0.6em">{modelName}</tspan>
      <tspan x={x} dy="1.2em">{percentage}</tspan>
    </text>
  );
};


const DashboardView: React.FC<DashboardViewProps> = ({ bookings, authToken }) => {
    const [lineChartPeriod, setLineChartPeriod] = useState<'day' | 'month' | 'year'>('day');
    const [lineChartCarModel, setLineChartCarModel] = useState<string>('all');
    const [pieChartPeriod, setPieChartPeriod] = useState<'day' | 'month' | 'year'>('month');

    const [stockData, setStockData] = useState<{ model: string; count: number }[]>([]);
    const [stockLoading, setStockLoading] = useState(true);
    const [stockError, setStockError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStockData = async () => {
            if (!authToken) {
                setStockError('Authentication token not found.');
                setStockLoading(false);
                return;
            };
            try {
                setStockLoading(true);
                const rawData = await getStockData(authToken);
                const processedData = rawData.map(item => ({
                    ...item,
                    model: item.model.replace('BYD ', '').trim(),
                }));
                // Sort data alphabetically by model name before setting state
                const sortedData = processedData.sort((a, b) => a.model.localeCompare(b.model));
                setStockData(sortedData);
                setStockError(null);
            } catch (err: any) {
                setStockError(err.message || 'ไม่สามารถโหลดข้อมูลสต๊อกรถได้');
                console.error(err);
            } finally {
                setStockLoading(false);
            }
        };

        fetchStockData();
    }, [authToken]);
    
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
        
        // For Busiest Salesperson of the month
        const today = new Date();
        const thisMonthStr = today.toLocaleDateString('en-CA').substring(0, 7); // YYYY-MM
        const salespersonCountsThisMonth = new Map<string, number>();
        
        bookings.forEach(booking => {
            // All-time car popularity
            carCounts.set(booking.carModel, (carCounts.get(booking.carModel) || 0) + 1);
            
            // This month's salesperson stats
            if (booking.date.startsWith(thisMonthStr)) {
                salespersonCountsThisMonth.set(booking.salesperson, (salespersonCountsThisMonth.get(booking.salesperson) || 0) + 1);
            }
        });

        const mostPopularCarEntry = [...carCounts.entries()].reduce((a, b) => (a[1] > b[1] ? a : b), [undefined, 0]);
        const busiestSalespersonEntry = [...salespersonCountsThisMonth.entries()].reduce((a, b) => (a[1] > b[1] ? a : b), [undefined, 0]);
        
        const todayString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const upcomingBookings = bookings.filter(b => b.date >= todayString).length;

        return {
            totalBookings: bookings.length,
            upcomingBookings,
            mostPopularCar: { name: mostPopularCarEntry[0] || 'N/A', count: mostPopularCarEntry[1] },
            busiestSalesperson: { name: busiestSalespersonEntry[0] || 'N/A', count: busiestSalespersonEntry[1] },
        };
    }, [bookings]);

    const { lineChartData, lineChartTitle } = useMemo(() => {
        const filteredBookings = lineChartCarModel === 'all'
            ? bookings
            : bookings.filter(b => b.carModel === lineChartCarModel);

        let title = '';

        if (lineChartPeriod === 'day') {
            let year: number, month: number; // month is 0-11
            
            if (filteredBookings.length > 0) {
                 const latestBookingDateStr = filteredBookings.reduce((latest, current) => {
                    return current.date > latest ? current.date : latest;
                }, '1970-01-01');
                const [parsedYear, parsedMonth] = latestBookingDateStr.split('-').map(Number);
                year = parsedYear;
                month = parsedMonth - 1; 
            } else {
                const today = new Date();
                year = today.getFullYear();
                month = today.getMonth();
            }
            
            const monthName = new Date(year, month).toLocaleString('th-TH', { month: 'long', year: 'numeric' });
            title = `ข้อมูลเดือน ${monthName}`;
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthStr = String(month + 1).padStart(2, '0');
            const yearStr = String(year);

            const datesOfMonth = Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                return `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
            });

            const countsByDate = new Map<string, number>();
            filteredBookings.forEach(booking => {
                if (booking.date.startsWith(`${yearStr}-${monthStr}`)) {
                    countsByDate.set(booking.date, (countsByDate.get(booking.date) || 0) + 1);
                }
            });

            const data = datesOfMonth.map(dateStr => ({
                date: dateStr.substring(5),
                count: countsByDate.get(dateStr) || 0,
            }));

            return { lineChartData: data, lineChartTitle: title };
        }

        const countsByDate = new Map<string, number>();
        filteredBookings.forEach(booking => {
            let key;
            if (lineChartPeriod === 'month') {
                key = booking.date.substring(0, 7);
            } else { 
                key = booking.date.substring(0, 4);
            }
            countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
        });

        const data = Array.from(countsByDate.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        
        return { lineChartData: data, lineChartTitle: title };

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

    const renderStockChart = () => {
        if (stockLoading) return <div className="flex items-center justify-center h-full text-gray-500">กำลังโหลดข้อมูลสต๊อก...</div>;
        if (stockError) return <div className="flex items-center justify-center h-full text-red-500">{stockError}</div>;
        if (stockData.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">ไม่มีข้อมูลสต๊อกรถ</div>;

        return (
            <ResponsiveContainer>
                <BarChart layout="vertical" data={stockData} margin={{ top: 20, right: 30, left: -70, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="model" width={250} tick={{ fontSize: 11 }} interval={0} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="จำนวนในสต๊อก" fill="#98B6D7">
                        <LabelList dataKey="count" position="right" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900">สถิติการ Test Drive</h3>
                        {lineChartTitle && <p className="text-sm text-gray-500">{lineChartTitle}</p>}
                    </div>
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
                        <ChartButton label="วัน" period="day" current={pieChartPeriod} setter={setPieChartPeriod} />
                        <ChartButton label="เดือน" period="month" current={pieChartPeriod} setter={setPieChartPeriod} />
                        <ChartButton label="ปี" period="year" current={pieChartPeriod} setter={setPieChartPeriod} />
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                         {pieChartData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={110}
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

            <div className="mt-6 bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">รถในสต๊อก (ตามรุ่น)</h3>
                <div style={{ width: '100%', height: 400 }}>
                    {renderStockChart()}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bookings" value={generalStats.totalBookings} />
                <StatCard title="Upcoming Bookings" value={generalStats.upcomingBookings} />
                <StatCard title="Most Popular Car" value={generalStats.mostPopularCar.name} description={generalStats.mostPopularCar.count > 0 ? `${generalStats.mostPopularCar.count} bookings` : undefined} />
                <StatCard title="Busiest Salesperson of the Month" value={generalStats.busiestSalesperson.name} description={generalStats.busiestSalesperson.count > 0 ? `${generalStats.busiestSalesperson.count} bookings` : undefined} />
            </div>
        </div>
    );
};

export default DashboardView;