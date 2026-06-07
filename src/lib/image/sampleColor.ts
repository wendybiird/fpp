// Photo sampling: place an image over the design and compute the average color
// of the pixels inside each (convex) patch. This is what powers photo-to-quilt
// and, just as importantly, the visual debug harness — a correct subdivision
// renders as a clean low-poly mosaic of the photo.
import type { Design, Point } from '../geometry/types'

export interface CoverPlacement {
  x: number
  y: number
  w: number
  h: number
}

/** Cover-fit a natW x natH image into a wIn x hIn block: centered, scaled to
 *  fill the block, cropping the overflow. Guarantees every patch is covered. */
export function coverPlacement(
  natW: number,
  natH: number,
  wIn: number,
  hIn: number,
): CoverPlacement {
  const scale = Math.max(wIn / natW, hIn / natH)
  const w = natW * scale
  const h = natH * scale
  return { x: (wIn - w) / 2, y: (hIn - h) / 2, w, h }
}

/** Load an <img> from a (data) URL. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

/** Convex point-in-polygon: inside iff all edge cross-products share a sign. */
function pointInConvex(p: Point, poly: Point[]): boolean {
  let pos = false
  let neg = false
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
    if (cross > 0) pos = true
    else if (cross < 0) neg = true
    if (pos && neg) return false
  }
  return true
}

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
const toHex2 = (v: number) => clampByte(v).toString(16).padStart(2, '0')
const rgbToHex = (r: number, g: number, b: number) => `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`

/** Samples per design inch when rasterizing the photo for averaging. */
const SAMPLES_PER_IN = 40

/**
 * Average each patch's underlying photo pixels and return patchId -> hex color.
 * Draws the image once onto an offscreen canvas (at the photo's placement) and
 * scans each patch's bounding box, testing pixels for containment.
 */
export function sampleAverageColors(img: HTMLImageElement, design: Design): Map<string, string> {
  const result = new Map<string, string>()
  if (!design.photo) return result

  const S = SAMPLES_PER_IN
  const W = Math.max(1, Math.round(design.wIn * S))
  const H = Math.max(1, Math.round(design.hIn * S))
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return result

  const { x, y, w, h } = design.photo
  ctx.drawImage(img, x * S, y * S, w * S, h * S)
  const data = ctx.getImageData(0, 0, W, H).data

  for (const patch of design.patches) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const v of patch.vertices) {
      if (v.x < minX) minX = v.x
      if (v.y < minY) minY = v.y
      if (v.x > maxX) maxX = v.x
      if (v.y > maxY) maxY = v.y
    }
    const px0 = Math.max(0, Math.floor(minX * S))
    const py0 = Math.max(0, Math.floor(minY * S))
    const px1 = Math.min(W - 1, Math.ceil(maxX * S))
    const py1 = Math.min(H - 1, Math.ceil(maxY * S))

    let r = 0
    let g = 0
    let b = 0
    let count = 0
    for (let py = py0; py <= py1; py++) {
      for (let px = px0; px <= px1; px++) {
        const inch = { x: (px + 0.5) / S, y: (py + 0.5) / S }
        if (pointInConvex(inch, patch.vertices)) {
          const idx = (py * W + px) * 4
          r += data[idx]
          g += data[idx + 1]
          b += data[idx + 2]
          count++
        }
      }
    }

    if (count > 0) {
      result.set(patch.id, rgbToHex(r / count, g / count, b / count))
    } else {
      // Patch smaller than one sample cell: fall back to its centroid pixel.
      let cx = 0
      let cy = 0
      for (const v of patch.vertices) {
        cx += v.x
        cy += v.y
      }
      cx /= patch.vertices.length
      cy /= patch.vertices.length
      const px = Math.max(0, Math.min(W - 1, Math.round(cx * S)))
      const py = Math.max(0, Math.min(H - 1, Math.round(cy * S)))
      const idx = (py * W + px) * 4
      result.set(patch.id, rgbToHex(data[idx], data[idx + 1], data[idx + 2]))
    }
  }
  return result
}
