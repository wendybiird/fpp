// Central application state, using Svelte 5 runes in a `.svelte.ts` module.
// A single exported instance (`app`) is imported wherever state is needed.
import type { Design, Line, PhotoPlacement, Point } from './lib/geometry/types'
import { createDesign, splitPatch, patchAt, centroid } from './lib/model/design'
import { reflectX, reflectY } from './lib/geometry/line'
import { DEFAULT_PALETTE } from './lib/model/palette'
import { nextGroupLetter, toggleAssignment, clearGroup as clearGroupPatches } from './lib/model/grouping'

export type Mode = 'draw' | 'photo' | 'color' | 'name'
export type Symmetry = 'none' | 'v' | 'h' | 'quad'

const MAX_HISTORY = 100

class AppState {
  /** The whole design. Engine operations replace this immutably, which makes
   *  both reactivity and the undo/redo stacks below trivial. */
  design = $state<Design>(createDesign(8, 8, 0.25))

  /** Active interaction mode. */
  mode = $state<Mode>('draw')

  /** Display scale: screen pixels per design inch (zoom). */
  pxPerIn = $state(64)

  /** Whether the "New design" dialog is open. */
  showSizeDialog = $state(false)

  // --- Drawing aids ---
  /** Snap line endpoints to existing patch corners. */
  snapCorner = $state(true)
  /** Snap the drag angle to 15° increments when close. */
  snapAngleEnabled = $state(true)
  /** Auto-mirror each cut across the block's axes. */
  symmetry = $state<Symmetry>('none')

  // --- Colors ---
  /** The fabric palette and the active (selected) color. */
  palette = $state<string[]>([...DEFAULT_PALETTE])
  activeColor = $state<string>(DEFAULT_PALETTE[2])

  // --- Paper piecing ---
  /** The active group letter being assigned in Naming mode. */
  activeGroup = $state<string>('A')

  // --- History ---
  // We never mutate a Design in place (the engine returns a fresh design), so
  // keeping previous references is a complete and cheap undo history — no cloning.
  undoStack = $state<Design[]>([])
  redoStack = $state<Design[]>([])

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }
  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  setMode(m: Mode) {
    this.mode = m
  }

  /** Start a brand-new design, replacing the current one and clearing history. */
  startNew(wIn: number, hIn: number, seamIn: number) {
    this.design = createDesign(wIn, hIn, seamIn)
    this.undoStack = []
    this.redoStack = []
  }

  /** Replace the design and record an undo entry. */
  commit(next: Design) {
    this.undoStack.push(this.design)
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift()
    this.redoStack = []
    this.design = next
  }

  undo() {
    const prev = this.undoStack.pop()
    if (prev) {
      this.redoStack.push(this.design)
      this.design = prev
    }
  }

  redo() {
    const next = this.redoStack.pop()
    if (next) {
      this.undoStack.push(this.design)
      this.design = next
    }
  }

  /** Cut a single section (the patch under the cursor) by a line contained
   *  within it, expanded by the active symmetry, as one undo step. */
  cutPatch(patchId: string, line: Line) {
    const target = this.design.patches.find((p) => p.id === patchId)
    if (!target) return
    let next = this.design
    for (const cut of this.expandSymmetryCut(line, centroid(target.vertices))) {
      const patch = patchAt(next, cut.point)
      if (patch) next = splitPatch(next, patch.id, cut.line)
    }
    if (next !== this.design) this.commit(next)
  }

  // --- Photo-to-quilt ---
  /** Place (or clear) the reference photo. Loading one reveals it immediately
   *  by dropping the blend to 0 (raw photo). Not part of undo history. */
  setPhoto(photo: PhotoPlacement | undefined) {
    this.design.photo = photo
    this.design.blend = photo ? 0 : 1
  }

  /** Photo <-> flat-color blend (0..1). A view setting, not undoable. */
  setBlend(v: number) {
    this.design.blend = Math.max(0, Math.min(1, v))
  }

  /** Recolor patches from a patchId -> hex map (auto-color), as one undo step. */
  applyPatchColors(colors: Map<string, string>) {
    const patches = this.design.patches.map((p) =>
      colors.has(p.id) ? { ...p, color: colors.get(p.id)! } : p,
    )
    this.commit({ ...this.design, patches })
  }

  // --- Coloring ---
  setActiveColor(c: string) {
    this.activeColor = c
  }

  addColor(c: string) {
    if (!this.palette.includes(c)) this.palette.push(c)
  }

  removeColor(c: string) {
    if (this.palette.length <= 1) return
    this.palette = this.palette.filter((x) => x !== c)
    if (this.activeColor === c) this.activeColor = this.palette[0]
  }

  /** Fill one patch with the active color (undoable). */
  paintPatch(id: string) {
    const patches = this.design.patches.map((p) =>
      p.id === id ? { ...p, color: this.activeColor } : p,
    )
    this.commit({ ...this.design, patches })
  }

  /** Pick up a patch's color as the active color. */
  eyedrop(id: string) {
    const p = this.design.patches.find((x) => x.id === id)
    if (p) this.activeColor = p.color
  }

  // --- Paper-piecing naming ---
  setActiveGroup(letter: string) {
    this.activeGroup = letter
  }

  /** Start a fresh group (next unused letter) and make it active. */
  addGroup() {
    this.activeGroup = nextGroupLetter(this.design)
  }

  /** Toggle a patch's membership in the active group, in sewing order (undoable). */
  toggleGroupAssignment(id: string) {
    const patches = toggleAssignment(this.design.patches, id, this.activeGroup)
    this.commit({ ...this.design, patches })
  }

  /** Remove every patch from a group (undoable). */
  clearGroup(letter: string) {
    const patches = clearGroupPatches(this.design.patches, letter)
    this.commit({ ...this.design, patches })
  }

  // For symmetry we mirror both the cut line AND a reference point inside the
  // section, so each mirrored cut lands in the corresponding mirrored section.
  private expandSymmetryCut(line: Line, point: Point): { line: Line; point: Point }[] {
    const cx = this.design.wIn / 2
    const cy = this.design.hIn / 2
    const mx = (p: Point): Point => ({ x: 2 * cx - p.x, y: p.y })
    const my = (p: Point): Point => ({ x: p.x, y: 2 * cy - p.y })
    switch (this.symmetry) {
      case 'v':
        return [{ line, point }, { line: reflectX(line, cx), point: mx(point) }]
      case 'h':
        return [{ line, point }, { line: reflectY(line, cy), point: my(point) }]
      case 'quad': {
        const lx = reflectX(line, cx)
        return [
          { line, point },
          { line: lx, point: mx(point) },
          { line: reflectY(line, cy), point: my(point) },
          { line: reflectY(lx, cy), point: my(mx(point)) },
        ]
      }
      default:
        return [{ line, point }]
    }
  }
}

export const app = new AppState()
