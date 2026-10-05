import bcrypt from "bcrypt";
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
  try {
    const { nome, email, telefone } = req.body;

    const nomeValido = typeof nome === "string" ? nome.trim() : "";
    const emailValido = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!nomeValido) {
      return res.status(400).json({ mensagem: "Nome do barbeiro é obrigatório." });
    }

    if (!emailValido || !emailValido.includes("@")) {
      return res.status(400).json({ mensagem: "Email do barbeiro é inválido." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email: emailValido } });
    const barbeiroExistente = await prisma.barbeiro.findUnique({ where: { email: emailValido } });

    if (usuarioExistente || barbeiroExistente) {
      return res.status(409).json({ mensagem: "Já existe um barbeiro ou usuário com este email." });
    }

    const senhaTemp = await bcrypt.hash("temp-password", 12);

    const barbeiro = await prisma.barbeiro.create({
      data: {
        nome: nomeValido,
        email: emailValido,
        telefone: telefone?.trim() || null,
        usuario: {
          create: {
            nome: nomeValido,
            email: emailValido,
            senha: senhaTemp,
            tipo: "BARBEIRO",
          },
        },
      },
    });

    return res.status(201).json(barbeiro);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({ mensagem: "Este email já está em uso." });
    }

    return res.status(500).json({ mensagem: "Erro ao criar barbeiro." });
  }
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
