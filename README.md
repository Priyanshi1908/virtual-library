# virtual-library

An immersive dark academia 3D library built with React, Vite, React Three Fiber, and Three.js.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. `npm start` is available as an alias for the development server.

## Production build

```bash
npm run build
npm run preview
```

The optimized static site is written to `dist/`. Run `npm run check` to verify that a production build completes.

## Deploy to Cloudflare Pages

The production site is [virtual-library.pages.dev](https://virtual-library.pages.dev). It is a Wrangler direct-upload Cloudflare Pages project, so GitHub pushes do not deploy automatically.

Authenticate Wrangler with the intended Cloudflare account, verify it, then deploy:

```bash
npm run cloudflare:whoami
npm run deploy
```

The deploy script builds the app and publishes `dist/` to the Cloudflare Pages project named `virtual-library` on the `main` branch.

The intended account, project identifiers, safety checks, and complete release procedure are recorded in [docs/deployment.md](docs/deployment.md). Do not deploy when `npm run cloudflare:whoami` reports an account different from the one documented there.
