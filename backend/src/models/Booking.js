const { DataTypes } = require("sequelize");

function BookingModel(sequelize) {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      room_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      attendees: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      checked_in_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("BOOKED", "CANCELLED"),
        allowNull: false,
        defaultValue: "BOOKED"
      }
    },
    {
      tableName: "bookings",
      timestamps: true,
      indexes: [
        { fields: ["room_id"] },
        { fields: ["user_id"] },
        { fields: ["attendees"] },
        { fields: ["start_time"] },
        { fields: ["end_time"] }
      ]
    }
  );

  return Booking;
}

module.exports = { BookingModel };
