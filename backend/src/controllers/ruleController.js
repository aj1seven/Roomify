const { initModels } = require("../models");

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min || i > max) return null;
  return i;
}

async function getRules(req, res, next) {
  try {
    const { BookingRule } = await initModels();
    const rule = await BookingRule.findByPk(1);
    return res.json(rule);
  } catch (err) {
    next(err);
  }
}

async function updateRules(req, res, next) {
  try {
    const { BookingRule } = await initModels();
    const rule = await BookingRule.findByPk(1);
    if (!rule) return res.status(404).json({ message: "Rules not found" });

    const workStart = clampInt(req.body.work_start_minute, 0, 24 * 60 - 1);
    const workEnd = clampInt(req.body.work_end_minute, 1, 24 * 60);
    const maxMinutes = clampInt(req.body.max_booking_minutes, 15, 24 * 60);
    const slotMinutes = clampInt(req.body.slot_minutes, 5, 240);

    if (workStart == null || workEnd == null || maxMinutes == null || slotMinutes == null) {
      return res.status(400).json({ message: "Invalid rule values" });
    }
    if (workStart >= workEnd) {
      return res.status(400).json({ message: "work_start_minute must be less than work_end_minute" });
    }
    if (maxMinutes % slotMinutes !== 0) {
      return res.status(400).json({ message: "max_booking_minutes must be a multiple of slot_minutes" });
    }

    rule.work_start_minute = workStart;
    rule.work_end_minute = workEnd;
    rule.max_booking_minutes = maxMinutes;
    rule.slot_minutes = slotMinutes;
    await rule.save();

    return res.json(rule);
  } catch (err) {
    next(err);
  }
}

module.exports = { getRules, updateRules };

