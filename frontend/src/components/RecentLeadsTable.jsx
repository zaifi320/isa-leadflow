import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { getRecentLeads } from '../api/dashboard';
import { format, parseISO } from 'date-fns';

const SAMPLE_DATA = [
  {
    id: 1,
    message_time: '2026-11-12T20:42:00Z',
    name: 'Robert McCabe',
    number: '503-760-7241',
    type_of_lead: 'Seller',
    type_of_property: 'SFH',
    lead_by_cleaned: 'Adam Smith',
  },
  {
    id: 2,
    message_time: '2026-11-12T20:40:00Z',
    name: 'Sarah Mitchell',
    number: '713-555-0199',
    type_of_lead: 'Buyer',
    type_of_property: 'Condo',
    lead_by_cleaned: 'Adam Smith',
  },
  {
    id: 3,
    message_time: '2026-11-12T20:38:00Z',
    name: 'James Carter',
    number: '214-555-0176',
    type_of_lead: 'Seller',
    type_of_property: 'SFH',
    lead_by_cleaned: 'Sarah Johnson',
  },
  {
    id: 4,
    message_time: '2026-11-12T20:35:00Z',
    name: 'Emily Davis',
    number: '832-555-0133',
    type_of_lead: 'Buyer',
    type_of_property: 'Land',
    lead_by_cleaned: 'Mike Davis',
  },
  {
    id: 5,
    message_time: '2026-11-12T20:32:00Z',
    name: 'Daniel Wilson',
    number: '469-555-0102',
    type_of_lead: 'Seller',
    type_of_property: 'SFH',
    lead_by_cleaned: 'Jessica Brown',
  },
];

const TYPE_BADGE = {
  Seller: 'bg-blue-100 text-blue-600',
  Buyer: 'bg-emerald-100 text-emerald-600',
  Investor: 'bg-amber-100 text-amber-700',
  Other: 'bg-slate-100 text-slate-600',
};

export default function RecentLeadsTable({ dateRange, refreshTrigger }) {
  const [data, setData] = useState(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRecentLeads({ limit: 5 });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setData(res.data);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.warn('Recent leads fetch failed, keeping current data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return format(parseISO(dateStr), 'MMM dd, h:mm a');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-blue-600">
            <List size={18} strokeWidth={2.3} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Recent Leads</h3>
        </div>
        <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold hover:underline flex items-center gap-0.5">
          View All →
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-[190px] overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">Loading leads...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="pb-2 font-medium">Date & Time</th>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Property</th>
                <th className="pb-2 font-medium">Lead By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              {data.map((lead, idx) => (
                <tr key={lead.id || idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 text-slate-500 whitespace-nowrap">
                    {formatDate(lead.message_time)}
                  </td>
                  <td className="py-2 font-semibold text-slate-800 whitespace-nowrap">
                    {lead.name || '—'}
                  </td>
                  <td className="py-2 text-slate-500 whitespace-nowrap">
                    {lead.number || '—'}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        TYPE_BADGE[lead.type_of_lead] || TYPE_BADGE.Other
                      }`}
                    >
                      {lead.type_of_lead || 'Other'}
                    </span>
                  </td>
                  <td className="py-2 text-slate-600 whitespace-nowrap">
                    {lead.type_of_property || '—'}
                  </td>
                  <td className="py-2 text-slate-600 whitespace-nowrap">
                    {lead.lead_by_cleaned || lead.lead_by || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
