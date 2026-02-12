const { DataTypes } = require("sequelize");

function RoomModel(sequelize) {
  const Room = sequelize.define(
    "Room",
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
      capacity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      floor: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("AVAILABLE", "BLOCKED"),
        allowNull: false,
        defaultValue: "AVAILABLE"
      }
    },
    {
      tableName: "rooms",
      timestamps: true
    }
  );

  return Room;
}

module.exports = { RoomModel };
