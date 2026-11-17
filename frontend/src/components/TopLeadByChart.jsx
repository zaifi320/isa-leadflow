import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList
} from 'recharts';
import { Users } from 'lucide-react';
import { getTopLeadBy } from '../api/dashboard';

const SAMPLE_DATA = [
  { lead_by_cleaned: 'Adam Smith', count: 120 },
  { lead_by_cleaned: 'Sarah Johnson', count: 95 },
  { lead_by_cleaned: 'Mike Davis', count: 72 },
  { lead_by_cleaned: 'Jessica Brown', count: 58 },
  { lead_by_cleaned: 'David Wilson', count: 42 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700/50">
        <div className="font-semibold text-slate-200">{label}</div>
        <div className="text-blue-400 font-bold text-sm mt-0.5">{payload[0].value} <span className="text-xs font-normal text-slate-400">leads submitted</span></div>
      </div>
    );
  }
  return null;
};

export default function TopLeadByChart({ dateRange, refreshTrigger }) {
  const [data, setData] = useState(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTopLeadBy({ range: dateRange });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const sorted = [...res.data]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          setData(sorted);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.warn('Top lead by fetch failed, keeping current data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <Users size={18} strokeWidth={2.3} />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Top Lead By (Cleaned)</h3>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="flex-1 min-h-[190px] pt-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">Loading team...</div>
        ) : (
          <ResponsiveContainer width="100%" height={195}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
              barSize={14}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 140]}
                hide
              />
              <YAxis
                type="category"
                dataKey="lead_by_cleaned"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={95}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fontSize: 11, fill: '#0f172a', fontWeight: 700 }}
                  offset={10}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
