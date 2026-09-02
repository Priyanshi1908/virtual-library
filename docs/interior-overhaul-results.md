# Interior overhaul — verification report

Date: 1 September 2026  
Viewport: 1280 × 720 CSS pixels; 1088 × 612 WebGL render target (0.85 DPR)

## Believed

The reported visual failures came from scene organization rather than one bad texture: circulation and reading furniture shared the same lanes, props used incompatible scales, the ceiling had no authored material hierarchy, and aggressive prop culling caused visible discontinuity. The guided camera amplified those defects by pointing at blank boundaries and making sharp lateral changes.

## Tested

- Compared the live application at the entrance, nave, two shelf aisles, and far wall against the three generated targets in `docs/design-references/`.
- Captured the revised nave, aisle, and moonlit-window views to `docs/interior-overhaul-*.png`.
- Verified the Explore Freely start view contains a continuous empty aisle.
- Audited placement and collision constants for every shelf band, reading table, globe, and ladder.
- Ran two full 14-second automated guided journeys with the existing segment probe.
- Used production builds after each structural pass.

## Happened

### Visual and interaction evidence

- Twenty-four mixed-location tables became six persistent main-nave tables in three reading courts.
- All outer shelf-lane tables were removed. The captured shelf route is unobstructed.
- The globe moved from a shelf canyon to a walk-around nave landmark.
- The rolling ladder moved to a shelf exterior.
- The entrance frame and door leaves remain mounted after the exterior façade is culled.
- Repeated table props no longer distance-pop; all six tables remain mounted.
- Guided camera height is held around 2.05 units through the library and follows real aisle/cross-aisle routes.
- The ceiling now uses old-plank PBR infill, carved-oak ribs, larger eight-arm chandeliers, clerestory glazing, and a controlled cool window light.
- Two original oil-portrait surfaces were generated and mounted in architectural frames.

### Performance evidence

The first visual implementation exposed too many imported chair/sconce submeshes simultaneously:

| Segment | First pass p95 | First pass dropped >20 ms | Final p95 | Final dropped >20 ms |
|---|---:|---:|---:|---:|
| Approach | 16.9 ms | 0.00% | 17.0 ms | 0.00% |
| Threshold | 20.8 ms | 14.77% | 17.2 ms | 1.09% |
| Library near | 21.2 ms | 23.12% | 17.4 ms | 0.00% |
| Library mid | 17.0 ms | 0.00% | 17.7 ms | 0.00% |
| Library deep | 17.0 ms | 0.00% | 17.3 ms | 0.00% |

Final scroll-to-render p95 is 0.5–0.7 ms in every segment. There are zero interaction long tasks in approach, threshold, and every library segment. The threshold has one isolated 45.3 ms frame; its p95 remains 17.2 ms. Asset decoding fell from 33.39 MB in the first pass to 25.43 MB in the final pass after removing unused repeated model preloads.

## Changed

- Replaced repeated imported chair meshes with a batched carved-wood/oxblood upholstered chair that preserves human scale.
- Replaced tiny repeated sconce models with a batched three-flame wall sconce while keeping the real Poly Haven candleholders at hero/table scale.
- Split the entrance into a persistent door/frame and a threshold-only exterior façade.
- Reduced shelf visibility distance from 32 to 24 units while keeping every reading table persistent; the boundary sits beyond the readable fog range.
- Reworked books with a broader leather palette, varied depth/height/lean, gaps, and instanced gold spine details.

## Remains

The current layout deliberately retains a strong central axis. A later map phase should introduce offset rooms and unequal districts only after preserving these navigation and frame-time baselines. The implementation plan is in `docs/interior-overhaul-goals.md` under “Later asymmetric-map phase.”

## Supported

**Proven:** the previously problematic near-library segment now maintains a 17.4 ms p95 with zero frames above 20 ms during the automated run; tables no longer rely on distance culling; the sampled aisle is unobstructed.  
**Observed:** the warm timber ceiling, larger chandeliers, portraits, and moonlit glazing are legible in the saved review captures.  
**Inferred:** keeping shelf visibility changes behind the fog horizon should prevent readable shelf pop-in during normal guided travel.  
**Unresolved:** full route accessibility at every arbitrary free-walk heading is not covered by an automated pathfinding test; collision geometry is audited and the representative aisle/start route was exercised visually.
