# visual-qa — agent guide

Purpose: a local, disposable browser runner that captures screenshots and layout diagnostics of allowlisted public HipDiscovery pages. Status: active. Machine: either. This repository is public: treat every committed byte and every output as shareable.
Branch: master. Commit and push directly; no force-push; no Co-Authored-By trailer; no GitHub Actions.

Read `SECURITY.md` before changing what the runner may fetch or record.

## Run, test, deploy
- Run locally: `npm ci --ignore-scripts --no-audit --no-fund`, then `npm run qa -- <request.json>`. It uses an installed Chromium-family browser found by `qa/browser-executable.mjs`; never download another browser.
- Required gate before every commit: `npm test` (syntax and policy, journey contracts, agent policy, file-size budget) and `git diff --check`. `npm run qa` is a separate real-browser gate.
- Deploy: none. Nothing is hosted; output goes to ignored `out/`.

## Production and destructive jobs
- `npm run qa` replaces `out/` once the request and deployment probes pass. Copy any evidence you still need out of `out/` first, and never run two requests in one checkout at the same time.

## Cross-repo contracts (do not break)
- Inbound: Hip-MCP (`hipdiscovery/Hip-MCP`) may launch this runner as a plain local process. It must never pass Hip-MCP tokens, private files, logged-in browser profiles or desktop control into it.
- Inbound: other repos' QA requests rely on the targets, viewports and probes in `qa/targets.json`.
- Outbound: deployment probes compare live bytes with the source repo's Git blob SHA (not raw SHA-1 or SHA-256), using that repo's line endings.

## Metered resources
None.

## Secrets (names only)
None. Requests and outputs must never contain credentials, cookies, headers, signed URLs or real profiles.

## Do not touch
- `qa/targets.json` guards: HTTPS host allowlists, literal-IP and DNS-resolved private-network blocking, GET/HEAD only, bounded responses, blocked service workers. Never add an arbitrary URL, header or session escape hatch.
- The exact, integrity-locked `playwright-core` pin.
- The no-growth size baseline on `qa/run.mjs`: extract modules instead of extending it.

## Landmines
- Interactive changes need exhaustive impacted-state coverage: every changed control and its loading, error, expanded and selected states at each affected breakpoint. Nested controls and their child states are part of the same required QA pass.
- Look at every screenshot. A passing run or quiet diagnostics is not visual approval; `qa/visual-diff-review.mjs` compares file bytes only.
- `qa/diagnostic-policy.mjs` excuses horizontal scroll only inside a contained overflow ancestor. Never blanket-ignore classes or offscreen controls.
- Request limits are 1 to 4 probes of 5 MiB each, 1 to 20 journeys and 100 steps; the schema has no tracing field, so do not invent one.
- Screenshots cannot verify native controls or audio; report those surfaces as untested.

Shared contract: hipdiscovery/claude-instructions/shared/AGENT-CONTRACT.md @ 2026-11-16
System map and shared ceilings: hipdiscovery/claude-instructions/SYSTEM.md
