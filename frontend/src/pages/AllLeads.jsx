import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import {
  Search, RefreshCw, Download, Filter, Eye, X, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  List, LayoutGrid, Phone, Mail, MapPin, Calendar, DollarSign,
  User, Home, Briefcase, FileText, CheckCircle2, AlertCircle, Copy, Check, Lock
} from 'lucide-react';
import { getAllLeads, getFilterOptions, getExportUrl } from '../api/dashboard';
import { format, parseISO } from 'date-fns';

const DATE_RANGE_OPTIONS = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const INITIAL_FILTERS = {
  type_of_lead: 'All',
  type_of_property: 'All',
  state: 'All',
  city: 'All',
  budget: 'Any Budget',
  beds: 'Any',
  baths: 'Any',
  cash_finance: 'All',
  under_contract: 'All',
  willing_to_sign: 'All',
  lead_by: 'All',
  lead_for: 'All',
};

export default function AllLeads({ currentView = 'leads', onNavigate, currentUser, onLogout }) {
  // Navigation and header state
  const [dateRange, setDateRange] = useState('30d');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Search and filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showMoreFilters, setShowMoreFilters] = useState(true);

  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    type_of_lead: ['Buyer', 'Seller', 'Investor'],
    type_of_property: ['SFH', 'Condo', 'MFH', 'Land', 'Townhouse'],
    states: [],
    budget: ['<$200k', '$200k-$500k', '$500k+'],
    beds: ['1', '2', '3', '4', '5+'],
    baths: ['1', '1.5', '2', '2.5', '3+'],
    cash_finance: ['Cash', 'Finance', 'Both'],
    under_contract: ['No', 'Yes'],
    willing_to_sign: ['Yes', 'No'],
    lead_by: [],
    lead_for: [],
  });

  // Table pagination and data
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal / Detail drawer
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showExportDenied, setShowExportDenied] = useState(false);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const res = await getFilterOptions();
      if (res.data) {
        setFilterOptions((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  // Fetch leads whenever filters, search, page, perPage, or dateRange change
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 30000);

    try {
      const params = {
        page,
        per_page: perPage,
        search: searchQuery || undefined,
        range: dateRange || undefined,
        type_of_lead: filters.type_of_lead !== 'All' ? filters.type_of_lead : undefined,
        type_of_property: filters.type_of_property !== 'All' ? filters.type_of_property : undefined,
        state: filters.state !== 'All' ? filters.state : undefined,
        city: filters.city !== 'All' ? filters.city : undefined,
        budget: filters.budget !== 'Any Budget' && filters.budget !== 'All' ? filters.budget : undefined,
        beds: filters.beds !== 'Any' && filters.beds !== 'All' ? filters.beds : undefined,
        baths: filters.baths !== 'Any' && filters.baths !== 'All' ? filters.baths : undefined,
        cash_finance: filters.cash_finance !== 'All' ? filters.cash_finance : undefined,
        under_contract: filters.under_contract !== 'All' ? filters.under_contract : undefined,
        willing_to_sign: filters.willing_to_sign !== 'All' ? filters.willing_to_sign : undefined,
        lead_by: filters.lead_by !== 'All' ? filters.lead_by : undefined,
        lead_for: filters.lead_for !== 'All' ? filters.lead_for : undefined,
      };

      const res = await getAllLeads(params);
      clearTimeout(safetyTimer);
      if (res.data) {
        setLeads(res.data.items || []);
        setTotalLeads(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      clearTimeout(safetyTimer);
      console.error('Error fetching leads:', err);
      setLeads([]);
      setTotalLeads(0);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }, [page, perPage, searchQuery, dateRange, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  // Handle Filter Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchInput('');
    setSearchQuery('');
    setDateRange('all');
    setPage(1);
  };

  // Handle CSV Export - Only Admin can export (Requirement 1)
  const handleExport = () => {
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
    if (!isAdmin) {
      setShowExportDenied(true);
      return;
    }

    const params = {
      search: searchQuery || undefined,
      range: dateRange || undefined,
      type_of_lead: filters.type_of_lead !== 'All' ? filters.type_of_lead : undefined,
      type_of_property: filters.type_of_property !== 'All' ? filters.type_of_property : undefined,
      state: filters.state !== 'All' ? filters.state : undefined,
      budget: filters.budget !== 'Any Budget' && filters.budget !== 'All' ? filters.budget : undefined,
      beds: filters.beds !== 'Any' && filters.beds !== 'All' ? filters.beds : undefined,
      lead_by: filters.lead_by !== 'All' ? filters.lead_by : undefined,
      lead_for: filters.lead_for !== 'All' ? filters.lead_for : undefined,
      role: currentUser?.role || 'Admin',
    };
    window.open(getExportUrl(params), '_blank');
  };

  // Copy Message ID
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      return format(parseISO(isoString), 'MMM dd, yyyy h:mm a');
    } catch {
      return isoString;
    }
  };

  // Lead Type Badge component
  const LeadTypeBadge = ({ type }) => {
    const t = (type || '').toLowerCase();
    if (t.includes('seller')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
          Seller
        </span>
      );
    }
    if (t.includes('buyer')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
          Buyer
        </span>
      );
    }
    if (t.includes('investor')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs">
          Investor
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
        {type || 'Unknown'}
      </span>
    );
  };

  // Pagination page numbers generator
  const getPaginationNumbers = () => {
    const current = page;
    const total = totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fc] text-slate-800 font-sans antialiased">
      {/* Fixed Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onRefresh={fetchLeads}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 max-w-[1720px] mx-auto space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                All Leads
              </h1>
              <p className="text-slate-500 text-xs font-normal mt-0.5">
                Browse and manage all ISA LeadFlow leads from Google Sheets
              </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Date Range Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <Calendar size={14} className="text-slate-500" />
                  <span>
                    {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ||
                      'Last 30 Days'}
                  </span>
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
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
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

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <div
                    style={{ backgroundColor: currentUser?.avatar_color || '#2563eb' }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-500/20"
                  >
                    {(currentUser?.name || 'Huzaifa Saeed').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {currentUser?.name || 'Huzaifa Saeed'}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-semibold text-slate-800">
                        {currentUser?.name || 'Huzaifa Saeed'}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {currentUser?.role === 'Admin' ? 'Administrator' : (currentUser?.role || 'Sales Agent')}
                      </div>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50">
                      User Preferences
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar & Top Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
            {/* Search Input Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-center gap-2 min-w-[280px]"
            >
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, phone, address, city, or message ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
              >
                <Search size={13} />
                <span>Search</span>
              </button>
            </form>

            {/* Action Buttons: Export + Refresh */}
            <div className="flex items-center gap-2">
              <button
                id="export-leads-btn"
                onClick={handleExport}
                className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Export filtered leads to CSV"
              >
                <Download size={13} />
                <span>Export</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              <button
                onClick={fetchLeads}
                disabled={loading}
                className={`flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="Refresh leads list"
              >
                <RefreshCw
                  size={13}
                  className={loading ? 'animate-spin text-blue-600' : ''}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Pills Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 space-y-3">
            {/* Filter Row 1: 6 Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. Type of Lead */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Type of Lead
                </label>
                <div className="relative">
                  <select
                    value={filters.type_of_lead}
                    onChange={(e) =>
                      handleFilterChange('type_of_lead', e.target.value)
                    }
                    className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="All">All</option>
                    {filterOptions.type_of_lead.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* 2. Type of Property */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Type of Property
                </label>
                <div className="relative">
                  <select
                    value={filters.type_of_property}
                    onChange={(e) =>
                      handleFilterChange('type_of_property', e.target.value)
                    }
                    className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="All">All</option>
                    {filterOptions.type_of_property.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* 3. State */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  State
                </label>
                <div className="relative">
                  <select
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="All">All</option>
                    {filterOptions.states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* 4. City */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  City
                </label>
                <div className="relative">
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="All">All</option>
                    <option value="Dallas">Dallas</option>
                    <option value="Houston">Houston</option>
                    <option value="Austin">Austin</option>
                    <option value="Miami">Miami</option>
                    <option value="Atlanta">Atlanta</option>
                    <option value="Phoenix">Phoenix</option>
                    <option value="Denver">Denver</option>
                    <option value="Chicago">Chicago</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* 5. Budget */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Budget
                </label>
                <div className="relative">
                  <select
                    value={filters.budget}
                    onChange={(e) =>
                      handleFilterChange('budget', e.target.value)
                    }
                    className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="Any Budget">Any Budget</option>
                    <option value="<$200k">&lt; $200k</option>
                    <option value="$200k-$500k">$200k - $500k</option>
                    <option value="$500k+">$500k+</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* 6. Beds */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Beds
                </label>
                <div className="relative">
                  <select
                    value={filters.beds}
                    onChange={(e) => handleFilterChange('beds', e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="Any">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Filter Row 2: 6 Dropdowns (Collapsible via More Filters) */}
            {showMoreFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                {/* 7. Baths */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Baths
                  </label>
                  <div className="relative">
                    <select
                      value={filters.baths}
                      onChange={(e) =>
                        handleFilterChange('baths', e.target.value)
                      }
                      className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="Any">Any</option>
                      <option value="1">1</option>
                      <option value="1.5">1.5</option>
                      <option value="2">2</option>
                      <option value="2.5">2.5</option>
                      <option value="3+">3+</option>
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* 8. Cash/Finance */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cash/Finance
                  </label>
                  <div className="relative">
                    <select
                      value={filters.cash_finance}
                      onChange={(e) =>
                        handleFilterChange('cash_finance', e.target.value)
                      }
                      className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="All">All</option>
                      <option value="Cash">Cash</option>
                      <option value="Finance">Finance</option>
                      <option value="Both">Both</option>
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* 9. Under Contract */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Under Contract
                  </label>
                  <div className="relative">
                    <select
                      value={filters.under_contract}
                      onChange={(e) =>
                        handleFilterChange('under_contract', e.target.value)
                      }
                      className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="All">All</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* 10. Willing to Sign Contract */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Willing to Sign Contract
                  </label>
                  <div className="relative">
                    <select
                      value={filters.willing_to_sign}
                      onChange={(e) =>
                        handleFilterChange('willing_to_sign', e.target.value)
                      }
                      className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="All">All</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* 11. Lead By */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lead By
                  </label>
                  <div className="relative">
                    <select
                      value={filters.lead_by}
                      onChange={(e) =>
                        handleFilterChange('lead_by', e.target.value)
                      }
                      className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="All">All</option>
                      {filterOptions.lead_by.map((agent) => (
                        <option key={agent} value={agent}>
                          {agent}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* 12. Lead For */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lead For
                  </label>
                  <div className="relative">
                    <select
                      value={filters.lead_for}
                      onChange={(e) =>
                        handleFilterChange('lead_for', e.target.value)
                      }
                      className="w-full appearance-none bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="All">All</option>
                      {filterOptions.lead_for.map((lf) => (
                        <option key={lf} value={lf}>
                          {lf}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Toggle / Reset Filters Links */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
              <button
                onClick={handleResetFilters}
                className="text-slate-500 hover:text-rose-600 transition-colors text-[11px] font-medium"
              >
                Reset all filters
              </button>
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-[11px]"
              >
                <Filter size={12} />
                <span>{showMoreFilters ? 'Fewer Filters' : 'More Filters'}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    showMoreFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Table Controls Header: Total Leads Badge + Show Dropdown + View Toggle + Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Total Leads Badge */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <List size={14} />
              </div>
              <span className="font-bold text-slate-800 text-sm">Total Leads:</span>
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                {totalLeads.toLocaleString()}
              </span>
            </div>

            {/* Right: Per-Page, View Mode, Pagination */}
            <div className="flex items-center gap-3">
              {/* Show Per-Page Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Show:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200/90 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* View Toggle (List vs Grid) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Table list view"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid cards view"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              {/* Compact Quick Pagination in Header */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-2xs"
                >
                  <ChevronsLeft size={13} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-2xs"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-xs font-semibold px-2 text-slate-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-2xs"
                >
                  <ChevronRight size={13} />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-2xs"
                >
                  <ChevronsRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Data Container: Table or Grid */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Message ID</th>
                      <th className="py-3 px-3 whitespace-nowrap">Message Time</th>
                      <th className="py-3 px-3">Sender</th>
                      <th className="py-3 px-3">Type of Lead</th>
                      <th className="py-3 px-3">Property Type</th>
                      <th className="py-3 px-3 whitespace-nowrap">Beds/Baths</th>
                      <th className="py-3 px-3 min-w-[180px]">Area/City</th>
                      <th className="py-3 px-3">Budget</th>
                      <th className="py-3 px-3 min-w-[120px]">Name</th>
                      <th className="py-3 px-3 whitespace-nowrap">Phone</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3 min-w-[130px]">Call Appointment</th>
                      <th className="py-3 px-3 whitespace-nowrap">Lead By</th>
                      <th className="py-3 px-3 whitespace-nowrap">Lead For</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={16}
                          className="py-16 text-center text-slate-400 text-xs"
                        >
                          <RefreshCw
                            size={18}
                            className="animate-spin mx-auto text-blue-600 mb-2"
                          />
                          Loading leads data...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={16}
                          className="py-16 text-center text-slate-400 text-xs"
                        >
                          <AlertCircle
                            size={20}
                            className="mx-auto text-slate-300 mb-2"
                          />
                          No leads found matching current filters
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead, idx) => {
                        const rowNum = (page - 1) * perPage + idx + 1;
                        return (
                          <tr
                            key={lead.id}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                              {rowNum}
                            </td>
                            {/* Message ID with Copy */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[90px]" title={lead.message_id}>
                                  {lead.message_id ? `${lead.message_id.slice(0, 10)}...` : '-'}
                                </span>
                                {lead.message_id && (
                                  <button
                                    onClick={() => copyToClipboard(lead.message_id, `mid-${lead.id}`)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                                    title="Copy Message ID"
                                  >
                                    {copiedId === `mid-${lead.id}` ? (
                                      <Check size={11} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            {/* Message Time */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                              {formatDate(lead.message_time)}
                            </td>
                            {/* Sender */}
                            <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                              {lead.sender_name || '-'}
                            </td>
                            {/* Type of Lead */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <LeadTypeBadge type={lead.type_of_lead} />
                            </td>
                            {/* Property Type */}
                            <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                              {lead.type_of_property || '-'}
                            </td>
                            {/* Beds / Baths */}
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {lead.beds_baths || '-'}
                            </td>
                            {/* Area / City */}
                            <td className="py-2.5 px-3 text-slate-800 font-medium">
                              <div className="truncate max-w-[220px]" title={lead.area_city}>
                                {lead.area_city || '-'}
                              </div>
                            </td>
                            {/* Budget */}
                            <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              {lead.budget || '-'}
                            </td>
                            {/* Name */}
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {lead.name || '-'}
                            </td>
                            {/* Phone */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {lead.number ? (
                                <a
                                  href={`tel:${lead.number}`}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {lead.number}
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            {/* Email */}
                            <td className="py-2.5 px-3 text-slate-600">
                              <div className="truncate max-w-[140px]" title={lead.email}>
                                {lead.email || '-'}
                              </div>
                            </td>
                            {/* Call Appointment */}
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="truncate max-w-[140px]" title={lead.call_appointment_time}>
                                {lead.call_appointment_time || '-'}
                              </div>
                            </td>
                            {/* Lead By */}
                            <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                              {lead.lead_by || '-'}
                            </td>
                            {/* Lead For */}
                            <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                              {lead.lead_for || '-'}
                            </td>
                            {/* Actions View Button */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                              >
                                <Eye size={12} />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                  <RefreshCw size={18} className="animate-spin mx-auto text-blue-600 mb-2" />
                  Loading leads data...
                </div>
              ) : leads.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                  No leads found matching current filters
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{lead.name || 'Unnamed Lead'}</h4>
                        <p className="text-slate-400 text-xs mt-0.5">{formatDate(lead.message_time)}</p>
                      </div>
                      <LeadTypeBadge type={lead.type_of_lead} />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{lead.area_city || 'No address provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{lead.number || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={13} className="text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">Budget: {lead.budget || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home size={13} className="text-slate-400 shrink-0" />
                        <span>{lead.type_of_property || 'N/A'} • {lead.beds_baths || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">By: <strong className="text-slate-800">{lead.lead_by || '-'}</strong></span>
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs"
                      >
                        <Eye size={12} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Bottom Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <div>
              Showing{' '}
              <strong className="text-slate-800">
                {totalLeads === 0 ? 0 : (page - 1) * perPage + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(page * perPage, totalLeads)}
              </strong>{' '}
              of <strong className="text-slate-800">{totalLeads.toLocaleString()}</strong> leads
            </div>

            {/* Pagination Button List */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-2xs"
              >
                <ChevronLeft size={14} />
              </button>

              {getPaginationNumbers().map((num, i) =>
                num === '...' ? (
                  <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${num}`}
                    onClick={() => setPage(num)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                      page === num
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                        : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    {num}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-2xs"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-2xs">
                  <User size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedLead.name || 'Unnamed Lead'}
                    </h3>
                    <LeadTypeBadge type={selectedLead.type_of_lead} />
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 font-mono">
                    ID: {selectedLead.message_id || 'N/A'} • {formatDate(selectedLead.message_time)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Contact Information Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number:</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {selectedLead.number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLead.email || 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Address / Area / City:</span>
                    <span className="font-medium text-slate-800 text-xs">
                      {selectedLead.area_city || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property & Deal Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Property & Deal Details
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Property Type:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLead.type_of_property || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Beds / Baths:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLead.beds_baths || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Budget:</span>
                    <span className="font-bold text-blue-600 text-sm">
                      {selectedLead.budget || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cash / Finance:</span>
                    <span className="font-medium text-slate-800">
                      {selectedLead.cash_finance || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Under Contract:</span>
                    <span className="font-medium text-slate-800">
                      {selectedLead.under_contract || 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Willing to Sign:</span>
                    <span className="font-medium text-slate-800">
                      {selectedLead.willing_to_sign || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ISA Lead Team Information */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Team Assignment
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lead By (Cleaned):</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedLead.lead_by || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lead For:</span>
                    <span className="font-medium text-slate-800">
                      {selectedLead.lead_for || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sender Discord Name:</span>
                    <span className="font-medium text-slate-800">
                      {selectedLead.sender_name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call Appointment & Notes */}
              {(selectedLead.call_appointment_time || selectedLead.note) && (
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-2.5">
                  <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider">
                    Appointment & Notes
                  </h4>
                  {selectedLead.call_appointment_time && (
                    <div>
                      <span className="text-blue-500 block text-[11px] font-medium">
                        Call Appointment Time:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedLead.call_appointment_time}
                      </span>
                    </div>
                  )}
                  {selectedLead.note && (
                    <div>
                      <span className="text-blue-500 block text-[11px] font-medium">
                        Note:
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedLead.note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Small Access Denied Popup for Export (Requirement 1) */}
      {showExportDenied && (
        <div
          id="export-denied-popup"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] animate-fadeIn"
          onClick={() => setShowExportDenied(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#101A30] border border-amber-500/40 rounded-2xl p-5 w-full max-w-xs shadow-2xl shadow-black/80 text-center relative animate-scaleUp"
          >
            {/* Top Close Icon Button */}
            <button
              type="button"
              id="close-export-denied-x"
              onClick={() => setShowExportDenied(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>

            {/* Small Shield / Lock Badge */}
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/15">
              <Lock size={20} className="text-amber-400" />
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">
              Admin Only Operation
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed mb-4 px-1">
              Only admins can do that operation. Exporting leads to CSV is restricted to administrator accounts.
            </p>

            {/* Dismiss Button */}
            <button
              type="button"
              id="close-export-denied-btn"
              onClick={() => setShowExportDenied(false)}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-amber-600/25 active:scale-95 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

