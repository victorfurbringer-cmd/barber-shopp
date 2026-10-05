import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

export async function listarClientes(req, res) {
  const { tipo, id: usuarioId } = req.usuario;

  if (tipo === "CLIENTE") {
    const cliente = await prisma.cliente.findUnique({
      where: { usuarioId: Number(usuarioId) },
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

    if (!cliente) {
      return res.status(200).json([]);
    }

    return res.status(200).json([cliente]);
  }

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
  try {
    const { nome, email, telefone, cpf } = req.body;

    const nomeValido = typeof nome === "string" ? nome.trim() : "";
    const emailValido = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!nomeValido) {
      return res.status(400).json({ mensagem: "Nome do cliente é obrigatório." });
    }

    if (!emailValido || !emailValido.includes("@")) {
      return res.status(400).json({ mensagem: "Email do cliente é inválido." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email: emailValido } });
    const clienteExistente = await prisma.cliente.findUnique({ where: { email: emailValido } });

    if (usuarioExistente || clienteExistente) {
      return res.status(409).json({ mensagem: "Já existe um cliente ou usuário com este email." });
    }

    const senhaTemp = await bcrypt.hash("temp-password", 12);

    const cliente = await prisma.cliente.create({
      data: {
        nome: nomeValido,
        email: emailValido,
        telefone: telefone?.trim() || null,
        cpf: cpf?.trim() || null,
        usuario: {
          create: {
            nome: nomeValido,
            email: emailValido,
            senha: senhaTemp,
            tipo: "CLIENTE",
          },
        },
      },
    });

    return res.status(201).json(cliente);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({ mensagem: "Este email ou CPF já está em uso." });
    }

    return res.status(500).json({ mensagem: "Erro ao criar cliente." });
  }
}

export async function obterCliente(req, res) {
  const { id } = req.params;
  const { tipo, id: usuarioId } = req.usuario;

  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(id) },
    include: { usuario: true },
  });

  if (!cliente) {
    return res.status(404).json({ mensagem: "Cliente não encontrado." });
  }

  if (tipo === "CLIENTE" && cliente.usuarioId !== Number(usuarioId)) {
    return res.status(403).json({ mensagem: "Você não pode visualizar este cliente." });
  }

  return res.status(200).json(cliente);
}

export async function atualizarCliente(req, res) {
  const { id } = req.params;
  const dados = req.body;
  const { tipo, id: usuarioId } = req.usuario;

  const clienteAtual = await prisma.cliente.findUnique({
    where: { id: Number(id) },
  });

  if (!clienteAtual) {
    return res.status(404).json({ mensagem: "Cliente não encontrado." });
  }

  if (tipo === "CLIENTE" && clienteAtual.usuarioId !== Number(usuarioId)) {
    return res.status(403).json({ mensagem: "Você não pode alterar este cliente." });
  }

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
