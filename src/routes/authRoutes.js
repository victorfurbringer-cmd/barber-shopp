import express from "express";

import {
  registrar,
  login,
  solicitarRedefinicaoSenha,
  redefinirSenha,
  verificarTokenRedefinicao,
} from "../controllers/authController.js";

import { verificarToken } from "../middleware/authMiddleware.js";
import { body } from "express-validator";
import prisma from "../config/prisma.js";

const router = express.Router();
const limiteRecuperacaoPorIp = new Map();
const JANELA_RECUPERACAO_MS = 15 * 60 * 1000;
const MAX_RECUPERACOES_POR_JANELA = 5;

function limitarSolicitacoesRecuperacao(req, res, next) {
  const agora = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const registros = (limiteRecuperacaoPorIp.get(ip) || []).filter(
    (timestamp) => agora - timestamp < JANELA_RECUPERACAO_MS
  );

  if (registros.length >= MAX_RECUPERACOES_POR_JANELA) {
    return res.status(429).json({ mensagem: "Muitas solicitações. Tente novamente mais tarde." });
  }

  registros.push(agora);
  limiteRecuperacaoPorIp.set(ip, registros);

  if (limiteRecuperacaoPorIp.size > 1000) {
    for (const [chave, tentativas] of limiteRecuperacaoPorIp) {
      if (tentativas.every((timestamp) => agora - timestamp >= JANELA_RECUPERACAO_MS)) {
        limiteRecuperacaoPorIp.delete(chave);
      }
    }
  }

  return next();
}


// =====================================================
// CADASTRO
// =====================================================

router.post(
  "/register",

  [
    body("nome")
      .trim()
      .notEmpty()
      .withMessage("Nome é obrigatório.")
      .isLength({ min: 3, max: 100 })
      .withMessage("Nome deve ter entre 3 e 100 caracteres."),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email é obrigatório.")
      .isEmail()
      .withMessage("Email inválido."),

    body("senha")
      .notEmpty()
      .withMessage("Senha é obrigatória.")
      .isLength({ min: 6 })
      .withMessage("A senha deve possuir pelo menos 6 caracteres."),
  ],

  registrar
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",

  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email é obrigatório.")
      .isEmail()
      .withMessage("Email inválido."),

    body("senha")
      .notEmpty()
      .withMessage("Senha é obrigatória."),
  ],

  login
);

router.post(
  "/solicitar-redefinicao-senha",
  limitarSolicitacoesRecuperacao,
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email é obrigatório.")
      .isEmail()
      .withMessage("Email inválido."),
  ],
  solicitarRedefinicaoSenha
);

router.post(
  "/redefinir-senha",
  [
    body("token")
      .isString()
      .isLength({ min: 64, max: 64 })
      .isHexadecimal()
      .withMessage("Token inválido."),
    body("senha")
      .isString()
      .isLength({ min: 6, max: 128 })
      .withMessage("A senha deve possuir entre 6 e 128 caracteres."),
  ],
  redefinirSenha
);

router.get("/verificar-token-redefinicao", verificarTokenRedefinicao);

// =====================================================
// ROTA PROTEGIDA
// =====================================================

router.get("/me", verificarToken, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(req.usuario.id) },
    select: { id: true, nome: true, email: true, tipo: true },
  });

  if (!usuario) {
    return res.status(404).json({ mensagem: "Usuário não encontrado." });
  }

  return res.status(200).json({
    mensagem: "Você está autenticado.",
    usuario,
  });
});


export default router;