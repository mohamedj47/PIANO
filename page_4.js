document.addEventListener('DOMContentLoaded', function () {
  var switcherBtn = document.getElementById('app-switcher-btn');
  var switcherMenu = document.getElementById('radix-:r0:');
  if (switcherBtn && switcherMenu) {
    switcherBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = switcherBtn.getAttribute('aria-expanded') === 'true';
      switcherBtn.setAttribute('aria-expanded', String(!isOpen));
      switcherMenu.hidden = isOpen;
    });
    document.addEventListener('click', function (e) {
      if (!switcherMenu.hidden && !switcherMenu.contains(e.target) && e.target !== switcherBtn) {
        switcherBtn.setAttribute('aria-expanded', 'false');
        switcherMenu.hidden = true;
      }
    });
  }

  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenuModal = document.getElementById('mobile-menu-modal');
  var closeMenuBtn = document.getElementById('close-menu-btn');
  if (mobileMenuBtn && mobileMenuModal) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileMenuModal.hidden = false;
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    });
  }
  if (closeMenuBtn && mobileMenuModal) {
    closeMenuBtn.addEventListener('click', function () {
      mobileMenuModal.hidden = true;
      if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  }
  if (mobileMenuModal) {
    mobileMenuModal.addEventListener('click', function (e) {
      if (e.target === mobileMenuModal) {
        mobileMenuModal.hidden = true;
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var goBackBtn = document.getElementById('go-back-btn');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/reconstructed/proj_1794845266233_f2bfdd/piano.html';
      }
    });
  }

  var signInBtn = document.getElementById('sign-in-btn');
  if (signInBtn) {
    signInBtn.addEventListener('click', function () {
      fetch('/api/mock/auth/session', { method: 'POST' })
        .then(function () {
          alert('Simulated sign-in triggered (mock endpoint /api/mock/auth/session).');
        })
        .catch(function () {
          alert('Simulated sign-in triggered.');
        });
    });
  }

  var cookieBanner = document.getElementById('cookie-consent-banner');
  var acceptBtn = document.getElementById('cookie-accept-btn');
  var declineBtn = document.getElementById('cookie-decline-btn');
  try {
    if (localStorage.getItem('maqamir_cookie_consent') && cookieBanner) {
      cookieBanner.style.display = 'none';
    }
  } catch (err) {}
  function dismissConsent(choice) {
    try {
      localStorage.setItem('maqamir_cookie_consent', choice);
    } catch (err) {}
    if (cookieBanner) {
      cookieBanner.style.display = 'none';
    }
  }
  if (acceptBtn) acceptBtn.addEventListener('click', function () { dismissConsent('accepted'); });
  if (declineBtn) declineBtn.addEventListener('click', function () { dismissConsent('declined'); });
});