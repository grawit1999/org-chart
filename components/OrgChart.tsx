"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { Employee } from "@/lib/data";

type Detail = Employee & { manager_name: string | null; direct_report_count: number };
const COLORS = ["#6b7280", "#2563eb", "#d97706", "#059669", "#7c3aed", "#db2777"];
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const HOME = { x: 40, y: 40, k: 1 };

function Avatar({ e }: { e: { name: string; photo_url?: string | null } }) {
  const [bad, setBad] = useState(false);
  return e.photo_url && !bad ? <img className="av" src={e.photo_url} alt="" onError={() => setBad(true)} /> : <div className="av">{initials(e.name)}</div>;
}

export default function OrgChart({ user }: { user: { name: string; image: string | null } }) {
  const [emps, setEmps] = useState<Employee[] | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dept, setDept] = useState(""); const [div, setDiv] = useState("");
  const [q, setQ] = useState(""); const [results, setResults] = useState<Employee[] | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null); const [detailErr, setDetailErr] = useState("");
  const [view, setView] = useState(HOME);
  const viewRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError(""); setEmps(null);
    fetch("/api/employees").then((r) => { if (!r.ok) throw new Error(r.status === 401 ? "Session expired. Please sign in again." : "Could not load employees."); return r.json(); })
      .then((d: Employee[]) => { setEmps(d); const root = d.find((e) => !e.manager_id); setExpanded(new Set(root ? [root.id] : [])); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const { byId, kids, root } = useMemo(() => {
    const byId = new Map<string, Employee>(); const kids = new Map<string, Employee[]>();
    (emps ?? []).forEach((e) => byId.set(e.id, e));
    (emps ?? []).forEach((e) => { if (e.manager_id) kids.set(e.manager_id, [...(kids.get(e.manager_id) ?? []), e]); });
    kids.forEach((l) => l.sort((a, b) => a.name.localeCompare(b.name)));
    return { byId, kids, root: (emps ?? []).find((e) => !e.manager_id) };
  }, [emps]);

  const divisionsByDept = useMemo(() => {
    const m = new Map<string, Set<string>>(); (emps ?? []).forEach((e) => m.set(e.department, (m.get(e.department) ?? new Set()).add(e.division)));
    return m;
  }, [emps]);
  const depts = [...divisionsByDept.keys()].sort();
  const divs = dept ? [...(divisionsByDept.get(dept) ?? [])].sort() : [...new Set([...divisionsByDept.values()].flatMap((s) => [...s]))].sort();

  const ancestors = useCallback((id: string) => { const out: string[] = []; let c = byId.get(id)?.manager_id; while (c) { out.push(c); c = byId.get(c)?.manager_id; } return out; }, [byId]);
  const filtering = !!(dept || div);
  const { matches, keep } = useMemo(() => {
    const matches = new Set<string>(), keep = new Set<string>();
    if (!filtering) return { matches, keep };
    (emps ?? []).forEach((e) => { if ((!dept || e.department === dept) && (!div || e.division === div)) { matches.add(e.id); keep.add(e.id); ancestors(e.id).forEach((a) => keep.add(a)); } });
    if (selId) { keep.add(selId); ancestors(selId).forEach((a) => keep.add(a)); }
    return { matches, keep };
  }, [emps, dept, div, selId, filtering, ancestors]);

  // search (server-side, across all employees, independent of filters)
  useEffect(() => {
    if (!q.trim()) { setResults(null); return; }
    let live = true;
    const t = setTimeout(() => fetch("/api/employees/search?q=" + encodeURIComponent(q)).then((r) => r.json()).then((d) => live && setResults(Array.isArray(d) ? d : [])).catch(() => live && setResults([])), 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  // details (server-side)
  useEffect(() => {
    setDetail(null); setDetailErr("");
    if (!selId) return;
    fetch("/api/employees/" + selId).then((r) => { if (!r.ok) throw new Error(r.status === 404 ? "Employee not found." : "Could not load details."); return r.json(); }).then(setDetail).catch((e) => setDetailErr(e.message));
  }, [selId]);

  const centerOn = (id: string) => setTimeout(() => {
    const el = document.getElementById("n-" + id), box = viewRef.current;
    if (!el || !box) return;
    const a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    setView((v) => ({ ...v, x: v.x + (b.left + b.width / 2 - (a.left + a.width / 2)), y: v.y + (b.top + b.height / 2 - (a.top + a.height / 2)) }));
  }, 60);
  const pick = (id: string, center: boolean) => {
    setSelId(id);
    if (center) { setExpanded((s) => new Set([...s, ...ancestors(id)])); setResults(null); centerOn(id); }
  };
  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const reset = () => { setQ(""); setResults(null); setDept(""); setDiv(""); setSelId(null); setExpanded(new Set(root ? [root.id] : [])); setView(HOME); };
  const clearFilters = () => { setDept(""); setDiv(""); };

  // pan & zoom
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,[data-card]")) return;
    drag.current = { x: e.clientX, y: e.clientY };
    const move = (m: PointerEvent) => { if (!drag.current) return; const dx = m.clientX - drag.current.x, dy = m.clientY - drag.current.y; drag.current = { x: m.clientX, y: m.clientY }; setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy })); };
    const up = () => { drag.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const zoom = (f: number, cx?: number, cy?: number) => setView((v) => {
    const k = Math.min(2, Math.max(0.2, v.k * f)); const b = viewRef.current!.getBoundingClientRect();
    const mx = cx ?? b.width / 2, my = cy ?? b.height / 2;
    return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k };
  });

  const renderNode = (e: Employee): React.ReactNode => {
    const all = kids.get(e.id) ?? [];
    const vis = filtering ? all.filter((k) => keep.has(k.id)) : all;
    const open = filtering ? vis.length > 0 : expanded.has(e.id);
    const match = !filtering || matches.has(e.id);
    return (
      <div className="node" key={e.id}>
        <div id={"n-" + e.id} data-card className={`card ${match ? "" : "ctx"} ${selId === e.id ? "sel" : ""}`} style={{ borderLeftColor: COLORS[depts.indexOf(e.department) % COLORS.length] }} onClick={() => pick(e.id, false)}>
          <Avatar e={e} />
          <div><b>{e.name}</b>{e.job_title}<small>{e.department} · {e.division}</small>{!match && <em>Context only (outside filter)</em>}</div>
          {all.length > 0 && !filtering && <button className="tog" aria-label={open ? "Collapse team" : "Expand team"} onClick={(ev) => { ev.stopPropagation(); toggle(e.id); }}>{open ? "−" : all.length}</button>}
        </div>
        {open && vis.length > 0 && <div className="kids">{vis.map(renderNode)}</div>}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="bar">
        <div className="sbox">
          <input aria-label="Search" placeholder="Search name or job title…" value={q} onChange={(e) => setQ(e.target.value)} />
          {results && (
            <div className="res">
              {results.length === 0 && <div className="msg" style={{ padding: 12 }}>No matching employees.</div>}
              {results.slice(0, 50).map((r) => (<button key={r.id} onClick={() => pick(r.id, true)}><b>{r.name}</b> <small>{r.job_title} — {r.department} / {r.division} ({r.id})</small></button>))}
              {results.length > 50 && <div className="msg" style={{ padding: 8 }}>Showing 50 of {results.length}. Refine your search.</div>}
            </div>
          )}
        </div>
        <select aria-label="Department" value={dept} onChange={(e) => { const d = e.target.value; setDept(d); if (div && d && !divisionsByDept.get(d)?.has(div)) setDiv(""); }}>
          <option value="">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select aria-label="Division" value={div} onChange={(e) => setDiv(e.target.value)}>
          <option value="">All divisions</option>{divs.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button onClick={clearFilters} disabled={!filtering}>Clear filters</button>
        <button onClick={reset}>Reset view</button>
        <div className="sp" />
        <div className="user"><Avatar e={{ name: user.name, photo_url: user.image }} /><span>{user.name}</span><button onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button></div>
      </div>
      <div className="view" ref={viewRef} onPointerDown={onDown} onWheel={(e) => { const b = e.currentTarget.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - b.left, e.clientY - b.top); }}>
        {error && <div className="msg"><p>{error}</p><button onClick={load}>Retry</button></div>}
        {!error && !emps && <div className="msg">Loading organization…</div>}
        {emps && filtering && matches.size === 0 && <div className="msg">No employees match these filters. <button onClick={clearFilters}>Clear filters</button></div>}
        {emps && root && <div className="canvas" style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})` }}>{renderNode(root)}</div>}
        <div className="zoom"><button aria-label="Zoom in" onClick={() => zoom(1.2)}>+</button><button aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>−</button></div>
      </div>
      {selId && (
        <aside className="side" aria-label="Employee details">
          <button className="close bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={() => setSelId(null)}>Close ✕</button>
          {detailErr && <p className="err">{detailErr}</p>}
          {!detail && !detailErr && <p>Loading…</p>}
          {detail && (<>
            <Avatar e={detail} /><h2>{detail.name}</h2>
            <dl>
              <dt>Job title</dt><dd>{detail.job_title}</dd><dt>Department</dt><dd>{detail.department}</dd><dt>Division</dt><dd>{detail.division}</dd>
              <dt>Country</dt><dd>{detail.country}</dd><dt>Email</dt><dd>{detail.email}</dd>
              <dt>Manager</dt><dd>{detail.manager_name ?? "No manager (top executive)"}</dd><dt>Direct reports</dt><dd>{detail.direct_report_count}</dd>
            </dl>
          </>)}
        </aside>
      )}
    </div>
  );
}
