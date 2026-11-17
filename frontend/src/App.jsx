import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import AllLeads from './pages/AllLeads.jsx';
import CallAnalytics from './pages/CallAnalytics.jsx';
import DataSyncHistory from './pages/DataSyncHistory.jsx';
import UserManagement from './pages/UserManagement.jsx';
import Login from './pages/Login.jsx';
import { sendHeartbeat, sendBeaconOffline, userLogout } from './api/dashboard';
import { LogOut, RefreshCw } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  // Requirement 2: Strict Session Management (Closing tab or window requires login)
  // Active session is strictly maintained in sessionStorage.
  // When a user closes their tab or browser window, sessionStorage is wiped,
  // so opening again requires logging in.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Purge legacy persistent localStorage user credentials
      localStorage.removeItem('isa_leadflow_token');
      localStorage.removeItem('isa_leadflow_user');

      const stored = sessionStorage.getItem('isa_leadflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Requirement 1: Logout confirmation & animated progress bar state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [logoutStatusText, setLogoutStatusText] = useState('Closing session...');

  useEffect(() => {
    document.title = 'ISA LeadFlow-Dashboard';
  }, []);

  // Requirement 4 & 9: Global 30-second heartbeat and disconnect beacon for authenticated user
  useEffect(() => {
    if (!currentUser) return;

    const doHeartbeat = () => {
      sendHeartbeat({
        user_id: currentUser.id,
        email: currentUser.email,
        current_page: `/${currentView}`
      }).catch(() => {});
    };

    // 1. Initial heartbeat when app loads or view changes
    doHeartbeat();

    // 2. Regular 30s heartbeat interval
    const interval = setInterval(doHeartbeat, 30000);

    // 3. Handle browser closing / tab closing with sendBeacon (Requirement 9)
    const handleUnload = () => {
      sendBeaconOffline({
        user_id: currentUser.id,
        email: currentUser.email
      });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [currentView, currentUser]);

  // Request Logout opens the Confirmation Modal (Requirement 1)
  const handleLogoutRequest = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleCancelLogout = () => {
    if (isLoggingOut) return;
    setShowLogoutConfirm(false);
  };

  // Confirm Logout runs the smooth progress bar (Requirement 1)
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutProgress(15);
    setLogoutStatusText('Disconnecting active session...');

    await new Promise((r) => setTimeout(r, 250));
    setLogoutProgress(45);
    setLogoutStatusText('Setting presence to Offline in Neon PostgreSQL...');

    if (currentUser) {
      try {
        await userLogout({
          user_id: currentUser.id,
          email: currentUser.email
        });
      } catch (err) {
        console.warn('Logout error:', err);
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    setLogoutProgress(80);
    setLogoutStatusText('Clearing security tokens and session storage...');

    await new Promise((r) => setTimeout(r, 350));
    setLogoutProgress(100);
    setLogoutStatusText('Signed out successfully. Redirecting...');

    await new Promise((r) => setTimeout(r, 300));

    // Clear tokens and stored session
    localStorage.removeItem('isa_leadflow_token');
    localStorage.removeItem('isa_leadflow_user');
    sessionStorage.removeItem('isa_leadflow_token');
    sessionStorage.removeItem('isa_leadflow_user');

    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    setLogoutProgress(0);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleLoginSuccess = useCallback((user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  }, []);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  // Automatically reset to dashboard if a non-admin user is on 'sync' (Requirement 2)
  useEffect(() => {
    if (currentView === 'sync' && !isAdmin) {
      setCurrentView('dashboard');
    }
  }, [currentView, isAdmin]);

  // Unauthenticated users are gated behind the Login Page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render active view with global Logout Confirmation Modal overlay
  const renderCurrentView = () => {
    switch (currentView) {
      case 'leads':
        return (
          <AllLeads
            currentView={currentView}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onLogout={handleLogoutRequest}
          />
        );
      case 'analytics':
        return (
          <CallAnalytics
            currentView={currentView}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onLogout={handleLogoutRequest}
          />
        );
      case 'sync':
        // Data Sync History section only shows to admins and completely hidden from others (Requirement 2)
        if (!isAdmin) {
          return (
            <Dashboard
              currentView="dashboard"
              onNavigate={setCurrentView}
              currentUser={currentUser}
              onLogout={handleLogoutRequest}
            />
          );
        }
        return (
          <DataSyncHistory
            currentView={currentView}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onLogout={handleLogoutRequest}
          />
        );
      case 'users':
        return (
          <UserManagement
            currentView={currentView}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onUserChange={setCurrentUser}
            onLogout={handleLogoutRequest}
          />
        );
      default:
        return (
          <Dashboard
            currentView={currentView}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onLogout={handleLogoutRequest}
          />
        );
    }
  };

  return (
    <>
      {renderCurrentView()}

      {/* Requirement 1: Logout Confirmation Modal & Animated Progress Bar */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none font-sans">
          <div className="bg-[#101A30] border border-slate-700/80 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
            {/* Background subtle glowing spheres */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

            {!isLoggingOut ? (
              /* State 1: "Are you sure you want to log out?" Confirmation Dialog */
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-sm">
                    <LogOut size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Sign Out Confirmation
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Are you sure you want to log out?
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  You are about to sign out of the <strong className="text-white">ISA LeadFlow Workspace</strong>. Your active session will be closed, your online status marked offline, and you will need to sign in again.
                </p>

                {/* Current signed in account card */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: currentUser?.avatar_color || '#2563eb' }}
                      className="w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-xs"
                    >
                      {(currentUser?.name || 'User')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {currentUser?.name || 'Huzaifa Saeed'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {currentUser?.email || 'huzaifa@isaleads.com'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {currentUser?.role || 'Admin'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleCancelLogout}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="confirm-logout-btn"
                    onClick={handleConfirmLogout}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Yes, Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State 2: Logging Out Animated Progress Bar */
              <div className="py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <RefreshCw size={22} className="animate-spin text-cyan-400" />
                </div>

                <h3 className="text-base font-bold text-white mb-1 tracking-tight">
                  Signing Out...
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-medium">
                  {logoutStatusText}
                </p>

                {/* Animated Progress Bar Container */}
                <div className="space-y-2">
                  <div className="w-full bg-[#0B1120] border border-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
                      style={{ width: `${logoutProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono px-1">
                    <span>Logging out of workspace</span>
                    <span className="text-cyan-400 font-bold">{logoutProgress}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
