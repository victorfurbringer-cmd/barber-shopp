const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'barber_token';

const authTabs = document.querySelectorAll('.auth-tab');
const authPanes = document.querySelectorAll('.auth-pane');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  usuario: null,
  servicos: [],
  clientes: [],
  barbeiros: [],
  agendamentos: [],
};

function setMessage(elementId, message, type = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message || '';
  element.className = `message ${type}`.trim();
}

function showAuthPane(name) {
  authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.authTab === name));
  authPanes.forEach((pane) => pane.classList.toggle('active', pane.id === `${name}Pane`));
}

function showView(name) {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  views.forEach((view) => view.classList.toggle('active', view.id === name));
}

function hideAllViewsExcept(name) {
  navButtons.forEach((button) => {
    const shouldShow = button.dataset.view === name;
    button.classList.toggle('active', shouldShow);
  });

  views.forEach((view) => {
    view.classList.toggle('active', view.id === name);
  });
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
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

function isAdmin() {
  return !!state.usuario && state.usuario.tipo === 'ADMIN';
}

function isCliente() {
  return !!state.usuario && state.usuario.tipo === 'CLIENTE';
}

function applyRoleLayout() {
  const adminOnlyViews = ['servicos', 'clientes', 'barbeiros'];
  const allowedViews = isAdmin() ? ['home', 'servicos', 'clientes', 'barbeiros', 'agendamentos'] : ['home', 'servicos', 'agendamentos'];

  navButtons.forEach((button) => {
    const isAllowed = allowedViews.includes(button.dataset.view);
    button.style.display = isAllowed ? 'block' : 'none';
  });

  adminOnlyViews.forEach((viewName) => {
    const section = document.getElementById(viewName);
    if (section) {
      section.style.display = isAdmin() ? 'block' : 'none';
    }
  });

  if (!isAdmin() && views[0] && views[0].id === 'home') {
    showView('home');
  }

  const clienteIdField = document.getElementById('clienteId');
  if (clienteIdField) {
    const clienteId = state.clientes?.[0]?.id || '';
    clienteIdField.value = isCliente() ? clienteId : '';
    clienteIdField.readOnly = isCliente();
    clienteIdField.disabled = isCliente() ? false : false;
  }
}

function renderUserBadge() {
  const userBadge = document.getElementById('userBadge');
  if (!state.usuario) {
    userBadge.textContent = 'Visitante';
    return;
  }

  userBadge.textContent = `${state.usuario.nome} (${state.usuario.tipo})`;
  document.getElementById('welcomeText').textContent = `Bem-vindo, ${state.usuario.nome}`;
  applyRoleLayout();
}

function goToDashboard() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  hideAllViewsExcept('home');
  renderUserBadge();
}

function getAgendamentosVisiveis() {
  if (!state.usuario) return [];

  if (isCliente()) {
    const clienteId = state.clientes?.[0]?.id;
    return [...state.agendamentos].filter((item) => Number(item.clienteId) === Number(clienteId));
  }

  return [...state.agendamentos];
}

function renderSummary() {
  const agendamentosVisiveis = getAgendamentosVisiveis();

  document.getElementById('totalAgendamentos').textContent = agendamentosVisiveis.length;
  document.getElementById('totalServicos').textContent = isCliente() ? state.servicos.length : state.servicos.length;
  document.getElementById('totalClientes').textContent = isCliente() ? state.clientes.length : state.clientes.length;
  document.getElementById('totalBarbeiros').textContent = isCliente() ? 0 : state.barbeiros.length;

  const upcoming = [...agendamentosVisiveis]
    .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
    .slice(0, 5);

  const pendingList = document.getElementById('pendingAppointments');
  pendingList.innerHTML = '';

  if (!upcoming.length) {
    pendingList.innerHTML = '<div class="list-item"><div><strong>Nenhum agendamento</strong></div></div>';
    return;
  }

  upcoming.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${new Date(item.dataHora).toLocaleString('pt-BR')}</strong>
        <small>Cliente: ${item.cliente?.nome || item.clienteId} · Barbeiro: ${item.barbeiro?.nome || item.barbeiroId}</small>
      </div>
      <span class="badge">${item.status}</span>
    `;
    pendingList.appendChild(node);
  });
}

function renderServicos() {
  const list = document.getElementById('servicosList');
  list.innerHTML = '';

  if (!state.servicos.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum serviço cadastrado</strong></div></div>';
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

function renderClientes() {
  const list = document.getElementById('clientesList');
  list.innerHTML = '';

  if (!state.clientes.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum cliente cadastrado</strong></div></div>';
    return;
  }

  state.clientes.forEach((cliente) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${cliente.nome}</strong>
        <small>${cliente.email} · ${cliente.telefone || 'Sem telefone'} · CPF: ${cliente.cpf || 'Não informado'}</small>
      </div>
    `;
    list.appendChild(node);
  });
}

function renderBarbeiros() {
  const list = document.getElementById('barbeirosList');
  list.innerHTML = '';

  if (!state.barbeiros.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum barbeiro cadastrado</strong></div></div>';
    return;
  }

  state.barbeiros.forEach((barbeiro) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${barbeiro.nome}</strong>
        <small>${barbeiro.email} · ${barbeiro.telefone || 'Sem telefone'}</small>
      </div>
    `;
    list.appendChild(node);
  });
}

function renderAgendamentos() {
  const list = document.getElementById('agendamentosList');
  list.innerHTML = '';

  const agendamentosExibicao = getAgendamentosVisiveis();

  if (!agendamentosExibicao.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum agendamento cadastrado</strong></div></div>';
    return;
  }

  agendamentosExibicao.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${new Date(item.dataHora).toLocaleString('pt-BR')}</strong>
        <small>Cliente ${item.cliente?.nome || item.clienteId} · Barbeiro ${item.barbeiro?.nome || item.barbeiroId} · Serviço ${item.servico?.nome || item.servicoId}</small>
      </div>
      <span class="badge">${item.status}</span>
    `;
    list.appendChild(node);
  });
}

async function loadDashboardData() {
  try {
    const [servicos, clientes, barbeiros, agendamentos] = await Promise.all([
      apiRequest('/servicos', { headers: { Authorization: `Bearer ${state.token}` } }),
      apiRequest('/clientes', { headers: { Authorization: `Bearer ${state.token}` } }),
      apiRequest('/barbeiros', { headers: { Authorization: `Bearer ${state.token}` } }),
      apiRequest('/agendamentos', { headers: { Authorization: `Bearer ${state.token}` } }),
    ]);

    state.servicos = servicos;
    state.clientes = clientes;
    state.barbeiros = barbeiros;
    state.agendamentos = agendamentos;

    const clienteIdField = document.getElementById('clienteId');
    if (clienteIdField && isCliente()) {
      clienteIdField.value = state.clientes?.[0]?.id || '';
      clienteIdField.readOnly = true;
    }

    renderServicos();
    renderClientes();
    renderBarbeiros();
    renderAgendamentos();
    renderSummary();
    applyRoleLayout();
  } catch (error) {
    console.error(error);
  }
}

async function checkSession() {
  if (!state.token) {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
    return;
  }

  try {
    const data = await apiRequest('/auth/me', {
      headers: { Authorization: `Bearer ${state.token}` },
    });

    state.usuario = data.usuario;
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    renderUserBadge();
    await loadDashboardData();
  } catch (error) {
    clearToken();
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
    setMessage('loginMensagem', 'Sessão expirada, faça login novamente.', 'error');
  }
}

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => showAuthPane(tab.dataset.authTab));
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

document.getElementById('logoutButton').addEventListener('click', () => {
  clearToken();
  state.usuario = null;
  state.servicos = [];
  state.clientes = [];
  state.barbeiros = [];
  state.agendamentos = [];
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
  showAuthPane('login');
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

    saveToken(data.token);
    state.usuario = data.usuario;
    setMessage('loginMensagem', 'Login realizado com sucesso!', 'success');
    document.getElementById('loginForm').reset();
    goToDashboard();
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
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setMessage('registerMensagem', data.mensagem || 'Cadastro realizado!', 'success');
    document.getElementById('registerForm').reset();
    showAuthPane('login');
  } catch (error) {
    setMessage('registerMensagem', error.message, 'error');
  }
});

document.getElementById('servicoForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/servicos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({
        nome: document.getElementById('servicoNome').value.trim(),
        descricao: document.getElementById('servicoDescricao').value.trim(),
        duracaoMinutos: Number(document.getElementById('servicoDuracao').value),
        preco: Number(document.getElementById('servicoPreco').value),
      }),
    });

    setMessage('servicoMensagem', 'Serviço salvo com sucesso!', 'success');
    document.getElementById('servicoForm').reset();
    await loadDashboardData();
  } catch (error) {
    setMessage('servicoMensagem', error.message, 'error');
  }
});

document.getElementById('clienteForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/clientes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({
        nome: document.getElementById('clienteNome').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        telefone: document.getElementById('clienteTelefone').value.trim(),
        cpf: document.getElementById('clienteCpf').value.trim(),
      }),
    });

    setMessage('clienteMensagem', 'Cliente salvo com sucesso!', 'success');
    document.getElementById('clienteForm').reset();
    await loadDashboardData();
  } catch (error) {
    setMessage('clienteMensagem', error.message, 'error');
  }
});

document.getElementById('barbeiroForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/barbeiros', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({
        nome: document.getElementById('barbeiroNome').value.trim(),
        email: document.getElementById('barbeiroEmail').value.trim(),
        telefone: document.getElementById('barbeiroTelefone').value.trim(),
      }),
    });

    setMessage('barbeiroMensagem', 'Barbeiro salvo com sucesso!', 'success');
    document.getElementById('barbeiroForm').reset();
    await loadDashboardData();
  } catch (error) {
    setMessage('barbeiroMensagem', error.message, 'error');
  }
});

document.getElementById('agendamentoForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await apiRequest('/agendamentos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({
        clienteId: Number(document.getElementById('clienteId').value),
        barbeiroId: Number(document.getElementById('barbeiroId').value),
        servicoId: Number(document.getElementById('servicoId').value),
        dataHora: document.getElementById('dataHora').value,
        observacoes: document.getElementById('observacoes').value.trim(),
      }),
    });

    setMessage('agendamentoMensagem', 'Agendamento criado com sucesso!', 'success');
    document.getElementById('agendamentoForm').reset();
    await loadDashboardData();
  } catch (error) {
    setMessage('agendamentoMensagem', error.message, 'error');
  }
});

showAuthPane('login');
showView('home');
renderUserBadge();
checkSession();
