require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Rutas
const authRoutes = require("./routes/auth");

app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`🚀 Auth Service corriendo en puerto ${port}`);
});
