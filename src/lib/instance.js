/**
 * The canonical form of a FatRat web UI address: http(s) only, no credentials, query or fragment,
 * and a directory path ending in "/". Returns null for anything else.
 */
export function normalizeInstanceUrl(input) {
  let text = String(input ?? '').trim();
  if (text === '') return null;
  if (!text.includes('://')) text = `http://${text}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.hostname === '') return null;
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/index\.html$/, '/');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

/** Firefox match patterns can't contain a port, so this covers every port on the host. */
export function hostPermissionPattern(instanceUrl) {
  const url = new URL(instanceUrl);
  return `${url.protocol}//${url.hostname}/*`;
}

export function isInstanceTabUrl(instanceUrl, tabUrl) {
  if (!tabUrl) return false;
  try {
    const instance = new URL(instanceUrl);
    const tab = new URL(tabUrl);
    return tab.origin === instance.origin && tab.pathname.startsWith(instance.pathname);
  } catch {
    return false;
  }
}

/** See the web UI's core/incoming-links.ts for the receiving side. */
export function buildAddUrl(instanceUrl, links) {
  return `${instanceUrl}#${links.map((link) => `add=${encodeURIComponent(link)}`).join('&')}`;
}

export function pickInstanceTab(tabs) {
  let best;
  for (const tab of tabs) {
    if (!best || (tab.lastAccessed ?? 0) > (best.lastAccessed ?? 0)) best = tab;
  }
  return best;
}
