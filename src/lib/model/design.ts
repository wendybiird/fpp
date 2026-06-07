// Design model: factory + small pure helpers. The line-splitting engine
// (addLine) lands in M1; this module owns construction and read helpers.
import type { Design, Patch, Point } from '../geometry/types'

let idCounter = 0
/** Monotonic patch id. Kept module-local so ids are unique within a session. */
export function nextId(): string {
  return `p${++idCounter}`
}

/** Default fill for fresh, uncolored patches (a neutral muslin tone). */
export const DEFAULT_PATCH_COLOR = '#e9e6df'

/** Create a new design as a single rectangular patch covering the block. */
export function createDesign(wIn: number, hIn: number, seamIn = 0.25): Design {
  const rect: Patch = {
    id: nextId(),
    // Top-left origin, clockwise in screen (y-down) coordinates.
    vertices: [
      { x: 0, y: 0 },
      { x: wIn, y: 0 },
      { x: wIn, y: hIn },
      { x: 0, y: hIn },
    ],
    color: DEFAULT_PATCH_COLOR,
  }
  return { wIn, hIn, seamIn, patches: [rect], blend: 1 }
}

/** Average of a polygon's vertices. For a convex polygon this lands inside it,
 *  which is good enough for placing labels. */
export function centroid(poly: Point[]): Point {
  let x = 0
  let y = 0
  for (const p of poly) {
    x += p.x
    y += p.y
  }
  const n = poly.length || 1
  return { x: x / n, y: y / n }
}

/** SVG `points` attribute string for a polygon, e.g. "0,0 8,0 8,8". */
export function polygonPoints(poly: Point[]): string {
  return poly.map((p) => `${p.x},${p.y}`).join(' ')
}
