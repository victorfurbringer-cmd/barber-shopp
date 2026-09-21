import express from "express";

import {
  listarAgendamentos,
  criarAgendamento,
  obterAgendamento,
  atualizarAgendamento,
  excluirAgendamento,
} from "../controllers/agendamentoController.js";
import { verificarToken } from "../middleware/authMiddleware.js";
import { permitirTipos } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), listarAgendamentos);
router.post("/", verificarToken, permitirTipos("ADMIN", "CLIENTE"), criarAgendamento);
router.get("/:id", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), obterAgendamento);
router.put("/:id", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), atualizarAgendamento);
router.delete("/:id", verificarToken, permitirTipos("ADMIN"), excluirAgendamento);

export default router;
