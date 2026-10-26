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
  // Without the host permission the url filter is ignored and tab URLs are hidden; the
  // isInstanceTabUrl check then rejects every tab and we fall back to a new one.
  const tabs = await api.tabs.query({ url: hostPermissionPattern(instance) });
  const tab = pickInstanceTab(tabs.filter((t) => isInstanceTabUrl(instance, t.url)));
  if (tab) {
    await api.tabs.update(tab.id, { url: target, active: true });
    await api.windows.update(tab.windowId, { focused: true });
    return 'reused';
  }
  const placement = sourceTab ? { index: sourceTab.index + 1, openerTabId: sourceTab.id } : {};
  await api.tabs.create({ url: target, ...placement });
  return 'opened';
}
