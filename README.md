# Eisha's Closet

A personal digital wardrobe. Every piece hangs on an interactive 3D rail you scroll
through; a stylist builds layered outfits from what you own; a dress-to-impress game
scores your looks; and a wishlist tracks what to buy next.

![the rail](docs/rail.png)

## Tabs

- **Closet** — a real clothing rail rendered in three.js. Drag to scroll, brush past a
  piece to set it swinging, click to open it. Filter by category or favourites, or
  switch to a grid.
- **Style** — pick a mood and the weather and get three outfits with styling notes
  (which side to tuck, what to layer under what, how to wear the jacket) plus shoes and
  accessories you can send to the wishlist. "Style it" on any piece builds looks around
  it. Saved looks live in the Lookbook.
- **Runway** — 14 themed rounds with a timer, three judges and a rank. Dress yourself
  from your own wardrobe, or hit "Style me".
- **Wishlist** — things to buy with price and link. Tick one off and add its photo
  straight to the closet.

## Where the garment images come from

Every piece is a cutout from the closet videos. For each one the pipeline:

1. differences each frame against a median "empty room" plate to find the moments a
   garment is held up and still;
2. picks the sharpest frame in each of those moments;
3. un-mirrors it — the front camera flips everything, so text read backwards;
4. segments the foreground, then erodes the mask to break the arm holding the hanger
   so the garment separates from the person;
5. white-balances it off the concrete wall, which cancels the warm desk lamp.

`src/source.json` records the provenance of each image.

## Cutting out photos you add

`src/cutout.js` removes the background client-side — nothing is uploaded and there is
no API key. It runs **u2netp** (4.6 MB) through `onnxruntime-web`, fetched once on the
first add and cached by the browser thereafter:

- the model is served from `public/models/`, the wasm runtime from `public/ort/`;
- single-threaded on purpose, so no COOP/COEP headers are needed on the host;
- the mask is cleaned up in JS — largest blob only, interior holes filled, rim
  feathered by the model's own confidence;
- if the model finds nothing salient (a grey garment flat on a wood floor is the
  usual culprit), it falls back to a border-colour prior, which is what rescues
  flat-lays; if that fails too, it knocks out a plain backdrop the old way.

Expect roughly 1-3 seconds a photo on a laptop.

## Run it

```bash
npm install
npm run dev
```

`npm run build` emits a static site to `dist/`. Vercel detects Vite automatically.

## Notes

- The starting wardrobe is `src/wardrobe.js`; the stylist's rules are `src/stylist.js`
  (colour pairing, silhouette balance, layering, weather). No API key needed.
- Pieces you add, favourites, saved looks and the wishlist are stored in the browser
  (IndexedDB), so they stay on the device you added them from.
