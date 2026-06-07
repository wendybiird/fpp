// Default fabric palette + small color helpers used by coloring and by the
// optional "snap photo colors to palette" bridge.

/** A starter palette of quilting-fabric tones (all #rrggbb). */
export const DEFAULT_PALETTE: string[] = [
  '#e9e6df', // muslin
  '#f5f2ec', // cream
  '#c94c4c', // barn red
  '#e08e45', // pumpkin
  '#edc14e', // goldenrod
  '#6aa84f', // leaf green
  '#3d8b7d', // teal
  '#3a6ea5', // cornflower
  '#2b3a67', // navy
  '#7e5a9b', // plum
  '#9c6b4a', // chestnut
  '#3b3b3b', // charcoal
]

export type RGB = [number, number, number]

/** Parse a #rgb or #rrggbb string to an [r,g,b] triple (0–255). */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Nearest palette color to `hex` by squared RGB distance. */
export function nearestColor(hex: string, palette: string[]): string {
  if (palette.length === 0) return hex
  const [r, g, b] = hexToRgb(hex)
  let best = palette[0]
  let bestD = Infinity
  for (const c of palette) {
    const [cr, cg, cb] = hexToRgb(c)
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}
