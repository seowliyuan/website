import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Constants
const COOKIE_NAME = "admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // one week in seconds
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Helper function to get Supabase client (lazy initialization)
function getSupabaseAdmin() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    throw new Error("Missing required Supabase environment variables");
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

/**
 * POST /api/admin/login
 * Authenticates an admin user and sets an httpOnly cookie session
 * 
 * @param {Request} req - The incoming request with token in body
 * @returns {Promise<NextResponse>} Response with success status or error
 */
export async function POST(req) {
  // Only allow POST method
  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    // Get Supabase client (validates env vars)
    const supabaseAdmin = getSupabaseAdmin();
    
    const body = await req.json();

    // Validate request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Expect the client to send us a Supabase access token after sign-in
    const token = body?.token;
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 400 }
      );
    }

    // Validate token and get the user
    const {
      data: { user },
      error: getUserError,
    } = await supabaseAdmin.auth.getUser(token);

    if (getUserError || !user) {
      console.warn("Invalid token attempt:", getUserError?.message || "No user found");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check the user's profile for is_admin flag
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (profileErr) {
      console.error("Profile lookup error:", profileErr.message);
      return NextResponse.json(
        { error: "Failed to verify admin status" },
        { status: 500 }
      );
    }

    if (!profile?.is_admin) {
      console.warn(`Non-admin user attempted login: ${user.id}`);
      return NextResponse.json(
        { error: "Access denied: Admin privileges required" },
        { status: 403 }
      );
    }

    // Set an httpOnly cookie for admin session
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: IS_PRODUCTION, // Only send over HTTPS in production
      sameSite: "lax", // CSRF protection
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    console.log(`Admin login successful: ${user.email} (${user.id})`);
    return res;
  } catch (err) {
    // Handle JSON parsing errors
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Explicitly handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
