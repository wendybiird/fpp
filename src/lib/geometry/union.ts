// Union of patch polygons into group outline(s), via polygon-clipping. A group's
// patches are edge-adjacent, so their union is the group's foundation outline.
import polygonClipping from 'polygon-clipping'
import type { Point } from './types'

type Ring = [number, number][]

function toRing(poly: Point[]): Ring {
  const r: Ring = poly.map((p) => [p.x, p.y])
  // polygon-clipping wants closed rings.
  r.push([poly[0].x, poly[0].y])
  return r
}

/**
 * Union convex patch polygons and return the OUTER ring of each resulting
 * polygon (holes ignored). Usually one ring for a connected group.
 */
export function unionOutlines(polys: Point[][]): Point[][] {
  if (polys.length === 0) return []
  const geoms = polys.map((poly) => [toRing(poly)])
  const result = polygonClipping.union(geoms[0], ...geoms.slice(1))
  return result.map((polygon) => {
    const ring = polygon[0]
    const pts = ring.map(([x, y]) => ({ x, y }))
    // Drop the duplicated closing vertex.
    if (pts.length > 1) {
      const a = pts[0]
      const b = pts[pts.length - 1]
      if (Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9) pts.pop()
    }
    return pts
  })
}
