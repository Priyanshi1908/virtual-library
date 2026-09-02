# Performance recovery — final report

Captured 1 September 2026 at a 1280 × 720 CSS viewport and a 1088 × 612 WebGL buffer. The isolated final run used `?perf=1&autorun=1`, traversing the complete experience at a fixed rate over 14 seconds. The comparison target begins once the camera crosses the doors and starts travelling through the library (`libraryNear`).

## Outcome

The entrance, door approach, threshold, and immediate library travel now have the same frame pacing. Every interaction segment completed without a long task, a frame over 20 ms, or a frame over 34 ms. The approach and threshold both measured a 17.6 ms p95, exactly matching the immediate post-door reference.

| Metric | Hero | Approach | Threshold | Library near | Library mid | Library deep |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frames | 48 | 75 | 93 | 201 | 210 | 210 |
| Frame average (ms) | 16.67 | 16.66 | 16.67 | 16.66 | 16.67 | 16.67 |
| Frame p95 (ms) | 17.3 | 17.6 | 17.6 | 17.6 | 17.7 | 17.6 |
| Frame p99 (ms) | 17.9 | 17.7 | 18.0 | 18.0 | 17.8 | 17.8 |
| Frame maximum (ms) | 17.9 | 17.7 | 18.0 | 18.1 | 18.1 | 17.9 |
| Frames over 20 ms | 0% | 0% | 0% | 0% | 0% | 0% |
| Frames over 34 ms | 0% | 0% | 0% | 0% | 0% | 0% |
| Scroll-to-render p95 (ms) | 0.7 | 0.6 | 0.6 | 0.5 | 0.5 | 0.6 |
| Long tasks | 0 | 0 | 0 | 0 | 0 | 0 |
| Draw calls average | 52.84 | 76.77 | 71.76 | 65.43 | 51.62 | 29.22 |
| Triangles average | 28,479 | 37,113 | 38,600 | 32,588 | 22,122 | 7,246 |
| Camera speed p95 | 3.195 | 12.011 | 9.301 | 8.693 | 8.675 | 8.196 |

## Before and after

| Indicator | Degraded baseline | Final isolated run | Result |
| --- | ---: | ---: | --- |
| Hero interaction long tasks | 9 / 2,683 ms total | 0 | Eliminated |
| Approach interaction long tasks | 6 / 1,493 ms total | 0 | Eliminated |
| Threshold interaction long tasks | 6 / 1,385 ms total | 0 | Eliminated |
| Approach p95 after corrected harness | 24.2 ms | 17.6 ms | 27.3% lower |
| Approach frames over 20 ms | 45.45% | 0% | Eliminated |
| Approach average triangles | 71,667 | 37,113 | 48.2% lower |
| Threshold p95 versus library-near p95 | visibly/stallingly worse | 17.6 ms versus 17.6 ms | Matched |
| Decoded resources | 37,174.59 KB | 17,951.38 KB | 51.7% lower |

## Proven causes and fixes

1. **React reconciliation was rebuilding work around the 3D canvas during scroll.** The progress-driven DOM interface updated React state throughout the entrance while the full Canvas subtree remained part of the same reconciliation path. Memoizing the complete library canvas removed the multi-hundred-millisecond interaction stalls. This was the decisive fix.
2. **Shader and scene states first appeared during interaction.** All camera stops and both entrance-visible states are now compiled and rendered behind the loading screen. Loading work is recorded separately and is never counted as smooth interaction.
3. **The entrance candleholders were disproportionately dense.** Two copies of the Poly Haven three-candle variant contributed roughly 64,000 triangles. The entrance now uses a lighter authored variant from the same real Poly Haven model, enlarged and centred on each sconce. This preserves the real asset while cutting entrance triangle load nearly in half.
4. **Rendering continued when the view was idle.** The canvas uses demand rendering and invalidates only for scroll, pointer movement, or an active camera/door transition.
5. **Entrance geometry remained in the camera path.** The complete doorway scene now leaves the render path immediately after the threshold, preventing the door and masonry from clipping across the view while the library remains fully prepared.
6. **Loading presentation overstayed completed preparation.** The decorative loader delay was reduced; it still waits for scene preparation, then clears after a short visual handoff.

## Visual and continuity checks

- Entrance stonework fills the viewport with no black corner gaps.
- Door leaves, panels, hinges, and wood texture are present before interaction.
- Both real candleholders are visible, centred, and scaled for the doorway.
- The threshold no longer shows a door slab or masonry clipping through the camera.
- Interior lighting was raised without changing the warm dark-academia palette, so the first hall is readable rather than blank.
- Scene details are prepared before the loader clears; no late-loading level-of-detail swap occurs during travel.

## Resource state

| Metric | Final value |
| --- | ---: |
| Renderer geometries | 97 |
| Renderer textures | 30 |
| Shader programs | 45 |
| Resource requests | 50 |
| Decoded resource size | 17,951.38 KB |
| Warm-cache transfer | 9.38 KB |

The loading phase still contains intentional shader compilation tasks (three tasks in the isolated run, 833 ms maximum), but they occur while the loading composition is visible. The measured interaction path contains none.

## Acceptance result

All eight acceptance conditions in `performance-methodology.md` pass in the isolated final run. The approach and threshold no longer show a smoothness deficit against the travel that starts inside the library.
