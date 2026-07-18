let usersCache = [];
let currentAdminId = null;

async function loadUsers() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `<tr><td colspan="6"><div class="spinner" style="margin:1rem auto;"></div></td></tr>`;
  try {
    const { users } = await apiGet('/users');
    usersCache = users;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">Aucun utilisateur inscrit.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u) => `
      <tr>
        <td data-label="Nom">${escapeHtml(u.prenom)} ${escapeHtml(u.nom)}</td>
        <td data-label="Email">${escapeHtml(u.email)}</td>
        <td data-label="Commune">${escapeHtml(u.commune)}</td>
        <td data-label="Rôle">${u.role === 'admin' ? '<span class="badge-statut badge-en_cours">Admin</span>' : '<span class="badge-statut badge-en_attente">Utilisateur</span>'}</td>
        <td data-label="Statut">${u.is_blocked ? '<span class="badge-statut badge-rejete">Bloqué</span>' : '<span class="badge-statut badge-valide">Actif</span>'}</td>
        <td data-label="Actions">
          <div class="action-btns">
            <button class="btn btn-outline btn-sm" onclick="openEditUser(${u.id})">Modifier</button>
            <button class="btn btn-outline btn-sm" onclick="toggleBlock(${u.id}, ${!u.is_blocked})">${u.is_blocked ? 'Débloquer' : 'Bloquer'}</button>
            <button class="btn btn-outline btn-sm text-danger" onclick="deleteUser(${u.id})">Supprimer</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">${escapeHtml(err.message)}</div></td></tr>`;
  }
}

function closeUserModal() { document.getElementById('modalSlot').innerHTML = ''; }

function userFormModal({ title, u, isNew }) {
  return `
    <div class="modal-backdrop-custom" id="userModal">
      <div class="modal-box">
        <h3 style="font-size:1.1rem;">${title}</h3>
        <form id="userForm">
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Prénom</label><input class="form-control" id="uf_prenom" value="${u ? escapeHtml(u.prenom) : ''}" required></div>
            <div class="col-6"><label class="form-label">Nom</label><input class="form-control" id="uf_nom" value="${u ? escapeHtml(u.nom) : ''}" required></div>
            <div class="col-12"><label class="form-label">Email</label><input type="email" class="form-control" id="uf_email" value="${u ? escapeHtml(u.email) : ''}" required></div>
            <div class="col-6"><label class="form-label">Commune</label><input class="form-control" id="uf_commune" value="${u ? escapeHtml(u.commune) : ''}" required></div>
            <div class="col-6">
              <label class="form-label">Rôle</label>
              <select class="form-select" id="uf_role">
                <option value="user" ${u && u.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                <option value="admin" ${u && u.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
            ${isNew ? `<div class="col-12"><label class="form-label">Mot de passe</label><input type="password" class="form-control" id="uf_password" minlength="6" required></div>` : ''}
          </div>
          <div id="userFormError" class="text-danger mt-2" style="font-size:0.85rem; display:none;"></div>
          <div class="d-flex gap-2 justify-content-end mt-3">
            <button class="btn btn-ghost" type="button" onclick="closeUserModal()">Annuler</button>
            <button class="btn btn-primary" type="submit">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function openNewUser() {
  document.getElementById('modalSlot').innerHTML = userFormModal({ title: 'Nouvel utilisateur', u: null, isNew: true });
  wireUserForm(null);
}

function openEditUser(id) {
  const u = usersCache.find((x) => x.id === id);
  if (!u) return;
  document.getElementById('modalSlot').innerHTML = userFormModal({ title: 'Modifier l\'utilisateur', u, isNew: false });
  wireUserForm(u);
}

function wireUserForm(existingUser) {
  const form = document.getElementById('userForm');
  const errorBox = document.getElementById('userFormError');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const payload = {
      prenom: document.getElementById('uf_prenom').value.trim(),
      nom: document.getElementById('uf_nom').value.trim(),
      email: document.getElementById('uf_email').value.trim(),
      commune: document.getElementById('uf_commune').value.trim(),
      role: document.getElementById('uf_role').value,
    };

    try {
      if (existingUser) {
        await apiPut(`/users/${existingUser.id}`, payload);
        showToast('Utilisateur mis à jour.', 'success');
      } else {
        payload.password = document.getElementById('uf_password').value;
        await apiPost('/users', payload);
        showToast('Utilisateur créé.', 'success');
      }
      closeUserModal();
      loadUsers();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });
}

async function toggleBlock(id, blocked) {
  try {
    await apiPatch(`/users/${id}/block`, { blocked });
    showToast(blocked ? 'Utilisateur bloqué.' : 'Utilisateur débloqué.', 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(id) {
  if (!confirmAction("Supprimer définitivement ce compte ? Cette action est irréversible.")) return;
  try {
    await apiDelete(`/users/${id}`);
    showToast('Utilisateur supprimé.', 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const admin = await initAppShell();
  currentAdminId = admin ? admin.id : null;
  document.getElementById('newUserBtn').addEventListener('click', openNewUser);
  loadUsers();
});
