# Grand library structure pass

## Outcome

The interior has been rebuilt from a single central corridor into a navigable grand-library map. The first pass intentionally prioritizes scale, circulation, shelf topology, furniture zones, and lighting placement; final furniture assets, ornamental carving, genre plaques, and user-selected textures remain replaceable later passes.

## Implemented structure

- Hall footprint expanded to approximately 42 × 86 world units.
- Peaked stone shell and repeated vault ribs reach approximately 18 units above the floor.
- Thirty-eight modular, double-sided cases are approximately 10.6 units tall and contain twelve rows per face.
- Four longitudinal shelf lanes create two genuine aisle districts around the Great Nave.
- Module spacing provides repeated cross-passages rather than one uninterrupted tunnel.
- The camera now demonstrates the map: nave arrival, elevated layout reveal, left shelf aisle, table-court crossing, right shelf aisle, Arcane end district, and rose-window reveal.
- Six depth-banded study zones contain twenty-four long or compact reading tables, chairs, parchment, brass details, and real Poly Haven candleholder variants.
- Classics, Natural Philosophy, Astronomy, and Arcane Studies now exist as separate travel stops alongside the Great Nave.

## Reference-derived decisions

The generated hall reference established the shelf-to-human scale, high roof silhouette, long table clusters, and warm/cool lighting split. The generated map reference established the central nave, paired shelf courts, and cross-aisle loop. The study-zone reference established table density, clear aisle entrances, and the need for shelf crowns to remain above the camera by several human heights.

The complete extraction is in `grand-library-world.md`; full-size references are stored in `design-references/`.

## Final measured performance

Isolated 1280 × 720 benchmark, 1088 × 612 WebGL buffer:

| Segment | p95 frame time | Frames >20 ms | Interaction long tasks | Average draw calls | Average triangles |
| --- | ---: | ---: | ---: | ---: | ---: |
| Hero | 17.9 ms | 2.08% (one frame) | 0 | 62.24 | 46,418 |
| Approach | 17.7 ms | 0% | 0 | 118.76 | 105,937 |
| Threshold | 17.7 ms | 0% | 0 | 112.11 | 123,671 |
| Library near | 17.9 ms | 0% | 0 | 82.87 | 98,351 |
| Library mid | 18.0 ms | 0% | 0 | 91.10 | 104,664 |
| Library deep | 17.9 ms | 0.48% | 0 | 67.37 | 61,834 |

The expanded map retains the smoothness of the prior post-door reference. Scene preparation remains behind the loader; no interaction long tasks were recorded.

## Visual QA findings resolved during iteration

- Corrected reversed roof pitches that initially created a low black wedge.
- Removed oversized rectangular nave frames that flattened the architecture.
- Prevented the camera from crossing through shelf lanes by routing lateral turns through actual cross-aisle gaps.
- Added end landmarks and a deeper Arcane bay so aisle views no longer terminate in empty fog.
- Applied provisional walnut PBR maps to shelf framing and the existing masonry PBR to the shell.
- Added table-centred warm pools and cooler roof light so the larger hall remains readable.
- Moved ladders away from the camera route and delayed manuscript UI so it does not obscure Arcane navigation.

## Next asset pass

The structure is ready for user-selected final textures and authored models. Highest-value replacements are vintage study tables/chairs, shaded brass desk lamps, carved shelf crown ornaments, category plaques, and a more detailed gothic window surround. Those changes should preserve the map and measured performance budget.
