const { DataTypes } = require("sequelize");

function UserModel(sequelize) {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM("EMPLOYEE", "ADMIN"),
        allowNull: false,
        defaultValue: "EMPLOYEE"
      }
    },
    {
      tableName: "users",
      timestamps: true
    }
  );

  return User;
}

module.exports = { UserModel };
