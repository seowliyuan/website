"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useRouter } from "next/navigation";

interface Summary {
  total_users?: number;
  total_foods?: number;
}

interface Metric {
  date: string;
  users?: number;
  foods?: number;
}

interface Health {
  status?: string;
  [key: string]: unknown;
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // fetch lightweight summary (total foods, daily checkins etc) and system health
    Promise.all([
      api.get('/admin/summary').then((r)=> {
        console.log('Summary response:', r?.data);
        return r?.data?.summary || null;
      }).catch((e)=>{ console.error('Summary error:', e); return null; }),
      
      api.get('/admin/system-health').then((r)=> r?.data?.health || null).catch(()=>null),
      
      api.get('/admin/metrics/last7').then((r)=> {
        console.log('Metrics response:', r?.data);
        return r?.data?.metrics || [];
      }).catch((e)=>{ console.error('Metrics error:', e.message, e.response?.data); return []; })
    ]).then(([summaryData, healthData, metricsData]) => {
      console.log('Setting metrics:', metricsData);
      setSummary(summaryData);
      setHealth(healthData);
      setMetrics(metricsData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-500 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        {/* <p className="text-sm md:text-base text-gray-400">Welcome back! Here's what's happening with your app today.</p> */}
      </div>

      {/* System Summary Cards */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          System Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {/* Total Users Card */}
          <div className="admin-card p-3 md:p-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 border border-gray-800 hover:border-indigo-500/30">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[10px] md:text-xs text-indigo-400 font-medium">Active</span>
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-400 mb-0.5">Total Users</div>
            <div className="text-xl md:text-2xl font-bold text-white">{summary?.total_users ?? '0'}</div>
            <div className="mt-1 text-[10px] md:text-xs text-gray-500">Registered accounts</div>
          </div>

          {/* Total Foods Card */}
          <div className="admin-card p-3 md:p-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border border-gray-800 hover:border-emerald-500/30">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] md:text-xs text-emerald-400 font-medium">Database</span>
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-400 mb-0.5">Total Foods</div>
            <div className="text-xl md:text-2xl font-bold text-white">{summary?.total_foods ?? '0'}</div>
            <div className="mt-1 text-[10px] md:text-xs text-gray-500">Food items available</div>
          </div>

          {/* Quick Actions - Inline */}
          <div className="col-span-2 admin-card p-3 md:p-4 rounded-xl border border-gray-800">
            <h2 className="text-sm md:text-base font-semibold text-gray-200 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => router.push('/dashboard/users')}
                className="group p-2 md:p-3 rounded-lg bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 text-left"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white mb-0.5">Add User</div>
                <div className="text-[9px] md:text-[10px] text-gray-400">Create new account</div>
              </button>

              <button 
                onClick={() => router.push('/dashboard/foods')}
                className="group p-2 md:p-3 rounded-lg bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 text-left"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white mb-0.5">Add Food</div>
                <div className="text-[9px] md:text-[10px] text-gray-400">Add to database</div>
              </button>

              <button 
                onClick={() => router.push('/dashboard/apk')}
                className="group p-2 md:p-3 rounded-lg bg-gradient-to-br from-orange-600/20 to-pink-600/20 border border-orange-500/30 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 text-left"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white mb-0.5">Upload APK</div>
                <div className="text-[9px] md:text-[10px] text-gray-400">New app version</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Last 7 Days Signups */}
        <div className="admin-card p-5 md:p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg md:text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Last 7 Days Signups
          </h2>
          <div className="w-full h-64">
            {metrics && metrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(value: string) => {
                      const d = new Date(value);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #374151', borderRadius: '8px' }}
                    labelFormatter={(value: string) => {
                      const d = new Date(value);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }}
                  />
                  <Bar dataKey="users" name="Signups" fill="#6366f1" radius={[4,4,0,0]}>
                    <LabelList dataKey="users" position="top" fill="#e5e7eb" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">No signup data</p>
              </div>
            )}
          </div>
        </div>

        {/* Last 7 Days Foods Added */}
        <div className="admin-card p-5 md:p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg md:text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Last 7 Days Foods Added
          </h2>
          <div className="w-full h-64">
            {metrics && metrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(value: string) => {
                      const d = new Date(value);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #374151', borderRadius: '8px' }}
                    labelFormatter={(value: string) => {
                      const d = new Date(value);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }}
                  />
                  <Bar dataKey="foods" name="Foods Added" fill="#10b981" radius={[4,4,0,0]}>
                    <LabelList dataKey="foods" position="top" fill="#e5e7eb" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">No food data</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Additional Info */}
      <div className="admin-card p-5 md:p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-200 mb-1">Need Help?</h3>
            <p className="text-sm text-gray-400">Access documentation, APK, or check system status.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push('/dashboard/apk')}
              className="px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 hover:border-indigo-400 text-indigo-300 text-sm font-medium transition-all"
            >
              APK
            </button>
            <button 
              onClick={() => router.push('/dashboard/analytics')}
              className="px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 hover:border-purple-400 text-purple-300 text-sm font-medium transition-all"
            >
              Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

