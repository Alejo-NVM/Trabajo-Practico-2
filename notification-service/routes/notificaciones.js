const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");
const autenticarJWT = require("../middlewares/autenticarJWT");

// GET /notificaciones - ver mis notificaciones
router.get("/", autenticarJWT, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("usuario_id", sql.Int, req.user.id)
      .query(
        "SELECT * FROM Notificaciones WHERE usuario_id = @usuario_id ORDER BY fecha DESC"
      );

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

// POST /notificaciones - enviar notificación a un usuario (admin/organizador)
router.post("/", autenticarJWT, async (req, res) => {
  const { usuario_id, mensaje } = req.body;

  if (!["administrador", "organizador"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: "No autorizado para enviar notificaciones" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("usuario_id", sql.Int, usuario_id)
      .input("mensaje", sql.Text, mensaje).query(`
        INSERT INTO Notificaciones (usuario_id, mensaje) 
        VALUES (@usuario_id, @mensaje)
      `);

    // Simular envío por consola
    console.log(`📨 Notificación enviada a usuario ${usuario_id}: ${mensaje}`);

    res.status(201).json({ message: "Notificación enviada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar notificación" });
  }
});
module.exports = router;
