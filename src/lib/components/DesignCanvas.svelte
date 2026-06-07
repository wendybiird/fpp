<script lang="ts">
  import { app } from '../../app-state.svelte'
  import { polygonPoints } from '../model/design'

  // viewBox is in design INCHES, so geometry coordinates are used directly.
  // `non-scaling-stroke` keeps outlines crisp at any zoom.
  const design = $derived(app.design)
  const widthPx = $derived(design.wIn * app.pxPerIn)
  const heightPx = $derived(design.hIn * app.pxPerIn)
</script>

<div class="canvas-scroll">
  <svg
    class="design"
    viewBox={`0 0 ${design.wIn} ${design.hIn}`}
    width={widthPx}
    height={heightPx}
    role="img"
    aria-label="Quilt block design"
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
  </svg>
</div>
