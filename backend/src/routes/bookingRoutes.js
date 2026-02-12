const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { roleMiddleware } = require("../middlewares/roleMiddleware");
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  getStats,
  checkInBooking
} = require("../controllers/bookingController");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

// Employee
router.post(
  "/",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  [
    body("roomId").isInt().withMessage("roomId must be an integer"),
    body("attendees").optional().isInt({ min: 1 }).withMessage("attendees must be >= 1"),
    body("start_time").notEmpty().withMessage("start_time is required"),
    body("end_time").notEmpty().withMessage("end_time is required")
  ],
  validate,
  createBooking
);

router.get("/my", authMiddleware, roleMiddleware("EMPLOYEE"), getMyBookings);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  [param("id").isInt().withMessage("id must be an integer")],
  validate,
  cancelBooking
);

router.post(
  "/:id/checkin",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  [param("id").isInt().withMessage("id must be an integer")],
  validate,
  checkInBooking
);

// Admin
router.get("/", authMiddleware, roleMiddleware("ADMIN"), getAllBookings);
router.get("/stats", authMiddleware, roleMiddleware("ADMIN"), getStats);

module.exports = router;
