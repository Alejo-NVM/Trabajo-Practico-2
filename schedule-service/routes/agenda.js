const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");
const autenticarJWT = require("../middlewares/autenticarJWT");

// GET /agenda/:eventoId - listar actividades por evento
router.get("/:eventoId", autenticarJWT, async (req, res) => {
  const { eventoId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("evento_id", sql.Int, eventoId)
      .query(
        "SELECT * FROM Actividades WHERE evento_id = @evento_id ORDER BY inicio"
      );

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la agenda" });
  }
});

// POST /agenda - crear actividad (organizador/admin)
router.post("/", autenticarJWT, async (req, res) => {
  const { evento_id, titulo, descripcion, sala, expositor_id, inicio, fin } =
    req.body;

  if (!["organizador", "administrador"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: "No tenés permiso para crear actividades" });
  }

  try {
    const pool = await poolPromise;

    // Verificar solapamientos
    const conflicto = await pool
      .request()
      .input("evento_id", sql.Int, evento_id)
      .input("sala", sql.VarChar, sala)
      .input("inicio", sql.DateTime, inicio)
      .input("fin", sql.DateTime, fin).query(`
        SELECT * FROM Actividades 
        WHERE evento_id = @evento_id 
          AND sala = @sala 
          AND (
            (@inicio BETWEEN inicio AND fin) OR 
            (@fin BETWEEN inicio AND fin) OR
            (inicio BETWEEN @inicio AND @fin)
          )
      `);

    if (conflicto.recordset.length > 0) {
      return res
        .status(409)
        .json({ error: "Hay conflicto de horarios en la sala" });
    }

    await pool
      .request()
      .input("evento_id", sql.Int, evento_id)
      .input("titulo", sql.VarChar, titulo)
      .input("descripcion", sql.Text, descripcion)
      .input("sala", sql.VarChar, sala)
      .input("expositor_id", sql.Int, expositor_id)
      .input("inicio", sql.DateTime, inicio)
      .input("fin", sql.DateTime, fin).query(`
        INSERT INTO Actividades (evento_id, titulo, descripcion, sala, expositor_id, inicio, fin)
        VALUES (@evento_id, @titulo, @descripcion, @sala, @expositor_id, @inicio, @fin)
      `);

    res.status(201).json({ message: "Actividad creada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear la actividad" });
  }
});
module.exports = router;
