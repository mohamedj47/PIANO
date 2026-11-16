document.addEventListener('DOMContentLoaded', function () {
  var selectedPlan = 'annual';
  var planAnnualBtn = document.getElementById('planAnnualBtn');
  var planMonthlyBtn = document.getElementById('planMonthlyBtn');
  var selectedPlanSummary = document.getElementById('selectedPlanSummary');
  var modalPlanLabel = document.getElementById('modalPlanLabel');

  function selectPlan(plan) {
    selectedPlan = plan;
    var isAnnual = plan === 'annual';
    planAnnualBtn.classList.toggle('selected', isAnnual);
    planAnnualBtn.setAttribute('aria-pressed', String(isAnnual));
    planMonthlyBtn.classList.toggle('selected', !isAnnual);
    planMonthlyBtn.setAttribute('aria-pressed', String(!isAnnual));
    if (selectedPlanSummary) {
      selectedPlanSummary.textContent = isAnnual
        ? 'Selected: Annual — ILS 39 / year (Founding price locked for life)'
        : 'Selected: Monthly — ILS 9.90 / month (Cancel any time)';
    }
    if (modalPlanLabel) {
      modalPlanLabel.textContent = isAnnual
        ? 'Plan: Annual (ILS 39 / year)'
        : 'Plan: Monthly (ILS 9.90 / month)';
    }
  }

  if (planAnnualBtn) planAnnualBtn.addEventListener('click', function () { selectPlan('annual'); });
  if (planMonthlyBtn) planMonthlyBtn.addEventListener('click', function () { selectPlan('monthly'); });

  function setupDropdown(btnId, menuId) {
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = !menu.hasAttribute('hidden');
      closeAllDropdowns();
      if (!isOpen) {
        menu.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function closeAllDropdowns() {
    ['appSwitcherMenu', 'langMenu'].forEach(function (id) {
      var m = document.getElementById(id);
      if (m) m.setAttribute('hidden', '');
    });
    ['appSwitcherBtn', 'langBtn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  setupDropdown('appSwitcherBtn', 'appSwitcherMenu');
  setupDropdown('langBtn', 'langMenu');
  document.addEventListener('click', closeAllDropdowns);

  document.querySelectorAll('.lang-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var langBtn = document.getElementById('langBtn');
      if (langBtn) langBtn.querySelector('span').textContent = opt.textContent;
      document.querySelectorAll('.lang-option').forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');
      closeAllDropdowns();
    });
  });

  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  var mobileCloseBtn = document.getElementById('mobileCloseBtn');
  var mobileDrawer = document.getElementById('mobileDrawer');
  var mobileDrawerBackdrop = document.getElementById('mobileDrawerBackdrop');

  function toggleMobileDrawer(open) {
    if (!mobileDrawer || !mobileDrawerBackdrop) return;
    if (open) {
      mobileDrawer.removeAttribute('hidden');
      mobileDrawerBackdrop.removeAttribute('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    } else {
      mobileDrawer.setAttribute('hidden', '');
      mobileDrawerBackdrop.setAttribute('hidden', '');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', function () { toggleMobileDrawer(true); });
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', function () { toggleMobileDrawer(false); });
  if (mobileDrawerBackdrop) mobileDrawerBackdrop.addEventListener('click', function () { toggleMobileDrawer(false); });

  var authModalBackdrop = document.getElementById('authModalBackdrop');
  var authModalClose = document.getElementById('authModalClose');
  var foundingCtaBtn = document.getElementById('foundingCtaBtn');
  var signInBtn = document.getElementById('signInBtn');
  var mobileSignInBtn = document.getElementById('mobileSignInBtn');

  function openModal() {
    if (authModalBackdrop) authModalBackdrop.removeAttribute('hidden');
  }
  function closeModal() {
    if (authModalBackdrop) authModalBackdrop.setAttribute('hidden', '');
  }

  if (foundingCtaBtn) foundingCtaBtn.addEventListener('click', openModal);
  if (signInBtn) signInBtn.addEventListener('click', openModal);
  if (mobileSignInBtn) mobileSignInBtn.addEventListener('click', function () { toggleMobileDrawer(false); openModal(); });
  if (authModalClose) authModalClose.addEventListener('click', closeModal);
  if (authModalBackdrop) {
    authModalBackdrop.addEventListener('click', function (e) {
      if (e.target === authModalBackdrop) closeModal();
    });
  }

  var proCheckoutForm = document.getElementById('proCheckoutForm');
  var checkoutEmail = document.getElementById('checkoutEmail');
  var checkoutEmailError = document.getElementById('checkoutEmailError');
  var checkoutStatus = document.getElementById('checkoutStatus');

  if (proCheckoutForm) {
    proCheckoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailVal = checkoutEmail.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      if (!valid) {
        checkoutEmailError.removeAttribute('hidden');
        return;
      }
      checkoutEmailError.setAttribute('hidden', '');
      checkoutStatus.removeAttribute('hidden');
      checkoutStatus.textContent = 'Connecting to simulated checkout...';
      fetch('/api/mock/pro/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, plan: selectedPlan })
      }).then(function () {
        checkoutStatus.textContent = 'Simulated checkout session created for ' + emailVal + ' (' + selectedPlan + ').';
      }).catch(function () {
        checkoutStatus.textContent = 'Simulated checkout ready for ' + emailVal + ' (' + selectedPlan + ').';
      });
    });
  }

  var cookieBanner = document.getElementById('cookieBanner');
  var cookieDeclineBtn = document.getElementById('cookieDeclineBtn');
  var cookieAcceptBtn = document.getElementById('cookieAcceptBtn');
  if (cookieDeclineBtn) cookieDeclineBtn.addEventListener('click', function () { cookieBanner.style.display = 'none'; });
  if (cookieAcceptBtn) cookieAcceptBtn.addEventListener('click', function () { cookieBanner.style.display = 'none'; });
});