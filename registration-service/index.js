require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();

const port = process.env.PORT || 4002;

app.use(morgan("dev"));
app.use(express.json());

const inscripcionesRouter = require("./routes/inscripciones");

app.use("/inscripciones", inscripcionesRouter);

app.listen(port, () => {
  console.log(`🚀 Registration Service corriendo en puerto ${port}`);
});
