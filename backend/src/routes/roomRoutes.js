const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { roleMiddleware } = require("../middlewares/roleMiddleware");
const { getRooms, createRoom, updateRoom, deleteRoom, getAvailability } = require("../controllers/roomController");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

router.get("/", authMiddleware, getRooms);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("capacity").isInt({ min: 1 }).withMessage("capacity must be >= 1"),
    body("floor").trim().notEmpty().withMessage("floor is required"),
    body("status").optional().isIn(["AVAILABLE", "BLOCKED"]).withMessage("status must be AVAILABLE or BLOCKED")
  ],
  validate,
  createRoom
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  [
    param("id").isInt().withMessage("id must be an integer"),
    body("name").optional().trim().notEmpty(),
    body("capacity").optional().isInt({ min: 1 }),
    body("floor").optional().trim().notEmpty(),
    body("status").optional().isIn(["AVAILABLE", "BLOCKED"])
  ],
  validate,
  updateRoom
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  [param("id").isInt().withMessage("id must be an integer")],
  validate,
  deleteRoom
);

router.get(
  "/:id/availability",
  authMiddleware,
  [
    param("id").isInt().withMessage("id must be an integer"),
    query("start").notEmpty().withMessage("start is required"),
    query("end").notEmpty().withMessage("end is required")
  ],
  validate,
  getAvailability
);

module.exports = router;
