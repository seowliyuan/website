const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config();

// ADMIN client (Service Role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// PUBLIC client (Anon Key)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabaseAdmin, supabase };
