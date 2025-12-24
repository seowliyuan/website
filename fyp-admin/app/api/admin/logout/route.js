import { NextResponse } from "next/server";

/**
 * POST /api/admin/logout
 * Logs out the admin user by clearing the admin_token cookie
 * 
 * @returns {Promise<NextResponse>} Response indicating success
 */
export async function POST() {
  try {
    const res = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // Clear the admin_token cookie
    res.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

