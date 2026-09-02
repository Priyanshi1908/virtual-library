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

Authenticate Wrangler with the intended Cloudflare account, verify it, then deploy:

```bash
npm run cloudflare:whoami
npm run deploy
```

The deploy script builds the app and publishes `dist/` to the Cloudflare Pages project named `virtual-library` on the `main` branch.
