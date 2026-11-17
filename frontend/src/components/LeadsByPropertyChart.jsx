import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Home } from 'lucide-react';
import { getLeadsByProperty } from '../api/dashboard';

const SAMPLE_DATA = [
  { property_type: 'SFH', count: 312, percentage: 64.0 },
  { property_type: 'Condo', count: 98, percentage: 20.1 },
  { property_type: 'Land', count: 77, percentage: 15.8 },
];

// 10 distinct, attractive colors for top 10 property types
const TOP_10_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet / Purple
  '#06b6d4', // Cyan
  '#f59e0b', // Amber / Orange
  '#f43f5e', // Rose / Red
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#fb923c', // Orange
  '#ec4899', // Pink
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700/50">
        <div className="font-semibold text-slate-200">{d.property_type}</div>
        <div className="text-blue-400 font-bold text-sm mt-0.5">
          {d.count} <span className="text-xs font-normal text-slate-300">({d.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function LeadsByPropertyChart({ dateRange, refreshTrigger }) {
  const [data, setData] = useState(SAMPLE_DATA);
  const [totalCount, setTotalCount] = useState(487);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsByProperty({ range: dateRange });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Enforce STRICTLY TOP 10
          const top10 = res.data.slice(0, 10).map((d, idx) => ({
            ...d,
            color: TOP_10_COLORS[idx % TOP_10_COLORS.length],
          }));
          setData(top10);
          const sum = res.data.reduce((acc, curr) => acc + (curr.count || 0), 0);
          setTotalCount(sum);
        } else {
          setData([]);
          setTotalCount(0);
        }
      }
    } catch (err) {
      console.warn('Leads by property fetch failed, keeping current data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <Home size={18} strokeWidth={2.3} />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Leads by Property Type</h3>
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
                nameKey="property_type"
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
                  <Cell
                    key={`cell-prop-${index}`}
                    fill={entry.color || TOP_10_COLORS[index % TOP_10_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Center Total Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 leading-none">{totalCount}</span>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend (Top 10 strictly, with sleek scrollbar if needed) */}
      <div className="space-y-1.5 pt-2 border-t border-slate-50 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
        {data.slice(0, 10).map((d, idx) => (
          <div key={`${d.property_type}-${idx}`} className="flex items-center justify-between text-xs py-0.5">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color || TOP_10_COLORS[idx % TOP_10_COLORS.length] }}
              />
              <span className="font-medium text-slate-700 truncate" title={d.property_type}>
                {d.property_type}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-bold text-slate-800">{d.count}</span>
              <span className="text-slate-400 text-[11px] w-11 text-right">{d.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
