import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";

const app = express();


// =====================================================
// MIDDLEWARES
// =====================================================

app.use(
  helmet()
);


app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  })
);


app.use(
  express.json()
);


// =====================================================
// ROTAS
// =====================================================

app.use(
  "/auth",
  authRoutes
);


// =====================================================
// ROTA TESTE
// =====================================================

app.get("/", (req, res) => {

  res.json({
    mensagem: "API Barber Shopp funcionando.",
  });

});


export default app;