require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();

const port = process.env.PORT || 4001;

app.use(morgan("dev"));
app.use(express.json());

const eventosRouter = require("./routes/eventos");

app.use("/eventos", eventosRouter);

app.listen(port, () => {
  console.log(`🚀 Event Service corriendo en puerto ${port}`);
});
