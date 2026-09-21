import prisma from "../config/prisma.js";

export async function listarBarbeiros(req, res) {
  const barbeiros = await prisma.barbeiro.findMany({
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
        },
      },
    },
  });

  return res.status(200).json(barbeiros);
}

export async function criarBarbeiro(req, res) {
  const { nome, email, telefone } = req.body;

  const barbeiro = await prisma.barbeiro.create({
    data: {
      nome,
      email,
      telefone,
      usuario: {
        create: {
          nome,
          email,
          senha: "temp-password",
          tipo: "BARBEIRO",
        },
      },
    },
  });

  return res.status(201).json(barbeiro);
}

export async function obterBarbeiro(req, res) {
  const { id } = req.params;

  const barbeiro = await prisma.barbeiro.findUnique({
    where: { id: Number(id) },
  });

  if (!barbeiro) {
    return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
  }

  return res.status(200).json(barbeiro);
}

export async function atualizarBarbeiro(req, res) {
  const { id } = req.params;
  const dados = req.body;

  const barbeiro = await prisma.barbeiro.update({
    where: { id: Number(id) },
    data: dados,
  });

  return res.status(200).json(barbeiro);
}

export async function excluirBarbeiro(req, res) {
  const { id } = req.params;

  await prisma.barbeiro.delete({
    where: { id: Number(id) },
  });

  return res.status(204).send();
}
