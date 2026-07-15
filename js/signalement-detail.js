function getIdFromQuery() { return new URLSearchParams(window.location.search).get('id'); }
const signalementId = getIdFromQuery();

function actionButtons(s) {
  const btns = [];
  if (s.statut === 'en_attente') {
    btns.push(`<button class="btn btn-primary btn-sm" onclick="changeStatut('valide')">Valider</button>`);
    btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="openRejectModal()">Rejeter</button>`);
  }
  if (s.statut === 'valide') {
    btns.push(`<button class="btn btn-primary btn-sm" onclick="changeStatut('en_cours')">Marquer en cours</button>`);
    btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="openRejectModal()">Rejeter</button>`);
  }
  if (s.statut === 'en_cours') {
    btns.push(`<button class="btn btn-primary btn-sm" onclick="changeStatut('traite')">Marquer traité</button>`);
  }
  btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="deleteSignalement()">Supprimer</button>`);
  return `<div class="action-btns mt-3">${btns.join('')}</div>`;
}

async function loadDetail() {
  const wrap = document.getElementById('detailContent');
  if (!signalementId) { wrap.innerHTML = `<div class="empty-state">Signalement introuvable.</div>`; return; }

  try {
    const { signalement: s } = await apiGet(`/signalements/${signalementId}`);
    wrap.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
        <h1 style="font-size:1.3rem;">${escapeHtml(s.titre || 'Signalement')}</h1>
        <span class="badge-statut badge-${s.statut}">${STATUT_LABELS_SIGNALEMENT[s.statut] || s.statut}</span>
      </div>
      <p>${escapeHtml(s.description)}</p>
      <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(s.adresse)}</p>
      <p class="article-card__meta">Créé le ${formatDateTime(s.date_creation)}</p>
      ${s.motif_rejet ? `<p class="text-danger">Motif du rejet : ${escapeHtml(s.motif_rejet)}</p>` : ''}
      ${s.photo_path ? `<img src="${photoUrl(s.photo_path)}" alt="" style="width:100%; border-radius:12px; margin-bottom:1rem;">` : ''}
      <div class="mini-map mb-3" id="map"></div>
      ${actionButtons(s)}
    `;
    const map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([s.latitude, s.longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.marker([s.latitude, s.longitude]).addTo(map);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

async function changeStatut(statut) {
  try {
    await apiPatch(`/signalements/${signalementId}/statut`, { statut });
    showToast('Statut mis à jour.', 'success');
    loadDetail();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openRejectModal() {
  document.getElementById('modalSlot').innerHTML = `
    <div class="modal-backdrop-custom" id="rejectModal">
      <div class="modal-box">
        <h3 style="font-size:1.1rem;">Motif du rejet</h3>
        <textarea class="form-control mb-3" id="motifRejet" rows="3" placeholder="Explique pourquoi ce signalement est rejeté…"></textarea>
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-ghost" onclick="closeRejectModal()">Annuler</button>
          <button class="btn btn-primary" onclick="confirmReject()">Confirmer le rejet</button>
        </div>
      </div>
    </div>
  `;
}
function closeRejectModal() { document.getElementById('modalSlot').innerHTML = ''; }

async function confirmReject() {
  const motif = document.getElementById('motifRejet').value.trim();
  if (!motif) { showToast('Le motif de rejet est requis.', 'error'); return; }
  try {
    await apiPatch(`/signalements/${signalementId}/statut`, { statut: 'rejete', motif_rejet: motif });
    showToast('Signalement rejeté.', 'success');
    closeRejectModal();
    loadDetail();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSignalement() {
  if (!confirmAction('Supprimer définitivement ce signalement ?')) return;
  try {
    await apiDelete(`/signalements/${signalementId}`);
    showToast('Signalement supprimé.', 'success');
    window.location.href = 'signalements.html';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAppShell();
  loadDetail();
});
