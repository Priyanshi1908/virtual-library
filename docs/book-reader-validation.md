# Book reader validation

Validated against the project EPUB regression fixture and the supplied vintage-book and page-flip references.

## Acceptance evidence

- Complete EPUB text: 2,639 of 2,639 normalized characters rendered, with the final sentence occurring exactly once.
- Pagination: every measured text block finishes above its visible leaf boundary; tested clearances were 41.7–138.4 px on content spreads.
- Page turning: restored a corner-led paper curl using the original page-flip interaction model. Page changes occur by page click, A/D or the explicit Previous/Next controls.
- Paint containment: the turning sheet is clipped to the physical book, preventing the mirrored page previously visible below the reader.
- Physical silhouette: shallow centre V, asymmetric deckled leaf edges, attached bottom paper block, and substantial left/right fore-edge stacks inside rectangular leather boards.
- Reader isolation: scroll remains locked at `0` while reading; Escape closes the reader and restores the document state.
- Runtime: no browser console errors during the validated interaction flow.
- Production: `npm run build` passes.

## Regression fixture

`tests/fixtures/reader-layout-regression.epub`

The fixture deliberately describes the expected constraints in its prose so missing, duplicated, or clipped text is easy to detect both visually and programmatically.
