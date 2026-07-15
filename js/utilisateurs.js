let usersCache = [];

async function loadUsers() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `<tr><td colspan="5"><div class="spinner" style="margin:1rem auto;"></div></td></tr>`;
  try {
    const { users } = await apiGet('/users');
    usersCache = users;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">Aucun utilisateur inscrit.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u) => `
      <tr>
        <td data-label="Nom">${escapeHtml(u.prenom)} ${escapeHtml(u.nom)}</td>
        <td data-label="Email">${escapeHtml(u.email)}</td>
        <td data-label="Commune">${escapeHtml(u.commune)}</td>
        <td data-label="Statut">${u.is_blocked ? '<span class="badge-statut badge-rejete">Bloqué</span>' : '<span class="badge-statut badge-valide">Actif</span>'}</td>
        <td data-label="Actions">
          <div class="action-btns">
            <button class="btn btn-outline btn-sm" onclick="viewUser(${u.id})">Voir</button>
            <button class="btn btn-outline btn-sm" onclick="toggleBlock(${u.id}, ${!u.is_blocked})">${u.is_blocked ? 'Débloquer' : 'Bloquer'}</button>
            <button class="btn btn-outline btn-sm text-danger" onclick="deleteUser(${u.id})">Supprimer</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">${escapeHtml(err.message)}</div></td></tr>`;
  }
}

function viewUser(id) {
  const u = usersCache.find((x) => x.id === id);
  if (!u) return;
  document.getElementById('modalSlot').innerHTML = `
    <div class="modal-backdrop-custom" id="userModal">
      <div class="modal-box">
        <h3 style="font-size:1.1rem;">${escapeHtml(u.prenom)} ${escapeHtml(u.nom)}</h3>
        <p><strong>Email :</strong> ${escapeHtml(u.email)}</p>
        <p><strong>Commune :</strong> ${escapeHtml(u.commune)}</p>
        <p><strong>Inscrit le :</strong> ${formatDate(u.date_inscription)}</p>
        <p><strong>Statut :</strong> ${u.is_blocked ? 'Bloqué' : 'Actif'}</p>
        <div class="d-flex justify-content-end"><button class="btn btn-outline" onclick="closeUserModal()">Fermer</button></div>
      </div>
    </div>
  `;
}
function closeUserModal() { document.getElementById('modalSlot').innerHTML = ''; }

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
  await initAppShell();
  loadUsers();
});
