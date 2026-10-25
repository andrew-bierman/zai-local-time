---
title: Local reset times for z.ai
date: 2026-10-24
type: feat
---

## Goal Capsule

Build a small TypeScript Tampermonkey userscript in a new repository under Code. Preserve the website's content and add local-time annotations beside Coding Plan reset times. LFG owns implementation, verification, review and local commits; absent a remote, finish locally.

## Product Contract

- R1. Add a readable local date, time and zone beside UTC+8 reset timestamps, preserving original text and nodes.
- R2. Handle dated and time-only reset values, initial loading and subsequent page updates without duplicate or stale annotations.
- R3. Leave refresh times, unrelated dates, editable content and unsupported/invalid dates alone.
- R4. Ship TypeScript source and a ready-to-paste JavaScript userscript with installation instructions. No runtime dependencies, network calls, credential access, settings or promotional features.

## Planning Contract

- KTD1. Tampermonkey userscript rather than unpacked Chrome extension. session-settled: user-directed; avoids the requested sideload workflow.
- KTD2. Additive annotations; never rewrite or replace site text/nodes. session-settled: user-directed; preserves the original display.
- KTD3. Use Bun and vite-plugin-monkey, as requested during implementation, with Bun tests and jsdom exercising the generated artifact. Metadata lives in vite.config.ts.
- Source assumption: reset labels identify UTC+8 values; Last refresh time is already local. Evidence: https://github.com/soaresfellipe/zai-local-time and its author's https://fellipesoares.com.br/zai-local-time/.
- Recognize English Reset Time labels and full YYYY-MM-DD HH:mm[:ss] (also slash/dot date separators) or time-only HH:mm[:ss]. A time-only value means its next occurrence in Singapore, including midnight rollover. Do not guess yearless dates or unlabeled times.
- Observe page mutations with a coalesced scan. Disconnect during our own annotation writes. Keep a mapping from source text nodes to annotations, updating/removing annotations after React changes. Match z.ai broadly enough for SPA entry from another route; scan only within /manage-apikey/.

## Implementation Units

### U1. Userscript, build and verification

Files: src/zai-local-time.user.ts, dist/zai-local-time.user.js, package.json, bun.lock, vite.config.ts, tsconfig.json, test/userscript.test.mjs, README.md, .gitignore.
One cohesive unit: build configuration, generated artifact and DOM tests share the script entry point.
Test the generated artifact through realistic reset-label fixtures. Cover timezone conversion, invalid dates, midnight/year rollover, daylight saving, separate label nodes, asynchronous insertions, text changes, replacement/removal, idempotence, refresh exclusion and unchanged original nodes.

## Verification Contract

Run bun run test (build plus Bun DOM integration tests) and bun run check (strict TypeScript). Validate metadata starts the generated artifact. Browser verification of the authenticated z.ai route may be skipped if no logged-in session is available; report the limitation.

## Definition of Done

All requirements implemented, generated artifact current, tests and typecheck pass, simplification and code review complete, README includes paste-and-save installation and limitations, work committed. No remote means no push or PR.
