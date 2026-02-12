const { getSequelize } = require("../config/database");
const { UserModel } = require("./User");
const { RoomModel } = require("./Room");
const { BookingModel } = require("./Booking");
const { BookingRuleModel } = require("./BookingRule");

let models;

async function initModels() {
  if (models) return models;

  const sequelize = await getSequelize();

  const User = UserModel(sequelize);
  const Room = RoomModel(sequelize);
  const Booking = BookingModel(sequelize);
  const BookingRule = BookingRuleModel(sequelize);

  User.hasMany(Booking, { foreignKey: "user_id" });
  Booking.belongsTo(User, { foreignKey: "user_id" });

  Room.hasMany(Booking, { foreignKey: "room_id" });
  Booking.belongsTo(Room, { foreignKey: "room_id" });

  models = { sequelize, User, Room, Booking, BookingRule };

  return models;
}

module.exports = { initModels };
