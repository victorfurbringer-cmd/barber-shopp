const express=require("express");

const cors=require("cors");

const helmet=require("helmet");


const app=express();


app.use(cors());

app.use(helmet());

app.use(express.json());


app.use("/auth",
require("./routes/authRoutes"));


app.use("/clientes",
require("./routes/clienteRoutes"));


app.use("/agendamentos",
require("./routes/agendamentoRoutes"));


module.exports=app;