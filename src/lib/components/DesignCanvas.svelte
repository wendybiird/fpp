<script lang="ts">
  import { app } from '../../app-state.svelte'
  import { polygonPoints, nearestVertex } from '../model/design'
  import { lineThroughPoints, clipLineToRect, snapAngle } from '../geometry/line'
  import type { Point } from '../geometry/types'

  // viewBox is in design INCHES, so geometry coordinates are used directly and
  // `non-scaling-stroke` keeps outlines crisp at any zoom.
  const design = $derived(app.design)
  const widthPx = $derived(design.wIn * app.pxPerIn)
  const heightPx = $derived(design.hIn * app.pxPerIn)

  let svgEl: SVGSVGElement | undefined

  // Live drawing state (start/end of the current drag, plus snap markers).
  let drawing = $state(false)
  let startPt = $state<Point | null>(null)
  let endPt = $state<Point | null>(null)
  let snapStart = $state<Point | null>(null)
  let snapEnd = $state<Point | null>(null)

  /** Snap radius in screen pixels. */
  const SNAP_PX = 10
  const snapMaxIn = $derived(SNAP_PX / app.pxPerIn)
  const markerR = $derived(5 / app.pxPerIn)

  // The cut being previewed, and its full edge-to-edge chord.
  const previewLine = $derived(startPt && endPt ? lineThroughPoints(startPt, endPt) : null)
  const previewChord = $derived(
    previewLine ? clipLineToRect(previewLine, design.wIn, design.hIn) : null,
  )

  /** Convert a pointer event to design (inch) coordinates via the SVG CTM. */
  function toInches(e: PointerEvent): Point {
    const svg = svgEl
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const inv = pt.matrixTransform(ctm.inverse())
    return { x: inv.x, y: inv.y }
  }

  function onPointerDown(e: PointerEvent) {
    if (app.mode !== 'draw' || e.button !== 0) return
    const raw = toInches(e)
    let s = raw
    snapStart = null
    if (app.snapCorner) {
      const v = nearestVertex(raw, design, snapMaxIn)
      if (v) {
        s = v
        snapStart = v
      }
    }
    startPt = s
    endPt = s
    drawing = true
    try {
      svgEl?.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture can throw for non-active/synthetic pointers; ignore.
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawing || !startPt) return
    let p = toInches(e)
    if (app.snapAngleEnabled) p = snapAngle(startPt, p, 15, 7)
    snapEnd = null
    if (app.snapCorner) {
      const v = nearestVertex(p, design, snapMaxIn)
      if (v) {
        p = v
        snapEnd = v
      }
    }
    endPt = p
  }

  function endDrag() {
    drawing = false
    startPt = null
    endPt = null
    snapStart = null
    snapEnd = null
  }

  function onPointerUp(e: PointerEvent) {
    if (!drawing) return
    try {
      svgEl?.releasePointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }
    const line = previewLine
    endDrag()
    if (line) app.applyLine(line)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && drawing) endDrag()
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="canvas-scroll">
  <svg
    bind:this={svgEl}
    class="design"
    class:drawing-mode={app.mode === 'draw'}
    viewBox={`0 0 ${design.wIn} ${design.hIn}`}
    width={widthPx}
    height={heightPx}
    role="img"
    aria-label="Quilt block design"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={endDrag}
  >
    <!-- Paper background -->
    <rect x="0" y="0" width={design.wIn} height={design.hIn} fill="#ffffff" />

    {#each design.patches as patch (patch.id)}
      <polygon
        points={polygonPoints(patch.vertices)}
        fill={patch.color}
        stroke="#2a2a2a"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
        stroke-linejoin="round"
      />
    {/each}

    <!-- Block border on top -->
    <rect
      x="0"
      y="0"
      width={design.wIn}
      height={design.hIn}
      fill="none"
      stroke="#111"
      stroke-width="1.5"
      vector-effect="non-scaling-stroke"
    />

    <!-- Live preview of the cut (full edge-to-edge chord) -->
    {#if previewChord}
      <line
        x1={previewChord[0].x}
        y1={previewChord[0].y}
        x2={previewChord[1].x}
        y2={previewChord[1].y}
        stroke="#7c3aed"
        stroke-width="2"
        stroke-dasharray="6 4"
        vector-effect="non-scaling-stroke"
        pointer-events="none"
      />
    {/if}

    <!-- Snap markers -->
    {#if snapStart}
      <circle
        cx={snapStart.x}
        cy={snapStart.y}
        r={markerR}
        fill="none"
        stroke="#7c3aed"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
        pointer-events="none"
      />
    {/if}
    {#if snapEnd}
      <circle
        cx={snapEnd.x}
        cy={snapEnd.y}
        r={markerR}
        fill="#7c3aed"
        fill-opacity="0.25"
        stroke="#7c3aed"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
        pointer-events="none"
      />
    {/if}
  </svg>
</div>
