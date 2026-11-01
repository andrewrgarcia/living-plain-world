// Built things as Moxi's report describes them: shared by the gate (which
// judges them) and the view (which shows the planner what is there).

import { execFileSync } from "node:child_process"

/** stop with a plain message unless `moxi` is there and at least 0.7 (`resolve grain`, instance grain) */
export function requireMoxi(moxi) {
  let v = ""
  try { v = execFileSync(moxi, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim() } catch {}
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/)
  if (m && (+m[1] > 0 || +m[2] >= 7)) return
  console.error(v
    ? `${moxi} is ${v}; the world needs moxi 0.7 or newer. Update it: cargo install moxi --force`
    : `no moxi found (MOXI=${moxi}). Install it: cargo install moxi`)
  process.exit(2)
}

/** `moxi report --json` of a chunk script: its one thing (the Chunk) */
export function readReport(moxi, script) {
  return JSON.parse(execFileSync(moxi, ["report", script, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 })).things[0]
}

/** a part's world-aligned box from its center, size and orientation (up = y, front = z) */
export function partBox(p) {
  const [ux, uy, uz] = p.up, [fx, fy, fz] = p.front
  // right = up × front
  const rx = uy * fz - uz * fy, ry = uz * fx - ux * fz, rz = ux * fy - uy * fx
  const [hx, hy, hz] = p.size.map((v) => v / 2)
  const ex = Math.abs(rx) * hx + Math.abs(ux) * hy + Math.abs(fx) * hz
  const ey = Math.abs(ry) * hx + Math.abs(uy) * hy + Math.abs(fy) * hz
  const ez = Math.abs(rz) * hx + Math.abs(uz) * hy + Math.abs(fz) * hz
  const [cx, cy, cz] = p.center
  return { x0: cx - ex, x1: cx + ex, y0: cy - ey, y1: cy + ey, z0: cz - ez, z1: cz + ez }
}

/** group a chunk's parts into its built things (instance name before the first dot) */
export function things(report) {
  const out = new Map(), loose = []
  for (const p of report.parts) {
    if (p.name === "Plot") continue
    const dot = p.name.indexOf(".")
    if (dot < 0) { loose.push(p.name); continue }
    const name = p.name.slice(0, dot)
    if (!out.has(name)) out.set(name, [])
    out.get(name).push(p)
  }
  return { things: out, loose }
}

/** the box around a thing's parts (chunk-local) */
export function bounds(parts) {
  return parts.map(partBox).reduce((a, c) => ({
    x0: Math.min(a.x0, c.x0), x1: Math.max(a.x1, c.x1), y0: Math.min(a.y0, c.y0),
    y1: Math.max(a.y1, c.y1), z0: Math.min(a.z0, c.z0), z1: Math.max(a.z1, c.z1),
  }))
}

/** do two footprints (x0 x1 z0 z1) overlap */
export const meets = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1
