const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME;

  if (!dbName) {
    throw new Error("DB_NAME is not set");
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();
}

let sequelize;

async function getSequelize() {
  if (sequelize) return sequelize;

  await ensureDatabaseExists();

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";

  sequelize = new Sequelize(dbName, user, password, {
    host,
    port,
    dialect: "mysql",
    logging: false,
    define: {
      underscored: true
    }
  });

  return sequelize;
}

module.exports = { getSequelize };
