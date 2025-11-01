
import React, { useState, useMemo } from 'react';
import { Booking, CarModel } from '../types';
import { CAR_MODELS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

interface DashboardViewProps {
  bookings: Booking[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const DashboardView: React.FC<DashboardViewProps> = ({ bookings }) => {
  const [selectedCar, setSelectedCar] = useState<string>('all');

  const lineChartData = useMemo(() => {
    const filteredBookings = selectedCar === 'all' ? bookings : bookings.filter(b => b.carModel === selectedCar);
    const countsByDate: { [date: string]: number } = {};
    
    filteredBookings.forEach(booking => {
        countsByDate[booking.date] = (countsByDate[booking.date] || 0) + 1;
    });

    return Object.keys(countsByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(date => ({
            date,
            count: countsByDate[date],
        }));
  }, [bookings, selectedCar]);
  
  const pieChartData = useMemo(() => {
    const countsByModel: { [model in CarModel]?: number } = {};
    bookings.forEach(booking => {
        countsByModel[booking.carModel] = (countsByModel[booking.carModel] || 0) + 1;
    });

    return Object.entries(countsByModel).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700 mb-2 md:mb-0">สถิติ Test Drive</h2>
          <select 
            value={selectedCar} 
            onChange={e => setSelectedCar(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ทุกรุ่น</option>
            {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
          </select>
        </div>
        <div className="h-80 w-full">
            <ResponsiveContainer>
                <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="จำนวนการจอง" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-700 mb-4">สัดส่วนรุ่นรถที่ Test Drive</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
