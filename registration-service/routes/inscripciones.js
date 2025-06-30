const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");
const autenticarJWT = require("../middlewares/autenticarJWT");

// POST /inscripciones - solo asistentes pueden inscribirse
router.post("/", autenticarJWT, async (req, res) => {
  const { evento_id } = req.body;
  const usuario_id = req.user.id;

  if (req.user.role !== "asistente") {
    return res
      .status(403)
      .json({ message: "Solo asistentes pueden inscribirse" });
  }

  try {
    const pool = await poolPromise;

    // Verificar evento activo
    const evento = await pool
      .request()
      .input("id", sql.Int, evento_id)
      .query("SELECT * FROM Eventos WHERE id = @id AND estado = 'activo'");

    if (evento.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Evento no encontrado o no activo" });
    }

    // Insertar inscripción
    await pool
      .request()
      .input("usuario_id", sql.Int, usuario_id)
      .input("evento_id", sql.Int, evento_id)
      .query(
        "INSERT INTO Inscripciones (usuario_id, evento_id) VALUES (@usuario_id, @evento_id)"
      );

    res.status(201).json({ message: "Inscripción registrada" });
  } catch (err) {
    if (err.message.includes("Violation of UNIQUE KEY constraint")) {
      return res
        .status(409)
        .json({ message: "Ya estás inscripto a este evento" });
    }
    console.error(err);
    res.status(500).json({ message: "Error al registrar inscripción" });
  }
});

// GET /inscripciones - listar inscripciones del usuario actual
router.get("/", autenticarJWT, async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("usuario_id", sql.Int, req.user.id).query(`
        SELECT i.id, i.fecha_inscripcion, i.estado, e.nombre AS evento
        FROM Inscripciones i
        JOIN Eventos e ON e.id = i.evento_id
        WHERE i.usuario_id = @usuario_id
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener inscripciones" });
  }
});

module.exports = router;
