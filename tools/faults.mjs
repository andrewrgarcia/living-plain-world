#!/usr/bin/env node
// The fault suite: the gate is only worth something if it says no. Each case
// copies the world into a scratch folder, makes one bad edit of the kind the
// engine could plausibly make, and runs the gate on it: the gate must fail,
// and on the check named for that fault. One good edit (a second cabin on a
// fair spot, committed as the engine) must pass every check.
//
//   node tools/faults.mjs [--root DIR] [--keep] [--json]
//
//   --keep   leave the scratch folders (their paths are printed)
//   --json   print the result as JSON
// Exit code 0 when every case behaved, 1 otherwise. Needs MOXI like the gate.

import { execFileSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { requireMoxi } from "./things.mjs"

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const ROOT = resolve(opt("--root") ?? ".")
const KEEP = args.includes("--keep")
const JSON_OUT = args.includes("--json")
const MOXI = process.env.MOXI ?? "moxi"
const ENGINE = process.env.PLAIN_ENGINE_EMAIL ?? "living-plain-engine@users.noreply.github.com"
const GATE = join(ROOT, "tools/gate.mjs")

requireMoxi(MOXI)
const T = await import(pathToFileURL(join(ROOT, "lib/terrain.mjs")).href)
const P = await import(pathToFileURL(join(ROOT, "lib/places.mjs")).href)
const BASE = readFileSync(join(ROOT, "world/chunks/0_0.md"), "utf8")

// ── scratch worlds ─────────────────────────────────────────────────────

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "plain-fault-"))
  for (const d of ["world", "lib", "tools"]) cpSync(join(ROOT, d), join(dir, d), { recursive: true })
  return dir
}
const chunkPath = (dir, key) => join(dir, "world/chunks", `${key}.md`)
const readChunk = (dir, key = "0_0") => readFileSync(chunkPath(dir, key), "utf8")
const writeChunk = (dir, text, key = "0_0") => writeFileSync(chunkPath(dir, key), text)
const editIndex = (dir, fn) => {
  const p = join(dir, "world/index.json")
  writeFileSync(p, JSON.stringify(fn(JSON.parse(readFileSync(p, "utf8")))) + "\n")
}
function must(text, find) { if (!text.includes(find)) throw new Error(`the chunk no longer contains: ${find}`); return text }

// edits to a chunk's script
const HOME = /Home\.floor on Plot\.point\(x=(-?[\d.]+), y=0, z=(-?[\d.]+),/
const homeXZ = (text) => { const m = text.match(HOME); if (!m) throw new Error("no Home placement in the chunk"); return [Number(m[1]), Number(m[2])] }
const moveHome = (text, x, z) => { if (!HOME.test(text)) throw new Error("no Home placement in the chunk"); return text.replace(HOME, `Home.floor on Plot.point(x=${x}, y=0, z=${z},`) }
// the Chunk thing is the last in the script: its relation block is the last one
const atLast = (text, find, insert) => { const i = must(text, find).lastIndexOf(find); return text.slice(0, i) + insert(find) + text.slice(i + find.length) }
const addParts = (text, lines) => atLast(text, "    relation {\n", (f) => lines.map((l) => `    ${l}\n`).join("") + "\n" + f)
const addRelations = (text, lines) => atLast(text, "    relation {\n", (f) => f + lines.map((l) => `        ${l}\n`).join(""))
const addThings = (text, src) => must(text, "thing Chunk {").replace("thing Chunk {", src.trim() + "\n\nthing Chunk {")
const at = (x, z) => `Plot.point(x=${x}, y=0, z=${z}, nx=0, ny=1, nz=0)`

// small things written inline by the cases
const HUT = `thing Hut {
    part Body { shape = box(width=3, height=2, depth=3) }
    anchor floor = Body.bottom
    resolve grain = 0.05
}`
const FLOATING = `thing Beacon {
    part Post { shape = box(width=0.3, height=2, depth=0.3) }
    part Plinth { shape = box(width=2, height=2, depth=2) }
    part Lamp { shape = box(width=0.6, height=0.6, depth=0.6) }
    relation {
        Plinth.top on Post.bottom
        Lamp.bottom on Post.point(x=0, y=4, z=0, nx=0, ny=1, nz=0)
    }
    anchor floor = Post.bottom
    resolve grain = 0.05
}`

// ── finding spots (the same terrain the gate reads) ────────────────────

/** the cabin's footprint around its floor point, facing west, from the base chunk's report */
function cabinOffsets() {
  const r = JSON.parse(execFileSync(MOXI, ["report", join(ROOT, "world/chunks/0_0.md"), "--json"], { encoding: "utf8", maxBuffer: 64 << 20 })).things[0]
  const [hx, hz] = homeXZ(BASE)
  const home = r.parts.filter((p) => p.name.startsWith("Home."))
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of home) {
    // facing west: the part's front is ±x, so its depth runs along x and its width along z
    const ex = Math.abs(p.front[0]) * p.size[2] / 2 + Math.abs(p.front[2]) * p.size[0] / 2
    const ez = Math.abs(p.front[2]) * p.size[2] / 2 + Math.abs(p.front[0]) * p.size[0] / 2
    x0 = Math.min(x0, p.center[0] - ex); x1 = Math.max(x1, p.center[0] + ex)
    z0 = Math.min(z0, p.center[2] - ez); z1 = Math.max(z1, p.center[2] + ez)
  }
  return { x0: x0 - hx, x1: x1 - hx, z0: z0 - hz, z1: z1 - hz }
}

/** the ground under a footprint (local offsets) put at (px, pz) in chunk (cx, cz) */
function ground(off, cx, cz, px, pz) {
  const [ox, oz] = T.chunkCenter(cx, cz)
  const w = { x0: off.x0 + px + ox, x1: off.x1 + px + ox, z0: off.z0 + pz + oz, z1: off.z1 + pz + oz }
  const local = { x0: off.x0 + px, x1: off.x1 + px, z0: off.z0 + pz, z1: off.z1 + pz }
  const { lo, hi } = T.footprintRange(w.x0, w.z0, w.x1, w.z1)
  let ice = false
  for (let x = w.x0; x <= w.x1; x += 0.5) for (let z = w.z0; z <= w.z1; z += 0.5) if (T.onIce(x, z)) ice = true
  const half = T.CHUNK / 2 - 1
  const inside = local.x0 >= -half && local.x1 <= half && local.z0 >= -half && local.z1 <= half
  const meets = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1
  const reserved = P.RESERVED.some((r) => meets(r, w))
  return { fall: hi - lo, ice, inside, reserved, world: w, local }
}

/** the first spot (whole meters, scanned from the center out) in these chunks that passes `ok` */
function findSpot(off, chunks, ok) {
  for (const [cx, cz] of chunks) {
    const spots = []
    for (let x = -31; x <= 31; x++) for (let z = -31; z <= 31; z++) spots.push([x, z])
    spots.sort((a, b) => Math.hypot(...a) - Math.hypot(...b))
    for (const [x, z] of spots) { const g = ground(off, cx, cz, x, z); if (g.inside && ok(g, x, z)) return { cx, cz, x, z, g } }
  }
  throw new Error("no spot found")
}
const ring = (r) => { const out = []; for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) out.push([x, z]); return out.sort((a, b) => Math.hypot(...a) - Math.hypot(...b)) }

// ── git, for the guard ─────────────────────────────────────────────────

function git(dir, email, ...a) {
  return execFileSync("git", ["-C", dir, "-c", `user.name=${email === ENGINE ? "the Actions" : "The Architect"}`, "-c", `user.email=${email}`, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
}
function repo(dir) {
  git(dir, "architect@example.com", "init", "-q", "-b", "main")
  git(dir, "architect@example.com", "add", "-A")
  git(dir, "architect@example.com", "commit", "-q", "-m", "day 0")
  return git(dir, "architect@example.com", "rev-parse", "HEAD")
}

// ── the cases ──────────────────────────────────────────────────────────

const off = cabinOffsets()
const homeAt = homeXZ(BASE)
const homePrint = ground(off, 0, 0, homeAt[0], homeAt[1]).world
const clearOfHome = (g) => !(g.world.x0 < homePrint.x1 + 2 && homePrint.x0 - 2 < g.world.x1 && g.world.z0 < homePrint.z1 + 2 && homePrint.z0 - 2 < g.world.z1)
const hutOff = { x0: -1.5, x1: 1.5, z0: -1.5, z1: 1.5 }

const CASES = [
  {
    name: "a part floats off its thing", expect: "whole",
    edit(dir) {
      const s = findSpot(hutOff, [[0, 0]], (g) => !g.ice && !g.reserved && g.fall < 0.3 && clearOfHome(g))
      writeChunk(dir, addRelations(addParts(addThings(readChunk(dir), FLOATING), ["part Light { thing = Beacon }"]), [`Light.floor on ${at(s.x, s.z)}`]))
    },
  },
  {
    name: "a part belongs to no thing", expect: "whole",
    edit(dir) {
      const s = findSpot(hutOff, [[0, 0]], (g) => !g.ice && !g.reserved && g.fall < 0.3 && clearOfHome(g))
      writeChunk(dir, addRelations(addParts(readChunk(dir), ["part Rock { shape = box(width=1, height=1, depth=1) }"]), [`Rock.bottom on ${at(s.x, s.z)}`]))
    },
  },
  {
    name: "a thing is sunk into the ground", expect: "placed",
    edit(dir) { writeChunk(dir, readChunk(dir).replace(HOME, (m) => m.replace("y=0,", "y=-3,"))) },
  },
  {
    name: "a one-off thing at the chunk's coarse grain", expect: "grain",
    edit(dir) {
      const s = findSpot(hutOff, [[0, 0]], (g) => !g.ice && !g.reserved && g.fall < 0.3 && clearOfHome(g))
      const RAIL = `thing Rail {
    part Post { shape = box(width=0.15, height=1, depth=0.15) }
    part Bar { shape = box(width=2, height=0.1, depth=0.1) }
    relation { Bar.bottom on Post.top }
    anchor floor = Post.bottom
}`
      writeChunk(dir, addRelations(addParts(addThings(readChunk(dir), RAIL), ["part Fence { thing = Rail }"]), [`Fence.floor on ${at(s.x, s.z)}`]))
    },
  },
  { name: "a thing crosses the chunk's edge", expect: "inside", edit: (dir) => writeChunk(dir, moveHome(readChunk(dir), 30, homeAt[1])) },
  {
    name: "a thing stands on the ice", expect: "ice",
    edit(dir) { const z = homeAt[1]; writeChunk(dir, moveHome(readChunk(dir), +T.riverX(z).toFixed(1), z)) },
  },
  {
    name: "a thing stands on a steep slope", expect: "slope",
    edit(dir) {
      const s = findSpot(off, ring(6), (g) => !g.ice && !g.reserved && g.fall > 1.6)  // past the gate's 1.5 m; the plain is gentle, so a steep spot is rare
      const key = `${s.cx}_${s.cz}`
      if (key === "0_0") { writeChunk(dir, moveHome(readChunk(dir), s.x, s.z)); return `0_0 at (${s.x}, ${s.z}), fall ${s.g.fall.toFixed(2)} m` }
      writeChunk(dir, moveHome(BASE, s.x, s.z).replace("# Chunk 0_0", `# Chunk ${key}`), key)
      editIndex(dir, (i) => ({ ...i, chunks: [...i.chunks, key] }))
      return `${key} at (${s.x}, ${s.z}), fall ${s.g.fall.toFixed(2)} m`
    },
    chunks: null,
  },
  {
    name: "a thing has no plinth on falling ground", expect: "plinth",
    edit(dir) {
      const s = findSpot(hutOff, [[0, 0]], (g) => !g.ice && !g.reserved && g.fall > 0.5 && g.fall < 1.3 && clearOfHome(g))
      writeChunk(dir, addRelations(addParts(addThings(readChunk(dir), HUT), ["part Shed { thing = Hut }"]), [`Shed.floor on ${at(s.x, s.z)}`]))
      return `(${s.x}, ${s.z}), fall ${s.g.fall.toFixed(2)} m`
    },
  },
  {
    name: "a thing is built on another", expect: "clear",
    edit(dir) { writeChunk(dir, addRelations(addParts(readChunk(dir), ["part Twin { thing = Cabin }"]), [`Twin.floor on ${at(homeAt[0], homeAt[1] + 2)} facing=west`])) },
  },
  {
    name: "a thing covers the Drafting Stone", expect: "clear",
    edit(dir) { writeChunk(dir, moveHome(readChunk(dir), P.STONE_XZ[0], P.STONE_XZ[1])) },
  },
  { name: "the script does not compile", expect: "compile", edit: (dir) => writeChunk(dir, addParts(readChunk(dir), ["part Broken { shape = box(width= }"])) },
  {
    name: "a chunk file is not in the index", expect: "index",
    edit(dir) { writeChunk(dir, BASE.replace("# Chunk 0_0", "# Chunk 1_0"), "1_0") },
  },
  { name: "the index lists a missing chunk", expect: "index", edit: (dir) => editIndex(dir, (i) => ({ ...i, chunks: [...i.chunks, "0_1"] })) },
  { name: "the index changes the terrain", expect: "index", edit: (dir) => editIndex(dir, (i) => ({ ...i, terrain: i.terrain + 1 })) },
  {
    name: "the engine edits the terrain", expect: "guard",
    edit(dir) {
      const base = repo(dir)
      const p = join(dir, "lib/terrain.mjs")
      writeFileSync(p, readFileSync(p, "utf8").replace("export const RIVER = { half: 5.5,", "export const RIVER = { half: 4.5,"))
      git(dir, ENGINE, "commit", "-q", "-am", "day 1: narrow the river")
      return { guard: base }
    },
  },
  {
    name: "the engine edits the gate", expect: "guard",
    edit(dir) {
      const base = repo(dir)
      const p = join(dir, "tools/gate.mjs")
      writeFileSync(p, readFileSync(p, "utf8").replace("slope: 1.5", "slope: 9"))
      git(dir, ENGINE, "commit", "-q", "-am", "day 1: relax the slope")
      return { guard: base }
    },
  },
]

const GOOD = {
  name: "a second cabin on a fair spot, committed by the engine", expect: null,
  edit(dir) {
    const base = repo(dir)
    const s = findSpot(off, [[0, 0]], (g) => !g.ice && !g.reserved && g.fall < 1.0 && clearOfHome(g))
    writeChunk(dir, addRelations(addParts(readChunk(dir), ["part Barn { thing = Cabin }"]), [`Barn.floor on ${at(s.x, s.z)} facing=west`]))
    git(dir, ENGINE, "commit", "-q", "-am", "day 1: a second cabin")
    return { guard: base, note: `(${s.x}, ${s.z}), fall ${s.g.fall.toFixed(2)} m` }
  },
}

// ── run ────────────────────────────────────────────────────────────────

function runGate(dir, guard) {
  const a = [GATE, "--root", dir, "--json"]
  if (guard) a.push("--guard", guard)
  try { return JSON.parse(execFileSync("node", a, { encoding: "utf8", env: { ...process.env, MOXI }, stdio: ["ignore", "pipe", "pipe"] })) }
  catch (e) { if (e.stdout) return JSON.parse(e.stdout); throw e }
}

const outcomes = []
for (const c of [...CASES, GOOD]) {
  const dir = scratch()
  let note = "", guard = null, gate = null, error = null
  try {
    const r = c.edit(dir)
    if (typeof r === "string") note = r
    else if (r) { guard = r.guard ?? null; note = r.note ?? "" }
    gate = runGate(dir, guard)
  } catch (e) { error = e.message }
  const failed = gate ? gate.results.filter((r) => !r.ok) : []
  const caught = failed.find((r) => r.check === c.expect)
  const ok = !error && (c.expect ? !gate.ok && !!caught : gate.ok)
  outcomes.push({
    name: c.name, expect: c.expect ?? "pass", ok, note, error,
    failed: failed.map((r) => `${r.chunk} ${r.check}: ${r.detail}`),
    dir: KEEP ? dir : undefined,
  })
  if (!KEEP) rmSync(dir, { recursive: true, force: true })
}

const ok = outcomes.every((o) => o.ok)
if (JSON_OUT) console.log(JSON.stringify({ ok, cases: outcomes }, null, 2))
else {
  for (const o of outcomes) {
    console.log(`${o.ok ? "ok  " : "BAD "}  ${o.expect.padEnd(8)} ${o.name}${o.note ? `  [${o.note}]` : ""}`)
    if (o.error) console.log(`        error: ${o.error}`)
    else if (!o.ok || o.expect === "pass") for (const f of o.failed) console.log(`        failed ${f}`)
    if (o.dir) console.log(`        ${o.dir}`)
  }
  console.log(ok ? `faults: all ${outcomes.length} cases behaved` : "faults: FAIL")
}
process.exit(ok ? 0 : 1)
