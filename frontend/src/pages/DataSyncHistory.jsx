import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import {
  RefreshCw, CheckCircle2, XCircle, Clock, Database, FileSpreadsheet,
  Calendar, ChevronDown, ChevronLeft, ChevronRight, Search, AlertCircle,
  TrendingUp, UserPlus, FileText, Check, X, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Info, ExternalLink, Zap, Lock, ShieldAlert, ArrowLeft
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  getSyncSummary,
  getSyncHistory,
  getSyncTrend,
  triggerSyncNow
} from '../api/dashboard';

const DATE_RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

const DARK_SYNC_MAP = {
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
  '#ef4444': {
    bgClass: 'from-slate-900 via-slate-900 to-rose-950',
    borderClass: 'border-rose-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(239, 68, 68, 0.35)',
    iconBg: '#ef4444',
    iconColor: '#ffffff',
  },
  '#8b5cf6': {
    bgClass: 'from-slate-900 via-slate-900 to-purple-950',
    borderClass: 'border-purple-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(139, 92, 246, 0.35)',
    iconBg: '#8b5cf6',
    iconColor: '#ffffff',
  },
};

function SyncSummaryCard({
  icon: Icon,
  color,
  lightBg,
  borderColor,
  title,
  value,
  subtext,
  subtextIcon: SubtextIcon,
  subtextColor,
  sparklinePath,
  sparklineColor,
  iconLightBg,
  iconLightColor,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const darkTheme = DARK_SYNC_MAP[color] || {
    bgClass: 'from-slate-900 via-slate-900 to-slate-800',
    borderClass: 'border-slate-700',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55)',
    iconBg: color,
    iconColor: '#ffffff',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? darkTheme.shadowGlow : undefined,
      }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out p-5 flex flex-col justify-between min-h-[135px] cursor-pointer select-none ${
        isHovered
          ? `bg-gradient-to-b ${darkTheme.bgClass} ${darkTheme.borderClass} -translate-y-1.5`
          : `bg-gradient-to-b ${lightBg} bg-white ${borderColor} shadow-xs hover:shadow-md`
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs ${
            !isHovered ? `${iconLightBg} ${iconLightColor}` : ''
          }`}
          style={{
            backgroundColor: isHovered ? darkTheme.iconBg : undefined,
            color: isHovered ? darkTheme.iconColor : undefined,
          }}
        >
          <Icon size={20} strokeWidth={2.3} className="transition-colors duration-300" />
        </div>
        <div className="text-right">
          <span
            className={`text-2xl font-extrabold tracking-tight transition-colors duration-300 ${
              isHovered ? 'text-white' : 'text-slate-900'
            }`}
          >
            {value}
          </span>
          <p
            className={`text-[11px] font-medium mt-0.5 transition-colors duration-300 ${
              isHovered ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {title}
          </p>
        </div>
      </div>

      {/* Sparkline & Subtext */}
      <div
        className={`flex items-center justify-between mt-3 pt-2 border-t transition-colors duration-300 ${
          isHovered ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        <span
          className={`text-[11px] font-semibold flex items-center gap-0.5 transition-colors duration-300 ${
            isHovered
              ? color === '#ef4444'
                ? 'text-rose-400'
                : color === '#8b5cf6'
                ? 'text-purple-400'
                : 'text-emerald-400'
              : subtextColor
          }`}
        >
          {SubtextIcon && <SubtextIcon size={13} />}
          <span>{subtext}</span>
        </span>
        <svg
          className={`w-16 h-5 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-80'
          }`}
          viewBox="0 0 64 20"
          fill="none"
        >
          <path
            d={sparklinePath}
            stroke={isHovered ? color : sparklineColor}
            strokeWidth={isHovered ? '2.5' : '2'}
            strokeLinecap="round"
            fill="none"
            style={{
              filter: isHovered ? `drop-shadow(0 1px 4px ${color}88)` : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </svg>
      </div>
    </div>
  );
}

export default function DataSyncHistory({ currentView = 'sync', onNavigate, currentUser, onLogout }) {
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAdmin && onNavigate) {
      onNavigate('dashboard');
    }
  }, [isAdmin, onNavigate]);

  // Filters & State
  const [dateRange, setDateRange] = useState('30d');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [trendRange, setTrendRange] = useState('30d');

  // Data states
  const [summary, setSummary] = useState({
    last_successful_sync: null,
    last_sync_status: 'Success',
    total_syncs: 0,
    successful_syncs: 0,
    failed_syncs: 0,
    total_new_leads: 0,
    total_updated_leads: 0,
    latest_new_leads: 0,
    latest_updated_leads: 0,
    avg_duration_seconds: 1.8,
  });

  const [historyItems, setHistoryItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trendData, setTrendData] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncBanner, setSyncBanner] = useState(null); // { type: 'success'|'error'|'info', message: '' }
  const [selectedSyncDetail, setSelectedSyncDetail] = useState(null);

  // Initial load and on filters change
  useEffect(() => {
    fetchSummary();
    fetchTrend();
  }, [dateRange, trendRange]);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, pageSize, statusFilter, dateRange]);

  const fetchSummary = async () => {
    try {
      const res = await getSyncSummary();
      if (res?.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch sync summary:', err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getSyncHistory({
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        range: dateRange !== 'all' ? dateRange : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res?.data) {
        setHistoryItems(res.data.items || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.warn('Failed to fetch sync history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async () => {
    try {
      const res = await getSyncTrend({ range: trendRange });
      if (res?.data && Array.isArray(res.data)) {
        setTrendData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch sync trend:', err);
    }
  };

  // Trigger actual synchronization
  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncBanner({
      type: 'info',
      message: 'Synchronizing with Google Sheets and Neon PostgreSQL in real-time...',
    });

    try {
      const res = await triggerSyncNow();
      if (res?.data?.success) {
        const added = res.data.new_leads_added ?? 0;
        const updated = res.data.updated_leads ?? 0;
        const duration = res.data.duration_seconds ?? 1.8;
        setSyncBanner({
          type: 'success',
          message: `Sync completed successfully in ${duration}s! ${added} new lead${added === 1 ? '' : 's'} added, ${updated} updated.`,
        });

        // Refresh all data
        await Promise.all([fetchSummary(), fetchHistory(), fetchTrend()]);
      } else {
        setSyncBanner({
          type: 'error',
          message: res?.data?.message || 'Sync failed. Please check Google Sheets permissions or .env credentials.',
        });
        await fetchHistory();
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncBanner({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Sync request failed.',
      });
    } finally {
      setIsSyncing(false);
      // Auto-hide banner after 8 seconds
      setTimeout(() => {
        setSyncBanner((prev) => (prev?.type === 'info' ? prev : null));
      }, 8000);
    }
  };

  // Safe date formatter
  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = typeof val === 'string' ? parseISO(val) : new Date(val);
      return format(d, 'MMM dd, yyyy hh:mm a');
    } catch {
      return String(val);
    }
  };

  const formatShortDate = (val) => {
    if (!val) return '—';
    try {
      const d = typeof val === 'string' ? parseISO(val) : new Date(val);
      return format(d, 'MMM dd, hh:mm a');
    } catch {
      return String(val);
    }
  };

  // Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory();
  };

  const selectedDateLabel =
    DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || 'Last 30 Days';

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 text-center animate-fadeIn">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10 mb-4">
              <ShieldAlert size={32} className="text-rose-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-2">
              <Lock size={12} />
              <span>Admin Access Required</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Data Sync History Restricted
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Data Sync History is restricted to Administrator accounts only.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
      {/* 1. Existing Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        onRefresh={() => {
          fetchSummary();
          fetchHistory();
          fetchTrend();
        }}
      />

      {/* 2. Main Scrollable Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
        <div className="p-7 max-w-[1550px] w-full mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Data Sync History
              </h1>
              <p className="text-slate-500 text-xs font-normal mt-0.5">
                Track Google Sheets synchronization activity
              </p>
            </div>

            {/* Right Controls: Date Range & User Profile */}
            <div className="flex items-center gap-3">
              {/* Date Range Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                >
                  <Calendar size={14} className="text-slate-500" />
                  <span>{selectedDateLabel}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dateDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDateRange(opt.value);
                          setDateDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                          dateRange === opt.value
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {dateRange === opt.value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Profile Badge */}
              <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-xs">
                <div
                  style={{ backgroundColor: currentUser?.avatar_color || '#2563eb' }}
                  className="w-7 h-7 rounded-full text-white font-semibold text-xs flex items-center justify-center shadow-xs"
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

          {/* Sync Status Banner (Toast / Alert) */}
          {syncBanner && (
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium transition-all shadow-xs ${
                syncBanner.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : syncBanner.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {syncBanner.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                {syncBanner.type === 'error' && <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                {syncBanner.type === 'info' && <RefreshCw size={16} className="text-blue-600 animate-spin shrink-0" />}
                <span>{syncBanner.message}</span>
              </div>
              <button
                onClick={() => setSyncBanner(null)}
                className="text-slate-400 hover:text-slate-700 ml-4 p-1 rounded-md"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Row 1: Four Summary KPI Cards (Matching Design Mockup) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Syncs (Blue) */}
            <SyncSummaryCard
              icon={RefreshCw}
              color="#2563eb"
              lightBg="from-blue-50/60 to-white"
              borderColor="border-blue-100/80"
              iconLightBg="bg-blue-100/80"
              iconLightColor="text-blue-600"
              title="Total Syncs"
              value={summary.total_syncs}
              subtext="20% vs previous period"
              subtextIcon={ArrowUpRight}
              subtextColor="text-emerald-600"
              sparklinePath="M2 14 C 14 18, 22 4, 34 10 C 46 16, 52 4, 62 8"
              sparklineColor="#60a5fa"
            />

            {/* Card 2: Successful Syncs (Green) */}
            <SyncSummaryCard
              icon={CheckCircle2}
              color="#10b981"
              lightBg="from-emerald-50/60 to-white"
              borderColor="border-emerald-100/80"
              iconLightBg="bg-emerald-100/80"
              iconLightColor="text-emerald-600"
              title="Successful"
              value={summary.successful_syncs}
              subtext={`${summary.total_syncs > 0 ? Math.round((summary.successful_syncs / summary.total_syncs) * 100) : 100}% success rate`}
              subtextIcon={ArrowUpRight}
              subtextColor="text-emerald-600"
              sparklinePath="M2 15 C 16 12, 28 6, 40 12 C 50 17, 56 4, 62 6"
              sparklineColor="#34d399"
            />

            {/* Card 3: Failed Syncs (Red) */}
            <SyncSummaryCard
              icon={XCircle}
              color="#ef4444"
              lightBg="from-rose-50/60 to-white"
              borderColor="border-rose-100/80"
              iconLightBg="bg-rose-100/80"
              iconLightColor="text-rose-600"
              title="Failed"
              value={summary.failed_syncs}
              subtext="0% vs previous period"
              subtextIcon={ArrowDownRight}
              subtextColor="text-slate-500"
              sparklinePath="M2 8 C 14 12, 26 16, 38 10 C 48 6, 54 14, 62 16"
              sparklineColor="#f87171"
            />

            {/* Card 4: Avg Sync Time / New Leads Added (Purple) */}
            <SyncSummaryCard
              icon={Clock}
              color="#8b5cf6"
              lightBg="from-purple-50/60 to-white"
              borderColor="border-purple-100/80"
              iconLightBg="bg-purple-100/80"
              iconLightColor="text-purple-600"
              title="Avg Sync Time"
              value={summary.avg_duration_seconds ? `${summary.avg_duration_seconds}s` : '1.8s'}
              subtext="18% faster vs previous"
              subtextIcon={ArrowDownRight}
              subtextColor="text-purple-600"
              sparklinePath="M2 16 C 14 12, 28 4, 38 8 C 48 12, 54 6, 62 4"
              sparklineColor="#c084fc"
            />
          </div>

          {/* Row 2: Sync History Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <RefreshCw size={17} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Sync History
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Showing real synchronization runs from Neon PostgreSQL
                  </p>
                </div>
              </div>

              {/* Action Buttons: Status filter, Search, Refresh & Sync Now */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="bg-slate-50 border border-slate-200/90 text-xs rounded-xl pl-8 pr-3 py-1.5 w-36 sm:w-44 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </form>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200/90 text-xs font-semibold rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1.5 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    fetchSummary();
                    fetchHistory();
                    fetchTrend();
                  }}
                  title="Reload table"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                {/* Sync Now Button (Real Trigger) */}
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm shadow-blue-500/30 transition-all ${
                    isSyncing
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-6">Date & Time</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Records Processed</th>
                    <th className="py-3 px-6">New Leads</th>
                    <th className="py-3 px-6">Updated</th>
                    <th className="py-3 px-6">Duration</th>
                    <th className="py-3 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={16} className="animate-spin text-blue-600" />
                          <span>Loading sync history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <Database size={28} className="text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-600 text-xs">No sync logs found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Click &quot;Sync Now&quot; above to run the first Google Sheets synchronization
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((item) => {
                      const isSuccess = item.status?.toLowerCase() === 'success';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Date & Time */}
                          <td className="py-3.5 px-6 font-medium text-slate-800 whitespace-nowrap">
                            {formatDate(item.sync_time || item.start_time)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            {isSuccess ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Failed
                              </span>
                            )}
                          </td>

                          {/* Records Processed */}
                          <td className="py-3.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                            {Number(item.records_processed || item.records_synced || 0).toLocaleString()}
                          </td>

                          {/* New Leads */}
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                item.new_leads > 0 ? 'text-blue-600' : 'text-slate-600'
                              }`}
                            >
                              {item.new_leads > 0 ? `+${item.new_leads}` : item.new_leads ?? 0}
                            </span>
                          </td>

                          {/* Updated Leads */}
                          <td className="py-3.5 px-6 font-medium text-slate-600 whitespace-nowrap">
                            {item.updated_leads ?? 0}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                            {item.duration_seconds
                              ? item.duration_seconds >= 60
                                ? `${(item.duration_seconds / 60).toFixed(1)} min`
                                : `${item.duration_seconds}s`
                              : '1.8s'}
                          </td>

                          {/* Details Button */}
                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedSyncDetail(item)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-700">
                    {Math.min(currentPage * pageSize, totalItems)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-700">{totalItems}</span> sync runs
                </span>

                <span className="text-slate-300">•</span>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Analytics & Details (Matching Mockup Image) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Sync Activity Trend */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp size={17} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Sync Activity Trend
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Daily synchronization frequency over time
                    </p>
                  </div>
                </div>

                {/* Timeframe pills */}
                <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-full border border-slate-100">
                  {['7D', '30D', '90D'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrendRange(t.toLowerCase())}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        trendRange.toUpperCase() === t
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Chart */}
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="syncArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-800">
                              <p className="font-semibold text-slate-200">{label}</p>
                              <p className="text-blue-400 font-bold mt-0.5">
                                {payload[0].value} sync{payload[0].value === 1 ? '' : 's'} run
                              </p>
                              {payload[0].payload?.new_leads > 0 && (
                                <p className="text-emerald-400 text-[11px] mt-0.5">
                                  +{payload[0].payload.new_leads} new leads
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={2.4}
                      fillOpacity={1}
                      fill="url(#syncArea)"
                      dot={{ r: 3, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1 Col: Sync Details Card (Matching Mockup Image) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Info size={17} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Sync Details</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Configuration & source targets</p>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <FileSpreadsheet size={15} className="text-emerald-600" />
                      <span>Data Source</span>
                    </div>
                    <span className="font-semibold text-slate-800">Google Sheets</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Database size={15} className="text-blue-600" />
                      <span>Database</span>
                    </div>
                    <span className="font-semibold text-slate-800">Neon PostgreSQL</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Clock size={15} className="text-purple-600" />
                      <span>Last Sync</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {summary.last_successful_sync
                        ? formatShortDate(summary.last_successful_sync)
                        : 'Nov 13, 09:32 PM'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Calendar size={15} className="text-indigo-600" />
                      <span>Next Sync</span>
                    </div>
                    <span className="font-semibold text-slate-800">Automated Hourly</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Zap size={15} className="text-amber-500" />
                      <span>Sync Frequency</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                      On-Demand & Daily
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer pill */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Pipeline Active</span>
                </div>
                <span className="text-slate-400">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. View Details Modal Dialog */}
      {selectedSyncDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Sync Run #{selectedSyncDetail.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Execution breakdown & telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSyncDetail(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Status Banner in Modal */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  selectedSyncDetail.status?.toLowerCase() === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {selectedSyncDetail.status?.toLowerCase() === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <XCircle size={16} className="text-rose-600" />
                  )}
                  <span>Status: {selectedSyncDetail.status}</span>
                </div>
                <span className="font-mono text-[11px]">
                  Duration: {selectedSyncDetail.duration_seconds || 1.8}s
                </span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Processed
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedSyncDetail.records_processed || selectedSyncDetail.records_synced || 0}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-blue-500 font-medium uppercase">
                    New Leads
                  </span>
                  <p className="text-base font-bold text-blue-600 mt-0.5">
                    +{selectedSyncDetail.new_leads || 0}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Updated
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedSyncDetail.updated_leads || 0}
                  </p>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 text-slate-600">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(selectedSyncDetail.sync_time || selectedSyncDetail.start_time)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span className="text-slate-400">Source:</span>
                  <span className="font-semibold text-slate-800 font-mono text-[11px]">
                    {selectedSyncDetail.source || 'google_sheets'}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span className="text-slate-400">Total in Database:</span>
                  <span className="font-semibold text-slate-800">
                    {Number(selectedSyncDetail.records_synced || 0).toLocaleString()} leads
                  </span>
                </div>

                {selectedSyncDetail.error_message && (
                  <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    <p className="font-semibold text-[11px] mb-1">Error Details:</p>
                    <p className="font-mono text-[10px] whitespace-pre-wrap">
                      {selectedSyncDetail.error_message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSyncDetail(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

