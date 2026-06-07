<script lang="ts">
  import { app } from './app-state.svelte'
  import Toolbar from './lib/components/Toolbar.svelte'
  import DesignCanvas from './lib/components/DesignCanvas.svelte'
  import SizeDialog from './lib/components/SizeDialog.svelte'

  function onKeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) app.redo()
      else app.undo()
      return
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      app.redo()
      return
    }
    if (mod) return

    switch (e.key.toLowerCase()) {
      case 'e':
        app.setMode('draw')
        break
      case 'c':
        app.setMode('color')
        break
      case 'p':
        app.setMode('photo')
        break
      case 'n':
        app.setMode('name')
        break
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app">
  <Toolbar />

  <main class="workspace">
    <div class="canvas-area">
      <DesignCanvas />
    </div>

    <aside class="side-panel">
      <!-- Tool panels (palette, photo, groups) arrive in later milestones. -->
      <div class="panel-block">
        <h3>Design</h3>
        <dl class="meta">
          <dt>Size</dt>
          <dd>{app.design.wIn}" × {app.design.hIn}"</dd>
          <dt>Seam</dt>
          <dd>{app.design.seamIn}"</dd>
          <dt>Patches</dt>
          <dd>{app.design.patches.length}</dd>
          <dt>Mode</dt>
          <dd class="mode-name">{app.mode}</dd>
        </dl>
      </div>
    </aside>
  </main>

  {#if app.showSizeDialog}
    <SizeDialog />
  {/if}
</div>
