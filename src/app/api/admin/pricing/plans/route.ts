import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const PLANS_KEY = "pricing:plans";

type Plan = {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features?: string[];
  popular?: boolean;
  cta?: string;
  stripePriceId?: string;
  paymentType?: 'subscription' | 'payment';
  amount?: number;
  currency?: string;
};

async function getPlans(): Promise<Plan[]> {
  const raw = await redis.get(PLANS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function savePlans(plans: Plan[]) {
  await redis.set(PLANS_KEY, JSON.stringify(plans));
}

export async function GET() {
  const plans = await getPlans();
  return NextResponse.json({ plans });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const plans = await getPlans();
  const op = body?.op as string | undefined;

  if (op === "add") {
    const item: Plan = body?.item;
    if (!item?.name || !item?.price) {
      return NextResponse.json({ error: "name and price are required" }, { status: 400 });
    }
    const next = [item, ...plans];
    await savePlans(next);
    return NextResponse.json({ ok: true });
  }

  const index = body?.index as number;
  const item: Plan = body?.item;
  if (typeof index !== "number" || index < 0 || index >= plans.length) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  plans[index] = item;
  await savePlans(plans);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const index = body?.index as number;
  const plans = await getPlans();
  if (typeof index !== "number" || index < 0 || index >= plans.length) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  const next = plans.filter((_, i) => i !== index);
  await savePlans(next);
  return NextResponse.json({ ok: true });
}
