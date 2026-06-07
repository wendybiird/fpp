<script lang="ts">
  import { app } from '../../app-state.svelte'

  // Keep the free-form hex field in sync but only push valid #rrggbb values.
  let hex = $derived(app.activeColor)
  function onHexInput(e: Event) {
    const v = (e.currentTarget as HTMLInputElement).value.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(v)) app.setActiveColor(v)
  }
</script>

<div class="panel-block">
  <h3>Colors</h3>

  <div class="active-color">
    <input type="color" aria-label="Active color" bind:value={app.activeColor} />
    <input class="hex" type="text" spellcheck="false" value={hex} oninput={onHexInput} />
  </div>

  <div class="swatches" role="listbox" aria-label="Palette">
    {#each app.palette as c, i (c + i)}
      <button
        class="swatch"
        class:active={c === app.activeColor}
        style:background={c}
        title={c}
        aria-label={c}
        onclick={() => app.setActiveColor(c)}
      ></button>
    {/each}
  </div>

  <div class="palette-actions">
    <button class="btn" onclick={() => app.addColor(app.activeColor)}>+ Add</button>
    <button class="btn subtle" onclick={() => app.removeColor(app.activeColor)}>− Remove</button>
  </div>

  <p class="hint">
    Left-click a patch to fill it with the active color. Right-click a patch to pick up its color.
  </p>
</div>
