const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../services/supabase.js");
const { logActivity, getAdminInfo } = require("../utils/activityLogger.js");

console.log("ADMIN ROUTER LOADED");

router.get("/__test", (req, res) => {
  res.send("Admin Router OK");
});

// GET /admin/summary — system totals for dashboard
router.get('/summary', async (req, res) => {
  try {
    let totalUsers = 0;
    let totalFoods = 0;

    // Count users in profiles
    try {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      totalUsers = typeof count === 'number' ? count : 0;
    } catch {}

    // Prefer malaysia_food_database for foods, fallback to foods
    try {
      const { count, error } = await supabaseAdmin
        .from('malaysia_food_database')
        .select('*', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        totalFoods = count;
      } else {
        const { count: c2 } = await supabaseAdmin
          .from('foods')
          .select('*', { count: 'exact', head: true });
        totalFoods = typeof c2 === 'number' ? c2 : 0;
      }
    } catch {
      try {
        const { count: c2 } = await supabaseAdmin
          .from('foods')
          .select('*', { count: 'exact', head: true });
        totalFoods = typeof c2 === 'number' ? c2 : 0;
      } catch {}
    }

    return res.json({ success: true, summary: { total_users: totalUsers, total_foods: totalFoods } });
  } catch (err) {
    console.error('GET /admin/summary error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/metrics/last7 — daily counts for the last 7 days
router.get('/metrics/last7', async (req, res) => {
  try {
    console.log('\n=== Fetching Last 7 Days Metrics ===');
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      days.push({ date: dateStr, startDate: dateStr, endDate: dateStr });
    }

    const metrics = [];

    for (const day of days) {
      console.log(`\nChecking ${day.date}`);
      
      let users = 0;
      try {
        // Query profiles table using date truncation to match any time on that day
        const { count, error, data } = await supabaseAdmin
          .from('profiles')
          .select('user_id,created_at', { count: 'exact' })
          .gte('created_at', `${day.startDate}T00:00:00`)
          .lte('created_at', `${day.endDate}T23:59:59`);
        
        console.log(`  Users query - count: ${count}, error:`, error?.message || 'none');
        users = typeof count === 'number' ? count : 0;
      } catch (e) {
        console.log('  Users error:', e.message);
      }

      let foods = 0;
      try {
        const { count, error } = await supabaseAdmin
          .from('malaysia_food_database')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${day.startDate}T00:00:00`)
          .lte('created_at', `${day.endDate}T23:59:59`);
        
        console.log(`  Foods query - count: ${count}, error:`, error?.message || 'none');
        foods = typeof count === 'number' ? count : 0;
      } catch (e) {
        console.log('  Foods error:', e.message);
      }

      console.log(`  Result: ${users} users, ${foods} foods`);
      metrics.push({ date: day.date, users, foods });
    }

    console.log('\n=== Final Metrics ===');
    console.log(JSON.stringify(metrics, null, 2));
    return res.json({ success: true, metrics });
  } catch (err) {
    console.error('GET /admin/metrics/last7 error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/foods — search + pagination from Supabase tables
router.get('/foods', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '12', 10));
    const q = (req.query.q || '').trim();

    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    const searchIlike = (query) => query.replace(/%/g, '\\%').replace(/'/g, "\\'");

    // Prefer malaysia_food_database if available, else fallback to foods
    let source = 'malaysia_food_database';
    let table = 'malaysia_food_database';

    let baseQuery = supabaseAdmin
      .from(table)
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (q) {
      const safeQ = searchIlike(q);
      // Try matching name, category, and alt_names (if stored as text)
      baseQuery = baseQuery.or(`name.ilike.%${safeQ}%,category.ilike.%${safeQ}%,alt_names.ilike.%${safeQ}%`);
    }

    let { data, error, count } = await baseQuery.range(start, end);

    // Fallback to generic foods table if first table not present or error
    if (error) {
      source = 'foods';
      table = 'foods';
      let q2 = supabaseAdmin
        .from(table)
        .select('*', { count: 'exact' })
        .order('name', { ascending: true });
      if (q) {
        const safeQ = searchIlike(q);
        q2 = q2.or(`name.ilike.%${safeQ}%,category.ilike.%${safeQ}%,alt_names.ilike.%${safeQ}%`);
      }
      const res2 = await q2.range(start, end);
      data = res2.data;
      error = res2.error;
      count = res2.count;
    }

    if (error) {
      // If both fail, return empty results gracefully
      return res.json({ success: true, foods: [], source: 'unknown', pagination: { total: 0, page, perPage, totalPages: 1 } });
    }

    const total = typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return res.json({ success: true, foods: data || [], source, pagination: { total, page, perPage, totalPages } });
  } catch (err) {
    console.error('GET /admin/foods error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// GET /admin/users — supports pagination and simple search
router.get("/users", async (req, res) => {
  try {
    console.log('GET /admin/users - Query params:', req.query);
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '20', 10));
    const q = (req.query.q || '').trim();
    const goal = (req.query.goal || '').trim();
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    // Build base query with sorting (email is in auth.users, not profiles)
    const validSortColumns = ['created_at', 'full_name', 'bmi'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    console.log('Sort by:', sortColumn, 'Order:', sortOrder);
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply search filter (only full_name and user_id since email is not in profiles)
    if (q) {
      const safeQ = q.replace(/%/g, '\\%').replace(/'/g, "\\'");
      const orParts = [`full_name.ilike.%${safeQ}%`];
      if (/^[0-9a-fA-F-]{36,}$/.test(q)) orParts.push(`user_id.eq.${q}`);
      query = query.or(orParts.join(','));
    }

    // Apply goal filter (exact match for proper capitalization like "Lose Weight", "Gain Muscle", etc.)
    if (goal) {
      query = query.eq('goal', goal);
    }

    // Execute the range query which returns rows and count
    const { data, error, count } = await query.range(start, end);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(400).json({ error: error.message });
    }

    const total = typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
    const totalPages = Math.ceil(total / perPage) || 1;

    res.json({ success: true, users: data || [], pagination: { total, page, perPage, totalPages } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /admin/users/export/csv - export all users to CSV
router.get('/users/export/csv', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const goal = (req.query.goal || '').trim();

    // Build query without pagination
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters (email is in auth.users, not profiles)
    if (q) {
      const safeQ = q.replace(/%/g, '\\%').replace(/'/g, "\\'");
      const orParts = [`full_name.ilike.%${safeQ}%`];
      if (/^[0-9a-fA-F-]{36,}$/.test(q)) orParts.push(`user_id.eq.${q}`);
      query = query.or(orParts.join(','));
    }

    if (goal) {
      query = query.ilike('goal', goal);
    }

    const { data, error } = await query.limit(10000); // Max 10k records for export

    if (error) return res.status(400).json({ error: error.message });

    // Generate CSV
    const users = data || [];
    const headers = ['User ID', 'Full Name', 'Email', 'Goal', 'Height (cm)', 'Weight (kg)', 'BMI', 'Created At', 'Status'];
    const csvRows = [headers.join(',')];

    users.forEach(user => {
      const row = [
        user.user_id || '',
        `"${(user.full_name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        `"${(user.goal || '').replace(/"/g, '""')}"`,
        user.height_cm || '',
        user.weight_kg || '',
        user.bmi || '',
        user.created_at || '',
        user.disabled ? 'Disabled' : 'Active'
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/users/:id - fetch single user profile
router.get('/users/:id', async (req, res) => {
  const id = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error) return res.status(404).json({ error: error.message });
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /admin/users/:id - update user profile fields
router.put('/users/:id', async (req, res) => {
  const id = req.params?.id;
  const payload = req.body || {};
  console.log('PUT /users/:id - Received payload:', JSON.stringify(payload, null, 2));
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  // allow only a small, safe set of updatable fields (email is in auth.users, not profiles)
  const allowed = ['full_name', 'goal', 'height_cm', 'weight_kg', 'bmi'];
  const updates = {};
  for (const k of allowed) if (Object.prototype.hasOwnProperty.call(payload, k)) updates[k] = payload[k];

  console.log('Filtered updates:', JSON.stringify(updates, null, 2));

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('user_id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    
    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'user_updated',
      `User ${data.full_name || data.user_id} updated`,
      admin.admin_id,
      admin.admin_name,
      { user_id: id, updated_fields: Object.keys(updates) }
    );
    
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/users/:id/reset-password - request a password reset (safe server-side flag)
router.post('/users/:id/reset-password', async (req, res) => {
  const id = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  try {
    const payload = {
      force_password_reset: true,
      reset_requested_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('profiles').update(payload).eq('user_id', id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, message: 'Password reset requested', user: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/users/:id/disable
router.post('/users/:id/disable', async (req, res) => {
  const id = req.params?.id;
  console.log('Disabling user:', id);
  if (!id) return res.status(400).json({ error: 'Missing user id' });
  try {
    const { data, error } = await supabaseAdmin.from('profiles').update({ disabled: true }).eq('user_id', id).select().single();
    if (error) {
      console.error('Disable error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'user_disabled',
      `User ${data.full_name || data.user_id} disabled`,
      admin.admin_id,
      admin.admin_name,
      { user_id: id }
    );
    
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/users/:id/enable
router.post('/users/:id/enable', async (req, res) => {
  const id = req.params?.id;
  console.log('Enabling user:', id);
  if (!id) return res.status(400).json({ error: 'Missing user id' });
  try {
    const { data, error } = await supabaseAdmin.from('profiles').update({ disabled: false }).eq('user_id', id).select().single();
    if (error) {
      console.error('Enable error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'user_enabled',
      `User ${data.full_name || data.user_id} enabled`,
      admin.admin_id,
      admin.admin_name,
      { user_id: id }
    );
    
    return res.json({ success: true, user: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/users/:id/activity - get user activity stats (streak, points, scans, logs)
router.get('/users/:id/activity', async (req, res) => {
  const id = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  try {
    // Get user profile with streak and points (check_in_streak is the actual column name)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('check_in_streak, points')
      .eq('user_id', id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Return default values if profile not found
      return res.json({
        success: true,
        streak: 0,
        points: 0,
        total_scans: 0,
        total_foods_logged: 0
      });
    }

    // Try to count AI recognitions/scans
    let totalScans = 0;
    try {
      const recognitionTables = ['recognitions', 'ai_recognitions', 'ai_logs', 'image_recognitions'];
      for (const table of recognitionTables) {
        try {
          const { count, error } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);
          
          if (!error && typeof count === 'number') {
            totalScans = count;
            break;
          }
        } catch (e) {
          // Table doesn't exist, try next
        }
      }
    } catch (e) {
      console.error('Scan count error:', e);
    }

    // Try to count food logs
    let totalFoodsLogged = 0;
    try {
      const foodLogTables = ['food_logs', 'user_food_logs', 'meal_logs'];
      for (const table of foodLogTables) {
        try {
          const { count, error } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);
          
          if (!error && typeof count === 'number') {
            totalFoodsLogged = count;
            break;
          }
        } catch (e) {
          // Table doesn't exist, try next
        }
      }
    } catch (e) {
      console.error('Food log count error:', e);
    }

    return res.json({
      success: true,
      streak: profile?.check_in_streak || 0,
      points: profile?.points || 0,
      total_scans: totalScans,
      total_foods_logged: totalFoodsLogged
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/users/:id/logs - get user's recent activity logs
router.get('/users/:id/logs', async (req, res) => {
  const id = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  console.log('\n=== Fetching logs for user:', id);

  try {
    let recentLogs = [];
    let recentRecognitions = [];

    // Try to fetch recent food logs and enrich with food details
    const foodLogTables = ['food_logs', 'user_food_logs', 'meal_logs'];
    for (const table of foodLogTables) {
      try {
        console.log(`Trying table: ${table}`);
        const { data: logs, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        console.log(`Table ${table} result:`, { found: logs?.length || 0, error: error?.message });
        
        if (!error && logs && logs.length > 0) {
          console.log(`Found ${logs.length} logs in ${table}, raw data:`, JSON.stringify(logs[0], null, 2));
          
          // Enrich logs with food details from malaysia_food_database
          const enrichedLogs = await Promise.all(logs.map(async (log) => {
            console.log('Processing log:', { 
              item_name: log.item_name, 
              food_name: log.food_name, 
              kcal: log.kcal,
              all_fields: Object.keys(log)
            });
            
            // Use item_name as the base food name, or try food_name field
            let foodName = log.item_name || log.food_name || 'Unknown Food';
            let calories = log.kcal || log.calories || null;
            
            // Validate calories - flag unrealistic values (likely data errors)
            // Normal food items should be between 0-2000 calories per serving
            // If calories > 2000, it's likely a data error (wrong unit, typo, etc.)
            const MAX_REASONABLE_CALORIES = 2000;
            if (calories && calories > MAX_REASONABLE_CALORIES) {
              console.warn(`⚠️ Unrealistic calorie value detected: ${calories} cal for "${foodName}". This might be a data error.`);
              // Don't set to null, but log a warning - admin can see the issue
            }
            
            // Try to get more details from malaysia_food_database if we have an item_name
            if (log.item_name) {
              try {
                const { data: foodList, error: foodError } = await supabaseAdmin
                  .from('malaysia_food_database')
                  .select('name, kcal_per_100g')
                  .ilike('name', `%${log.item_name}%`)
                  .limit(1);
                
                if (!foodError && foodList && foodList.length > 0) {
                  const foodData = foodList[0];
                  // Use database name if found, otherwise keep item_name
                  foodName = foodData.name || foodName;
                  console.log('Found food in database:', foodData.name);
                  // If log doesn't have calories, estimate from database
                  // If log has unrealistic calories (>2000), use database value as correction
                  if ((!calories || (calories && calories > MAX_REASONABLE_CALORIES)) && foodData.kcal_per_100g) {
                    const dbCalories = Math.round(foodData.kcal_per_100g);
                    if (calories && calories > MAX_REASONABLE_CALORIES) {
                      console.log(`Correcting unrealistic calories ${calories} → ${dbCalories} for "${foodName}"`);
                    }
                    calories = dbCalories;
                  }
                } else {
                  console.log('Food not found in database for:', log.item_name, '- using item_name directly');
                }
              } catch (e) {
                console.error('Error looking up food:', e.message);
              }
            } else {
              console.log('No item_name in log');
            }
            
            const result = {
              id: log.id,
              user_id: log.user_id,
              food_name: foodName,
              calories: calories,
              logged_at: log.eaten_at || log.created_at,
              created_at: log.created_at
            };
            
            console.log('Returning enriched log:', result);
            return result;
          }));
          
          recentLogs = enrichedLogs;
          break;
        }
      } catch (e) {
        // Table doesn't exist, try next
      }
    }

    // Try to fetch recent AI recognitions
    const recognitionTables = ['recognitions', 'ai_recognitions', 'ai_logs', 'image_recognitions'];
    for (const table of recognitionTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!error && data && data.length > 0) {
          recentRecognitions = data;
          break;
        }
      } catch (e) {
        // Table doesn't exist, try next
      }
    }

    return res.json({
      success: true,
      logs: recentLogs,
      recognitions: recentRecognitions
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/login - validate a Supabase access token and check is_admin on the profiles table
router.post("/login", async (req, res) => {
  const token = req.body?.token;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const {
      data: { user },
      error: getUserErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (getUserErr || !user) return res.status(401).json({ error: "Invalid token" });

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (profileErr) return res.status(500).json({ error: profileErr.message });

    if (!profile?.is_admin) return res.status(403).json({ error: "Not an admin" });

    // Log admin login
    await logActivity(
      'login',
      `Admin logged in: ${user.email}`,
      user.id,
      user.email || 'Admin',
      { user_id: user.id }
    );

    // success — return user id and a flag. Optionally, create server-side session here.
    return res.json({ success: true, user_id: user.id, is_admin: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /admin/stats - return aggregated metrics to power the admin dashboard
router.get("/stats", async (req, res) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, created_at, is_admin, completed_onboarding, goal, bmi");

    if (error) return res.status(400).json({ error: error.message });

    // total users
    const total = profiles.length;

    // kyc/onboarded counts
    const onboarded = profiles.filter((p) => p.completed_onboarding).length;

    // goals distribution
    const goals = {};
    profiles.forEach((p) => {
      const g = p.goal || "unknown";
      goals[g] = (goals[g] || 0) + 1;
    });

    // signups over the last 7 days
    const now = new Date();
    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000); // 6 days ago to today
      const dateStr = d.toISOString().slice(0, 10);
      const count = profiles.filter((p) => p.created_at && p.created_at.slice(0, 10) === dateStr).length;
      return { date: dateStr, count };
    });

    // avg BMI
    const bmiValues = profiles.map((p) => p.bmi).filter((n) => typeof n === 'number');
    const avgBmi = bmiValues.length ? (bmiValues.reduce((s, n) => s + n, 0) / bmiValues.length) : null;

    return res.json({ success: true, stats: { total, onboarded, goals, signup_trend: last7, avgBmi } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/summary - light-weight summary counters used by admin dashboard
router.get('/summary', async (req, res) => {
  try {
    // For now we'll fetch users (profiles) count and provide stubbed values for other metrics
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from('profiles')
      .select('user_id');

    if (profilesErr) return res.status(400).json({ error: profilesErr.message });

    // Try to count foods table if present; fall back to other food-like tables we found in your Supabase
    let totalFoods = 0;
    try {
      // prefer canonical 'foods' table
      const attempt = async (table) => {
        try {
          const { data, error, count } = await supabaseAdmin.from(table).select('id', { count: 'exact' }).range(0, 0);
          if (error) return null;
          // if count provided use it, else if data non-empty assume at least 1
          return typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
        } catch (e) {
          return null;
        }
      };

      totalFoods = (await attempt('foods')) ?? (await attempt('malaysia_food_database')) ?? (await attempt('food_logs')) ?? 0;
    } catch (e) {
      // ignore - table may not exist in dev DB
    }

    // daily_checkins and recognitions_today are app-specific metrics; we provide safe defaults here
    // In your real app, you can replace these queries with proper event tables
    const dailyCheckins = 12; // stubbed
    const recognitionsToday = 3; // stubbed

    return res.json({ success: true, summary: {
      total_users: profiles?.length ?? 0,
      total_foods: totalFoods,
      daily_checkins: dailyCheckins,
      recognitions_today: recognitionsToday
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/system-health - quick health checks for external services
router.get('/system-health', async (req, res) => {
  try {
    // We'll return simple OK/FAIL states. Replace with real checks as needed.
    const now = new Date();

    // Server ping is always OK if this route is reachable
    const server = { status: 'ok', lastChecked: now.toISOString() };

    // Gemini API check (stubbed) — replace with real remote call if you have an API key
    const gemini = { status: process.env.GEMINI_API_OK === 'false' ? 'down' : 'ok', lastChecked: now.toISOString() };

    // TFLite model check — if we can read a model file path, it's ok; otherwise we'll default to ok
    const tflite = { status: 'ok', lastChecked: now.toISOString() };

    return res.json({ success: true, health: { server, gemini, tflite } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* AI Recognition logs admin API */

// Helper: candidate recognition table names we'll try in order
const recognitionTables = ['recognitions', 'ai_recognitions', 'ai_logs', 'image_recognitions', 'recognition_logs'];

// GET /admin/recognitions - paginated listing with simple filters
router.get('/recognitions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '20', 10));
    const q = (req.query.q || '').trim();
    const user_id = (req.query.user_id || '').trim();
    const model = (req.query.model || '').trim();
    const from = req.query.from;
    const to = req.query.to;
    const minConfidence = req.query.minConfidence ? parseFloat(req.query.minConfidence) : null;

    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    const selectCols = 'id, user_id, user_email, label, confidence, model, image_url, created_at, timestamp';

    // Try candidate tables in order until one works
    for (const t of recognitionTables) {
      try {
        let query = supabaseAdmin.from(t).select(selectCols, { count: 'exact' }).order('created_at', { ascending: false });

        if (q) {
          // search label or user_email
          const safeQ = q.replace(/%/g, '\\%').replace(/'/g, "\\'");
          query = query.or([`label.ilike.%${safeQ}%`, `user_email.ilike.%${safeQ}%`].join(','));
        }

        if (user_id) query = query.eq('user_id', user_id);
        if (model) query = query.eq('model', model);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);
        if (minConfidence !== null && !Number.isNaN(minConfidence)) query = query.gte('confidence', minConfidence);

        const { data, error, count } = await query.range(start, end);
        if (error) throw error; // fall through to next candidate table

        const total = typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
        return res.json({ success: true, logs: data || [], pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) || 1 } });
      } catch (e) {
        // table might not exist — try next candidate
        // console.debug('table', t, 'failed', e?.message || e);
        continue;
      }
    }

    // None of the expected tables exist — return safe empty result
    return res.json({ success: true, logs: [], pagination: { total: 0, page, perPage, totalPages: 1 }, message: 'No recognition tables found in DB' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/recognitions/:id - fetch single recognition record by id
router.get('/recognitions/:id', async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const selectCols = 'id, user_id, user_email, label, confidence, model, image_url, created_at, timestamp, metadata';

    for (const t of recognitionTables) {
      try {
        const { data, error } = await supabaseAdmin.from(t).select(selectCols).eq('id', id).single();
        if (!error && data) return res.json({ success: true, log: data });
      } catch (e) {
        continue;
      }
    }

    return res.status(404).json({ error: 'Recognition record not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/recognitions/export - CSV export of recognition logs (filters supported)
router.get('/recognitions/export', async (req, res) => {
  try {
    // We'll honor the same filters as /recognitions. Export size capped to keep server safe.
    const q = (req.query.q || '').trim();
    const user_id = (req.query.user_id || '').trim();
    const model = (req.query.model || '').trim();
    const from = req.query.from;
    const to = req.query.to;
    const minConfidence = req.query.minConfidence ? parseFloat(req.query.minConfidence) : null;

    // reasonable cap to avoid huge exports
    const limit = Math.min(10000, Math.max(100, parseInt(req.query.limit || '1000', 10)));

    const selectCols = 'id, user_id, user_email, label, confidence, model, image_url, created_at, timestamp';

    for (const t of recognitionTables) {
      try {
        let query = supabaseAdmin.from(t).select(selectCols).order('created_at', { ascending: false }).limit(limit);

        if (q) {
          const safeQ = q.replace(/%/g, '\\%').replace(/'/g, "\\'");
          query = query.or([`label.ilike.%${safeQ}%`, `user_email.ilike.%${safeQ}%`].join(','));
        }
        if (user_id) query = query.eq('user_id', user_id);
        if (model) query = query.eq('model', model);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);
        if (minConfidence !== null && !Number.isNaN(minConfidence)) query = query.gte('confidence', minConfidence);

        const { data, error } = await query;
        if (error) throw error;

        // Assemble CSV
        const rows = data || [];
        const header = ['id', 'user_id', 'user_email', 'label', 'confidence', 'model', 'image_url', 'created_at', 'timestamp'];
        const escapeCell = (v) => {
          if (v === null || v === undefined) return '';
          const s = String(v);
          if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
          return s;
        };

        const csv = [header.join(',')]
          .concat(rows.map(r => header.map(h => escapeCell(r[h])).join(',')))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="recognitions.csv"');
        return res.send(csv);
      } catch (e) {
        continue; // try next table name
      }
    }

    return res.status(404).json({ error: 'No recognition logs table found to export' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Avatar & Rewards admin API */

// GET /admin/avatars - paginated list of avatars available in shop
router.get('/avatars', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '20', 10));
    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    // select avatars table if exists
    // Prefer the primary avatars table, but gracefully fall back to inferring
    // avatar records from avatar_unlocks if the table doesn't exist.
    try {
      const { data, error, count } = await supabaseAdmin
        .from('avatars')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (!error) {
        const total = typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
        return res.json({ success: true, avatars: data || [], pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) || 1 } });
      }

      // If avatars table is missing you'll see an error from Supabase — fall through
    } catch (e) {
      // ignore and try fallback
    }

    // Fallback: query avatar_unlocks for distinct avatar names and return as lightweight avatars.
    try {
      const { data: distinct, error: dErr } = await supabaseAdmin.rpc('distinct_avatar_names', { });
      // Not all DBs will have the above RPC — keep fallback simple and query avatar_unlocks directly.
      let rows = [];
      try {
        const { data: ux, error: uxErr } = await supabaseAdmin
          .from('avatar_unlocks')
          .select('avatar_name, count:user_id', { count: 'exact' })
          .group('avatar_name');

        if (!uxErr && ux) {
          rows = ux.map((r, i) => ({ id: r.avatar_name, name: r.avatar_name, price_points: null, image_url: null, is_active: true }));
        }
      } catch (inner) {
        // last fallback (retrieve all avatar_unlocks and deduplicate in JS)
        const { data: allUx, error: allErr } = await supabaseAdmin.from('avatar_unlocks').select('avatar_name');
        if (!allErr && Array.isArray(allUx)) {
          const names = [...new Set(allUx.map(a => a.avatar_name).filter(Boolean))];
          rows = names.map(n => ({ id: n, name: n, price_points: null, image_url: null, is_active: true }));
        }
      }

      const total = rows.length;
      const sliced = rows.slice(start, end + 1);
      return res.json({ success: true, avatars: sliced, pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) || 1 } });
    } catch (fallbackErr) {
      console.error('avatar endpoints fallback failed', fallbackErr);
      return res.status(500).json({ error: 'avatars table missing and fallback failed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/avatars - create a new avatar
router.post('/avatars', async (req, res) => {
  try {
    const payload = req.body || {};
    const allowed = ['name', 'price_points', 'image_url', 'metadata', 'is_active'];
    const insert = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(payload, k)) insert[k] = payload[k];

    if (!insert.name) return res.status(400).json({ error: 'Missing avatar name' });

    try {
      const { data, error } = await supabaseAdmin.from('avatars').insert([insert]).select().single();
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true, avatar: data });
    } catch (e) {
      // avatars table likely doesn't exist — instruct the admin how to create it
      return res.status(501).json({ error: 'avatars table not found — create a `avatars` table in your Supabase DB to use CRUD operations' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /admin/avatars/:id - update avatar
router.put('/avatars/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const allowed = ['name', 'price_points', 'image_url', 'metadata', 'is_active'];
    const updates = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(payload, k)) updates[k] = payload[k];

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updatable fields' });

    try {
      const { data, error } = await supabaseAdmin.from('avatars').update(updates).eq('id', id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true, avatar: data });
    } catch (e) {
      return res.status(501).json({ error: 'avatars table not found — cannot update; create table to enable editing' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /admin/avatars/:id - remove avatar
router.delete('/avatars/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const { error } = await supabaseAdmin.from('avatars').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (e) {
      return res.status(501).json({ error: 'avatars table not found — cannot delete' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/avatars/:id/purchases - list purchases for an avatar (if purchases table exists)
router.get('/avatars/:id/purchases', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing avatar id' });

    // Try purchases table first
    try {
      const { data, error } = await supabaseAdmin.from('avatar_purchases').select('*').eq('avatar_id', id).order('purchased_at', { ascending: false });
      if (!error) return res.json({ success: true, purchases: data || [] });
    } catch (e) {
      // fall through to avatar_unlocks
    }

    // Fallback: use avatar_unlocks table to find unlocks for this avatar name.
    // If `avatars` table isn't present the id may actually be the avatar_name.
    const { data: ux, error: uxErr } = await supabaseAdmin.from('avatar_unlocks').select('id, user_id, avatar_name, created_at').eq('avatar_name', id).order('created_at', { ascending: false });
    if (uxErr) return res.status(400).json({ error: uxErr.message });
    return res.json({ success: true, purchases: ux || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Foods management API - will be safe if table missing (501 guidance) */

// GET /admin/foods - paginated list + q
router.get('/foods', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '20', 10));
    const q = (req.query.q || '').trim();

    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    // Try canonical 'foods' first (supports full CRUD). If missing, attempt read-only fallback to other food-related tables
    try {
      // prefer the canonical foods table for full-featured admin
      try {
        let query = supabaseAdmin.from('foods').select('*', { count: 'exact' }).order('created_at', { ascending: false });
        if (q) {
          const safeQ = q.replace(/%/g, '\\%').replace(/'/g, "\\'");
          query = query.or([`name.ilike.%${safeQ}%`, `category.ilike.%${safeQ}%`, `description.ilike.%${safeQ}%`].join(','));
        }
        const { data, error, count } = await query.range(start, end);
        if (!error) {
          const total = typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
          return res.json({ success: true, foods: data || [], pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) || 1 }, source: 'foods' });
        }
      } catch (e) {
        // fall through to other tables
      }

      // Fallback table candidates (read-only): malaysia_food_database, food_logs
      const fallbackTables = ['malaysia_food_database', 'food_logs'];
      for (const t of fallbackTables) {
        try {
          // use simple select with count support; ordering isn't guaranteed (different schemas)
          let query = supabaseAdmin.from(t).select('*', { count: 'exact' });
          
          // Apply search filter for malaysia_food_database
          if (q && t === 'malaysia_food_database') {
            const safeQ = q.replace(/%/g, '\\%').replace(/'/g, "\\'");
            query = query.or([`name.ilike.%${safeQ}%`, `category.ilike.%${safeQ}%`].join(','));
          }
          
          const { data, error, count } = await query.range(start, end);
          if (!error) {
            const total = typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
            return res.json({ success: true, foods: data || [], pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) || 1 }, source: t, readOnly: false });
          }
        } catch (inner) {
          continue;
        }
      }

      // None of the tables found
      return res.status(501).json({ error: 'No foods table found — create a `foods` table to enable full food management or allow read-only using `malaysia_food_database`' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/foods/:id - single food
router.get('/foods/:id', async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    // Try canonical foods table first
    try {
      const { data, error } = await supabaseAdmin.from('foods').select('*').eq('id', id).single();
      if (!error && data) return res.json({ success: true, food: data, source: 'foods' });
    } catch (e) {
      // fall through
    }

    // Fallback: attempt to find in malaysia_food_database then food_logs
    const fallbackTables = ['malaysia_food_database', 'food_logs'];
    for (const t of fallbackTables) {
      try {
        // try matching by id first, then try by name
        let result = await supabaseAdmin.from(t).select('*').eq('id', id).maybeSingle();
        if (result?.data) return res.json({ success: true, food: result.data, source: t, readOnly: false });

        // some tables may not use uuid ids — try name
        const byName = await supabaseAdmin.from(t).select('*').eq('name', id).maybeSingle();
        if (byName?.data) return res.json({ success: true, food: byName.data, source: t, readOnly: false });
      } catch (inner) {
        continue;
      }
    }

    return res.status(404).json({ error: 'Food not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/foods - create
router.post('/foods', async (req, res) => {
  try {
    const payload = req.body || {};
    // Prepare for canonical foods table insert
    const allowed = ['name', 'description', 'image_url', 'calories', 'metadata', 'is_active'];
    const insert = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(payload, k)) insert[k] = payload[k];

    if (!insert.name) return res.status(400).json({ error: 'Missing name' });

    // Try canonical `foods` table first (full CRUD)
    try {
      const { data, error } = await supabaseAdmin.from('foods').insert([insert]).select().single();
      if (error) throw error;
      return res.json({ success: true, food: data, source: 'foods' });
    } catch (e) {
      // If canonical table doesn't exist or insert failed, attempt to insert into 'malaysia_food_database' (read-only by default but we support writes if permitted)
      try {
        // Map fields into malaysia schema
        const mal = {};
        mal.name = insert.name;
        // alt_names can be provided as array or comma-separated string in payload.alt_names
        if (payload.alt_names) {
          if (Array.isArray(payload.alt_names)) mal.alt_names = payload.alt_names;
          else if (typeof payload.alt_names === 'string') mal.alt_names = payload.alt_names.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (payload.category) mal.category = payload.category;
        if (Object.prototype.hasOwnProperty.call(payload, 'calories')) mal.kcal_per_100g = payload.calories;
        if (Object.prototype.hasOwnProperty.call(payload, 'protein_g_per_100g')) mal.protein_g_per_100g = payload.protein_g_per_100g;
        if (Object.prototype.hasOwnProperty.call(payload, 'carbs_g_per_100g')) mal.carbs_g_per_100g = payload.carbs_g_per_100g;
        if (Object.prototype.hasOwnProperty.call(payload, 'fat_g_per_100g')) mal.fat_g_per_100g = payload.fat_g_per_100g;
        if (Object.prototype.hasOwnProperty.call(payload, 'sugar_g_per_100g')) mal.sugar_g_per_100g = payload.sugar_g_per_100g;
        if (Object.prototype.hasOwnProperty.call(payload, 'sodium_mg_per_100g')) mal.sodium_mg_per_100g = payload.sodium_mg_per_100g;

        const { data: malData, error: malErr } = await supabaseAdmin.from('malaysia_food_database').insert([mal]).select().single();
        if (malErr) throw malErr;
        return res.json({ success: true, food: malData, source: 'malaysia_food_database', readOnly: false });
      } catch (malErr) {
        // Could not insert into fallbacks — table missing or permission denied
        return res.status(501).json({ error: 'No writable foods table found — create a `foods` table or allow writes to `malaysia_food_database`' });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /admin/foods/:id - update
router.put('/foods/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const p = req.body;

    const updates = {
      name: p.name,
      category: p.category,
      alt_names: Array.isArray(p.alt_names)
        ? p.alt_names
        : typeof p.alt_names === "string"
        ? p.alt_names.split(",").map(x => x.trim())
        : null,

      // ✅ FIXED - Match exact Supabase column names
      kcal_per_100g: p.kcal_per_100g,
      protein_g_per_100g: p.protein_g_per_100g,
      carbs_g_per_100g: p.carbs_g_per_100g,
      fat_g_per_100g: p.fat_g_per_100g,
      sugar_g_per_100g: p.sugar_g_per_100g,
      sodium_mg_per_100g: p.sodium_mg_per_100g
    };

    // remove null/undefined
    Object.keys(updates).forEach(
      key => updates[key] == null && delete updates[key]
    );

    console.log("🔥 UPDATING FOOD:", updates);

    const { data, error } = await supabaseAdmin
      .from("malaysia_food_database")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'food_updated',
      `Food "${data.name}" updated`,
      admin.admin_id,
      admin.admin_name,
      { food_id: id, food_name: data.name }
    );

    res.json({ success: true, food: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// DELETE /admin/foods/:id - delete
router.delete('/foods/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Get food info before deletion for logging
    const { data: foodData } = await supabaseAdmin
      .from('malaysia_food_database')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('malaysia_food_database')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'food_deleted',
      `Food "${foodData?.name || id}" deleted`,
      admin.admin_id,
      admin.admin_name,
      { food_id: id, food_name: foodData?.name }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /admin/users - create profile manually (admin only)
router.post('/users', async (req, res) => {
  try {
    const payload = req.body || {};

    const required = ['user_id', 'email', 'full_name'];
    for (const r of required) {
      if (!payload[r]) return res.status(400).json({ error: `Missing ${r}` });
    }

    const allowed = [
      'user_id',
      'email',
      'full_name',
      'goal',
      'height_cm',
      'weight_kg',
      'bmi',
      'is_admin',
      'disabled',
      'completed_onboarding'
    ];

    const insert = {};
    for (const k of allowed) {
      if (payload[k] !== undefined) insert[k] = payload[k];
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([insert])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'user_created',
      `User ${data.full_name || data.email} created`,
      admin.admin_id,
      admin.admin_name,
      { user_id: data.user_id, email: data.email }
    );

    res.json({ success: true, user: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /admin/users/:id - delete user profile
router.delete('/users/:id', async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    // Get user info before deletion for logging
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', id);

    if (error) return res.status(400).json({ error: error.message });

    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'user_deleted',
      `User ${userData?.full_name || userData?.email || id} deleted`,
      admin.admin_id,
      admin.admin_name,
      { user_id: id }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/foods/malaysia - insert into malaysia_food_database
router.post('/foods/malaysia', async (req, res) => {
  try {
    const payload = req.body || {};

    if (!payload.name)
      return res.status(400).json({ error: 'Missing food name' });

    const mal = {};

    // Name & alt names
    mal.name = payload.name;
    mal.alt_names = Array.isArray(payload.alt_names)
      ? payload.alt_names
      : typeof payload.alt_names === 'string'
        ? payload.alt_names.split(',').map(x => x.trim())
        : [];

    // Category
    if (payload.category) mal.category = payload.category;

    // ✅ Match exact Supabase column names
    if (payload.kcal_per_100g) mal.kcal_per_100g = payload.kcal_per_100g;
    if (payload.protein_g_per_100g) mal.protein_g_per_100g = payload.protein_g_per_100g;
    if (payload.carbs_g_per_100g) mal.carbs_g_per_100g = payload.carbs_g_per_100g;
    if (payload.fat_g_per_100g) mal.fat_g_per_100g = payload.fat_g_per_100g;
    if (payload.sugar_g_per_100g) mal.sugar_g_per_100g = payload.sugar_g_per_100g;
    if (payload.sodium_mg_per_100g) mal.sodium_mg_per_100g = payload.sodium_mg_per_100g;

    // Insert
    const { data, error } = await supabaseAdmin
      .from('malaysia_food_database')
      .insert([mal])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Log activity (after data is available)
    console.log(`[Food Create] Logging activity for food: ${data.name}`);
    const admin = getAdminInfo(req);
    console.log(`[Food Create] Admin info:`, admin);
    const logged = await logActivity(
      'food_created',
      `Food "${data.name}" created`,
      admin.admin_id,
      admin.admin_name,
      { food_id: data.id, food_name: data.name, category: data.category }
    );
    console.log(`[Food Create] Activity logged: ${logged}`);

    res.json({ success: true, food: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// DELETE /admin/foods/malaysia/:id - remove food item
router.delete('/foods/malaysia/:id', async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    // Get food info before deletion for logging
    const { data: foodData } = await supabaseAdmin
      .from('malaysia_food_database')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('malaysia_food_database')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    // Log activity
    const admin = getAdminInfo(req);
    await logActivity(
      'food_deleted',
      `Food "${foodData?.name || id}" deleted`,
      admin.admin_id,
      admin.admin_name,
      { food_id: id, food_name: foodData?.name }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/recognitions — AI Recognition Logs with filters and pagination
router.get('/recognitions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '20', 10));
    const q = (req.query.q || '').trim(); // Search query for label/email
    const user_id = (req.query.user_id || '').trim();
    const source = (req.query.source || '').trim(); // Gemini/TFLite
    const start_date = (req.query.start_date || '').trim();
    const end_date = (req.query.end_date || '').trim();
    const min_confidence = req.query.min_confidence ? parseFloat(req.query.min_confidence) : null;

    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    // Try recognition tables in order
    const recognitionTables = ['recognitions', 'ai_recognitions', 'ai_logs', 'image_recognitions', 'recognition_logs'];
    let data = null;
    let count = 0;
    let tableName = null;

    for (const table of recognitionTables) {
      try {
        let query = supabaseAdmin
          .from(table)
          .select('id, user_id, user_email, label, confidence, source, image_url, created_at', { count: 'exact' })
          .order('created_at', { ascending: false });

        // Apply filters
        if (q) {
          query = query.or(`label.ilike.%${q}%,user_email.ilike.%${q}%`);
        }
        if (user_id) {
          query = query.eq('user_id', user_id);
        }
        if (source) {
          query = query.ilike('source', `%${source}%`);
        }
        if (start_date) {
          query = query.gte('created_at', `${start_date}T00:00:00`);
        }
        if (end_date) {
          query = query.lte('created_at', `${end_date}T23:59:59`);
        }
        if (min_confidence !== null && !isNaN(min_confidence)) {
          query = query.gte('confidence', min_confidence);
        }

        const result = await query.range(start, end);

        if (!result.error && result.data) {
          data = result.data;
          count = result.count || 0;
          tableName = table;
          break;
        }
      } catch (err) {
        console.log(`Table ${table} not accessible:`, err.message);
        continue;
      }
    }

    if (!data) {
      return res.json({ 
        success: true, 
        logs: [], 
        source: 'none',
        pagination: { total: 0, page, perPage, totalPages: 1 } 
      });
    }

    const totalPages = Math.max(1, Math.ceil(count / perPage));

    return res.json({ 
      success: true, 
      logs: data,
      source: tableName,
      pagination: { total: count, page, perPage, totalPages }
    });

  } catch (err) {
    console.error('GET /admin/recognitions error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/recognitions/export — Export recognition logs as CSV
router.get('/recognitions/export', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const user_id = (req.query.user_id || '').trim();
    const source = (req.query.source || '').trim();
    const start_date = (req.query.start_date || '').trim();
    const end_date = (req.query.end_date || '').trim();
    const min_confidence = req.query.min_confidence ? parseFloat(req.query.min_confidence) : null;
    const limit = Math.min(10000, parseInt(req.query.limit || '2000', 10));

    // Try recognition tables in order
    const recognitionTables = ['recognitions', 'ai_recognitions', 'ai_logs', 'image_recognitions', 'recognition_logs'];
    let data = null;

    for (const table of recognitionTables) {
      try {
        let query = supabaseAdmin
          .from(table)
          .select('id, user_id, user_email, label, confidence, source, image_url, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        // Apply same filters as main query
        if (q) {
          query = query.or(`label.ilike.%${q}%,user_email.ilike.%${q}%`);
        }
        if (user_id) {
          query = query.eq('user_id', user_id);
        }
        if (source) {
          query = query.ilike('source', `%${source}%`);
        }
        if (start_date) {
          query = query.gte('created_at', `${start_date}T00:00:00`);
        }
        if (end_date) {
          query = query.lte('created_at', `${end_date}T23:59:59`);
        }
        if (min_confidence !== null && !isNaN(min_confidence)) {
          query = query.gte('confidence', min_confidence);
        }

        const result = await query;

        if (!result.error && result.data) {
          data = result.data;
          break;
        }
      } catch (err) {
        console.log(`Table ${table} not accessible:`, err.message);
        continue;
      }
    }

    if (!data || data.length === 0) {
      return res.status(404).send('No recognition logs found');
    }

    // Generate CSV
    const headers = ['ID', 'User ID', 'User Email', 'Detected Label', 'Confidence Score', 'Source', 'Image URL', 'Timestamp'];
    const csvRows = [headers.join(',')];

    for (const log of data) {
      const row = [
        log.id || '',
        log.user_id || '',
        `"${(log.user_email || '').replace(/"/g, '""')}"`,
        `"${(log.label || '').replace(/"/g, '""')}"`,
        log.confidence || 0,
        log.source || '',
        `"${(log.image_url || '').replace(/"/g, '""')}"`,
        log.created_at || ''
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recognition_logs.csv"');
    res.send(csv);

  } catch (err) {
    console.error('GET /admin/recognitions/export error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/analytics — Comprehensive analytics data
router.get('/analytics', async (req, res) => {
  try {
    const useMockData = req.query.mock === 'true'; // Allow mock data via query param
    
    const analytics = {
      userGrowth: [],
      mostEatenFoods: [],
      avgCaloriesPerDay: 0,
      aiAccuracy: 0,
      pointsOverview: { total: 0 },
      hydrationStats: { total: 0, avg: 0 },
      checkInStats: { avg: 0 }
    };

    // User Growth (last 30 days) - using actual profiles data
    const userGrowthData = [];
    let hasUserData = false;
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      try {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', `${dateStr}T23:59:59`);
        
        userGrowthData.push({ date: dateStr, total: count || 0 });
        if (count > 0) hasUserData = true;
      } catch (err) {
        userGrowthData.push({ date: dateStr, total: 0 });
      }
    }
    
    // If no user data, generate sample growth data
    if (!hasUserData || useMockData) {
      analytics.userGrowth = [];
      let baseUsers = 5;
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        baseUsers += Math.floor(Math.random() * 3); // Random growth
        analytics.userGrowth.push({ date: dateStr, total: baseUsers });
      }
    } else {
      analytics.userGrowth = userGrowthData;
    }

    // Most Eaten Foods - try actual tables first
    let foundFoodData = false;
    const foodTables = ['food_logs', 'meal_logs', 'user_foods', 'daily_logs'];
    
    for (const table of foodTables) {
      try {
        console.log(`Trying to query ${table} for most eaten foods...`);
        
        // Different tables may have different column names
        let selectColumns = 'item_name';
        if (table === 'meal_logs' || table === 'user_foods' || table === 'daily_logs') {
          selectColumns = 'food_name, name, food_id';
        }
        
        const { data, error } = await supabaseAdmin
          .from(table)
          .select(selectColumns)
          .limit(1000);

        console.log(`${table} query result:`, { error: error?.message, rowCount: data?.length });

        if (!error && data && data.length > 0) {
          const foodCounts = {};
          data.forEach(item => {
            const name = item.item_name || item.food_name || item.name || item.food_id || 'Unknown';
            if (name && name !== 'Unknown') {
              foodCounts[name] = (foodCounts[name] || 0) + 1;
            }
          });

          console.log('Food counts:', foodCounts);

          analytics.mostEatenFoods = Object.entries(foodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
          
          console.log('Top 10 foods:', analytics.mostEatenFoods);
          foundFoodData = true;
          break;
        }
      } catch (err) {
        console.error(`Error querying ${table}:`, err.message);
        continue;
      }
    }
    
    // Sample data if no food logs found
    if (!foundFoodData || useMockData) {
      analytics.mostEatenFoods = [
        { name: 'Nasi Lemak', count: 145 },
        { name: 'Chicken Rice', count: 132 },
        { name: 'Roti Canai', count: 98 },
        { name: 'Char Kway Teow', count: 87 },
        { name: 'Laksa', count: 76 },
        { name: 'Nasi Goreng', count: 65 },
        { name: 'Satay', count: 54 },
        { name: 'Mee Goreng', count: 43 },
        { name: 'Rendang', count: 38 },
        { name: 'Teh Tarik', count: 32 }
      ];
    }

    // Average Calories per Day
    let foundCaloriesData = false;
    const caloriesTables = ['food_logs', 'meal_logs', 'daily_logs'];
    
    for (const table of caloriesTables) {
      try {
        console.log(`Trying to query ${table} for calories...`);
        
        let selectColumns = 'kcal, eaten_at, created_at';
        if (table !== 'food_logs') {
          selectColumns = 'kcal, calories, created_at, eaten_at';
        }
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        // Try eaten_at first, fallback to created_at if eaten_at doesn't exist
        let query = supabaseAdmin
          .from(table)
          .select(selectColumns);
        
        if (table === 'food_logs') {
          query = query.gte('eaten_at', thirtyDaysAgo);
        } else {
          query = query.gte('created_at', thirtyDaysAgo);
        }
        
        const { data, error } = await query;

        console.log(`${table} calories query result:`, { error: error?.message, rowCount: data?.length });

        if (!error && data && data.length > 0) {
          const totalCalories = data.reduce((sum, item) => {
            const cal = item.kcal || item.calories || 0;
            return sum + (parseFloat(cal) || 0);
          }, 0);
          const uniqueDays = new Set(data.map(item => {
            const date = item.eaten_at || item.created_at;
            return date?.slice(0, 10);
          }).filter(Boolean)).size;
          analytics.avgCaloriesPerDay = uniqueDays > 0 ? Math.round(totalCalories / uniqueDays) : 0;
          
          console.log(`Calories stats: total=${totalCalories}kcal, days=${uniqueDays}, avg=${analytics.avgCaloriesPerDay}kcal/day`);
          foundCaloriesData = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!foundCaloriesData || useMockData) {
      analytics.avgCaloriesPerDay = 1850; // Sample average
    }

    // AI Recognition Accuracy
    let foundAIData = false;
    const recognitionTables = ['recognitions', 'ai_recognitions', 'ai_logs', 'image_recognitions'];
    
    for (const table of recognitionTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('confidence')
          .not('confidence', 'is', null)
          .limit(1000);

        if (!error && data && data.length > 0) {
          const totalConfidence = data.reduce((sum, item) => sum + (parseFloat(item.confidence) || 0), 0);
          analytics.aiAccuracy = data.length > 0 ? (totalConfidence / data.length) * 100 : 0;
          foundAIData = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!foundAIData || useMockData) {
      analytics.aiAccuracy = 87.5; // Sample accuracy
    }

    // Points Overview - sum all points from profiles
    let foundPointsData = false;
    
    try {
      console.log('Querying profiles for total points...');
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('points');

      console.log('Points query result:', { error: error?.message, rowCount: data?.length });

      if (!error && data && data.length > 0) {
        const totalPoints = data.reduce((sum, item) => {
          const pts = item.points || 0;
          return sum + (parseInt(pts) || 0);
        }, 0);
        analytics.pointsOverview.total = totalPoints;
        console.log(`Total points across all users: ${totalPoints}`);
        foundPointsData = true;
      }
    } catch (err) {
      console.error('Points query error:', err);
    }
    
    if (!foundPointsData || useMockData) {
      analytics.pointsOverview = { total: 12450 }; // Sample points
    }

    // Hydration Statistics
    let foundHydrationData = false;
    const hydrationTables = ['water_logs', 'hydration_logs', 'water_intake', 'daily_logs'];
    
    for (const table of hydrationTables) {
      try {
        console.log(`Trying to query ${table} for hydration stats...`);
        
        let selectColumns = 'amount_ml, user_id, created_at';
        if (table !== 'water_logs') {
          selectColumns = 'water_ml, amount, user_id, created_at';
        }
        
        const { data, error } = await supabaseAdmin
          .from(table)
          .select(selectColumns)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        console.log(`${table} hydration query result:`, { error: error?.message, rowCount: data?.length });

        if (!error && data && data.length > 0) {
          const totalWater = data.reduce((sum, item) => {
            const amount = item.amount_ml || item.water_ml || item.amount || 0;
            return sum + (parseFloat(amount) || 0);
          }, 0);
          
          // Get unique user count for average calculation
          const uniqueUsers = new Set(data.map(item => item.user_id).filter(Boolean)).size;
          const userCount = uniqueUsers > 0 ? uniqueUsers : 1;
          
          analytics.hydrationStats.total = Math.round(totalWater);
          analytics.hydrationStats.avg = Math.round(totalWater / userCount);
          
          console.log(`Hydration stats: total=${analytics.hydrationStats.total}ml, avg=${analytics.hydrationStats.avg}ml, users=${userCount}`);
          foundHydrationData = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!foundHydrationData || useMockData) {
      analytics.hydrationStats = { total: 48000, avg: 2400 }; // Sample: 48L total, 2.4L avg
    }

    // Check-In Statistics - average streak from profiles
    let foundCheckInData = false;
    
    try {
      console.log('Querying profiles for check-in streaks...');
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('check_in_streak');

      console.log('Check-in query result:', { error: error?.message, rowCount: data?.length });

      if (!error && data && data.length > 0) {
        const totalStreak = data.reduce((sum, item) => {
          const streak = item.check_in_streak || 0;
          return sum + (parseInt(streak) || 0);
        }, 0);
        analytics.checkInStats.avg = data.length > 0 ? parseFloat((totalStreak / data.length).toFixed(1)) : 0;
        console.log(`Average check-in streak: ${analytics.checkInStats.avg}`);
        foundCheckInData = true;
      }
    } catch (err) {
      console.error('Check-in query error:', err);
    }
    
    if (!foundCheckInData || useMockData) {
      analytics.checkInStats = { avg: 0.8 }; // Sample check-in rate
    }

    return res.json({ success: true, analytics });

  } catch (err) {
    console.error('GET /admin/analytics error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/analytics/export — Export analytics as CSV
router.get('/analytics/export', async (req, res) => {
  try {
    console.log('Exporting analytics data...');
    
    const csvSections = [];
    
    // Summary Statistics
    csvSections.push('ANALYTICS SUMMARY');
    csvSections.push('');
    
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    // Get total points
    const { data: pointsData } = await supabaseAdmin
      .from('profiles')
      .select('points');
    const totalPoints = pointsData?.reduce((sum, item) => sum + (parseInt(item.points) || 0), 0) || 0;
    
    // Get avg check-in streak
    const { data: streakData } = await supabaseAdmin
      .from('profiles')
      .select('check_in_streak');
    const avgStreak = streakData?.length > 0 
      ? (streakData.reduce((sum, item) => sum + (parseInt(item.check_in_streak) || 0), 0) / streakData.length).toFixed(1)
      : 0;
    
    // Get avg calories
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: caloriesData } = await supabaseAdmin
      .from('food_logs')
      .select('kcal, eaten_at')
      .gte('eaten_at', thirtyDaysAgo);
    
    let avgCalories = 0;
    if (caloriesData && caloriesData.length > 0) {
      const totalCal = caloriesData.reduce((sum, item) => sum + (parseFloat(item.kcal) || 0), 0);
      const uniqueDays = new Set(caloriesData.map(item => item.eaten_at?.slice(0, 10)).filter(Boolean)).size;
      avgCalories = uniqueDays > 0 ? Math.round(totalCal / uniqueDays) : 0;
    }
    
    // Get hydration
    const { data: waterData } = await supabaseAdmin
      .from('water_logs')
      .select('amount_ml, user_id')
      .gte('created_at', thirtyDaysAgo);
    
    let totalWater = 0;
    let avgWater = 0;
    if (waterData && waterData.length > 0) {
      totalWater = Math.round(waterData.reduce((sum, item) => sum + (parseFloat(item.amount_ml) || 0), 0));
      const uniqueUsers = new Set(waterData.map(item => item.user_id).filter(Boolean)).size;
      avgWater = uniqueUsers > 0 ? Math.round(totalWater / uniqueUsers) : 0;
    }
    
    csvSections.push(`Total Users,${totalUsers || 0}`);
    csvSections.push(`Total Points,${totalPoints}`);
    csvSections.push(`Avg Check-In Streak,${avgStreak}`);
    csvSections.push(`Avg Calories Per Day,${avgCalories} kcal`);
    csvSections.push(`Total Water Intake (30d),${(totalWater / 1000).toFixed(1)}L`);
    csvSections.push(`Avg Water Per User,${avgWater}ml`);
    csvSections.push('');
    csvSections.push('');
    
    // User Growth Data
    csvSections.push('USER GROWTH (LAST 30 DAYS)');
    csvSections.push('Date,Total Users');
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      try {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', `${dateStr}T23:59:59`);
        
        csvSections.push(`${dateStr},${count || 0}`);
      } catch (err) {
        csvSections.push(`${dateStr},0`);
      }
    }
    
    csvSections.push('');
    csvSections.push('');
    
    // Most Eaten Foods
    csvSections.push('MOST EATEN FOODS');
    csvSections.push('Food Name,Count');
    
    try {
      const { data: foodData } = await supabaseAdmin
        .from('food_logs')
        .select('item_name');
      
      if (foodData && foodData.length > 0) {
        const foodCount = {};
        foodData.forEach(item => {
          const name = item.item_name;
          if (name) {
            foodCount[name] = (foodCount[name] || 0) + 1;
          }
        });
        
        const sortedFoods = Object.entries(foodCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20);
        
        sortedFoods.forEach(([name, count]) => {
          csvSections.push(`"${name}",${count}`);
        });
      }
    } catch (err) {
      console.error('Food data export error:', err);
    }

    const csv = csvSections.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics_export.csv"');
    res.send(csv);

  } catch (err) {
    console.error('GET /admin/analytics/export error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// APK MANAGEMENT (GitHub-based)
// ============================================

// GET /admin/apks — List all APK versions
router.get('/apks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const offset = (page - 1) * perPage;

    // Get APKs from database
    const { data, error, count } = await supabaseAdmin
      .from('apk_versions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Error fetching APKs:', error);
      return res.json({ apks: [], total: 0, page, perPage });
    }

    return res.json({
      success: true,
      apks: data || [],
      total: count || 0,
      page,
      perPage
    });

  } catch (err) {
    console.error('GET /admin/apks error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/apks — Add new APK version from GitHub Release
router.post('/apks', async (req, res) => {
  try {
    const { version, github_url, file_size, release_notes } = req.body;

    // Validation
    if (!version || !github_url) {
      return res.status(400).json({ error: 'Version and GitHub URL are required' });
    }

    // Insert into database
    const insertData = {
      version: version,
      github_url: github_url,
      file_size: file_size || null,
      release_notes: release_notes || null,
      downloads: 0
    };

    const { data, error } = await supabaseAdmin
      .from('apk_versions')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating APK:', error);
      return res.status(400).json({ error: error.message || 'Failed to create APK version' });
    }

    return res.json({ success: true, apk: data });

  } catch (err) {
    console.error('POST /admin/apks error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// DELETE /admin/apks/:id — Delete APK version
router.delete('/apks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('apk_versions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting APK:', error);
      return res.status(500).json({ error: 'Failed to delete APK' });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error('DELETE /admin/apks/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/apks/:id/download — Increment download count
router.post('/apks/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    // Increment download count
    const { data, error } = await supabaseAdmin
      .from('apk_versions')
      .select('downloads, github_url')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'APK not found' });
    }

    await supabaseAdmin
      .from('apk_versions')
      .update({ downloads: (data.downloads || 0) + 1 })
      .eq('id', id);

    return res.json({ success: true, download_url: data.github_url });

  } catch (err) {
    console.error('POST /admin/apks/:id/download error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* Activity Logs Admin API */

// GET /admin/activity - Get admin activity logs with pagination and filtering
router.get('/activity', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.perPage || '50', 10));
    const type = (req.query.type || '').trim().toLowerCase();

    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    // Try different possible table names for activity logs
    const activityTables = ['admin_activity_logs', 'activity_logs', 'admin_logs', 'audit_logs'];
    let data = null;
    let count = 0;
    let tableName = null;

    for (const table of activityTables) {
      try {
        let query = supabaseAdmin
          .from(table)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        // Apply type filter if specified
        if (type && type !== 'all') {
          if (type === 'users') {
            query = query.or('type.ilike.%user_%');
          } else if (type === 'foods') {
            query = query.or('type.ilike.%food_%');
          } else if (type === 'system') {
            query = query.or('type.ilike.%login%,type.ilike.%logout%,type.ilike.%system_%');
          }
        }

        const result = await query.range(start, end);

        if (!result.error && result.data) {
          data = result.data;
          count = result.count || 0;
          tableName = table;
          break;
        }
      } catch (err) {
        // Table doesn't exist, try next
        continue;
      }
    }

    // If no table found, return empty results gracefully
    if (!data) {
      return res.json({
        success: true,
        activities: [],
        pagination: {
          total: 0,
          page,
          perPage,
          totalPages: 1
        },
        source: 'none',
        message: 'Activity logs table not found. Create a table named "admin_activity_logs" or "activity_logs" to enable this feature.'
      });
    }

    // Transform data to match expected format
    const activities = data.map(item => ({
      id: item.id || item.activity_id,
      type: item.type || item.action_type || 'unknown',
      description: item.description || item.message || item.action || `${item.type || 'Action'} performed`,
      admin_name: item.admin_name || item.admin_email || item.user_name || 'System',
      admin_id: item.admin_id || item.user_id,
      created_at: item.created_at || item.timestamp || item.created_at,
      details: item.details || item.metadata || item.extra_data || {}
    }));

    const totalPages = Math.max(1, Math.ceil(count / perPage));

    return res.json({
      success: true,
      activities,
      pagination: {
        total: count,
        page,
        perPage,
        totalPages
      },
      source: tableName
    });

  } catch (err) {
    console.error('GET /admin/activity error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/activity - Create a new activity log entry
// This can be called internally by other routes to log admin actions
router.post('/activity', async (req, res) => {
  try {
    const { type, description, admin_id, admin_name, details } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Missing required field: type' });
    }

    // Try different possible table names
    const activityTables = ['admin_activity_logs', 'activity_logs', 'admin_logs', 'audit_logs'];
    let inserted = null;
    let tableName = null;

    for (const table of activityTables) {
      try {
        const insertData = {
          type,
          description: description || `${type} performed`,
          admin_id: admin_id || null,
          admin_name: admin_name || 'System',
          details: details || {},
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
          .from(table)
          .insert([insertData])
          .select()
          .single();

        if (!error && data) {
          inserted = data;
          tableName = table;
          break;
        }
      } catch (err) {
        // Table doesn't exist, try next
        continue;
      }
    }

    if (!inserted) {
      // If no table exists, just return success (graceful degradation)
      return res.json({
        success: true,
        message: 'Activity logged (no activity table found - create "admin_activity_logs" table to persist logs)',
        activity: {
          type,
          description: description || `${type} performed`,
          admin_name: admin_name || 'System',
          created_at: new Date().toISOString()
        }
      });
    }

    return res.json({
      success: true,
      activity: {
        id: inserted.id,
        type: inserted.type,
        description: inserted.description,
        admin_name: inserted.admin_name,
        admin_id: inserted.admin_id,
        created_at: inserted.created_at,
        details: inserted.details
      },
      source: tableName
    });

  } catch (err) {
    console.error('POST /admin/activity error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// TEST ENDPOINT - Remove after testing
router.post('/activity/test', async (req, res) => {
  try {
    console.log('[TEST] Testing activity logging...');
    const { logActivity } = require("../utils/activityLogger.js");
    
    const result = await logActivity(
      'system_test',
      'Test activity log entry',
      'test-admin-id',
      'Test Admin',
      { test: true, timestamp: new Date().toISOString() }
    );
    
    return res.json({
      success: true,
      logged: result,
      message: result ? 'Activity logged successfully!' : 'Failed to log activity - check console for details'
    });
  } catch (err) {
    console.error('[TEST] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
