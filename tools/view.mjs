#!/usr/bin/env node
// The planner's view of the world: what the engine reads before it builds.
// It stays the same size on day 900 as on day 1 — the index, the chunks
// it may build in and what stands there, the library, the chronicle's tail —
// never the whole world.
//
//   node tools/view.mjs [--root DIR]                    the view (markdown)
//        (the day number is one past the highest "Day N:" commit subject)
//   node tools/view.mjs spots <chunk> <sx>x<sz> [--root DIR]
//        fair spots in a chunk for a footprint sx × sz meters (along x and z
//        once it is turned the way it will face), centered on its floor
//        point: off the ice, off reserved spots, clear of what stands there,
//        inside the chunk, ground falling ≤ 1 m under it. Nearest to what is
//        built first (the settlement grows outward; it does not scatter).
//
// Needs MOXI like the gate.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { bounds, meets, readReport, requireMoxi, things } from "./things.mjs"

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const ROOT = resolve(opt("--root") ?? ".")
const MOXI = process.env.MOXI ?? "moxi"
const ENGINE = (process.env.PLAIN_ENGINE_EMAIL ?? "living-plain-engine@users.noreply.github.com").toLowerCase()
requireMoxi(MOXI)
const T = await import(pathToFileURL(join(ROOT, "lib/terrain.mjs")).href)
const P = await import(pathToFileURL(join(ROOT, "lib/places.mjs")).href)

const index = JSON.parse(readFileSync(join(ROOT, "world/index.json"), "utf8"))
const built = new Set(index.chunks)
const key = (cx, cz) => `${cx}_${cz}`
const parse = (k) => k.split("_").map(Number)

/** the chunks an ordinary day may build in: the built ones and their eight neighbors */
function reachable() {
  const out = new Set()
  for (const k of built) { const [cx, cz] = parse(k); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) out.add(key(cx + dx, cz + dz)) }
  return [...out].sort()
}

/** what stands in a chunk: each thing's name, kind, footprint (local) and height */
function standing(k) {
  if (!built.has(k)) return []
  const script = join(ROOT, "world/chunks", `${k}.md`)
  const src = readFileSync(script, "utf8")
  const { things: ts } = things(readReport(MOXI, script))
  return [...ts].map(([name, parts]) => {
    const b = bounds(parts)
    const kind = src.match(new RegExp(`part\\s+${name}\\s*\\{\\s*thing\\s*=\\s*(\\w+)`))?.[1] ?? "?"
    return { name, kind, b }
  })
}

/** git log of the world, newest first: { date, who, subject } */
function history(n) {
  try {
    const raw = execFileSync("git", ["-C", ROOT, "log", `-n${n}`, "--format=%aI%x1f%ae%x1f%s"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return raw.trim().split("\n").filter(Boolean).map((l) => { const [date, email, subject] = l.split("\x1f"); return { date, who: email.toLowerCase() === ENGINE ? "the Actions" : "The Architect", subject } })
  } catch { return [] }
}

/** the next day's number: one past the highest "Day N:" in the history (days are
 *  counted by the world's own days, not the calendar: inceptions may run
 *  several times in an afternoon, and a skipped day still counts) */
function nextDay() {
  let raw = ""
  try { raw = execFileSync("git", ["-C", ROOT, "log", "--format=%s"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) } catch {}
  let hi = -1
  for (const l of raw.split("\n")) { const m = l.match(/^Day (\d+):/); if (m) hi = Math.max(hi, +m[1]) }
  return hi + 1
}

function fmt(b) { return `x ${b.x0.toFixed(1)}..${b.x1.toFixed(1)}, z ${b.z0.toFixed(1)}..${b.z1.toFixed(1)}, ${(b.y1).toFixed(1)} m tall` }

// ── spots ──────────────────────────────────────────────────────────────

function spots(k, sx, sz) {
  const [cx, cz] = parse(k), [ox, oz] = T.chunkCenter(cx, cz)
  const here = standing(k).map((t) => t.b)
  // everything built nearby, in world coordinates, for "nearest to the settlement"
  const near = []
  for (const n of reachable()) { const [nx, nz] = parse(n), [nox, noz] = T.chunkCenter(nx, nz); for (const t of standing(n)) near.push([(t.b.x0 + t.b.x1) / 2 + nox, (t.b.z0 + t.b.z1) / 2 + noz]) }
  const half = T.CHUNK / 2 - 1, out = []
  for (let x = -31; x <= 31; x++) for (let z = -31; z <= 31; z++) {
    const f = { x0: x - sx / 2, x1: x + sx / 2, z0: z - sz / 2, z1: z + sz / 2 }
    if (f.x0 < -half || f.x1 > half || f.z0 < -half || f.z1 > half) continue
    const pad = { x0: f.x0 - 2, x1: f.x1 + 2, z0: f.z0 - 2, z1: f.z1 + 2 }
    if (here.some((b) => meets(b, pad))) continue
    const w = { x0: f.x0 + ox, x1: f.x1 + ox, z0: f.z0 + oz, z1: f.z1 + oz }
    if (P.RESERVED.some((r) => meets(r, w))) continue
    let ice = false
    for (let a = w.x0; a <= w.x1 + 1e-9; a += 0.5) for (let c = w.z0; c <= w.z1 + 1e-9; c += 0.5) if (T.onIce(a, c)) ice = true
    if (ice) continue
    const { lo, hi } = T.footprintRange(w.x0, w.z0, w.x1, w.z1)
    if (hi - lo > 1) continue
    const dist = near.length ? Math.min(...near.map(([a, c]) => Math.hypot(a - (x + ox), c - (z + oz)))) : Math.hypot(x + ox, z + oz)
    const river = Math.abs(x + ox - T.riverX(z + oz))
    out.push({ x, z, fall: hi - lo, dist, river })
  }
  out.sort((a, b) => a.dist - b.dist)
  // spread them out: no two listed spots closer than 6 m
  const pick = []
  for (const s of out) { if (pick.every((p) => Math.hypot(p.x - s.x, p.z - s.z) >= 6)) pick.push(s); if (pick.length >= 12) break }
  console.log(`fair spots in chunk ${k} for a ${sx} × ${sz} m footprint (local x, z of the floor point; nearest to what is built first):`)
  if (!pick.length) console.log("  none: try a smaller footprint or another chunk")
  for (const s of pick) console.log(`  x=${s.x}, z=${s.z} · ground falls ${s.fall.toFixed(2)} m · ${s.dist.toFixed(0)} m from the nearest built thing · ${s.river.toFixed(0)} m from the river's centerline`)
}

// ── the view ───────────────────────────────────────────────────────────

function view() {
  const day = nextDay()
  const hist = history(30)
  const todayISO = new Date().toISOString().slice(0, 10)
  const builtToday = hist.some((h) => h.who === "the Actions" && h.date.slice(0, 10) === todayISO)
  const L = []
  L.push(`# The plain, as the planner sees it`)
  L.push("")
  L.push(`- today is day ${day} (one past the last "Day N:" in the history)${day > 0 && day % 7 === 0 ? " — **a seventh day**: one structural move is allowed (RULES.md)" : ""}`)
  if (builtToday) L.push(`- **the Actions already built today** (calendar, UTC): in live mode, do nothing and end the run; inceptions may run again`)
  L.push(`- terrain v${index.terrain}, chunks of ${index.chunk} m; built chunks: ${[...built].join(", ")}`)
  L.push(`- an ordinary day builds in one of: ${reachable().join(", ")}`)
  L.push(`- kept clear (world x, z): ${P.RESERVED.map((r) => `${r.name} ${r.x0}..${r.x1}, ${r.z0}..${r.z1}`).join("; ")}`)
  L.push("")
  L.push(`## What stands (chunk-local footprints)`)
  for (const k of [...built].sort()) {
    const [cx, cz] = parse(k), [ox, oz] = T.chunkCenter(cx, cz)
    L.push("", `### ${k} (center at world ${ox}, ${oz}; the river's centerline crosses at local x ≈ ${(T.riverX(oz) - ox).toFixed(0)})`)
    for (const t of standing(k)) L.push(`- ${t.name}: a ${t.kind} · ${fmt(t.b)}`)
  }
  L.push("", `## The library (world/lib/: import, don't copy)`)
  const lib = join(ROOT, "world/lib")
  for (const f of existsSync(lib) ? readdirSync(lib).filter((f) => f.endsWith(".md")).sort() : []) {
    const src = readFileSync(join(lib, f), "utf8")
    const sig = src.match(/thing\s+(\w+)\s*(\([^)]*\))?/)
    const blurb = src.split("\n").slice(1).join(" ").trim().split(/\n\n|```/)[0].trim().split(". ")[0]
    const anchors = [...src.matchAll(/anchor\s+(\w+)\s*=/g)].map((m) => m[1])
    L.push(`- \`${f}\`: \`${sig ? sig[1] + (sig[2] ?? "") : "?"}\`${anchors.length ? ` · anchors ${anchors.join(", ")}` : ""} — ${blurb}.`)
  }
  L.push("", `## The chronicle, newest first (last ${hist.length})`)
  if (!hist.length) L.push("- (no history yet)")
  for (const h of hist) L.push(`- ${h.date.slice(0, 10)} · ${h.who} · ${h.subject}`)
  console.log(L.join("\n"))
}

if (args[0] === "spots") {
  const [, k, size] = args
  const m = size?.match(/^([\d.]+)x([\d.]+)$/)
  if (!k || !m) { console.error("usage: node tools/view.mjs spots <chunk> <sx>x<sz>"); process.exit(2) }
  spots(k, +m[1], +m[2])
} else view()
