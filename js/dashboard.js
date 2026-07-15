async function loadDashboard() {
  try {
    const { widgets } = await apiGet('/dashboard/admin');
    document.getElementById('widgetsGrid').innerHTML = `
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-users"></i></div><div class="widget__num">${widgets.total_utilisateurs}</div><div class="widget__label">Utilisateurs</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="widget__num">${widgets.total_signalements}</div><div class="widget__label">Signalements</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-newspaper"></i></div><div class="widget__num">${widgets.total_articles}</div><div class="widget__label">Articles</div></div>
      <div class="widget"><div class="widget__icon"><i class="fa-solid fa-hourglass-half"></i></div><div class="widget__num">${widgets.signalements_en_attente}</div><div class="widget__label">En attente</div></div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAppShell();
  loadDashboard();
});
