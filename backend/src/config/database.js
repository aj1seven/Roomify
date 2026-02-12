const { Sequelize } = require("sequelize");

let sequelize;

async function getSequelize() {
  if (sequelize) return sequelize;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "mysql",
    logging: false,
    define: {
      underscored: true
    }
  });

  return sequelize;
}

module.exports = { getSequelize };
