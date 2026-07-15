let articlesCache = [];

function actionButtons(a) {
  const btns = [];
  btns.push(`<button class="btn btn-outline btn-sm" onclick="viewArticle(${a.id})">Voir</button>`);
  if (a.statut === 'en_attente') {
    btns.push(`<button class="btn btn-primary btn-sm" onclick="changeStatut(${a.id}, 'publie')">Publier</button>`);
    btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="changeStatut(${a.id}, 'rejete')">Rejeter</button>`);
  }
  if (a.statut === 'publie') {
    btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="changeStatut(${a.id}, 'rejete')">Dépublier</button>`);
  }
  btns.push(`<button class="btn btn-outline btn-sm text-danger" onclick="deleteArticle(${a.id})">Supprimer</button>`);
  return `<div class="action-btns">${btns.join('')}</div>`;
}

async function loadArticles() {
  const tbody = document.getElementById('tableBody');
  const statut = document.getElementById('statutFilter').value;
  tbody.innerHTML = `<tr><td colspan="5"><div class="spinner" style="margin:1rem auto;"></div></td></tr>`;
  try {
    const params = statut ? `?statut=${statut}` : '';
    const { articles } = await apiGet(`/articles${params}`);
    articlesCache = articles;

    if (!articles.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">Aucun article pour ce filtre.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = articles.map((a) => `
      <tr>
        <td data-label="Titre">${escapeHtml(a.titre)}</td>
        <td data-label="Auteur">${escapeHtml(a.auteur_prenom)} ${escapeHtml(a.auteur_nom)}</td>
        <td data-label="Date">${formatDate(a.date_creation)}</td>
        <td data-label="Statut"><span class="badge-statut badge-${a.statut}">${STATUT_LABELS_ARTICLE[a.statut] || a.statut}</span></td>
        <td data-label="Actions">${actionButtons(a)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">${escapeHtml(err.message)}</div></td></tr>`;
  }
}

function viewArticle(id) {
  const a = articlesCache.find((x) => x.id === id);
  if (!a) return;
  document.getElementById('modalSlot').innerHTML = `
    <div class="modal-backdrop-custom" id="articleModal">
      <div class="modal-box" style="max-width:640px;">
        <h3 style="font-size:1.15rem;">${escapeHtml(a.titre)}</h3>
        <p class="article-card__meta">${escapeHtml(a.auteur_prenom)} ${escapeHtml(a.auteur_nom)} · ${formatDate(a.date_creation)}</p>
        ${a.cover_image_path ? `<img src="${photoUrl(a.cover_image_path)}" alt="" style="width:100%; border-radius:10px; margin-bottom:0.8rem;">` : ''}
        <div class="article-body">${a.contenu}</div>
        <div class="d-flex justify-content-end mt-3"><button class="btn btn-outline" onclick="closeArticleModal()">Fermer</button></div>
      </div>
    </div>
  `;
}
function closeArticleModal() { document.getElementById('modalSlot').innerHTML = ''; }

async function changeStatut(id, statut) {
  try {
    await apiPatch(`/articles/${id}/statut`, { statut });
    showToast('Statut mis à jour.', 'success');
    loadArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteArticle(id) {
  if (!confirmAction('Supprimer définitivement cet article ?')) return;
  try {
    await apiDelete(`/articles/${id}`);
    showToast('Article supprimé.', 'success');
    loadArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAppShell();
  const params = new URLSearchParams(window.location.search);
  if (params.get('statut')) document.getElementById('statutFilter').value = params.get('statut');
  loadArticles();
  document.getElementById('statutFilter').addEventListener('change', loadArticles);
});
