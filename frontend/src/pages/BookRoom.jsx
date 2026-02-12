import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

function availabilityReasonMessage(reason) {
  if (!reason) return "";
  if (reason === "ROOM_BLOCKED") return "Room is blocked (maintenance).";
  if (reason === "MAX_DURATION_EXCEEDED") return "Selected duration exceeds the maximum allowed.";
  if (reason === "OUTSIDE_WORKING_HOURS") return "Selected time is outside office working hours.";
  if (reason === "NOT_ALIGNED_TO_SLOT") return "Selected time must align to the configured slot size (e.g., 30-minute slots).";
  return String(reason);
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInputValue(value) {
  // value like "YYYY-MM-DDTHH:mm" -> local Date
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function snapUpToSlot(date, slotMinutes) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const snapped = Math.ceil(minutes / slotMinutes) * slotMinutes;
  d.setSeconds(0, 0);
  if (snapped === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(snapped);
  }
  return d;
}

function durationOptions(slotMinutes, maxBookingMinutes) {
  const opts = [];
  for (let m = slotMinutes; m <= maxBookingMinutes; m += slotMinutes) {
    let label = `${m} min`;
    if (m % 60 === 0) label = `${m / 60} hr`;
    else if (m > 60) label = `${Math.floor(m / 60)} hr ${m % 60} min`;
    opts.push({ minutes: m, label });
  }
  return opts;
}

export default function BookRoom() {
  const { id } = useParams();
  const roomId = Number(id);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);

  const [rules, setRules] = useState(null);
  const slotMinutes = rules?.slot_minutes ?? 30;
  const maxBookingMinutes = rules?.max_booking_minutes ?? 120;

  const [start, setStart] = useState(toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)));
  const [duration, setDuration] = useState(60);
  const end = useMemo(() => {
    const d = fromLocalInputValue(start);
    if (!d) return "";
    return toLocalInputValue(addMinutes(d, Number(duration)));
  }, [start, duration]);

  const [attendees, setAttendees] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [roomsRes, rulesRes] = await Promise.all([api.get("/rooms"), api.get("/rules")]);
        setRooms(roomsRes.data);
        setRules(rulesRes.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalizeStart = (value) => {
    const d = fromLocalInputValue(value);
    if (!d) return value;
    const snapped = snapUpToSlot(d, slotMinutes);
    return toLocalInputValue(snapped);
  };

  const check = async () => {
    setAvailability(null);
    setError("");
    try {
      const { data } = await api.get(`/rooms/${roomId}/availability`, {
        params: { start: new Date(start).toISOString(), end: new Date(end).toISOString() }
      });
      setAvailability(data);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to check availability";
      setError(msg);
      return null;
    }
  };

  const book = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      if (room && Number(attendees) > room.capacity) {
        setError(`Attendees cannot exceed room capacity (${room.capacity}).`);
        setSubmitting(false);
        return;
      }
      const a = await check();
      if (!a || !a.available) {
        setSubmitting(false);
        return;
      }
      await api.post("/bookings", {
        roomId,
        attendees: Number(attendees),
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString()
      });
      setMessage("Booking created.");
      setTimeout(() => navigate("/my-bookings"), 600);
    } catch (err) {
      setError(err?.response?.data?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card muted">Loading...</div>;

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Book room</h2>
            <div className="muted">
              Room:{" "}
              {room ? (
                <>
                  <strong>{room.name}</strong> (Floor {room.floor}, Capacity {room.capacity})
                </>
              ) : (
                "Unknown"
              )}
            </div>
          </div>
          <Link className="pill" to="/rooms">
            Back to rooms
          </Link>
        </div>
      </div>

      <div className="card">
        <form className="stack" onSubmit={book}>
          <div className="row">
            <div style={{ flex: 1, minWidth: 240 }}>
              <label>Start</label>
              <input
                type="datetime-local"
                value={start}
                step={slotMinutes * 60}
                onChange={(e) => setStart(normalizeStart(e.target.value))}
              />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label>Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {durationOptions(slotMinutes, maxBookingMinutes).map((o) => (
                  <option key={o.minutes} value={o.minutes}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div style={{ flex: 1, minWidth: 240 }}>
              <label>End (auto)</label>
              <input type="datetime-local" value={end} disabled />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label>Attendees</label>
              <input
                type="number"
                min="1"
                max={room?.capacity ?? 999}
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
              {room && (
                <div className="muted" style={{ marginTop: 6 }}>
                  Capacity: <strong>{room.capacity}</strong> • Seats left:{" "}
                  <strong>{Math.max(0, Number(room.capacity) - Number(attendees || 0))}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <button type="button" className="btn secondary" onClick={check} disabled={submitting}>
              Check availability
            </button>
            <button className="btn" disabled={submitting}>
              {submitting ? "Booking..." : "Book"}
            </button>
          </div>

          {availability && !availability.error && (
            <div>
              {availability.available ? (
                <span className="pill ok">Available</span>
              ) : (
                <span className="pill blocked">
                  Not available {availability.reason ? `(${availabilityReasonMessage(availability.reason)})` : ""}
                </span>
              )}
              {Array.isArray(availability.conflicts) && availability.conflicts.length > 0 && (
                <div className="muted" style={{ marginTop: 8 }}>
                  Conflicts:
                  <ul style={{ margin: "6px 0 0 18px" }}>
                    {availability.conflicts.map((c) => (
                      <li key={c.id}>
                        {new Date(c.start_time).toLocaleString()} → {new Date(c.end_time).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
        </form>
      </div>
    </div>
  );
}

