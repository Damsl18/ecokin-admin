function alertCard({ icon, title, text, href, label }) {
  return `
    <div class="alert-card">
      <div class="alert-card__icon"><i class="fa-solid ${icon}"></i></div>
      <div class="alert-card__body">
        <h3>${title}</h3>
        <p>${text}</p>
        <a href="${href}" class="btn btn-primary btn-sm">${label}</a>
      </div>
    </div>
  `;
}

function emptyOkCard(text) {
  return `
    <div class="empty-ok-card">
      <div class="empty-ok-card__icon"><i class="fa-solid fa-circle-check"></i></div>
      <p>${text}</p>
    </div>
  `;
}

async function loadDashboard() {
  try {
    const { widgets } = await apiGet('/dashboard/admin');

    document.getElementById('widgetsGrid').innerHTML = `
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-users"></i></div><div class="widget__num">${widgets.total_utilisateurs}</div><div class="widget__label">Utilisateurs</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="widget__num">${widgets.total_signalements}</div><div class="widget__label">Signalements</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-newspaper"></i></div><div class="widget__num">${widgets.total_articles}</div><div class="widget__label">Articles</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-hourglass-half"></i></div><div class="widget__num">${widgets.signalements_en_attente}</div><div class="widget__label">Signalements en attente</div></div>
    `;

    document.getElementById('widgetsGrid7j').innerHTML = `
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-user-plus"></i></div><div class="widget__num">${widgets.nouveaux_utilisateurs_7j}</div><div class="widget__label">Nouveaux utilisateurs (7j)</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-map-pin"></i></div><div class="widget__num">${widgets.signalements_7j}</div><div class="widget__label">Signalements créés (7j)</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-newspaper"></i></div><div class="widget__num">${widgets.articles_publies_7j}</div><div class="widget__label">Articles publiés (7j)</div></div>
    `;

    // Les cartes d'alerte ne s'affichent QUE si le compteur réel est > 0
    // (auparavant elles étaient toujours visibles, même à zéro — bug corrigé ici).
    const alertsZone = document.getElementById('alertsZone');
    const cards = [];

    if (widgets.signalements_en_attente > 0) {
      cards.push(alertCard({
        icon: 'fa-triangle-exclamation',
        title: 'Signalements en attente',
        text: `${widgets.signalements_en_attente} signalement${widgets.signalements_en_attente > 1 ? 's' : ''} en attente de validation.`,
        href: 'signalements.html?statut=en_attente',
        label: "Voir la file d'attente",
      }));
    }
    if (widgets.articles_en_attente > 0) {
      cards.push(alertCard({
        icon: 'fa-newspaper',
        title: 'Articles en attente',
        text: `${widgets.articles_en_attente} article${widgets.articles_en_attente > 1 ? 's' : ''} en attente de modération.`,
        href: 'articles.html?statut=en_attente',
        label: "Voir la file d'attente",
      }));
    }

    if (!cards.length) {
      alertsZone.innerHTML = emptyOkCard('Aucun signalement ni article en attente — tout est à jour.');
    } else {
      alertsZone.innerHTML = cards.join('');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAppShell();
  loadDashboard();
});
