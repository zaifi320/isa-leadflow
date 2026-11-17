import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getLeadsByStateTable } from '../api/dashboard';

const INITIAL_STATE_DATA = [
  { state: 'TX', state_name: 'Texas', total_leads: 101, month_leads: 42, today_leads: 5 },
  { state: 'FL', state_name: 'Florida', total_leads: 107, month_leads: 38, today_leads: 4 },
  { state: 'CA', state_name: 'California', total_leads: 37, month_leads: 18, today_leads: 2 },
  { state: 'GA', state_name: 'Georgia', total_leads: 60, month_leads: 25, today_leads: 3 },
  { state: 'NC', state_name: 'North Carolina', total_leads: 31, month_leads: 14, today_leads: 1 },
  { state: 'NY', state_name: 'New York', total_leads: 29, month_leads: 12, today_leads: 1 },
  { state: 'NJ', state_name: 'New Jersey', total_leads: 23, month_leads: 9, today_leads: 1 },
];

export default function StateLeadsTable({ refreshTrigger }) {
  const [data, setData] = useState(INITIAL_STATE_DATA);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('total_leads');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsByStateTable();
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setData(res.data);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.warn('Error fetching state table data, keeping current state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...data];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (row) =>
          row.state.toLowerCase().includes(term) ||
          (row.state_name && row.state_name.toLowerCase().includes(term))
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [data, searchTerm, sortField, sortDirection]);

  // Overall sums
  const totalOverall = data.reduce((sum, r) => sum + (r.total_leads || 0), 0);
  const totalMonth = data.reduce((sum, r) => sum + (r.month_leads || 0), 0);
  const totalToday = data.reduce((sum, r) => sum + (r.today_leads || 0), 0);

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-300 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown size={12} className="text-blue-600 ml-1 inline" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                Leads by State
              </h3>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {data.length} States
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Overall, monthly & daily breakdown
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-36 sm:w-44">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search state..."
            className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-2">
        <div className="overflow-y-auto max-h-[220px] rounded-lg border border-slate-100 scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 border-b border-slate-200/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('state')}
                  className="py-2 px-3 cursor-pointer select-none hover:text-slate-800 transition-colors"
                >
                  <span>State</span>
                  <SortIcon field="state" />
                </th>
                <th
                  onClick={() => handleSort('total_leads')}
                  className="py-2 px-3 text-right cursor-pointer select-none hover:text-slate-800 transition-colors"
                >
                  <span>Total Leads</span>
                  <SortIcon field="total_leads" />
                </th>
                <th
                  onClick={() => handleSort('month_leads')}
                  className="py-2 px-3 text-right cursor-pointer select-none hover:text-slate-800 transition-colors"
                >
                  <span>This Month</span>
                  <SortIcon field="month_leads" />
                </th>
                <th
                  onClick={() => handleSort('today_leads')}
                  className="py-2 px-3 text-right cursor-pointer select-none hover:text-slate-800 transition-colors"
                >
                  <span>Today</span>
                  <SortIcon field="today_leads" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    Loading state leads...
                  </td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    No states found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((row) => (
                  <tr
                    key={row.state}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-700 transition-colors">
                          {row.state}
                        </span>
                        <span className="font-medium text-slate-800 text-xs">
                          {row.state_name && row.state_name !== row.state
                            ? row.state_name
                            : row.state === 'Unknown'
                            ? 'Other / Unknown'
                            : row.state}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-xs">
                        {row.total_leads.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                        {row.month_leads}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.today_leads > 0
                            ? 'bg-amber-50 text-amber-700 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.today_leads}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-medium">Total ({data.length} States):</span>
        <div className="flex items-center gap-3">
          <span>
            Overall: <strong className="text-slate-800">{totalOverall.toLocaleString()}</strong>
          </span>
          <span>•</span>
          <span>
            Month: <strong className="text-blue-600">{totalMonth}</strong>
          </span>
          <span>•</span>
          <span>
            Today: <strong className="text-amber-600">{totalToday}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

