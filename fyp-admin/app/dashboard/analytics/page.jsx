"use client";

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      setAnalytics(response?.data?.analytics || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/analytics/export', { 
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      alert('Failed to export analytics');
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16'];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Comprehensive insights into user behavior, food consumption, and AI performance
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Analytics
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="admin-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-1">Avg Calories/Day</div>
          <div className="text-2xl font-bold text-white">{analytics?.avgCaloriesPerDay || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </div>

        <div className="admin-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-1">Total Points</div>
          <div className="text-2xl font-bold text-white">{analytics?.pointsOverview?.total?.toLocaleString() || 0}</div>
          <div className="text-xs text-gray-500 mt-1">All users combined</div>
        </div>

        <div className="admin-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-1">Check-In Streak</div>
          <div className="text-2xl font-bold text-white">{analytics?.checkInStats?.avg || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Average per user</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="admin-card p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-200">User Growth (30 Days)</h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {analytics?.userGrowth && analytics.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">No user growth data</p>
              </div>
            )}
          </div>
        </div>

        {/* Most Eaten Foods Chart */}
        <div className="admin-card p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-200">Top 10 Most Eaten Foods</h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {analytics?.mostEatenFoods && analytics.mostEatenFoods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.mostEatenFoods} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">No food consumption data</p>
              </div>
            )}
          </div>
        </div>

        {/* Hydration Statistics */}
        <div className="admin-card p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-200">Hydration Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Water Intake</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {analytics?.hydrationStats?.total ? (analytics.hydrationStats.total / 1000).toFixed(1) : 0}L
                </div>
                <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div>
                <div className="text-sm text-gray-400 mb-1">Average per User</div>
                <div className="text-2xl font-bold text-blue-400">
                  {analytics?.hydrationStats?.avg || 0}ml
                </div>
                <div className="text-xs text-gray-500 mt-1">Daily average</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Points Overview */}
        <div className="admin-card p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-200">Points Earned Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Points Earned</div>
                <div className="text-3xl font-bold text-amber-400">
                  {analytics?.pointsOverview?.total?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">All users combined</div>
              </div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="text-sm text-gray-400 mb-1">Avg Check-In Streak</div>
              <div className="text-2xl font-bold text-pink-400">{analytics?.checkInStats?.avg || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Days per user</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
