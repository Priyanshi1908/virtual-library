# Grand interior transformation — performance validation

Captured 1 September 2026 at a 1280 × 720 CSS viewport and a 1088 × 612 WebGL buffer using the existing `?perf=1&autorun=1` 14-second full-journey benchmark.

## Result

The final material/prop/vault pass preserves smooth interaction across the entrance and immediate library reveal. The first two exploratory iterations were rejected because repeated hero furniture and too many simultaneous dynamic lights caused shader variants and near-library stalls. The accepted pass uses sparse GLTF landmarks, batched supporting geometry, depth-culling, and fourteen visible lights at the final view.

| Metric | Hero | Approach | Threshold | Library near | Library mid | Library deep |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frame average (ms) | 19.05* | 16.67 | 16.67 | 16.67 | 16.67 | 16.67 |
| Frame p95 (ms) | 18.1 | 18.5 | 18.6 | 18.6 | 18.4 | 18.4 |
| Frame p99 (ms) | 125.0* | 18.9 | 19.0 | 19.0 | 18.8 | 19.0 |
| Frames above 20 ms | 2.38%* | 0% | 0% | 0% | 0% | 0% |
| Frames above 34 ms | 2.38%* | 0% | 0% | 0% | 0% | 0% |
| Interaction long tasks | 1* | 0 | 0 | 0 | 0 | 0 |
| Draw calls average | 117.31 | 243.09 | 469.79 | 222.48 | 164.58 | 120.15 |
| Triangles average | 131,318 | 350,506 | 842,413 | 345,066 | 184,045 | 166,972 |

`*` The isolated hero outlier occurred in the first active frame after the development-page reload. All approach, threshold, and interior segments—the user-reported interaction path—contain no long task and no frame above 20 ms. Scroll-to-render p95 remains 0.5–0.8 ms.

## Rejected regression and recovery

The first visual implementation reached 168 compiled shader programs and produced a 44.2 ms near-library p95 with multi-second interaction tasks. The recovered final pass measures 83 programs and an 18.6 ms near-library p95. The decisive changes were:

- reducing real Gothic chairs and encyclopedia volumes to sparse hero placements;
- removing per-table point lights and using emissive lamp shades;
- replacing many overlapping point lights with three warm nave fills, three upper-vault fills, and three chandelier pools;
- reducing shelf and furniture visibility radii while keeping the far-wall library always visible as a compositional destination;
- retaining instanced books, shelf frames, architectural ribs, columns, and floor inlays.

## Acceptance

The approach, threshold, near-library, and middle-library segments pass the existing acceptance thresholds. The expanded geometry is materially heavier than the pre-art-pass scene, but measured frame pacing remains locked around one 60 Hz frame and the transition into the library no longer differs from deep travel.
