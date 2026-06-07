// Client-only persistence: serialize a design (+ palette) to JSON for autosave
// (localStorage) and for file save/load. Parsing is defensive — a corrupt or
// foreign file returns null rather than throwing.
import type { Design } from '../geometry/types'

const STORAGE_KEY = 'fpp:autosave:v1'
const VERSION = 1

export interface SavedDoc {
  version: number
  design: Design
  /** Empty when the file predates palette saving. */
  palette: string[]
}

export function serialize(design: Design, palette: string[]): string {
  return JSON.stringify({ version: VERSION, design, palette })
}

/** Parse + validate a saved document. Returns null if it isn't a valid design. */
export function parseDoc(text: string): SavedDoc | null {
  try {
    const o = JSON.parse(text)
    const d = o?.design
    if (!d || typeof d.wIn !== 'number' || typeof d.hIn !== 'number' || !Array.isArray(d.patches)) {
      return null
    }
    for (const p of d.patches) {
      if (!p || typeof p.id !== 'string' || !Array.isArray(p.vertices)) return null
    }
    if (typeof d.seamIn !== 'number') d.seamIn = 0.25
    if (typeof d.blend !== 'number') d.blend = 1
    const palette = Array.isArray(o.palette) ? (o.palette as string[]) : []
    return { version: typeof o.version === 'number' ? o.version : 1, design: d as Design, palette }
  } catch {
    return null
  }
}

export function saveToLocal(json: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, json)
  } catch {
    // Storage disabled or over quota (e.g. a very large embedded photo) — skip.
  }
}

export function loadFromLocal(): SavedDoc | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    return text ? parseDoc(text) : null
  } catch {
    return null
  }
}

export function downloadJson(json: string, filename = 'quilt.json'): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
