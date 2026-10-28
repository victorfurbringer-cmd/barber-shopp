import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { body, validationResult } from "express-validator";

import prisma from "../config/prisma.js";
import { criarTransportadorEmail } from "../utils/emailTransport.js";

const DURACAO_TOKEN_REDEFINICAO_MS = 30 * 60 * 1000;
const RESPOSTA_RECUPERACAO = {
  mensagem: "Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.",
};

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caractere]);
}


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

export async function solicitarRedefinicaoSenha(req, res) {
  const validacao = validationResult(req);
  if (!validacao.isEmpty()) {
    return res.status(400).json({ mensagem: "Informe um e-mail válido." });
  }

  let transportador;
  try {
    transportador = criarTransportadorEmail();
  } catch (error) {
    console.error("Recuperação de senha indisponível:", error.message);
    return res.status(503).json({ mensagem: "A recuperação de senha está temporariamente indisponível." });
  }

  const email = req.body.email.trim().toLowerCase();

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(202).json(RESPOSTA_RECUPERACAO);
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiraEm = new Date(Date.now() + DURACAO_TOKEN_REDEFINICAO_MS);

    await prisma.$transaction([
      prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: usuario.id } }),
      prisma.tokenRedefinicaoSenha.create({
        data: { usuarioId: usuario.id, tokenHash, expiraEm },
      }),
    ]);

    const baseUrl = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
    const link = `${baseUrl}/redefinir-senha.html?token=${encodeURIComponent(token)}`;
    const remetente = process.env.SMTP_FROM || process.env.SMTP_USER;
    const nomeHtmlSeguro = escaparHtml(usuario.nome);

    try {
      await transportador.sendMail({
        from: remetente,
        to: usuario.email,
        subject: "Redefinição de senha — Barber Shop",
        text: `Olá, ${usuario.nome}. Use o link abaixo para criar uma nova senha. O link expira em 30 minutos.\n\n${link}\n\nSe você não solicitou esta alteração, ignore este e-mail.`,
        html: `<p>Olá, ${nomeHtmlSeguro}.</p><p>Recebemos uma solicitação para redefinir a senha da sua conta Barber Shop. O link abaixo expira em 30 minutos.</p><p><a href="${link}">Criar nova senha</a></p><p>Se você não solicitou esta alteração, ignore este e-mail.</p>`,
      });
    } catch (error) {
      await prisma.tokenRedefinicaoSenha.deleteMany({ where: { tokenHash } });
      throw error;
    }

    return res.status(202).json(RESPOSTA_RECUPERACAO);
  } catch (error) {
    console.error("Erro ao processar recuperação de senha:", error.message);
    return res.status(503).json({ mensagem: "A recuperação de senha está temporariamente indisponível." });
  }
}

export async function redefinirSenha(req, res) {
  const validacao = validationResult(req);
  if (!validacao.isEmpty()) {
    return res.status(400).json({ mensagem: "O link ou a nova senha são inválidos." });
  }

  const { token, senha } = req.body;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  try {
    const registro = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash },
    });

    if (!registro || registro.expiraEm <= new Date()) {
      if (registro) {
        await prisma.tokenRedefinicaoSenha.delete({ where: { id: registro.id } });
      }
      return res.status(400).json({ mensagem: "O link de redefinição é inválido ou expirou. Solicite outro." });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const tokenConsumido = await prisma.$transaction(async (tx) => {
      const resultado = await tx.tokenRedefinicaoSenha.deleteMany({
        where: { id: registro.id, expiraEm: { gt: new Date() } },
      });

      if (resultado.count !== 1) return false;

      await tx.usuario.update({
        where: { id: registro.usuarioId },
        data: { senha: senhaHash },
      });
      await tx.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: registro.usuarioId } });
      return true;
    });

    if (!tokenConsumido) {
      return res.status(400).json({ mensagem: "O link de redefinição é inválido ou expirou. Solicite outro." });
    }

    return res.status(200).json({ mensagem: "Senha redefinida com sucesso. Você já pode entrar." });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error.message);
    return res.status(500).json({ mensagem: "Não foi possível redefinir a senha agora." });
  }
}

export async function verificarTokenRedefinicao(req, res) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ valido: false });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  try {
    const registro = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash },
      select: { expiraEm: true },
    });

    return res.status(200).json({ valido: Boolean(registro && registro.expiraEm > new Date()) });
  } catch (error) {
    console.error("Erro ao verificar link de redefinição:", error.message);
    return res.status(500).json({ mensagem: "Não foi possível verificar o link agora." });
  }
}