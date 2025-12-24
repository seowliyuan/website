"use client";

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

export default function ApkPage(){
  const [versions, setVersions] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    version: '',
    github_url: '',
    file_size: '',
    release_notes: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/admin/apks', { params: { page, perPage } }).then(r => {
      if (cancelled) return;
      setVersions(r?.data?.apks || []);
    }).catch(() => setVersions([])).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, perPage]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.version || !uploadForm.github_url) {
      alert('Version and GitHub URL are required');
      return;
    }
    
    setUploading(true);
    try {
      const response = await api.post('/admin/apks', uploadForm);
      if (response.data.success) {
        setVersions(prev => [response.data.apk, ...prev]);
        setShowUploadForm(false);
        setUploadForm({ version: '', github_url: '', file_size: '', release_notes: '' });
        alert('APK version added successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to add APK version');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (apk) => {
    if (!apk.github_url) {
      alert('No download URL available');
      return;
    }
    
    // Track download
    try {
      await api.post(`/admin/apks/${apk.id}/download`);
      // Update local state
      setVersions(prev => prev.map(v => 
        v.id === apk.id ? { ...v, downloads: (v.downloads || 0) + 1 } : v
      ));
    } catch (err) {
      console.error('Download tracking error:', err);
    }
    
    // Open download URL
    window.open(apk.github_url, '_blank');
  };

  return (
    <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">APK Management</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Upload / view APK versions and provide download / QR code links</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowUploadForm(!showUploadForm)} 
            className="px-4 py-2 bg-gradient-to-tr from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded text-white transition-all"
          >
            {showUploadForm ? 'Cancel' : 'Add APK'}
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="admin-card p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Add New APK Version</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Version *</label>
                <input
                  type="text"
                  placeholder="e.g., 1.0.0"
                  value={uploadForm.version}
                  onChange={(e) => setUploadForm({...uploadForm, version: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">File Size</label>
                <input
                  type="text"
                  placeholder="e.g., 25.3 MB"
                  value={uploadForm.file_size}
                  onChange={(e) => setUploadForm({...uploadForm, file_size: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">GitHub Release URL *</label>
              <input
                type="url"
                placeholder="https://github.com/username/repo/releases/download/v1.0.0/app.apk"
                value={uploadForm.github_url}
                onChange={(e) => setUploadForm({...uploadForm, github_url: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your APK to GitHub Releases and paste the download URL here
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Release Notes</label>
              <textarea
                placeholder="What's new in this version..."
                value={uploadForm.release_notes}
                onChange={(e) => setUploadForm({...uploadForm, release_notes: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded transition-all disabled:opacity-50"
              >
                {uploading ? 'Adding...' : 'Add APK Version'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadForm({ version: '', github_url: '', file_size: '', release_notes: '' });
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card p-4 rounded-lg overflow-hidden">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left border-b border-gray-800">
              <th className="p-3">Version</th>
              <th className="p-3">Uploaded</th>
              <th className="p-3">Size</th>
              <th className="p-3">Downloads</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-gray-400">Loading...</td></tr>
              ) : versions.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-gray-400">No APKs uploaded yet.</td></tr>
              ) : (
                versions.map(v => (
                  <tr key={v.id || v.version} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3">
                      <div className="font-medium text-white">{v.version}</div>
                      {v.release_notes && (
                        <div className="text-xs text-gray-400 mt-1">{v.release_notes.slice(0, 50)}{v.release_notes.length > 50 ? '...' : ''}</div>
                      )}
                    </td>
                    <td className="p-3">{v.created_at ? new Date(v.created_at).toLocaleString() : '—'}</td>
                    <td className="p-3">{v.file_size || '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 text-sm">
                        {v.downloads || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDownload(v)} 
                          className="px-3 py-1 rounded border border-gray-700 hover:bg-gray-700 text-white transition-all"
                        >
                          Download
                        </button>
                        <button 
                          onClick={async() => { 
                            if (!v.id) return alert('Missing ID'); 
                            if (!confirm('Delete this APK version?')) return;
                            try { 
                              await api.delete(`/admin/apks/${v.id}`); 
                              setVersions(prev => prev.filter(x => x.id !== v.id)); 
                            } catch (e) { 
                              console.error(e); 
                              alert('Failed to delete'); 
                            } 
                          }} 
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
