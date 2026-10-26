import { buildAddUrl, hostPermissionPattern, isInstanceTabUrl, pickInstanceTab } from './instance.js';
import { getInstance } from './settings.js';

/**
 * Hands a link to the FatRat web UI. A web UI tab that is already open is navigated to the
 * add-link fragment, which only changes the fragment, so the page doesn't reload; otherwise a new
 * tab is opened. `api` is the `chrome` namespace, injected for tests.
 */
export async function sendLink(api, linkUrl, sourceTab) {
  const instance = await getInstance(api.storage.local);
  if (!instance) {
    await api.runtime.openOptionsPage();
    return 'unconfigured';
  }
  const target = buildAddUrl(instance, [linkUrl]);
  // Without the host permission the browser hides tab URLs (the url filter then matches nothing),
  // so isInstanceTabUrl rejects every tab and we fall back to a new one.
  const tabs = await api.tabs.query({ url: hostPermissionPattern(instance) });
  const tab = pickInstanceTab(tabs.filter((t) => isInstanceTabUrl(instance, t.url)));
  if (tab) {
    // Keep the tab's own page (e.g. index.html) so only the fragment changes and nothing reloads.
    const reuseTarget = buildAddUrl(tab.url.split('#')[0], [linkUrl]);
    try {
      await api.tabs.update(tab.id, { url: reuseTarget, active: true });
      await api.windows.update(tab.windowId, { focused: true });
      return 'reused';
    } catch {
      // The tab was closed between the query and the update.
    }
  }
  // Chrome reports non-tab contexts as id -1. A child tab is placed next to its opener by the browser.
  if (sourceTab?.id >= 0) {
    try {
      await api.tabs.create({ url: target, openerTabId: sourceTab.id });
      return 'opened';
    } catch {
      // Firefox rejects an opener in another window (e.g. a link in a popup).
    }
  }
  await api.tabs.create({ url: target });
  return 'opened';
}
