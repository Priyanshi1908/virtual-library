# Library performance methodology

## Objective

Measure the entrance journey and compare it with the library travel that begins immediately after the visitor crosses the doors. Visual quality and scene continuity are acceptance requirements; lower renderer counts do not count as an improvement if geometry disappears, loads late, or exposes blank space.

## Reproducible run

Use the development URL with `?perf=1&autorun=1`. After the loading sequence, the benchmark moves from progress `0` to `1` at a fixed linear rate over 14 seconds. Metrics are captured inside the React Three Fiber render loop so browser-control latency does not determine the results.

Segments:

| Segment | Progress | Meaning |
| --- | ---: | --- |
| Hero | 0.00–0.06 | Stationary entrance and first movement |
| Approach | 0.06–0.15 | Camera approaches while doors open |
| Threshold | 0.15–0.26 | Camera crosses the doorway |
| Library near | 0.26–0.50 | Smooth reference immediately inside |
| Library mid | 0.50–0.75 | Continued interior travel |
| Library deep | 0.75–1.00 | Final interior travel |

## Captured metrics

- frame-time average, p50, p95, p99, and maximum;
- ratio of frames above 20 ms and above 34 ms;
- draw-call and triangle averages and maxima;
- camera speed average, p95, and maximum;
- scroll-event-to-render latency average, p95, and maximum;
- long-task count, total duration, and maximum duration;
- JavaScript heap samples when supported;
- a final visible mesh and light census (kept out of the per-frame hot path so the probe does not distort its own benchmark);
- renderer geometry, texture, and shader-program memory counts;
- resource count, transfer size, decoded size, and slowest resource duration.

## Acceptance thresholds

The hero, approach, and threshold must satisfy all of the following against `libraryNear`:

1. p95 frame time no more than 2 ms slower.
2. p99 frame time no more than 4 ms slower.
3. Frames above 20 ms no more than five percentage points higher.
4. Frames above 34 ms below 1%.
5. Scroll-to-render p95 at or below 20 ms.
6. No interaction long task longer than 50 ms.
7. No missing walls, door parts, late object reveal, black gaps, or blank threshold frames.
8. Camera motion must remain visually continuous and must not jump farther per input step than the reference travel.

## Evidence files

- `performance-baseline.md`: measurements before the recovery pass.
- `performance-final.md`: comparable measurements after fixes, including deltas and remaining constraints.
