<script lang="ts">
  import { app } from '../../app-state.svelte'

  let wIn = $state(app.design.wIn)
  let hIn = $state(app.design.hIn)
  let seamIn = $state(app.design.seamIn)

  function create() {
    app.startNew(Math.max(1, wIn), Math.max(1, hIn), Math.max(0, seamIn))
    app.showSizeDialog = false
  }

  function cancel() {
    app.showSizeDialog = false
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') cancel()
    if (e.key === 'Enter') create()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="overlay" onclick={(e) => { if (e.target === e.currentTarget) cancel() }}>
  <div class="dialog" role="dialog" aria-modal="true" aria-label="New design">
    <h2>New design</h2>
    <p class="sub">All dimensions are finished size, in inches.</p>

    <label>
      Width
      <input type="number" min="1" step="0.5" bind:value={wIn} />
    </label>
    <label>
      Height
      <input type="number" min="1" step="0.5" bind:value={hIn} />
    </label>
    <label>
      Seam allowance
      <input type="number" min="0" step="0.125" bind:value={seamIn} />
    </label>

    <div class="actions">
      <button class="btn" onclick={cancel}>Cancel</button>
      <button class="btn primary" onclick={create}>Create</button>
    </div>
  </div>
</div>
