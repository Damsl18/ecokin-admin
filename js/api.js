/**
 * Wrapper fetch pour l'espace utilisateur.
 * Toutes les requêtes envoient les cookies de session (credentials: 'include').
 */
const PUBLIC_PAGES = ['login.html'];

function currentPageName() {
  return window.location.pathname.split('/').pop() || 'login.html';
}

function redirectToLogin() {
  if (!PUBLIC_PAGES.includes(currentPageName())) {
    window.location.href = 'login.html';
  }
}

async function apiRequest(path, { method = 'GET', body, isFormData = false } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: {},
  };
  if (body !== undefined) {
    if (isFormData) {
      options.body = body; // FormData : ne pas fixer Content-Type, le navigateur s'en charge
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    redirectToLogin();
    throw new Error(data.error || 'Session expirée.');
  }
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

const apiGet = (path) => apiRequest(path);
const apiPost = (path, body, isFormData = false) => apiRequest(path, { method: 'POST', body, isFormData });
const apiPut = (path, body, isFormData = false) => apiRequest(path, { method: 'PUT', body, isFormData });
const apiPatch = (path, body) => apiRequest(path, { method: 'PATCH', body });
const apiDelete = (path) => apiRequest(path, { method: 'DELETE' });

function photoUrl(path) {
  if (!path) return null;
  return `${CONFIG.UPLOADS_BASE_URL}${path}`;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

const STATUT_LABELS_SIGNALEMENT = {
  en_attente: 'En attente', valide: 'Validé', en_cours: 'En cours', traite: 'Traité', rejete: 'Rejeté',
};
const STATUT_LABELS_ARTICLE = {
  en_attente: 'En attente', publie: 'Publié', rejete: 'Rejeté',
};
