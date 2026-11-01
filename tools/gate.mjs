#!/usr/bin/env node
// The gate: the checks every change to the world must pass, the engine's
// and The Architect's alike. The engine runs it before committing; CI runs
// it again before anything is deployed. One implementation, used by both.
//
//   node tools/gate.mjs [--root DIR] [--chunks 0_0,1_0] [--guard BASE] [--json]
//
//   --root    the repository to check (default: .)
//   --chunks  only these chunks (default: every chunk in world/index.json)
//   --guard   also check the commits since BASE: an engine commit may only
//             touch world/ (the rules, the terrain, the gate are not its to edit)
//   --json    print the result as JSON (for the engine's run log)
//
// Checks, per chunk:
//   index     the index's terrain version is the frozen one; every listed
//             chunk has a file and every chunk file is listed
//   compile   `moxi check` passes
//   whole     every built thing is one piece (its parts all touch; the Plot
//             is its own piece); nothing but the Plot is outside a thing
//   placed    every built thing hangs by its floor on the Plot at y = 0
//             (`Name.floor on Plot.point(x=…, y=0, z=…, …)`): the viewer sets the
//             floor on the ground, and the plinth check measures from it
//   inside    every built thing's footprint is inside its chunk, ≥ 1 m from the edges
//   ice       no footprint touches the frozen river
//   slope     the ground under a footprint varies by at most 1.5 m
//   plinth    a thing reaches down at least as far as the ground falls under it
//             (so its downhill side never floats once it is set on the highest ground)
//   grain     every thing defined in a chunk or the library (but the Chunk
//             itself) sets its own `resolve grain`: under the chunk's coarse
//             0.5 m grain, parts thinner than ~0.25 m mesh to nothing
//   clear     no two things' footprints overlap; none covers a reserved spot
//             (the spawn, the Drafting Stone: lib/places.mjs)
// Exit code 0 when everything passes, 1 otherwise.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { bounds, meets, readReport, requireMoxi, things } from "./things.mjs"

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const ROOT = resolve(opt("--root") ?? ".")
const ONLY = opt("--chunks")?.split(",").filter(Boolean) ?? null
const GUARD = opt("--guard")
const JSON_OUT = args.includes("--json")
const MOXI = process.env.MOXI ?? "moxi"
const ENGINE = (process.env.PLAIN_ENGINE_EMAIL ?? "living-plain-engine@users.noreply.github.com").toLowerCase()

/** the rules' numbers (RULES.md "The ground and the chunks") */
export const LIMITS = { edge: 1, slope: 1.5, plinthSlack: 0.1 }

requireMoxi(MOXI)
const T = await import(pathToFileURL(join(ROOT, "lib/terrain.mjs")).href)
const P = await import(pathToFileURL(join(ROOT, "lib/places.mjs")).href)
const results = []
const record = (chunk, check, ok, detail = "") => results.push({ chunk, check, ok, detail })

// ── geometry from Moxi's report ────────────────────────────────────────

function sampleFootprint(f, step = 0.5) {
  const pts = []
  for (let x = f.x0; x <= f.x1 + 1e-9; x += step) for (let z = f.z0; z <= f.z1 + 1e-9; z += step) pts.push([x, z])
  for (const [x, z] of [[f.x0, f.z0], [f.x1, f.z0], [f.x0, f.z1], [f.x1, f.z1]]) pts.push([x, z])
  return pts
}

// ── the checks ─────────────────────────────────────────────────────────

function checkIndex() {
  const path = join(ROOT, "world/index.json")
  if (!existsSync(path)) { record("*", "index", false, "world/index.json is missing"); return [] }
  let index
  try { index = JSON.parse(readFileSync(path, "utf8")) } catch (e) { record("*", "index", false, `world/index.json is not JSON: ${e.message}`); return [] }
  const problems = []
  if (index.terrain !== T.TERRAIN_VERSION) problems.push(`terrain ${index.terrain} ≠ frozen ${T.TERRAIN_VERSION}`)
  if (index.chunk !== T.CHUNK) problems.push(`chunk size ${index.chunk} ≠ ${T.CHUNK}`)
  const listed = new Set(index.chunks ?? [])
  const dir = join(ROOT, "world/chunks")
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)) : []
  for (const k of listed) if (!files.includes(k)) problems.push(`${k} is listed but world/chunks/${k}.md is missing`)
  for (const k of files) if (!listed.has(k)) problems.push(`world/chunks/${k}.md is not listed in the index`)
  for (const k of listed) if (!/^-?\d+_-?\d+$/.test(k)) problems.push(`"${k}" is not a chunk key (X_Z)`)
  record("*", "index", problems.length === 0, problems.join("; "))
  return [...listed]
}

function checkChunk(key) {
  const script = join(ROOT, "world/chunks", `${key}.md`)
  const [cx, cz] = key.split("_").map(Number)
  const [ox, oz] = T.chunkCenter(cx, cz)

  try { execFileSync(MOXI, ["check", script], { stdio: ["ignore", "pipe", "pipe"] }) }
  catch (e) { record(key, "compile", false, String(e.stderr || e.stdout || e.message).trim().split("\n").slice(-3).join(" | ")); return }
  record(key, "compile", true)

  let report
  try { report = readReport(MOXI, script) }
  catch (e) { record(key, "whole", false, `moxi report failed: ${String(e.stderr || e.message).trim().split("\n").pop()}`); return }

  const { things: built, loose } = things(report)
  const broken = []
  for (const [name, parts] of built) {
    const pieces = new Set(parts.map((p) => p.piece))
    if (pieces.size > 1) broken.push(`${name} is in ${pieces.size} pieces`)
  }
  if (loose.length) broken.push(`parts outside any thing: ${loose.join(", ")}`)
  record(key, "whole", broken.length === 0, broken.join("; "))

  const text = readFileSync(script, "utf8")
  const coarse = ungrained(text).filter((n) => n !== "Chunk")
  record(key, "grain", coarse.length === 0, coarse.length ? `no \`resolve grain\` of its own: ${coarse.join(", ")}` : "")
  const unplaced = [...built.keys()].filter((name) => !new RegExp(`\\b${name}\\.floor\\s+on\\s+Plot\\.point\\(\\s*x\\s*=\\s*-?[\\d.]+\\s*,\\s*y\\s*=\\s*0(\\.0+)?\\s*,`).test(text))
  record(key, "placed", unplaced.length === 0, unplaced.length ? `not hung by its floor on the Plot at y = 0: ${unplaced.join(", ")}` : "")

  const half = T.CHUNK / 2 - LIMITS.edge
  const outside = [], onIce = [], steep = [], shallow = [], crowded = []
  const prints = []
  for (const [name, parts] of built) {
    const b = bounds(parts)
    if (b.x0 < -half || b.x1 > half || b.z0 < -half || b.z1 > half)
      outside.push(`${name} spans x ${b.x0.toFixed(1)}..${b.x1.toFixed(1)}, z ${b.z0.toFixed(1)}..${b.z1.toFixed(1)} (limit ±${half})`)
    const world = { x0: b.x0 + ox, x1: b.x1 + ox, z0: b.z0 + oz, z1: b.z1 + oz }
    for (const o of prints) if (meets(o.world, world)) crowded.push(`${name} overlaps ${o.name}`)
    for (const r of P.RESERVED) if (meets(r, world)) crowded.push(`${name} covers ${r.name}`)
    prints.push({ name, world })
    const pts = sampleFootprint(world)
    if (pts.some(([x, z]) => T.onIce(x, z))) onIce.push(name)
    let lo = Infinity, hi = -Infinity
    for (const [x, z] of pts) { const h = T.height(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h) }
    const fall = hi - lo
    if (fall > LIMITS.slope) steep.push(`${name}: ground falls ${fall.toFixed(2)} m under it`)
    // the floor is at y = 0 (placed by its floor on the Plot); it reaches down to b.y0
    const depth = -b.y0
    if (depth + 1e-6 < fall + LIMITS.plinthSlack) shallow.push(`${name} reaches ${depth.toFixed(2)} m below its floor, ground falls ${fall.toFixed(2)} m`)
  }
  record(key, "inside", outside.length === 0, outside.join("; "))
  record(key, "ice", onIce.length === 0, onIce.length ? `on the ice: ${onIce.join(", ")}` : "")
  record(key, "slope", steep.length === 0, steep.join("; "))
  record(key, "plinth", shallow.length === 0, shallow.join("; "))
  record(key, "clear", crowded.length === 0, crowded.join("; "))
}

/** the things a script defines without a `resolve grain` of their own */
function ungrained(text) {
  const code = [...text.matchAll(/```moxi\n([\s\S]*?)```/g)].map((m) => m[1]).join("\n")
  const heads = [...code.matchAll(/^thing\s+(\w+)/gm)]
  return heads.filter((h, i) => !/^\s*resolve\s+grain\s*=/m.test(code.slice(h.index, heads[i + 1]?.index ?? code.length))).map((h) => h[1])
}

function checkLibrary() {
  const dir = join(ROOT, "world/lib")
  const bad = []
  for (const f of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : [])
    for (const n of ungrained(readFileSync(join(dir, f), "utf8"))) bad.push(`${f}: ${n}`)
  record("lib", "grain", bad.length === 0, bad.length ? `no \`resolve grain\` of its own: ${bad.join(", ")}` : "")
}

function checkGuard(base) {
  let log
  try {
    log = execFileSync("git", ["-C", ROOT, "log", "--format=%x1e%H%x1f%ae", "--name-only", `${base}..HEAD`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
  } catch (e) { record("*", "guard", false, `git log ${base}..HEAD failed: ${String(e.stderr || e.message).trim()}`); return }
  const bad = []
  for (const chunk of log.split("\x1e").map((s) => s.trim()).filter(Boolean)) {
    const [head, ...files] = chunk.split("\n")
    const [sha, email] = head.split("\x1f")
    if (email.toLowerCase() !== ENGINE) continue
    for (const f of files.map((x) => x.trim()).filter(Boolean)) if (!f.startsWith("world/")) bad.push(`${sha.slice(0, 7)} touches ${f}`)
  }
  record("*", "guard", bad.length === 0, bad.length ? `engine commits outside world/: ${bad.join("; ")}` : "")
}

// ── run ────────────────────────────────────────────────────────────────

const listed = checkIndex()
for (const key of ONLY ?? listed) {
  if (!existsSync(join(ROOT, "world/chunks", `${key}.md`))) { record(key, "compile", false, `world/chunks/${key}.md is missing`); continue }
  checkChunk(key)
}
checkLibrary()
if (GUARD) checkGuard(GUARD)

const ok = results.every((r) => r.ok)
if (JSON_OUT) console.log(JSON.stringify({ ok, results }, null, 2))
else {
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.chunk.padEnd(6)} ${r.check.padEnd(8)} ${r.detail}`)
  console.log(ok ? "gate: pass" : "gate: FAIL")
}
process.exit(ok ? 0 : 1)
