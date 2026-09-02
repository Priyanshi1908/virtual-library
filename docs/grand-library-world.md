# Grand library interior — world specification

This is the implementation source of truth for the interior redesign. It translates three generated reference views into a modular real-time scene rather than attempting to reproduce their surface detail literally.

## Reference set

- `design-references/grand-library-hall.png` — human-height arrival view and scale target.
- `design-references/grand-library-map.png` — complete spatial organization and route logic.
- `design-references/grand-library-study-zone.png` — table density, shelf proportions, aisle entrances, and lighting layers.

## Extracted spatial grammar

### Scale

- Human eye height remains approximately 1.8–2.4 world units.
- Primary shelf cases should read as 9–11 units tall: roughly four to five times camera height.
- The spring line of the stone vault begins above the shelf crowns; the ceiling apex should read at 16–18 units.
- The hall expands to approximately 36 units across and 70–80 units deep.
- Furniture stays recognizably human scale so the shelves and ceiling feel genuinely colossal.

### Map

The library is not a single hallway. It uses three route types:

1. **Central nave:** a broad orientation route from the entrance to the rose window, interrupted by landmarks and long study-table clusters.
2. **Shelf districts:** paired longitudinal shelf lanes on both sides. Each district contains tall, double-sided shelf islands with walkable aisles between them.
3. **Cross-aisles:** openings every one or two shelf modules reconnect the side districts to the central nave and create alternate loops.

The fixed scroll-camera tour should demonstrate this structure by starting in the nave, turning into a left shelf aisle, returning through a cross-aisle, entering a right district, and finally rising back into the nave for the rose-window reveal.

### Genre districts

Five visually legible areas occupy successive depth bands:

- Classics near the entrance;
- Romance in the first left reading court;
- Natural Philosophy in the first right reading court;
- Astronomy deeper in the hall near the astrolabe;
- Arcane Studies nearest the rose window.

Temporary plaques and color accents may distinguish these zones. Final textures and signage can be replaced later without changing the map.

### Shelves

- Dark aged walnut, nearly matte rather than metallic.
- Ten or eleven book rows per full-height case.
- Deep cornice, plinth, vertical stiles, and visible shelf rhythm.
- Double-sided islands where visitors move between shelf lanes.
- Wall cases and island cases share a modular construction system.
- Rolling ladders appear as occasional landmarks, not on every case.

### Tables and props

- Central table clusters occur repeatedly instead of one isolated desk.
- Side reading courts contain smaller table pairs and clear walking space.
- Tables use substantial tops, turned-leg silhouettes, chairs, scattered book forms, brass details, and large candleholders.
- The first structural pass may use existing procedural furniture and Poly Haven candles; photoreal table models are a later asset pass.

## Lighting extraction

The references use three distinct layers:

1. warm local pools around tables and shelf ends;
2. restrained amber ambient bounce that keeps wood and stone readable;
3. cool, high moonlight at clerestory and rose-window height to reveal the ceiling volume.

Black voids are not part of the target. Shadows remain deep but retain material information. Candle point lights should be sparse and strategic; emissive-looking flames and non-shadow-casting fill lights provide the apparent density without multiplying expensive real-time lights.

## Camera and composition

- Use a wide architectural perspective without fisheye distortion.
- Keep nearby tables or shelf ends in the foreground to establish human scale.
- Aim upward during key transitions so the ceiling height registers.
- Avoid a permanently centred vanishing point; route turns should reveal new districts.
- At least one view must make several possible aisle entrances visible simultaneously.

## Performance constraints

- Books, shelf framing, repeated floor details, chairs, candles, and ceiling ribs must be instanced or aggressively grouped.
- Depth culling follows the camera and retains one depth band ahead to avoid pop-in.
- Existing demand rendering and scene preparation remain intact.
- The redesigned post-door journey must retain zero interaction long tasks and target a p95 frame time within 2 ms of the current 17.6 ms reference at 1280 × 720.

## First-pass acceptance

- The ceiling visibly exceeds the shelf crowns by several camera heights.
- Shelves dominate the vertical composition.
- The camera enters at least one true shelf aisle and crosses between districts.
- Multiple study-table clusters are visible at different depths.
- The central nave is still useful for orientation but is no longer the only apparent route.
- Warm candle pools and cool upper light create readable depth everywhere.
- No late-loading blank geometry or reintroduced entrance lag.
