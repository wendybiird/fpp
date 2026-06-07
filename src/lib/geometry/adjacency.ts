// Edge adjacency between patches: two patches are adjacent where an edge of one
// overlaps a collinear edge of the other. Used to validate the foundation
// paper-piecing sewing order (each new piece must join along one straight seam).
import type { Point } from './types'

const COLLINEAR_EPS = 1e-6
const OVERLAP_EPS = 1e-6

/**
 * If edge (a1,a2) and edge (b1,b2) are collinear and overlap with positive
 * length, return the overlapping sub-segment (along a1->a2); otherwise null.
 */
export function edgeOverlap(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): [Point, Point] | null {
  const dx = a2.x - a1.x
  const dy = a2.y - a1.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return null
  const len = Math.sqrt(len2)

  // Perpendicular distance of b1/b2 from the infinite line through a1->a2.
  const perp = (p: Point) => Math.abs((dx * (p.y - a1.y) - dy * (p.x - a1.x)) / len)
  if (perp(b1) > COLLINEAR_EPS || perp(b2) > COLLINEAR_EPS) return null

  // Parametric positions along a (a1 -> 0, a2 -> 1).
  const t = (p: Point) => ((p.x - a1.x) * dx + (p.y - a1.y) * dy) / len2
  let tb1 = t(b1)
  let tb2 = t(b2)
  if (tb1 > tb2) [tb1, tb2] = [tb2, tb1]

  const lo = Math.max(0, tb1)
  const hi = Math.min(1, tb2)
  if ((hi - lo) * len < OVERLAP_EPS) return null

  return [
    { x: a1.x + lo * dx, y: a1.y + lo * dy },
    { x: a1.x + hi * dx, y: a1.y + hi * dy },
  ]
}

/** All shared boundary segments between two convex polygons. */
export function sharedEdges(polyA: Point[], polyB: Point[]): [Point, Point][] {
  const out: [Point, Point][] = []
  const nA = polyA.length
  const nB = polyB.length
  for (let i = 0; i < nA; i++) {
    const a1 = polyA[i]
    const a2 = polyA[(i + 1) % nA]
    for (let j = 0; j < nB; j++) {
      const b1 = polyB[j]
      const b2 = polyB[(j + 1) % nB]
      const ov = edgeOverlap(a1, a2, b1, b2)
      if (ov) out.push(ov)
    }
  }
  return out
}

/** Whether two polygons share an edge of positive length. */
export function areAdjacent(polyA: Point[], polyB: Point[]): boolean {
  return sharedEdges(polyA, polyB).length > 0
}
