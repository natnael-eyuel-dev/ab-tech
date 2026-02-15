import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

const ALLOWED_KEYS = ["categories", "popularArticles", "videoTutorials"] as const;

type AllowedKey = typeof ALLOWED_KEYS[number];

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req });
  const role = (token as any)?.role;
  if (!role || (role !== "ADMIN" && role !== "MODERATOR")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin(req);
  if (unauth) return unauth;
  try {
  // TODO: switch to typed `db.helpSection` after running `npm run db:generate`
  const rows = await (db as any).helpSection.findMany();
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Admin GET help sections error", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Upsert full sections payload: [{ key, data }]
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin(req);
  if (unauth) return unauth;
  try {
    const body = await req.json();
    if (!Array.isArray(body)) return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    const ops: any[] = [];
    for (const item of body) {
      const key = item?.key as AllowedKey;
      if (!ALLOWED_KEYS.includes(key)) continue;
      ops.push(
        (db as any).helpSection.upsert({
          where: { key },
          create: { key, data: item.data ?? [] },
          update: { data: item.data ?? [] },
        })
      );
    }
    const res = await db.$transaction(ops);
    return NextResponse.json(res);
  } catch (e) {
    console.error("Admin POST help sections error", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PATCH single item for a key: { key, index?, data }
export async function PATCH(req: NextRequest) {
  const unauth = await requireAdmin(req);
  if (unauth) return unauth;
  try {
    const body = await req.json();
    const key = body?.key as AllowedKey;
    const index = typeof body?.index === 'number' ? (body.index as number) : undefined;
    const data = body?.data;
    if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ message: "Invalid key" }, { status: 400 });

  // TODO: switch to typed `db.helpSection` after running `npm run db:generate`
  const current = await (db as any).helpSection.findUnique({ where: { key } });
    const arr = Array.isArray(current?.data) ? [...(current!.data as any[])] : [];

    if (index == null || index < 0 || index >= arr.length) {
      // append
      arr.push(data);
    } else {
      arr[index] = data;
    }

    const saved = await (db as any).helpSection.upsert({
      where: { key },
      create: { key, data: arr },
      update: { data: arr },
    });

    return NextResponse.json(saved);
  } catch (e) {
    console.error("Admin PATCH help sections error", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE single item by index: { key, index }
export async function DELETE(req: NextRequest) {
  const unauth = await requireAdmin(req);
  if (unauth) return unauth;
  try {
    const body = await req.json();
    const key = body?.key as AllowedKey;
    const index = body?.index as number;
    if (!ALLOWED_KEYS.includes(key) || typeof index !== 'number') {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

  // TODO: switch to typed `db.helpSection` after running `npm run db:generate`
  const current = await (db as any).helpSection.findUnique({ where: { key } });
    const arr = Array.isArray(current?.data) ? [...(current!.data as any[])] : [];
    if (index < 0 || index >= arr.length) return NextResponse.json({ message: "Index out of range" }, { status: 400 });

    arr.splice(index, 1);

    const saved = await (db as any).helpSection.upsert({
      where: { key },
      create: { key, data: arr },
      update: { data: arr },
    });

    return NextResponse.json(saved);
  } catch (e) {
    console.error("Admin DELETE help sections error", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
