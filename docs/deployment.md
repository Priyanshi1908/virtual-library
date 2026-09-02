# Production deployment

## Canonical deployment

| Setting | Value |
| --- | --- |
| Provider | Cloudflare Pages |
| Cloudflare account | `Priyanshideshpande19@gmail.com's Account` |
| Cloudflare account ID | `8e8d34fb7b682c2d53e85e8e4b71e7db` |
| Pages project | `virtual-library` |
| Production URL | <https://virtual-library.pages.dev> |
| GitHub repository | <https://github.com/Priyanshi1908/virtual-library> |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output | `dist/` |
| Deployment method | Direct upload with Wrangler |

The account ID is public routing metadata, not a credential. No Cloudflare token or OAuth credential belongs in this repository. Local Wrangler credentials remain outside the project.

## Safety rule

Before every deployment, run:

```bash
npm run cloudflare:whoami
```

Proceed only when Wrangler reports both:

- Account name: `Priyanshideshpande19@gmail.com's Account`
- Account ID: `8e8d34fb7b682c2d53e85e8e4b71e7db`

If either value differs, stop. Do not create another project and do not deploy from that account. The expected account is also pinned in `wrangler.jsonc` as an additional guardrail.

## Production release

Deploy the current committed `main` branch as follows:

```bash
git switch main
git pull --ff-only origin main
npm install
npm run check
npm run cloudflare:whoami
npm run deploy
```

`npm run deploy` rebuilds the app and uploads `dist/` to the existing `virtual-library` Pages project with `main` marked as the production branch. It intentionally includes the project name in the command instead of relying on a prompt.

## Verification

After Wrangler reports success:

```bash
curl -I https://virtual-library.pages.dev
```

Confirm an HTTP `200` response and open the canonical URL. The generated per-deployment hostname may contain a hash; it is only a preview identifier. Share `https://virtual-library.pages.dev` as the public URL.

## Current infrastructure note

The Pages project was created as a Wrangler direct-upload project and is not connected to a Git provider. Pushing to GitHub does not deploy automatically. Each production update requires `npm run deploy` after the code has been committed and pushed.
