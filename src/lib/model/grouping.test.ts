import { describe, it, expect } from 'vitest'
import type { Design, Patch } from '../geometry/types'
import { groupValidity, toggleAssignment, autoSegment } from './grouping'

const rect = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  group?: string,
  order?: number,
): Patch => ({
  id,
  color: '#fff',
  group,
  order,
  vertices: [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ],
})

const design = (patches: Patch[]): Design => ({
  wIn: 3,
  hIn: 3,
  seamIn: 0.25,
  patches,
  blend: 1,
})

describe('groupValidity', () => {
  it('marks a contiguous left-to-right strip as all valid', () => {
    const d = design([
      rect('a', 0, 0, 1, 1, 'A', 1),
      rect('b', 1, 0, 1, 1, 'A', 2),
      rect('c', 2, 0, 1, 1, 'A', 3),
    ])
    const v = groupValidity(d, 'A')
    expect(v.get('a')).toBe(true)
    expect(v.get('b')).toBe(true)
    expect(v.get('c')).toBe(true)
  })

  it('flags a piece not adjacent to its predecessors', () => {
    // a and c have a gap between them, so c cannot be sewn onto a.
    const d = design([
      rect('a', 0, 0, 1, 1, 'A', 1),
      rect('c', 2, 0, 1, 1, 'A', 2),
    ])
    const v = groupValidity(d, 'A')
    expect(v.get('a')).toBe(true)
    expect(v.get('c')).toBe(false)
  })

  it('flags an L-shaped (non-collinear) seam as invalid', () => {
    // a bottom-left, b tall right column, c top-left: c touches a (below) AND
    // b (right) — two non-collinear seams, so it can't join with one straight seam.
    const d = design([
      rect('a', 0, 0, 1, 1, 'A', 1),
      rect('b', 1, 0, 1, 2, 'A', 2),
      rect('c', 0, 1, 1, 1, 'A', 3),
    ])
    const v = groupValidity(d, 'A')
    expect(v.get('c')).toBe(false)
  })
})

describe('toggleAssignment', () => {
  it('assigns in order then removes and renumbers', () => {
    let patches = [rect('a', 0, 0, 1, 1), rect('b', 1, 0, 1, 1), rect('c', 2, 0, 1, 1)]
    patches = toggleAssignment(patches, 'a', 'A')
    patches = toggleAssignment(patches, 'b', 'A')
    patches = toggleAssignment(patches, 'c', 'A')
    expect(patches.find((p) => p.id === 'b')!.order).toBe(2)
    // removing b renumbers the rest: c goes from 3 -> 2
    patches = toggleAssignment(patches, 'b', 'A')
    expect(patches.find((p) => p.id === 'b')!.group).toBeUndefined()
    expect(patches.find((p) => p.id === 'c')!.order).toBe(2)
  })
})

function allUnitsValid(patches: Patch[]): boolean {
  const seg = autoSegment(patches)
  if (!seg.every((p) => p.group && p.order)) return false
  const d = design(seg)
  for (const g of new Set(seg.map((p) => p.group!))) {
    for (const ok of groupValidity(d, g).values()) if (!ok) return false
  }
  return true
}

describe('autoSegment', () => {
  it('makes a 1x3 strip a single valid unit', () => {
    const patches = [rect('a', 0, 0, 1, 1), rect('b', 1, 0, 1, 1), rect('c', 2, 0, 1, 1)]
    const seg = autoSegment(patches)
    expect(new Set(seg.map((p) => p.group)).size).toBe(1)
    expect(allUnitsValid(patches)).toBe(true)
  })

  it('produces a valid segmentation for a 2x2 grid', () => {
    const patches = [
      rect('tl', 0, 0, 1, 1),
      rect('tr', 1, 0, 1, 1),
      rect('bl', 0, 1, 1, 1),
      rect('br', 1, 1, 1, 1),
    ]
    expect(allUnitsValid(patches)).toBe(true)
  })

  it('produces a valid segmentation for a 3x3 grid', () => {
    const patches: Patch[] = []
    let i = 0
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) patches.push(rect('p' + i++, c, r, 1, 1))
    }
    expect(allUnitsValid(patches)).toBe(true)
  })
})
