import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { employees } from "@/lib/data";

export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(employees);
}
