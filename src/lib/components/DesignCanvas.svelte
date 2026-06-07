<script lang="ts">
  import { app } from '../../app-state.svelte'
  import { polygonPoints, nearestVertex, patchAt, centroid } from '../model/design'
  import { lineThroughPoints, clipLineToPolygon, snapAngle } from '../geometry/line'
  import { groupColor, groupValidity } from '../model/grouping'
  import type { Point } from '../geometry/types'

  // viewBox is in design INCHES, so geometry coordinates are used directly and
  // `non-scaling-stroke` keeps outlines crisp at any zoom.
  const design = $derived(app.design)
  const widthPx = $derived(design.wIn * app.pxPerIn)
  const heightPx = $derived(design.hIn * app.pxPerIn)

  let svgEl: SVGSVGElement | undefined

  // Live drawing state: the section being cut, the drag endpoints, snap markers.
  let drawing = $state(false)
  let targetId = $state<string | null>(null)
  let startPt = $state<Point | null>(null)
  let endPt = $state<Point | null>(null)
  let snapStart = $state<Point | null>(null)
  let snapEnd = $state<Point | null>(null)

  /** Snap radius in screen pixels. */
  const SNAP_PX = 10
  const snapMaxIn = $derived(SNAP_PX / app.pxPerIn)
  const markerR = $derived(5 / app.pxPerIn)

  // The cut line and its segment, clipped to the section it is drawn in.
  const targetPatch = $derived(
    targetId ? design.patches.find((p) => p.id === targetId) : undefined,
  )
  const previewLine = $derived(startPt && endPt ? lineThroughPoints(startPt, endPt) : null)
  const previewSeg = $derived(
    previewLine && targetPatch ? clipLineToPolygon(previewLine, targetPatch.vertices) : null,
  )

  // Per-patch single-seam validity across all groups (Naming mode only).
  const validity = $derived.by(() => {
    const m = new Map<string, boolean>()
    if (app.mode !== 'name') return m
    const groups = new Set(design.patches.map((p) => p.group).filter((g): g is string => !!g))
    for (const g of groups) {
      for (const [id, ok] of groupValidity(design, g)) m.set(id, ok)
    }
    return m
  })

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
    // The section being cut is whichever patch the press lands in.
    const hit = patchAt(design, raw)
    if (!hit) return
    targetId = hit.id
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
    targetId = null
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
    const id = targetId
    endDrag()
    if (line && id) app.cutPatch(id, line)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && drawing) endDrag()
  }

  // --- Color mode: click to fill, right-click to eyedrop ---
  function onPatchClick(id: string) {
    if (app.mode === 'color') app.paintPatch(id)
    else if (app.mode === 'name') app.toggleGroupAssignment(id)
  }
  function onPatchContext(e: MouseEvent, id: string) {
    if (app.mode !== 'color') return
    e.preventDefault()
    app.eyedrop(id)
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

    <!-- Reference photo (clipped to the block by the SVG viewport) -->
    {#if design.photo}
      <image
        href={design.photo.src}
        x={design.photo.x}
        y={design.photo.y}
        width={design.photo.w}
        height={design.photo.h}
        preserveAspectRatio="none"
        pointer-events="none"
      />
    {/if}

    {#each design.patches as patch (patch.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <polygon
        class:clickable={app.mode === 'color' || app.mode === 'name'}
        points={polygonPoints(patch.vertices)}
        fill={patch.color}
        fill-opacity={design.blend}
        stroke="#2a2a2a"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
        stroke-linejoin="round"
        onclick={() => onPatchClick(patch.id)}
        oncontextmenu={(e) => onPatchContext(e, patch.id)}
      />
    {/each}

    <!-- Naming mode: group tint + sewing-order labels -->
    {#if app.mode === 'name'}
      {#each design.patches as patch (patch.id)}
        {#if patch.group}
          <polygon
            points={polygonPoints(patch.vertices)}
            fill={groupColor(patch.group)}
            fill-opacity="0.28"
            stroke="none"
            pointer-events="none"
          />
        {/if}
      {/each}
      {#each design.patches as patch (patch.id)}
        {#if patch.group}
          {@const c = centroid(patch.vertices)}
          <text
            class="patch-label"
            class:invalid={validity.get(patch.id) === false}
            x={c.x}
            y={c.y}
            font-size="0.42"
            text-anchor="middle"
            dominant-baseline="central"
            paint-order="stroke"
            stroke="#fff"
            stroke-width="0.07"
            pointer-events="none">{patch.group}{patch.order}</text>
        {/if}
      {/each}
    {/if}

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

    <!-- Live preview of the cut, contained within the section -->
    {#if previewSeg}
      <line
        x1={previewSeg[0].x}
        y1={previewSeg[0].y}
        x2={previewSeg[1].x}
        y2={previewSeg[1].y}
        stroke="#7c3aed"
        stroke-width="2.5"
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
