import { describe, it, expect } from 'vitest'
import type { Point } from './types'
import { lineThroughPoints } from './line'
import { splitByLine } from './splitPolygon'
import { area } from './vec'

const UNIT_SQUARE: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]

describe('splitByLine', () => {
  it('splits a square in half with a vertical cut', () => {
    const line = lineThroughPoints({ x: 0.5, y: 0 }, { x: 0.5, y: 1 })!
    const [a, b] = splitByLine(UNIT_SQUARE, line)
    expect(a.length).toBeGreaterThanOrEqual(3)
    expect(b.length).toBeGreaterThanOrEqual(3)
    expect(area(a)).toBeCloseTo(0.5, 10)
    expect(area(b)).toBeCloseTo(0.5, 10)
    // The two halves tile the original with no gap/overlap.
    expect(area(a) + area(b)).toBeCloseTo(area(UNIT_SQUARE), 10)
  })

  it('splits along a diagonal through two vertices into two triangles', () => {
    const line = lineThroughPoints({ x: 0, y: 0 }, { x: 1, y: 1 })!
    const [a, b] = splitByLine(UNIT_SQUARE, line)
    expect(area(a)).toBeCloseTo(0.5, 10)
    expect(area(b)).toBeCloseTo(0.5, 10)
  })

  it('returns the whole polygon on one side when the line misses it', () => {
    // A line well outside the square (x = 5).
    const line = lineThroughPoints({ x: 5, y: 0 }, { x: 5, y: 1 })!
    const [a, b] = splitByLine(UNIT_SQUARE, line)
    const filled = a.length ? a : b
    const empty = a.length ? b : a
    expect(empty).toEqual([])
    expect(area(filled)).toBeCloseTo(1, 10)
  })

  it('treats a line passing exactly through one vertex as a clean cut', () => {
    // Through the corner (0,0) at 30 degrees — clips a small triangle.
    const line = lineThroughPoints({ x: 0, y: 0 }, { x: 1, y: 0.5 })!
    const [a, b] = splitByLine(UNIT_SQUARE, line)
    expect(area(a) + area(b)).toBeCloseTo(1, 10)
    expect(a.length).toBeGreaterThanOrEqual(3)
    expect(b.length).toBeGreaterThanOrEqual(3)
  })

  it('does not produce a sliver from a cut lying along an edge', () => {
    // Line coincident with the left edge x = 0.
    const line = lineThroughPoints({ x: 0, y: 0 }, { x: 0, y: 1 })!
    const [a, b] = splitByLine(UNIT_SQUARE, line)
    const filled = a.length ? a : b
    const empty = a.length ? b : a
    expect(empty).toEqual([])
    expect(area(filled)).toBeCloseTo(1, 10)
  })

  it('conserves area across many successive cuts', () => {
    let polys: Point[][] = [UNIT_SQUARE]
    const cuts = [
      lineThroughPoints({ x: 0.3, y: 0 }, { x: 0.3, y: 1 })!,
      lineThroughPoints({ x: 0, y: 0.6 }, { x: 1, y: 0.6 })!,
      lineThroughPoints({ x: 0, y: 0 }, { x: 1, y: 1 })!,
      lineThroughPoints({ x: 0.8, y: 0 }, { x: 0.2, y: 1 })!,
    ]
    for (const line of cuts) {
      const next: Point[][] = []
      for (const poly of polys) {
        const [a, b] = splitByLine(poly, line)
        if (a.length && b.length) {
          next.push(a, b)
        } else {
          next.push(poly)
        }
      }
      polys = next
    }
    const total = polys.reduce((s, p) => s + area(p), 0)
    expect(total).toBeCloseTo(1, 8)
    expect(polys.length).toBeGreaterThan(1)
  })
})
