import { describe, it, expect } from 'vitest'
import {
  lineThroughPoints,
  side,
  clipLineToRect,
  snapAngle,
  reflectX,
  reflectY,
} from './line'
import { dist } from './vec'

describe('lineThroughPoints / side', () => {
  it('returns null for coincident points', () => {
    expect(lineThroughPoints({ x: 1, y: 1 }, { x: 1, y: 1 })).toBeNull()
  })

  it('has zero signed distance for points on the line and opposite signs across it', () => {
    const line = lineThroughPoints({ x: 0, y: 0 }, { x: 1, y: 1 })!
    expect(side(line, { x: 0.5, y: 0.5 })).toBeCloseTo(0, 12)
    const s1 = side(line, { x: 1, y: 0 })
    const s2 = side(line, { x: 0, y: 1 })
    expect(Math.sign(s1)).toBe(-Math.sign(s2))
  })

  it('uses a unit normal (signed distance equals true distance)', () => {
    const line = lineThroughPoints({ x: 0, y: 0 }, { x: 0, y: 1 })! // the y-axis
    expect(Math.abs(side(line, { x: 3, y: 7 }))).toBeCloseTo(3, 12)
  })
})

describe('clipLineToRect', () => {
  it('returns the full-width chord for a horizontal line', () => {
    const line = lineThroughPoints({ x: 0, y: 4 }, { x: 1, y: 4 })!
    const chord = clipLineToRect(line, 8, 8)!
    expect(chord).not.toBeNull()
    const xs = chord.map((p) => p.x).sort((a, b) => a - b)
    expect(xs[0]).toBeCloseTo(0, 9)
    expect(xs[1]).toBeCloseTo(8, 9)
    expect(chord.every((p) => Math.abs(p.y - 4) < 1e-9)).toBe(true)
  })

  it('returns null when the line is outside the rectangle', () => {
    const line = lineThroughPoints({ x: 20, y: 0 }, { x: 20, y: 1 })!
    expect(clipLineToRect(line, 8, 8)).toBeNull()
  })
})

describe('snapAngle', () => {
  it('snaps a near-horizontal drag to exactly horizontal', () => {
    const end = snapAngle({ x: 0, y: 0 }, { x: 1, y: 0.03 }, 15, 7)
    expect(end.y).toBeCloseTo(0, 9)
    expect(end.x).toBeCloseTo(Math.hypot(1, 0.03), 9) // length preserved
  })

  it('leaves a drag alone when no snap angle is within threshold', () => {
    // 22.5deg is exactly halfway between 15 and 30deg -> 7.5deg away, outside 7.
    const p1 = { x: 1, y: Math.tan((22.5 * Math.PI) / 180) }
    const end = snapAngle({ x: 0, y: 0 }, p1, 15, 7)
    expect(end).toEqual(p1)
  })
})

describe('reflectX / reflectY', () => {
  it('reflects a line across a vertical axis', () => {
    const line = lineThroughPoints({ x: 1, y: 0 }, { x: 1, y: 1 })! // x = 1
    const r = reflectX(line, 4) // mirror across x = 4 -> x = 7
    // The reflected vertical line should pass through x = 7.
    expect(Math.abs(side(r, { x: 7, y: 123 }))).toBeCloseTo(0, 9)
  })

  it('reflects a line across a horizontal axis', () => {
    const line = lineThroughPoints({ x: 0, y: 2 }, { x: 1, y: 2 })! // y = 2
    const r = reflectY(line, 5) // mirror across y = 5 -> y = 8
    expect(Math.abs(side(r, { x: -3, y: 8 }))).toBeCloseTo(0, 9)
  })

  it('reflection preserves distance from the mirror axis', () => {
    const line = lineThroughPoints({ x: 2, y: 0 }, { x: 2, y: 1 })!
    const r = reflectX(line, 4)
    const onR = { x: 6, y: 0 }
    expect(dist({ x: 2, y: 0 }, { x: 4, y: 0 })).toBeCloseTo(dist(onR, { x: 4, y: 0 }), 9)
  })
})
