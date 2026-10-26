import { hostPermissionPattern, normalizeInstanceUrl } from './lib/instance.js';
import { getInstance, setInstance } from './lib/settings.js';

const form = document.getElementById('form');
const input = document.getElementById('instance');
const status = document.getElementById('status');
const notice = document.getElementById('register-notice');

const save = form.querySelector('button[type="submit"]');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = normalizeInstanceUrl(input.value);
  if (!url) {
    status.textContent = 'Enter the address of the FatRat web interface, e.g. http://nas:2233/';
    return;
  }
  // Must be called before any await: Firefox only allows permission requests directly from the click.
  chrome.permissions
    .request({ origins: [hostPermissionPattern(url)] })
    .catch(() => false)
    .then(async (granted) => {
      const previous = await getInstance(chrome.storage.local);
      await setInstance(chrome.storage.local, url);
      if (previous && hostPermissionPattern(previous) !== hostPermissionPattern(url)) {
        await chrome.permissions.remove({ origins: [hostPermissionPattern(previous)] });
      }
      input.value = url;
      notice.hidden = true;
      history.replaceState(null, '', location.pathname);
      status.textContent = granted
        ? 'Saved.'
        : 'Saved. Without access to this address, every link opens a new FatRat tab.';
    })
    .catch((err) => {
      status.textContent = `Could not save: ${err.message}`;
    });
});

try {
  const current = await getInstance(chrome.storage.local);
  input.value = current ?? '';

  const requested = normalizeInstanceUrl(new URLSearchParams(location.hash.slice(1)).get('register'));
  if (requested) {
    input.value = requested;
    notice.hidden = false;
    if (current && current !== requested) {
      document.getElementById('current-url').textContent = current;
      document.getElementById('register-current').hidden = false;
    }
  }
} finally {
  // Saving is disabled until here so an early Enter can't natively submit the form and drop #register=.
  save.disabled = false;
}
