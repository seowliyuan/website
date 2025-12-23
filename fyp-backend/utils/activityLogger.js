const { supabaseAdmin } = require("../services/supabase.js");

/**
 * Log an admin activity to the activity logs table
 * @param {string} type - Activity type (e.g., 'user_created', 'food_updated')
 * @param {string} description - Human-readable description
 * @param {string|null} admin_id - Admin user ID (optional)
 * @param {string} admin_name - Admin name/email (defaults to 'System')
 * @param {object} details - Additional metadata (optional)
 * @returns {Promise<boolean>} - Returns true if logged successfully
 */
async function logActivity(type, description, admin_id = null, admin_name = 'System', details = {}) {
  try {
    console.log(`[Activity Logger] Attempting to log: ${type} - ${description}`);
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

        console.log(`[Activity Logger] Trying table: ${table}`);
        const { data, error } = await supabaseAdmin
          .from(table)
          .insert([insertData])
          .select();

        if (!error) {
          console.log(`[Activity Logger] ✅ Successfully logged to ${table}:`, data?.[0]?.id);
          return true; // Successfully logged
        } else {
          console.log(`[Activity Logger] ❌ Error with table ${table}:`, error.message);
        }
      } catch (err) {
        // Table doesn't exist, try next
        console.log(`[Activity Logger] ⚠️ Table ${table} not accessible:`, err.message);
        continue;
      }
    }
    
    // If no table exists, just return false (graceful degradation)
    console.log(`[Activity Logger] ❌ Failed to log to any table`);
    return false;
  } catch (err) {
    console.error('[Activity Logger] ❌ Fatal error logging activity:', err);
    return false;
  }
}

/**
 * Extract admin info from request (if available)
 * This assumes you have middleware that adds admin info to req.user or req.admin
 */
function getAdminInfo(req) {
  // Try different ways admin info might be stored
  if (req.user) {
    return {
      admin_id: req.user.id || req.user.user_id,
      admin_name: req.user.email || req.user.name || req.user.full_name || 'Admin'
    };
  }
  if (req.admin) {
    return {
      admin_id: req.admin.id || req.admin.user_id,
      admin_name: req.admin.email || req.admin.name || req.admin.full_name || 'Admin'
    };
  }
  // Fallback to system
  return {
    admin_id: null,
    admin_name: 'System'
  };
}

module.exports = {
  logActivity,
  getAdminInfo
};

