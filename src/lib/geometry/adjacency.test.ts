import { describe, it, expect } from 'vitest'
import { sharedEdges, areAdjacent } from './adjacency'
import type { Point } from './types'

const square = (x: number, y: number, s = 1): Point[] => [
  { x, y },
  { x: x + s, y },
  { x: x + s, y: y + s },
  { x, y: y + s },
]

describe('sharedEdges / areAdjacent', () => {
  it('detects a full shared edge between side-by-side squares', () => {
    const a = square(0, 0)
    const b = square(1, 0) // shares the edge x = 1, y in [0,1]
    const segs = sharedEdges(a, b)
    expect(segs.length).toBe(1)
    expect(areAdjacent(a, b)).toBe(true)
    const [p, q] = segs[0]
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeCloseTo(1, 9)
  })

  it('reports no shared edge for separated squares', () => {
    expect(areAdjacent(square(0, 0), square(2, 0))).toBe(false)
  })

  it('detects a partial edge overlap', () => {
    const a = square(0, 0, 2) // right edge x=2, y in [0,2]
    const b = square(2, 1, 1) // left edge x=2, y in [1,2]
    const segs = sharedEdges(a, b)
    expect(segs.length).toBe(1)
    const [p, q] = segs[0]
    expect(Math.abs(p.y - q.y)).toBeCloseTo(1, 9) // overlap is y in [1,2]
  })

  it('treats squares that only touch at a corner as non-adjacent', () => {
    expect(areAdjacent(square(0, 0), square(1, 1))).toBe(false)
  })
})
