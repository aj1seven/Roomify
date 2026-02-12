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
  const port = Number(process.env.PORT) || 5005;

  const { sequelize, User, BookingRule } = await initModels();

  await sequelize.authenticate();
  console.log("Database connected");

  // In production, don't auto-alter tables
  await sequelize.sync({
    alter: process.env.NODE_ENV !== "production"
  });

  await ensureAdminUser(User);
  await ensureBookingRules(BookingRule);

  // Health route for Railway root URL
  app.get("/", (req, res) => {
    res.json({
      status: "success",
      message: "Office Meeting Room Booking Backend is running 🚀"
    });
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
