import express from "express";

import {
  listarBarbeiros,
  criarBarbeiro,
  obterBarbeiro,
  atualizarBarbeiro,
  excluirBarbeiro,
} from "../controllers/barbeiroController.js";
import { verificarToken } from "../middleware/authMiddleware.js";
import { permitirTipos } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), listarBarbeiros);
router.post("/", verificarToken, permitirTipos("ADMIN"), criarBarbeiro);
router.get("/:id", verificarToken, permitirTipos("ADMIN", "BARBEIRO", "CLIENTE"), obterBarbeiro);
router.put("/:id", verificarToken, permitirTipos("ADMIN", "BARBEIRO"), atualizarBarbeiro);
router.delete("/:id", verificarToken, permitirTipos("ADMIN"), excluirBarbeiro);

export default router;
