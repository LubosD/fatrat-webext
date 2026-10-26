import { describe, expect, it } from 'vitest';
import { makeManifest } from '../scripts/manifest.mjs';

describe('makeManifest', () => {
  it('uses a service worker and no Gecko settings for Chrome', () => {
    const m = makeManifest('chrome', '1.2.3');
    expect(m.manifest_version).toBe(3);
    expect(m.version).toBe('1.2.3');
    expect(m.background).toEqual({ service_worker: 'background.js', type: 'module' });
    expect(m.browser_specific_settings).toBeUndefined();
  });

  it('uses background scripts and an add-on id for Firefox', () => {
    const m = makeManifest('firefox', '1.2.3');
    expect(m.background).toEqual({ scripts: ['background.js'], type: 'module' });
    expect(m.browser_specific_settings.gecko.id).toBe('fatrat-webext@dolezel.info');
    expect(m.browser_specific_settings.gecko.data_collection_permissions).toEqual({ required: ['none'] });
  });

  it('asks for no host permission up front, only the optional one', () => {
    for (const target of ['chrome', 'firefox']) {
      const m = makeManifest(target, '1.0.0');
      expect(m.permissions).toEqual(['contextMenus', 'storage']);
      expect(m.host_permissions).toBeUndefined();
      expect(m.optional_host_permissions).toEqual(['*://*/*']);
      expect(m.content_scripts).toEqual([
        { matches: ['https://fatrat.dolezel.info/webext/*'], js: ['handoff.js'], run_at: 'document_start' },
      ]);
    }
  });

  it('adds a development handoff origin when asked', () => {
    const m = makeManifest('chrome', '1.0.0', { devHandoff: 'http://10.10.10.3/webext/*' });
    expect(m.content_scripts[0].matches).toEqual(['https://fatrat.dolezel.info/webext/*', 'http://10.10.10.3/webext/*']);
  });

  it('rejects an unknown target', () => {
    expect(() => makeManifest('safari', '1.0.0')).toThrow();
  });
});
