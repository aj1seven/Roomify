const { Sequelize } = require("sequelize");

let sequelizeInstance;

async function getSequelize() {
  if (sequelizeInstance) return sequelizeInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in Railway variables");
  }

  sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      underscored: true
    }
  });

  return sequelizeInstance;
}

module.exports = { getSequelize };
