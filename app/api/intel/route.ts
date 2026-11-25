import type { NextRequest } from "next/server";
import { fail, meta, ok, requireSession } from "@/lib/server/guard";
import { topicNews } from "@/lib/server/gdelt";
import { GDELT_TOPICS, type TopicId } from "@/lib/intel";

export const maxDuration = 60; // GDELT can be slow and rate-limited

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return fail(new Error("unauthorized"), 401);
  const topic = req.nextUrl.searchParams.get("topic") as TopicId;
  if (!GDELT_TOPICS.some(t => t.id === topic)) return fail(Object.assign(new Error("Unknown topic"), { status: 400 }));
  try {
    const r = await topicNews(topic);
    return ok(r.items, { ...meta("gdelt", r.stale ? "historical" : "delayed", r.stale ? "GDELT temporarily unavailable: showing the last copy" : "GDELT, refreshed about every 20 minutes"), asOf: r.fetchedAt });
  } catch (e) { return fail(e, 503); }
}
