// Split a CONVEX polygon by a line into its two halves. Because every cut in
// this app is a full chord and the design starts as a rectangle, every patch
// stays convex — so this simple half-plane clip is all we ever need.
import type { Line, Point } from './types'
import { area, lerp } from './vec'
import { side } from './line'

/** Drop pieces smaller than this (in² of design space) as float slivers. */
export const AREA_EPS = 1e-7

/**
 * Clip a polygon to the half-plane where `keep * side(p) >= 0`
 * (keep = +1 keeps side >= 0, keep = -1 keeps side <= 0). Points exactly on the
 * line are kept by both halves, so the two pieces share the cut edge.
 * Classic Sutherland–Hodgman against a single edge.
 */
export function clipHalfPlane(poly: Point[], line: Line, keep: 1 | -1): Point[] {
  const out: Point[] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const A = poly[i]
    const B = poly[(i + 1) % n]
    const sa = keep * side(line, A)
    const sb = keep * side(line, B)
    if (sa >= 0) out.push(A)
    // Strict sign change => the edge crosses the line; insert the crossing.
    if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
      const t = sa / (sa - sb)
      out.push(lerp(A, B, t))
    }
  }
  return out
}

/**
 * Split `poly` by `line`. Returns the two halves [negativeSide, positiveSide].
 * If the line misses the polygon, one half is the whole polygon and the other
 * is empty ([]). Slivers below AREA_EPS are returned as [] so callers can treat
 * "didn't really split" uniformly.
 */
export function splitByLine(poly: Point[], line: Line): [Point[], Point[]] {
  const neg = clipHalfPlane(poly, line, -1)
  const pos = clipHalfPlane(poly, line, 1)
  return [area(neg) > AREA_EPS ? neg : [], area(pos) > AREA_EPS ? pos : []]
}
