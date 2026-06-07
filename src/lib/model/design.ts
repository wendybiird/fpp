// Design model: factory, the per-section line-splitting engine (splitPatch),
// and small pure read helpers used by the canvas.
import type { Design, Line, Patch, Point } from '../geometry/types'
import { splitByLine, pointInConvexPolygon } from '../geometry/splitPolygon'
import { dist } from '../geometry/vec'

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
  return { wIn, hIn, seamIn, patches: [rect], blend: 1, photo: undefined }
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

/**
 * Split a SINGLE patch (the section the user is drawing in) by a line. The line
 * is contained within that patch — splitByLine clips it to the section's edges —
 * so the cut bisects only that section, never running edge-to-edge across the
 * whole block. Returns the SAME design reference when the line doesn't actually
 * divide the patch, so callers can skip a no-op undo entry.
 */
export function splitPatch(design: Design, patchId: string, line: Line): Design {
  const idx = design.patches.findIndex((p) => p.id === patchId)
  if (idx < 0) return design
  const patch = design.patches[idx]
  const [neg, pos] = splitByLine(patch.vertices, line)
  if (!neg.length || !pos.length) return design
  const patches = design.patches.slice()
  patches.splice(
    idx,
    1,
    { id: nextId(), vertices: neg, color: patch.color },
    { id: nextId(), vertices: pos, color: patch.color },
  )
  return { ...design, patches }
}

/** The first patch whose polygon contains p — i.e. the section being cut. */
export function patchAt(design: Design, p: Point): Patch | undefined {
  return design.patches.find((patch) => pointInConvexPolygon(p, patch.vertices))
}

/** Nearest existing patch vertex to p within maxDist (inches), or null. Used
 *  for snap-to-corner while drawing. */
export function nearestVertex(p: Point, design: Design, maxDist: number): Point | null {
  let best: Point | null = null
  let bestD = maxDist
  for (const patch of design.patches) {
    for (const v of patch.vertices) {
      const d = dist(p, v)
      if (d <= bestD) {
        bestD = d
        best = v
      }
    }
  }
  return best
}
