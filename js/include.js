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
}

function wireDrawer() {
  const burger = document.getElementById('burgerBtn');
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!burger || !sidebar || !backdrop) return;

  const open = () => {
    sidebar.classList.add('is-open');
    backdrop.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', open);
  backdrop.addEventListener('click', close);
  sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

function displayUserIdentity(user) {
  const initialsEl = document.getElementById('userInitials');
  const nameEl = document.getElementById('userName');
  if (!user) return;
  if (initialsEl) initialsEl.textContent = `${(user.prenom || '?')[0]}${(user.nom || '?')[0]}`.toUpperCase();
  if (nameEl) nameEl.textContent = `${user.prenom} ${user.nom}`;
}

/**
 * À appeler en haut de chaque page admin protégée. Vérifie la session ET le rôle admin.
 */
async function initAppShell() {
  document.body.classList.add('admin-shell');
  await loadPartial('#site-header', 'partials/sidebar.html');
  highlightActiveNav();
  wireLogout();
  wireDrawer();

  try {
    const { user } = await apiGet('/users/me');
    if (user.role !== 'admin') {
      window.location.href = 'login.html';
      return null;
    }
    displayUserIdentity(user);
    return user;
  } catch (err) {
    return null; // apiGet redirige déjà vers login.html en cas de 401
  }
}
