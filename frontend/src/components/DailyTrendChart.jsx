import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getDailyTrend } from '../api/dashboard';
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

const SAMPLE_TREND = [
  { date: '2026-11-06', label: 'Nov 06', count: 12 },
  { date: '2026-11-09', label: 'Nov 09', count: 17 },
  { date: '2026-11-10', label: 'Nov 10', count: 27 },
  { date: '2026-11-11', label: 'Nov 11', count: 22 },
  { date: '2026-11-12', label: 'Nov 12', count: 28 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rawVal = payload[0].payload?.count ?? payload[0].value ?? 0;
    const numVal = isNaN(Number(rawVal)) ? 0 : Number(rawVal);
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700/50">
        <div className="font-semibold text-slate-200">{label}</div>
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
      <g key={`last-dot-${index}`}>
        {/* Blue pill highlight badge on the last data point */}
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
        {/* Circle dot on line */}
        <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={2.5} />
      </g>
    );
  }

  // Only render text numbers on top of dots if there are <= 10 data points
  // to prevent overlapping crowded numbers
  const showText = total <= 10;

  return (
    <g key={`dot-${index}`}>
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

export default function DailyTrendChart({ dateRange, refreshTrigger }) {
  const [data, setData] = useState(SAMPLE_TREND);
  const [activeFilter, setActiveFilter] = useState('7 Days');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dateRange && RANGE_TO_FILTER[dateRange]) {
      setActiveFilter(RANGE_TO_FILTER[dateRange]);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [dateRange, activeFilter, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Prioritize activeFilter from chart buttons, then parent dateRange
      const rangeParam = FILTER_TO_RANGE[activeFilter] || dateRange || '7d';
      const res = await getDailyTrend({ range: rangeParam });

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
      console.warn('Daily trend fetch failed, preserving current data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine nice Y-axis max domain
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 35;
  const yAxisMax = Math.max(35, Math.ceil((maxCount + 5) / 5) * 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="text-blue-600">
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">
              Daily Overall Lead Generation Trend
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Total leads from all Lead By (Cleaned)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-full border border-slate-100">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
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

      {/* Chart */}
      <div className="flex-1 min-h-[220px] pt-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            Loading trend...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            No leads found for this date range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={data}
              margin={{ top: 25, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2.8}
                fill="url(#trendGradient)"
                dot={(dotProps) => (
                  <CustomizedDot
                    key={`dot-${dotProps.index}`}
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
