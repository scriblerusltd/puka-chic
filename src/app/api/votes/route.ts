import { kv } from "@vercel/kv";
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

export async function GET() {
  try {
    const results: Record<string, { averageX: number; count: number }> = {};
    for (const company of COMPANIES) {
      const data = await kv.get<VoteData>(`votes:${company}`);
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

      const existing = await kv.get<VoteData>(`votes:${company}`);
      const updated: VoteData = existing
        ? { totalX: existing.totalX + x, count: existing.count + 1 }
        : { totalX: x, count: 1 };

      await kv.set(`votes:${company}`, updated);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save votes" }, { status: 500 });
  }
}
