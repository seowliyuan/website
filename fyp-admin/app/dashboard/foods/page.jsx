"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function FoodsPage() {
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [foodForm, setFoodForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [addingMultiple, setAddingMultiple] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedFoods, setSelectedFoods] = useState(new Set());
  const [statistics, setStatistics] = useState(null);

  const normalizeAltNames = (v) => {
    if (!v || !v.trim()) return null;
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const cleanNum = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  // Fetch statistics
  useEffect(() => {
    api.get("/admin/foods", { params: { page: 1, perPage: 1000 } })
      .then((r) => {
        const allFoods = r?.data?.foods || [];
        const categories = [...new Set(allFoods.map(f => f.category || 'uncategorized'))];
        const totalCalories = allFoods.reduce((sum, f) => sum + (f.kcal_per_100g || 0), 0);
        const avgCalories = allFoods.length > 0 ? Math.round(totalCalories / allFoods.length) : 0;
        
        setStatistics({
          total: allFoods.length,
          categories: categories.length,
          avgCalories,
          categoryCounts: categories.reduce((acc, cat) => {
            acc[cat] = allFoods.filter(f => (f.category || 'uncategorized') === cat).length;
            return acc;
          }, {})
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const t = setTimeout(() => {
      api
        .get("/admin/foods", { params: { page, perPage, q: query } })
        .then((r) => {
          if (cancelled) return;
          const src = r?.data?.source || 'unknown';
          let rows = r?.data?.foods || [];
          // Normalize fields across different sources so the UI renders consistently
          if (src === 'malaysia_food_database') {
            rows = rows.map((f) => ({
              id: f.id,
              name: f.name,
              category: f.category || 'uncategorized',
              alt_names: f.alt_names || null,
              kcal_per_100g: f.kcal_per_100g ?? null,
              protein_g_per_100g: f.protein_g_per_100g ?? null,
              carbs_g_per_100g: f.carbs_g_per_100g ?? null,
              fat_g_per_100g: f.fat_g_per_100g ?? null,
              sugar_g_per_100g: f.sugar_g_per_100g ?? null,
              sodium_mg_per_100g: f.sodium_mg_per_100g ?? null,
            }));
          } else if (src === 'foods') {
            // Already in canonical shape
          } else {
            // Unknown source (e.g., food_logs). Do a best-effort mapping.
            rows = rows.map((f) => ({
              id: f.id,
              name: f.name || f.item_name || 'Unknown',
              category: f.category || 'uncategorized',
              kcal_per_100g: f.kcal_per_100g ?? f.kcal ?? null,
              protein_g_per_100g: f.protein_g_per_100g ?? f.protein_g ?? null,
              carbs_g_per_100g: f.carbs_g_per_100g ?? f.carbs_g ?? null,
              fat_g_per_100g: f.fat_g_per_100g ?? f.fat_g ?? null,
              alt_names: null,
              sugar_g_per_100g: null,
              sodium_mg_per_100g: null,
            }));
          }
          console.log('Foods source:', src, 'count:', rows.length, 'query:', query);
          // If backend search is too broad, apply a precise client-side filter
          if (query && query.trim()) {
            const q = query.trim().toLowerCase();
            rows = rows.filter((f) => {
              const name = (f.name || '').toLowerCase();
              const category = (f.category || '').toLowerCase();
              const altNames = Array.isArray(f.alt_names) ? f.alt_names.map((s) => (s || '').toLowerCase()) : [];
              const inName = name.includes(q);
              const inCategory = category.includes(q);
              const inAlt = altNames.some((s) => s.includes(q));
              return inName || inCategory || inAlt;
            });
          }
          // Deduplicate by name (case-insensitive) to avoid showing repeated items
          if (rows.length) {
            const byName = new Map();
            for (const f of rows) {
              const key = (f.name || '').trim().toLowerCase();
              if (!key) continue;
              if (!byName.has(key)) {
                byName.set(key, f);
              } else {
                // Prefer item with more complete macro data
                const a = byName.get(key);
                const completenessA = ['kcal_per_100g','protein_g_per_100g','carbs_g_per_100g','fat_g_per_100g'].reduce((s,k)=>s + (a[k] != null ? 1 : 0), 0);
                const completenessB = ['kcal_per_100g','protein_g_per_100g','carbs_g_per_100g','fat_g_per_100g'].reduce((s,k)=>s + (f[k] != null ? 1 : 0), 0);
                if (completenessB > completenessA) byName.set(key, f);
              }
            }
            rows = Array.from(byName.values());
          }

          // Apply category filter
          if (categoryFilter) {
            rows = rows.filter(f => (f.category || 'uncategorized').toLowerCase() === categoryFilter.toLowerCase());
          }

          // Apply sorting
          rows.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
              case 'name':
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
                break;
              case 'calories':
                aVal = a.kcal_per_100g ?? 0;
                bVal = b.kcal_per_100g ?? 0;
                break;
              case 'category':
                aVal = (a.category || 'uncategorized').toLowerCase();
                bVal = (b.category || 'uncategorized').toLowerCase();
                break;
              default:
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
            }
            
            if (sortOrder === 'asc') {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
              return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
          });

          setFoods(rows);
          setPagination(r?.data?.pagination ?? null);
        })
        .catch(() => setFoods([]))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [page, perPage, query, categoryFilter, sortBy, sortOrder]);

  const handleDelete = async (food) => {
    if (!confirm(`Delete "${food.name}"? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/admin/foods/${food.id}`);
      setFoods(prev => prev.filter(x => x.id !== food.id));
      setSelectedFoods(prev => {
        const next = new Set(prev);
        next.delete(food.id);
        return next;
      });
    } catch (err) {
      alert("Delete failed: " + (err?.response?.data?.error || err.message));
    }
  };

  const handleDuplicate = (food) => {
    setSelected(null);
    setFoodForm({
      name: `${food.name} (Copy)`,
      category: food.category || "",
      alt_names: Array.isArray(food.alt_names) ? food.alt_names.join(", ") : "",
      kcal_per_100g: food.kcal_per_100g ?? "",
      protein_g_per_100g: food.protein_g_per_100g ?? "",
      carbs_g_per_100g: food.carbs_g_per_100g ?? "",
      fat_g_per_100g: food.fat_g_per_100g ?? "",
      sugar_g_per_100g: food.sugar_g_per_100g ?? "",
      sodium_mg_per_100g: food.sodium_mg_per_100g ?? "",
    });
    setAddingMultiple(false);
    setAddedCount(0);
    setEditOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedFoods.size === 0) return;
    if (!confirm(`Delete ${selectedFoods.size} selected food(s)? This cannot be undone.`)) return;

    try {
      const deletePromises = Array.from(selectedFoods).map(id => 
        api.delete(`/admin/foods/${id}`).catch(err => {
          console.error(`Failed to delete food ${id}:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      setFoods(prev => prev.filter(x => !selectedFoods.has(x.id)));
      setSelectedFoods(new Set());
    } catch (err) {
      alert("Bulk delete failed: " + (err?.response?.data?.error || err.message));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Calories (per 100g)', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Sugar (g)', 'Sodium (mg)', 'Alt Names'];
    const rows = foods.map(f => [
      f.name || '',
      f.category || 'uncategorized',
      f.kcal_per_100g ?? '',
      f.protein_g_per_100g ?? '',
      f.carbs_g_per_100g ?? '',
      f.fat_g_per_100g ?? '',
      f.sugar_g_per_100g ?? '',
      f.sodium_mg_per_100g ?? '',
      Array.isArray(f.alt_names) ? f.alt_names.join('; ') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `foods-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectFood = (foodId) => {
    setSelectedFoods(prev => {
      const next = new Set(prev);
      if (next.has(foodId)) {
        next.delete(foodId);
      } else {
        next.add(foodId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFoods.size === foods.length) {
      setSelectedFoods(new Set());
    } else {
      setSelectedFoods(new Set(foods.map(f => f.id)));
    }
  };

  return (
    <>
      <div className="w-full h-full overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Food Database
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {(foods?.length ?? 0)} items shown{pagination?.total ? ` • ${pagination.total} total` : ''}
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setFoodForm({
                name: "",
                category: "",
                alt_names: "",
                kcal_per_100g: "",
                protein_g_per_100g: "",
                carbs_g_per_100g: "",
                fat_g_per_100g: "",
                sugar_g_per_100g: "",
                sodium_mg_per_100g: "",
              });
              setAddingMultiple(false);
              setAddedCount(0);
              setEditOpen(true);
            }}
            className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-base text-white font-medium bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 transition-all shadow-lg hover:shadow-emerald-500/50 whitespace-nowrap"
          >
            + Add Food
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="admin-card p-4 rounded-xl border border-gray-800">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Total Foods</div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400">{statistics.total}</div>
            </div>
            <div className="admin-card p-4 rounded-xl border border-gray-800">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Categories</div>
              <div className="text-2xl md:text-3xl font-bold text-indigo-400">{statistics.categories}</div>
            </div>
            <div className="admin-card p-4 rounded-xl border border-gray-800">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Avg Calories</div>
              <div className="text-2xl md:text-3xl font-bold text-amber-400">{statistics.avgCalories}</div>
            </div>
            <div className="admin-card p-4 rounded-xl border border-gray-800">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Showing</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-400">{foods.length}</div>
            </div>
          </div>
        )}

        {/* Search, Filter, Sort Bar */}
        <div className="admin-card p-3 md:p-4 rounded-lg mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                value={query} 
                onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} 
                placeholder="Search food by name or category..." 
                className="flex-1 px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-emerald-500 focus:outline-none transition-colors text-sm" 
              />
              {query && (
                <button 
                  onClick={() => { setQuery(""); setPage(1); }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                  title="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filter */}
            {statistics && (
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
              >
                <option value="">All Categories</option>
                {Object.keys(statistics.categoryCounts || {}).sort().map(cat => (
                  <option key={cat} value={cat}>{cat} ({statistics.categoryCounts[cat]})</option>
                ))}
              </select>
            )}

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); }}
              className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="calories">Sort by Calories</option>
              <option value="category">Sort by Category</option>
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
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-white shadow-md hover:shadow-purple-500/25 flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedFoods.size > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span className="text-white font-semibold">{selectedFoods.size}</span> food{selectedFoods.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 hover:border-red-400 text-red-400 text-sm font-medium transition-all"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedFoods(new Set())}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GRID VIEW */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="admin-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : foods.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {/* Select All Checkbox */}
            <div className="col-span-full flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedFoods.size === foods.length && foods.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-700 bg-[#0b1220] text-emerald-500 focus:ring-emerald-500 focus:ring-2"
              />
              <label className="text-sm text-gray-400 cursor-pointer">
                Select All ({foods.length})
              </label>
            </div>

            {foods.map((f) => (
              <div
                key={f.id}
                className={`admin-card rounded-xl p-3 md:p-4 lg:p-5 hover:shadow-lg hover:shadow-emerald-500/10 transition-all border group relative ${
                  selectedFoods.has(f.id) 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-gray-800 hover:border-emerald-500/30'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 right-2">
                  <input
                    type="checkbox"
                    checked={selectedFoods.has(f.id)}
                    onChange={() => toggleSelectFood(f.id)}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0b1220] text-emerald-500 focus:ring-emerald-500 focus:ring-2"
                  />
                </div>
                {/* Food Name */}
                <h3 className="text-base md:text-lg font-semibold mb-1 truncate group-hover:text-emerald-400 transition-colors">
                  {f.name}
                </h3>
                
                {/* Category Badge */}
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 md:mb-3">
                  {f.category || "uncategorized"}
                </div>

                {/* Nutrition Info */}
                <div className="space-y-1 md:space-y-1.5 mb-3 md:mb-4 text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Calories</span>
                    <span className="font-medium text-emerald-400">
                      {f.kcal_per_100g ?? "—"} kcal
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Protein</span>
                    <span className="font-medium">{f.protein_g_per_100g ?? "—"}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Carbs</span>
                    <span className="font-medium">{f.carbs_g_per_100g ?? "—"}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fat</span>
                    <span className="font-medium">{f.fat_g_per_100g ?? "—"}g</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 md:gap-2 pt-2 md:pt-3 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setSelected(f);
                      setViewOpen(true);
                    }}
                    className="flex-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                    title="View details"
                  >
                    View
                  </button>

                  <button
                    onClick={() => {
                      setSelected(f);
                      setFoodForm({
                        name: f.name || "",
                        category: f.category || "",
                        alt_names: Array.isArray(f.alt_names)
                          ? f.alt_names.join(", ")
                          : "",
                        kcal_per_100g: f.kcal_per_100g ?? "",
                        protein_g_per_100g: f.protein_g_per_100g ?? "",
                        carbs_g_per_100g: f.carbs_g_per_100g ?? "",
                        fat_g_per_100g: f.fat_g_per_100g ?? "",
                        sugar_g_per_100g: f.sugar_g_per_100g ?? "",
                        sodium_mg_per_100g: f.sodium_mg_per_100g ?? "",
                      });
                      setEditOpen(true);
                    }}
                    className="flex-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                    title="Edit food"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDuplicate(f)}
                    className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                    title="Duplicate food"
                  >
                    📋
                  </button>

                  <button
                    onClick={() => handleDelete(f)}
                    className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                    title="Delete food"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card rounded-xl p-8 md:p-12 text-center">
            <div className="text-4xl md:text-6xl mb-3 md:mb-4">🍽️</div>
            <p className="text-gray-400 text-base md:text-lg">No foods found</p>
            <p className="text-gray-500 text-xs md:text-sm mt-2">Add your first food item to get started</p>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 md:mt-8 px-2">
          <div className="text-xs md:text-sm text-gray-400">
            Page {page} {pagination?.totalPages ? `of ${pagination.totalPages}` : ""}
          </div>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors font-medium"
            >
              ← Prev
            </button>

            <button
              disabled={pagination?.totalPages && page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors font-medium"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-gradient-to-br from-gray-900 via-[#04050a] to-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden my-4">
            {/* Header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-emerald-400 mb-1 truncate">
                    {selected.name}
                  </h2>
                  <span className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selected.category || "uncategorized"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setViewOpen(false);
                    setSelected(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Macros Card */}
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    Macronutrients (per 100g)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                      <span className="text-gray-300">Calories</span>
                      <span className="font-bold text-emerald-400 text-lg">
                        {selected.kcal_per_100g ?? "—"} kcal
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                      <span className="text-gray-300">Protein</span>
                      <span className="font-bold text-blue-400">
                        {selected.protein_g_per_100g ?? "—"}g
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                      <span className="text-gray-300">Carbohydrates</span>
                      <span className="font-bold text-amber-400">
                        {selected.carbs_g_per_100g ?? "—"}g
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                      <span className="text-gray-300">Fat</span>
                      <span className="font-bold text-purple-400">
                        {selected.fat_g_per_100g ?? "—"}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info Card */}
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                        Sugar
                      </label>
                      <div className="text-lg font-medium">
                        {selected.sugar_g_per_100g ?? "—"}g
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                        Sodium
                      </label>
                      <div className="text-lg font-medium">
                        {selected.sodium_mg_per_100g ?? "—"}mg
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                        Alternative Names
                      </label>
                      <div className="text-sm text-gray-300 leading-relaxed">
                        {Array.isArray(selected.alt_names) && selected.alt_names.length
                          ? selected.alt_names.join(", ")
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-800 bg-gray-900/30 flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  setViewOpen(false);
                  setSelected(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors font-medium text-sm md:text-base order-2 sm:order-1"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewOpen(false);
                  setFoodForm({
                    name: selected.name || "",
                    category: selected.category || "",
                    alt_names: Array.isArray(selected.alt_names)
                      ? selected.alt_names.join(", ")
                      : "",
                    kcal_per_100g: selected.kcal_per_100g ?? "",
                    protein_g_per_100g: selected.protein_g_per_100g ?? "",
                    carbs_g_per_100g: selected.carbs_g_per_100g ?? "",
                    fat_g_per_100g: selected.fat_g_per_100g ?? "",
                    sugar_g_per_100g: selected.sugar_g_per_100g ?? "",
                    sodium_mg_per_100g: selected.sodium_mg_per_100g ?? "",
                  });
                  setEditOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors font-medium text-white text-sm md:text-base order-1 sm:order-2"
              >
                Edit Food
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-gradient-to-br from-gray-900 via-[#04050a] to-gray-900 rounded-2xl shadow-2xl border border-gray-800 my-4 md:my-8">
            {/* Header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent truncate">
                    {selected ? "Edit Food" : addingMultiple ? `Add Food ${addedCount > 0 ? `(${addedCount} added)` : ''}` : "Add New Food"}
                  </h2>
                  {addingMultiple && addedCount > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">
                      {addedCount} food{addedCount !== 1 ? 's' : ''} added in this session
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditOpen(false);
                    setSelected(null);
                    setAddingMultiple(false);
                    setAddedCount(0);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* FORM */}
            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                      Basic Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Food Name *
                        </label>
                        <input
                          value={foodForm.name}
                          onChange={(e) =>
                            setFoodForm((f) => ({ ...f, name: e.target.value }))
                          }
                          placeholder="e.g., Nasi Lemak"
                          className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Category
                        </label>
                        <input
                          value={foodForm.category}
                          onChange={(e) =>
                            setFoodForm((f) => ({ ...f, category: e.target.value }))
                          }
                          placeholder="e.g., main course, drink"
                          className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Alternative Names
                          <span className="text-xs text-gray-500 ml-2">(comma separated)</span>
                        </label>
                        <textarea
                          value={foodForm.alt_names}
                          onChange={(e) =>
                            setFoodForm((f) => ({ ...f, alt_names: e.target.value }))
                          }
                          placeholder="e.g., Coconut Rice, Lemak Rice"
                          rows={3}
                          className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                      Nutrition (per 100g)
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-emerald-400 block mb-2">
                          Calories (kcal)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={foodForm.kcal_per_100g}
                          onChange={(e) =>
                            setFoodForm((f) => ({
                              ...f,
                              kcal_per_100g: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-blue-400 block mb-2">
                            Protein (g)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={foodForm.protein_g_per_100g}
                            onChange={(e) =>
                              setFoodForm((f) => ({
                                ...f,
                                protein_g_per_100g: e.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-amber-400 block mb-2">
                            Carbs (g)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={foodForm.carbs_g_per_100g}
                            onChange={(e) =>
                              setFoodForm((f) => ({
                                ...f,
                                carbs_g_per_100g: e.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-purple-400 block mb-2">
                            Fat (g)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={foodForm.fat_g_per_100g}
                            onChange={(e) =>
                              setFoodForm((f) => ({
                                ...f,
                                fat_g_per_100g: e.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-pink-400 block mb-2">
                            Sugar (g)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={foodForm.sugar_g_per_100g}
                            onChange={(e) =>
                              setFoodForm((f) => ({
                                ...f,
                                sugar_g_per_100g: e.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-orange-400 block mb-2">
                          Sodium (mg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={foodForm.sodium_mg_per_100g}
                          onChange={(e) =>
                            setFoodForm((f) => ({
                              ...f,
                              sodium_mg_per_100g: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full p-3 bg-[#02030a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-800 bg-gray-900/30">
              {addingMultiple && addedCount > 0 ? (
                // Multi-add mode: Show "Add Another" and "Done" buttons
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-emerald-400 font-medium">
                    ✓ {addedCount} food{addedCount !== 1 ? 's' : ''} added successfully
                  </div>
                  <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setEditOpen(false);
                        setSelected(null);
                        setAddingMultiple(false);
                        setAddedCount(0);
                      }}
                      className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors font-medium text-sm md:text-base"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => {
                        // Clear form for next food
                        setFoodForm({
                          name: "",
                          category: "",
                          alt_names: "",
                          kcal_per_100g: "",
                          protein_g_per_100g: "",
                          carbs_g_per_100g: "",
                          fat_g_per_100g: "",
                          sugar_g_per_100g: "",
                          sodium_mg_per_100g: "",
                        });
                        setSelected(null);
                      }}
                      className="flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 transition-all shadow-lg hover:shadow-indigo-500/50 font-medium text-white text-sm md:text-base flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Another
                    </button>
                  </div>
                </div>
              ) : (
                // Normal mode: Show Cancel and Save/Create buttons
                <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
                  <button
                    onClick={() => {
                      setEditOpen(false);
                      setSelected(null);
                      setAddingMultiple(false);
                      setAddedCount(0);
                    }}
                    className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors font-medium text-sm md:text-base"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={saving || !foodForm.name}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const payload = {
                          name: foodForm.name || null,
                          category: foodForm.category || null,
                          alt_names: normalizeAltNames(foodForm.alt_names),
                          kcal_per_100g: cleanNum(foodForm.kcal_per_100g),
                          protein_g_per_100g: cleanNum(foodForm.protein_g_per_100g),
                          carbs_g_per_100g: cleanNum(foodForm.carbs_g_per_100g),
                          fat_g_per_100g: cleanNum(foodForm.fat_g_per_100g),
                          sugar_g_per_100g: cleanNum(foodForm.sugar_g_per_100g),
                          sodium_mg_per_100g: cleanNum(foodForm.sodium_mg_per_100g),
                        };

                        if (selected && selected.id) {
                          // Editing existing food
                          const r = await api.put(`/admin/foods/${selected.id}`, payload);
                          const updated = r?.data?.food;
                          setFoods((prev) =>
                            prev.map((x) => (x.id === updated.id ? updated : x))
                          );
                          setEditOpen(false);
                          setSelected(null);
                        } else {
                          // Creating new food
                          const r = await api.post(`/admin/foods/malaysia`, payload);
                          const newFood = r?.data?.food;
                          setFoods((prev) => [newFood, ...prev]);
                          
                          // Always enter multi-add mode after creating first food
                          setAddingMultiple(true);
                          setAddedCount(prev => prev + 1);
                          
                          // Clear form for next food
                          setFoodForm({
                            name: "",
                            category: "",
                            alt_names: "",
                            kcal_per_100g: "",
                            protein_g_per_100g: "",
                            carbs_g_per_100g: "",
                            fat_g_per_100g: "",
                            sugar_g_per_100g: "",
                            sodium_mg_per_100g: "",
                          });
                          // Keep modal open for next food
                        }
                      } catch (err) {
                        console.error("API ERROR:", err?.response?.data || err);
                        alert("Save failed: " + (err?.response?.data?.error || err.message));
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={`px-5 md:px-6 py-2 md:py-2.5 rounded-lg font-medium text-white transition-all shadow-lg text-sm md:text-base order-1 sm:order-3 ${
                      saving || !foodForm.name
                        ? "bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 hover:shadow-emerald-500/50"
                    }`}
                  >
                    {saving ? "Saving..." : selected ? "Save Changes" : "Create Food"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
