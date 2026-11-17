import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import KPICard from '../components/KPICard.jsx';
import DailyTrendChart from '../components/DailyTrendChart.jsx';
import LeadsByTypeChart from '../components/LeadsByTypeChart.jsx';
import LeadsByPropertyChart from '../components/LeadsByPropertyChart.jsx';
import LeadsByStateChart from '../components/LeadsByStateChart.jsx';
import TopLeadByChart from '../components/TopLeadByChart.jsx';
import RecentLeadsTable from '../components/RecentLeadsTable.jsx';
import EmployeeTrendChart from '../components/EmployeeTrendChart.jsx';
import StateLeadsTable from '../components/StateLeadsTable.jsx';
import { Users, Home, User, Calendar, Phone, AlertCircle } from 'lucide-react';
import { getKPIs, clearClientCache } from '../api/dashboard';

const INITIAL_KPIS = [
  {
    id: 'total',
    title: 'Total Leads',
    value: 487,
    icon: Users,
    change: '+12%',
    changeType: 'up',
    color: '#2563eb',
    bgColor: '#dbeafe',
    cardBg: 'from-white to-blue-50/40',
    borderColor: 'border-blue-100/70',
    strokePath: 'M 0 24 C 25 32, 45 10, 70 18 C 95 26, 115 8, 140 18 C 160 26, 175 14, 190 20',
  },
  {
    id: 'seller',
    title: 'Seller Leads',
    value: 245,
    icon: Home,
    change: '+10%',
    changeType: 'up',
    color: '#10b981',
    bgColor: '#d1fae5',
    cardBg: 'from-white to-emerald-50/40',
    borderColor: 'border-emerald-100/70',
    strokePath: 'M 0 20 C 30 10, 50 28, 80 16 C 110 8, 130 26, 155 14 C 170 20, 180 12, 190 18',
  },
  {
    id: 'buyer',
    title: 'Buyer Leads',
    value: 242,
    icon: User,
    change: '+14%',
    changeType: 'up',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    cardBg: 'from-white to-purple-50/40',
    borderColor: 'border-purple-100/70',
    strokePath: 'M 0 24 C 20 12, 45 28, 75 14 C 105 22, 125 10, 150 22 C 170 16, 180 24, 190 16',
  },
  {
    id: 'today',
    title: "Today's Leads",
    value: 20,
    icon: Calendar,
    change: '+5%',
    changeType: 'up',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    cardBg: 'from-white to-amber-50/40',
    borderColor: 'border-amber-100/70',
    strokePath: 'M 0 18 C 30 26, 55 12, 85 24 C 115 16, 135 28, 160 14 C 175 22, 185 18, 190 20',
  },
  {
    id: 'with_phone',
    title: 'Leads With Phone',
    value: 450,
    icon: Phone,
    change: '+8%',
    changeType: 'up',
    color: '#06b6d4',
    bgColor: '#cffafe',
    cardBg: 'from-white to-cyan-50/40',
    borderColor: 'border-cyan-100/70',
    strokePath: 'M 0 22 C 25 12, 50 26, 80 14 C 110 24, 135 12, 160 22 C 175 16, 185 24, 190 18',
  },
  {
    id: 'missing',
    title: 'Missing Contact',
    value: 37,
    icon: AlertCircle,
    change: '-3%',
    changeType: 'down',
    color: '#ef4444',
    bgColor: '#fee2e2',
    cardBg: 'from-white to-rose-50/40',
    borderColor: 'border-rose-100/70',
    strokePath: 'M 0 16 C 25 24, 50 14, 80 26 C 110 16, 135 28, 160 18 C 175 24, 185 16, 190 22',
  },
];

export default function Dashboard({ currentView = 'dashboard', onNavigate, currentUser, onLogout }) {
  const [dateRange, setDateRange] = useState('30d');
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchKPIs();
  }, [dateRange]);

  const fetchKPIs = async () => {
    setLoadingKpis(true);
    try {
      const res = await getKPIs({ range: dateRange });
      if (res.data) {
        const d = res.data;
        setKpis([
          { ...INITIAL_KPIS[0], value: d.total_leads ?? 487 },
          { ...INITIAL_KPIS[1], value: d.seller_leads ?? 245 },
          { ...INITIAL_KPIS[2], value: d.buyer_leads ?? 242 },
          { ...INITIAL_KPIS[3], value: d.todays_leads ?? 20 },
          { ...INITIAL_KPIS[4], value: d.leads_with_phone ?? 450 },
          { ...INITIAL_KPIS[5], value: d.missing_contact ?? 37 },
        ]);
      }
    } catch (err) {
      console.warn('KPIs fetch failed, preserving current data:', err);
    } finally {
      setLoadingKpis(false);
    }
  };

  const handleRefresh = () => {
    clearClientCache();
    setRefreshKey((k) => k + 1);
    fetchKPIs();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fc] text-slate-800 font-sans antialiased">
      {/* Sidebar (Desktop Permanent + Mobile Slide-out Drawer) */}
      <Sidebar
        onRefresh={handleRefresh}
        currentView={currentView}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-3.5 sm:p-5 lg:p-6 max-w-[1600px] mx-auto space-y-4">
          {/* Header */}
          <Header
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            currentUser={currentUser}
            onLogout={onLogout}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* Row 1: KPI Cards (2 cols on mobile phone portrait, 3 on tablet, 6 on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {kpis.map((card) => (
              <KPICard key={card.id} {...card} />
            ))}
          </div>

          {/* Row 2: Daily Overall Trend (col-span-5) + Leads by State Table (col-span-4) */}
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-4">
            <div className="col-span-1 lg:col-span-5 min-h-[300px]">
              <DailyTrendChart dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
            <div className="col-span-1 lg:col-span-4 min-h-[300px]">
              <StateLeadsTable refreshTrigger={refreshKey} />
            </div>
          </div>

          {/* Row 3: Individual Employee Trend + Leads by Type + Leads by Property Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-4">
            <div className="col-span-1 sm:col-span-2 lg:col-span-5 min-h-[300px]">
              <EmployeeTrendChart dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
            <div className="col-span-1 lg:col-span-2 min-h-[300px]">
              <LeadsByTypeChart dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
            <div className="col-span-1 lg:col-span-2 min-h-[300px]">
              <LeadsByPropertyChart dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
          </div>

          {/* Row 4: Leads by State + Top Lead By + Recent Leads Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-4 pb-4">
            <div className="col-span-1 lg:col-span-3 min-h-[270px]">
              <LeadsByStateChart dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
            <div className="col-span-1 lg:col-span-3 min-h-[270px]">
              <TopLeadByChart dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 min-h-[270px]">
              <RecentLeadsTable dateRange={dateRange} refreshTrigger={refreshKey} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
