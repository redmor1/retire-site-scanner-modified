# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # Compile TypeScript to dist/
npm run watch        # Watch mode compilation
npm run typecheck    # Type-check without emitting
npm run lint         # ESLint with auto-fix
npm run check        # lint + typecheck
npm test             # Run all tests (node:test via tsx)
```

Run a single test file:
```bash
tsx --test tests/schematest.ts
```

Run from source (dev):
```bash
npm run start -- <url> [-v] [--sbom]
```

## Architecture

The scanner uses Puppeteer to load a target URL in a headless browser, intercepts all JavaScript responses, then runs each script through the retire.js vulnerability database.

**Data flow:**

1. `index.ts` — CLI entry point. Parses args, wires callbacks, calls `browser.load()`.
2. `browser.ts` — Launches Puppeteer, registers `page.on("response")` to capture JS payloads. Retries failed body reads via `request.ts`. Detects third-party domains via `suffix-list.ts` and reports them as services.
3. `retireWrapper.ts` — Fetches the retire.js repo JSON from GitHub at startup (`jsrepository-v3.json`). Exposes a `Scanner` object with four methods: `scanUri`, `scanContent`, `runFuncs`, `scanUrlBackdoored`. The `runFuncs` method evaluates JS expressions in the live browser page to detect libraries by their global variables.
4. `sourceMapResolver.ts` — For each JS URL, attempts to fetch `.map`/`.js.map` files and unpacks them via `source-map` to expose original source for deeper scanning.
5. `log.ts` — Dual-mode logger. Default mode (`consoleLogger`) prints to stdout/stderr. When `--sbom` is passed, `useJson()` switches to `jsonLogger`, which collects all results and emits a CycloneDX 1.4 JSON document on `close()`. `--sbom-file` writes that document to a file instead of (or in addition to) stdout.

**Key design details:**

- The retire.js vulnerability DB is always fetched live from GitHub — no local copy bundled.
- Backdoor detection (`scanUrlBackdoored`) uses regex patterns from the `backdoored` key in the repo JSON to flag known supply-chain compromise URLs.
- The `suffix-list.ts` module is used to determine the registrable domain for service tracking (distinguishing first-party from third-party requests).
- CycloneDX output (`convertToCycloneDX` in `log.ts`) includes components, vulnerabilities, and services sections. Tests validate the output against `bom-1.4.schema.json`.

**Output modes:**
- Default: human-readable console output; warnings go to stderr, info to stdout.
- `--sbom`: machine-readable CycloneDX JSON on stdout; all log messages redirected to stderr.
- `--sbom-file <path>`: same JSON written to a file; console output resumes normally.
