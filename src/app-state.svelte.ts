// Central application state, using Svelte 5 runes in a `.svelte.ts` module.
// A single exported instance (`app`) is imported wherever state is needed.
import type { Design } from './lib/geometry/types'
import { createDesign } from './lib/model/design'

export type Mode = 'draw' | 'photo' | 'color' | 'name'

class AppState {
  /** The whole design. Engine operations replace this immutably (great for
   *  reactivity and for the undo/redo snapshot stack added in M1). */
  design = $state<Design>(createDesign(8, 8, 0.25))

  /** Active interaction mode. */
  mode = $state<Mode>('draw')

  /** Display scale: screen pixels per design inch (zoom). */
  pxPerIn = $state(64)

  /** Whether the "New design" dialog is open. */
  showSizeDialog = $state(false)

  setMode(m: Mode) {
    this.mode = m
  }

  /** Start a brand-new design, replacing the current one. */
  startNew(wIn: number, hIn: number, seamIn: number) {
    this.design = createDesign(wIn, hIn, seamIn)
  }
}

export const app = new AppState()
