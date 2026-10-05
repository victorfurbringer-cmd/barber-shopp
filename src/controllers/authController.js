import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

import prisma from "../config/prisma.js";


// =====================================================
// CADASTRO
// =====================================================

export async function registrar(req, res) {
  try {
    const erros = validationResult(req);

    if (!erros.isEmpty()) {
      return res.status(400).json({
        mensagem: "Dados inválidos",
        erros: erros.array(),
      });
    }

    const { nome, email, senha } = req.body;
    const nomeValido = typeof nome === "string" ? nome.trim() : "";
    const emailValido = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!nomeValido) {
      return res.status(400).json({ mensagem: "Nome é obrigatório." });
    }

    if (!emailValido || !emailValido.includes("@")) {
      return res.status(400).json({ mensagem: "Email inválido." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailValido },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: "Este email já está cadastrado.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: nomeValido,
          email: emailValido,
          senha: senhaHash,
          tipo: "CLIENTE",
        },
      });

      const cliente = await tx.cliente.create({
        data: {
          nome: nomeValido,
          email: emailValido,
          telefone: null,
          cpf: null,
          usuarioId: usuario.id,
        },
      });

      return { usuario, cliente };
    });

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso. Você já pode fazer login.",
      usuario: {
        id: resultado.usuario.id,
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        tipo: resultado.usuario.tipo,
      },
      cliente: {
        id: resultado.cliente.id,
        nome: resultado.cliente.nome,
        email: resultado.cliente.email,
      },
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({
        mensagem: "Já existe um cliente cadastrado com este email.",
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}


// =====================================================
// LOGIN
// =====================================================

export async function login(req, res) {
  try {

    const erros = validationResult(req);

    if (!erros.isEmpty()) {
      return res.status(400).json({
        mensagem: "Dados inválidos",
        erros: erros.array(),
      });
    }


    const {
      email,
      senha,
    } = req.body;


    // Procura usuário
    const usuario = await prisma.usuario.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });


    // Não revelar se o email existe
    if (!usuario) {
      return res.status(401).json({
        mensagem: "Email ou senha inválidos.",
      });
    }


    // Compara a senha enviada com o hash
    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    );


    if (!senhaValida) {
      return res.status(401).json({
        mensagem: "Email ou senha inválidos.",
      });
    }


    // Cria JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        tipo: usuario.tipo,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      }
    );


    return res.status(200).json({

      mensagem: "Login realizado com sucesso.",

      token,

      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
      },

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}