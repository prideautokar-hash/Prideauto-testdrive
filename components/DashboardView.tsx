import React, { useState, useMemo } from 'react';
import { Booking, CarModel } from '../types';
import { CAR_MODELS } from '../constants';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector 
} from 'recharts';

interface DashboardViewProps {
  bookings: Booking[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} คิว`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const DashboardView: React.FC<DashboardViewProps> = ({ bookings }) => {
  const [selectedCar, setSelectedCar] = useState<string>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const lineChartData = useMemo(() => {
    const filteredBookings = selectedCar === 'all' 
      ? bookings 
      : bookings.filter(b => b.carModel === selectedCar);
      
    const countsByDate: { [date: string]: number } = {};
    
    // Initialize with all recent dates to show gaps
    if(filteredBookings.length > 0) {
        const sortedBookings = [...filteredBookings].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstDate = new Date(sortedBookings[0].date);
        const lastDate = new Date(sortedBookings[sortedBookings.length - 1].date);
        for (let d = firstDate; d <= lastDate; d.setDate(d.getDate() + 1)) {
            countsByDate[d.toISOString().split('T')[0]] = 0;
        }
    }
    
    filteredBookings.forEach(booking => {
        countsByDate[booking.date] = (countsByDate[booking.date] || 0) + 1;
    });

    return Object.entries(countsByDate)
        .map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
            count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [bookings, selectedCar]);
  
  const pieChartData = useMemo(() => {
    const countsByModel: { [model in CarModel]?: number } = {};
    bookings.forEach(booking => {
        countsByModel[booking.carModel] = (countsByModel[booking.carModel] || 0) + 1;
    });

    return CAR_MODELS.map(model => ({ 
        name: model, 
        value: countsByModel[model] || 0 
    })).filter(item => item.value > 0); // Only show models that have been booked
  }, [bookings]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Line Chart Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-xl font-bold text-gray-700">สถิติจำนวน Test Drive</h2>
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
                    <Line type="monotone" dataKey="count" name="จำนวนการจอง" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">สัดส่วนรุ่นรถที่ถูกจอง</h2>
        <div className="h-96 w-full">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                    data={pieChartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={100} 
                    fill="#8884d8"
                    paddingAngle={5}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-500">
                ไม่มีข้อมูลการจอง
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
