// Central application state, using Svelte 5 runes in a `.svelte.ts` module.
// A single exported instance (`app`) is imported wherever state is needed.
import type { Design, Line } from './lib/geometry/types'
import { createDesign, addLine } from './lib/model/design'
import { reflectX, reflectY } from './lib/geometry/line'

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

  // --- History ---
  // We never mutate a Design in place (addLine returns a fresh one), so keeping
  // previous references is a complete and cheap undo history — no cloning.
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

  /** Apply a cut, expanded by the active symmetry, as a single undo step. */
  applyLine(line: Line) {
    let next = this.design
    for (const l of this.expandSymmetry(line)) next = addLine(next, l)
    if (next !== this.design) this.commit(next)
  }

  private expandSymmetry(line: Line): Line[] {
    const cx = this.design.wIn / 2
    const cy = this.design.hIn / 2
    switch (this.symmetry) {
      case 'v':
        return [line, reflectX(line, cx)]
      case 'h':
        return [line, reflectY(line, cy)]
      case 'quad': {
        const lx = reflectX(line, cx)
        return [line, lx, reflectY(line, cy), reflectY(lx, cy)]
      }
      default:
        return [line]
    }
  }
}

export const app = new AppState()
