# Eisha's Closet

A personal digital wardrobe: every piece hangs on a 3D rail you can scroll through, with a stylist that builds layered outfits, a dress-to-impress game played with your own clothes, and a wishlist.

## What's inside

- **Closet** – three.js rail of hangers. Drag, scroll, use arrow keys or the slider; tap the front piece for details. Filter by category or favourites, or switch to a grid.
- **OOTD** – pick a mood and the weather, get three outfits with styling notes (tucks, layering, sleeves) and finishing touches you can send to the wishlist. "Style it" on any piece builds looks around it. Saved looks live in the Lookbook.
- **Runway** – themed, timed dress-up rounds scored by three judges, plus free style and an auto-style button.
- **Add** – upload one photo or a batch; colour is guessed from the photo, you tag the rest.
- **Wishlist** – things to buy with price and link; tick them off and add a photo to the closet.

## Run it

```bash
npm install
npm run dev
```

`npm run build` outputs a static site to `dist/` (Vercel detects Vite automatically).

## Notes

- The starting wardrobe lives in `src/wardrobe.js`, with photos in `public/wardrobe/`.
- Pieces you add, favourites, saved looks and the wishlist are stored in the browser (IndexedDB), so they stay on the device you added them from.
- The stylist is rule-based (`src/stylist.js`) – colour pairing, silhouette balance, layering and weather – no API key needed.
