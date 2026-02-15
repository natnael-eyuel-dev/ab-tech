import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const FAQ_KEY = "pricing:faqs";

type FAQ = { question: string; answer: string };

async function getFaqs(): Promise<FAQ[]> {
  const raw = await redis.get(FAQ_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveFaqs(faqs: FAQ[]) {
  await redis.set(FAQ_KEY, JSON.stringify(faqs));
}

export async function GET() {
  const faqs = await getFaqs();
  return NextResponse.json({ faqs });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const faqs = await getFaqs();
  const op = body?.op as string | undefined;

  if (op === "add") {
    const item: FAQ = body?.item;
    if (!item?.question || !item?.answer) {
      return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
    }
    const next = [item, ...faqs];
    await saveFaqs(next);
    return NextResponse.json({ ok: true });
  }

  const index = body?.index as number;
  const item: FAQ = body?.item;
  if (typeof index !== "number" || index < 0 || index >= faqs.length) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  faqs[index] = item;
  await saveFaqs(faqs);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const index = body?.index as number;
  const faqs = await getFaqs();
  if (typeof index !== "number" || index < 0 || index >= faqs.length) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  const next = faqs.filter((_, i) => i !== index);
  await saveFaqs(next);
  return NextResponse.json({ ok: true });
}
