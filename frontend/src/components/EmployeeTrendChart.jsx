import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { UserCheck, ChevronDown } from 'lucide-react';
import { getEmployees, getEmployeeTrend } from '../api/dashboard';
import { format, parseISO } from 'date-fns';

const RANGE_TO_FILTER = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  'year': 'This Year',
};

const FILTER_TO_RANGE = {
  '7 Days': '7d',
  '30 Days': '30d',
  '90 Days': '90d',
  'This Year': 'year',
};

const filterOptions = ['7 Days', '30 Days', '90 Days', 'This Year'];

const SAMPLE_EMPLOYEES = ['Adam Smith', 'Sarah Johnson', 'Mike Davis', 'Jessica Brown', 'David Wilson'];
const SAMPLE_EMP_TREND = [
  { date: '2026-11-06', label: 'Nov 06', count: 5 },
  { date: '2026-11-09', label: 'Nov 09', count: 8 },
  { date: '2026-11-10', label: 'Nov 10', count: 12 },
  { date: '2026-11-11', label: 'Nov 11', count: 9 },
  { date: '2026-11-12', label: 'Nov 12', count: 14 },
];

const CustomTooltip = ({ active, payload, label, selectedEmployee }) => {
  if (active && payload && payload.length) {
    const rawVal = payload[0].payload?.count ?? payload[0].value ?? 0;
    const numVal = isNaN(Number(rawVal)) ? 0 : Number(rawVal);
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700/50">
        <div className="font-semibold text-slate-200">{label}</div>
        <div className="text-slate-400 text-[11px] mt-0.5">{selectedEmployee || 'All Agents'}</div>
        <div className="text-blue-400 font-bold text-sm mt-0.5">
          {numVal} <span className="text-xs font-normal text-slate-400">leads</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom dot: shows number label above if <= 10 points, and blue pill for the last item
const CustomizedDot = (props) => {
  const { cx, cy, index, total } = props;
  const isLast = index === total - 1;

  // Extract count from payload or direct value safely (never NaN)
  const rawVal = props.payload?.count ?? props.value;
  const numValue = rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))
    ? Number(rawVal)
    : 0;

  if (isLast) {
    return (
      <g key={`emp-last-dot-${index}`}>
        <rect
          x={cx - 16}
          y={cy - 28}
          width={32}
          height={20}
          rx={6}
          fill="#2563eb"
          className="shadow-md"
        />
        <text
          x={cx}
          y={cy - 14}
          fill="#ffffff"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
        >
          {numValue}
        </text>
        <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={2.5} />
      </g>
    );
  }

  const showText = total <= 10;

  return (
    <g key={`emp-dot-${index}`}>
      {showText && (
        <text
          x={cx}
          y={cy - 10}
          fill="#475569"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
        >
          {numValue}
        </text>
      )}
      <circle
        cx={cx}
        cy={cy}
        r={total > 40 ? 2 : total > 20 ? 3.5 : 4.5}
        fill="#2563eb"
        stroke="#ffffff"
        strokeWidth={total > 40 ? 1 : 2}
      />
    </g>
  );
};

export default function EmployeeTrendChart({ dateRange, refreshTrigger }) {
  const [employees, setEmployees] = useState(SAMPLE_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState(SAMPLE_EMPLOYEES[0]);
  const [data, setData] = useState(SAMPLE_EMP_TREND);
  const [activeFilter, setActiveFilter] = useState('7 Days');
  const [loading, setLoading] = useState(false);

  // Fetch all employee names on mount or refresh
  useEffect(() => {
    fetchEmployees();
  }, [refreshTrigger]);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setEmployees(res.data);
        if (!selectedEmployee) {
          setSelectedEmployee(res.data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch employees, keeping current:', err);
    }
  };

  // Sync active filter button when parent header dateRange changes
  useEffect(() => {
    if (dateRange && RANGE_TO_FILTER[dateRange]) {
      setActiveFilter(RANGE_TO_FILTER[dateRange]);
    }
  }, [dateRange]);

  // Fetch trend when employee or activeFilter or dateRange or refreshTrigger changes
  useEffect(() => {
    if (selectedEmployee) {
      fetchTrend();
    }
  }, [selectedEmployee, activeFilter, dateRange, refreshTrigger]);

  const fetchTrend = async () => {
    setLoading(true);
    try {
      const rangeParam = FILTER_TO_RANGE[activeFilter] || dateRange || '7d';
      const res = await getEmployeeTrend({
        employee: selectedEmployee,
        range: rangeParam,
      });

      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((d) => ({
            ...d,
            count: Number(d.count) || 0,
            label: d.date ? format(parseISO(d.date), 'MMM dd') : d.date,
          }));
          setData(formatted);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch employee trend, keeping current:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 10;
  const yAxisMax = Math.max(10, Math.ceil((maxCount + 2) / 2) * 2);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="text-blue-600">
            <UserCheck size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">
              Individual Lead Generation Trend
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Lead generation trend by Lead By (Cleaned)
            </p>
          </div>
        </div>

        {/* Controls: Employee dropdown + Filter pills */}
        <div className="flex items-center gap-2">
          {/* Employee Select */}
          <div className="relative">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer shadow-xs transition-all max-w-[170px] truncate"
            >
              {employees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Date Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-full border border-slate-100">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  activeFilter === f
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[220px] pt-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            Loading {selectedEmployee}&apos;s trend...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <UserCheck size={20} className="stroke-[1.75]" />
            </div>
            <p className="font-semibold text-slate-700 text-xs">No leads in this period</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-medium text-slate-600">{selectedEmployee}</span> has 0 leads recorded in the selected {activeFilter} period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={data}
              margin={{ top: 25, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="empTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                dy={6}
                minTickGap={25}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, yAxisMax]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <CustomTooltip selectedEmployee={selectedEmployee} />
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2.8}
                fill="url(#empTrendGradient)"
                dot={(dotProps) => (
                  <CustomizedDot
                    key={`emp-dot-${dotProps.index}`}
                    {...dotProps}
                    total={data.length}
                  />
                )}
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

