document.addEventListener('DOMContentLoaded', () => {
  const cookieBanner = document.getElementById('cookie-consent-banner');
  const declineBtn = document.getElementById('cookie-decline-btn');
  const acceptBtn = document.getElementById('cookie-accept-btn');
  if (cookieBanner) {
    if (localStorage.getItem('maqamir_cookie_consent')) {
      cookieBanner.hidden = true;
    }
    const dismissCookie = (choice) => {
      localStorage.setItem('maqamir_cookie_consent', choice);
      cookieBanner.hidden = true;
    };
    declineBtn?.addEventListener('click', () => dismissCookie('declined'));
    acceptBtn?.addEventListener('click', () => dismissCookie('accepted'));
  }

  const dropdownToggles = document.querySelectorAll('[data-dropdown-toggle]');
  dropdownToggles.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-dropdown-toggle');
      const menu = document.getElementById(targetId);
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      dropdownToggles.forEach((other) => {
        other.setAttribute('aria-expanded', 'false');
        const otherMenu = document.getElementById(other.getAttribute('data-dropdown-toggle'));
        if (otherMenu) otherMenu.hidden = true;
      });
      if (!isOpen && menu) {
        btn.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
      }
    });
  });

  document.addEventListener('click', () => {
    dropdownToggles.forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
      const menu = document.getElementById(btn.getAttribute('data-dropdown-toggle'));
      if (menu) menu.hidden = true;
    });
  });

  const langButtons = document.querySelectorAll('[data-lang]');
  const currentLangLabel = document.getElementById('current-lang-label');
  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      langButtons.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      if (currentLangLabel) {
        currentLangLabel.textContent = btn.textContent.split(' ')[0];
      }
    });
  });

  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
  const mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
  mobileOpenBtn?.addEventListener('click', () => {
    if (mobileDrawer) mobileDrawer.hidden = false;
    mobileOpenBtn.setAttribute('aria-expanded', 'true');
  });
  mobileCloseBtn?.addEventListener('click', () => {
    if (mobileDrawer) mobileDrawer.hidden = true;
    mobileOpenBtn?.setAttribute('aria-expanded', 'false');
  });

  const signInBtn = document.getElementById('sign-in-btn');
  const signInModal = document.getElementById('signin-modal');
  const signInCloseBtn = document.getElementById('signin-close-btn');
  const signInForm = document.getElementById('signin-form');
  const signInStatus = document.getElementById('signin-status');

  signInBtn?.addEventListener('click', () => {
    if (signInModal) signInModal.hidden = false;
  });
  signInCloseBtn?.addEventListener('click', () => {
    if (signInModal) signInModal.hidden = true;
  });
  signInModal?.addEventListener('click', (e) => {
    if (e.target === signInModal) signInModal.hidden = true;
  });
  signInForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email')?.value?.trim();
    if (!email) return;
    if (signInStatus) signInStatus.textContent = 'Sending sign-in link (simulated)...';
    try {
      await fetch('/api/mock/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (_) {}
    if (signInStatus) signInStatus.textContent = `Simulated sign-in link sent to ${email}.`;
  });
});