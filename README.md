# FPP — Foundation Paper Piecing

A web app for designing foundation paper-piecing quilt blocks, inspired by the
desktop [QuiltAssistant](https://quiltassistant.com/free-quilt-design-software).

Draw straight lines that split a block into patches, color them (or auto-color
from a photo), number them into a foundation sewing order, and print true-size
templates with seam allowances.

Built with **Svelte 5 + TypeScript + Vite**, rendering the design as **SVG**.
It runs entirely in the browser (no backend); designs autosave to the browser
and can be saved/loaded as JSON.

## Core idea

Every drawn line is a full chord across the block, so the design — which starts
as one rectangle — is always subdivided into **convex** patches. That keeps the
geometry (splitting, hit-testing, photo-sampling) simple and robust.

## Development (Docker)

All tooling runs inside a container; you only need **Docker** and **git** on the
host. Source is bind-mounted for live edits/HMR; `node_modules` lives in a named
volume so Linux-native binaries never clash with the host.

```bash
# Start the dev server (http://localhost:5173)
docker compose up

# One-off commands run in the container:
docker compose run --rm web npm test          # unit tests (Vitest)
docker compose run --rm web npm run check      # svelte-check + tsc
docker compose run --rm web npm install <pkg>  # add a dependency
```

## Project layout

```
src/
  app-state.svelte.ts        # central Svelte 5 runes state
  lib/
    geometry/                # pure geometry: vec, line, splitPolygon, offset, union
    image/                   # photo color sampling
    model/                   # design factory, addLine, history, persistence, palette
    components/              # Toolbar, DesignCanvas, ColorPalette, PhotoPanel, ...
    print/                   # true-size template generation + print styles
```

## Status

See `MILESTONES` in the project plan. Built incrementally: drawing engine →
photo-to-quilt (visual debug harness) → coloring → paper-piecing naming →
templates/printing → persistence.
