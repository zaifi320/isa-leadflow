import axios from 'axios';

// Standard timeout for normal dashboard queries (KPIs, charts, tables)
axios.defaults.timeout = 30000;

// Automatically retry failed GET requests up to 2 times to absorb any transient DB/network blips
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Only retry GET requests (charts and tables), not mutations
    if (!config || config.method?.toLowerCase() !== 'get') {
      return Promise.reject(error);
    }
    config.__retryCount = config.__retryCount || 0;
    if (config.__retryCount >= 2) {
      return Promise.reject(error);
    }
    config.__retryCount += 1;
    const delay = config.__retryCount * 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return axios(config);
  }
);

// Dynamic API host: Uses VITE_API_URL if configured, localhost in development, or relative in production
const API_HOST = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
const BASE_URL = `${API_HOST}/api/dashboard`;
const LEADS_URL = `${API_HOST}/api/leads`;
const ANALYTICS_URL = `${API_HOST}/api/analytics`;
const SYNC_URL = `${API_HOST}/api/sync`;
const USERS_URL = `${API_HOST}/api/users`;
const AUTH_URL = `${API_HOST}/api/auth`;

// In-memory client-side cache for high-frequency dashboard queries
const clientCache = new Map();

export const clearClientCache = () => {
  clientCache.clear();
};

const cachedGet = async (url, params, ttlMs = 300000) => {
  const queryStr = params ? new URLSearchParams(params).toString() : '';
  const key = `${url}?${queryStr}`;
  const now = Date.now();
  const cached = clientCache.get(key);
  
  if (cached && (now - cached.timestamp) < ttlMs) {
    return Promise.resolve({ data: cached.data, status: 200, fromClientCache: true });
  }

  const res = await axios.get(url, { params });
  if (res && res.data !== undefined) {
    clientCache.set(key, { data: res.data, timestamp: now });
  }
  return res;
};

export const getKPIs = (params) => cachedGet(`${BASE_URL}/kpis`, params);
export const getDailyTrend = (params) => cachedGet(`${BASE_URL}/daily-trend`, params);
export const getLeadsByType = (params) => cachedGet(`${BASE_URL}/leads-by-type`, params);
export const getLeadsByProperty = (params) => cachedGet(`${BASE_URL}/leads-by-property`, params);
export const getLeadsByState = (params) => cachedGet(`${BASE_URL}/leads-by-state`, params);
export const getTopLeadBy = (params) => cachedGet(`${BASE_URL}/top-lead-by`, params);
export const getRecentLeads = (params) => cachedGet(`${BASE_URL}/recent-leads`, params);
export const getEmployees = () => cachedGet(`${BASE_URL}/employees`, {}, 600000);
export const getEmployeeTrend = (params) => cachedGet(`${BASE_URL}/employee-trend`, params);
export const getLeadsByStateTable = () => cachedGet(`${BASE_URL}/leads-by-state-table`, {}, 600000);
export const getLastSync = (forceFresh = false) => {
  if (forceFresh) {
    return axios.get(`${BASE_URL}/last-sync?_t=${Date.now()}`);
  }
  return cachedGet(`${BASE_URL}/last-sync`, {}, 15000);
};

// Dedicated 60s timeout for Google Sheets download and database ingest
export const triggerSync = async () => {
  clearClientCache();
  return axios.post(`${BASE_URL}/sync`, null, { timeout: 60000 });
};

export const getAllLeads = (params) => axios.get(LEADS_URL, { params });
export const getFilterOptions = () => cachedGet(`${LEADS_URL}/filter-options`, {}, 600000);
export const getLeadDetail = (id) => axios.get(`${LEADS_URL}/${id}`);
export const getExportUrl = (params) => {
  const query = new URLSearchParams(params).toString();
  return `${LEADS_URL}/export?${query}`;
};

export const getAnalyticsKPIs = (params) => cachedGet(`${ANALYTICS_URL}/kpis`, params);
export const getAppointmentTrend = (params) => cachedGet(`${ANALYTICS_URL}/appointment-trend`, params);
export const getLeadByAnalysis = (params) => cachedGet(`${ANALYTICS_URL}/lead-by-analysis`, params);
export const getTimeDistribution = (params) => cachedGet(`${ANALYTICS_URL}/time-distribution`, params);
export const getAnalyticsLeadsByState = (params) => cachedGet(`${ANALYTICS_URL}/leads-by-state`, params);
export const getTopAgentsByAppointments = (params) => cachedGet(`${ANALYTICS_URL}/top-agents`, params);
export const getRecentAppointments = (params) => cachedGet(`${ANALYTICS_URL}/recent-appointments`, params);

export const getSyncSummary = () => cachedGet(`${SYNC_URL}/summary`, {}, 15000);
export const getSyncHistory = (params) => axios.get(`${SYNC_URL}/history`, { params });
export const getSyncTrend = (params) => cachedGet(`${SYNC_URL}/trend`, params);
export const triggerSyncNow = async () => {
  clearClientCache();
  return axios.post(`${SYNC_URL}/trigger`, null, { timeout: 65000 });
};

// --- User Management & Real-Time Online Status ---
export const getUsers = (params) => axios.get(USERS_URL, { params });
export const createUser = (userData) => axios.post(USERS_URL, userData);
export const deleteUser = (userId) => axios.delete(`${USERS_URL}/${userId}`);
export const getUserSummary = (params) => axios.get(`${USERS_URL}/summary`, { params });
export const sendHeartbeat = (payload) => axios.post(`${USERS_URL}/heartbeat`, payload);
export const userLogout = (payload) => axios.post(`${USERS_URL}/logout`, payload);
export const getUserActivityLogs = (params) => axios.get(`${USERS_URL}/activity-logs`, { params });

// --- Authentication APIs ---
export const loginUser = (credentials) => axios.post(`${AUTH_URL}/login`, credentials);
export const getCurrentAuthUser = (params) => axios.get(`${AUTH_URL}/me`, { params });
export const requestForgotPassword = (data) => axios.post(`${AUTH_URL}/forgot-password`, data);
export const logoutAuthUser = (params) => axios.post(`${AUTH_URL}/logout`, params);

export const sendBeaconOffline = (payload) => {
  const url = `${USERS_URL}/beacon-offline`;
  const body = JSON.stringify(payload || { user_id: 1, email: 'huzaifa@isaleads.com' });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else if (typeof fetch !== 'undefined') {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }
};
