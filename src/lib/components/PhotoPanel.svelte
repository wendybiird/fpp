<script lang="ts">
  import { app } from '../../app-state.svelte'
  import { coverPlacement, loadImage, sampleAverageColors } from '../image/sampleColor'
  import { nearestColor } from '../model/palette'

  const design = $derived(app.design)
  let busy = $state(false)
  let fileName = $state<string | null>(null)
  let snapToPalette = $state(false)

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = () => reject(fr.error)
      fr.readAsDataURL(file)
    })
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    busy = true
    try {
      const dataUrl = await readAsDataURL(file)
      const img = await loadImage(dataUrl)
      const place = coverPlacement(img.naturalWidth, img.naturalHeight, design.wIn, design.hIn)
      app.setPhoto({
        src: dataUrl,
        ...place,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
      })
      fileName = file.name
    } finally {
      busy = false
      input.value = ''
    }
  }

  async function autoColor() {
    if (!design.photo) return
    busy = true
    try {
      const img = await loadImage(design.photo.src)
      const colors = sampleAverageColors(img, design)
      if (snapToPalette) {
        for (const [id, c] of colors) colors.set(id, nearestColor(c, app.palette))
      }
      app.applyPatchColors(colors)
      app.setBlend(1)
    } finally {
      busy = false
    }
  }
</script>

<div class="panel-block">
  <h3>Photo</h3>

  <label class="btn full file-btn">
    {design.photo ? 'Replace image…' : 'Load image…'}
    <input type="file" accept="image/*" onchange={onFile} hidden />
  </label>

  {#if design.photo}
    {#if fileName}
      <p class="filename" title={fileName}>{fileName}</p>
    {/if}

    <button class="btn primary full" onclick={autoColor} disabled={busy}>
      {busy ? 'Sampling…' : 'Auto-color from photo'}
    </button>

    <label class="chk snap">
      <input type="checkbox" bind:checked={snapToPalette} /> Snap to palette
    </label>

    <label class="blend">
      <span>Photo</span>
      <input type="range" min="0" max="1" step="0.01" bind:value={app.design.blend} />
      <span>Flat</span>
    </label>

    <button class="btn full subtle" onclick={() => app.setPhoto(undefined)}>Remove photo</button>
  {:else}
    <p class="hint">
      Load a photo to color the block from it. The mosaic also doubles as a quick check that the
      patches tile cleanly — any gap or overlap shows up instantly.
    </p>
  {/if}
</div>
