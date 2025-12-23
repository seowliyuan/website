const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../../services/supabase.js");

// GET /admin/activity - Get admin activity logs with pagination and filtering
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
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

// Helper function to log activities (can be exported for use in other modules)
async function logActivity(type, description, admin_id = null, admin_name = 'System', details = {}) {
  try {
    const activityTables = ['admin_activity_logs', 'activity_logs', 'admin_logs', 'audit_logs'];
    
    for (const table of activityTables) {
      try {
        const insertData = {
          type,
          description,
          admin_id,
          admin_name,
          details,
          created_at: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
          .from(table)
          .insert([insertData]);

        if (!error) {
          return true; // Successfully logged
        }
      } catch (err) {
        continue; // Try next table
      }
    }
    
    // If no table exists, just return (graceful degradation)
    return false;
  } catch (err) {
    console.error('Error logging activity:', err);
    return false;
  }
}

// Export the helper function
module.exports = router;
module.exports.logActivity = logActivity;

