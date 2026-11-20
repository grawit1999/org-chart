import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { byId, reportCount } from "@/lib/data";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await currentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const e = byId.get(params.id);
  if (!e) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  const manager = e.manager_id ? byId.get(e.manager_id) : null;
  return NextResponse.json({ ...e, manager_name: manager?.name ?? null, direct_report_count: reportCount.get(e.id) ?? 0 });
}
