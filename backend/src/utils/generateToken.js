const jwt = require("jsonwebtoken");

function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  const expiresIn = process.env.JWT_EXPIRE || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = { generateToken };
