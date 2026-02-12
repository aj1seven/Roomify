import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, getUser } from "../services/api";

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

export default function Rooms() {
  const user = getUser();
  const [rooms, setRooms] = useState([]);
  const [rules, setRules] = useState(null);
  const slotMinutes = rules?.slot_minutes ?? 30;
  const maxBookingMinutes = rules?.max_booking_minutes ?? 120;
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // quick availability checker (for one selected room)
  const [checkRoomId, setCheckRoomId] = useState("");
  const [start, setStart] = useState(toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)));
  const [duration, setDuration] = useState(60);
  const end = useMemo(() => {
    const d = fromLocalInputValue(start);
    if (!d) return "";
    return toLocalInputValue(addMinutes(d, Number(duration)));
  }, [start, duration]);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rooms;
    return rooms.filter((r) => [r.name, r.floor, String(r.capacity), r.status].some((x) => String(x).toLowerCase().includes(term)));
  }, [rooms, q]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [roomsRes, rulesRes] = await Promise.all([api.get("/rooms"), api.get("/rules")]);
      const data = roomsRes.data;
      setRooms(data);
      setRules(rulesRes.data);
      if (data?.length && !checkRoomId) setCheckRoomId(String(data[0].id));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeStart = (value) => {
    const d = fromLocalInputValue(value);
    if (!d) return value;
    const snapped = snapUpToSlot(d, slotMinutes);
    return toLocalInputValue(snapped);
  };

  const check = async (e) => {
    e.preventDefault();
    setAvailability(null);
    setChecking(true);
    try {
      const { data } = await api.get(`/rooms/${checkRoomId}/availability`, {
        params: { start: new Date(start).toISOString(), end: new Date(end).toISOString() }
      });
      setAvailability(data);
    } catch (err) {
      setAvailability({ error: err?.response?.data?.message || "Failed to check availability" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Meeting rooms</h2>
            <div className="muted">Browse rooms and check availability.</div>
          </div>
          <button className="btn secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="card error">{error}</div>}

      <div className="card">
        <div className="row" style={{ alignItems: "end" }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <label>Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, floor, capacity, status..." />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Quick availability (room)</label>
            <select value={checkRoomId} onChange={(e) => setCheckRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} {r.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Start</label>
            <input
              type="datetime-local"
              value={start}
              step={slotMinutes * 60}
              onChange={(e) => setStart(normalizeStart(e.target.value))}
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Duration</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {durationOptions(slotMinutes, maxBookingMinutes).map((o) => (
                <option key={o.minutes} value={o.minutes}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button className="btn" onClick={check} disabled={checking || !checkRoomId}>
              {checking ? "Checking..." : "Check"}
            </button>
          </div>
        </div>

        <div className="muted" style={{ marginTop: 8 }}>
          End (auto): <strong>{end ? new Date(end).toLocaleString() : "-"}</strong>
        </div>

        {availability?.error && <div className="error" style={{ marginTop: 10 }}>{availability.error}</div>}
        {availability && !availability.error && (
          <div style={{ marginTop: 10 }}>
            {availability.available ? (
              <span className="pill ok">Available</span>
            ) : (
              <span className="pill blocked">
                Not available {availability.reason ? `(${availabilityReasonMessage(availability.reason)})` : ""}
              </span>
            )}
            {Array.isArray(availability.conflicts) && availability.conflicts.length > 0 && (
              <div className="muted" style={{ marginTop: 8 }}>
                Conflicts: {availability.conflicts.length}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="muted">Loading rooms...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No rooms found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Capacity</th>
                <th>Floor</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.capacity}</td>
                  <td>{r.floor}</td>
                  <td>
                    {r.status === "AVAILABLE" ? <span className="pill ok">AVAILABLE</span> : <span className="pill blocked">BLOCKED</span>}
                  </td>
                  <td>
                    {user?.role === "EMPLOYEE" ? (
                      <Link className="pill" to={`/rooms/${r.id}/book`}>
                        Book
                      </Link>
                    ) : (
                      <span className="muted">Manage in Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

