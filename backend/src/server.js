require("dotenv").config();

const bcrypt = require("bcrypt");
const app = require("./app");
const {
  sequelize,
  User,
  BookingRule,
} = require("./models");

async function ensureAdminUser() {
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
    role: "ADMIN",
  });

  console.log(`Seeded admin user: ${email}`);
}

async function ensureBookingRules() {
  const existing = await BookingRule.findByPk(1);
  if (existing) return;

  await BookingRule.create({
    id: 1,
    work_start_minute: 9 * 60,
    work_end_minute: 18 * 60,
    max_booking_minutes: 120,
    slot_minutes: 30,
  });

  console.log("Seeded default booking rules.");
}

async function start() {
  const port = Number(process.env.PORT || 5005);

  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // In production we DO NOT use alter
    await sequelize.sync({
      alter: process.env.NODE_ENV !== "production",
    });

    await ensureAdminUser();
    await ensureBookingRules();

    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
