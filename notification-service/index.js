require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const app = express();
const port = process.env.PORT || 4004;

app.use(morgan("dev"));
app.use(express.json());

const notificacionesRouter = require("./routes/notificaciones");
app.use("/notificaciones", notificacionesRouter);

app.listen(port, () => {
  console.log(`📬 Notification Service corriendo en puerto ${port}`);
});
