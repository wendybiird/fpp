<script lang="ts">
  import { app } from '../../app-state.svelte'
  import { groupPatches, groupValidity, groupColor } from '../model/grouping'

  const design = $derived(app.design)
  const active = $derived(app.activeGroup)

  const groups = $derived.by(() => {
    const set = new Set(design.patches.map((p) => p.group).filter((g): g is string => !!g))
    set.add(app.activeGroup)
    return [...set].sort()
  })
  const activePatches = $derived(groupPatches(design, active))
  const validity = $derived(groupValidity(design, active))
  const unassigned = $derived(design.patches.filter((p) => !p.group).length)
  const invalidCount = $derived(activePatches.filter((p) => validity.get(p.id) === false).length)
</script>

<div class="panel-block">
  <h3>Paper piecing</h3>

  <button class="btn primary full auto-btn" onclick={() => app.autoNumber()}>
    ✦ Auto-number all
  </button>

  <div class="group-tabs">
    {#each groups as g (g)}
      <button
        class="group-tab"
        class:active={g === active}
        style:--gc={groupColor(g)}
        onclick={() => app.setActiveGroup(g)}
      >
        {g}
      </button>
    {/each}
    <button class="group-tab add" title="New group" onclick={() => app.addGroup()}>+</button>
  </div>

  <p class="hint">Click patches in the order you'll sew them. Group <b>{active}</b> is active.</p>

  {#if activePatches.length}
    <ol class="seam-list">
      {#each activePatches as p (p.id)}
        <li class:invalid={validity.get(p.id) === false}>
          <span class="seam-num" style:background={groupColor(p.group!)}>{p.group}{p.order}</span>
          {#if validity.get(p.id) === false}
            <span class="flag">⚠ bent seam</span>
          {/if}
        </li>
      {/each}
    </ol>

    {#if invalidCount > 0}
      <p class="warn">
        ⚠ {invalidCount} piece{invalidCount === 1 ? '' : 's'} can't be added in this order with a single
        straight seam — try reordering.
      </p>
    {/if}

    <button class="btn full subtle" onclick={() => app.clearGroup(active)}>Clear group {active}</button>
  {:else}
    <p class="muted">No patches in group {active} yet.</p>
  {/if}

  <p class="muted small">{unassigned} patch{unassigned === 1 ? '' : 'es'} unassigned</p>
</div>
