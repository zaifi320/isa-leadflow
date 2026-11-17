import { useState } from 'react';
import { Calendar, ChevronDown, BarChart2, Menu } from 'lucide-react';
import { userLogout } from '../api/dashboard';

const dateRangeOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Date Range' },
];

export default function Header({
  dateRange,
  onDateRangeChange,
  currentUser,
  onLogout,
  onOpenMobileMenu,
  title = "Dashboard",
  subtitle = "Overview of ISA LeadFlow leads and performance"
}) {
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      {/* Page Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Open menu"
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
        )}

        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
          <BarChart2 size={22} className="text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">
            {title}
          </h1>
          <p className="text-slate-500 text-[11px] sm:text-xs font-normal mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto shrink-0">
        {/* Date Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <Calendar size={14} className="text-slate-500" />
            <span className="truncate max-w-[110px] sm:max-w-none">{selectedLabel}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onDateRangeChange(opt.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
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
            className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <div
              style={{ backgroundColor: avatarBg }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
            >
              {userInitials}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-800 truncate max-w-[120px]">
              {userName}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {userDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 overflow-hidden text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-800 truncate">{userName}</div>
                <div className="text-slate-400 text-[10px] truncate">{userRole}</div>
              </div>
              <button
                onClick={async () => {
                  setUserDropdownOpen(false);
                  if (onLogout) {
                    await onLogout();
                  } else {
                    await userLogout({ user_id: currentUser?.id || 1, email: currentUser?.email || 'huzaifa@isaleads.com' });
                  }
                }}
                className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer flex items-center gap-2"
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
