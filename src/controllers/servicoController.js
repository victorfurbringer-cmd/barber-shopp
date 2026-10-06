import prisma from "../config/prisma.js";

export async function listarServicos(req, res) {
  const servicos = await prisma.servico.findMany();
  return res.status(200).json(servicos);
}

export async function criarServico(req, res) {
  try {
    const { nome, descricao, duracaoMinutos, preco } = req.body;

    const nomeValido = typeof nome === "string" ? nome.trim() : "";
    const duracao = Number(duracaoMinutos);
    const precoValor = Number(preco);

    if (!nomeValido) {
      return res.status(400).json({ mensagem: "Nome do serviço é obrigatório." });
    }

    if (!Number.isFinite(duracao) || duracao <= 0) {
      return res.status(400).json({ mensagem: "Duração do serviço deve ser maior que zero." });
    }

    if (!Number.isFinite(precoValor) || precoValor < 0) {
      return res.status(400).json({ mensagem: "Preço do serviço é inválido." });
    }

    const servico = await prisma.servico.create({
      data: {
        nome: nomeValido,
        descricao: descricao?.trim() || null,
        duracaoMinutos: duracao,
        preco: precoValor,
      },
    });

    return res.status(201).json(servico);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensagem: "Erro ao criar serviço. Verifique os dados informados.",
      detalhe: error.message,
    });
  }
}

export async function obterServico(req, res) {
  const { id } = req.params;

  const servico = await prisma.servico.findUnique({
    where: { id: Number(id) },
  });

  if (!servico) {
    return res.status(404).json({ mensagem: "Serviço não encontrado." });
  }

  return res.status(200).json(servico);
}

export async function atualizarServico(req, res) {
  const { id } = req.params;
  const dados = req.body;

  const servico = await prisma.servico.update({
    where: { id: Number(id) },
    data: {
      ...dados,
      duracaoMinutos: dados.duracaoMinutos ? Number(dados.duracaoMinutos) : undefined,
      preco: dados.preco ? Number(dados.preco) : undefined,
    },
  });

  return res.status(200).json(servico);
}

export async function excluirServico(req, res) {
  const { id } = req.params;

  await prisma.servico.delete({
    where: { id: Number(id) },
  });

  return res.status(204).send();
}
