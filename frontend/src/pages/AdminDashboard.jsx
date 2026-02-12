import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("rooms"); // rooms | bookings | stats | rules
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [rules, setRules] = useState(null);
  const [rulesForm, setRulesForm] = useState({
    work_start_minute: 540,
    work_end_minute: 1080,
    max_booking_minutes: 120,
    slot_minutes: 30
  });

  const [roomForm, setRoomForm] = useState({ id: null, name: "", capacity: 4, floor: "1", status: "AVAILABLE" });
  const isEditing = useMemo(() => roomForm.id != null, [roomForm.id]);

  const loadRooms = async () => {
    const { data } = await api.get("/rooms");
    setRooms(data);
  };
  const loadBookings = async () => {
    const { data } = await api.get("/bookings");
    setBookings(data);
  };
  const loadStats = async () => {
    const { data } = await api.get("/bookings/stats");
    setStats(data);
  };
  const loadRules = async () => {
    const { data } = await api.get("/rules");
    setRules(data);
    if (data) {
      setRulesForm({
        work_start_minute: data.work_start_minute,
        work_end_minute: data.work_end_minute,
        max_booking_minutes: data.max_booking_minutes,
        slot_minutes: data.slot_minutes
      });
    }
  };

  const refresh = async () => {
    setError("");
    setMessage("");
    try {
      if (tab === "rooms") await loadRooms();
      if (tab === "bookings") await loadBookings();
      if (tab === "stats") await loadStats();
      if (tab === "rules") await loadRules();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const submitRoom = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (isEditing) {
        await api.put(`/rooms/${roomForm.id}`, {
          name: roomForm.name,
          capacity: Number(roomForm.capacity),
          floor: String(roomForm.floor),
          status: roomForm.status
        });
        setMessage("Room updated.");
      } else {
        await api.post("/rooms", {
          name: roomForm.name,
          capacity: Number(roomForm.capacity),
          floor: String(roomForm.floor),
          status: roomForm.status
        });
        setMessage("Room created.");
      }
      setRoomForm({ id: null, name: "", capacity: 4, floor: "1", status: "AVAILABLE" });
      await loadRooms();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    }
  };

  const editRoom = (r) => {
    setRoomForm({ id: r.id, name: r.name, capacity: r.capacity, floor: r.floor, status: r.status });
    setTab("rooms");
  };

  const removeRoom = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/rooms/${id}`);
      setMessage("Room deleted.");
      await loadRooms();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  const toggleBlock = async (r) => {
    setError("");
    setMessage("");
    try {
      await api.put(`/rooms/${r.id}`, { status: r.status === "AVAILABLE" ? "BLOCKED" : "AVAILABLE" });
      setMessage(r.status === "AVAILABLE" ? "Room blocked." : "Room unblocked.");
      await loadRooms();
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed");
    }
  };

  const saveRules = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        work_start_minute: Number(rulesForm.work_start_minute),
        work_end_minute: Number(rulesForm.work_end_minute),
        max_booking_minutes: Number(rulesForm.max_booking_minutes),
        slot_minutes: Number(rulesForm.slot_minutes)
      };
      const { data } = await api.put("/rules", payload);
      setRules(data);
      setRulesForm({
        work_start_minute: data.work_start_minute,
        work_end_minute: data.work_end_minute,
        max_booking_minutes: data.max_booking_minutes,
        slot_minutes: data.slot_minutes
      });
      setMessage("Rules updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update rules");
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin dashboard</h2>
            <div className="muted">Manage rooms, view bookings, and usage stats.</div>
          </div>
          <div className="row">
            <button className={`btn ${tab === "rooms" ? "" : "secondary"}`} onClick={() => setTab("rooms")}>
              Rooms
            </button>
            <button className={`btn ${tab === "bookings" ? "" : "secondary"}`} onClick={() => setTab("bookings")}>
              Bookings
            </button>
            <button className={`btn ${tab === "stats" ? "" : "secondary"}`} onClick={() => setTab("stats")}>
              Stats
            </button>
            <button className={`btn ${tab === "rules" ? "" : "secondary"}`} onClick={() => setTab("rules")}>
              Rules
            </button>
            <button className="btn secondary" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && <div className="card error">{error}</div>}
      {message && <div className="card success">{message}</div>}

      {tab === "rooms" && (
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>{isEditing ? "Edit room" : "Add room"}</h3>
            <form className="stack" onSubmit={submitRoom}>
              <div className="stack" style={{ gap: 6 }}>
                <label>Name</label>
                <input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} />
              </div>
              <div className="row">
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label>Floor</label>
                  <input value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} />
                </div>
              </div>
              <div className="stack" style={{ gap: 6 }}>
                <label>Status</label>
                <select value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
              <div className="row">
                <button className="btn">{isEditing ? "Save changes" : "Create room"}</button>
                {isEditing && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setRoomForm({ id: null, name: "", capacity: 4, floor: "1", status: "AVAILABLE" })}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card" style={{ flex: 2, minWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>Rooms</h3>
            {rooms.length === 0 ? (
              <div className="muted">No rooms yet.</div>
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
                  {rooms.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>{r.name}</td>
                      <td>{r.capacity}</td>
                      <td>{r.floor}</td>
                      <td>{r.status}</td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <button className="btn secondary" onClick={() => editRoom(r)}>
                            Edit
                          </button>
                          <button className="btn secondary" onClick={() => toggleBlock(r)}>
                            {r.status === "AVAILABLE" ? "Block" : "Unblock"}
                          </button>
                          <button className="btn danger" onClick={() => removeRoom(r.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>All bookings</h3>
          {bookings.length === 0 ? (
            <div className="muted">No bookings yet.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Room</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.User?.email || `User #${b.user_id}`}</td>
                    <td>{b.Room?.name || `Room #${b.room_id}`}</td>
                    <td>{new Date(b.start_time).toLocaleString()}</td>
                    <td>{new Date(b.end_time).toLocaleString()}</td>
                    <td>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Bookings per day</h3>
            {!stats ? (
              <div className="muted">Loading...</div>
            ) : stats.perDay.length === 0 ? (
              <div className="muted">No data.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perDay.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td>{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Bookings per room</h3>
            {!stats ? (
              <div className="muted">Loading...</div>
            ) : stats.perRoom.length === 0 ? (
              <div className="muted">No data.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perRoom.map((r) => (
                    <tr key={r.room_id}>
                      <td>{r.Room?.name || `Room #${r.room_id}`}</td>
                      <td>{r.get ? r.get("total") : r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "rules" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Availability rules</h3>
          <div className="muted" style={{ marginBottom: 10 }}>
            These rules control office working hours, max booking duration, and slot alignment.
          </div>
          <form className="stack" onSubmit={saveRules}>
            <div className="row">
              <div style={{ flex: 1, minWidth: 220 }}>
                <label>Work start (minutes from midnight)</label>
                <input
                  type="number"
                  min="0"
                  max="1439"
                  value={rulesForm.work_start_minute}
                  onChange={(e) => setRulesForm({ ...rulesForm, work_start_minute: e.target.value })}
                />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label>Work end (minutes from midnight)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={rulesForm.work_end_minute}
                  onChange={(e) => setRulesForm({ ...rulesForm, work_end_minute: e.target.value })}
                />
              </div>
            </div>
            <div className="row">
              <div style={{ flex: 1, minWidth: 220 }}>
                <label>Max booking duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={rulesForm.max_booking_minutes}
                  onChange={(e) => setRulesForm({ ...rulesForm, max_booking_minutes: e.target.value })}
                />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label>Slot size (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={rulesForm.slot_minutes}
                  onChange={(e) => setRulesForm({ ...rulesForm, slot_minutes: e.target.value })}
                />
              </div>
            </div>
            <div className="row">
              <button className="btn">Save rules</button>
              <button type="button" className="btn secondary" onClick={loadRules}>
                Reload
              </button>
            </div>
          </form>

          {rules && (
            <div className="muted" style={{ marginTop: 10 }}>
              Current: {rules.work_start_minute} → {rules.work_end_minute} (max {rules.max_booking_minutes} mins, slot {rules.slot_minutes} mins)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

