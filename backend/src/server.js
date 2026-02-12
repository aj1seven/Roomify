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
  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${email}`);
}

async function ensureBookingRules(BookingRule) {
  const existing = await BookingRule.findByPk(1);
  if (existing) return;

  // Default rules: 9:00–18:00, max 120 minutes, 30-minute slots
  await BookingRule.create({
    id: 1,
    work_start_minute: 9 * 60,
    work_end_minute: 18 * 60,
    max_booking_minutes: 120,
    slot_minutes: 30
  });
  // eslint-disable-next-line no-console
  console.log("Seeded default booking rules.");
}

async function start() {
  const port = Number(process.env.PORT || 5005);

  const { sequelize, User, BookingRule } = await initModels();

  await sequelize.authenticate();
  // Auto-evolve schema in development (adds columns like Booking.attendees, BookingRule table, etc.)
  await sequelize.sync({ alter: process.env.NODE_ENV !== "production" });

  await ensureAdminUser(User);
  await ensureBookingRules(BookingRule);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});

