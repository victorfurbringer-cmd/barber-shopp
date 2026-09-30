import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/authRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import barbeiroRoutes from "./routes/barbeiroRoutes.js";
import servicoRoutes from "./routes/servicoRoutes.js";
import agendamentoRoutes from "./routes/agendamentoRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();
const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));

app.use(helmet());
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clientes", clienteRoutes);
app.use("/barbeiros", barbeiroRoutes);
app.use("/servicos", servicoRoutes);
app.use("/agendamentos", agendamentoRoutes);

app.use(express.static(publicDirectory));

app.use(errorMiddleware);

export default app;