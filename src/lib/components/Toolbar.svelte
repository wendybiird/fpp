<script lang="ts">
  import { app, type Mode } from '../../app-state.svelte'

  const modes: { id: Mode; label: string; key: string }[] = [
    { id: 'draw', label: 'Draw', key: 'E' },
    { id: 'photo', label: 'Photo', key: 'P' },
    { id: 'color', label: 'Color', key: 'C' },
    { id: 'name', label: 'Name', key: 'N' },
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

  <div class="spacer"></div>

  <label class="zoom">
    Zoom
    <input type="range" min="24" max="180" step="2" bind:value={app.pxPerIn} />
  </label>
</header>
