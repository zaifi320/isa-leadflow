import { useState } from 'react';
import { Calendar, ChevronDown, BarChart2 } from 'lucide-react';
import { userLogout } from '../api/dashboard';

const dateRangeOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Date Range' },
];

export default function Header({ dateRange, onDateRangeChange, currentUser, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userName = currentUser?.name || 'Huzaifa Saeed';
  const userRole = currentUser?.role || 'Administrator';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const avatarBg = currentUser?.avatar_color || '#2563eb';

  const selectedLabel = dateRangeOptions.find(o => o.value === dateRange)?.label || 'Last 30 Days';

  return (
    <div className="flex items-center justify-between pb-1">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
          <BarChart2 size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">Dashboard</h1>
          <p className="text-slate-500 text-xs font-normal mt-0.5">Overview of ISA LeadFlow leads and performance</p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Date Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Calendar size={14} className="text-slate-500" />
            <span>{selectedLabel}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onDateRangeChange(opt.value);
                    setDropdownOpen(false);
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

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all shadow-sm"
          >
            <div
              style={{ backgroundColor: avatarBg }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
            >
              {userInitials}
            </div>
            <span className="text-xs font-semibold text-slate-800">{userName}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {userDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-800">{userName}</div>
                <div className="text-slate-400 text-[10px]">{userRole}</div>
              </div>
              <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50">Profile Settings</button>
              <button className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50">User Preferences</button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={async () => {
                  setUserDropdownOpen(false);
                  if (onLogout) {
                    await onLogout();
                  } else {
                    await userLogout({ user_id: currentUser?.id || 1, email: currentUser?.email || 'huzaifa@isaleads.com' });
                  }
                }}
                className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
