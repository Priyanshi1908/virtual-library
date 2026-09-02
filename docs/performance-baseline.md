# Performance baseline — degraded entrance build

Captured 1 September 2026 at a 1280 × 720 CSS viewport and 1088 × 612 WebGL buffer. The benchmark used `?perf=1&autorun=1` and traversed the full journey linearly over 14 seconds.

## Executive finding

The stark difference is caused by main-thread stalls before and during the threshold—not by steady-state frame rendering inside the library.

- Hero: 9 long tasks, 2,683 ms total, 620 ms maximum.
- Approach: 6 long tasks, 1,493 ms total, 365 ms maximum.
- Threshold: 6 long tasks, 1,385 ms total, 368 ms maximum.
- Library near, mid, and deep: 0 long tasks.

This falsifies the earlier working assumption that draw calls were the primary cause. Renderer counts were reduced, but late scene/shader preparation still blocks the main thread. The visible blank threshold and objects appearing late are consistent with the same lifecycle error.

## Segment metrics

| Metric | Hero | Approach | Threshold | Library near | Library mid | Library deep |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Captured continuous frames* | 0 | 0 | 5 | 202 | 210 | 320 |
| Frame average (ms) | — | — | 14.98 | 16.66 | 16.67 | 16.67 |
| Frame p95 (ms) | — | — | 17.90 | 17.90 | 17.90 | 18.20 |
| Frame p99 (ms) | — | — | 17.90 | 18.90 | 19.20 | 22.10 |
| Frame maximum (ms) | — | — | 17.90 | 21.90 | 23.50 | 24.60 |
| Frames over 20 ms | — | — | 0% | 0.50% | 0.95% | 1.56% |
| Frames over 34 ms | — | — | 0% | 0% | 0% | 0% |
| Draw calls average | 91.11 | 48.20 | 58.91 | 66.13 | 53.28 | 23.83 |
| Draw calls maximum | 159 | 56 | 79 | 81 | 65 | 39 |
| Triangles average | 82,895 | 72,987 | 28,461 | 33,284 | 24,091 | 5,721 |
| Triangles maximum | 106,894 | 76,430 | 38,234 | 43,740 | 33,312 | 10,740 |
| Camera speed average | — | — | 3.552 | 4.797 | 5.869 | 2.882 |
| Camera speed p95 | — | — | 14.061 | 8.867 | 9.684 | 7.640 |
| Camera speed maximum | — | — | 14.061 | 10.382 | 19.642 | 14.549 |
| Scroll-to-render p95 (ms) | 0.20 | 0.60 | 0.50 | 0.60 | 0.60 | 0.60 |
| Long tasks | 9 | 6 | 6 | 0 | 0 | 0 |
| Long-task total (ms) | 2,683 | 1,493 | 1,385 | 0 | 0 | 0 |
| Long-task maximum (ms) | 620 | 365 | 368 | 0 | 0 | 0 |
| Heap average (MB) | 37.40 | 41.00 | 43.11 | 43.61 | 46.84 | 51.27 |
| Heap maximum (MB) | 44.17 | 44.47 | 45.78 | 53.87 | 62.08 | 64.64 |
| Visible meshes average | 100.67 | 47.00 | 74.67 | 89.54 | 106.71 | 84.10 |
| Visible lights average | 11.00 | 10.00 | 11.33 | 10.00 | 10.00 | 10.00 |

\* The initial harness excluded intervals above 120 ms to avoid counting demand-render idle gaps. During the automated run there are no intentional idle gaps, so this excluded the exact stalled frames in the hero and approach. Long-task timing still captures those stalls. The corrected harness will separate loading from interaction and retain active intervals up to 1,000 ms.

## Renderer and asset state

| Metric | Value |
| --- | ---: |
| Geometries | 99 |
| Textures | 33 |
| Shader programs | 43 |
| Resource requests | 50 |
| Decoded resource size | 37,174.59 KB |
| Recorded transfer size | 9.38 KB (warm local cache) |
| Slowest resource | 25.10 ms |

Network transfer is not the interaction bottleneck in this warm-cache run. The 37 MB decoded asset footprint is material, but the decisive evidence is the disappearance of long tasks once the library travel is underway.

## Visual baseline failure

The entrance no longer matches the approved composition. The threshold exposes blank architecture and visibly delayed scene detail. Door level-of-detail changes remove important panels while those panels are still prominent. These are regressions and must be restored before performance can be accepted.

## Baseline conclusion

**Proven:** entrance and threshold long tasks are unique to the lagging portion; steady library travel does not exhibit them.

**Inferred:** shaders/material variants and scene states are being prepared after interaction starts, while visibility shortcuts cause the blank threshold.

**Unresolved before the next test:** how much of the stall comes from shader compilation versus first-time geometry/material upload. The next benchmark will record shader-program growth by segment and separate loading-phase tasks from interaction tasks.
