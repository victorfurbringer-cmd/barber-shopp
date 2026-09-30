import "dotenv/config";

import app from "./app.js";
import { ensureDefaultAdmin } from "./config/seedAdmin.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await ensureDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();