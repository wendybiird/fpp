// Core geometry & design types. All design-space coordinates are in INCHES,
// with the origin at the top-left, x increasing right and y increasing down
// (so they map straight onto an SVG viewBox).

export interface Point {
  x: number
  y: number
}

/**
 * A straight line in the design plane in implicit form: a*x + b*y + c = 0,
 * with (a, b) a unit normal. `side(p) = a*p.x + b*p.y + c` is the signed
 * distance from the line, which we use to split polygons by half-plane.
 */
export interface Line {
  a: number
  b: number
  c: number
}

export type PatchId = string

/**
 * One patch (face) of the design. Because every cut is a full chord across a
 * shape that starts as a rectangle, every patch is always CONVEX — which keeps
 * splitting, hit-testing, and photo-sampling simple and robust.
 */
export interface Patch {
  id: PatchId
  /** Convex polygon, vertices in order (no repeated closing point). */
  vertices: Point[]
  /** Fill color as a hex string, e.g. "#cc4422". */
  color: string
  /** Paper-piecing group letter (e.g. "A"); assigned in Naming mode. */
  group?: string
  /** Sewing order within the group (1-based); assigned in Naming mode. */
  order?: number
}

/** A loaded reference photo, placed in design (inch) coordinates. */
export interface PhotoPlacement {
  /** Data URL (so it round-trips through save/load). */
  src: string
  x: number
  y: number
  w: number
  h: number
  naturalW: number
  naturalH: number
}

export interface Design {
  /** Block width in inches. */
  wIn: number
  /** Block height in inches. */
  hIn: number
  /** Seam allowance in inches (added when printing templates). */
  seamIn: number
  patches: Patch[]
  photo?: PhotoPlacement
  /** Photo <-> flat-color blend, 0 = raw photo, 1 = flat patch colors. */
  blend: number
}
