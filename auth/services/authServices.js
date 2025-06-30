const { sql, poolPromise } = require("../../auth-service/config/db");
const bcrypt = require("bcrypt");

async function registrar(username, password, role) {
  const pool = await poolPromise; // <- aquí debe resolverse bien la conexión

  if (!pool)
    throw new Error("No se pudo establecer conexión con la base de datos");

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool
    .request()
    .input("usuario", sql.VarChar(50), username)
    .input("passwordHash", sql.VarChar(255), passwordHash)
    .input("rol", sql.VarChar(20), role)
    .query(
      `INSERT INTO Usuarios (usuario, passwordHash, rol) VALUES (@usuario, @passwordHash, @rol)`
    );

  return result.rowsAffected[0];
}

module.exports = { registrar };
