"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [filter, setFilter] = useState("all"); // all, users, foods, system
  const [endpointMissing, setEndpointMissing] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setEndpointMissing(false);
    try {
      const response = await api.get("/admin/activity", {
        params: { page, perPage, type: filter !== "all" ? filter : undefined }
      });
      setActivities(response?.data?.activities || []);
    } catch (err) {
      // Check if it's a 404 (endpoint doesn't exist)
      if (err?.response?.status === 404) {
        setEndpointMissing(true);
        // Don't log 404 errors to console since we handle them gracefully in UI
      } else {
        // Only log non-404 errors
        console.error("Error fetching activities:", err);
      }
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "user_created":
      case "user_updated":
      case "user_deleted":
        return (
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case "food_created":
      case "food_updated":
      case "food_deleted":
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case "login":
      case "logout":
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type) => {
    if (type.includes("created")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (type.includes("updated")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (type.includes("deleted")) return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  return (
    <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Activity Logs
        </h1>
        <p className="text-sm text-gray-400 mt-1">View all admin actions and system events</p>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 rounded-lg mb-6">
        <div className="flex flex-wrap gap-2">
          {["all", "users", "foods", "system"].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="admin-card rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-400">Loading activities...</p>
          </div>
        ) : endpointMissing ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Activity Logs Endpoint Not Available</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              The activity logs API endpoint hasn&apos;t been implemented yet. This feature will track all admin actions including user management, food database changes, and system events.
            </p>
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left max-w-2xl mx-auto">
              <p className="text-sm text-amber-300 font-medium mb-2">To enable this feature, add the following endpoint to your backend:</p>
              <code className="text-xs text-gray-300 block bg-gray-900 p-3 rounded font-mono">
                GET /admin/activity
              </code>
              <p className="text-xs text-gray-400 mt-2">Expected response format:</p>
              <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "activities": [
    {
      "id": "uuid",
      "type": "user_created|food_updated|...",
      "description": "User created",
      "admin_name": "Admin Name",
      "created_at": "2024-01-01T00:00:00Z",
      "details": {}
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "perPage": 50,
    "totalPages": 2
  }
}`}
              </pre>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">No activities found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {activities.map((activity, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-900/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{activity.description || activity.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getActivityColor(activity.type)}`}>
                        {activity.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {activity.admin_name || "System"} • {new Date(activity.created_at || activity.timestamp).toLocaleString()}
                    </div>
                    {activity.details && (
                      <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-900/50 p-2 rounded">
                        {JSON.stringify(activity.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {activities.length > 0 && (
          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {page}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={activities.length < perPage}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

