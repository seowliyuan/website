// Vercel serverless function wrapper for Express app
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  next();
});

// routes
const adminRoutes = require("../routes/admin.js");
app.use("/admin", adminRoutes);

// Public APK endpoint for landing page
const { supabaseAdmin } = require("../services/supabase.js");
app.get("/apk/latest", async (req, res) => {
  try {
    // Get the latest APK version (public endpoint, no auth required)
    const { data, error } = await supabaseAdmin
      .from('apk_versions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({ 
        success: false, 
        message: 'No APK versions available',
        apk: null 
      });
    }

    return res.json({ 
      success: true, 
      apk: {
        id: data.id,
        version: data.version,
        github_url: data.github_url,
        file_size: data.file_size,
        release_notes: data.release_notes,
        created_at: data.created_at
      }
    });
  } catch (err) {
    console.error('GET /apk/latest error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get("/", (req, res) => {
  res.send("fyp-backend is running — try GET /admin/users");
});

// Export the Express app as a serverless function
module.exports = app;

