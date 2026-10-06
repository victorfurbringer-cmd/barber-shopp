export function criarFiltroAgendamentosPorUsuario({
  tipo,
  usuarioId,
  clienteId = 0,
  barbeiroId = 0,
}) {
  if (tipo === "ADMIN") {
    return {};
  }

  if (tipo === "CLIENTE") {
    return clienteId ? { clienteId: Number(clienteId) } : { id: -1 };
  }

  if (tipo === "BARBEIRO") {
    return barbeiroId ? { barbeiroId: Number(barbeiroId) } : { id: -1 };
  }

  return { id: -1 };
}

export function usuarioPodeAcessarAgendamento({
  tipo,
  usuarioId,
  clienteId = 0,
  barbeiroId = 0,
  agendamentoClienteId,
  agendamentoBarbeiroId,
}) {
  if (tipo === "ADMIN") {
    return true;
  }

  if (tipo === "CLIENTE") {
    return Boolean(clienteId) && Number(clienteId) === Number(agendamentoClienteId);
  }

  if (tipo === "BARBEIRO") {
    return Boolean(barbeiroId) && Number(barbeiroId) === Number(agendamentoBarbeiroId);
  }

  return false;
}
