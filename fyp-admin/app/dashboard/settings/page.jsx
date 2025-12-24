// "use client";

// import { useState, useEffect } from "react";
// import { api } from "../../../lib/api";
// import Toast from "../../../components/Toast";

// export default function SettingsPage() {
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [settings, setSettings] = useState({
//     app_name: "",
//     maintenance_mode: false,
//     allow_registration: true,
//     max_file_size: 10,
//     session_timeout: 60,
//     email_notifications: true,
//   });

//   useEffect(() => {
//     // Fetch current settings
//     api.get("/admin/settings")
//       .then((r) => {
//         if (r?.data?.settings) {
//           setSettings(r.data.settings);
//         }
//       })
//       .catch((err) => {
//         // Settings endpoint might not exist yet (404), use defaults
//         if (err?.response?.status !== 404) {
//           console.error("Error fetching settings:", err);
//         }
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const handleSave = async () => {
//     setSaving(true);
//     try {
//       await api.put("/admin/settings", settings);
//       setToast({ message: "Settings saved successfully!", type: "success" });
//     } catch (err) {
//       if (err?.response?.status === 404) {
//         setToast({ 
//           message: "Settings endpoint not implemented yet. Please add POST/PUT /admin/settings to your backend.", 
//           type: "error" 
//         });
//       } else {
//         setToast({ message: "Failed to save settings", type: "error" });
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="w-full h-full flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="mb-6">
//           <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
//             System Settings
//           </h1>
//           <p className="text-sm text-gray-400 mt-1">Configure system-wide settings and preferences</p>
//         </div>

//         {/* General Settings */}
//         <div className="admin-card p-6 rounded-xl border border-gray-800 mb-6">
//           <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
//             <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             General Settings
//           </h2>
          
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Application Name
//               </label>
//               <input
//                 type="text"
//                 value={settings.app_name}
//                 onChange={(e) => setSettings({...settings, app_name: e.target.value})}
//                 className="w-full px-4 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors"
//                 placeholder="My Admin Panel"
//               />
//             </div>

//             <div className="flex items-center justify-between p-4 rounded-lg bg-[#0b1220] border border-gray-800">
//               <div>
//                 <div className="text-sm font-medium text-gray-300">Maintenance Mode</div>
//                 <div className="text-xs text-gray-500 mt-1">Disable public access to the application</div>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={settings.maintenance_mode}
//                   onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
//                   className="sr-only peer"
//                 />
//                 <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>

//             <div className="flex items-center justify-between p-4 rounded-lg bg-[#0b1220] border border-gray-800">
//               <div>
//                 <div className="text-sm font-medium text-gray-300">Allow New Registrations</div>
//                 <div className="text-xs text-gray-500 mt-1">Enable or disable user registration</div>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={settings.allow_registration}
//                   onChange={(e) => setSettings({...settings, allow_registration: e.target.checked})}
//                   className="sr-only peer"
//                 />
//                 <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Security Settings */}
//         <div className="admin-card p-6 rounded-xl border border-gray-800 mb-6">
//           <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
//             <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//             </svg>
//             Security Settings
//           </h2>
          
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Session Timeout (minutes)
//               </label>
//               <input
//                 type="number"
//                 value={settings.session_timeout}
//                 onChange={(e) => setSettings({...settings, session_timeout: parseInt(e.target.value) || 60})}
//                 className="w-full px-4 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors"
//                 min="5"
//                 max="480"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Max File Upload Size (MB)
//               </label>
//               <input
//                 type="number"
//                 value={settings.max_file_size}
//                 onChange={(e) => setSettings({...settings, max_file_size: parseInt(e.target.value) || 10})}
//                 className="w-full px-4 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors"
//                 min="1"
//                 max="100"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Notification Settings */}
//         <div className="admin-card p-6 rounded-xl border border-gray-800 mb-6">
//           <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
//             <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//             </svg>
//             Notification Settings
//           </h2>
          
//           <div className="space-y-4">
//             <div className="flex items-center justify-between p-4 rounded-lg bg-[#0b1220] border border-gray-800">
//               <div>
//                 <div className="text-sm font-medium text-gray-300">Email Notifications</div>
//                 <div className="text-xs text-gray-500 mt-1">Receive email alerts for important events</div>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={settings.email_notifications}
//                   onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
//                   className="sr-only peer"
//                 />
//                 <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Save Button */}
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={handleSave}
//             disabled={saving}
//             className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {saving ? "Saving..." : "Save Settings"}
//           </button>
//         </div>
//       </div>

//       {toast && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={() => setToast(null)}
//         />
//       )}
//     </div>
//   );
// }

