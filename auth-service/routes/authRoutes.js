const express = require("express");
const router = express.Router();
const { registrarUsuario } = require("../../auth/controllers/authControllers");

router.post("/register", registrarUsuario);

module.exports = router;
