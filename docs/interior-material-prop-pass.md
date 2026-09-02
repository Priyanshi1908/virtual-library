# Interior material and prop pass

## Visual diagnosis

The previous scene had sufficient scale but not sufficient material separation. The same dark-brown response covered the shelves, tables, chairs, ceiling, and floor, while book geometry read as undifferentiated blocks. The central astronomy form also looked like a procedural demo object and interrupted the nave.

## Implemented direction

- Monastery stone slabs now anchor the floor; timber inlays and oxblood runners clarify the navigable map.
- Medieval masonry and old-plank ceiling textures separate the architectural shell from the walnut shelving.
- Tall shelf ranges retain instanced geometry for performance, but now use dark-wood PBR maps, leather-normal book spines, restrained gold bands, fluted end pilasters, capitals, and decorated range end-caps.
- Tables use worn timber PBR maps, aprons, grounded legs, leather seating, green-shaded banker's lamps, occasional real notebooks, and selected encyclopedia volumes.
- Landmark props now include real CC0 Gothic chairs, a grandfather clock, framed paintings, brass candleholders, a rolling library stair, and an antique cartographic globe.
- The procedural center astronomy model and its collision volume were removed.
- The one crosswise shelf that blocked a visually open route was removed; shelf collision envelopes were tightened to match visible forms and improve cross-aisle travel.
- Lighting now combines warm task pools below with a low-intensity cool upper fill so roof height remains legible.
- The former two-plane pitched roof has been replaced by a 23-unit curved Gothic vault with transverse ribs, crossed diagonal bay ribs, longitudinal tracery, ceiling bosses, and three suspended candle chandeliers.
- Plain oxblood debug strips have been replaced by a worn patterned scholarly runner texture.

## Performance constraints

- Repeated books and architecture remain instanced.
- Hero GLTF props are used sparsely and at 1K texture resolution.
- Full encyclopedia and furniture sets are not duplicated across every table.
- Dynamic shadows remain disabled on repeated props.
- Distant shelf and table zones retain depth culling.
- The accepted measured pass is documented in `docs/interior-transformation-performance.md`.

## Reference targets

The implementation references are stored in `docs/design-references/`. They establish three complementary targets: a grand central nave, a close shelf aisle, and an intimate reading bay. They are design targets, not background images used in the website.
