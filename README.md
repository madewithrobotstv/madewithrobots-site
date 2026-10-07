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
