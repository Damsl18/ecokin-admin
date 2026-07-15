document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';

    try {
      const { user } = await apiPost('/auth/login', {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      });

      if (user.role !== 'admin') {
        errorBox.textContent = "Ce compte n'a pas les droits administrateur.";
        errorBox.style.display = 'block';
        await apiPost('/auth/logout');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
        return;
      }

      window.location.href = 'dashboard.html';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    }
  });
});
