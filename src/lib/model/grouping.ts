// Paper-piecing groups: assign patches to a foundation unit (letter) and a
// sewing order (number), and validate that each piece can be added with a
// single straight seam — the core FPP constraint.
import type { Design, Patch, Point } from '../geometry/types'
import { sharedEdges } from '../geometry/adjacency'
import { lineThroughPoints, side } from '../geometry/line'

const SEAM_EPS = 1e-6

/** A distinct tint per group letter, for the naming overlay. */
export function groupColor(letter: string): string {
  const i = Math.max(0, letter.charCodeAt(0) - 65)
  const hue = (i * 67) % 360
  return `hsl(${hue}, 65%, 50%)`
}

/** The next unused group letter (A, B, C, ...). */
export function nextGroupLetter(design: Design): string {
  const used = new Set(
    design.patches.map((p) => p.group).filter((g): g is string => !!g),
  )
  let i = 0
  while (used.has(String.fromCharCode(65 + i))) i++
  return String.fromCharCode(65 + i)
}

/** Patches of a group, in sewing order. */
export function groupPatches(design: Design, group: string): Patch[] {
  return design.patches
    .filter((p) => p.group === group)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function maxOrder(patches: Patch[], group: string): number {
  let m = 0
  for (const p of patches) if (p.group === group) m = Math.max(m, p.order ?? 0)
  return m
}

/** Renumber a group's patches 1..n by their current order (mutates in place). */
function renumber(patches: Patch[], group: string): void {
  patches
    .filter((p) => p.group === group)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((p, i) => {
      p.order = i + 1
    })
}

/**
 * Toggle a patch's membership in `activeGroup`: if it's already there, remove it
 * (and renumber); otherwise add it at the next order (removing it from any prior
 * group first). Returns a new patches array.
 */
export function toggleAssignment(patches: Patch[], id: string, activeGroup: string): Patch[] {
  const next = patches.map((p) => ({ ...p }))
  const patch = next.find((p) => p.id === id)
  if (!patch) return patches
  if (patch.group === activeGroup) {
    patch.group = undefined
    patch.order = undefined
    renumber(next, activeGroup)
  } else {
    const prev = patch.group
    patch.group = activeGroup
    patch.order = maxOrder(next, activeGroup) + 1
    if (prev) renumber(next, prev)
  }
  return next
}

/** Remove every patch from a group. Returns a new patches array. */
export function clearGroup(patches: Patch[], group: string): Patch[] {
  return patches.map((p) =>
    p.group === group ? { ...p, group: undefined, order: undefined } : p,
  )
}

/**
 * For each patch in `group` (in sewing order), whether it can be added to the
 * already-sewn region (its predecessors) with a SINGLE straight seam. Piece 1 is
 * always valid; a piece that shares no edge with its predecessors, or shares
 * edges that aren't collinear, is flagged invalid.
 */
export function groupValidity(design: Design, group: string): Map<string, boolean> {
  const ordered = groupPatches(design, group)
  const result = new Map<string, boolean>()
  for (let k = 0; k < ordered.length; k++) {
    if (k === 0) {
      result.set(ordered[k].id, true)
      continue
    }
    const segs: [Point, Point][] = []
    for (let j = 0; j < k; j++) {
      for (const s of sharedEdges(ordered[k].vertices, ordered[j].vertices)) segs.push(s)
    }
    if (segs.length === 0) {
      result.set(ordered[k].id, false)
      continue
    }
    const line = lineThroughPoints(segs[0][0], segs[0][1])
    const collinear =
      !!line &&
      segs.every(
        ([p, q]) => Math.abs(side(line, p)) < SEAM_EPS && Math.abs(side(line, q)) < SEAM_EPS,
      )
    result.set(ordered[k].id, collinear)
  }
  return result
}
