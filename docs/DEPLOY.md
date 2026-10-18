# Deploying the web app on Vercel

Not yet verified by a real deployment. Follow the checks at the end.

1. Push the repository to GitHub.
2. In Vercel choose **Add New Project** and import the repository.
3. Set **Root Directory** to `web`.
4. Keep **Include source files outside of the Root Directory in the Build Step** turned on. The app reads `traits.json`, `traits.full.json`, the `sim/` workspace and the root `fonts/` folder.
5. Framework preset: Next.js. Build command: `npm run build`. Leave install as default; Vercel installs the npm workspaces from the repository root.
6. No environment variables are required. Wallet reads use the public Monad RPC and art comes from public IPFS gateways in the browser.
7. Deploy.

## Checks after the first deployment

- `https://YOUR-URL/api/chogs?ids=308` returns `CHOG #1769`.
- `https://YOUR-URL/api/standings?limit=3` returns 3 rows and `total` 1969 (the first call can take a few seconds).
- `/pick` shows the wallet panel, `/replay` plays a fight, `/arena` shows standings.
- Open the site on a real phone and in a wallet's built-in browser; connect a wallet on Monad.

## Known risks

- The public Monad RPC allows 50 requests per second per address. One wallet scan uses 6 requests, so normal use is far below that. If many players share one network and see "could not read every Chog", pause and retry, or set a private RPC.
- Art depends on public IPFS gateways. If every gateway is slow, players see the drawn placeholder.
