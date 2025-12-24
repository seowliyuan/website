import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // use backend API for admin data
    fetch((process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000") + "/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, []);

  // build data for goals chart
  const goalCounts = users.reduce((acc, u) => {
    const goal = u.goal || "unknown";
    acc[goal] = (acc[goal] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(goalCounts).map((k) => ({ name: k, count: goalCounts[k] }));

  const totalUsers = users.length;
  const avgBmi = users.length ? (users.reduce((s, u) => s + (u.bmi || 0), 0) / users.length).toFixed(1) : 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total users</div>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Average BMI</div>
          <div className="text-2xl font-bold">{avgBmi}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Onboarded</div>
          <div className="text-2xl font-bold">
            {users.filter((u) => u.completed_onboarding).length}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Users by goal</h2>
        <div style={{ height: 300 }} className="w-full">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-600">No data available</div>
          )}
        </div>
      </div>

      <a
        href="/dashboard/users"
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4 inline-block"
      >
        View Users
      </a>
    </div>
  );
}
  