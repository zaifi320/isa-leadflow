import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList
} from 'recharts';
import { MapPin } from 'lucide-react';
import { getLeadsByState } from '../api/dashboard';

const SAMPLE_DATA = [
  { state: 'OR', count: 133 },
  { state: 'CT', count: 126 },
  { state: 'TX', count: 98 },
  { state: 'CA', count: 87 },
  { state: 'FL', count: 43 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700/50">
        <div className="font-semibold text-slate-200">State: {label}</div>
        <div className="text-blue-400 font-bold text-sm mt-0.5">{payload[0].value} <span className="text-xs font-normal text-slate-400">leads</span></div>
      </div>
    );
  }
  return null;
};

export default function LeadsByStateChart({ dateRange, refreshTrigger }) {
  const [data, setData] = useState(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsByState({ range: dateRange });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Take top 5 states
          setData(res.data.slice(0, 5));
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.warn('Leads by state fetch failed, keeping current data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <MapPin size={18} strokeWidth={2.3} />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Leads by State</h3>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 min-h-[190px] pt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">Loading states...</div>
        ) : (
          <ResponsiveContainer width="100%" height={195}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              barSize={26}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="state"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 150]}
                ticks={[0, 50, 100, 150]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
                  offset={6}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
