const { poolPromise, sql } = require("../config/db");

async function listarEventos(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Eventos");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener eventos" });
  }
}

async function crearEvento(req, res) {
  const { nombre, descripcion, fecha, lugar, capacidad, estado } = req.body;
  const { role } = req.user;

  if (!["organizador", "administrador"].includes(role)) {
    return res
      .status(403)
      .json({ error: "No tenés permiso para crear eventos" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("nombre", sql.VarChar, nombre)
      .input("descripcion", sql.Text, descripcion)
      .input("fecha", sql.Date, fecha)
      .input("lugar", sql.VarChar, lugar)
      .input("capacidad", sql.Int, capacidad)
      .input("estado", sql.VarChar, estado || "planificación")
      .input("creado_por", sql.Int, req.user.id)
      .query(
        `INSERT INTO Eventos (nombre, descripcion, fecha, lugar, capacidad, estado, creado_por)
         VALUES (@nombre, @descripcion, @fecha, @lugar, @capacidad, @estado, @creado_por)`
      );

    res.status(201).json({ msg: "Evento creado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear evento" });
  }
}

async function actualizarEvento(req, res) {
  const eventoId = req.params.id;
  const { nombre, descripcion, fecha, lugar, capacidad, estado } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, eventoId)
      .query("SELECT * FROM Eventos WHERE id = @id");

    const evento = result.recordset[0];
    if (!evento) return res.status(404).json({ error: "Evento no encontrado" });

    const esAdmin = req.user.role === "administrador";
    const esCreador = evento.creado_por === req.user.id;

    if (!esAdmin && !esCreador) {
      return res
        .status(403)
        .json({ error: "No tenés permiso para editar este evento" });
    }

    await pool
      .request()
      .input("id", sql.Int, eventoId)
      .input("nombre", sql.VarChar, nombre)
      .input("descripcion", sql.Text, descripcion)
      .input("fecha", sql.Date, fecha)
      .input("lugar", sql.VarChar, lugar)
      .input("capacidad", sql.Int, capacidad)
      .input("estado", sql.VarChar, estado)
      .query(
        `UPDATE Eventos SET nombre = @nombre, descripcion = @descripcion, fecha = @fecha, lugar = @lugar, capacidad = @capacidad, estado = @estado WHERE id = @id`
      );

    res.json({ msg: "Evento actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar evento" });
  }
}

module.exports = { listarEventos, crearEvento, actualizarEvento };
