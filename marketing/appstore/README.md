# App Store assets

Everything App Store Connect needs for the product page, in the six app languages (it, en, es, fr, de, pt).

| Folder | What | Size | Where it goes in App Store Connect |
|---|---|---|---|
| `iphone-6.9/<lang>/01–08.png` | iPhone screenshots | 1320 × 2868 | Version › iPhone 6.9" Display |
| `ipad-13/<lang>/01–08.png` | iPad screenshots: the iPhone ones centred on a blurred copy | 2064 × 2752 | Version › iPad 13" Display |
| `creative/<lang>/header-3840x1646.png` | Product page header (21:9) | 3840 × 1646 | App Store › Creative assets › Product page header |
| `creative/<lang>/search-3840x2560.png` | Search results asset (3:2) | 3840 × 2560 | App Store › Creative assets › Search results |

All PNGs are RGB without alpha, as App Store Connect requires. Creative assets show on iOS 27 / iPadOS 27 and later; they sit next to the screenshots and do not replace them.

## Rebuild

1. Boot the iPhone simulator, run the dev build and start Metro (`npx expo start`).
2. `node marketing/appstore/capture.mjs [lang ...]` loads the demo transcript from `demo.json` in each language and saves the raw screens to `raw/<lang>/`.
3. `node marketing/appstore/render.mjs [screens|creative] [lang ...]` lays out the final images with headless Chrome.

Texts live in `copy.json` (screenshots) and at the top of `creative.html` (header and search results).
