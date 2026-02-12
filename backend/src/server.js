require("dotenv").config();

const bcrypt = require("bcrypt");
const app = require("./app");
const { initModels } = require("./models");

async function ensureAdminUser(User) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Office Admin";

  if (!email || !password) return;

  const existing = await User.findOne({ where: { email } });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashed,
    role: "ADMIN"
  });

  console.log("Admin seeded");
}

async function ensureBookingRules(BookingRule) {
  const existing = await BookingRule.findByPk(1);
  if (existing) return;

  await BookingRule.create({
    id: 1,
    work_start_minute: 9 * 60,
    work_end_minute: 18 * 60,
    max_booking_minutes: 120,
    slot_minutes: 30
  });

  console.log("Booking rules seeded");
}

async function start() {
  const port = process.env.PORT || 5005;

  const models = await initModels();
  const { sequelize, User, BookingRule } = models;

  await sequelize.authenticate();
  console.log("Database connected");

  await sequelize.sync();

  await ensureAdminUser(User);
  await ensureBookingRules(BookingRule);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
