const express = require("express");
const { body, validationResult } = require("express-validator");
const { register, login } = require("../controllers/authController");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("password must be at least 6 characters")
  ],
  validate,
  register
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("valid email is required"), body("password").notEmpty().withMessage("password is required")],
  validate,
  login
);

module.exports = router;
