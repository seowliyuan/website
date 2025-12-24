"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

interface User {
  user_id: string;
  full_name?: string;
  email: string;
  goal?: string;
  height_cm?: number | string;
  weight_kg?: number | string;
  bmi?: number | string;
  disabled?: boolean;
  created_at: string;
}

interface UserForm {
  full_name: string;
  email: string;
  goal: string;
  height_cm: string;
  weight_kg: string;
  bmi: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UserActivity {
  streak: number;
  points: number;
  total_scans: number;
  total_foods_logged: number;
  recent_logs: Array<{
    food_name?: string;
    logged_at?: string;
    created_at?: string;
    calories?: number;
  }>;
  recent_recognitions: unknown[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Filter and sort states
  const [filterGoal, setFilterGoal] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");

  // fetch paginated users from the server; triggered on page/perPage/query changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // debounce query changes slightly so we don't spam the API
    const t = setTimeout(() => {
      api.get('/admin/users', { 
        params: { 
          page, 
          perPage, 
          q: query,
          goal: filterGoal || undefined,
          sortBy,
          sortOrder
        } 
      })
          .then((res) => {
          if (cancelled) return;
          const rows = res?.data?.users || [];
          setUsers(rows);
            setTotal(res?.data?.pagination?.total ?? (rows?.length ?? 0));
            setTotalPages(res?.data?.pagination?.totalPages ?? 1);
        })
        .catch((e) => {
          console.error('Failed to fetch users:', e);
          console.error('Error response:', e.response?.data);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);

    return () => { cancelled = true; clearTimeout(t); };
  }, [page, perPage, query, filterGoal, sortBy, sortOrder]);

  // modal + editing state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [form, setForm] = useState<UserForm>({
    full_name: '',
    email: '',
    goal: 'Maintain',
    height_cm: '',
    weight_kg: '',
    bmi: ''
  });
  const [toast, setToast] = useState<Toast | null>(null);
  
  // Activity tracking state
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false);

  function openView(u: User): void {
    // Try to fetch the latest single-user record from backend (falls back to the row data)
    setSelectedUser(u);
    api.get(`/admin/users/${u.user_id}`).then((r) => {
      if (r?.data?.user) setSelectedUser(r.data.user);
    }).catch(() => {
      // backend single-user endpoint might not be available yet, continue with row data
    });
    setForm({
      full_name: u.full_name || '',
      email: u.email || '',
      goal: u.goal || '',
      height_cm: u.height_cm?.toString() || '',
      weight_kg: u.weight_kg?.toString() || '',
      bmi: u.bmi?.toString() || ''
    });
    setEditing(false);
    setModalOpen(true);
  }

  function openEdit(u: User): void {
    setSelectedUser(u);
    // Fetch fresh data from backend to ensure we have email and all fields
    api.get(`/admin/users/${u.user_id}`).then((r) => {
      const user = r?.data?.user || u;
      setSelectedUser(user);
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        goal: user.goal || 'Maintain',
        height_cm: user.height_cm?.toString() || '',
        weight_kg: user.weight_kg?.toString() || '',
        bmi: user.bmi?.toString() || ''
      });
    }).catch(() => {
      // Fallback to row data if backend fails
      setForm({
        full_name: u.full_name || '',
        email: u.email || '',
        goal: u.goal || 'Maintain',
        height_cm: u.height_cm?.toString() || '',
        weight_kg: u.weight_kg?.toString() || '',
        bmi: u.bmi?.toString() || ''
      });
    });
    setEditing(true);
    setModalOpen(true);
  }

  async function saveChanges(): Promise<void> {
    if (!selectedUser?.user_id) return;
    // basic validation
    if (!form.full_name || form.full_name.trim().length < 2) {
      showToast('Full name is too short', 'error');
      return;
    }
    
    // Convert numeric fields properly - only send fields with values
    // Note: email is not updatable as it's stored in auth.users, not profiles
    const payload: {
      full_name: string;
      goal: string;
      height_cm?: number;
      weight_kg?: number;
      bmi?: number;
    } = {
      full_name: form.full_name,
      goal: form.goal
    };
    
    // Add numeric fields only if they have values
    if (form.height_cm && form.height_cm !== '') {
      payload.height_cm = parseFloat(form.height_cm);
    }
    if (form.weight_kg && form.weight_kg !== '') {
      payload.weight_kg = parseFloat(form.weight_kg);
    }
    if (form.bmi && form.bmi !== '') {
      payload.bmi = parseFloat(form.bmi);
    }
    
    console.log('Saving user with payload:', payload);
    
    try {
      const res = await api.put(`/admin/users/${selectedUser.user_id}`, payload);
      if (res?.data?.user) {
        // update local list
        setUsers((prev) => prev.map((p)=> p.user_id === selectedUser.user_id ? res.data.user : p));
        setSelectedUser(res.data.user);
        setEditing(false);
        setModalOpen(false);
        showToast('Saved changes', 'success');
      } else {
        console.error('Unexpected response', res);
        alert('Update failed');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      console.error('Error response:', err.response?.data);
      showToast(err.response?.data?.error || 'Failed to update user', 'error');
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function refreshSelected(): Promise<void> {
    if (!selectedUser?.user_id) return;
    try {
      const r = await api.get(`/admin/users/${selectedUser.user_id}`);
      if (r?.data?.user) {
        setSelectedUser(r.data.user);
        // update row in current page if present
        setUsers((prev) => prev.map((p)=> p.user_id === r.data.user.user_id ? r.data.user : p));
        showToast('Refreshed from server', 'success');
      }
    } catch (e) {
      showToast('Failed to refresh', 'error');
    }
  }

  async function viewUserActivity(u: User): Promise<void> {
    setSelectedUser(u);
    setActivityModalOpen(true);
    setLoadingActivity(true);
    
    try {
      // Fetch user activity data - streak, points, food logs, recognition logs
      const [activityRes, logsRes] = await Promise.all([
        api.get(`/admin/users/${u.user_id}/activity`).catch(() => ({ data: null })),
        api.get(`/admin/users/${u.user_id}/logs`).catch(() => ({ data: null }))
      ]);
      
      setUserActivity({
        streak: activityRes?.data?.streak || 0,
        points: activityRes?.data?.points || 0,
        total_scans: activityRes?.data?.total_scans || 0,
        total_foods_logged: activityRes?.data?.total_foods_logged || 0,
        recent_logs: logsRes?.data?.logs || [],
        recent_recognitions: logsRes?.data?.recognitions || []
      });
    } catch (e) {
      console.error(e);
      showToast('Failed to load activity', 'error');
      setUserActivity({
        streak: 0,
        points: 0,
        total_scans: 0,
        total_foods_logged: 0,
        recent_logs: [],
        recent_recognitions: []
      });
    } finally {
      setLoadingActivity(false);
    }
  }

  async function exportToCSV(): Promise<void> {
    try {
      showToast('Preparing export...', 'info');
      
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filterGoal) params.append('goal', filterGoal);
      
      const response = await api.get(`/admin/users/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Export completed!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  }

  return (
    <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">Users</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Manage registered users and their onboarding status</p>
        </div>
      </div>

      {/* Search, Filter, Sort Bar */}
      <div className="admin-card p-3 md:p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input 
              value={query} 
              onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} 
              placeholder="Search by name..." 
              className="w-full px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors text-sm" 
            />
          </div>

          {/* Sort By */}
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
          >
            <option value="created_at">Join Date</option>
            <option value="full_name">Name</option>
            <option value="bmi">BMI</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 hover:border-gray-700 transition-colors text-sm flex items-center gap-2"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>

          {/* Export Button */}
          <button 
            onClick={exportToCSV}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap text-white shadow-md hover:shadow-emerald-500/25 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-card p-3 md:p-4 rounded-lg mb-4 flex items-center justify-between">
        <div className="text-xs md:text-sm text-gray-400">Showing <span className="text-white font-semibold">{users.length}</span> of <span className="text-white font-semibold">{total}</span> users</div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
          <span className="text-xs text-gray-400">{loading ? 'Loading...' : 'Ready'}</span>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-400">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-card p-12 rounded-lg text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div className="text-lg font-medium text-gray-300 mb-2">No users found</div>
          <div className="text-sm text-gray-500">Try adjusting your search query</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
          {users.map((u) => (
            <div key={u.user_id} className="admin-card rounded-xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group">
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 p-4 border-b border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${u.disabled ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {u.disabled ? 'Disabled' : 'Active'}
                  </div>
                </div>
                <div className="font-semibold text-white truncate text-sm md:text-base">{u.full_name || 'No Name'}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
              </div>

              {/* Card Body with User Info */}
              <div className="p-4 space-y-3">
                {/* Goal Badge */}
                {u.goal && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span className="text-xs text-gray-300 capitalize">{u.goal}</span>
                  </div>
                )}

                {/* Physical Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {u.height_cm && (
                    <div className="bg-[#0b1220] rounded-lg p-2">
                      <div className="text-xs text-gray-400">Height</div>
                      <div className="text-sm font-semibold text-white">{u.height_cm} cm</div>
                    </div>
                  )}
                  {u.weight_kg && (
                    <div className="bg-[#0b1220] rounded-lg p-2">
                      <div className="text-xs text-gray-400">Weight</div>
                      <div className="text-sm font-semibold text-white">{u.weight_kg} kg</div>
                    </div>
                  )}
                </div>

                {/* BMI Badge */}
                {u.bmi && (
                  <div className="flex items-center justify-between bg-[#0b1220] rounded-lg p-2">
                    <span className="text-xs text-gray-400">BMI</span>
                    <span className="text-sm font-semibold text-purple-400">{parseFloat(u.bmi.toString()).toFixed(1)}</span>
                  </div>
                )}

                {/* Join Date */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Card Footer with Actions */}
              <div className="p-3 bg-gray-900/30 border-t border-gray-800 flex gap-2">
                <button 
                  onClick={() => viewUserActivity(u)} 
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-xs md:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-purple-500/25"
                  title="View Activity"
                >
                  Activity
                </button>
                <button 
                  onClick={() => openView(u)} 
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white text-xs md:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-indigo-500/25"
                >
                  View
                </button>
                <button 
                  onClick={() => openEdit(u)} 
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-gray-300 text-xs md:text-sm font-medium transition-all duration-200"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 mt-4 md:mt-6">
        <div className="text-xs md:text-sm text-gray-400">
          Page <span className="text-white font-semibold">{page}</span> / <span className="text-white font-semibold">{totalPages}</span> — <span className="text-white font-semibold">{users.length}</span> items
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page<=1 || loading} 
            onClick={() => setPage((p)=>Math.max(1,p-1))} 
            className="px-3 md:px-4 py-2 rounded-lg bg-[#0b1220] border border-gray-800 hover:border-gray-700 text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            ← Prev
          </button>
          <button 
            disabled={page>=totalPages || loading} 
            onClick={() => setPage((p)=>p+1)} 
            className="px-3 md:px-4 py-2 rounded-lg bg-[#0b1220] border border-gray-800 hover:border-gray-700 text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Next →
          </button>
          <select 
            value={perPage} 
            onChange={(e)=>{ setPerPage(parseInt(e.target.value,10)); setPage(1); }} 
            className="px-2 md:px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 hover:border-gray-700 text-xs md:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value={6}>6 per page</option>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
        </div>
      </div>

      {/* View/Edit modal - simplified version */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1724] border border-gray-800 rounded-xl w-full max-w-3xl shadow-2xl max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border-b border-gray-800 p-4 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">{editing ? 'Edit User' : 'User Details'}</h3>
                    <div className="text-xs md:text-sm text-gray-400 font-mono">{selectedUser.user_id}</div>
                  </div>
                </div>
                <button 
                  onClick={() => { setModalOpen(false); setEditing(false); }} 
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {!editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0b1220] p-4 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Full Name</div>
                    <div className="font-medium text-white">{selectedUser.full_name || '—'}</div>
                  </div>
                  <div className="bg-[#0b1220] p-4 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Email</div>
                    <div className="font-medium text-white truncate">{selectedUser.email}</div>
                  </div>
                  <div className="bg-[#0b1220] p-4 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Goal</div>
                    <div className="font-medium text-white capitalize">{selectedUser.goal || '—'}</div>
                  </div>
                  <div className="bg-[#0b1220] p-4 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Joined</div>
                    <div className="font-medium text-white text-sm">{new Date(selectedUser.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col text-sm">
                    <span className="text-gray-400 mb-2 font-medium">Full Name</span>
                    <input 
                      value={form.full_name} 
                      onChange={(e)=>setForm({...form, full_name: e.target.value})} 
                      className="px-3 py-2.5 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors" 
                      placeholder="Enter full name"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="text-gray-400 mb-2 font-medium">Email (read-only)</span>
                    <input 
                      type="email"
                      value={form.email} 
                      disabled
                      className="px-3 py-2.5 rounded-lg bg-[#0b1220] border border-gray-800 opacity-50 cursor-not-allowed" 
                      placeholder="user@example.com"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="text-gray-400 mb-2 font-medium">Goal</span>
                    <select 
                      value={form.goal} 
                      onChange={(e)=>setForm({...form, goal: e.target.value})} 
                      className="px-3 py-2.5 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors"
                    >
                      <option value="Lose Weight">Lose Weight</option>
                      <option value="Gain Muscle">Gain Muscle</option>
                      <option value="Maintain">Maintain</option>
                      <option value="Get Fit">Get Fit</option>
                    </select>
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="text-gray-400 mb-2 font-medium">Height (cm)</span>
                    <input 
                      type="number" 
                      value={form.height_cm} 
                      onChange={(e)=>setForm({...form, height_cm: e.target.value})} 
                      className="px-3 py-2.5 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors" 
                      placeholder="170"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="text-gray-400 mb-2 font-medium">Weight (kg)</span>
                    <input 
                      type="number" 
                      value={form.weight_kg} 
                      onChange={(e)=>setForm({...form, weight_kg: e.target.value})} 
                      className="px-3 py-2.5 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors" 
                      placeholder="65"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="text-gray-400 mb-2 font-medium">BMI</span>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={form.bmi} 
                      onChange={(e)=>setForm({...form, bmi: e.target.value})} 
                      className="px-3 py-2.5 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors" 
                      placeholder="22.5"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                {editing ? (
                  <>
                    <button 
                      onClick={() => { setEditing(false); }} 
                      className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveChanges} 
                      className="px-5 py-2 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/25"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setEditing(true)} 
                    className="px-5 py-2 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-sm font-medium transition-all"
                  >
                    Edit User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {activityModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1724] border border-gray-800 rounded-xl w-full max-w-4xl shadow-2xl max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-b border-gray-800 p-4 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">User Activity</h3>
                    <div className="text-xs md:text-sm text-gray-400">{selectedUser.full_name || selectedUser.email}</div>
                  </div>
                </div>
                <button 
                  onClick={() => { setActivityModalOpen(false); setUserActivity(null); }} 
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {loadingActivity ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-gray-400">Loading activity...</p>
                  </div>
                </div>
              ) : userActivity ? (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Streak</div>
                      <div className="text-2xl font-bold text-white">{userActivity.streak}</div>
                      <div className="text-xs text-gray-500 mt-1">days</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Points</div>
                      <div className="text-2xl font-bold text-white">{userActivity.points}</div>
                      <div className="text-xs text-gray-500 mt-1">earned</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Total Scans</div>
                      <div className="text-2xl font-bold text-white">{userActivity.total_scans}</div>
                      <div className="text-xs text-gray-500 mt-1">AI scans</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Foods Logged</div>
                      <div className="text-2xl font-bold text-white">{userActivity.total_foods_logged}</div>
                      <div className="text-xs text-gray-500 mt-1">total</div>
                    </div>
                  </div>

                  {/* Recent Logs */}
                  {userActivity.recent_logs && userActivity.recent_logs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Recent Food Logs
                      </h4>
                      <div className="space-y-2">
                        {userActivity.recent_logs.slice(0, 10).map((log: any, idx: number) => (
                          <div key={idx} className="bg-[#0b1220] border border-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">{log.food_name || 'Unknown Food'}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {log.logged_at ? new Date(log.logged_at).toLocaleString() : 
                                   log.created_at ? new Date(log.created_at).toLocaleString() : 'No date'}
                                </div>
                              </div>
                              {log.calories && (
                                <div className="text-sm font-semibold text-purple-400">{log.calories} cal</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Recognitions */}
                  {userActivity.recent_recognitions && userActivity.recent_recognitions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Recent AI Recognitions
                      </h4>
                      <div className="space-y-2">
                        {userActivity.recent_recognitions.slice(0, 10).map((rec: any, idx: number) => (
                          <div key={idx} className="bg-[#0b1220] border border-gray-800 rounded-lg p-3">
                            <div className="text-sm text-gray-300">
                              {rec.food_name || rec.recognized_food || 'Food recognized'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {rec.created_at ? new Date(rec.created_at).toLocaleString() : 
                               rec.recognized_at ? new Date(rec.recognized_at).toLocaleString() : 'No date'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!userActivity.recent_logs || userActivity.recent_logs.length === 0) && 
                   (!userActivity.recent_recognitions || userActivity.recent_recognitions.length === 0) && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-lg font-medium text-gray-300 mb-2">No recent activity</div>
                      <div className="text-sm text-gray-500">This user hasn't logged any activities yet</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-lg font-medium text-gray-300 mb-2">No activity data</div>
                  <div className="text-sm text-gray-500">Unable to load activity information</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className={`fixed right-4 bottom-6 z-50 p-3 rounded shadow-lg ${toast.type === 'success' ? 'bg-emerald-700' : toast.type === 'error' ? 'bg-red-700' : 'bg-slate-700'}`}>
          <div className="text-sm font-medium">{toast.message}</div>
        </div>
      )}
    </div>
  );
}

