const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE || "",
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("📦 Conexión con SQL Server Auth Service establecida");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Error conexión SQL Auth Service:", err);
  });

module.exports = {
  sql,
  poolPromise,
};
