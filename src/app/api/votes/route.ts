import { NextResponse } from "next/server";

interface VoteData {
  totalX: number;
  count: number;
}

const COMPANIES = [
  "every",
  "base-power",
  "cursor",
  "raycast",
  "macro",
  "midjourney",
  "sandbar",
  "infinite-machine",
  "opal",
  "substack",
  "physical-intelligence",
  "cosmos",
  "avec",
  "thru",
];

// Try to use Vercel KV if available, otherwise fall back to in-memory
let kv: typeof import("@vercel/kv").kv | null = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kv = (await import("@vercel/kv")).kv;
  }
} catch {
  // KV not configured
}

// In-memory fallback (resets on cold start, but works without KV)
const memoryStore = new Map<string, VoteData>();

async function getData(key: string): Promise<VoteData | null> {
  if (kv) return kv.get<VoteData>(key);
  return memoryStore.get(key) ?? null;
}

async function setData(key: string, value: VoteData): Promise<void> {
  if (kv) {
    await kv.set(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

export async function GET() {
  try {
    const results: Record<string, { averageX: number; count: number }> = {};
    for (const company of COMPANIES) {
      const data = await getData(`votes:${company}`);
      if (data) {
        results[company] = {
          averageX: data.totalX / data.count,
          count: data.count,
        };
      }
    }
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const votes: Record<string, number> = body.votes;

    for (const [company, x] of Object.entries(votes)) {
      if (!COMPANIES.includes(company)) continue;
      if (typeof x !== "number" || x < 0 || x > 1) continue;

      const existing = await getData(`votes:${company}`);
      const updated: VoteData = existing
        ? { totalX: existing.totalX + x, count: existing.count + 1 }
        : { totalX: x, count: 1 };

      await setData(`votes:${company}`, updated);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save votes" }, { status: 500 });
  }
}
