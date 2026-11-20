// Deterministic generator + validator. Run: npm run data
import fs from "node:fs";
let s = 20260611;
const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const FIRST = "Anna Ben Chai Dara Elena Farid Grace Hiro Ines Jon Kavya Liam Mei Nong Omar Priya Quinn Rosa Sam Tara Uma Victor Wen Xavi Yuki Zara Arun Bella Carlos Dewi".split(" ");
const LAST = "Novak Tanaka Silva Chen Kumar Okafor Lindgren Santos Nguyen Baker Rossi Wong Haddad Ivanov Sato Moreau Patel Khan Larsen Reyes Suwan Park Costa Meyer Das Ito Walker Lopez Ahmed Fischer".split(" ");
const COUNTRIES = ["Thailand","Thailand","Thailand","Singapore","Japan","Australia","United Kingdom","United States","Germany","India","Vietnam","Indonesia"];
const T = {
  "Software Development": [["Engineering Manager"],["Tech Lead","Team Lead"],["Software Engineer","Senior Software Engineer","QA Engineer","Frontend Developer","Backend Developer"]],
  "IT Infrastructure": [["Infrastructure Manager"],["Systems Lead","Network Lead"],["Systems Administrator","Network Engineer","DevOps Engineer","Security Analyst"]],
  "Sales": [["Regional Sales Manager"],["Sales Team Lead"],["Sales Executive","Account Manager","Sales Representative"]],
  "Marketing": [["Marketing Manager"],["Campaign Lead","Content Lead"],["Content Specialist","Digital Marketer","Brand Designer","SEO Analyst"]],
  "Operations": [["Operations Manager"],["Operations Team Lead"],["Operations Coordinator","Booking Specialist","Supplier Relations Officer","Logistics Analyst"]],
  "Product": [["Product Manager"],["Senior Product Owner"],["Product Analyst","UX Designer","Product Owner"]],
  "Finance": [["Finance Manager"],["Senior Accountant"],["Accountant","Financial Analyst","Payroll Officer","Accounts Payable Clerk"]],
  "Human Resources": [["HR Manager"],["HR Team Lead"],["Recruiter","HR Generalist","Talent Partner","Learning Specialist"]],
  "Customer Service": [["Customer Support Manager"],["Support Team Lead"],["Support Agent","Customer Care Specialist","Support Associate"]],
  "Guest Relations": [["Guest Relations Manager"],["Guest Experience Lead"],["Guest Relations Officer","Concierge Agent","Experience Coordinator"]],
};
const emps = [], emails = new Set();
function add(title, department, division, mgr) {
  const id = "EMP" + String(emps.length + 1).padStart(4, "0");
  const name = emps.length > 20 && rnd() < 0.012 ? pick(emps).name : `${pick(FIRST)} ${pick(LAST)}`; // occasional duplicate names
  const base = name.toLowerCase().replace(/[^a-z]+/g, ".");
  let email = `${base}@example.com`, n = 1;
  while (emails.has(email)) email = `${base}${++n}@example.com`;
  emails.add(email);
  const e = { id, name, job_title: title, department, division, country: pick(COUNTRIES), email, manager_id: mgr ? mgr.id : null, photo_url: null };
  emps.push(e); return e;
}
// head is already created and counted in the division; n = remaining people. big = ICs reporting directly to the first manager.
function fill(dept, div, head, n, big = 0) {
  const [m, l, ic] = T[div];
  const M = Math.max(1, Math.round(n / 32));
  const mgrs = Array.from({ length: M }, () => add(pick(m), dept, div, head));
  let rest = n - M;
  const L = Math.round(rest / 7);
  const leads = Array.from({ length: L }, (_, i) => add(pick(l), dept, div, mgrs[i % M]));
  rest -= L + big;
  for (let i = 0; i < big; i++) add(pick(ic), dept, div, mgrs[0]);
  for (let i = 0; i < rest; i++) add(pick(ic), dept, div, i < L ? leads[i] : leads[Math.floor(rnd() * L)]);
}
const EX = ["Executive Office", "Executive Management"];
const ceo = add("Chief Executive Officer", ...EX, null);
const cos = add("Chief of Staff", ...EX, ceo);
add("Executive Assistant", ...EX, ceo); add("Executive Assistant", ...EX, ceo); add("Strategy Analyst", ...EX, cos);
const cto = add("Chief Technology Officer", "Technology", "Software Development", ceo); fill("Technology", "Software Development", cto, 189);
const itd = add("Director of IT Infrastructure", "Technology", "IT Infrastructure", cto); fill("Technology", "IT Infrastructure", itd, 79);
const cco = add("Chief Commercial Officer", "Commercial", "Sales", ceo); fill("Commercial", "Sales", cco, 129, 32);
const mkd = add("Director of Marketing", "Commercial", "Marketing", cco); fill("Commercial", "Marketing", mkd, 69);
const coo = add("Chief Operating Officer", "Travel Services", "Operations", ceo); fill("Travel Services", "Operations", coo, 149);
const prd = add("Director of Product", "Travel Services", "Product", cto); fill("Travel Services", "Product", prd, 69); // cross-department reporting line
const cfo = add("Chief Financial Officer", "Corporate Services", "Finance", ceo); fill("Corporate Services", "Finance", cfo, 59);
const cpo = add("Chief People Officer", "Corporate Services", "Human Resources", ceo); fill("Corporate Services", "Human Resources", cpo, 44);
const ccx = add("Chief Customer Officer", "Customer Experience", "Customer Service", ceo); fill("Customer Experience", "Customer Service", ccx, 139, 38);
const grd = add("Director of Guest Relations", "Customer Experience", "Guest Relations", ccx); fill("Customer Experience", "Guest Relations", grd, 59);

// ---- validation ----
const MAP = { "Executive Office": ["Executive Management"], Technology: ["Software Development", "IT Infrastructure"], Commercial: ["Sales", "Marketing"], "Travel Services": ["Operations", "Product"], "Corporate Services": ["Finance", "Human Resources"], "Customer Experience": ["Customer Service", "Guest Relations"] };
const fail = (m) => { console.error("VALIDATION FAILED:", m); process.exit(1); };
const byId = new Map(emps.map((e) => [e.id, e]));
if (emps.length !== 1000) fail("count " + emps.length);
if (byId.size !== 1000 || emails.size !== 1000) fail("unique id/email");
const roots = emps.filter((e) => e.manager_id === null); if (roots.length !== 1 || roots[0].division !== "Executive Management") fail("root");
const kids = new Map(); const level = new Map([[ceo.id, 1]]);
for (const e of emps) {
  if (!MAP[e.department]?.includes(e.division)) fail("dept/division " + e.id);
  if (!e.email.endsWith("@example.com")) fail("email domain");
  if (e.manager_id) { if (e.manager_id === e.id || !byId.has(e.manager_id)) fail("manager " + e.id); if (!kids.has(e.manager_id)) kids.set(e.manager_id, []); kids.get(e.manager_id).push(e.id); }
}
const q = [ceo.id]; while (q.length) { const id = q.shift(); for (const k of kids.get(id) ?? []) { level.set(k, level.get(id) + 1); q.push(k); } }
if (level.size !== 1000) fail("disconnected or circular: reached " + level.size);
const maxL = Math.max(...level.values()); if (maxL < 5 || maxL > 7) fail("levels " + maxL);
for (const d of Object.values(MAP).flat()) if (!emps.some((e) => e.division === d)) fail("empty division " + d);
const maxKids = Math.max(...[...kids.values()].map((k) => k.length)); if (maxKids < 30) fail("no 30+ manager");
const names = new Map(); for (const e of emps) names.set(e.name, (names.get(e.name) ?? 0) + 1);
const dups = [...names].filter(([, c]) => c > 1); if (!dups.length) fail("no duplicate names");
if (new Set(emps.map((e) => e.country)).size < 3) fail("countries");
const deepest = emps.find((e) => level.get(e.id) === maxL);
fs.writeFileSync("data/employees.json", JSON.stringify(emps, null, 2));
console.log(`OK: 1000 employees, levels=${maxL}, max direct reports=${maxKids}, duplicate names=${dups.length}, deepest example=${deepest.id} (${deepest.name}, level ${maxL})`);
