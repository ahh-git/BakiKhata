import { NextResponse } from "next/server";
import { googleClientSecret } from "@/lib/google-secret";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(googleClientSecret),
    provider: "google",
  });
}
