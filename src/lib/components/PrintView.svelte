<script lang="ts">
  import { app } from '../../app-state.svelte'
  import { buildTemplates, ptsAttr } from '../print/templates'

  // FPP foundations are sewn from the back, so default to a mirrored template.
  let mirror = $state(true)
  const templates = $derived(buildTemplates(app.design, mirror))

  const close = () => (app.showPrint = false)
  const doPrint = () => window.print()
</script>

<div class="print-root">
  <div class="print-bar no-print">
    <strong>Foundation templates</strong>
    <label class="pchk"><input type="checkbox" bind:checked={mirror} /> Mirror for foundation</label>
    <span class="muted">Seam allowance {app.design.seamIn}"</span>
    <div class="spacer"></div>
    <button class="btn primary" onclick={doPrint}>Print / Save PDF</button>
    <button class="btn" onclick={close}>Close</button>
  </div>

  {#if templates.length === 0}
    <p class="print-empty no-print">
      No groups yet. Switch to <b>Name</b> mode and assign patches to groups first.
    </p>
  {:else}
    <div class="sheets">
      {#each templates as t (t.group)}
        <section class="sheet">
          <header class="sheet-title">
            Group {t.group}{mirror ? ' · mirrored' : ''} — print at 100% (no scaling)
          </header>
          <svg
            class="tpl"
            width={`${t.w}in`}
            height={`${t.h}in`}
            viewBox={`${t.minX} ${t.minY} ${t.w} ${t.h}`}
          >
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
              <polygon
                points={ptsAttr(p.vertices)}
                fill="none"
                stroke="#444444"
                stroke-width="0.008"
              />
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
          </svg>
        </section>
      {/each}
    </div>
  {/if}
</div>
