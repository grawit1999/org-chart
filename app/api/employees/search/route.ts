import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { employees } from "@/lib/data";

export async function GET(req: Request) {
  if (!(await currentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json([]);
  const hits = employees.filter((e) => e.name.toLowerCase().includes(q) || e.job_title.toLowerCase().includes(q));
  return NextResponse.json(hits.sort((a, b) => a.name.localeCompare(b.name))); // empty array when nothing matches
}
