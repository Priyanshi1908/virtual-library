# Library correction pass

## Acceptance checks

- [x] Every study chair faces its table.
- [x] Each table uses either a banker lamp or a candleholder, never both; no placeholder box-books remain.
- [x] Candleholders read at the same visual scale as the furniture and every flame/glow stays visibly lit.
- [x] The globe is centered in the main corridor.
- [x] The rose window shows one stable animated cloudy moonlit scene with no rain, coplanar layers, or flicker.
- [x] The wall and vault above the rose window use the same masonry finish as the hall.
- [x] Four rolling ladders sit only in side corridors, rest on the floor, lean toward their assigned shelf face, and do not project into the central nave.
- [x] Looking back in free exploration shows a closed, fully dressed inner gate on a textured, illuminated entrance wall.
- [x] Side walls are far enough from shelves for a comfortable walkable aisle; wall dressing is flush.
- [x] The plan includes an asymmetric, usable reading bay without blocking circulation.
- [x] Shelf books vary in leather color, height, lean, bands, and occasional real encyclopedia volumes.
- [x] Shelf books remain visible in free exploration, do not distance-pop, and sit behind the shelf's front lip.
- [x] Production build, live browser walkthrough, mode-switch check, and segmented performance capture pass.

## Evidence log

### Live visual verification

- `?inspect=shelfDepth`: books are recessed inside the wooden shelf depth, remain dense, and no longer hang into the aisle.
- Actual home flow → **Explore freely**: the shelf architecture and book instances remain visible after the mode switch.
- `?inspect=ladderRightAisle` plus the other three ladder inspection views: every ladder leans toward a shelf and remains outside the main nave.
- `?inspect=entrance`: the return gate is closed, framed, and surrounded by the same textured wall family as the library; two lit sconces make the surface readable.
- `?inspect=entranceLeft` and `?inspect=entranceRight`: the library-facing gate now mirrors the full exterior wooden surround—deep jambs, stepped lintel, dentils, crest, capitals, bases, and continuous sill—with no exposed reveal gaps from either oblique approach.
- Table, window, nook, and aisle inspection views confirmed corrected prop orientation, alternating table dressing, centered globe, stable moon/cloud motion, and clear circulation.

### Performance verification

Automated 1280×720 segmented run on 2026-09-01 after the final shelf-geometry pass:

| Segment | Average frame | p95 frame | Long tasks during segment |
| --- | ---: | ---: | ---: |
| Hero | 19.02 ms | 19.0 ms | 1 startup task |
| Door approach | 19.86 ms | 26.0 ms | 0 |
| Threshold | 16.86 ms | 17.6 ms | 0 |
| Library near | 16.66 ms | 18.2 ms | 0 |
| Library mid | 16.67 ms | 18.2 ms | 0 |
| Library deep | 16.67 ms | 18.0 ms | 0 |

The formerly slow near-library segment now stays around a 60 fps frame budget with a p95 of 18.2 ms. The final shelf batching keeps all books visible without distance culling while reducing the hidden book faces and excessive per-shelf geometry that caused the earlier frame spike.

### Build

`npm run build` passes (599 modules transformed). Vite reports only the existing Three.js chunk-size advisory; there are no compilation errors.
