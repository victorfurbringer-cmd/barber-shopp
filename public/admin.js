const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'barber_admin_token';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  usuario: null,
  servicos: [],
  clientes: [],
  barbeiros: [],
  agendamentos: [],
};

const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const logoutButton = document.getElementById('logoutButton');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

function showView(name) {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  views.forEach((view) => view.classList.toggle('active', view.id === name));
}

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
    return 'Não foi possível criar o agendamento. Verifique cliente, serviço e horário.';
  }

  return message || 'Não foi possível criar o agendamento.';
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

function parseDate(dateString) {
  return new Date(dateString);
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

function renderSummary() {
  document.getElementById('totalAgendamentos').textContent = state.agendamentos.length;
  document.getElementById('totalServicos').textContent = state.servicos.length;
  document.getElementById('totalClientes').textContent = state.clientes.length;
  document.getElementById('totalBarbeiros').textContent = state.barbeiros.length;

  const upcoming = [...state.agendamentos]
    .sort((a, b) => parseDate(a.dataHora) - parseDate(b.dataHora))
    .slice(0, 5);

  const list = document.getElementById('pendingAppointments');
  list.innerHTML = '';

  if (!upcoming.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum agendamento</strong></div></div>';
    return;
  }

  upcoming.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${parseDate(item.dataHora).toLocaleString('pt-BR')}</strong>
        <small>Cliente: ${item.cliente?.nome || item.clienteId} · Barbeiro: ${item.barbeiro?.nome || item.barbeiroId}</small>
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

  if (!state.agendamentos.length) {
    list.innerHTML = '<div class="list-item"><div><strong>Nenhum agendamento cadastrado</strong></div></div>';
    return;
  }

  state.agendamentos.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'list-item';
    node.innerHTML = `
      <div>
        <strong>${parseDate(item.dataHora).toLocaleString('pt-BR')}</strong>
        <small>Cliente ${item.cliente?.nome || item.clienteId} · Barbeiro ${item.barbeiro?.nome || item.barbeiroId} · Serviço ${item.servico?.nome || item.servicoId}</small>
      </div>
      <div class="appointment-actions">
        <span class="badge status-${item.status.toLowerCase()}">${item.status}</span>
        ${item.status !== 'REALIZADO' && item.status !== 'CANCELADO'
          ? `<button class="complete-booking" type="button" data-appointment-id="${item.id}">✓ Serviço concluído</button>`
          : ''}
      </div>
    `;
    list.appendChild(node);
  });
}

async function loadDashboardData() {
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

  preencherSelect('clienteId', clientes, 'Selecione um cliente', (cliente) => `${cliente.nome} · ${cliente.email}`);
  preencherSelect('barbeiroId', barbeiros, 'Selecione um barbeiro', (barbeiro) => barbeiro.nome);
  preencherSelect('servicoId', servicos, 'Selecione um serviço', (servico) => `${servico.nome} · R$ ${Number(servico.preco).toFixed(2)}`);

  renderServicos();
  renderClientes();
  renderBarbeiros();
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
    if (data.usuario.tipo !== 'ADMIN') {
      throw new Error('Esta área é somente para administrador.');
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

loginForm.addEventListener('submit', async (event) => {
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

    if (data.usuario.tipo !== 'ADMIN') {
      throw new Error('Esta área é somente para administrador.');
    }

    saveToken(data.token);
    state.usuario = data.usuario;
    setMessage('loginMensagem', 'Login realizado com sucesso!', 'success');
    loginForm.reset();
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    renderUserBadge();
    await loadDashboardData();
  } catch (error) {
    setMessage('loginMensagem', error.message, 'error');
  }
});

logoutButton.addEventListener('click', () => {
  clearToken();
  state.usuario = null;
  state.servicos = [];
  state.clientes = [];
  state.barbeiros = [];
  state.agendamentos = [];
  authScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
  loginForm.reset();
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
    setMessage('agendamentoMensagem', formatAgendamentoError(error.message), 'error');
  }
});

checkSession();

document.getElementById('agendamentosList').addEventListener('click', async (event) => {
  const button = event.target.closest('.complete-booking');
  if (!button) return;

  button.disabled = true;
  try {
    await apiRequest(`/agendamentos/${button.dataset.appointmentId}/concluir`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${state.token}` },
    });
    setMessage('agendamentoMensagem', 'Serviço marcado como concluído.', 'success');
    await loadDashboardData();
  } catch (error) {
    button.disabled = false;
    setMessage('agendamentoMensagem', error.message, 'error');
  }
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});
