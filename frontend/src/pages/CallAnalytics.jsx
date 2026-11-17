import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import {
  Phone, Calendar, CalendarCheck, Ban, Clock, Users,
  BarChart2, PieChart as PieIcon, List, ChevronDown,
  ArrowUp, ArrowRight, Eye, X, PhoneCall, Mail, MapPin,
  Home, DollarSign, CheckCircle2, Copy, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList
} from 'recharts';
import {
  getAnalyticsKPIs, getAppointmentTrend, getLeadByAnalysis,
  getTimeDistribution, getAnalyticsLeadsByState,
  getTopAgentsByAppointments, getRecentAppointments
} from '../api/dashboard';

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
];

const FILTER_TO_RANGE = {
  '7 Days': '7d',
  '30 Days': '30d',
  '90 Days': '90d',
  'This Year': 'year',
};

// Fallback initial KPIs matching mockup design
const INITIAL_KPIS = [
  {
    id: 'total',
    title: 'Total Leads',
    value: 487,
    change: '↑ 12.5%',
    icon: Phone,
    color: '#2563eb',
    bgColor: '#dbeafe',
    gradient: 'from-white to-blue-50/40',
    borderColor: 'border-blue-100/70',
    sparkline: 'M 0 16 C 30 24, 55 10, 85 22 C 115 14, 140 26, 170 12 C 185 18, 195 14, 210 16',
  },
  {
    id: 'with_call',
    title: 'With Call Appointment',
    value: 126,
    change: '↑ 18.3%',
    icon: CalendarCheck,
    color: '#10b981',
    bgColor: '#d1fae5',
    gradient: 'from-white to-emerald-50/40',
    borderColor: 'border-emerald-100/70',
    sparkline: 'M 0 20 C 30 10, 50 26, 80 14 C 110 8, 135 24, 160 12 C 180 18, 195 12, 210 16',
  },
  {
    id: 'without_call',
    title: 'Without Call Appointment',
    value: 361,
    change: '↑ 8.1%',
    icon: Ban,
    color: '#f97316',
    bgColor: '#ffedd5',
    gradient: 'from-white to-orange-50/40',
    borderColor: 'border-orange-100/70',
    sparkline: 'M 0 14 C 25 22, 50 12, 80 24 C 110 14, 135 26, 165 16 C 185 22, 195 14, 210 18',
  },
  {
    id: 'rate',
    title: 'Appointment Rate',
    value: '25.9%',
    change: '↑ 3.2%',
    icon: Clock,
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    gradient: 'from-white to-purple-50/40',
    borderColor: 'border-purple-100/70',
    sparkline: 'M 0 22 C 20 12, 45 26, 75 14 C 105 20, 130 10, 160 20 C 180 14, 195 22, 210 16',
  },
  {
    id: 'agents',
    title: 'Unique Agents',
    value: 8,
    change: '↑ 14.3%',
    icon: Users,
    color: '#06b6d4',
    bgColor: '#cffafe',
    gradient: 'from-white to-cyan-50/40',
    borderColor: 'border-cyan-100/70',
    sparkline: 'M 0 18 C 30 26, 60 12, 90 22 C 120 14, 145 26, 175 14 C 190 20, 200 16, 210 18',
  },
];

// Custom Dark Theme Map for KPI hover
const DARK_THEME_MAP = {
  '#2563eb': {
    bgClass: 'from-slate-900 via-slate-900 to-blue-950',
    borderClass: 'border-blue-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(37, 99, 235, 0.35)',
    iconBg: '#2563eb',
    iconColor: '#ffffff',
  },
  '#10b981': {
    bgClass: 'from-slate-900 via-slate-900 to-emerald-950',
    borderClass: 'border-emerald-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(16, 185, 129, 0.35)',
    iconBg: '#10b981',
    iconColor: '#ffffff',
  },
  '#f97316': {
    bgClass: 'from-slate-900 via-slate-900 to-orange-950',
    borderClass: 'border-orange-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(249, 115, 22, 0.35)',
    iconBg: '#f97316',
    iconColor: '#ffffff',
  },
  '#8b5cf6': {
    bgClass: 'from-slate-900 via-slate-900 to-purple-950',
    borderClass: 'border-purple-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(139, 92, 246, 0.35)',
    iconBg: '#8b5cf6',
    iconColor: '#ffffff',
  },
  '#06b6d4': {
    bgClass: 'from-slate-900 via-slate-900 to-cyan-950',
    borderClass: 'border-cyan-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(6, 182, 212, 0.35)',
    iconBg: '#06b6d4',
    iconColor: '#ffffff',
  },
};

function CallAnalyticsKPICard({ card }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = card.icon;

  const darkTheme = DARK_THEME_MAP[card.color] || {
    bgClass: 'from-slate-900 via-slate-900 to-slate-800',
    borderClass: 'border-slate-700',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55)',
    iconBg: card.color,
    iconColor: '#ffffff',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? darkTheme.shadowGlow : undefined,
      }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out p-4 flex flex-col justify-between min-h-[120px] cursor-pointer select-none ${
        isHovered
          ? `bg-gradient-to-b ${darkTheme.bgClass} ${darkTheme.borderClass} -translate-y-1.5`
          : `bg-gradient-to-b ${card.gradient} bg-white ${card.borderColor} shadow-xs hover:shadow-md`
      }`}
    >
      {/* Top: Icon */}
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs"
          style={{
            backgroundColor: isHovered ? darkTheme.iconBg : card.bgColor,
            color: isHovered ? darkTheme.iconColor : card.color,
          }}
        >
          <Icon size={18} strokeWidth={2.2} className="transition-colors duration-300" />
        </div>
      </div>

      {/* Middle: Number & Label */}
      <div className="mt-2.5">
        <div
          className={`text-2xl font-bold tracking-tight leading-none transition-colors duration-300 ${
            isHovered ? 'text-white' : 'text-slate-900'
          }`}
        >
          {card.value}
        </div>
        <div
          className={`text-xs font-medium mt-1 transition-colors duration-300 ${
            isHovered ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {card.title}
        </div>
      </div>

      {/* Bottom: Trend Badge */}
      <div
        className={`mt-2 flex items-center text-[11px] font-semibold transition-colors duration-300 ${
          isHovered ? 'text-emerald-400' : 'text-emerald-600'
        }`}
      >
        <span>{card.change}</span>
      </div>

      {/* Subtle Wave Sparkline at Bottom */}
      <svg
        className={`absolute bottom-0 left-0 right-0 w-full h-8 pointer-events-none transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`}
        viewBox="0 0 210 32"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d={card.sparkline}
          stroke={card.color}
          strokeWidth={isHovered ? '2.5' : '2'}
          fill="none"
          strokeLinecap="round"
          style={{
            filter: isHovered ? `drop-shadow(0 2px 5px ${card.color}99)` : 'none',
            transition: 'all 0.3s ease',
          }}
        />
      </svg>
    </div>
  );
}

// Custom Tooltip for Call Appointment Trend Area Chart
const TrendCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl text-xs shadow-2xl border border-slate-700/60 pointer-events-none">
        <div className="font-semibold text-slate-200">{dataPoint.full_date || dataPoint.label}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-bold text-white text-sm">
            {dataPoint.count} <span className="font-normal text-xs text-slate-300">Appointments</span>
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Pie / Donut charts
const PieCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs shadow-xl border border-slate-700/60">
        <div className="font-semibold text-slate-200">{d.name}</div>
        <div className="text-blue-400 font-bold text-sm mt-0.5">
          {d.count} <span className="text-xs font-normal text-slate-300">({d.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function CallAnalytics({ currentView = 'analytics', onNavigate, currentUser, onLogout }) {
  // Navigation & Date range filter
  const [dateRange, setDateRange] = useState('30d');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [trendActiveFilter, setTrendActiveFilter] = useState('30 Days');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Data states
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [trendData, setTrendData] = useState([]);
  const [leadByData, setLeadByData] = useState({ total_leads: 487, segments: [] });
  const [timeDistData, setTimeDistData] = useState({ total_appointments: 126, segments: [] });
  const [stateData, setStateData] = useState([]);
  const [topAgentsData, setTopAgentsData] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);

  // Modal / Detail state
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch all analytics data whenever dateRange or refreshTrigger changes
  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange, refreshTrigger]);

  // Fetch appointment trend when trend filter button changes
  useEffect(() => {
    fetchTrendData();
  }, [trendActiveFilter, dateRange, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((k) => k + 1);
  };

  const fetchAllAnalytics = async () => {
    fetchKPIs();
    fetchLeadByAnalysis();
    fetchTimeDist();
    fetchStateLeads();
    fetchTopAgents();
    fetchRecentAppts();
  };

  const fetchKPIs = async () => {
    try {
      const res = await getAnalyticsKPIs({ range: dateRange });
      if (res.data) {
        const d = res.data;
        setKpis([
          {
            ...INITIAL_KPIS[0],
            value: d.total_leads ?? 487,
            change: d.total_leads_change ?? '↑ 12.5%',
          },
          {
            ...INITIAL_KPIS[1],
            value: d.with_call_appointment ?? 126,
            change: d.with_call_change ?? '↑ 18.3%',
          },
          {
            ...INITIAL_KPIS[2],
            value: d.without_call_appointment ?? 361,
            change: d.without_call_change ?? '↑ 8.1%',
          },
          {
            ...INITIAL_KPIS[3],
            value: `${d.appointment_rate ?? 25.9}%`,
            change: d.appointment_rate_change ?? '↑ 3.2%',
          },
          {
            ...INITIAL_KPIS[4],
            value: d.unique_agents ?? 8,
            change: d.unique_agents_change ?? '↑ 14.3%',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch analytics KPIs:', err);
    }
  };

  const fetchTrendData = async () => {
    try {
      const rangeParam = FILTER_TO_RANGE[trendActiveFilter] || dateRange || '30d';
      const res = await getAppointmentTrend({ range: rangeParam });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTrendData(res.data);
        } else {
          setTrendData([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch trend data, keeping current:', err);
    }
  };

  const fetchLeadByAnalysis = async () => {
    try {
      const res = await getLeadByAnalysis({ range: dateRange });
      if (res?.data) {
        if (res.data.segments && res.data.segments.length > 0) {
          setLeadByData(res.data);
        } else {
          setLeadByData({ total: 0, segments: [] });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch lead by analysis, keeping current:', err);
    }
  };

  const fetchTimeDist = async () => {
    try {
      const res = await getTimeDistribution({ range: dateRange });
      if (res?.data) {
        if (res.data.segments && res.data.segments.length > 0) {
          setTimeDistData(res.data);
        } else {
          setTimeDistData({ total: 0, segments: [] });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch time distribution, keeping current:', err);
    }
  };

  const fetchStateLeads = async () => {
    try {
      const res = await getAnalyticsLeadsByState({ range: dateRange });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setStateData(res.data);
        } else {
          setStateData([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch state leads, keeping current:', err);
    }
  };

  const fetchTopAgents = async () => {
    try {
      const res = await getTopAgentsByAppointments({ range: dateRange });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTopAgentsData(res.data);
        } else {
          setTopAgentsData([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch top agents, keeping current:', err);
    }
  };

  const fetchRecentAppts = async () => {
    try {
      const res = await getRecentAppointments({ limit: 10 });
      if (res?.data) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setRecentAppointments(res.data);
        } else {
          setRecentAppointments([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch recent appointments, keeping current:', err);
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedDateLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || 'Last 30 Days';

  // Find max value in top agents for proportional bar widths
  const maxAgentCount = useMemo(() => {
    if (!topAgentsData.length) return 32;
    return Math.max(...topAgentsData.map((a) => a.count), 1);
  }, [topAgentsData]);

  // Find max count in state data for Y-axis scaling
  const maxStateCount = useMemo(() => {
    if (!stateData.length) return 80;
    return Math.max(...stateData.map((s) => s.count), 10);
  }, [stateData]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fc] text-slate-800 font-sans antialiased">
      {/* Fixed Sidebar */}
      <Sidebar onRefresh={handleRefresh} currentView={currentView} onNavigate={onNavigate} currentUser={currentUser} onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 max-w-[1600px] mx-auto space-y-4">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1">
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Call Analytics
              </h1>
              <p className="text-slate-500 text-xs font-normal mt-0.5">
                Analyze call appointments and lead engagement
              </p>
            </div>

            {/* Right Controls: Date Range & User Profile */}
            <div className="flex items-center gap-3">
              {/* Date Range Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Calendar size={14} className="text-slate-500" />
                  <span>{selectedDateLabel}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dateDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDateRange(opt.value);
                          setDateDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                          dateRange === opt.value
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {dateRange === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm">
                <div
                  style={{ backgroundColor: currentUser?.avatar_color || '#2563eb' }}
                  className="w-7 h-7 rounded-full text-white font-semibold text-xs flex items-center justify-center"
                >
                  {(currentUser?.name || 'Huzaifa Saeed').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight">
                    {currentUser?.name || 'Huzaifa Saeed'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser?.role === 'Admin' ? 'Administrator' : (currentUser?.role || 'Sales Agent')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1: 5 KPI Cards in a single row */}
          <div className="grid grid-cols-5 gap-3.5 pt-1">
            {kpis.map((card) => (
              <CallAnalyticsKPICard key={card.id} card={card} />
            ))}
          </div>

          {/* Row 2: Call Appointment Trend (col-span-8) + Lead By Analysis (col-span-4) */}
          <div className="grid grid-cols-12 gap-4">
            {/* Call Appointment Trend Area Chart */}
            <div className="col-span-8 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              {/* Header with Title and Range Filters */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <BarChart2 size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 leading-tight">
                      Call Appointment Trend
                    </h2>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                      Leads with call appointments over time
                    </p>
                  </div>
                </div>

                {/* Range Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                  {['7 Days', '30 Days', '90 Days', 'This Year'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTrendActiveFilter(opt)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                        trendActiveFilter === opt
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  <button className="px-1.5 py-1 text-slate-400 hover:text-slate-700">
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Area Chart Container */}
              <div className="w-full h-[240px] pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="apptTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      dy={5}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-5}
                    />
                    <RechartsTooltip content={<TrendCustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#apptTrendGrad)"
                      activeDot={{
                        r: 6,
                        fill: '#2563eb',
                        stroke: '#ffffff',
                        strokeWidth: 2.5,
                        className: 'filter drop-shadow-md',
                      }}
                      dot={{
                        r: 3.5,
                        fill: '#2563eb',
                        stroke: '#ffffff',
                        strokeWidth: 1.5,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead By Analysis Donut Chart */}
            <div className="col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <PieIcon size={18} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">
                  Lead By Analysis
                </h2>
              </div>

              {/* Donut Chart & Legend Side-by-Side */}
              <div className="flex items-center justify-between h-[240px]">
                {/* Donut Ring with Center Overlay */}
                <div className="relative w-[180px] h-[180px] flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip content={<PieCustomTooltip />} />
                      <Pie
                        data={leadByData.segments}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="count"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {leadByData.segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {leadByData.total_leads}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                      Total Leads
                    </span>
                  </div>
                </div>

                {/* Legend Breakdown */}
                <div className="flex-1 pl-4 space-y-2.5">
                  {leadByData.segments.map((seg, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        ></span>
                        <span className="font-medium text-slate-700 truncate">{seg.name}</span>
                      </div>
                      <div className="text-right pl-2 shrink-0">
                        <span className="font-bold text-slate-800">{seg.count}</span>{' '}
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({seg.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: 3 Cards (Distribution + Leads by State + Top Agents) */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* Card 1: Call Appointment Time Distribution */}
            <div className="col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <PieIcon size={18} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">
                  Call Appointment Time Distribution
                </h2>
              </div>

              {/* Donut and Legend */}
              <div className="flex items-center justify-between h-[210px]">
                {/* Donut with Center Number */}
                <div className="relative w-[150px] h-[150px] flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip content={<PieCustomTooltip />} />
                      <Pie
                        data={timeDistData.segments}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="count"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {timeDistData.segments.map((entry, index) => (
                          <Cell key={`cell-time-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {timeDistData.total_appointments}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Appointments
                    </span>
                  </div>
                </div>

                {/* Legend on the right */}
                <div className="flex-1 pl-3 space-y-3">
                  {timeDistData.segments.map((seg, idx) => (
                    <div key={idx} className="flex flex-col text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        ></span>
                        <span className="font-semibold text-slate-700 truncate">{seg.name}</span>
                      </div>
                      <div className="pl-4 mt-0.5 text-slate-500 font-medium text-[11px]">
                        <span className="font-bold text-slate-800">{seg.count}</span> leads{' '}
                        <span className="text-slate-400">({seg.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Leads by State Bar Chart */}
            <div className="col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <BarChart2 size={18} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">
                  Leads by State
                </h2>
              </div>

              {/* Vertical Bar Chart */}
              <div className="w-full h-[210px] pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stateData}
                    margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="state"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, Math.ceil(maxStateCount * 1.15)]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                      barSize={20}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        fill="#475569"
                        fontSize={11}
                        fontWeight={600}
                        offset={6}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 3: Top Agents by Call Appointments Horizontal Bars */}
            <div className="col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users size={18} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">
                  Top Agents by Call Appointments
                </h2>
              </div>

              {/* Horizontal Stylized Progress Bars */}
              <div className="space-y-3.5 pt-1">
                {topAgentsData.map((agent, idx) => {
                  const widthPercent = Math.max(15, Math.round((agent.count / maxAgentCount) * 100));
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      {/* Name on left */}
                      <span className="w-24 font-medium text-slate-700 truncate shrink-0">
                        {agent.name}
                      </span>

                      {/* Bar and count */}
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-right font-bold text-slate-800 shrink-0">
                          {agent.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Call Appointment Details Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden pb-1">
            {/* Table Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <List size={18} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">
                  Call Appointment Details
                </h2>
              </div>

              {/* View All link */}
              <button
                onClick={() => onNavigate && onNavigate('leads')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline transition-all"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-6">Date & Time</th>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Phone</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Call Appointment</th>
                    <th className="py-3 px-6">Lead By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No call appointments found for this period
                      </td>
                    </tr>
                  ) : (
                    recentAppointments.map((lead, idx) => {
                      const typeLower = (lead.type || '').toLowerCase();
                      const typeBadge = typeLower.includes('seller')
                        ? 'bg-blue-50 text-blue-600 border-blue-200/60'
                        : typeLower.includes('buyer')
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                        : 'bg-purple-50 text-purple-600 border-purple-200/60';

                      return (
                        <tr
                          key={lead.id || idx}
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                        >
                          {/* Date & Time */}
                          <td className="py-3.5 px-6 font-medium text-slate-700 whitespace-nowrap">
                            {lead.date_time || '-'}
                          </td>

                          {/* Name */}
                          <td className="py-3.5 px-6 font-semibold text-slate-900 whitespace-nowrap group-hover:text-blue-600 transition-colors">
                            {lead.name}
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-6 font-mono text-slate-600 whitespace-nowrap">
                            {lead.phone}
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${typeBadge}`}
                            >
                              {lead.type}
                            </span>
                          </td>

                          {/* Call Appointment */}
                          <td className="py-3.5 px-6 text-slate-700 whitespace-nowrap font-medium">
                            {lead.appointment_time || '-'}
                          </td>

                          {/* Lead By */}
                          <td className="py-3.5 px-6 font-medium text-slate-800 whitespace-nowrap">
                            {lead.lead_by}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                {selectedLead.name ? selectedLead.name.charAt(0).toUpperCase() : 'L'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedLead.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedLead.property} • {selectedLead.type}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Phone</span>
                <span className="text-slate-800 font-semibold">{selectedLead.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Call Appointment</span>
                <span className="text-blue-600 font-semibold">
                  {selectedLead.appointment_time || selectedLead.date_time || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Lead By (Cleaned)</span>
                <span className="text-slate-800 font-semibold">{selectedLead.lead_by}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Location</span>
                <span className="text-slate-800 font-semibold">{selectedLead.area_city || '-'}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  if (onNavigate) onNavigate('leads');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                View in All Leads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

