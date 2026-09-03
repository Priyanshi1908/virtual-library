# Exterior courtyard overhaul

## Purpose

The exterior was rebuilt after the first free-roam courtyard pass proved too
flat and visibly procedural. The target is a believable dark-academia cloister
that remains readable from every camera direction while preserving a clear,
walkable route through the library doors.

## Generated visual references

Three standalone references were generated with ChatGPT ImageGen before the
implementation work began:

- [Front façade](./design-references/exterior-courtyard/front-facade-reference.jpg)
- [Side cloister](./design-references/exterior-courtyard/side-cloister-reference.jpg)
- [Rear gate](./design-references/exterior-courtyard/rear-gate-reference.jpg)

All three prompts requested a horizontal, first-person, implementation-friendly
real-time 3D environment with weathered limestone, damp cobbles, restrained
amber lighting, cool moonlight, open walking space, and no people, UI, text, or
watermarks. Each view had a separate architectural brief:

- The front emphasizes a clear central path, carved entrance doors, a pointed
  portal, low planting, and a visually obvious route back inside.
- The side emphasizes repeating buttressed bays, shallow pointed recesses,
  narrow leaded windows, integrated stone benches, and planted edges.
- The rear emphasizes a deep wrought-iron gate, a garden visible beyond it,
  flanking tracery, layered foliage, and a strong endpoint for the main path.

## Extracted design rules

- Warm light is limited to the entrance, selected windows, and a few lanterns.
- Cool blue-black sky fill keeps unlit stone readable without flattening it.
- The center of the courtyard stays free of props and planting.
- Repetition is architectural, but window lighting and planting vary by bay.
- Stone changes scale by use: broad masonry fields, tighter trim, deep
  buttresses, projecting caps, and low curbs.
- Foliage belongs in beds or beyond the boundary; it never blocks movement.
- The rear gate must reveal depth beyond the wall instead of sitting on an
  opaque backdrop.

## Implementation

`LibraryWorld.jsx` now builds the exterior from reusable, render-conscious
pieces:

- a textured stone façade skin and nested pointed entrance portal;
- modular side walls with masonry-scaled UVs, buttresses, bases, caps, and
  cornices;
- reusable curved pointed panels with optional narrow illuminated windows;
- a split rear wall that creates a real opening behind the iron gate;
- a continuation path and planting beyond the gate for visible depth;
- instanced tree trunks and irregular low-poly canopy clusters beyond the
  playable boundary;
- textured beds, clipped hedges, and a lightweight CC0 shrub model;
- integrated benches, restrained lantern pools, cool directional fill, and a
  dark exterior sky volume.

The shrub's four source mesh parts are rendered as instanced meshes rather
than duplicated scene graphs. In the guided tour, the exterior group is also
removed from rendering after the camera clears the threshold. Free exploration
keeps it available at all times so returning outdoors remains possible.

The courtyard remains bounded at `x = ±10.75` and `z = 30.55`. The entrance
wall only permits crossing inside the real doorway throat, so the player can
walk outside, turn freely, and return through the opening doors without wall
clipping.

## External asset

The only new downloaded runtime asset is Poly Haven's CC0 **Shrub 03** by Rico
Cilliers: <https://polyhaven.com/a/shrub_03>.

Only the 1K glTF, its binary, and the diffuse, ARM, and OpenGL normal textures
are retained. Higher resolutions and unused formats were not downloaded. The
project-local source record is stored beside the asset in
`public/assets/models/shrub-03/SOURCE.txt`.

## Visual QA views

The inspection camera supports these query values for repeatable review:

- `?inspect=courtyardFront&inspectUi=explore`
- `?inspect=courtyardLeft&inspectUi=explore`
- `?inspect=courtyardRight&inspectUi=explore`
- `?inspect=courtyardRear&inspectUi=explore`
- `?inspect=entranceThresholdOutside&inspectUi=explore`

The production build and all five views should be checked after any future
exterior material, lighting, camera, or geometry change.

## Verification record

Final verification on 3 September 2026 included:

- a successful production build with Vite;
- browser inspection at 1280 × 720 from the front, both oblique sides, the
  rear gate, and the entrance threshold;
- a free-exploration traversal from the courtyard into the nave and back
  through the same doorway using keyboard movement;
- an isolated 14-second full-journey benchmark at 1088 × 612 WebGL resolution.

The benchmark measured a 26.6 ms p95 frame time on the exterior approach,
24.3 ms near the interior, 27.6 ms through the middle, and 24.7 ms deep in the
library. The exterior approach remains the heaviest view because it deliberately
shows the complete courtyard, façade, planting, and distant boundary at once.
Interior draw calls fall from an exterior maximum of 1,184 to a deep-library
average of 304 after the courtyard visibility handoff.
