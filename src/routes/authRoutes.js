import express from "express";

import {
  registrar,
  login,
} from "../controllers/authController.js";

import { body } from "express-validator";

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


export default router;