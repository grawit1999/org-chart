import raw from "@/data/employees.json";

export interface Employee {
  id: string; name: string; job_title: string; department: string; division: string;
  country: string; email: string; manager_id: string | null; photo_url: string | null;
}
export const employees = raw as unknown as Employee[];
export const byId = new Map(employees.map((e) => [e.id, e]));
export const reportCount = new Map<string, number>();
for (const e of employees) if (e.manager_id) reportCount.set(e.manager_id, (reportCount.get(e.manager_id) ?? 0) + 1);
