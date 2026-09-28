# Recovered Payment Page

This project was recovered from the deployed JavaScript and CSS source maps. The application source, CSS, and local SVG assets were restored; the original `package.json`, lockfile, backend, and deployment configuration were not present in the build artifact.

## Before using or deploying

The old production bundle exposed a PayArc bearer credential in public browser code. It has been removed from the recovered front end. Revoke/rotate that credential immediately.

The two PayArc requests now target a same-origin backend proxy:

- `POST /api/payarc/tokens`
- `POST /api/payarc/charges`

Implement those endpoints server-side. Store the replacement PayArc credential only in the backend's secret store/environment, enforce appropriate rate limits and bot protection, and never return the credential to the browser.

## Payment abuse controls

The included server verifies Cloudflare Turnstile before tokenization, limits payment attempts to five per session/IP in ten minutes, and locks a session/IP for one hour after three processor declines. The charge route requires the short-lived server-side verification state created by the token route, so a direct charge request cannot bypass Turnstile.

Set `REACT_APP_TURNSTILE_SITE_KEY` with the public Turnstile site key at build time. Set `TURNSTILE_SECRET_KEY` and `PAYARC_BEARER_TOKEN` only in the server environment. Do not put either secret in React code or a public `.env` file.

Run the production server with `npm run start:server` after configuring the environment. Use a shared store such as Redis for rate limits and locks when running more than one server instance; the included in-memory implementation is intended for a single instance.

## Run locally

```bash
npm install
npm start
```

The dependency versions are compatible recovery defaults, inferred from the compiled application; use the build only for comparison while validating the new project.
