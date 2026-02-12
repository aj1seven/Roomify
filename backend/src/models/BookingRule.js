const { DataTypes } = require("sequelize");

function BookingRuleModel(sequelize) {
  const BookingRule = sequelize.define(
    "BookingRule",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      work_start_minute: {
        // minutes from midnight, local-office time
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 9 * 60
      },
      work_end_minute: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 18 * 60
      },
      max_booking_minutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 120
      },
      slot_minutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 30
      }
    },
    {
      tableName: "booking_rules",
      timestamps: true
    }
  );

  return BookingRule;
}

module.exports = { BookingRuleModel };

