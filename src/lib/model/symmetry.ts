// Automatic symmetry-completion: take the cuts already drawn, reflect every
// internal seam across the chosen axes, and apply the missing cuts — iterating
// to a fixed point. Each applied cut is contained to the section it lands in
// (splitPatch), so the result keeps the per-section model.
import type { Design, Point } from '../geometry/types'
import { sharedEdges } from '../geometry/adjacency'
import { lineThroughPoints } from '../geometry/line'
import { splitPatch, patchAt } from './design'

export type SymmetryKind = 'v' | 'h' | 'quad'

type Reflector = (p: Point) => Point

/** Every internal seam segment (shared edge between two patches). */
function internalSegments(design: Design): { a: Point; b: Point }[] {
  const out: { a: Point; b: Point }[] = []
  const ps = design.patches
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      for (const [a, b] of sharedEdges(ps[i].vertices, ps[j].vertices)) out.push({ a, b })
    }
  }
  return out
}

/**
 * Complete the design's symmetry. Reflects each internal seam across the chosen
 * axes and applies any cut that isn't already there, repeating until nothing new
 * is added (a symmetric fixed point). Returns the SAME design reference when it
 * is already symmetric, so callers can skip a no-op undo entry.
 */
export function completeSymmetry(design: Design, kind: SymmetryKind): Design {
  const cx = design.wIn / 2
  const cy = design.hIn / 2
  const reflectors: Reflector[] = []
  if (kind === 'v' || kind === 'quad') reflectors.push((p) => ({ x: 2 * cx - p.x, y: p.y }))
  if (kind === 'h' || kind === 'quad') reflectors.push((p) => ({ x: p.x, y: 2 * cy - p.y }))

  let cur = design
  for (let pass = 0; pass < 8; pass++) {
    let applied = 0
    const segs = internalSegments(cur)
    for (const refl of reflectors) {
      for (const s of segs) {
        const a = refl(s.a)
        const b = refl(s.b)
        const line = lineThroughPoints(a, b)
        if (!line) continue
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const patch = patchAt(cur, mid)
        if (!patch) continue
        // splitPatch is a no-op (returns the same ref) if the seam already exists.
        const next = splitPatch(cur, patch.id, line)
        if (next !== cur) {
          cur = next
          applied++
        }
      }
    }
    if (applied === 0) break
  }
  return cur
}
