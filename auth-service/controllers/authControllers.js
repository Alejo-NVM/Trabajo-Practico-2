const { poolPromise, sql } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { generarSugerencias } = require("../utils/generarSugerencias");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRATION = process.env.REFRESH_EXPIRATION || "1d";

const rolesPermitidos = [
  "asistente",
  "organizador",
  "expositor",
  "administrador",
];

async function registrarUsuario(req, res) {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: "Faltan datos" });

  try {
    const pool = await poolPromise;

    const userExist = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM Usuarios WHERE usuario = @username");

    if (userExist.recordset.length > 0) {
      // Sugerencias si el usuario existe
      const sugerencias = generarSugerencias(username);
      return res.status(409).json({
        message: "Nombre de usuario ocupado. ¿No prefiere uno de estos?",
        sugerencias,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const secret = speakeasy.generateSecret({
      name: `GestionEventos (${username})`,
    });

    await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("role", sql.NVarChar, role)
      .input("totpSecret", sql.NVarChar, secret.base32)
      .query(
        "INSERT INTO Usuarios (usuario, passwordHash, rol, totpSecret) VALUES (@username, @passwordHash, @role, @totpSecret)"
      );

    // Generar QR como imagen PNG y enviarlo como respuesta
    qrcode.toBuffer(secret.otpauth_url, { type: "png" }, (err, buffer) => {
      if (err) {
        console.error("Error generando QR:", err);
        return res.status(500).json({ message: "Error generando código QR" });
      }
      // Establecemos que la respuesta es imagen PNG
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    });
  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function registrarDesdeAuthBasic(req, res) {
  const authHeader = req.headers["authorization"];
  const { role } = req.body;

  if (!authHeader || !authHeader.startsWith("Basic ") || !role)
    return res
      .status(400)
      .json({ message: "Datos insuficientes o mal formateados" });

  const credentials = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString()
    .split(":");
  const [username, password] = credentials;

  req.body = { username, password, role };
  return registrarUsuario(req, res);
}

async function login(req, res) {
  const { username, password, totpCode } = req.body;
  if (!username || !password || !totpCode)
    return res.status(400).json({ message: "Faltan datos" });

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM Usuarios WHERE usuario = @username");

    if (result.recordset.length === 0)
      return res.status(400).json({ message: "Usuario no encontrado" });

    const user = result.recordset[0];

    const validPass = await bcrypt.compare(password, user.passwordHash);
    if (!validPass)
      return res.status(401).json({ message: "Password incorrecta" });

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });

    if (!verified)
      return res.status(401).json({ message: "Código TOTP inválido" });

    const payload = { id: user.id, username: user.usuario, role: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRATION,
    });

    res.json({ token, refreshToken });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

function refreshToken(req, res) {
  const { refreshToken: tokenRecibido } = req.body;
  if (!tokenRecibido) return res.status(400).json({ message: "Faltan datos" });

  try {
    const payload = jwt.verify(tokenRecibido, REFRESH_SECRET);
    const token = jwt.sign(
      { id: payload.id, username: payload.username, role: payload.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );
    res.json({ token });
  } catch (err) {
    console.error("Error en /refresh:", err);
    return res
      .status(401)
      .json({ message: "Refresh token inválido o expirado" });
  }
}

module.exports = {
  registrarUsuario,
  registrarDesdeAuthBasic,
  login,
  refreshToken,
};
