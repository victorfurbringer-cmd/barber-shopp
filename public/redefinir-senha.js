const API_URL = window.location.origin;
const token = new URLSearchParams(window.location.search).get('token') || '';
const form = document.getElementById('resetForm');
const button = document.getElementById('resetButton');
const message = document.getElementById('resetMessage');
const loginLink = document.getElementById('loginLink');

window.history.replaceState({}, document.title, window.location.pathname);

async function verificarToken() {
  try {
    const response = await fetch(`${API_URL}/auth/verificar-token-redefinicao?token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (!response.ok || !data.valido) {
      message.className = 'message error';
      message.textContent = 'Este link é inválido ou expirou. Solicite uma nova recuperação de senha.';
      loginLink.classList.remove('hidden');
      return;
    }

    message.textContent = '';
    form.classList.remove('hidden');
  } catch {
    message.className = 'message error';
    message.textContent = 'Não foi possível verificar o link. Tente novamente mais tarde.';
    loginLink.classList.remove('hidden');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const senha = document.getElementById('newPassword').value;
  const confirmacao = document.getElementById('confirmPassword').value;

  if (senha !== confirmacao) {
    message.className = 'message error';
    message.textContent = 'As senhas não coincidem.';
    return;
  }

  button.disabled = true;
  message.className = 'message';
  message.textContent = 'Salvando nova senha…';

  try {
    const response = await fetch(`${API_URL}/auth/redefinir-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.mensagem || 'Não foi possível alterar a senha.');
    form.reset();
    form.classList.add('hidden');
    message.className = 'message success';
    message.textContent = data.mensagem;
    loginLink.classList.remove('hidden');
  } catch (error) {
    message.className = 'message error';
    message.textContent = error.message || 'Não foi possível alterar a senha.';
  } finally {
    button.disabled = false;
  }
});

verificarToken();
