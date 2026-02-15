import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
  // TODO: switch to typed `db.helpSection` after running `npm run db:generate`
  const rows = await (db as any).helpSection.findMany();
    const map: Record<string, any[]> = {};
    for (const r of rows) {
      // data is a JSON array by convention
      map[r.key] = Array.isArray(r.data) ? (r.data as any[]) : [];
    }
    return NextResponse.json(map);
  } catch (e) {
    console.error("Error loading help sections", e);
    return NextResponse.json({}, { status: 200 });
  }
}
