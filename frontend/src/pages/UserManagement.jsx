import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import {
  Users, UserCheck, ShieldCheck, Clock, Wifi, WifiOff,
  Search, Filter, RefreshCw, AlertCircle, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Eye, LogOut,
  Activity, Globe, Laptop, ArrowUpRight, ShieldAlert,
  Info, Sparkles, Check, X, UserPlus, Trash2, Lock, ArrowLeft, Menu
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  getUsers,
  createUser,
  deleteUser,
  getUserSummary,
  sendHeartbeat,
  userLogout,
  getUserActivityLogs
} from '../api/dashboard';

// Styling for Neon Glassmorphism KPI cards (Style 1: Dark mode on hover)
const DARK_KPI_MAP = {
  emerald: {
    bgClass: 'from-slate-900 via-slate-900 to-emerald-950',
    borderClass: 'border-emerald-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(16, 185, 129, 0.35)',
    iconBg: '#10b981',
    iconColor: '#ffffff',
  },
  blue: {
    bgClass: 'from-slate-900 via-slate-900 to-blue-950',
    borderClass: 'border-blue-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(37, 99, 235, 0.35)',
    iconBg: '#2563eb',
    iconColor: '#ffffff',
  },
  slate: {
    bgClass: 'from-slate-900 via-slate-900 to-slate-800',
    borderClass: 'border-slate-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(148, 163, 184, 0.35)',
    iconBg: '#64748b',
    iconColor: '#ffffff',
  },
  purple: {
    bgClass: 'from-slate-900 via-slate-900 to-purple-950',
    borderClass: 'border-purple-500/50',
    shadowGlow: '0 16px 30px -6px rgba(15, 23, 42, 0.55), 0 0 22px -2px rgba(139, 92, 246, 0.35)',
    iconBg: '#8b5cf6',
    iconColor: '#ffffff',
  },
};

function UserKPICard({
  title,
  value,
  subtext,
  badgeText,
  badgeType = 'default',
  icon: Icon,
  variant = 'blue'
}) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = DARK_KPI_MAP[variant] || DARK_KPI_MAP.blue;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={isHovered ? { boxShadow: theme.shadowGlow } : undefined}
      className={`group relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 transform-gpu ${isHovered
        ? `bg-gradient-to-br ${theme.bgClass} ${theme.borderClass} -translate-y-1`
        : 'bg-white border-slate-200/80 hover:shadow-lg shadow-sm'
        }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${isHovered ? 'text-slate-300' : 'text-slate-500'
              }`}
          >
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight transition-colors duration-200 ${isHovered ? 'text-white' : 'text-slate-900'
                }`}
            >
              {value}
            </span>
            {badgeText && (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeType === 'online'
                  ? isHovered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : badgeType === 'offline'
                    ? isHovered
                      ? 'bg-slate-700 text-slate-300 border border-slate-600'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                    : isHovered
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
              >
                {badgeType === 'online' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
                {badgeType === 'offline' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                )}
                {badgeText}
              </span>
            )}
          </div>
          <p
            className={`mt-1.5 text-xs transition-colors duration-200 ${isHovered ? 'text-slate-400' : 'text-slate-500'
              }`}
          >
            {subtext}
          </p>
        </div>

        <div
          style={{
            backgroundColor: isHovered ? theme.iconBg : undefined,
            color: isHovered ? theme.iconColor : undefined,
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${!isHovered
            ? variant === 'emerald'
              ? 'bg-emerald-50 text-emerald-600'
              : variant === 'blue'
                ? 'bg-blue-50 text-blue-600'
                : variant === 'purple'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-slate-100 text-slate-600'
            : 'shadow-md shadow-black/30'
            }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function UserManagement({
  currentView = 'users',
  onNavigate,
  currentUser = { id: 1, name: 'Huzaifa Saeed', role: 'Admin', email: 'huzaifa@isaleads.com' },
  onUserChange,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'activity'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total_users: 8,
    online_users: 1,
    offline_users: 7,
    active_today: 6,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'online' | 'offline'

  // Activity Log states (Admin only)
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityAction, setActivityAction] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');

  // Selected User Modal
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: 'Lead@2026',
    role: 'Agent',
    department: 'ISA Sales Team',
    avatar_color: '#2563eb',
  });
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Delete User Modal State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Handle Add User Submit
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError('');

    if (!newUserData.name.trim()) {
      setAddUserError('User name is required.');
      return;
    }
    if (!newUserData.email.trim() || !newUserData.email.includes('@')) {
      setAddUserError('Please enter a valid email address.');
      return;
    }

    setAddUserSubmitting(true);
    try {
      await createUser(newUserData);
      setShowAddUserModal(false);
      setNewUserData({
        name: '',
        email: '',
        password: 'Lead@2026',
        role: 'Agent',
        department: 'ISA Sales Team',
        avatar_color: '#2563eb',
      });
      await loadData(false);
      if (activeTab === 'activity') loadActivityLogs();
    } catch (err) {
      console.error('Failed to create user:', err);
      setAddUserError(err.response?.data?.detail || 'Failed to create user. Please try again.');
    } finally {
      setAddUserSubmitting(false);
    }
  };

  // Handle Delete User Confirm
  const handleDeleteUserConfirm = async () => {
    if (!deleteConfirmUser) return;
    setDeleteSubmitting(true);
    setDeleteError('');
    try {
      await deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      await loadData(false);
      if (activeTab === 'activity') loadActivityLogs();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setDeleteError(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Determine if logged-in user is actually an Administrator
  const isActualAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const [simulatedRole, setSimulatedRole] = useState(currentUser?.role || 'Admin');

  useEffect(() => {
    if (currentUser?.role) {
      setSimulatedRole(currentUser.role);
    }
  }, [currentUser]);

  // Non-admins are strictly blocked from User Management
  const isAdmin = isActualAdmin ? simulatedRole.toLowerCase() === 'admin' : false;

  // Load user directory and summary (Admin only)
  const loadData = async (silent = false) => {
    if (!isAdmin) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setRefreshing(true);
    try {
      const [usersRes, summaryRes] = await Promise.all([
        getUsers({
          search: searchQuery || undefined,
          role: selectedRole !== 'all' ? selectedRole : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          requester_role: simulatedRole,
        }),
        getUserSummary({ requester_role: simulatedRole }),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (summaryRes.data) setSummary(summaryRes.data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load Admin Activity Logs
  const loadActivityLogs = async () => {
    if (!isAdmin) return;
    setActivityLoading(true);
    try {
      const res = await getUserActivityLogs({
        user_role: simulatedRole,
        page: activityPage,
        limit: 10,
        search: activitySearch || undefined,
        action: activityAction !== 'all' ? activityAction : undefined,
      });
      if (res.data) {
        setActivityLogs(res.data.items || []);
        setActivityTotalPages(res.data.total_pages || 1);
        setActivityTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error loading activity logs:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  // Initial fetch and auto-refresh polling every 6 seconds (Admin only)
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAdmin, searchQuery, selectedRole, selectedStatus]);

  useEffect(() => {
    if (isAdmin && activeTab === 'activity') {
      loadActivityLogs();
    }
  }, [isAdmin, activeTab, activityPage, activityAction, activitySearch, simulatedRole]);

  // Simulate logging out currentUser or another user
  const handleUserLogoutAction = async (targetUser) => {
    try {
      await userLogout({ user_id: targetUser.id, email: targetUser.email });
      await loadData(true);
      if (activeTab === 'activity') loadActivityLogs();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Simulate immediate heartbeat ping for testing
  const handleSendHeartbeatTest = async (targetUser) => {
    try {
      await sendHeartbeat({
        user_id: targetUser.id,
        email: targetUser.email,
        current_page: '/dashboard',
      });
      await loadData(true);
      if (activeTab === 'activity') loadActivityLogs();
    } catch (err) {
      console.error('Heartbeat test error:', err);
    }
  };

  // Format date helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
    try {
      const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
      return format(d, 'MMM dd, yyyy • h:mm a');
    } catch {
      return dateStr;
    }
  };

  // Format relative time helper
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Offline';
    try {
      const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Offline';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-800">
      {/* Sidebar (Desktop Permanent + Mobile Slide-out Drawer) */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        onRefresh={() => loadData(false)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3 sm:py-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAdmin ? 'bg-blue-600/10 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              {isAdmin ? <Users size={22} /> : <ShieldAlert size={22} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  User Management
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Heartbeat
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                    <Lock size={12} className="text-rose-600" />
                    Admin Restricted
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {isAdmin
                  ? 'Real-time user presence & heartbeat tracking'
                  : 'Restricted area. Administrator authorization required.'}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto shrink-0">
            {/* Role switch pill for demo/testing admin permissions (only visible if logged in user is actually Admin) */}
            {isActualAdmin && (
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200/80 text-xs">
                <span className="text-slate-500 px-2 font-medium">Viewing as:</span>
                <button
                  id="simulate-admin-btn"
                  onClick={() => setSimulatedRole('Admin')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${simulatedRole === 'Admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Admin
                </button>
                <button
                  id="simulate-agent-btn"
                  onClick={() => setSimulatedRole('Agent')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${simulatedRole === 'Agent'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Agent
                </button>
              </div>
            )}

            {/* If Admin: show Add User & Refresh */}
            {isAdmin ? (
              <>
                {/* Add User Button */}
                <button
                  onClick={() => {
                    setNewUserData({
                      name: '',
                      email: '',
                      password: 'Lead@2026',
                      role: 'Agent',
                      department: 'ISA Sales Team',
                      avatar_color: '#2563eb',
                    });
                    setAddUserError('');
                    setShowAddUserModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <UserPlus size={15} />
                  <span>Add User</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={() => loadData(false)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw
                    size={14}
                    className={`text-slate-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`}
                  />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </>
            ) : (
              /* If Not Admin: Return to Dashboard button */
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
              >
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>
            )}

            {/* Current User Pill & Sign Out Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm">
                <div
                  style={{ backgroundColor: currentUser?.avatar_color || '#2563eb' }}
                  className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center"
                >
                  {(currentUser?.name || 'Huzaifa Saeed').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight">
                    {currentUser?.name || 'Huzaifa Saeed'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser?.role === 'Admin' ? 'Administrator' : (currentUser?.role || 'Sales Agent')}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out of ISA LeadFlow"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-slate-200/80 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Body Container: If Not Admin, render Access Denied Screen */}
        {!isAdmin ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-80px)]">
            <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/60 p-8 sm:p-10 text-center relative overflow-hidden animate-fadeIn">
              {/* Background gradient decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-b from-rose-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Icon Container with double security badge */}
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200/80 flex items-center justify-center shadow-lg shadow-rose-500/15 mb-6">
                <ShieldAlert size={42} className="text-rose-600" />
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
                  <Lock size={13} />
                </span>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-rose-50 text-rose-700 border border-rose-200 mb-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Access Denied • Administrator Only</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2.5">
                You Don't Have Access
              </h2>

              {/* Explanation */}
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6">
                The <strong>User Management</strong> section is restricted to <strong>Administrator</strong> accounts. Your current profile does not have permission to view team presence, modify accounts, or view activity logs.
              </p>

              {/* Session Identity Card */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-left mb-6 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Signed In As
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: currentUser?.avatar_color || '#2563eb' }}
                      className="w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-sm"
                    >
                      {(currentUser?.name || 'User')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {currentUser?.name || 'Sales Agent'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentUser?.email || 'agent@isaleads.com'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock size={11} className="text-amber-600" />
                      {currentUser?.role || simulatedRole} Role
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Portal Privileges:</span>
                  <span className="font-semibold text-rose-600 flex items-center gap-1">
                    <X size={13} className="stroke-[2.5]" /> User Directory Blocked
                  </span>
                </div>
              </div>

              {/* Contact Admin Notice */}
              <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl p-3.5 text-left mb-6">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  Need to manage team members or access this page? Please contact at{' '}
                  <span className="font-mono text-blue-700 font-medium">huzaifa.bin.saeed5@gmail.com</span> to request administrative privileges.
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate && onNavigate('dashboard')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Return to Dashboard</span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('leads')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  <span>View All Leads</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Admin User Management Screen */
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Informational Banner */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <Wifi size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Presence Architecture</span>
                    <span className="text-[10px] font-medium bg-white/80 border border-blue-200 px-2 py-0.5 rounded-full text-blue-700">
                      Neon PostgreSQL Live Synced
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Heartbeats are sent automatically every <strong>30 seconds</strong>. A user is considered <strong>Offline</strong> if no heartbeat is received for <strong>90 seconds</strong> (browser closed or disconnected).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"></span>
                  <span className="text-slate-800 font-bold">Online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="text-slate-500">Offline</span>
                </div>
              </div>
            </div>

            {/* 4 Summary Cards (KPI Cards with Neon Dark Hover) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <UserKPICard
                title="Currently Online"
                value={summary.online_users}
                subtext="Active heartbeat received within 90s"
                badgeText="Live Now"
                badgeType="online"
                icon={Wifi}
                variant="emerald"
              />
              <UserKPICard
                title="Total Team Members"
                value={summary.total_users}
                subtext="Registered portal user accounts"
                badgeText={`${summary.total_users} Users`}
                icon={Users}
                variant="blue"
              />
              <UserKPICard
                title="Offline Users"
                value={summary.offline_users}
                subtext="No active heartbeat session"
                badgeText="Offline"
                badgeType="offline"
                icon={WifiOff}
                variant="slate"
              />
              <UserKPICard
                title="Active Today"
                value={summary.active_today}
                subtext="Logged in or active during today"
                badgeText="Today"
                icon={Activity}
                variant="purple"
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'directory'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Users size={17} />
                  <span>Team Members & Status</span>
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {users.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <ShieldCheck size={17} />
                  <span>Complete Activity Audit Log</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Admin Only
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-400 pb-2">
                Auto-syncs every 6s • Last updated: {format(lastRefreshedAt, 'h:mm:ss a')}
              </div>
            </div>

            {/* TAB 1: User Directory & Status Table */}
            {activeTab === 'directory' && (
              <div className="space-y-4">
                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[240px]">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or department..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Pills */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
                      <button
                        onClick={() => setSelectedStatus('all')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === 'all'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        All ({summary.total_users})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('online')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === 'online'
                          ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-emerald-600'
                          }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Online ({summary.online_users})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('offline')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === 'offline'
                          ? 'bg-white text-slate-800 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        Offline ({summary.offline_users})
                      </button>
                    </div>

                    {/* Role Filter */}
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Agent">Agent</option>
                    </select>

                    {/* Add User Table Action Button */}
                    <button
                      onClick={() => {
                        setNewUserData({
                          name: '',
                          email: '',
                          password: 'Lead@2026',
                          role: 'Agent',
                          department: 'ISA Sales Team',
                          avatar_color: '#2563eb',
                        });
                        setAddUserError('');
                        setShowAddUserModal(true);
                      }}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2 text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all ml-1"
                    >
                      <UserPlus size={14} />
                      <span>Add User</span>
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-3.5 px-5">User</th>
                          <th className="py-3.5 px-5">Role & Department</th>
                          <th className="py-3.5 px-5">Online Status</th>
                          <th className="py-3.5 px-5">Last Activity / Seen</th>
                          <th className="py-3.5 px-5">Session Info</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-12 text-slate-400">
                              <Users size={32} className="mx-auto mb-2 text-slate-300" />
                              No users found matching current filters.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => {
                            const isOnline = user.is_online;
                            const initials = user.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();

                            return (
                              <tr
                                key={user.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                {/* User Info */}
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    {/* Avatar with status dot badge */}
                                    <div className="relative">
                                      <div
                                        style={{ backgroundColor: user.avatar_color || '#2563eb' }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                                      >
                                        {initials}
                                      </div>
                                      <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-400'
                                          }`}
                                      />
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                        <span>{user.name}</span>
                                        {user.id === currentUser.id && (
                                          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-slate-400 text-[11px] font-normal">
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Role & Department */}
                                <td className="py-3.5 px-5">
                                  <div className="space-y-1">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'Admin'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : user.role === 'Manager'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}
                                    >
                                      {user.role}
                                    </span>
                                    <div className="text-slate-500 text-[11px]">
                                      {user.department}
                                    </div>
                                  </div>
                                </td>

                                {/* Online / Offline Status */}
                                <td className="py-3.5 px-5">
                                  {isOnline ? (
                                    <div className="flex items-center gap-2">
                                      {/* Green Pulsing Dot (Requirement 3) */}
                                      <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                      </span>
                                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                                        Online
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        ({user.seconds_since_heartbeat !== null ? `${user.seconds_since_heartbeat}s ago` : 'now'})
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      {/* Grey Dot (Requirement 3) */}
                                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                                      <span className="font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
                                        Offline
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Last Activity / Seen (Requirement 10) */}
                                <td className="py-3.5 px-5">
                                  {isOnline ? (
                                    <div>
                                      <div className="font-semibold text-emerald-700 flex items-center gap-1">
                                        <Activity size={12} className="text-emerald-500" />
                                        <span>Active now</span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5">
                                        Heartbeat every 30s
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {/* Exact last seen date and time */}
                                      <div className="font-semibold text-slate-700">
                                        {user.last_seen
                                          ? formatDateTime(user.last_seen)
                                          : user.last_heartbeat
                                            ? formatDateTime(user.last_heartbeat)
                                            : 'Not recorded'}
                                      </div>
                                      {/* Relative time */}
                                      <div className="text-[11px] text-slate-400 mt-0.5">
                                        {user.last_seen || user.last_heartbeat
                                          ? formatRelativeTime(user.last_seen || user.last_heartbeat)
                                          : 'No session'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Session Info */}
                                <td className="py-3.5 px-5">
                                  <div className="space-y-0.5">
                                    <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                                      <Laptop size={12} className="text-slate-400" />
                                      <span>
                                        {user.last_active_page
                                          ? `Page: ${user.last_active_page}`
                                          : 'Standard Session'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Login: {user.last_login ? formatDateTime(user.last_login) : 'Today'}
                                    </div>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedUserModal(user)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="View User Details"
                                    >
                                      <Eye size={15} />
                                    </button>

                                    {/* Quick Session Ping / Logout Test */}
                                    {isOnline ? (
                                      <button
                                        onClick={() => handleUserLogoutAction(user)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                        title="Simulate User Logout"
                                      >
                                        <LogOut size={12} />
                                        <span>Log out</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleSendHeartbeatTest(user)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                        title="Simulate Active Session Ping"
                                      >
                                        <Wifi size={12} />
                                        <span>Ping</span>
                                      </button>
                                    )}

                                    {/* Delete User */}
                                    {user.id === 1 ? (
                                      <button
                                        disabled
                                        className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                                        title="Primary Admin account cannot be deleted"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setDeleteError('');
                                          setDeleteConfirmUser(user);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        title={`Delete ${user.name}`}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="bg-slate-50/70 border-t border-slate-200/80 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      Showing <strong>{users.length}</strong> of <strong>{summary.total_users}</strong> total users
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <strong>{summary.online_users}</strong> Online
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <strong>{summary.offline_users}</strong> Offline
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Complete Activity Audit Log (ADMIN ONLY) */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {simulatedRole !== 'Admin' ? (
                  /* Non-admin access restriction message per user prompt */
                  <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                      <ShieldAlert size={28} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Administrator Access Required
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
                      "Only Admin should be able to see the complete user activity list."
                      Your current role is set to <strong>{simulatedRole}</strong>.
                    </p>
                    <div className="mt-5">
                      <button
                        onClick={() => setSimulatedRole('Admin')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
                      >
                        Switch to Administrator View
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Admin View of Complete Activity Logs */
                  <div className="space-y-4">
                    {/* Filters for Activity Log */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={activitySearch}
                          onChange={(e) => {
                            setActivitySearch(e.target.value);
                            setActivityPage(1);
                          }}
                          placeholder="Search logs by user name, action, or IP..."
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={activityAction}
                          onChange={(e) => {
                            setActivityAction(e.target.value);
                            setActivityPage(1);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">All Actions</option>
                          <option value="ONLINE">ONLINE</option>
                          <option value="LOGOUT">LOGOUT</option>
                          <option value="TIMEOUT">TIMEOUT</option>
                          <option value="DISCONNECT">DISCONNECT</option>
                          <option value="LOGIN">LOGIN</option>
                        </select>

                        <button
                          onClick={loadActivityLogs}
                          disabled={activityLoading}
                          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                          title="Reload logs"
                        >
                          <RefreshCw size={14} className={activityLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Audit Logs Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                              <th className="py-3.5 px-5">Timestamp</th>
                              <th className="py-3.5 px-5">User</th>
                              <th className="py-3.5 px-5">Action</th>
                              <th className="py-3.5 px-5">Details</th>
                              <th className="py-3.5 px-5">IP Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activityLogs.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="text-center py-12 text-slate-400">
                                  <Activity size={32} className="mx-auto mb-2 text-slate-300" />
                                  No activity records found.
                                </td>
                              </tr>
                            ) : (
                              activityLogs.map((log) => {
                                const actionColor =
                                  log.action === 'ONLINE' || log.action === 'LOGIN'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : log.action === 'LOGOUT'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : log.action === 'TIMEOUT'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200';

                                return (
                                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3.5 px-5 text-slate-600 font-medium whitespace-nowrap">
                                      {formatDateTime(log.created_at)}
                                    </td>
                                    <td className="py-3.5 px-5 font-bold text-slate-900">
                                      {log.user_name}
                                    </td>
                                    <td className="py-3.5 px-5">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${actionColor}`}
                                      >
                                        {log.action}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-slate-600 max-w-md truncate">
                                      {log.details || '—'}
                                    </td>
                                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                                      {log.ip_address || '127.0.0.1'}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="bg-slate-50/70 border-t border-slate-200/80 px-6 py-3 flex items-center justify-between text-xs text-slate-600">
                        <div>
                          Total <strong>{activityTotal}</strong> audit records
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={activityPage <= 1}
                            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span>
                            Page <strong>{activityPage}</strong> of <strong>{activityTotalPages}</strong>
                          </span>
                          <button
                            disabled={activityPage >= activityTotalPages}
                            onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {isAdmin && selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: selectedUserModal.avatar_color || '#2563eb' }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                >
                  {selectedUserModal.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedUserModal.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUserModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Current Status</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${selectedUserModal.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                    />
                    <span className="font-bold text-slate-800">
                      {selectedUserModal.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Role & Dept</div>
                  <div className="mt-1 font-bold text-slate-800">
                    {selectedUserModal.role} • {selectedUserModal.department}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Last Seen Date & Time:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserModal.last_seen
                      ? formatDateTime(selectedUserModal.last_seen)
                      : 'Active now'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Last Heartbeat:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserModal.last_heartbeat
                      ? formatDateTime(selectedUserModal.last_heartbeat)
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Current Session Page:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserModal.last_active_page || '/dashboard'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Account Created:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(selectedUserModal.created_at || new Date())}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUserModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAdmin && showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Team Member</h3>
                  <p className="text-xs text-slate-500">Create a new user account with presence tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 text-xs">
              {addUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{addUserError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Robert Taylor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. robert.t@isaleads.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Initial Password
                  </label>
                  <span className="text-[10px] text-slate-400">Default: Lead@2026</span>
                </div>
                <input
                  type="text"
                  value={newUserData.password || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Lead@2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  The user will enter this password on the ISA LeadFlow login page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newUserData.department}
                    onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="ISA Sales Team">ISA Sales Team</option>
                    <option value="Client Acquisition">Client Acquisition</option>
                    <option value="Executive / Leadership">Executive / Leadership</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Avatar Color</label>
                <div className="flex items-center gap-2.5">
                  {['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, avatar_color: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${newUserData.avatar_color === c
                        ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm'
                        : 'opacity-80 hover:opacity-100'
                        }`}
                    >
                      {newUserData.avatar_color === c && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addUserSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Add User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {isAdmin && deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5 border border-rose-100">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Delete Team Member</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5 mt-3">
                This user will be permanently removed from Neon PostgreSQL and their session logs will be unlinked.
              </p>

              {deleteError && (
                <div className="mt-3 p-2 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-[11px]">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 text-xs">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteUserConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

