# z.ai Local Time

A small Tampermonkey userscript that adds your local date and time beside the Coding Plan's UTC+8 reset times. The original timestamp stays intact.

```text
Reset Time: 2026-10-24 12:15 → Oct 23, 2026, 10:15 PM MDT (local)
```

Uses your browser's locale and time zone, including daylight saving time. Hover over the added label to see the source value and your zone. Tracks reset values added or refreshed by the page. Leaves “Last refresh time” alone.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) if needed.
2. Open Tampermonkey's dashboard and choose **Create a new script**.
3. Replace the editor contents with all of [dist/zai-local-time.user.js](dist/zai-local-time.user.js), then save.
4. Reload the [z.ai usage page](https://z.ai/manage-apikey/coding-plan/personal/usage).

No build is needed to install. If Chrome blocks userscripts, follow [Tampermonkey's instructions for enabling userscript execution](https://www.tampermonkey.net/faq.php#Q209).

## Development

TypeScript source is in [src/zai-local-time.user.ts](src/zai-local-time.user.ts). Uses Bun 1.4.4+ and [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey).

```sh
bun install --frozen-lockfile
bun run test
bun run check
```

`bun run build` produces the committed `.user.js`, with metadata configured in `vite.config.ts` and no runtime libraries. Tests exercise that exact artifact in jsdom.

For development, run `bun run dev` and install the development script from the URL Vite opens (or open the local URL printed in the terminal). Keep the server running while testing on z.ai. Disable the installed production copy while using the development script to avoid running both. For a normal install after editing, rebuild and paste the updated JavaScript into Tampermonkey; `bun run preview` also serves the production install. The development script loads from localhost; the production script makes no network requests.

## Scope and limits

Only runs in the top frame on `https://z.ai/`, annotating reset times under `/manage-apikey/`. Reads displayed text and appends separate labels: no network requests, token access, storage, analytics, or changes to z.ai's original nodes. Disable the userscript and reload to remove its additions.

Recognizes English “Reset Time” labels with `YYYY-MM-DD HH:mm[:ss]` (also `/` or `.` date separators) or `HH:mm[:ss]`. Time-only values are interpreted as the next occurrence in Singapore; dates and zones are shown locally to make midnight crossings clear. Unlabeled, yearless, explicitly zoned, or invalid timestamps are left alone. Labels refresh when the page changes; this isn't a live countdown.

This depends on z.ai's current display convention and may need adjustment if its labels or source time zone change. DOM fixtures are tested; a logged-in z.ai account and installation in Tampermonkey are still needed for live verification.

## References

The [Z.AI Local Time extension](https://github.com/soaresfellipe/zai-local-time) and [its author's explanation](https://fellipesoares.com.br/zai-local-time/) document the UTC+8 reset display and already-local refresh timestamp. This script implements only the additive time annotations, without the extension's promotional UI.
