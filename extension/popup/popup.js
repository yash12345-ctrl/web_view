(function () {
  const toggle = document.getElementById('toggleEnabled');

  function readEnabled(cb) {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      browser.storage.local.get({ srmMobileEnabled: true }).then(cb, () => cb({ srmMobileEnabled: true }));
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ srmMobileEnabled: true }, cb);
    } else {
      cb({ srmMobileEnabled: true });
    }
  }

  function writeEnabled(val) {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      browser.storage.local.set({ srmMobileEnabled: val });
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ srmMobileEnabled: val });
    }
  }

  readEnabled((res) => {
    toggle.checked = res.srmMobileEnabled !== false;
  });

  toggle.addEventListener('change', () => {
    writeEnabled(toggle.checked);
  });
})();
