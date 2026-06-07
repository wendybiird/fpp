// Straight-line helpers. A line is implicit: a*x + b*y + c = 0 with (a, b) a
// unit normal, so `side(line, p)` is the signed distance from the line — which
// is what the polygon splitter uses to decide half-planes.
import type { Line, Point } from './types'
import { dist } from './vec'

const EPS = 1e-9

/** Signed distance of p from the line (sign tells you which half-plane). */
export function side(line: Line, p: Point): number {
  return line.a * p.x + line.b * p.y + line.c
}

/**
 * Line through two points. Returns null if the points are coincident (a tap
 * rather than a drag). The normal is (dy, -dx) normalized.
 */
export function lineThroughPoints(p0: Point, p1: Point): Line | null {
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const L = Math.hypot(dx, dy)
  if (L < EPS) return null
  const a = dy / L
  const b = -dx / L
  const c = -(a * p0.x + b * p0.y)
  return { a, b, c }
}

/**
 * Intersect the infinite line with the rectangle [0,w] x [0,h] and return the
 * two boundary crossings (the chord), or null if it doesn't cross. Used to draw
 * the live preview of a full-chord cut.
 */
export function clipLineToRect(line: Line, w: number, h: number): [Point, Point] | null {
  const { a, b, c } = line
  const E = 1e-7
  const pts: Point[] = []
  const addIfInside = (p: Point) => {
    if (p.x >= -E && p.x <= w + E && p.y >= -E && p.y <= h + E) pts.push(p)
  }
  // Crossings with the vertical edges x=0 and x=w (need b != 0).
  if (Math.abs(b) > EPS) {
    addIfInside({ x: 0, y: -(a * 0 + c) / b })
    addIfInside({ x: w, y: -(a * w + c) / b })
  }
  // Crossings with the horizontal edges y=0 and y=h (need a != 0).
  if (Math.abs(a) > EPS) {
    addIfInside({ x: -(b * 0 + c) / a, y: 0 })
    addIfInside({ x: -(b * h + c) / a, y: h })
  }
  const uniq: Point[] = []
  for (const p of pts) {
    if (!uniq.some((q) => dist(p, q) < 1e-6)) uniq.push(p)
  }
  if (uniq.length < 2) return null
  return [uniq[0], uniq[1]]
}

/**
 * Snap the drag direction p0->p1 to the nearest multiple of `stepDeg` when it
 * is within `thresholdDeg`, keeping p0 fixed and the length unchanged. Returns
 * the (possibly) adjusted end point.
 */
export function snapAngle(p0: Point, p1: Point, stepDeg = 15, thresholdDeg = 7): Point {
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const L = Math.hypot(dx, dy)
  if (L < EPS) return p1
  const step = (stepDeg * Math.PI) / 180
  const thresh = (thresholdDeg * Math.PI) / 180
  const ang = Math.atan2(dy, dx)
  const snapped = Math.round(ang / step) * step
  // Smallest signed angular difference.
  let diff = ang - snapped
  diff = Math.atan2(Math.sin(diff), Math.cos(diff))
  if (Math.abs(diff) > thresh) return p1
  return { x: p0.x + Math.cos(snapped) * L, y: p0.y + Math.sin(snapped) * L }
}

/** Reflect a line across the vertical axis x = cx. */
export function reflectX(line: Line, cx: number): Line {
  return { a: -line.a, b: line.b, c: line.c + 2 * line.a * cx }
}

/** Reflect a line across the horizontal axis y = cy. */
export function reflectY(line: Line, cy: number): Line {
  return { a: line.a, b: -line.b, c: line.c + 2 * line.b * cy }
}
