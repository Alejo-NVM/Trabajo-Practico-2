require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const app = express();
const port = process.env.PORT || 4003;

app.use(morgan("dev"));
app.use(express.json());

const agendaRoutes = require("./routes/agenda");
app.use("/agenda", agendaRoutes);

app.listen(port, () => {
  console.log(`📅 Schedule Service corriendo en puerto ${port}`);
});
