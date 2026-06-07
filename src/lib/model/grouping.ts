// Paper-piecing groups: assign patches to a foundation unit (letter) and a
// sewing order (number), and validate that each piece can be added with a
// single straight seam — the core FPP constraint.
import type { Design, Patch, Point } from '../geometry/types'
import { sharedEdges } from '../geometry/adjacency'
import { lineThroughPoints, side } from '../geometry/line'

const SEAM_EPS = 1e-6

/**
 * Whether `cand` joins the region formed by `predecessors` along a single
 * straight seam: it must share at least one edge with them, and all shared edges
 * must be collinear (lie on one line).
 */
function singleStraightSeam(cand: Point[], predecessors: Point[][]): boolean {
  const segs: [Point, Point][] = []
  for (const pv of predecessors) {
    for (const s of sharedEdges(cand, pv)) segs.push(s)
  }
  if (segs.length === 0) return false
  const line = lineThroughPoints(segs[0][0], segs[0][1])
  if (!line) return false
  return segs.every(
    ([p, q]) => Math.abs(side(line, p)) < SEAM_EPS && Math.abs(side(line, q)) < SEAM_EPS,
  )
}

/** A distinct tint per group letter, for the naming overlay. */
export function groupColor(letter: string): string {
  const i = Math.max(0, letter.charCodeAt(0) - 65)
  const hue = (i * 67) % 360
  return `hsl(${hue}, 65%, 50%)`
}

/** The next unused group letter (A, B, C, ...). */
export function nextGroupLetter(design: Design): string {
  const used = new Set(
    design.patches.map((p) => p.group).filter((g): g is string => !!g),
  )
  let i = 0
  while (used.has(String.fromCharCode(65 + i))) i++
  return String.fromCharCode(65 + i)
}

/** Patches of a group, in sewing order. */
export function groupPatches(design: Design, group: string): Patch[] {
  return design.patches
    .filter((p) => p.group === group)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function maxOrder(patches: Patch[], group: string): number {
  let m = 0
  for (const p of patches) if (p.group === group) m = Math.max(m, p.order ?? 0)
  return m
}

/** Renumber a group's patches 1..n by their current order (mutates in place). */
function renumber(patches: Patch[], group: string): void {
  patches
    .filter((p) => p.group === group)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((p, i) => {
      p.order = i + 1
    })
}

/**
 * Toggle a patch's membership in `activeGroup`: if it's already there, remove it
 * (and renumber); otherwise add it at the next order (removing it from any prior
 * group first). Returns a new patches array.
 */
export function toggleAssignment(patches: Patch[], id: string, activeGroup: string): Patch[] {
  const next = patches.map((p) => ({ ...p }))
  const patch = next.find((p) => p.id === id)
  if (!patch) return patches
  if (patch.group === activeGroup) {
    patch.group = undefined
    patch.order = undefined
    renumber(next, activeGroup)
  } else {
    const prev = patch.group
    patch.group = activeGroup
    patch.order = maxOrder(next, activeGroup) + 1
    if (prev) renumber(next, prev)
  }
  return next
}

/** Remove every patch from a group. Returns a new patches array. */
export function clearGroup(patches: Patch[], group: string): Patch[] {
  return patches.map((p) =>
    p.group === group ? { ...p, group: undefined, order: undefined } : p,
  )
}

/**
 * For each patch in `group` (in sewing order), whether it can be added to the
 * already-sewn region (its predecessors) with a SINGLE straight seam. Piece 1 is
 * always valid; a piece that shares no edge with its predecessors, or shares
 * edges that aren't collinear, is flagged invalid.
 */
export function groupValidity(design: Design, group: string): Map<string, boolean> {
  const ordered = groupPatches(design, group)
  const result = new Map<string, boolean>()
  for (let k = 0; k < ordered.length; k++) {
    const ok =
      k === 0 ||
      singleStraightSeam(
        ordered[k].vertices,
        ordered.slice(0, k).map((p) => p.vertices),
      )
    result.set(ordered[k].id, ok)
  }
  return result
}

// --- Automatic segmentation ----------------------------------------------

function centroidPt(poly: Point[]): Point {
  let x = 0
  let y = 0
  for (const p of poly) {
    x += p.x
    y += p.y
  }
  const n = poly.length || 1
  return { x: x / n, y: y / n }
}

/** Total length of the shared edges between cand and a predecessor region. */
function seamLength(cand: Point[], predecessors: Point[][]): number {
  let len = 0
  for (const pv of predecessors) {
    for (const [a, b] of sharedEdges(cand, pv)) len += Math.hypot(a.x - b.x, a.y - b.y)
  }
  return len
}

function letterFor(i: number): string {
  if (i < 26) return String.fromCharCode(65 + i)
  return String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26))
}

/**
 * Automatically partition every patch into foundation units + a sewing order so
 * that each piece joins its unit along a single straight seam. Greedy maximal
 * growth from the top-left seed, always adding the candidate sharing the longest
 * collinear seam. Guarantees a VALID segmentation (each unit is piece-able in the
 * produced order); it favors few units but isn't guaranteed minimal — refine by
 * hand in Naming mode if you like.
 */
export function autoSegment(patches: Patch[]): Patch[] {
  const result: Patch[] = patches.map((p) => ({ ...p, group: undefined, order: undefined }))
  const byId = new Map(result.map((p) => [p.id, p]))
  const center = new Map(result.map((p) => [p.id, centroidPt(p.vertices)]))
  const remaining = new Set(result.map((p) => p.id))

  const topLeft = (a: string, b: string) => {
    const ca = center.get(a)!
    const cb = center.get(b)!
    return ca.y - cb.y || ca.x - cb.x
  }

  const units: string[][] = []
  while (remaining.size > 0) {
    const seed = [...remaining].sort(topLeft)[0]
    const unit = [seed]
    const sewn: Point[][] = [byId.get(seed)!.vertices]
    remaining.delete(seed)

    for (;;) {
      const cands = [...remaining].filter((id) =>
        singleStraightSeam(byId.get(id)!.vertices, sewn),
      )
      if (cands.length === 0) break
      cands.sort((a, b) => {
        const la = seamLength(byId.get(a)!.vertices, sewn)
        const lb = seamLength(byId.get(b)!.vertices, sewn)
        return lb - la || topLeft(a, b)
      })
      const next = cands[0]
      unit.push(next)
      sewn.push(byId.get(next)!.vertices)
      remaining.delete(next)
    }
    units.push(unit)
  }

  units.forEach((unit, gi) => {
    const letter = letterFor(gi)
    unit.forEach((id, i) => {
      const p = byId.get(id)!
      p.group = letter
      p.order = i + 1
    })
  })
  return result
}
