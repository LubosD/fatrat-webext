// Runs at document_start on the website's /webext/ page (see website/webext/index.html in fatrat).
document.documentElement.dataset.fatratWebext = chrome.runtime.getManifest().version;

window.addEventListener('fatrat-webext-register', (event) => {
  if (typeof event.detail === 'string') {
    // The background never replies, which Chrome may report as a closed message port.
    chrome.runtime.sendMessage({ type: 'register', url: event.detail }).catch(() => {});
  }
});
