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

    const {
      nome,
      email,
      senha,
    } = req.body;


    // Verifica se já existe usuário com esse email
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });


    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: "Este email já está cadastrado.",
      });
    }


    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 12);


    // Cria usuário
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senha: senhaHash,
        tipo: "CLIENTE",
      },
    });


    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",

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