# FPP — Foundation Paper Piecing

A web app for designing foundation paper-piecing (FPP) quilt blocks, inspired by
the desktop [QuiltAssistant](https://quiltassistant.com/free-quilt-design-software).

Draw straight lines that split a block into sections, color them (or auto-color
from a photo), number them into a foundation sewing order, and print true-size
templates with seam allowances.

Built with **Svelte 5 + TypeScript + Vite**, rendering the design as **SVG**, and
developed entirely inside **Docker**. It runs fully in the browser — no backend.

## Core idea

The block starts as a single rectangular section. Each line you draw **bisects
only the section it's drawn in**, clipped to that section's edges (it does not run
edge-to-edge across the whole block). Because every section starts convex and a
straight cut of a convex polygon yields two convex polygons, **every patch stays
convex** — which keeps the geometry (splitting, hit-testing, photo sampling,
seam-allowance offset) simple and robust.

## Features

- **Drawing** — click-drag to cut the section under the cursor; live preview of
  the cut clipped to that section.
- **Snapping** — snap line ends to existing corners, and snap the drag angle to
  15° increments (both toggleable).
- **Symmetry** — auto-mirror each cut across the block's vertical / horizontal /
  both axes (None / Mirror | / Mirror — / 4-way).
- **Undo / redo** — full history (Ctrl+Z / Ctrl+Shift+Z).
- **Photo-to-quilt** — load a photo and auto-color each patch from the image; a
  Photo↔Flat slider blends the raw photo against the flat colors. (It also doubles
  as a visual check that the patches tile cleanly.)
- **Coloring** — a fabric palette with eyedropper (right-click) and click-to-fill;
  optionally snap photo-sampled colors to the nearest palette fabric.

Keyboard: `E` draw · `C` color · `P` photo · `N` name · `Ctrl/Cmd+Z` / `+Shift+Z`.

## Development (Docker)

All tooling runs inside a container; you only need **Docker** and **git** on the
host. Source is bind-mounted for live edits/HMR; `node_modules` lives in a named
volume so Linux-native binaries never clash with the host.

```bash
# Start the dev server, then open http://localhost:5173
docker compose up

# One-off commands run in the container:
docker compose run --rm web npm test       # unit tests (Vitest)
docker compose run --rm web npm run check   # svelte-check + tsc
docker compose run --rm web npm run build   # production build
```

## Project layout

```
src/
  app-state.svelte.ts          # central Svelte 5 runes state (design, mode, history, palette)
  lib/
    geometry/                  # pure geometry: vec, line, splitPolygon (convex) + unit tests
    image/sampleColor.ts       # average-color photo sampling per patch
    model/                     # design factory, splitPatch/patchAt engine, palette
    components/                # Toolbar, DesignCanvas, ColorPalette, PhotoPanel, SizeDialog
```

## Status

Built incrementally:

- [x] Docker dev environment + app shell
- [x] Drawing engine (per-section cuts, snapping, symmetry, undo/redo)
- [x] Photo-to-quilt (auto-color + blend)
- [x] Coloring palette (fill, eyedropper, snap-to-palette)
- [ ] Paper-piecing naming (group letters + sewing order)
- [ ] True-size templates with seam allowances (print to PDF)
- [ ] Persistence (autosave + JSON save/load)
