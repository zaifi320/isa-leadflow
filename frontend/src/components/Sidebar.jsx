import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Users, CalendarCheck, RefreshCw,
  Settings, UserCog, Home, Lock, LogOut
} from 'lucide-react';
import { getLastSync, triggerSync } from '../api/dashboard';
import { format } from 'date-fns';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'leads', label: 'All Leads', icon: Users },
  { id: 'analytics', label: 'Call Analytics', icon: CalendarCheck },
  { id: 'sync', label: 'Data Sync History', icon: RefreshCw },
];

const bottomNavItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'users', label: 'User Management', icon: UserCog },
];

export default function Sidebar({ onRefresh, currentView = 'dashboard', onNavigate, currentUser, onLogout }) {
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const visibleNavItems = navItems.filter((item) => {
    // Data sync history section only shows to admins and completely hidden from others
    if (item.id === 'sync' && !isAdmin) return false;
    return true;
  });

  const [internalActive, setInternalActive] = useState('dashboard');
  const activeItem = currentView || internalActive;
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  useEffect(() => {
    fetchLastSync();
  }, []);

  const fetchLastSync = async () => {
    try {
      const res = await getLastSync();
      if (res.data) setLastSync(res.data);
      else setLastSync({ sync_time: new Date().toISOString() });
    } catch {
      setLastSync({ sync_time: new Date().toISOString() });
    }
  };

  const handleRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback('Syncing...');

    const safetyTimer = setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback('');
    }, 65000);

    try {
      const res = await triggerSync();
      clearTimeout(safetyTimer);

      if (res?.data?.success) {
        if (res.data.new_leads_added > 0) {
          setSyncFeedback(`+${res.data.new_leads_added} new leads!`);
        } else {
          setSyncFeedback('Up to date');
        }

        await fetchLastSync();

        if (onRefresh) onRefresh();

        setTimeout(() => {
          setIsSyncing(false);
          setSyncFeedback('');
        }, 1800);
      } else {
        setSyncFeedback('Sync failed');
        setTimeout(() => {
          setIsSyncing(false);
          setSyncFeedback('');
        }, 1800);
      }
    } catch (err) {
      clearTimeout(safetyTimer);
      console.error('Sync failed:', err);
      setSyncFeedback('Sync failed');
      setTimeout(() => {
        setIsSyncing(false);
        setSyncFeedback('');
      }, 1800);
    }
  };

  const syncDate = lastSync?.sync_time
    ? format(new Date(lastSync.sync_time), "MMM dd, yyyy '•' h:mm a")
    : 'Just now';

  return (
    <aside
      className="flex flex-col h-screen select-none shrink-0 relative overflow-hidden"
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'linear-gradient(180deg, #2248ce 0%, #1c3bb8 40%, #17329f 80%, #132785 100%)',
      }}
    >
      {/* Logo & Brand Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/35 via-blue-400/25 to-blue-600/40 border border-cyan-300/40 backdrop-blur-md flex items-center justify-center shadow-lg shadow-blue-950/40 shrink-0">
            <Home size={22} className="text-white drop-shadow-xs" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-base tracking-tight leading-tight">
              ISA LeadFlow
            </div>
            <div className="text-blue-200/85 text-[11px] leading-tight mt-1 font-normal">
              From Discord to Dashboard
            </div>
            <div className="text-blue-200/85 text-[11px] leading-tight font-normal">
              Analytics.
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setInternalActive(item.id);
                if (onNavigate) onNavigate(item.id);
              }}
              className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-medium transition-all cursor-pointer group ${
                isActive
                  ? 'bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold shadow-xs'
                  : 'text-blue-100/85 hover:text-white hover:bg-white/10'
              }`}
            >
              {isActive && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-full shadow-xs" />
              )}
              <Icon
                size={18}
                className={isActive ? 'text-white' : 'text-blue-200/80 group-hover:text-white'}
                strokeWidth={2}
              />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}

        <div className="py-1.5 px-2">
          <div className="border-t border-white/15" />
        </div>

        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setInternalActive(item.id);
                if (onNavigate) onNavigate(item.id);
              }}
              className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-medium transition-all cursor-pointer group ${
                isActive
                  ? 'bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold shadow-xs'
                  : 'text-blue-100/85 hover:text-white hover:bg-white/10'
              }`}
            >
              {isActive && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-full shadow-xs" />
              )}
              <Icon
                size={18}
                className={isActive ? 'text-white' : 'text-blue-200/80 group-hover:text-white'}
                strokeWidth={2}
              />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
              {item.id === 'users' && (
                currentUser?.role?.toLowerCase() === 'admin' ? (
                  <span className="ml-auto flex items-center gap-1 text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    Live
                  </span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-[10px] bg-white/15 text-blue-100 border border-white/20 px-2 py-0.5 rounded-full font-medium" title="Administrator access required">
                    <Lock size={10} className="text-amber-300" />
                    Admin
                  </span>
                )
              )}
            </button>
          );
        })}

        {/* Sign Out Button */}
        <button
          onClick={() => {
            if (onLogout) onLogout();
          }}
          className="relative w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-medium text-blue-200/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer mt-1 group"
        >
          <LogOut size={18} className="text-blue-200/75 group-hover:text-rose-300 transition-colors" />
          <span className="text-sm font-medium tracking-wide">Sign Out</span>
        </button>
      </nav>

      {/* Bottom Section */}
      <div className="px-3.5 pb-4 pt-1">
        <div className="text-blue-200/70 text-[11px] font-medium text-center mb-2 tracking-wider">
          {currentUser?.role ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase()) : 'User'}
        </div>

        {/* Last Sync Card */}
        <div className="bg-white/12 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 shrink-0"></span>
              <span className="text-white text-xs font-semibold tracking-wide">Last Sync</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className={`text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-all cursor-pointer ${
                isSyncing ? 'animate-spin text-cyan-200' : ''
              }`}
              title="Click to sync with Google Sheets now"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="text-blue-200/80 text-[11px] pl-5 mt-0.5">
            {syncFeedback ? (
              <span className="text-cyan-200 font-semibold animate-pulse">{syncFeedback}</span>
            ) : (
              syncDate
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
