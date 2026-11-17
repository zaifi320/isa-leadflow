import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { getLeadsByType } from '../api/dashboard';

const SAMPLE_DATA = [
  { type: 'Seller', count: 245, percentage: 50.3, color: '#3b82f6' },
  { type: 'Buyer', count: 242, percentage: 49.7, color: '#8b5cf6' },
];

const COLOR_MAP = {
  Seller: '#3b82f6',
  Buyer: '#8b5cf6',
  Investor: '#f59e0b',
  Other: '#94a3b8',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700/50">
        <div className="font-semibold text-slate-200">{d.type}</div>
        <div className="text-blue-400 font-bold text-sm mt-0.5">
          {d.count} <span className="text-xs font-normal text-slate-300">({d.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function LeadsByTypeChart({ dateRange, refreshTrigger }) {
  const [data, setData] = useState(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsByType({ range: dateRange });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const withColors = res.data.map(d => ({
            ...d,
            color: COLOR_MAP[d.type] || '#94a3b8',
          }));
          setData(withColors);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.warn('Leads by type fetch failed, keeping current data:', err);
    } finally {
      setLoading(false);
    }
  };

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <PieIcon size={18} strokeWidth={2.3} />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Leads by Type</h3>
      </div>

      {/* Donut Chart */}
      <div className="relative flex-1 flex items-center justify-center my-1 min-h-[160px]">
        {loading ? (
          <div className="text-slate-400 text-xs">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={165}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                stroke="#ffffff"
                strokeWidth={3}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLOR_MAP[entry.type] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Center Total Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 leading-none">{total}</span>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 pt-2 border-t border-slate-50">
        {data.map((d) => (
          <div key={d.type} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color || COLOR_MAP[d.type] || '#94a3b8' }}
              />
              <span className="font-medium text-slate-700">{d.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800">{d.count}</span>
              <span className="text-slate-400 text-[11px] w-10 text-right">{d.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
