const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { roleMiddleware } = require("../middlewares/roleMiddleware");
const { getRules, updateRules } = require("../controllers/ruleController");

const router = express.Router();

// Any authenticated user can read the current rules (for UI hints)
router.get("/", authMiddleware, getRules);

// Only admins can update booking rules
router.put("/", authMiddleware, roleMiddleware("ADMIN"), updateRules);

module.exports = router;

