// Small 2D vector helpers. Pure functions, no allocation surprises.
import type { Point } from './types'

export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
export const scale = (a: Point, s: number): Point => ({ x: a.x * s, y: a.y * s })

export const dot = (a: Point, b: Point): number => a.x * b.x + a.y * b.y
/** 2D cross product (z component); >0 means b is CCW from a. */
export const cross = (a: Point, b: Point): number => a.x * b.y - a.y * b.x

export const len = (a: Point): number => Math.hypot(a.x, a.y)
export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

/** Linear interpolation between a and b at parameter t in [0, 1]. */
export const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/** Signed area of a polygon (CCW positive in a y-up frame). */
export function signedArea(poly: Point[]): number {
  let s = 0
  for (let i = 0, n = poly.length; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    s += a.x * b.y - b.x * a.y
  }
  return s / 2
}

/** Absolute polygon area. */
export const area = (poly: Point[]): number => Math.abs(signedArea(poly))
