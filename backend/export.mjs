#!/usr/bin/env node
/* =========================================================================
   export.mjs — pull registrations from DynamoDB and suggest roundtable groups.

   Usage:
     node export.mjs                 # table + region from defaults below
     TABLE=MyTable REGION=us-east-1 node export.mjs
     node export.mjs --cap 8         # force a max per-table capacity

   Requires the AWS CLI configured with credentials that can scan the table
   (`aws configure`). No npm install needed.

   Writes:
     registrations.csv     — every response, one row per person
     suggested-groups.csv  — a balanced first-pass table assignment
   ...and prints a satisfaction summary.
   ========================================================================= */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const TABLE = process.env.TABLE || "BeyondProductivityRegistrations";
const REGION = process.env.REGION || "us-east-1";
const ROUNDTABLES = [
  { id: "R1", leader: "Mathijs de Vaan" },
  { id: "R2", leader: "Natalie Carlson" },
  { id: "R3", leader: "Charles Ayoubi" },
  { id: "R4", leader: "Sahiba Chopra" },
  { id: "R5", leader: "Michael Impink" },
];
const capArg = process.argv.indexOf("--cap");
const FORCED_CAP = capArg > -1 ? Number(process.argv[capArg + 1]) : null;

// ── Scan DynamoDB (handles pagination) ─────────────────────────────────────
function scanAll() {
  const items = [];
  let startKey = null;
  do {
    const args = ["dynamodb", "scan", "--table-name", TABLE, "--region", REGION, "--output", "json"];
    if (startKey) args.push("--exclusive-start-key", JSON.stringify(startKey));
    let out;
    try {
      out = execFileSync("aws", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      console.error("\n✗ AWS scan failed. Is the AWS CLI configured and the table name correct?");
      console.error(`  TABLE=${TABLE}  REGION=${REGION}`);
      console.error(e.stderr?.toString() || e.message);
      process.exit(1);
    }
    const res = JSON.parse(out);
    items.push(...(res.Items || []));
    startKey = res.LastEvaluatedKey || null;
  } while (startKey);
  return items.map(unmarshal);
}

// Minimal DynamoDB JSON -> plain object.
function unmarshal(av) {
  if (av.S !== undefined) return av.S;
  if (av.N !== undefined) return Number(av.N);
  if (av.BOOL !== undefined) return av.BOOL;
  if (av.NULL !== undefined) return null;
  if (av.M !== undefined) {
    const o = {};
    for (const k in av.M) o[k] = unmarshal(av.M[k]);
    return o;
  }
  if (av.L !== undefined) return av.L.map(unmarshal);
  const o = {};
  for (const k in av) o[k] = unmarshal(av[k]);
  return o;
}

// ── CSV helper ─────────────────────────────────────────────────────────────
const esc = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows) => rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";

// ── Balanced greedy assignment ─────────────────────────────────────────────
// Everyone gets the highest-ranked table with room. Capacity = ceil(N/5),
// or --cap. Order = submission time (deterministic, fair to early sign-ups).
function assignGroups(people) {
  const N = people.length;
  const cap = FORCED_CAP || Math.max(1, Math.ceil(N / ROUNDTABLES.length));
  const count = Object.fromEntries(ROUNDTABLES.map((r) => [r.id, 0]));
  const assignment = new Map();

  const ordered = [...people].sort((a, b) =>
    String(a.submittedAt).localeCompare(String(b.submittedAt))
  );

  for (let rank = 1; rank <= 5; rank++) {
    for (const p of ordered) {
      if (assignment.has(p.email)) continue;
      const table = ROUNDTABLES.find((r) => (p.rankings?.[r.id]) === rank);
      if (table && count[table.id] < cap) {
        assignment.set(p.email, { table: table.id, rankReceived: rank });
        count[table.id]++;
      }
    }
  }
  // Anyone still unassigned (capacity math edge cases) -> least-full table.
  for (const p of ordered) {
    if (assignment.has(p.email)) continue;
    const table = ROUNDTABLES.slice().sort((a, b) => count[a.id] - count[b.id])[0];
    const got = p.rankings?.[table.id] ?? 0;
    assignment.set(p.email, { table: table.id, rankReceived: got });
    count[table.id]++;
  }
  return { assignment, cap, count };
}

// ── Run ────────────────────────────────────────────────────────────────────
const people = scanAll();
if (people.length === 0) {
  console.log(`No registrations found in "${TABLE}" (${REGION}) yet.`);
  process.exit(0);
}

// registrations.csv
const regHeader = [
  "firstName", "lastName", "email", "position", "institution", "researchInterests",
  ...ROUNDTABLES.map((r) => `rank_${r.id}`), "submittedAt",
];
const regRows = people.map((p) => [
  p.firstName, p.lastName, p.email, p.position, p.institution, p.researchInterests,
  ...ROUNDTABLES.map((r) => p.rankings?.[r.id] ?? ""), p.submittedAt,
]);
writeFileSync("registrations.csv", toCSV([regHeader, ...regRows]));

// suggested-groups.csv
const { assignment, cap, count } = assignGroups(people);
const grpHeader = ["assignedTable", "leader", "rankReceived", "firstName", "lastName", "email", "institution", "position"];
const grpRows = people
  .map((p) => ({ p, a: assignment.get(p.email) }))
  .sort((x, y) => x.a.table.localeCompare(y.a.table) || x.a.rankReceived - y.a.rankReceived)
  .map(({ p, a }) => {
    const leader = ROUNDTABLES.find((r) => r.id === a.table).leader;
    return [a.table, leader, a.rankReceived, p.firstName, p.lastName, p.email, p.institution, p.position];
  });
writeFileSync("suggested-groups.csv", toCSV([grpHeader, ...grpRows]));

// Console summary
const sat = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0 };
for (const { rankReceived } of assignment.values()) sat[rankReceived]++;
console.log(`\n✓ ${people.length} registrations exported.`);
console.log(`  Capacity per table: ${cap}`);
console.log("\n  Table sizes:");
for (const r of ROUNDTABLES) console.log(`    ${r.id} · ${r.leader.padEnd(16)} ${count[r.id]}`);
console.log("\n  Assignment satisfaction:");
console.log(`    1st choice: ${sat[1]}   2nd: ${sat[2]}   3rd: ${sat[3]}   4th: ${sat[4]}   5th: ${sat[5]}` + (sat[0] ? `   (overflow: ${sat[0]})` : ""));
console.log("\n  Files written: registrations.csv, suggested-groups.csv\n");
