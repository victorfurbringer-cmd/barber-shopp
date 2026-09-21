import express from "express";

import {
  listarClientes,
  criarCliente,
  obterCliente,
  atualizarCliente,
  excluirCliente,
} from "../controllers/clienteController.js";
import { verificarToken } from "../middleware/authMiddleware.js";
import { permitirTipos } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", verificarToken, permitirTipos("ADMIN", "CLIENTE"), listarClientes);
router.post("/", verificarToken, permitirTipos("ADMIN"), criarCliente);
router.get("/:id", verificarToken, permitirTipos("ADMIN", "CLIENTE"), obterCliente);
router.put("/:id", verificarToken, permitirTipos("ADMIN", "CLIENTE"), atualizarCliente);
router.delete("/:id", verificarToken, permitirTipos("ADMIN"), excluirCliente);

export default router;
