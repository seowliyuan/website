"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function UserListPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000") + "/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total users</div>
          <div className="text-2xl font-bold mb-2">{users.length}</div>
          <div className="text-sm text-gray-600">Average height: {average(users.map(u => u.height_cm)).toFixed(1)} cm</div>
          <div className="text-sm text-gray-600">Average weight: {average(users.map(u => u.weight_kg)).toFixed(1)} kg</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Goals distribution</div>
          <div style={{ height: 200 }} className="w-full mt-2">
            {users.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={buildGoalData(users)}
                    innerRadius={50}
                    outerRadius={80}
                    label
                  >
                    {buildGoalData(users).map((entry, idx) => (
                      <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-600">No data</div>
            )}
          </div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Height</th>
            <th className="border p-2">Weight</th>
            <th className="border p-2">Goal</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.user_id} className="text-center">
              <td className="border p-2">{u.full_name}</td>
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.height_cm}</td>
              <td className="border p-2">{u.weight_kg}</td>
              <td className="border p-2">{u.goal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// helper functions
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#a4de6c"];

function buildGoalData(users) {
  const counts = {};
  users.forEach((u) => {
    const k = u.goal || "unknown";
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
}

function average(arr) {
  const nums = arr.filter((n) => typeof n === "number");
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

