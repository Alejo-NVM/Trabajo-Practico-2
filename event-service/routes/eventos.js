const express = require("express");
const router = express.Router();
const autenticarJWT = require("../middlewares/autenticarJWT");
const {
  listarEventos,
  crearEvento,
  actualizarEvento,
} = require("../controllers/eventoController");

router.get("/", autenticarJWT, listarEventos);
router.post("/", autenticarJWT, crearEvento);
router.put("/:id", autenticarJWT, actualizarEvento);

module.exports = router;
