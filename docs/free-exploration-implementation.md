# Free Exploration — Implementation and QA Report

Captured 1 September 2026. This report records the implemented virtual-library interaction pass and the visual checks performed against the generated design references.

## Implemented flow

- Free Exploration begins inside the closed entrance and remains separate from the guided scroll tour.
- A throttled center-screen raycast targets shelf proxies, uploaded volumes, and the active rolling ladder without raycasting the full decorative scene.
- Shelves can be renamed; names persist in local storage.
- PDF and EPUB files can be added from the native file picker and persist locally in IndexedDB. No upload leaves the browser.
- Uploaded volumes render as recessed, leather-bound 3D books with a single-line, canvas-rendered gilt spine title, raised bands, and deterministic shelf placement.
- Stored volumes can be removed through a two-step confirmation action.
- PDF parsing and EPUB extraction load only when a stored volume is opened.
- The reader uses a physical parchment spread, page-turn motion, worn paper treatment, a desk environment, and a generated first-person hand asset.

## Ladder and upper-shelf interaction

- The contextual ladder is confined to the selected shelf rather than the main nave.
- Shelf-facing rotation and physical lean use nested transforms. This prevents the sideways or backwards cant previously visible on opposite shelf faces.
- The wheel/base assembly sits above the floor, while the upper rails stop just outside the book plane.
- The climb range ends at the real top of the ladder instead of allowing the camera to float above it.
- The camera follows the ladder's 6.3° lean, uses a wider climbing field of view, and frames several shelf rows rather than one oversized book.
- Nearby rungs are occluded only around eye level, leaving the side rails visible without placing a giant bar across the center of the screen.
- A/D moves the camera and ladder through the same shared lateral offset; the visitor never appears to slide independently in mid-air.
- There is no separate Reposition Ladder command. W/S climbs, A/D rolls along the shelf, and E descends.

## Visual QA states checked in the live WebGL build

| State | Result |
| --- | --- |
| Ladder, front elevation | Rails are vertical on screen and centered against the selected shelf. |
| Ladder, low side elevation | Wheels visibly meet the floor; the ladder leans toward the shelf without entering the book geometry. |
| First-person climb | Both rails remain at the frame edges, the center shelf is unobstructed, and multiple rows remain visible. |
| Opposite shelf face | The ladder rotates to face the shelf before leaning, eliminating the reversed-angle bug. |
| Uploaded book close-up | Spine depth and scale match neighboring books; the volume sits behind the shelf lip. |
| EPUB reader | Content opens locally and advances by page controls and arrow keys. |
| Persistence | A test EPUB survived reload, appeared on its shelf, opened successfully, and was removed cleanly. |

## Performance and build safeguards

- Decorative shelves and default volumes stay batched/instanced.
- Only one contextual ladder exists, adding 13 lightweight rung meshes while active.
- Rung visibility changes mutate existing meshes and do not trigger React renders during climbing.
- Lateral and vertical motion are damped in the render loop and reuse shared refs.
- The renderer remains demand-driven at a 0.85 device-pixel ratio.
- Reader dependencies remain code-split from the main Three.js world.

## Acceptance status

The primary Free Exploration loop is implemented: target a shelf, organize it, add and persist a real book, summon and climb a correctly aligned ladder, search laterally with the ladder moving under the visitor, target the stored volume, and read it in the physical manuscript view.
