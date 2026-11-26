(function () {
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const toggle = document.getElementById('toggleEnabled');

  api.storage.local.get({ srmMobileEnabled: true }, (res) => {
    toggle.checked = res.srmMobileEnabled !== false;
  });

  toggle.addEventListener('change', () => {
    api.storage.local.set({ srmMobileEnabled: toggle.checked });
  });
})();
