export function validarAgendamento(dados, contexto = {}) {
  const { clienteId, barbeiroId, servicoId, dataHora, status } = dados;
  const { agendamentos = [] } = contexto;

  if (!clienteId || Number(clienteId) <= 0) {
    throw new Error("Cliente inválido: informe um cliente válido.");
  }

  if (!barbeiroId || Number(barbeiroId) <= 0) {
    throw new Error("Barbeiro inválido: informe um barbeiro válido.");
  }

  if (!servicoId || Number(servicoId) <= 0) {
    throw new Error("Serviço inválido: informe um serviço válido.");
  }

  if (!dataHora) {
    throw new Error("Data e horário são obrigatórios.");
  }

  const data = new Date(dataHora);
  if (Number.isNaN(data.getTime())) {
    throw new Error("Data e horário inválidos.");
  }

  const statusNormalizado = (status || "PENDENTE").toUpperCase();
  const statusesValidos = ["PENDENTE", "CONFIRMADO", "REALIZADO", "CANCELADO"];
  if (!statusesValidos.includes(statusNormalizado)) {
    throw new Error("Status do agendamento inválido.");
  }

  const conflito = agendamentos.some((agendamento) => {
    if (!agendamento || Number(agendamento.barbeiroId) !== Number(barbeiroId)) {
      return false;
    }

    if (agendamento.status === "CANCELADO") {
      return false;
    }

    const outraData = new Date(agendamento.dataHora);
    return outraData.getTime() === data.getTime();
  });

  if (conflito) {
    throw new Error("Já existe um agendamento neste horário para o mesmo barbeiro.");
  }

  return true;
}
