<script lang="ts">
  import { app } from '../../app-state.svelte'
  import {
    buildTemplates,
    tileTemplate,
    ptsAttr,
    PAGE_SIZES,
    type PageTile,
    type Template,
  } from '../print/templates'

  // FPP foundations are sewn from the back, so default to a mirrored template.
  let mirror = $state(true)
  let tile = $state(true)
  let pageSize = $state<'Letter' | 'A4'>('Letter')

  const OVERLAP = 0.5

  const templates = $derived(buildTemplates(app.design, mirror))
  const stepX = $derived(PAGE_SIZES[pageSize].w - OVERLAP)
  const stepY = $derived(PAGE_SIZES[pageSize].h - OVERLAP)

  const pages = $derived.by(() => {
    const { w, h } = PAGE_SIZES[pageSize]
    const out: PageTile[] = []
    for (const t of templates) {
      if (tile) {
        out.push(...tileTemplate(t, w, h, OVERLAP))
      } else {
        out.push({ template: t, row: 0, col: 0, rows: 1, cols: 1, minX: t.minX, minY: t.minY, w: t.w, h: t.h })
      }
    }
    return out
  })

  const close = () => (app.showPrint = false)
  const doPrint = () => window.print()
</script>

{#snippet templateContent(t: Template)}
  <!-- Seam-allowance cut line -->
  <polygon
    points={ptsAttr(t.seam)}
    fill="#ffffff"
    stroke="#cc0000"
    stroke-width="0.02"
    stroke-dasharray="0.1 0.06"
  />
  <!-- Patch boundaries -->
  {#each t.patches as p (p.id)}
    <polygon points={ptsAttr(p.vertices)} fill="none" stroke="#444444" stroke-width="0.008" />
  {/each}
  <!-- Finished (sew) outline -->
  <polygon points={ptsAttr(t.outline)} fill="none" stroke="#111111" stroke-width="0.018" />
  <!-- Sewing-order numbers -->
  {#each t.patches as p (p.id)}
    <text
      x={p.center.x}
      y={p.center.y}
      font-size="0.34"
      text-anchor="middle"
      dominant-baseline="central"
      fill="#111111">{p.label}</text>
  {/each}
{/snippet}

<div class="print-root">
  <div class="print-bar no-print">
    <strong>Foundation templates</strong>
    <label class="pchk"><input type="checkbox" bind:checked={mirror} /> Mirror</label>
    <label class="pchk"><input type="checkbox" bind:checked={tile} /> Tile to page</label>
    <label class="pchk">
      Page
      <select bind:value={pageSize}>
        <option>Letter</option>
        <option>A4</option>
      </select>
    </label>
    <span class="muted">Seam {app.design.seamIn}"</span>
    <div class="spacer"></div>
    <button class="btn primary" onclick={doPrint}>Print / Save PDF</button>
    <button class="btn" onclick={close}>Close</button>
  </div>

  {#if pages.length === 0}
    <p class="print-empty no-print">
      No groups yet. Switch to <b>Name</b> mode and assign patches to groups first.
    </p>
  {:else}
    <div class="sheets">
      {#each pages as pg, i (i)}
        {@const t = pg.template}
        {@const tiled = pg.rows * pg.cols > 1}
        <section class="sheet">
          <header class="sheet-title">
            Group {t.group}{mirror ? ' · mirrored' : ''}{tiled
              ? ` · page ${pg.row + 1},${pg.col + 1} of ${pg.rows}×${pg.cols}`
              : ''} — print at 100%
          </header>
          <svg
            class="tpl"
            width={`${pg.w}in`}
            height={`${pg.h}in`}
            viewBox={`${pg.minX} ${pg.minY} ${pg.w} ${pg.h}`}
          >
            {@render templateContent(t)}

            {#if tiled}
              {@const x0 = pg.minX}
              {@const y0 = pg.minY}
              {@const x1 = pg.minX + pg.w}
              {@const y1 = pg.minY + pg.h}
              {@const m = 0.25}
              <!-- page boundary -->
              <rect
                x={x0}
                y={y0}
                width={pg.w}
                height={pg.h}
                fill="none"
                stroke="#bbbbbb"
                stroke-width="0.01"
              />
              <!-- overlap lines: where the next page's content begins -->
              {#if pg.col < pg.cols - 1}
                <line
                  x1={x0 + stepX}
                  y1={y0}
                  x2={x0 + stepX}
                  y2={y1}
                  stroke="#3a86ff"
                  stroke-width="0.012"
                  stroke-dasharray="0.12 0.08"
                />
              {/if}
              {#if pg.row < pg.rows - 1}
                <line
                  x1={x0}
                  y1={y0 + stepY}
                  x2={x1}
                  y2={y0 + stepY}
                  stroke="#3a86ff"
                  stroke-width="0.012"
                  stroke-dasharray="0.12 0.08"
                />
              {/if}
              <!-- corner registration ticks -->
              <path
                d={`M${x0} ${y0 + m} V${y0} H${x0 + m} M${x1 - m} ${y0} H${x1} V${y0 + m} M${x1} ${y1 - m} V${y1} H${x1 - m} M${x0 + m} ${y1} H${x0} V${y1 - m}`}
                stroke="#111111"
                stroke-width="0.012"
                fill="none"
              />
              <!-- tile label -->
              <rect x={x0 + 0.1} y={y0 + 0.1} width="1.6" height="0.44" fill="#ffffff" />
              <text x={x0 + 0.22} y={y0 + 0.33} font-size="0.26" fill="#3a86ff" font-weight="700"
                >{t.group} · r{pg.row + 1} c{pg.col + 1}</text
              >
            {/if}
          </svg>
        </section>
      {/each}
    </div>
  {/if}
</div>
