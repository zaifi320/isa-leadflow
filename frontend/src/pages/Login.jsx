import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CheckCircle2,
  AlertCircle, RefreshCw, X, TrendingUp, Sparkles, HelpCircle
} from 'lucide-react';
import { loginUser, requestForgotPassword } from '../api/dashboard';

// Custom SVG Brand Icons matching the reference image
function DiscordIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 127.14 96.36"
      className={className}
      fill="currentColor"
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.71,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.71,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

function GoogleSheetsIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      fill="currentColor"
    >
      <path
        fill="#0F9D58"
        d="M37,45H11c-2.2,0-4-1.8-4-4V7c0-2.2,1.8-4,4-4h18l12,12v26C41,43.2,39.2,45,37,45z"
      />
      <path fill="#87CEAC" d="M29,3v12h12L29,3z" />
      <path
        fill="#ffffff"
        d="M15,22h18v18H15V22z M17,24v3h6v-3H17z M25,24v3h6v-3H25z M17,29v3h6v-3H17z M25,29v3h6v-3H25z M17,34v4h6v-4H17z M25,34v4h6v-4H25z"
      />
    </svg>
  );
}

function ISALogo({ size = 48, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Orbital swoosh and emblem matching reference image */}
      <svg width={size * 1.5} height={size * 0.9} viewBox="0 0 120 70" fill="none">
        {/* Orbital ellipse */}
        <ellipse
          cx="60"
          cy="35"
          rx="52"
          ry="19"
          stroke="#2563eb"
          strokeWidth="3.2"
          transform="rotate(-18 60 35)"
          strokeLinecap="round"
        />
        {/* Stylized ISA Letters */}
        <text
          x="30"
          y="44"
          fill="#0f172a"
          fontSize="26"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
        >
          IS
        </text>
        <text
          x="68"
          y="44"
          fill="#2563eb"
          fontSize="26"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
        >
          A
        </text>
      </svg>
    </div>
  );
}

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Not registered popup modal state
  const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);
  const [notRegisteredEmail, setNotRegisteredEmail] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotStatus, setForgotStatus] = useState(null);

  // Requirement 2: Strict Session Management
  // When component mounts, clear legacy localStorage session to enforce tab/window close protection,
  // and load remembered email if user previously enabled Remember Me.
  useEffect(() => {
    localStorage.removeItem('isa_leadflow_token');
    localStorage.removeItem('isa_leadflow_user');

    const savedEmail = localStorage.getItem('isa_leadflow_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your work email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser({
        email: email.trim(),
        password: password.trim(),
        remember_me: rememberMe,
      });

      if (res.data?.success) {
        const { user, token } = res.data;
        setSuccessMessage(`Welcome back, ${user.name}! Redirecting...`);

        // Requirement 2: Strict session management
        // Active authentication session is strictly saved in sessionStorage.
        // When the browser tab or window closes, sessionStorage is automatically erased,
        // so when opened again, it will ask for login!
        sessionStorage.setItem('isa_leadflow_token', token);
        sessionStorage.setItem('isa_leadflow_user', JSON.stringify(user));

        // Purge legacy persistent user session from localStorage
        localStorage.removeItem('isa_leadflow_token');
        localStorage.removeItem('isa_leadflow_user');

        // Remember Me remembers the work email in the input box for convenience
        if (rememberMe) {
          localStorage.setItem('isa_leadflow_remembered_email', email.trim());
        } else {
          localStorage.removeItem('isa_leadflow_remembered_email');
        }

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(user, token);
          }
        }, 600);
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail =
        err.response?.data?.detail ||
        'Unable to sign in. Please verify your credentials or network connection.';
      setErrorMessage(detail);

      // Check if user's email does not exist in record (pop message as requested)
      if (
        detail.toLowerCase().includes('not registered') ||
        err.response?.status === 404
      ) {
        setNotRegisteredEmail(email.trim());
        setShowNotRegisteredModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitting(true);
    setForgotStatus(null);
    try {
      const res = await requestForgotPassword({ email: forgotEmail.trim() });
      setForgotStatus({
        type: 'success',
        msg:
          res.data?.message ||
          'Reset request logged. Please contact administrator via email at huzaifa.bin.saeed5@gmail.com to complete password verification.',
      });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStatus(null);
        setForgotEmail('');
      }, 4000);
    } catch {
      setForgotStatus({
        type: 'error',
        msg: 'Please contact your administrator via email at huzaifa.bin.saeed5@gmail.com.',
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden select-none font-sans">
      {/* Subtle Circuit Tech Background Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg
          className="absolute inset-0 w-full h-full text-slate-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="circuit-grid"
              width="160"
              height="160"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 10 L 80 10 L 100 30 L 150 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <circle cx="10" cy="10" r="3" fill="currentColor" />
              <circle cx="150" cy="30" r="3" fill="currentColor" />
              <path
                d="M 20 80 L 60 80 L 90 110 L 90 150"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="20" cy="80" r="3" fill="currentColor" />
              <circle cx="90" cy="150" r="3" fill="currentColor" />
              <path
                d="M 120 70 L 140 70 L 150 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>
      </div>

      {/* Main Two-Column Layout Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* ======================================================== */}
        {/* LEFT SECTION: BRANDING & WORKFLOW PIPELINE               */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-8 lg:pr-4">
          {/* Top ISA Emblem & Title */}
          <div className="space-y-4">
            <div className="inline-block">
              <ISALogo size={52} />
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight flex items-center gap-2">
                <span className="text-slate-900">ISA</span>
                <span className="text-blue-600">LeadFlow</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base font-medium tracking-wide">
                Sales Lead Management Portal
              </p>
            </div>
          </div>

          {/* Tagline & Description */}
          <div className="space-y-3 pt-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              From Discord to Your Dashboard.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
              Your central workspace for organizing leads, tracking activity, and managing your sales team.
            </p>
          </div>

          {/* Visual Workflow: Discord -> Google Sheets -> ISA LeadFlow */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-xs">
              {/* Node 1: Discord */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center text-[#5865F2] shadow-xs hover:scale-105 transition-transform duration-300">
                  <DiscordIcon size={32} className="text-[#5865F2]" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Discord</span>
              </div>

              {/* Arrow */}
              <div className="text-slate-400 mb-5">
                <ArrowRight size={18} />
              </div>

              {/* Node 2: Google Sheets */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center shadow-xs hover:scale-105 transition-transform duration-300">
                  <GoogleSheetsIcon size={32} />
                </div>
                <span className="text-xs font-semibold text-slate-700">Google Sheets</span>
              </div>

              {/* Arrow */}
              <div className="text-slate-400 mb-5">
                <ArrowRight size={18} />
              </div>

              {/* Node 3: ISA LeadFlow */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 hover:scale-105 transition-transform duration-300">
                  <TrendingUp size={28} className="text-white drop-shadow-xs" />
                </div>
                <span className="text-xs font-bold text-slate-900">ISA LeadFlow</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT SECTION: MODERN LOGIN CARD                        */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div
            style={{
              boxShadow:
                '0 20px 45px -10px rgba(15, 23, 42, 0.1), 0 0 20px rgba(37, 99, 235, 0.04)',
            }}
            className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 relative transition-all duration-300"
          >
            {/* Top Badge: Dark Navy Circle with Upward Graph Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#10192d] border-4 border-slate-100 flex items-center justify-center text-white shadow-md">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>

            {/* Heading & Subtitle */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sign in to access your sales workspace
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                id="login-error-banner"
                className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  {errorMessage.includes('huzaifa.bin.saeed5@gmail.com') ? (
                    <span>
                      {errorMessage.split('huzaifa.bin.saeed5@gmail.com')[0]}
                      <a
                        href="mailto:huzaifa.bin.saeed5@gmail.com"
                        className="text-rose-900 underline font-semibold mx-1 inline-flex items-center gap-0.5 hover:text-blue-600"
                      >
                        huzaifa.bin.saeed5@gmail.com
                      </a>
                      {errorMessage.split('huzaifa.bin.saeed5@gmail.com')[1]}
                    </span>
                  ) : (
                    <span>{errorMessage}</span>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none text-slate-400">
                    <Mail size={17} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none text-slate-400">
                    <Lock size={17} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-slate-600 font-medium">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Primary Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-blue-600/30 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin text-white" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight size={17} className="text-white" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>


          </div>
        </div>
      </div>

      {/* Forgot Password Modal - Light Theme */}
      {showForgotModal && (
        <div
          id="forgot-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
            }}
            className="bg-white border border-slate-200 rounded-3xl max-w-[420px] w-full p-8 text-slate-800 relative text-center animate-scaleUp"
          >
            {/* Close Button */}
            <button
              id="close-forgot-x"
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={17} />
            </button>

            {/* Amber Circular Outline Icon */}
            <AlertCircle size={46} strokeWidth={1.8} className="text-amber-500 mx-auto mb-4" />

            {/* Heading */}
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
              Reset Password
            </h3>

            {/* Subtitle / Instructions with Underlined Email */}
            <p className="text-sm text-slate-600 leading-relaxed mb-7 px-1">
              To reset your password, please email at{' '}
              <a
                href="mailto:huzaifa.bin.saeed5@gmail.com?subject=ISA%20LeadFlow%20Password%20Reset%20Request"
                className="underline text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                huzaifa.bin.saeed5@gmail.com
              </a>{' '}
              for access.
            </p>

            {/* Action Buttons: Close (Left) & Email Admin (Right) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="close-forgot-btn"
                onClick={() => setShowForgotModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200/80 transition-all cursor-pointer"
              >
                Close
              </button>
              <a
                href="mailto:huzaifa.bin.saeed5@gmail.com?subject=ISA%20LeadFlow%20Password%20Reset%20Request"
                className="flex-1 py-3 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail size={16} />
                <span>Email Admin</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Account Not Registered Pop-up Modal - Light Theme */}
      {showNotRegisteredModal && (
        <div
          id="not-registered-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowNotRegisteredModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
            }}
            className="bg-white border border-slate-200 rounded-3xl max-w-[420px] w-full p-8 text-slate-800 relative text-center animate-scaleUp"
          >
            {/* Close Button */}
            <button
              id="close-not-registered-x"
              type="button"
              onClick={() => setShowNotRegisteredModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={17} />
            </button>

            {/* Amber Circular Outline Icon */}
            <AlertCircle size={46} strokeWidth={1.8} className="text-amber-500 mx-auto mb-4" />

            {/* Heading */}
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
              Account Not Registered
            </h3>

            {/* Subtitle / Instructions with Underlined Email */}
            <p className="text-sm text-slate-600 leading-relaxed mb-7 px-1">
              Sorry, you are not registered. Please email at{' '}
              <a
                href={`mailto:huzaifa.bin.saeed5@gmail.com?subject=ISA%20LeadFlow%20Access%20Request&body=Hi%20Huzaifa,%0D%0A%0D%0AI%20would%20like%20to%20request%20access%20to%20ISA%20LeadFlow.%0D%0AMy%20email:%20${encodeURIComponent(notRegisteredEmail || email)}`}
                className="underline text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                huzaifa.bin.saeed5@gmail.com
              </a>{' '}
              for access.
            </p>

            {/* Action Buttons: Close (Left) & Email Admin (Right) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="close-not-registered-btn"
                onClick={() => setShowNotRegisteredModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200/80 transition-all cursor-pointer"
              >
                Close
              </button>
              <a
                href={`mailto:huzaifa.bin.saeed5@gmail.com?subject=ISA%20LeadFlow%20Access%20Request&body=Hi%20Huzaifa,%0D%0A%0D%0AI%20would%20like%20to%20request%20access%20to%20ISA%20LeadFlow.%0D%0AMy%20email:%20${encodeURIComponent(notRegisteredEmail || email)}`}
                className="flex-1 py-3 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail size={16} />
                <span>Email Admin</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

