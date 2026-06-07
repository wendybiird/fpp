import { describe, it, expect } from 'vitest'
import { offsetPolygon } from './offset'
import { area } from './vec'
import type { Point } from './types'

const square: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]

describe('offsetPolygon', () => {
  it('grows a unit square outward by d on every side', () => {
    const o = offsetPolygon(square, 0.25)
    const xs = o.map((p) => p.x)
    const ys = o.map((p) => p.y)
    expect(Math.min(...xs)).toBeCloseTo(-0.25, 6)
    expect(Math.max(...xs)).toBeCloseTo(1.25, 6)
    expect(Math.min(...ys)).toBeCloseTo(-0.25, 6)
    expect(Math.max(...ys)).toBeCloseTo(1.25, 6)
    expect(area(o)).toBeCloseTo(1.5 * 1.5, 6)
  })

  it('returns the ring unchanged for d = 0', () => {
    expect(offsetPolygon(square, 0)).toEqual(square)
  })

  it('increases the area of a triangle', () => {
    const tri: Point[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 2 },
    ]
    expect(area(offsetPolygon(tri, 0.1))).toBeGreaterThan(area(tri))
  })
})
