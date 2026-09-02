# Interior asset sources

All downloaded Poly Haven assets below are released under CC0. The 1K variants were deliberately selected to keep the interactive scene responsive.

| Local asset | Source | Use |
| --- | --- | --- |
| `models/brass-candleholders` | https://polyhaven.com/a/brass_candleholders | Entrance and interior candle hardware |
| `models/binder-notebook` | https://polyhaven.com/a/binder_notebook | Occasional hero notebook on reading tables |
| `models/encyclopedia-set` | https://polyhaven.com/a/book_encyclopedia_set_01 | Three-volume hero stacks, not repeated shelf filler |
| `models/grandfather-clock` | https://polyhaven.com/a/vintage_grandfather_clock_01 | Far-hall landmark |
| `models/fancy-picture-frame` | https://polyhaven.com/a/fancy_picture_frame_02 | Far-wall paintings |
| `textures/dark-wood` | https://polyhaven.com/a/dark_wood | Tall bookcase structure |
| `textures/medieval-wall-02` | https://polyhaven.com/a/medieval_wall_02 | Interior masonry |
| `textures/monastery-stone-floor` | https://polyhaven.com/a/monastery_stone_floor | Nave and aisle floor |
| `textures/wood-table-worn` | https://polyhaven.com/a/wood_table_worn | Reading tables |
| `textures/brown-leather` | https://polyhaven.com/a/brown_leather | Book-spine and chair upholstery response |

`textures/antique-globe/antique-world-map.png` and `textures/antique-runner/antique-library-runner.png` are original generated project assets made for this library. They are used as the flat albedo surfaces of the period globe and worn aisle rugs.

## Evaluated but not imported

- The supplied Sketchfab dusty bookshelf was rejected because the current instanced twelve-row shelf architecture is taller, lighter at runtime, and better fits the hall's map.
- The supplied PSX book was rejected because its deliberately low-resolution style conflicts with the realism target.
- The supplied Sketchfab lamps, Gothic table, chair, and clock were evaluated, but their download flow requires attribution/account handling. CC0 Poly Haven equivalents and a lightweight custom banker's lamp were used instead.
- Poly Haven `old_planks_02` supplies the warm timber finish used across the current vaulted ceiling surfaces.

## Removed after implementation audit

- The unused `WoodenChair_01` download was removed because the live library uses its optimized procedural chair geometry.
- The discarded reader-hand GLBs and raster prototype were removed after the reader moved to the hand-free presentation.
