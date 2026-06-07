<script lang="ts">
  import { app } from './app-state.svelte'
  import Toolbar from './lib/components/Toolbar.svelte'
  import DesignCanvas from './lib/components/DesignCanvas.svelte'
  import SizeDialog from './lib/components/SizeDialog.svelte'
</script>

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
