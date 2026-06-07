// Outward polygon offset (miter), used to add a seam allowance around a group's
// outline. Works on any simple polygon regardless of winding by offsetting each
// edge away from the centroid, then intersecting consecutive offset edges.
import type { Point } from './types'

interface OffsetLine {
  p: Point
  dir: Point
  nrm: Point
}

const norm = (p: Point): Point => {
  const l = Math.hypot(p.x, p.y) || 1
  return { x: p.x / l, y: p.y / l }
}

function intersect(l1: OffsetLine, l2: OffsetLine): Point | null {
  const denom = l1.dir.x * l2.dir.y - l1.dir.y * l2.dir.x
  if (Math.abs(denom) < 1e-9) return null
  const dx = l2.p.x - l1.p.x
  const dy = l2.p.y - l1.p.y
  const t = (dx * l2.dir.y - dy * l2.dir.x) / denom
  return { x: l1.p.x + t * l1.dir.x, y: l1.p.y + t * l1.dir.y }
}

/**
 * Offset a polygon ring outward by `d` (in the same units as the points).
 * Convex corners are mitered; very sharp corners fall back to a simple bevel so
 * they don't spike. Returns a new ring with one vertex per input vertex.
 */
export function offsetPolygon(ring: Point[], d: number): Point[] {
  const n = ring.length
  if (n < 3 || d === 0) return ring.slice()

  let cx = 0
  let cy = 0
  for (const p of ring) {
    cx += p.x
    cy += p.y
  }
  cx /= n
  cy /= n

  const lines: OffsetLine[] = ring.map((A, i) => {
    const B = ring[(i + 1) % n]
    const dir = norm({ x: B.x - A.x, y: B.y - A.y })
    let nrm = { x: -dir.y, y: dir.x }
    const midx = (A.x + B.x) / 2
    const midy = (A.y + B.y) / 2
    if (nrm.x * (midx - cx) + nrm.y * (midy - cy) < 0) nrm = { x: -nrm.x, y: -nrm.y }
    return { p: { x: A.x + nrm.x * d, y: A.y + nrm.y * d }, dir, nrm }
  })

  const out: Point[] = []
  const miterCap = Math.abs(d) * 8
  for (let i = 0; i < n; i++) {
    const cur = lines[i]
    const prev = lines[(i - 1 + n) % n]
    const pt = intersect(prev, cur)
    const fallback = { x: ring[i].x + cur.nrm.x * d, y: ring[i].y + cur.nrm.y * d }
    if (pt && Math.hypot(pt.x - ring[i].x, pt.y - ring[i].y) <= miterCap) {
      out.push(pt)
    } else {
      out.push(fallback)
    }
  }
  return out
}
