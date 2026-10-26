import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendLink } from '../src/lib/send-link.js';

function fakeApi({ instance = 'http://nas:2233/', tabs = [] } = {}) {
  const store = instance ? { instanceUrl: instance } : {};
  return {
    storage: {
      local: {
        get: vi.fn(async (key) => (key in store ? { [key]: store[key] } : {})),
        set: vi.fn(async (items) => Object.assign(store, items)),
      },
    },
    tabs: { query: vi.fn(async () => tabs), update: vi.fn(async () => ({})), create: vi.fn(async () => ({})) },
    windows: { update: vi.fn(async () => ({})) },
    runtime: { openOptionsPage: vi.fn(async () => {}) },
  };
}

const LINK = 'http://example.com/file.iso';
const TARGET = `http://nas:2233/#add=${encodeURIComponent(LINK)}`;

describe('sendLink', () => {
  it('opens the options page when no instance is configured', async () => {
    const api = fakeApi({ instance: null });
    expect(await sendLink(api, LINK)).toBe('unconfigured');
    expect(api.runtime.openOptionsPage).toHaveBeenCalled();
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it('opens a new tab next to the source tab when no web UI tab is open', async () => {
    const api = fakeApi();
    expect(await sendLink(api, LINK, { id: 7, index: 3 })).toBe('opened');
    expect(api.tabs.query).toHaveBeenCalledWith({ url: 'http://nas/*' });
    expect(api.tabs.create).toHaveBeenCalledWith({ url: TARGET, openerTabId: 7 });
  });

  it('reuses and focuses the most recent web UI tab', async () => {
    const tabs = [
      { id: 1, windowId: 10, url: 'http://nas:2233/', lastAccessed: 5 },
      { id: 2, windowId: 20, url: 'http://nas:2233/', lastAccessed: 9 },
    ];
    const api = fakeApi({ tabs });
    expect(await sendLink(api, LINK)).toBe('reused');
    expect(api.tabs.update).toHaveBeenCalledWith(2, { url: TARGET, active: true });
    expect(api.windows.update).toHaveBeenCalledWith(20, { focused: true });
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it('ignores tabs on another port and tabs whose URL it may not see', async () => {
    const tabs = [{ id: 1, windowId: 10, url: 'http://nas:8080/' }, { id: 2, windowId: 10 }];
    const api = fakeApi({ tabs });
    expect(await sendLink(api, LINK)).toBe('opened');
    expect(api.tabs.update).not.toHaveBeenCalled();
  });

  it('passes no opener for a non-tab source (Chrome reports id -1)', async () => {
    const api = fakeApi();
    expect(await sendLink(api, LINK, { id: -1, index: -1 })).toBe('opened');
    expect(api.tabs.create).toHaveBeenCalledWith({ url: TARGET });
  });

  it('retries without the opener when the browser rejects it', async () => {
    const api = fakeApi();
    api.tabs.create.mockRejectedValueOnce(new Error('Opener tab is in another window'));
    expect(await sendLink(api, LINK, { id: 7 })).toBe('opened');
    expect(api.tabs.create).toHaveBeenNthCalledWith(1, { url: TARGET, openerTabId: 7 });
    expect(api.tabs.create).toHaveBeenNthCalledWith(2, { url: TARGET });
  });

  it('keeps the reused tab on its own page so only the fragment changes', async () => {
    const tabs = [{ id: 1, windowId: 10, url: 'http://nas:2233/index.html#add=old' }];
    const api = fakeApi({ tabs });
    expect(await sendLink(api, LINK)).toBe('reused');
    expect(api.tabs.update).toHaveBeenCalledWith(1, {
      url: `http://nas:2233/index.html#add=${encodeURIComponent(LINK)}`,
      active: true,
    });
  });

  it('opens a new tab when the reused tab vanished', async () => {
    const api = fakeApi({ tabs: [{ id: 1, windowId: 10, url: 'http://nas:2233/' }] });
    api.tabs.update.mockRejectedValueOnce(new Error('No tab with id 1'));
    expect(await sendLink(api, LINK)).toBe('opened');
    expect(api.tabs.create).toHaveBeenCalledWith({ url: TARGET });
  });
});
