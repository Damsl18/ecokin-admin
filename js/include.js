async function loadPartial(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;
  const res = await fetch(url);
  host.innerHTML = await res.text();
}

function highlightActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('[data-nav]').forEach((el) => {
    if (el.dataset.nav === page) el.classList.add('is-active');
  });
}

function wireLogout() {
  const handler = async () => {
    try { await apiPost('/auth/logout'); } catch (err) { /* on redirige quand même */ }
    window.location.href = 'login.html';
  };
  document.getElementById('logoutBtn')?.addEventListener('click', handler);
  document.getElementById('logoutBtnMobile')?.addEventListener('click', handler);
}

function wireBurger() {
  const burger = document.getElementById('burgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }
}

/**
 * À appeler en haut de chaque page admin protégée. Vérifie la session ET le rôle admin.
 */
async function initAppShell() {
  document.body.classList.add('app-shell');
  await Promise.all([
    loadPartial('#site-header', 'partials/header.html'),
    loadPartial('#bottom-nav-slot', 'partials/bottom-nav.html'),
  ]);
  highlightActiveNav();
  wireLogout();
  wireBurger();

  try {
    const { user } = await apiGet('/users/me');
    if (user.role !== 'admin') {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  } catch (err) {
    return null; // apiGet redirige déjà vers login.html en cas de 401
  }
}
