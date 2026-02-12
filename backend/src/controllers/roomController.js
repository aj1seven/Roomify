const { Op } = require("sequelize");
const { initModels } = require("../models");

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function minutesSinceMidnight(d) {
  return d.getHours() * 60 + d.getMinutes();
}

async function getRooms(req, res, next) {
  try {
    const { Room } = await initModels();
    const rooms = await Room.findAll({ order: [["id", "DESC"]] });
    return res.json(rooms);
  } catch (err) {
    next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    const { name, capacity, floor, status } = req.body;
    const { Room } = await initModels();

    const room = await Room.create({
      name,
      capacity,
      floor,
      status: status || "AVAILABLE"
    });

    return res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { Room } = await initModels();

    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const { name, capacity, floor, status } = req.body;
    if (name !== undefined) room.name = name;
    if (capacity !== undefined) room.capacity = capacity;
    if (floor !== undefined) room.floor = floor;
    if (status !== undefined) room.status = status;

    await room.save();
    return res.json(room);
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { Room } = await initModels();

    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    await room.destroy();
    return res.json({ message: "Room deleted" });
  } catch (err) {
    next(err);
  }
}

async function getAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const start = parseDate(req.query.start);
    const end = parseDate(req.query.end);

    if (!start || !end) {
      return res.status(400).json({ message: "start and end are required" });
    }
    if (start >= end) {
      return res.status(400).json({ message: "start must be before end" });
    }

    const { Room, Booking, BookingRule } = await initModels();
    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.status === "BLOCKED") {
      return res.json({ available: false, reason: "ROOM_BLOCKED" });
    }

    const rules = await BookingRule.findByPk(1);
    if (!rules) {
      return res.status(500).json({ message: "Booking rules not configured" });
    }

    const startMin = minutesSinceMidnight(start);
    const endMin = minutesSinceMidnight(end);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    if (durationMinutes <= 0) {
      return res.status(400).json({ message: "Invalid booking duration" });
    }
    if (durationMinutes > rules.max_booking_minutes) {
      return res.json({ available: false, reason: "MAX_DURATION_EXCEEDED" });
    }
    if (startMin < rules.work_start_minute || endMin > rules.work_end_minute) {
      return res.json({ available: false, reason: "OUTSIDE_WORKING_HOURS" });
    }
    if (startMin % rules.slot_minutes !== 0 || endMin % rules.slot_minutes !== 0) {
      return res.json({ available: false, reason: "NOT_ALIGNED_TO_SLOT" });
    }

    const conflicts = await Booking.findAll({
      where: {
        room_id: room.id,
        status: "BOOKED",
        start_time: { [Op.lt]: end },
        end_time: { [Op.gt]: start }
      },
      order: [["start_time", "ASC"]]
    });

    return res.json({
      available: conflicts.length === 0,
      conflicts
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRooms, createRoom, updateRoom, deleteRoom, getAvailability };
