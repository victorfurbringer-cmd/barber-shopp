const API_URL = window.location.origin;

const form = document.getElementById('recoveryForm');
const button = document.getElementById('recoveryButton');
const message = document.getElementById('recoveryMessage');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  message.className = 'message';
  message.textContent = 'Enviando solicitação…';

  try {
    const response = await fetch(`${API_URL}/auth/solicitar-redefinicao-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('recoveryEmail').value.trim() }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.mensagem || 'Não foi possível enviar a solicitação.');
    message.className = 'message success';
    message.textContent = data.mensagem;
    form.reset();
  } catch (error) {
    message.className = 'message error';
    message.textContent = error.message || 'Não foi possível enviar a solicitação.';
  } finally {
    button.disabled = false;
  }
});
