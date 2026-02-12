const sequelize = require("../config/database");

const { UserModel } = require("./User");
const { RoomModel } = require("./Room");
const { BookingModel } = require("./Booking");
const { BookingRuleModel } = require("./BookingRule");

const User = UserModel(sequelize);
const Room = RoomModel(sequelize);
const Booking = BookingModel(sequelize);
const BookingRule = BookingRuleModel(sequelize);

// Associations
User.hasMany(Booking, { foreignKey: "user_id" });
Booking.belongsTo(User, { foreignKey: "user_id" });

Room.hasMany(Booking, { foreignKey: "room_id" });
Booking.belongsTo(Room, { foreignKey: "room_id" });

module.exports = {
  sequelize,
  User,
  Room,
  Booking,
  BookingRule,
};
