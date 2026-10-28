# Made With Robots

Speculative and experimental work — made by humans with AI.

**Site:** [madewithrobots.tv](https://madewithrobots.tv) (deployed via Cloudflare Pages)
**Contact:** [madewithrobots.tv@gmail.com](mailto:madewithrobots.tv@gmail.com)

## Stack

- Static site. `assets/` holds logos and imagery.
- No build step. Cloudflare Pages serves the repo root directly.

## Deploys

Cloudflare Pages watches the `main` branch. No build command, output directory = `/`.

## Repo layout

```
.
├── index.html         Landing page
├── assets/
│   └── logo.png       Primary logo
└── README.md
```

## Cinematic homepage

The homepage runs the TV scene directly, with dial links to Work and Pitch Decks, visible navigation, loading and static fallback states, and reduced-motion support.

Source: `assets/homepage/scene.js`. Static model, logo and lossless baked material maps are under `assets/homepage/`. To rebuild the committed production JavaScript after source edits, run `node scripts/build-homepage.mjs` from the repository root (Node.js and npm required). This uses esbuild 0.25.12, writes a content-hashed bundle and updates the HTML references. Cloudflare Pages still needs no build command.

The model, maps, logo and production bundle have versioned filenames for caching. `_headers` gives scene assets long caching while requiring homepage revalidation. Material maps and tape lettering are generated ahead of time, not on each visit. Renderer setup, model, logo and texture downloads run in parallel.
