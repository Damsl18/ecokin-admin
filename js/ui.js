function ensureToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'default') {
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function confirmAction(message) {
  return window.confirm(message);
}
