import express from "express";

import {
  listarServicos,
  criarServico,
  obterServico,
  atualizarServico,
  excluirServico,
} from "../controllers/servicoController.js";
import { verificarToken } from "../middleware/authMiddleware.js";
import { permitirTipos } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), listarServicos);
router.post("/", verificarToken, permitirTipos("ADMIN", "BARBEIRO"), criarServico);
router.get("/:id", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), obterServico);
router.put("/:id", verificarToken, permitirTipos("ADMIN", "BARBEIRO"), atualizarServico);
router.delete("/:id", verificarToken, permitirTipos("ADMIN"), excluirServico);

export default router;
