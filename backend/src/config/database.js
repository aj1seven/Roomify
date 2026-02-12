const { Sequelize } = require("sequelize");

let sequelize;

async function getSequelize() {
  if (sequelize) return sequelize;

  // 🚀 Use Railway DATABASE_URL in production
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "mysql",
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === "production"
          ? { require: true, rejectUnauthorized: false }
          : false
      },
      define: {
        underscored: true
      }
    });
  } else {
    // 🧪 Local development fallback
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: false,
        define: {
          underscored: true
        }
      }
    );
  }

  return sequelize;
}

module.exports = { getSequelize };
