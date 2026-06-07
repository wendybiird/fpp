<script lang="ts">
  import { app, type Mode, type Symmetry } from '../../app-state.svelte'

  const modes: { id: Mode; label: string; key: string }[] = [
    { id: 'draw', label: 'Draw', key: 'E' },
    { id: 'photo', label: 'Photo', key: 'P' },
    { id: 'color', label: 'Color', key: 'C' },
    { id: 'name', label: 'Name', key: 'N' },
  ]

  const symmetries: { id: Symmetry; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'v', label: 'Mirror |' },
    { id: 'h', label: 'Mirror —' },
    { id: 'quad', label: '4-way' },
  ]
</script>

<header class="toolbar">
  <strong class="brand">FPP<span>foundation paper piecing</span></strong>

  <button class="btn" onclick={() => (app.showSizeDialog = true)}>New…</button>

  <div class="modes" role="group" aria-label="Mode">
    {#each modes as m (m.id)}
      <button
        class="btn mode"
        class:active={app.mode === m.id}
        title={`${m.label} (${m.key})`}
        onclick={() => app.setMode(m.id)}
      >
        {m.label}
      </button>
    {/each}
  </div>

  <div class="divider"></div>

  <div class="group" role="group" aria-label="History">
    <button class="btn icon" onclick={() => app.undo()} disabled={!app.canUndo} title="Undo (Ctrl+Z)">↶</button>
    <button class="btn icon" onclick={() => app.redo()} disabled={!app.canRedo} title="Redo (Ctrl+Shift+Z)">↷</button>
  </div>

  {#if app.mode === 'draw'}
    <div class="group snaps" role="group" aria-label="Snapping">
      <label class="chk"><input type="checkbox" bind:checked={app.snapCorner} /> Corner</label>
      <label class="chk"><input type="checkbox" bind:checked={app.snapAngleEnabled} /> Angle</label>
    </div>

    <label class="sym">
      Symmetry
      <select bind:value={app.symmetry}>
        {#each symmetries as s (s.id)}
          <option value={s.id}>{s.label}</option>
        {/each}
      </select>
    </label>
  {/if}

  <div class="spacer"></div>

  <label class="zoom">
    Zoom
    <input type="range" min="24" max="180" step="2" bind:value={app.pxPerIn} />
  </label>
</header>
