# Free Exploration — Interaction and Visual Specification

## Purpose

Free Exploration is the primary virtual-library mode. It begins just inside the closed entrance and lets the visitor walk, organize shelves, summon and climb contextual ladders, add their own PDF or EPUB books, find those books as physical leather-bound volumes, and read them without leaving the library atmosphere.

The guided tour remains a separate cinematic path. Free Exploration must never inherit its fixed camera stops or text-heavy chapter UI.

## Visual references

- [Quiet exploration HUD](./design-references/free-exploration/exploration-hud.png)
- [Shelf focus and actions](./design-references/free-exploration/shelf-focus.png)
- [Ladder and book focus](./design-references/free-exploration/ladder-book-focus.png)
- [Immersive physical reader](./design-references/free-exploration/immersive-reader.png)

## Design language

- The world occupies at least 92% of the screen. Interface elements are annotations, not panels.
- Walnut, oxblood and deep green leather, old parchment, aged brass, and warm charcoal are the only principal colors.
- Brass is a focus color, not a glow effect. No neon, game-console chrome, glass cards, or permanent center-bottom instruction banner.
- The native mouse pointer is retained outside pointer lock. Inside pointer lock, a small brass center reticle communicates targeting.
- Only the current action layer is visible: walking, shelf actions, ladder controls, or reading. Never stack all four.
- Every actionable state has keyboard, pointer, and touch-safe semantics, with visible focus and an Escape route.

## Core flow

1. **Enter Free Exploration** — camera starts at the inner threshold, facing the nave. A short corner hint teaches WASD, mouse look, E, and Escape, then recedes.
2. **Target a shelf** — the reticle tightens and the shelf receives a restrained warm edge. Its editable name appears beside the reticle.
3. **Organize** — E opens one slim contextual strip: Rename shelf, Add book, or Summon ladder. Once present, the ladder is controlled physically rather than through a separate reposition action.
4. **Add a book** — a native file chooser accepts PDF or EPUB. The file remains local. Metadata and the file blob persist in IndexedDB; shelf names persist locally.
5. **Find the volume** — uploaded volumes render as tactile leather spines with their titles. Aimed books expose only `E Open`.
6. **Reach upper shelves** — Summon ladder creates one physically aligned ladder against the selected shelf. E begins climbing; W/S changes height, A/D rolls both the ladder and visitor laterally as one unit, and E or Escape dismounts.
7. **Read** — the camera impression changes to looking down at a worn physical book on wood. Page turns are animated. PDF and EPUB content receives loading, unsupported, and corrupt-file states.

## Spatial rules

- Free exploration spawn: inside the entrance wall, centered on the nave, looking into the library.
- A ladder belongs to one selected shelf at a time and faces the shelf plane. It never blocks the main aisle.
- Shelf target proxies are shelf-sized but invisible. The thousands of decorative books remain batched; only focused details and user books become individual interactive objects.
- A user volume receives a deterministic slot within its shelf. Spines sit behind the shelf lip and never float beyond the wood depth.
- Movement collision remains active during normal walking. Ladder mode constrains the camera to a safe vertical/lateral rail.

## Performance budget

- Shelf targeting is throttled and raycasts only against shelf proxies plus uploaded-book meshes.
- Decorative book geometry stays instanced.
- Detailed spine labels render only for the focused shelf and uploaded volumes.
- PDF/EPUB parsing is dynamically imported only after a book is opened.
- Lantern illumination uses a camera-relative spotlight and point fill; it is not a path-traced effect.
- Target desktop: stable 55–60 FPS on Apple M3 Air at the current render scale, with no scene-wide remount when interaction state changes.

## Acceptance criteria

- Free roam starts inside the closed entrance, facing the library.
- A shelf can be targeted, renamed, and revisited with its name intact after reload.
- PDF and EPUB uploads survive reload locally and appear on the chosen shelf with a legible title.
- One ladder can be summoned, aligns with either face of its shelf, keeps its wheels on the floor and its rails outside the books, moves laterally with the climber, and does not obstruct the main nave.
- An uploaded book can be targeted and opened from both ground and ladder positions.
- The reader handles loading, empty, corrupt, unsupported, and successful states and supports keyboard page turns.
- The UI matches the four reference states at laptop and mobile widths without a permanent large instruction box.
- Production build succeeds; no new long tasks, uncontrolled raycasts, visible popping, or measurable free-roam regression is introduced.
