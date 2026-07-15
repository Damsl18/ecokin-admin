const KINSHASA_CENTER = [-4.325, 15.322];
let map;
let activeTab = 'points';
let pickMarker = null;
let pointMarkers = {};
let zoneCircles = {};

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tabs-inline button').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  document.getElementById('tab-points').style.display = tab === 'points' ? 'block' : 'none';
  document.getElementById('tab-zones').style.display = tab === 'zones' ? 'block' : 'none';
}

function resetPointForm() {
  document.getElementById('pointForm').reset();
  document.getElementById('pointId').value = '';
  document.getElementById('pointCoordsText').textContent = 'Clique sur la carte pour placer ce point.';
  if (pickMarker) { pickMarker.remove(); pickMarker = null; }
}
function resetZoneForm() {
  document.getElementById('zoneForm').reset();
  document.getElementById('zoneId').value = '';
  document.getElementById('zoneRayon').value = 100;
  document.getElementById('zoneCoordsText').textContent = 'Clique sur la carte pour placer cette zone.';
  if (pickMarker) { pickMarker.remove(); pickMarker = null; }
}

function onMapClick(e) {
  if (pickMarker) pickMarker.remove();
  pickMarker = L.marker(e.latlng).addTo(map);
  const text = `Position choisie : ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
  if (activeTab === 'points') {
    document.getElementById('pointCoordsText').textContent = text;
    document.getElementById('pointForm').dataset.lat = e.latlng.lat;
    document.getElementById('pointForm').dataset.lng = e.latlng.lng;
  } else {
    document.getElementById('zoneCoordsText').textContent = text;
    document.getElementById('zoneForm').dataset.lat = e.latlng.lat;
    document.getElementById('zoneForm').dataset.lng = e.latlng.lng;
  }
}

// ---------- Points de collecte ----------
async function loadPoints() {
  const tbody = document.getElementById('pointsTableBody');
  Object.values(pointMarkers).forEach((m) => m.remove());
  pointMarkers = {};
  try {
    const { points } = await apiGet('/points-collection');
    if (!points.length) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">Aucun point de collecte.</div></td></tr>`;
    } else {
      tbody.innerHTML = points.map((p) => `
        <tr>
          <td data-label="Nom">${escapeHtml(p.nom)}</td>
          <td data-label="Adresse">${escapeHtml(p.adresse)}</td>
          <td data-label="Type">${escapeHtml(p.type_dechet || '—')}</td>
          <td data-label="Actions">
            <div class="action-btns">
              <button class="btn btn-outline btn-sm" onclick='editPoint(${JSON.stringify(p)})'>Modifier</button>
              <button class="btn btn-outline btn-sm text-danger" onclick="deletePoint(${p.id})">Supprimer</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
    points.forEach((p) => {
      pointMarkers[p.id] = L.marker([p.latitude, p.longitude], {
        icon: L.divIcon({ className: '', html: '<i class="fa-solid fa-recycle" style="color:#2E7D32; font-size:20px;"></i>', iconSize: [20, 20] }),
      }).bindPopup(`<strong>${escapeHtml(p.nom)}</strong>`).addTo(map);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">${escapeHtml(err.message)}</div></td></tr>`;
  }
}

function editPoint(p) {
  switchTab('points');
  document.getElementById('pointId').value = p.id;
  document.getElementById('pointNom').value = p.nom;
  document.getElementById('pointAdresse').value = p.adresse;
  document.getElementById('pointType').value = p.type_dechet || '';
  document.getElementById('pointHoraires').value = p.horaires || '';
  document.getElementById('pointContact').value = p.contact || '';
  document.getElementById('pointForm').dataset.lat = p.latitude;
  document.getElementById('pointForm').dataset.lng = p.longitude;
  document.getElementById('pointCoordsText').textContent = `Position actuelle : ${p.latitude}, ${p.longitude} (clique sur la carte pour la changer)`;
  window.scrollTo({ top: document.getElementById('pointForm').offsetTop - 20, behavior: 'smooth' });
}

async function deletePoint(id) {
  if (!confirmAction('Supprimer ce point de collecte ?')) return;
  try {
    await apiDelete(`/points-collection/${id}`);
    showToast('Point de collecte supprimé.', 'success');
    loadPoints();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------- Zones à risque ----------
async function loadZones() {
  const tbody = document.getElementById('zonesTableBody');
  Object.values(zoneCircles).forEach((c) => c.remove());
  zoneCircles = {};
  try {
    const { zones } = await apiGet('/zones-risque');
    if (!zones.length) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">Aucune zone à risque.</div></td></tr>`;
    } else {
      tbody.innerHTML = zones.map((z) => `
        <tr>
          <td data-label="Nom">${escapeHtml(z.nom)}</td>
          <td data-label="Commune">${escapeHtml(z.commune || '—')}</td>
          <td data-label="Niveau">${escapeHtml(z.niveau_risque)}</td>
          <td data-label="Actions">
            <div class="action-btns">
              <button class="btn btn-outline btn-sm" onclick='editZone(${JSON.stringify(z)})'>Modifier</button>
              <button class="btn btn-outline btn-sm text-danger" onclick="deleteZone(${z.id})">Supprimer</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
    zones.forEach((z) => {
      zoneCircles[z.id] = L.circle([z.latitude, z.longitude], {
        radius: z.rayon_m, color: '#C0392B', fillColor: '#C0392B', fillOpacity: 0.15, weight: 1.5,
      }).bindPopup(`<strong>${escapeHtml(z.nom)}</strong>`).addTo(map);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">${escapeHtml(err.message)}</div></td></tr>`;
  }
}

function editZone(z) {
  switchTab('zones');
  document.getElementById('zoneId').value = z.id;
  document.getElementById('zoneNom').value = z.nom;
  document.getElementById('zoneCommune').value = z.commune || '';
  document.getElementById('zoneNiveau').value = z.niveau_risque;
  document.getElementById('zoneRayon').value = z.rayon_m;
  document.getElementById('zoneDescription').value = z.description || '';
  document.getElementById('zoneForm').dataset.lat = z.latitude;
  document.getElementById('zoneForm').dataset.lng = z.longitude;
  document.getElementById('zoneCoordsText').textContent = `Position actuelle : ${z.latitude}, ${z.longitude} (clique sur la carte pour la changer)`;
  window.scrollTo({ top: document.getElementById('zoneForm').offsetTop - 20, behavior: 'smooth' });
}

async function deleteZone(id) {
  if (!confirmAction('Supprimer cette zone à risque ?')) return;
  try {
    await apiDelete(`/zones-risque/${id}`);
    showToast('Zone à risque supprimée.', 'success');
    loadZones();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------- Référence : signalements validés ----------
async function loadReferenceSignalements() {
  try {
    const data = await apiGet('/map/data');
    data.signalements.forEach((s) => {
      L.circleMarker([s.latitude, s.longitude], {
        radius: 6, color: '#2D6CDF', fillColor: '#2D6CDF', fillOpacity: 0.6, weight: 1.5,
      }).bindPopup(`<strong>${escapeHtml(s.titre || 'Signalement')}</strong>`).addTo(map);
    });
  } catch (err) { /* silencieux : couche de référence uniquement */ }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAppShell();

  map = L.map('map').setView(KINSHASA_CENTER, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  map.on('click', onMapClick);

  loadReferenceSignalements();
  loadPoints();
  loadZones();

  document.getElementById('pointForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('pointId').value;
    const lat = form.dataset.lat, lng = form.dataset.lng;
    if (!lat || !lng) { showToast('Merci de choisir une position sur la carte.', 'error'); return; }

    const payload = {
      nom: document.getElementById('pointNom').value.trim(),
      adresse: document.getElementById('pointAdresse').value.trim(),
      latitude: lat, longitude: lng,
      type_dechet: document.getElementById('pointType').value.trim(),
      horaires: document.getElementById('pointHoraires').value.trim(),
      contact: document.getElementById('pointContact').value.trim(),
    };
    try {
      if (id) await apiPut(`/points-collection/${id}`, payload);
      else await apiPost('/points-collection', payload);
      showToast('Point de collecte enregistré.', 'success');
      resetPointForm();
      loadPoints();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('zoneForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('zoneId').value;
    const lat = form.dataset.lat, lng = form.dataset.lng;
    if (!lat || !lng) { showToast('Merci de choisir une position sur la carte.', 'error'); return; }

    const payload = {
      nom: document.getElementById('zoneNom').value.trim(),
      commune: document.getElementById('zoneCommune').value.trim(),
      niveau_risque: document.getElementById('zoneNiveau').value,
      rayon_m: document.getElementById('zoneRayon').value,
      description: document.getElementById('zoneDescription').value.trim(),
      latitude: lat, longitude: lng,
    };
    try {
      if (id) await apiPut(`/zones-risque/${id}`, payload);
      else await apiPost('/zones-risque', payload);
      showToast('Zone à risque enregistrée.', 'success');
      resetZoneForm();
      loadZones();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});
