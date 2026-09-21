import prisma from "../config/prisma.js";

export async function listarClientes(req, res) {
  const clientes = await prisma.cliente.findMany({
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

  return res.status(200).json(clientes);
}

export async function criarCliente(req, res) {
  const { nome, email, telefone, cpf } = req.body;

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      email,
      telefone,
      cpf,
      usuario: {
        create: {
          nome,
          email,
          senha: "temp-password",
          tipo: "CLIENTE",
        },
      },
    },
  });

  return res.status(201).json(cliente);
}

export async function obterCliente(req, res) {
  const { id } = req.params;

  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(id) },
  });

  if (!cliente) {
    return res.status(404).json({ mensagem: "Cliente não encontrado." });
  }

  return res.status(200).json(cliente);
}

export async function atualizarCliente(req, res) {
  const { id } = req.params;
  const dados = req.body;

  const cliente = await prisma.cliente.update({
    where: { id: Number(id) },
    data: dados,
  });

  return res.status(200).json(cliente);
}

export async function excluirCliente(req, res) {
  const { id } = req.params;

  await prisma.cliente.delete({
    where: { id: Number(id) },
  });

  return res.status(204).send();
}
