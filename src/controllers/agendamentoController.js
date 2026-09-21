import prisma from "../config/prisma.js";

export async function listarAgendamentos(req, res) {
  const agendamentos = await prisma.agendamento.findMany({
    include: {
      cliente: true,
      barbeiro: true,
      servico: true,
    },
  });

  return res.status(200).json(agendamentos);
}

export async function criarAgendamento(req, res) {
  const { clienteId, barbeiroId, servicoId, dataHora, observacoes } = req.body;

  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId: Number(clienteId),
      barbeiroId: Number(barbeiroId),
      servicoId: Number(servicoId),
      dataHora: new Date(dataHora),
      observacoes,
      status: "PENDENTE",
    },
  });

  return res.status(201).json(agendamento);
}

export async function obterAgendamento(req, res) {
  const { id } = req.params;

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: true,
      barbeiro: true,
      servico: true,
    },
  });

  if (!agendamento) {
    return res.status(404).json({ mensagem: "Agendamento não encontrado." });
  }

  return res.status(200).json(agendamento);
}

export async function atualizarAgendamento(req, res) {
  const { id } = req.params;
  const dados = req.body;

  const agendamento = await prisma.agendamento.update({
    where: { id: Number(id) },
    data: {
      ...dados,
      dataHora: dados.dataHora ? new Date(dados.dataHora) : undefined,
    },
  });

  return res.status(200).json(agendamento);
}

export async function excluirAgendamento(req, res) {
  const { id } = req.params;

  await prisma.agendamento.delete({
    where: { id: Number(id) },
  });

  return res.status(204).send();
}
