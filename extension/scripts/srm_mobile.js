(function () {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  const NAV_ITEMS = [
    {
      key: 'home',
      label: 'Profile',
      keywords: ['student profile', 'dashboard', 'profile', 'home'],
      icon: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>'
    },
    {
      key: 'attendance',
      label: 'Attendance',
      keywords: ['attendance'],
      icon: '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-2.47-7.94L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94z"/></svg>'
    },
    {
      key: 'marks',
      label: 'Marks',
      keywords: ['internal mark', 'mark', 'grade', 'exam', 'result'],
      icon: '<svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>'
    },
    {
      key: 'fees',
      label: 'Fees',
      keywords: ['fee', 'finance', 'payment', 'dues'],
      icon: '<svg viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>'
    },
    {
      key: 'menu',
      label: 'Menu',
      keywords: [],
      icon: '<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>'
    }
  ];

  function isLoggedInPage() {
    const url = (window.location.href || '').toLowerCase();
    const isLoginUrl = url.includes('youlogin.jsp') || url.includes('loginmanager');
    const hasLoginForm = !!document.getElementById('divLogin') || !!document.getElementById('btnLogin');
    return !isLoginUrl && !hasLoginForm;
  }

  function ensureViewport() {
    let meta = document.querySelector('meta[name="viewport"]');
    const content = 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = content;
      if (document.head) document.head.appendChild(meta);
    } else {
      meta.setAttribute('content', content);
    }
  }

  function wrapWideTables(root) {
    const tables = (root || document).querySelectorAll('table');
    tables.forEach((table) => {
      if (table.closest('.srm-table-scroll') || table.closest('.table-responsive')) return;
      const cols = table.rows && table.rows.length > 0 ? table.rows[0].cells.length : 0;
      if (cols <= 2 && !table.querySelector('thead')) return;
      table.classList.add('srm-wide-table');
      const wrapper = document.createElement('div');
      wrapper.className = 'srm-table-scroll';
      if (table.parentNode) {
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  function toggleSidebarDrawer() {
    const selectors = [
      '#sidebarToggle',
      '#sidebarToggleTop',
      '.navbar-toggler',
      '[data-toggle="sidebar"]',
      '[data-bs-toggle="offcanvas"]',
      'button .fa-bars',
      'a .fa-bars',
      '.fa-bars'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        (el.closest('button, a') || el).click();
        return true;
      }
    }
    return false;
  }

  function clickMenuByKeywords(keywords) {
    const candidates = document.querySelectorAll(
      '#layoutSidenav_nav a, .sidenav a, .sidebar a, nav a, .nav-link, [onclick]'
    );
    for (const kw of keywords) {
      for (const el of candidates) {
        if (el.closest('#srm-ext-bottom-nav')) continue;
        const text = (el.textContent || '').trim().toLowerCase();
        const href = (el.getAttribute('href') || '').toLowerCase();
        const onclick = (el.getAttribute('onclick') || '').toLowerCase();
        if (text.includes('logout') || href.includes('logout')) continue;
        if (text.includes(kw) || href.includes(kw) || onclick.includes(kw)) {
          el.click();
          if (document.body.classList.contains('sidenav-toggled')) {
            setTimeout(() => document.body.classList.remove('sidenav-toggled'), 150);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return true;
        }
      }
    }
    return false;
  }

  function mountBottomNav() {
    if (!isLoggedInPage()) {
      removeBottomNav();
      return;
    }
    if (document.getElementById('srm-ext-bottom-nav')) return;

    const nav = document.createElement('nav');
    nav.id = 'srm-ext-bottom-nav';
    nav.setAttribute('aria-label', 'SRM Portal Navigation');

    NAV_ITEMS.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'srm-nav-btn' + (index === 0 ? ' is-active' : '');
      btn.dataset.tab = item.key;
      btn.innerHTML = `<span class="srm-nav-pill">${item.icon}</span><span>${item.label}</span>`;

      btn.addEventListener('click', () => {
        if (item.key === 'menu') {
          toggleSidebarDrawer();
          return;
        }
        nav.querySelectorAll('.srm-nav-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        if (!clickMenuByKeywords(item.keywords)) {
          toggleSidebarDrawer();
        }
      });

      nav.appendChild(btn);
    });

    document.body.appendChild(nav);
    document.documentElement.classList.add('srm-ext-has-nav');
  }

  function removeBottomNav() {
    const nav = document.getElementById('srm-ext-bottom-nav');
    if (nav) nav.remove();
    document.documentElement.classList.remove('srm-ext-has-nav');
  }

  function buildProfileHeroCard() {
    if (!isLoggedInPage()) return;
    if (document.getElementById('srm-hero-profile')) return;

    // Detect the Student Profile card by its header text
    const cards = Array.from(document.querySelectorAll('.card'));
    const profileCard = cards.find((c) => {
      const h = c.querySelector('.card-header');
      return h && /student\s*profile/i.test(h.textContent || '');
    });
    if (!profileCard) return;

    // Extract key student fields from the profile table
    const fields = {};
    profileCard.querySelectorAll('tr').forEach((tr) => {
      const cells = tr.querySelectorAll('td, th');
      if (cells.length >= 2) {
        const key = (cells[0].textContent || '').trim().toLowerCase();
        const val = (cells[1].textContent || '').trim();
        if (key && val) fields[key] = val;
      }
    });

    // Find the student's profile photo card (separate card containing a student image)
    let photoSrc = '';
    let photoCard = null;
    for (const c of cards) {
      if (c === profileCard) continue;
      const imgs = Array.from(c.querySelectorAll('img')).filter((img) => {
        const s = (img.getAttribute('src') || '').toLowerCase();
        return s && !s.includes('srmist') && !s.includes('logo') && !s.includes('wait.gif');
      });
      if (imgs.length > 0) {
        photoSrc = imgs[0].src;
        photoCard = c;
        break;
      }
    }

    const name = fields['student name'] || '';
    const regNo = fields['register no.'] || fields['register no'] || '';
    const studentId = fields['student id'] || '';
    const program = fields['program'] || '';
    const semester = fields['semester'] || '';

    if (!name && !photoSrc) return;

    const hero = document.createElement('div');
    hero.id = 'srm-hero-profile';

    const top = document.createElement('div');
    top.className = 'srm-hero-top';

    if (photoSrc) {
      const avatar = document.createElement('img');
      avatar.className = 'srm-hero-avatar';
      avatar.src = photoSrc;
      avatar.alt = name || 'Student Photo';
      top.appendChild(avatar);
    }

    const info = document.createElement('div');
    info.className = 'srm-hero-info';

    if (name) {
      const nameEl = document.createElement('div');
      nameEl.className = 'srm-hero-name';
      nameEl.textContent = name;
      info.appendChild(nameEl);
    }
    if (regNo) {
      const regEl = document.createElement('div');
      regEl.className = 'srm-hero-reg';
      regEl.textContent = regNo;
      info.appendChild(regEl);
    }

    top.appendChild(info);
    hero.appendChild(top);

    if (program) {
      const progEl = document.createElement('div');
      progEl.className = 'srm-hero-program';
      progEl.textContent = program;
      hero.appendChild(progEl);
    }

    if (semester || studentId) {
      const pills = document.createElement('div');
      pills.className = 'srm-hero-pills';
      if (semester) {
        const p1 = document.createElement('span');
        p1.className = 'srm-hero-pill';
        p1.textContent = 'Semester ' + semester;
        pills.appendChild(p1);
      }
      if (studentId) {
        const p2 = document.createElement('span');
        p2.className = 'srm-hero-pill';
        p2.textContent = 'ID: ' + studentId;
        pills.appendChild(p2);
      }
      hero.appendChild(pills);
    }

    const targetContainer = profileCard.parentNode;
    if (targetContainer) {
      targetContainer.insertBefore(hero, profileCard);
    }

    // Hide the duplicate bottom photo-only card cleanly
    if (photoCard && !photoCard.querySelector('table')) {
      photoCard.classList.add('srm-hidden-photo-card');
    }
  }

  function hideAttendanceChartCards(rootDoc) {
    const doc = rootDoc || document;
    doc.querySelectorAll('.card').forEach((card) => {
      // Never hide data table cards (e.g., Course Wise Attendance table)
      if (card.querySelector('table')) return;

      const header = card.querySelector('.card-header');
      const text = (header ? header.textContent : '').trim();
      const hasChartCanvas = !!card.querySelector('canvas');
      const isAttendanceChartHeader =
        /course\s*wise\s*attendance\s*\(%\)/i.test(text) ||
        /attendance\s*hours/i.test(text);

      if (hasChartCanvas || isAttendanceChartHeader) {
        card.classList.add('srm-hidden-chart-card');
        card.style.setProperty('display', 'none', 'important');
      }
    });

    // Also check same-origin iframes if any inner page renders inside one
    doc.querySelectorAll('iframe').forEach((frame) => {
      try {
        if (frame.contentDocument) {
          hideAttendanceChartCards(frame.contentDocument);
        }
      } catch (_) {}
    });
  }

  function enableMobileUI() {
    document.documentElement.classList.add('srm-ext-active');
    ensureViewport();
    wrapWideTables(document);
    buildProfileHeroCard();
    hideAttendanceChartCards(document);
    mountBottomNav();
  }

  function disableMobileUI() {
    document.documentElement.classList.remove('srm-ext-active');
    const hero = document.getElementById('srm-hero-profile');
    if (hero) hero.remove();
    document.querySelectorAll('.srm-hidden-photo-card, .srm-hidden-chart-card').forEach((el) => {
      el.classList.remove('srm-hidden-photo-card', 'srm-hidden-chart-card');
      el.style.removeProperty('display');
    });
    removeBottomNav();
  }

  let observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    let timer = null;
    observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains('srm-ext-active')) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        wrapWideTables(document);
        buildProfileHeroCard();
        hideAttendanceChartCards();
        mountBottomNav();
      }, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function readStorage(defaults, cb) {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      browser.storage.local.get(defaults).then(cb, () => cb(defaults));
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(defaults, cb);
    } else {
      cb(defaults);
    }
  }

  function init() {
    readStorage({ srmMobileEnabled: true }, (res) => {
      if (res.srmMobileEnabled !== false) {
        enableMobileUI();
        startObserver();
      }
    });

    if (api && api.storage && api.storage.onChanged) {
      api.storage.onChanged.addListener((changes) => {
        if (changes.srmMobileEnabled) {
          if (changes.srmMobileEnabled.newValue !== false) {
            enableMobileUI();
            startObserver();
          } else {
            disableMobileUI();
          }
        }
      });
    }
  }

  init();
})();
