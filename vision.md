# The Library — Project Vision

## What we are building

The Library is a premium, cinematic 3D web experience in which the environment itself is the interface. The visitor should feel that they are physically entering and exploring an enormous, ancient magical library—not looking at a conventional webpage with decorative Three.js objects.

The emotional target is **midnight, candlelight, old walnut, leather, parchment, stone and scholarly mystery**. It should feel comforting, grand and quietly magical: a place where someone would want to read for hours. It must never drift into horror, a bright modern library, or a visibly AI-generated collection of primitive 3D shapes.

The visual benchmark is the atmosphere and scale of a beloved old wizarding-school library, interpreted as an original environment rather than copying any protected architecture, props, names or insignia.

## Core experience

1. **Entrance:** A monumental pair of antique wooden doors fills the first composition. Stone architecture, brass candleholders and warm pools of light establish scale. The UI stays minimal: “The Library,” an Enter action and a discreet sound control.
2. **Threshold:** Scrolling opens the doors and drives a smooth cinematic camera through the entrance. Architecture passes close to camera to create parallax and physical depth.
3. **Grand hall:** A cathedral-scale nave, 10-metre double-sided bookcases, an 18-metre vaulted shell, repeated study courts, ladders, candles and a rose window reveal an immense reading room.
4. **Exploration:** The library is a real map, not one corridor. Visitors may choose the authored Guided Tour or enter Explore Freely for first-person movement through the nave and shelf districts. The guided route remains the default cinematic introduction.
5. **Discovery:** Visitors can search, approach shelves, move a rolling ladder, select rare books and open a tactile antique manuscript with convincing page movement.

## Entrance art direction

- The doors must read as monumental, tall and substantial, with a slightly wider-than-normal ceremonial proportion.
- Door material is aged, rough dark walnut—not metal, plastic, polished chocolate or orange-painted wood. Grain and wear should remain visible under warm directional light.
- Metal is reserved for blackened iron hinges and restrained aged-brass details.
- Orange/brass circles are used **only for the two central door handles**. Never add circular orange ornaments to sconces, hinges or the architecture.
- Hinges must visibly seat into thick side jambs. No dark gaps may make the doors appear detached from the frame.
- The entrance wall uses real stone PBR texture and must overscan every viewport edge. No black wedges or empty corners may appear at any aspect ratio or during parallax.
- Brass candleholders use the real Poly Haven model. They should be large enough to balance the monumental doors, centered on their shelves and free of procedural orange rings.
- The door height and width should communicate a high ceiling while remaining fully composed within a laptop viewport.
- Do not restore the boxed “L” monogram. Keep only the unboxed sound icon at the upper right.

## Visual language

- Palette: espresso, near-black walnut, aged mahogany, charcoal stone, muted parchment, subdued brass and deep amber flame.
- Lighting: warm and legible with soft shadow depth. Darkness should create atmosphere, never hide important geometry or interactions.
- Materials: rough, tactile, imperfect and physically believable. Prefer real PBR textures and authored models for hero objects.
- Typography: restrained editorial serif with sparse small-caps labels. The 3D environment remains dominant.
- Motion: slow, weighty and cinematic. Use smooth acceleration, deceleration, gentle rotation and pauses for appreciation.
- Magic: subtle dust, candle flicker and atmosphere only. Avoid blue/purple fantasy effects, excessive particles and game-like VFX.

## Interior map and scale

- The hall is approximately 40 world units wide and more than 80 units deep, with its vaulted apex around 23 units above the floor.
- The interior roof must never return to a two-slab A-frame or warehouse silhouette. Its target is a roughly 23-unit-high curved Gothic timber vault: warm old-plank infill, carved oak ribs and bosses, substantial chandeliers, and cool clerestory/rose-window light that keeps the upper volume readable.
- Full-height shelf islands are approximately 10.6 units tall with twelve book rows on both faces. Their size must remain legible against human-scale tables and chairs.
- Four longitudinal shelf lanes form two lateral districts around a broad central nave. Regular gaps between modules act as cross-aisles, allowing the camera to turn into a shelf district and return by another route.
- The scroll tour deliberately demonstrates the map: entrance nave, elevated layout reveal, left Classics aisle, Natural Philosophy table court, right Astronomy aisle, Arcane end district, then the rose-window manuscript reveal.
- Study tables belong only in authored reading courts within the broad nave. Shelf aisles and cross-aisles are circulation space and must stay clear. The globe is a nave landmark, and rolling ladders sit against shelf exteriors rather than inside walking lanes.
- Provisional materials use the existing stone masonry and dark wood textures. Their topology and placement are designed to accept later user-selected textures and authored furniture models without rebuilding the map.
- Generated implementation references and the extracted layout specification live under `docs/design-references/` and `docs/grand-library-world.md`.

## Asset principles

- Reuse high-quality open assets where they materially improve realism.
- Current entrance assets include Poly Haven’s Dark Wood mahogany/cherry PBR texture and Brass Candleholders model. Do not restore the former Wooden Garage Door texture; its riveted industrial character made the entrance feel fortified rather than scholarly.
- Procedural geometry is acceptable for architecture and supporting forms, but not when a hero prop becomes an obvious sphere, rectangle or torus.
- Keep texture resolution and model complexity appropriate for real-time web performance.
- The interior material vocabulary is now explicitly separated: monastery stone floor, medieval masonry walls, old-plank roof infill, dark-walnut shelves, worn-timber desks, brown leather seating and book spines, parchment paper, aged brass, and blackened iron.
- Interior hero landmarks include real brass candleholders, selected encyclopedia volumes, a binder notebook, Gothic reading chairs, a grandfather clock, framed paintings, a rolling wooden library stair, and a period globe. Full source and selection notes live in `public/assets/INTERIOR_ASSET_SOURCES.md`.
- The center of the nave stays architecturally clear. Do not restore the floating astronomy/astrolabe sculpture; astronomy should be communicated through books, globes, maps, and the rose window.

## Technical direction

- Stack: React, Vite, Three.js, React Three Fiber and Drei.
- Scroll position drives composed camera stops and continuous transitions.
- Free exploration is an optional parallel mode with WASD/arrow-key movement, mouse look, Shift for faster travel, touch controls and collision boundaries around shelves, tables and the hall shell. It must always offer a visible route back to the Guided Tour.
- Preserve responsive framing, reasonable GPU cost and a graceful loading state.
- Favor reusable scene components, instancing and modular architecture over thousands of unique meshes.
- Maintain interaction accessibility in the HTML overlay, including keyboard focus and clear labels.
- Keep the WebGL render scale stable at 0.85×; do not reintroduce adaptive DPR changes during scrolling.
- Batch repeated books and shelf structures with instancing. Do not return to one mesh and one material per book.
- Keep repeated entrance-door panels, rails, hinges, floor inlays and distant architectural ornaments GPU-instanced.
- Hide the interior while the entrance doors are closed and prewarm it during the loading screen. Shelf visibility may be distance-managed only beyond a generous fog-covered horizon.
- Keep all six authored reading tables visible throughout the interior journey; do not distance-cull them. Keep the entrance door and threshold present after crossing so looking backward never reveals a replacement wall.
- Smooth camera progress and door rotation toward scroll targets rather than binding transforms directly to raw wheel position.
- Render on demand: the GPU must stop drawing when the camera and doors are stationary, then wake only for scroll, pointer movement and settling motion.
- Reserve real-time point lights for hero sconces and major scene lighting. Repeated interior candle models should not each add another dynamic light.
- Keep dynamic shadow maps disabled unless a future measured performance budget proves they can return without harming scroll smoothness.
- Performance reference after the grand-library structure pass: p95 frame time remains 17.6–18.0 ms across the full journey, with zero interaction long tasks and zero frames above 20 ms until the deepest segment. The expanded world averages roughly 83–118 draw calls and 98k–124k triangles in its busiest visible segments.
- For performance comparisons, treat the smooth reference as normal library travel immediately after the threshold (roughly progress 0.26 onward), not only the final portion of the journey.

## Quality bar

Every meaningful visual change should be checked in the running browser at the entrance and, when relevant, deeper in the journey. Verify:

- no missing geometry, black viewport gaps or clipping;
- realistic material response under current lighting;
- clear scale and cinematic composition;
- candle and architectural proportions;
- smooth door opening and camera motion;
- readable, minimal UI;
- production build success and acceptable performance.
- no first-reveal shader compilation stall or visible canvas-resolution jump during scrolling;
- no table, globe, chair, ladder, or candleholder inside a shelf aisle or cross-aisle;
- no visible prop pop-in within the camera's readable depth range;
- the guided camera remains near human eye height and follows coherent walkable routes rather than teleporting between arbitrary compositions;

The goal is portfolio-quality immersion: cohesive enough that the visitor forgets the implementation and simply feels that the library exists.
