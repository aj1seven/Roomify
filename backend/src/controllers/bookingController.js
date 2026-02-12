const { Op, fn, col, literal } = require("sequelize");
const { initModels } = require("../models");

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function minutesSinceMidnight(d) {
  return d.getHours() * 60 + d.getMinutes();
}

function diffMinutes(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

async function createBooking(req, res, next) {
  try {
    const { roomId, start_time, end_time, attendees } = req.body;
    const start = parseDate(start_time);
    const end = parseDate(end_time);

    if (!start || !end) {
      return res.status(400).json({ message: "start_time and end_time are required" });
    }
    if (start >= end) {
      return res.status(400).json({ message: "start_time must be before end_time" });
    }

    const { sequelize, Room, Booking, BookingRule } = await initModels();

    const rules = await BookingRule.findByPk(1);
    if (!rules) {
      return res.status(500).json({ message: "Booking rules not configured" });
    }

    const durationMinutes = diffMinutes(start, end);
    if (durationMinutes <= 0) {
      return res.status(400).json({ message: "Invalid booking duration" });
    }
    if (durationMinutes > rules.max_booking_minutes) {
      return res.status(400).json({ message: `Maximum booking duration is ${rules.max_booking_minutes} minutes` });
    }

    const startMin = minutesSinceMidnight(start);
    const endMin = minutesSinceMidnight(end);
    if (startMin < rules.work_start_minute || endMin > rules.work_end_minute) {
      return res.status(400).json({ message: "Booking must be within office working hours" });
    }
    if (startMin % rules.slot_minutes !== 0 || endMin % rules.slot_minutes !== 0) {
      return res.status(400).json({ message: `Bookings must align to ${rules.slot_minutes}-minute slots` });
    }

    const created = await sequelize.transaction(async (t) => {
      const room = await Room.findByPk(roomId, { transaction: t });
      if (!room) {
        const err = new Error("Room not found");
        err.statusCode = 404;
        throw err;
      }
      if (room.status === "BLOCKED") {
        const err = new Error("Room is blocked (maintenance)");
        err.statusCode = 409;
        throw err;
      }

      const attendeeCount = Math.trunc(Number(attendees ?? 1));
      if (!Number.isFinite(attendeeCount) || attendeeCount < 1) {
        const err = new Error("attendees must be a positive integer");
        err.statusCode = 400;
        throw err;
      }
      if (attendeeCount > room.capacity) {
        const err = new Error(`attendees cannot exceed room capacity (${room.capacity})`);
        err.statusCode = 400;
        throw err;
      }

      // Overlap rule:
      // booking fails if new_start < existing_end AND new_end > existing_start
      const conflict = await Booking.findOne({
        where: {
          room_id: room.id,
          status: "BOOKED",
          start_time: { [Op.lt]: end },
          end_time: { [Op.gt]: start }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (conflict) {
        const err = new Error("Time slot overlaps with an existing booking");
        err.statusCode = 409;
        throw err;
      }

      return await Booking.create(
        {
          user_id: req.user.id,
          room_id: room.id,
          attendees: attendeeCount,
          start_time: start,
          end_time: end,
          status: "BOOKED"
        },
        { transaction: t }
      );
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

async function checkInBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { Booking } = await initModels();

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (booking.status !== "BOOKED") {
      return res.status(400).json({ message: "Only active bookings can be checked in" });
    }
    if (booking.checked_in_at) {
      return res.status(400).json({ message: "Already checked in" });
    }

    const now = new Date();
    const start = new Date(booking.start_time);
    const minutesBeforeStart = diffMinutes(now, start) * -1; // positive if before
    const minutesAfterStart = diffMinutes(start, now); // positive if after

    // Allow check-in from 15 minutes before start until 30 minutes after start
    if (minutesBeforeStart > 15 || minutesAfterStart > 30) {
      return res.status(400).json({ message: "Check-in window is closed for this booking" });
    }

    booking.checked_in_at = now;
    await booking.save();

    return res.json({ message: "Checked in", checked_in_at: booking.checked_in_at });
  } catch (err) {
    next(err);
  }
}
async function getMyBookings(req, res, next) {
  try {
    const { Booking, Room } = await initModels();
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Room }],
      order: [["start_time", "DESC"]]
    });
    return res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { Booking } = await initModels();

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    booking.status = "CANCELLED";
    await booking.save();
    return res.json({ message: "Booking cancelled" });
  } catch (err) {
    next(err);
  }
}

async function getAllBookings(req, res, next) {
  try {
    const { Booking, Room, User } = await initModels();
    const bookings = await Booking.findAll({
      include: [{ model: Room }, { model: User, attributes: ["id", "name", "email", "role"] }],
      order: [["start_time", "DESC"]]
    });
    return res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const { Booking, Room } = await initModels();

    // total bookings per day (BOOKED + CANCELLED, but most useful is BOOKED)
    const perDay = await Booking.findAll({
      attributes: [[fn("DATE", col("start_time")), "day"], [fn("COUNT", col("id")), "total"]],
      where: {
        status: "BOOKED"
      },
      group: [literal("day")],
      order: [[literal("day"), "DESC"]],
      raw: true
    });

    const perRoom = await Booking.findAll({
      attributes: ["room_id", [fn("COUNT", col("Booking.id")), "total"]],
      where: { status: "BOOKED" },
      include: [{ model: Room, attributes: ["id", "name"] }],
      group: ["room_id", "Room.id", "Room.name"],
      order: [[fn("COUNT", col("Booking.id")), "DESC"]],
      raw: false
    });

    const total = await Booking.count();
    const checkedIn = await Booking.count({ where: { checked_in_at: { [Op.ne]: null } } });

    return res.json({ perDay, perRoom, totals: { total, checkedIn } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings, getStats, checkInBooking };
