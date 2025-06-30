const express = require("express");
const router = express.Router();

const {
  registrarUsuario,
  registrarDesdeAuthBasic,
  login,
  refreshToken,
} = require("../controllers/authControllers");

router.post("/register", registrarUsuario);
router.post("/basic-register", registrarDesdeAuthBasic);
router.post("/login", login);
router.post("/refresh", refreshToken);

module.exports = router;
