function actionButtons(s) {
  const btns = [];
  if (s.statut === 'en_attente') {
    btns.push(`<button class="btn btn-outline btn-sm" onclick="changeStatut(${s.id}, 'valide')">Valider</button>`);
    btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="openRejectModal(${s.id})">Rejeter</button>`);
  }
  if (s.statut === 'valide') {
    btns.push(`<button class="btn btn-outline btn-sm" onclick="changeStatut(${s.id}, 'en_cours')">Marquer en cours</button>`);
    btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="openRejectModal(${s.id})">Rejeter</button>`);
  }
  if (s.statut === 'en_cours') {
    btns.push(`<button class="btn btn-outline btn-sm" onclick="changeStatut(${s.id}, 'traite')">Marquer traité</button>`);
  }
  btns.push(`<a class="btn btn-outline btn-sm" href="signalement-detail.html?id=${s.id}">Voir</a>`);
  btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="deleteSignalement(${s.id})">Supprimer</button>`);
  return `<div class="action-btns">${btns.join('')}</div>`;
}

async function loadSignalements() {
  const tbody = document.getElementById('tableBody');
  const statut = document.getElementById('statutFilter').value;
  const commune = document.getElementById('communeFilter').value.trim();
  tbody.innerHTML = `<tr><td colspan="5"><div class="spinner" style="margin:1rem auto;"></div></td></tr>`;

  try {
    const params = new URLSearchParams();
    if (statut) params.set('statut', statut);
    if (commune) params.set('commune', commune);
    const { signalements } = await apiGet(`/signalements?${params}`);

    if (!signalements.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">Aucun signalement pour ce filtre.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = signalements.map((s) => `
      <tr>
        <td data-label="Description">${escapeHtml((s.description || '').slice(0, 60))}${s.description.length > 60 ? '…' : ''}</td>
        <td data-label="Adresse">${escapeHtml(s.adresse)}</td>
        <td data-label="Date">${formatDate(s.date_creation)}</td>
        <td data-label="Statut"><span class="badge-statut badge-${s.statut}">${STATUT_LABELS_SIGNALEMENT[s.statut] || s.statut}</span></td>
        <td data-label="Actions">${actionButtons(s)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">${escapeHtml(err.message)}</div></td></tr>`;
  }
}

async function changeStatut(id, statut) {
  try {
    await apiPatch(`/signalements/${id}/statut`, { statut });
    showToast('Statut mis à jour.', 'success');
    loadSignalements();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openRejectModal(id) {
  document.getElementById('modalSlot').innerHTML = `
    <div class="modal-backdrop-custom" id="rejectModal">
      <div class="modal-box">
        <h3 style="font-size:1.1rem;">Motif du rejet</h3>
        <textarea class="form-control mb-3" id="motifRejet" rows="3" placeholder="Explique pourquoi ce signalement est rejeté…"></textarea>
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-ghost" onclick="closeRejectModal()">Annuler</button>
          <button class="btn btn-primary" onclick="confirmReject(${id})">Confirmer le rejet</button>
        </div>
      </div>
    </div>
  `;
}
function closeRejectModal() { document.getElementById('modalSlot').innerHTML = ''; }

async function confirmReject(id) {
  const motif = document.getElementById('motifRejet').value.trim();
  if (!motif) { showToast('Le motif de rejet est requis.', 'error'); return; }
  try {
    await apiPatch(`/signalements/${id}/statut`, { statut: 'rejete', motif_rejet: motif });
    showToast('Signalement rejeté.', 'success');
    closeRejectModal();
    loadSignalements();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSignalement(id) {
  if (!confirmAction('Supprimer définitivement ce signalement ?')) return;
  try {
    await apiDelete(`/signalements/${id}`);
    showToast('Signalement supprimé.', 'success');
    loadSignalements();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAppShell();
  const params = new URLSearchParams(window.location.search);
  if (params.get('statut')) document.getElementById('statutFilter').value = params.get('statut');

  loadSignalements();
  document.getElementById('statutFilter').addEventListener('change', loadSignalements);
  document.getElementById('communeFilter').addEventListener('input', () => {
    clearTimeout(window._communeDebounce);
    window._communeDebounce = setTimeout(loadSignalements, 400);
  });
});
