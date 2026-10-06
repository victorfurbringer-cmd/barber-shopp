import prisma from "../config/prisma.js";
import { validarAgendamento } from "../utils/agendamentoRules.js";
import {
  criarFiltroAgendamentosPorUsuario,
  usuarioPodeAcessarAgendamento,
} from "../utils/agendamentoAcesso.js";

export async function listarAgendamentos(req, res) {
  try {
    const { tipo, id } = req.usuario;

    const cliente = await prisma.cliente.findUnique({
      where: { usuarioId: Number(id) },
    });

    const barbeiro = await prisma.barbeiro.findUnique({
      where: { usuarioId: Number(id) },
    });

    const filtro = criarFiltroAgendamentosPorUsuario({
      tipo,
      usuarioId: Number(id),
      clienteId: cliente?.id || 0,
      barbeiroId: barbeiro?.id || 0,
    });

    const agendamentos = await prisma.agendamento.findMany({
      where: filtro,
      include: {
        cliente: true,
        barbeiro: true,
        servico: true,
      },
    });

    return res.status(200).json(agendamentos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
}

export async function criarAgendamento(req, res) {
  try {
    const { barbeiroId, servicoId, dataHora, observacoes, status } = req.body;

    let clienteId = Number(req.body.clienteId || 0);

    if (req.usuario.tipo === "CLIENTE") {
      const clienteDoUsuario = await prisma.cliente.findUnique({
        where: { usuarioId: Number(req.usuario.id) },
      });

      if (!clienteDoUsuario) {
        return res.status(403).json({ mensagem: "Cliente não encontrado para este usuário." });
      }

      clienteId = clienteDoUsuario.id;
    }

    const [cliente, barbeiro, servico, agendamentos] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: Number(clienteId) } }),
      prisma.barbeiro.findUnique({ where: { id: Number(barbeiroId) } }),
      prisma.servico.findUnique({ where: { id: Number(servicoId) } }),
      prisma.agendamento.findMany({
        where: { barbeiroId: Number(barbeiroId), status: { not: "CANCELADO" } },
      }),
    ]);

    if (!cliente) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    if (!barbeiro) {
      return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    }

    if (!servico) {
      return res.status(404).json({ mensagem: "Serviço não encontrado." });
    }

    validarAgendamento(
      {
        clienteId,
        barbeiroId,
        servicoId,
        dataHora,
        status: status || "PENDENTE",
        servico: { duracaoMinutos: servico.duracaoMinutos },
      },
      { agendamentos }
    );

    const agendamento = await prisma.agendamento.create({
      data: {
        clienteId: Number(clienteId),
        barbeiroId: Number(barbeiroId),
        servicoId: Number(servicoId),
        dataHora: new Date(dataHora),
        observacoes,
        status: status || "PENDENTE",
      },
    });

    return res.status(201).json(agendamento);
  } catch (error) {
    if (error.message && /cliente|barbeiro|serviço|horário|Data|status/i.test(error.message)) {
      return res.status(400).json({ mensagem: error.message });
    }

    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
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

  const { tipo, id: usuarioId } = req.usuario;
  const cliente = await prisma.cliente.findUnique({ where: { usuarioId: Number(usuarioId) } });
  const barbeiro = await prisma.barbeiro.findUnique({ where: { usuarioId: Number(usuarioId) } });

  const podeAcessar = usuarioPodeAcessarAgendamento({
    tipo,
    usuarioId: Number(usuarioId),
    clienteId: cliente?.id || 0,
    barbeiroId: barbeiro?.id || 0,
    agendamentoClienteId: agendamento.clienteId,
    agendamentoBarbeiroId: agendamento.barbeiroId,
  });

  if (!podeAcessar) {
    return res.status(403).json({ mensagem: "Você não pode visualizar este agendamento." });
  }

  return res.status(200).json(agendamento);
}

export async function atualizarAgendamento(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;

    const agendamentoExistente = await prisma.agendamento.findUnique({
      where: { id: Number(id) },
    });

    if (!agendamentoExistente) {
      return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    }

    const { tipo, id: usuarioId } = req.usuario;
    const cliente = await prisma.cliente.findUnique({ where: { usuarioId: Number(usuarioId) } });
    const barbeiro = await prisma.barbeiro.findUnique({ where: { usuarioId: Number(usuarioId) } });

    const podeAcessar = usuarioPodeAcessarAgendamento({
      tipo,
      usuarioId: Number(usuarioId),
      clienteId: cliente?.id || 0,
      barbeiroId: barbeiro?.id || 0,
      agendamentoClienteId: agendamentoExistente.clienteId,
      agendamentoBarbeiroId: agendamentoExistente.barbeiroId,
    });

    if (!podeAcessar && tipo !== "ADMIN") {
      return res.status(403).json({ mensagem: "Você não pode alterar este agendamento." });
    }

    const agendamentosConflitantes = await prisma.agendamento.findMany({
      where: {
        barbeiroId: Number(dados.barbeiroId ?? agendamentoExistente.barbeiroId),
        status: { not: "CANCELADO" },
      },
    });

    const servicoAtual = dados.servicoId
      ? await prisma.servico.findUnique({ where: { id: Number(dados.servicoId) } })
      : await prisma.servico.findUnique({ where: { id: Number(agendamentoExistente.servicoId) } });

    validarAgendamento(
      {
        ...agendamentoExistente,
        ...dados,
        id,
        servico: servicoAtual ? { duracaoMinutos: servicoAtual.duracaoMinutos } : undefined,
      },
      { agendamentos: agendamentosConflitantes }
    );

    const agendamento = await prisma.agendamento.update({
      where: { id: Number(id) },
      data: {
        ...dados,
        dataHora: dados.dataHora ? new Date(dados.dataHora) : undefined,
      },
    });

    return res.status(200).json(agendamento);
  } catch (error) {
    if (error.message && /cliente|barbeiro|serviço|horário|Data|status/i.test(error.message)) {
      return res.status(400).json({ mensagem: error.message });
    }

    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
}

export async function concluirAgendamento(req, res) {
  try {
    const id = Number(req.params.id);
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) {
      return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    }

    if (agendamento.status === "CANCELADO") {
      return res.status(409).json({ mensagem: "Um agendamento cancelado não pode ser concluído." });
    }

    const atualizado = await prisma.agendamento.update({
      where: { id },
      data: { status: "REALIZADO" },
      include: {
        cliente: true,
        barbeiro: true,
        servico: true,
      },
    });

    return res.status(200).json(atualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao marcar o serviço como concluído." });
  }
}

export async function excluirAgendamento(req, res) {
  const { id } = req.params;

  const agendamentoExistente = await prisma.agendamento.findUnique({
    where: { id: Number(id) },
  });

  if (!agendamentoExistente) {
    return res.status(404).json({ mensagem: "Agendamento não encontrado." });
  }

  const { tipo, id: usuarioId } = req.usuario;
  const cliente = await prisma.cliente.findUnique({ where: { usuarioId: Number(usuarioId) } });
  const barbeiro = await prisma.barbeiro.findUnique({ where: { usuarioId: Number(usuarioId) } });

  const podeAcessar = usuarioPodeAcessarAgendamento({
    tipo,
    usuarioId: Number(usuarioId),
    clienteId: cliente?.id || 0,
    barbeiroId: barbeiro?.id || 0,
    agendamentoClienteId: agendamentoExistente.clienteId,
    agendamentoBarbeiroId: agendamentoExistente.barbeiroId,
  });

  if (!podeAcessar && tipo !== "ADMIN") {
    return res.status(403).json({ mensagem: "Você não pode excluir este agendamento." });
  }

  await prisma.agendamento.delete({
    where: { id: Number(id) },
  });

  return res.status(204).send();
}
