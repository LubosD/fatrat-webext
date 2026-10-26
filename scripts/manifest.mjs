const HANDOFF = 'https://fatrat.dolezel.info/webext/*';

const TARGETS = {
  chrome: { background: { service_worker: 'background.js', type: 'module' } },
  firefox: {
    background: { scripts: ['background.js'], type: 'module' },
    browser_specific_settings: {
      // 128: first ESR with optional_host_permissions and install-time content script host grants.
      gecko: { id: 'fatrat-webext@dolezel.info', strict_min_version: '128.0', data_collection_permissions: { required: ['none'] } },
    },
  },
};

export function makeManifest(target, version, { devHandoff } = {}) {
  const specific = TARGETS[target];
  if (!specific) throw new Error(`Unknown target ${target}`);
  return {
    manifest_version: 3,
    name: 'FatRat',
    version,
    description: 'Send links to the FatRat download manager from the context menu.',
    homepage_url: 'https://fatrat.dolezel.info/',
    icons: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' },
    permissions: ['contextMenus', 'storage'],
    optional_host_permissions: ['*://*/*'],
    options_ui: { page: 'options.html', open_in_tab: true },
    content_scripts: [{ matches: devHandoff ? [HANDOFF, devHandoff] : [HANDOFF], js: ['handoff.js'], run_at: 'document_start' }],
    ...specific,
  };
}
