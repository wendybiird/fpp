import { describe, it, expect } from 'vitest'
import { createDesign, splitPatch, patchAt, centroid } from './design'
import { lineThroughPoints } from '../geometry/line'
import { completeSymmetry } from './symmetry'
import type { Design } from '../geometry/types'

/** Whether every patch centroid has a mirror partner across x = axisX. */
function mirrorSymmetricX(design: Design, axisX: number): boolean {
  const cents = design.patches.map((p) => centroid(p.vertices))
  return cents.every((c) =>
    cents.some((c2) => Math.abs(c2.x - (axisX * 2 - c.x)) < 1e-6 && Math.abs(c2.y - c.y) < 1e-6),
  )
}

const vline = (x: number) => lineThroughPoints({ x, y: 0 }, { x, y: 8 })!
const hline = (y: number) => lineThroughPoints({ x: 0, y }, { x: 8, y })!

describe('completeSymmetry', () => {
  it('mirrors a left-half cut to the right (vertical symmetry)', () => {
    let d = createDesign(8, 8, 0.25)
    d = splitPatch(d, d.patches[0].id, vline(4)) // left | right
    d = splitPatch(d, patchAt(d, { x: 2, y: 4 })!.id, hline(4)) // split left only
    expect(d.patches.length).toBe(3)

    const done = completeSymmetry(d, 'v')
    expect(done.patches.length).toBe(4)
    expect(mirrorSymmetricX(done, 4)).toBe(true)
  })

  it('is a no-op for an already-symmetric design', () => {
    let d = createDesign(8, 8, 0.25)
    d = splitPatch(d, d.patches[0].id, vline(4))
    expect(completeSymmetry(d, 'v')).toBe(d)
  })

  it('completes 4-way symmetry from a single-quadrant cut', () => {
    let d = createDesign(8, 8, 0.25)
    d = splitPatch(d, d.patches[0].id, vline(4))
    d = splitPatch(d, patchAt(d, { x: 2, y: 4 })!.id, hline(4))
    d = splitPatch(d, patchAt(d, { x: 6, y: 4 })!.id, hline(4))
    expect(d.patches.length).toBe(4)
    // a diagonal in the top-left quadrant only
    d = splitPatch(d, patchAt(d, { x: 2, y: 2 })!.id, lineThroughPoints({ x: 0, y: 0 }, { x: 4, y: 4 })!)
    expect(d.patches.length).toBe(5)

    const done = completeSymmetry(d, 'quad')
    expect(done.patches.length).toBe(8) // each quadrant gets the diagonal
    expect(mirrorSymmetricX(done, 4)).toBe(true)
  })
})
