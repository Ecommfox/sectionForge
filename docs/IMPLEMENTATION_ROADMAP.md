# SectionForge Implementation Roadmap

This roadmap is based on the current repository state. “In place” means code exists; it does not imply the flow has been verified against live accounts. The findings referenced by number are kept to the labels supplied for this roadmap; no additional finding details are inferred here.

## Current state

- An Express application and API routers are defined in `server/index.ts` and `server/routes/`; `npm start` serves the production build and API from Node.
- Vite mounts the same Express application for local API requests in `vite.config.js`.
- Builder client calls and entry adaptation are in `src/api/builder.ts`, `src/api/client.ts`, and `src/adapters/builderEntry.ts`.
- The Shopify preview endpoint in `vite.config.js` is a mock. `src/context/SettingsContext.tsx` also reports a successful Shopify connection using a timer rather than a remote check. `src/components/PreviewPanel.tsx` falls back to a simulated preview URL.
- `src/context/SettingsContext.tsx` writes the full settings object to `localStorage`; it includes fields for Builder private, Shopify Admin, and Anthropic API credentials. Do not put real private credentials into these fields until credential handling is changed.
- The UI exposes test-profile login. `src/context/AuthContext.tsx` stores the selected profile in browser storage; production authentication and role enforcement remain deferred in Phase 5.
- `package.json` defines `dev`, `build`, and `preview` scripts; no test script is currently defined.

## Dependency order

1. Complete the shared server/API foundation (Phase 1).
2. Verify and finish the live Builder flow (Phase 2).
3. Add Shopify connection and preview integration (Phase 3), with any write path limited to an explicitly selected non-live preview/development theme.
4. Complete credential handling and live connection verification (Phase 4). Keep real private credentials out of browser storage throughout; server-side secret handling is a prerequisite for using them.
5. Leave production authentication and roles deferred and unchanged (Phase 5).

## Phase 1 — Server layer: `middleware/` + `routes/` skeleton (keystone)

**Status:** The API now runs on Node/Express. Shared middleware and Express routers cover Builder and placeholder Shopify paths. Vite mounts the same Express application for local development.

### Tasks

- [x] Define the server API boundary and keep route modules under `server/routes/`; keep request-wide concerns in a new `server/middleware/` area rather than coupling them to Vite.
- [x] Keep a single Express application in `server/index.ts` and mount route modules through Express routers.
- [x] Use Axios for UI-to-app endpoint calls and server-side upstream endpoint requests. Centralize shared Axios configuration (base URL where applicable, timeout, and error normalization) in the API client/service layer; keep endpoint-specific request/response types next to their route clients.
- [x] Add only the shared middleware needed by the integrations: method/body validation, consistent JSON and error responses, no-store headers for credential-bearing responses, and bounded upstream request handling. Preserve the current structured `AppError` responses.
- [x] Keep upstream destinations fixed to the intended services. Validate request fields and do not accept arbitrary upstream URLs or forward arbitrary caller headers.
- [x] Add the Shopify route skeleton alongside the Builder routes, but do not treat a mock response or constructed URL as a successful live connection.
- [x] Keep Vite’s local adapter thin: it mounts the same Express application used by the Node server.
- [x] Confirm every API path has explicit method and unknown-path behavior, and that errors do not expose tokens, request bodies, or upstream response details.

### Acceptance / verification

- [x] Builder and Shopify routes pass through the same Express routers in development and the Node server.
- [x] Invalid JSON, invalid input, unsupported methods, upstream errors, and unknown API paths produce consistent structured errors.
- [x] Run `npm run build`; manually check the relevant API paths in local development because the repository currently has no test script.

## Phase 2 — Real Builder.io integration (closes finding #2)

**Status:** The live Builder read path is implemented: test connection, model listing, entry listing, and entry normalization are present. The remaining work is to verify the path with a real Builder space and close any gaps that verification exposes; do not treat sample fixtures as evidence of a live connection.

### Tasks

- [ ] With a permitted Builder **public** API key, verify `POST /api/builder/test-connection`, `POST /api/builder/models`, and `POST /api/builder/entries` against a real space and model.
- [ ] Confirm `src/App.tsx` uses returned models and entries on success, and that an empty model/entry response or failed request is distinguishable from the sample content in `src/fixtures/sampleHero.ts`.
- [ ] Compare real Builder payloads with `adaptBuilderEntry` in `src/adapters/builderEntry.ts`; handle any observed optional or variant fields without silently turning malformed results into convincing live data.
- [ ] Verify useful error states for invalid keys, inaccessible models, timeouts, malformed upstream responses, and an empty result. A failed request must not set the connection state to connected.
- [ ] Keep Content API access read-only in this phase. Do not send the optional Builder private key from the browser or add Admin API operations as part of validating this read flow.

### Acceptance / verification

- A valid key returns models and entries belonging to the configured Builder space; selecting an entry feeds the existing converter.
- An invalid key or upstream failure is reported as a failure, and no success state or stale “live” result masks it.
- Record a successful manual live-space check (without recording the key). Re-run `npm run build`.

## Phase 3 — Real Shopify integration (closes finding #3)

**Status:** Partially implemented. `POST /api/shopify/test-connection` now validates the configured store and already-issued Admin API token by retrieving the store's themes and identifying development-role themes. This is not an OAuth authorization-code/token exchange. Shopify preview writes remain unimplemented.

### Tasks

- [x] Implement the Shopify connection check behind `server/routes/` and the shared handler using a server-side Shopify API helper under `server/lib/`.
- [x] Add `POST /api/shopify/test-connection`. It validates the already-issued Admin API access token with Shopify's themes endpoint and retrieves development-role themes; no OAuth token exchange is performed.
- [x] Treat success as a successful Shopify API request and valid development-theme response. Return verified theme details to let the UI select a theme; never return or log the access token.
- [x] Use Axios for the Shopify endpoint call, with a bounded timeout and normalized errors. Restrict the destination to the configured `.myshopify.com` store and a fixed Shopify API path/version.
- [x] Keep the Admin API access token in transient client state only; strip legacy persisted private credentials from browser settings storage.
- [x] Verify an explicitly selected theme ID against the retrieved development-theme list; if multiple development themes are returned and none is selected, return the verified choices for explicit selection rather than choosing one implicitly.
- [ ] Implement a real connection check that verifies the explicitly selected theme exists and is accessible. Return a truthful result; do not use a timer or settings-only success message.
- [ ] Replace the Vite `/api/shopify/preview` mock with a local adapter to the same Shopify route used in deployment. Remove the success-shaped mock and the simulated-URL fallbacks from the preview flow; surface failures as failures.
- [ ] Define the preview write operation and required inputs before enabling it. Accept only the configured store and an explicit preview/development theme ID; verify that the theme belongs to that store and reject the live/published theme. Do not default to “active” or infer a writable theme.
- [ ] Scope Shopify writes to temporary preview content in that selected non-live theme only. Do not modify theme settings, publish themes, or write to a live theme. Require the appropriate Shopify scopes and fail closed if the target cannot be verified as non-live.
- [ ] Return a preview link based on the verified store/theme and actual result. Handle cleanup or expiry for temporary preview content so repeated tests do not leave unmanaged files behind.
- [ ] Keep all Shopify API calls server-side; browser code should call the app API and must never receive or send the Admin access token to Shopify directly.

### Acceptance / verification

- Connection success reflects an actual authenticated Shopify check and the selected theme; bad credentials, missing access, and an invalid theme fail clearly.
- Preview generation writes only to the explicitly selected non-live dev/preview theme. A missing theme ID, live theme target, failed write, or unavailable Shopify API never produces a fabricated successful preview URL.
- Verify against a development store and inspect the target theme before and after. Confirm the live theme was not changed. Re-run `npm run build`.

## Phase 4 — Secrets hygiene & real connection tests

**Status:** Needed before real private credentials are used. The current settings effect persists the entire `AppSettings` object to `localStorage`, and the UI exposes credential fields. This phase hardens that handling and verifies both integrations end-to-end.

### Tasks

- [ ] Separate non-secret preferences from credentials. Do not persist Shopify Admin tokens, Builder private keys, Anthropic API keys, or other private credentials in `localStorage`, `sessionStorage`, URLs, logs, or client-side bundles. In particular, do not serialize the full settings object from `src/context/SettingsContext.tsx`.
- [ ] Keep private credentials in server-side environment/configuration or a secure server-side secret store. Do not commit real credentials; if local environment files are introduced, ensure they are ignored by Git and provide only a non-secret example if needed.
- [ ] Remove hard-coded credential-like defaults and prefilled secret values. Use empty credential inputs and avoid echoing a supplied secret in responses or status messages.
- [ ] Minimize browser exposure: send credentials only over the app’s same-origin API when the chosen server-side configuration requires it; never log request bodies or return stored credentials to the browser. Clear credential input state when appropriate and avoid retaining secrets in client state longer than required.
- [ ] Review legacy browser settings for previously saved sensitive fields. Stop reading them into active settings, clear those fields from browser storage, and advise revoking/rotating any real credential that may have been entered or persisted.
- [ ] Verify Builder connection, model listing, and entry retrieval using a real permitted Builder space; verify Shopify connection and the preview write using a dedicated development store/theme.
- [ ] Check failure paths and operational diagnostics without exposing secret values: invalid/revoked credential, insufficient scopes, wrong store/theme, timeout, upstream error, and unavailable service.
- [ ] Verify that app build output, browser storage, browser network responses, and server logs contain no private credentials. Confirm public configuration (such as a Builder public API key, if retained client-side) is not confused with private credentials.

### Acceptance / verification

- No private credential is stored in browser storage, shipped in the client bundle, exposed in URLs, returned by an API, or written to logs.
- Real Builder and Shopify connection checks report accurate success/failure. Shopify preview remains restricted to the explicitly selected non-live theme.
- Run `npm run build`, then perform the live integration checks above using dedicated test accounts and without putting secret values in test output or documentation.

## Phase 5 — Auth & roles (deferred; keep unchanged)

**Status:** Deferred. Keep the existing test-profile behavior and auth implementation in `src/context/AuthContext.tsx` and `src/types/auth.ts` unchanged in this roadmap’s work. Do not present test-profile selection as production authentication or use it as an authorization boundary for the integrations.

No production login, role enforcement, permissions model, or auth-related refactor is included here. Revisit this phase only as a separately scoped task after the integration and credential-handling phases.
