import express from "express";

import {
  registrar,
  login,
} from "../controllers/authController.js";

import { verificarToken } from "../middleware/authMiddleware.js";
import { body } from "express-validator";
import prisma from "../config/prisma.js";

const router = express.Router();


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