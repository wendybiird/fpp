// Export the on-screen design SVG to a downloadable PNG by serializing it,
// drawing it onto a canvas, and saving the result. The embedded photo (a data
// URL) serializes inline, so it does not taint the canvas.

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportDesignPng(scale = 2): void {
  const svg = document.querySelector('svg.design') as SVGSVGElement | null
  if (!svg) return

  const xml = new XMLSerializer().serializeToString(svg)
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)

  const img = new Image()
  img.onload = () => {
    const w = svg.width.baseVal.value
    const h = svg.height.baseVal.value
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) download(blob, 'quilt-design.png')
    }, 'image/png')
  }
  img.src = svgUrl
}
