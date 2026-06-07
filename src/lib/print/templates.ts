// Build printable foundation templates: one per group, with a seam-allowance
// border, the finished outline, each patch numbered in sewing order, and an
// optional mirror (FPP foundations are sewn from the back, so the printed
// pattern is the mirror image of the finished block).
import type { Design, Point } from '../geometry/types'
import { area } from '../geometry/vec'
import { unionOutlines } from '../geometry/union'
import { offsetPolygon } from '../geometry/offset'
import { groupPatches } from '../model/grouping'
import { centroid } from '../model/design'

export interface TemplatePatch {
  id: string
  label: string
  vertices: Point[]
  center: Point
}

export interface Template {
  group: string
  /** Finished (sewn) outline of the group. */
  outline: Point[]
  /** Outline grown outward by the seam allowance (the cut line). */
  seam: Point[]
  patches: TemplatePatch[]
  /** Bounding box (inches), including the seam allowance. */
  minX: number
  minY: number
  w: number
  h: number
}

/** All groups present in the design, sorted. */
export function designGroups(design: Design): string[] {
  return [...new Set(design.patches.map((p) => p.group).filter((g): g is string => !!g))].sort()
}

export function buildTemplates(design: Design, mirror: boolean): Template[] {
  const out: Template[] = []
  for (const g of designGroups(design)) {
    const patches = groupPatches(design, g)
    if (patches.length === 0) continue

    const outlines = unionOutlines(patches.map((p) => p.vertices))
    if (outlines.length === 0) continue
    // For a disconnected group, use the largest piece as the boundary.
    const outline = outlines.reduce((best, o) => (area(o) > area(best) ? o : best), outlines[0])
    const seam = offsetPolygon(outline, design.seamIn)

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const p of seam) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }

    // Mirror across the template's vertical center (geometry only; labels stay upright).
    const cx = (minX + maxX) / 2
    const mx = (p: Point): Point => (mirror ? { x: 2 * cx - p.x, y: p.y } : p)

    out.push({
      group: g,
      outline: outline.map(mx),
      seam: seam.map(mx),
      patches: patches.map((p) => ({
        id: p.id,
        label: `${g}${p.order}`,
        vertices: p.vertices.map(mx),
        center: mx(centroid(p.vertices)),
      })),
      minX,
      minY,
      w: maxX - minX,
      h: maxY - minY,
    })
  }
  return out
}

/** SVG points-attribute string for a polygon. */
export function ptsAttr(poly: Point[]): string {
  return poly.map((p) => `${p.x},${p.y}`).join(' ')
}
