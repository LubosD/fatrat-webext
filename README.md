# FatRat browser extension

Adds "Send link to FatRat" to the browser's link context menu (Chrome and Firefox, Manifest V3).
The link opens in the New Transfer dialog of your FatRat web UI, in the tab that is already open
(which is focused) or in a new one. Nothing is added until you click Add.

The extension never calls FatRat's API and never stores credentials. It only navigates a tab to
`<instance>#add=<link>`; the web UI does the rest.

## Install

Requires FatRat newer than 1.3.1 (the first release whose web UI accepts links from the extension).

Store links will be added once the extension is published. Until then, load it unpacked:

- Chrome: `npm ci && npm run build`, then open `chrome://extensions`, enable Developer mode, choose
  Load unpacked and select `dist/chrome`.
- Firefox: `npm ci && npm run start:firefox`.

### Connect it to FatRat

Either open the FatRat web UI, go to Settings, Web Interface and click "Set up the browser
extension...", or type the web UI's address into the extension's options page. The extension sends every link to the registered address, so only confirm an address that is your own FatRat; a malicious setup link could otherwise redirect your links.

## Contracts

These are shared with the FatRat web UI and website; do not change one side only.

1. **Add-link fragment.** `<instanceUrl>#add=<encodeURIComponent(link)>`, with further links as `&add=…`. The web UI reads every `add` value with `URLSearchParams`, opens or appends to the New Transfer dialog, then removes the fragment with `history.replaceState` (which does not fire `hashchange`).
2. **Instance URL.** Absolute `http:`/`https:` URL of the web UI's directory, with no credentials, query or fragment, and a path ending in `/` (e.g. `http://nas:2233/`, `https://host/fatrat/`).
3. **Handoff page.** `https://fatrat.dolezel.info/webext/#instance=<encodeURIComponent(instanceUrl)>`.
   - The extension's content script runs at `document_start` and sets `data-fatrat-webext="<extension version>"` on `<html>`.
   - To register, the page dispatches `window.dispatchEvent(new CustomEvent('fatrat-webext-register', { detail: instanceUrl }))`.
   - The content script forwards that to the background as `{ type: 'register', url }`. The background opens `options.html#register=<encodeURIComponent(url)>` in a new tab.
4. **Storage.** `chrome.storage.local` key `instanceUrl` (string).
5. **Host permission.** Optional permission `<protocol>//<hostname>/*`, without a port, because Firefox match patterns cannot contain one. Tabs are then filtered by exact origin + path in JS.

## Development

- `npm test`: unit tests (Vitest, against a fake `chrome` object).
- `npm run build`: writes `dist/chrome` and `dist/firefox`.
- `npm run lint`: builds, then runs `web-ext lint` on the Firefox build.
- `npm run package`: builds and zips both browsers into `dist/packages`.
- `npm run start:firefox`: builds and launches Firefox with the extension loaded.
