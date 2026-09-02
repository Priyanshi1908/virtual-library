# Interior second-pass overhaul

This document records the visual and interaction defects shown in the 1 September review screenshots and turns each one into a falsifiable acceptance check.

## 1. Walkable layout

**Observed:** tables, the globe, and the rolling ladder occupied shelf corridors. Some visible openings were not traversable.

**Goal:** reserve shelf aisles and cross-aisles for circulation. Reading furniture belongs in six main-nave positions across three courts. The globe is a nave landmark with walk-around clearance. The rolling ladder rests against the exterior face of a shelf.

**Acceptance:** no shelf or cross-aisle contains a table; collision bounds match visible furniture; the guided camera never passes through geometry; free exploration can traverse both side districts and return to the nave.

## 2. Architectural ceiling and moonlight

**Observed:** the upper volume read as a black warehouse roof with sparse utility fixtures and floating candle models.

**Goal:** retain the liked height while changing the material and silhouette read to warm Gothic timber. Use old-plank PBR infill, carved oak ribs, eight-arm chandeliers, clerestory windows, a large tracery window, and one controlled cool moonlight shaft.

**Acceptance:** the ceiling remains readable from floor level; it is brown timber rather than black void; chandeliers have an intentional chain/arm/flame structure; no complete candleholder model floats at ceiling height.

## 3. Books and reading props

**Observed:** shelves were filled with identical black blocks; table books were pale rectangles.

**Goal:** vary leather colors across oxblood, mahogany, forest green, navy, tan, and near-black. Vary height, depth, gaps, and lean. Add restrained gold bands and title-like spine marks. Use the real binder and encyclopedia assets plus leather book stacks on tables.

**Acceptance:** adjacent rows do not repeat one obvious color rhythm; some books lean or recede; gold details remain sparse; no white placeholder slabs remain on tables.

## 4. Furniture scale and lighting

**Observed:** chairs looked miniature and visually unrelated to the tables. Lamps and candles did not appear to illuminate their surroundings.

**Goal:** use full-size chairs with dark oxblood upholstery, human-scale placement, and warm local pools from selected table candles and wall sconces. Keep the number of real-time lights controlled.

**Acceptance:** chair seats align with tabletop height; chairs do not overlap shelves; at least one warm source visibly anchors each reading court without flattening the entire hall.

## 5. Walls, portraits, and continuity

**Observed:** walls were blank and the entrance disappeared when viewed from inside.

**Goal:** mount original aged scholar portraits in carved frames, add clerestory rhythm and warm sconces, and keep the entrance architecture present after the threshold transition.

**Acceptance:** the far wall has a readable clock, portraits, and tracery window; side walls include framed art and high windows; looking back shows the open entrance rather than a replacement wall.

## 6. Prop continuity and popping

**Observed:** tables appeared only when the camera approached them.

**Goal:** reduce the furniture count to six authored tables and keep all of them mounted. Extend shelf visibility beyond the readable fog horizon.

**Acceptance:** a table visible in the distance remains present throughout approach; shelf changes are hidden by distance/fog; no blank intermediate scene appears after entering.

## 7. Guided camera

**Observed:** the scroll route jumped between unrelated angles and repeatedly looked at blank walls or the roof.

**Goal:** use the same near-2.05-unit eye height as free exploration. Move through the entrance, down the nave, into the left aisle, across a real cross-aisle, down the right aisle, and back to the final window.

**Acceptance:** every segment corresponds to a walkable route; horizontal rotations occur at cross-aisles; vertical movement is reserved for the final architectural reveal; scroll smoothing does not introduce sudden position changes.

## 8. Later asymmetric-map phase

This is deliberately sequenced after the defects above. Break the current axial symmetry with offset reading bays, one wider and one narrower shelf district, short dead-end alcoves, an angled archive room, and distinct landmarks. Preserve orientation through the central runner and entrance/window axis. The later change must not regress walkability or measured frame pacing.

## Comparison references

- `docs/design-references/interior-art-target-grand-nave.png`
- `docs/design-references/interior-art-target-shelf-aisle.png`
- `docs/design-references/interior-art-target-reading-bay.png`
- User review screenshots from 1 September 2026
