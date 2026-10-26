import { normalizeInstanceUrl } from './lib/instance.js';
import { sendLink } from './lib/send-link.js';

const MENU_ID = 'send-link-to-fatrat';

// removeAll first: avoids a duplicate-id error after an update, and onStartup restores a menu
// that went missing after the extension was disabled and re-enabled.
async function createMenu() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: MENU_ID, title: 'Send link to FatRat', contexts: ['link'] });
}

chrome.runtime.onInstalled.addListener(createMenu);
chrome.runtime.onStartup.addListener(createMenu);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.linkUrl) return;
  sendLink(chrome, info.linkUrl, tab).catch((err) => console.error('Failed to send the link to FatRat', err));
});

// From handoff.js on the website. The address is only shown in the options page, never saved
// from here, because any page could link to the handoff page with a hostile address.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== chrome.runtime.id || !sender.tab) return;
  if (message?.type !== 'register') return;
  const url = normalizeInstanceUrl(message.url);
  if (!url) return;
  const placement = { index: sender.tab.index + 1, openerTabId: sender.tab.id };
  chrome.tabs
    .create({ url: `${chrome.runtime.getURL('options.html')}#register=${encodeURIComponent(url)}`, ...placement })
    .catch((err) => console.error('Failed to open the FatRat options page', err));
});
