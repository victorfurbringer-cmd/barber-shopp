const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'barber_cliente_token';

const authTabs = document.querySelectorAll('.auth-tab');
const authPanes = document.querySelectorAll('.auth-pane');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  usuario: null,
  servicos: [],
  barbeiros: [],
  agendamentos: [],
};

const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');

function setMessage(elementId, message, type = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message || '';
  element.className = `message ${type}`.trim();
}

function formatAgendamentoError(message = '') {
  const texto = String(message || '').toLowerCase();

  if (texto.includes('horário') || texto.includes('barbeiro')) {
    return 'Este horário já está indisponível para esse barbeiro. Escolha outro horário.';
  }

  if (texto.includes('cliente') || texto.includes('serviço')) {
    return 'Não foi possível realizar o agendamento. Verifique cliente, serviço e horário.';
  }

  return message || 'Não foi possível realizar o agendamento.';
}

function showAuthPane(name) {
  authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.authTab === name));
  authPanes.forEach((pane) => pane.classList.toggle('active', pane.id === `${name}Pane`));
}

function showView(name) {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  views.forEach((view) => view.classList.toggle('active', view.id === name));
}

function preencherSelect(elementId, items, placeholder, labelForItem) {
  const select = document.getElementById(elementId);
  const selectedValue = select.value;
  select.replaceChildren(new Option(placeholder, ''));

  items.forEach((item) => {
    select.add(new Option(labelForItem(item), item.id));
  });

  if (items.some((item) => String(item.id) === selectedValue)) {
    select.value = selectedValue;
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { mensagem: text };
  }

  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro na requisição.');
  }

  return data;
}

function saveToken(token) {
  state.token = token;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  state.token = '';
  localStorage.removeItem(TOKEN_KEY);
}

function renderUserBadge() {
  const userBadge = document.getElementById('userBadge');
  const welcomeText = document.getElementById('welcomeText');
  if (!state.usuario) {
    userBadge.textContent = 'Visitante';
    return;
  }
  userBadge.textContent = `${state.usuario.nome} (${state.usuario.tipo})`;
  welcomeText.textContent = `Bem-vindo, ${state.usuario.nome}`;
}

function renderSummary() {
  document.getElementById('totalAgendamentos').textContent = state.agendamentos.length;
  document.getElementById('totalServicos').textContent = state.servicos.length;

  const list = document.getElementById('pendingAppointments');
  list.innerHTML = '';

  if (!state.agendamentos.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum agendamento</strong></div></div>';
    return;
  }

  const upcoming = [...state.agendamentos]
    .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
    .slice(0, 5);

  upcoming.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${new Date(item.dataHora).toLocaleString('pt-BR')}</strong>
        <small>Barbeiro: ${item.barbeiro?.nome || item.barbeiroId} · Serviço: ${item.servico?.nome || item.servicoId}</small>
      </div>
      <span class="badge">${item.status}</span>
    `;
    list.appendChild(node);
  });
}

function renderServicos() {
  const list = document.getElementById('servicosList');
  list.innerHTML = '';

  if (!state.servicos.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum serviço disponível</strong></div></div>';
    return;
  }

  state.servicos.forEach((servico) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${servico.nome}</strong>
        <small>${servico.descricao || 'Sem descrição'} · ${servico.duracaoMinutos} min · R$ ${Number(servico.preco).toFixed(2)}</small>
      </div>
    `;
    list.appendChild(node);
  });
}

function renderAgendamentos() {
  const list = document.getElementById('agendamentosList');
  list.innerHTML = '';

  if (!state.agendamentos.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum agendamento encontrado</strong></div></div>';
    return;
  }

  state.agendamentos.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${new Date(item.dataHora).toLocaleString('pt-BR')}</strong>
        <small>Barbeiro: ${item.barbeiro?.nome || item.barbeiroId} · Serviço: ${item.servico?.nome || item.servicoId}</small>
      </div>
      <span class="badge">${item.status}</span>
    `;
    list.appendChild(node);
  });
}

async function loadDashboardData() {
  const [servicos, barbeiros, agendamentos] = await Promise.all([
    apiRequest('/servicos', { headers: { Authorization: `Bearer ${state.token}` } }),
    apiRequest('/barbeiros', { headers: { Authorization: `Bearer ${state.token}` } }),
    apiRequest('/agendamentos', { headers: { Authorization: `Bearer ${state.token}` } }),
  ]);

  state.servicos = servicos;
  state.barbeiros = barbeiros;
  state.agendamentos = agendamentos;

  preencherSelect('barbeiroId', barbeiros, 'Selecione um barbeiro', (barbeiro) => barbeiro.nome);
  preencherSelect('servicoId', servicos, 'Selecione um serviço', (servico) => `${servico.nome} · R$ ${Number(servico.preco).toFixed(2)}`);

  renderServicos();
  renderAgendamentos();
  renderSummary();
}

async function checkSession() {
  if (!state.token) {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    return;
  }

  try {
    const data = await apiRequest('/auth/me', {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    if (data.usuario.tipo !== 'CLIENTE') {
      throw new Error('Esta área é somente para clientes.');
    }
    state.usuario = data.usuario;
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    renderUserBadge();
    await loadDashboardData();
  } catch (error) {
    clearToken();
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    setMessage('loginMensagem', 'Sessão expirada, faça login novamente.', 'error');
  }
}

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => showAuthPane(tab.dataset.authTab));
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    email: document.getElementById('loginEmail').value.trim(),
    senha: document.getElementById('loginSenha').value,
  };

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.usuario.tipo !== 'CLIENTE') {
      throw new Error('Acesso restrito para clientes.');
    }

    saveToken(data.token);
    state.usuario = data.usuario;
    setMessage('loginMensagem', 'Login realizado com sucesso!', 'success');
    document.getElementById('loginForm').reset();
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    renderUserBadge();
    await loadDashboardData();
  } catch (error) {
    setMessage('loginMensagem', error.message, 'error');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    nome: document.getElementById('registerNome').value.trim(),
    email: document.getElementById('registerEmail').value.trim(),
    senha: document.getElementById('registerSenha').value,
  };

  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setMessage('registerMensagem', 'Cadastro realizado com sucesso! Faça login.', 'success');
    document.getElementById('registerForm').reset();
    showAuthPane('login');
  } catch (error) {
    setMessage('registerMensagem', error.message, 'error');
  }
});

document.getElementById('logoutButton').addEventListener('click', () => {
  clearToken();
  state.usuario = null;
  state.servicos = [];
  state.agendamentos = [];
  authScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
  showAuthPane('login');
});

document.getElementById('agendamentoForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/agendamentos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({
        barbeiroId: Number(document.getElementById('barbeiroId').value),
        servicoId: Number(document.getElementById('servicoId').value),
        dataHora: document.getElementById('dataHora').value,
        observacoes: document.getElementById('observacoes').value.trim(),
      }),
    });

    setMessage('agendamentoMensagem', 'Agendamento realizado com sucesso!', 'success');
    document.getElementById('agendamentoForm').reset();
    await loadDashboardData();
  } catch (error) {
    setMessage('agendamentoMensagem', formatAgendamentoError(error.message), 'error');
  }
});

showAuthPane('login');
showView('home');
checkSession();
