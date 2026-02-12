import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, getUser } from "../services/api";

function minutesBetween(a, b) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export default function EmployeeDashboard() {
  const user = getUser();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [roomsRes, bookingsRes] = await Promise.all([api.get("/rooms"), api.get("/bookings/my")]);
        setRooms(roomsRes.data || []);
        setBookings(bookingsRes.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = Date.now();
  const booked = useMemo(() => bookings.filter((b) => b.status === "BOOKED"), [bookings]);
  const cancelled = useMemo(() => bookings.filter((b) => b.status === "CANCELLED"), [bookings]);
  const upcoming = useMemo(
    () => booked.filter((b) => new Date(b.start_time).getTime() >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [booked, now]
  );

  const totalMinutes = useMemo(
    () => booked.reduce((sum, b) => sum + Math.max(0, minutesBetween(b.start_time, b.end_time)), 0),
    [booked]
  );

  const favoriteRoom = useMemo(() => {
    const map = new Map();
    for (const b of booked) {
      const key = b.room_id;
      map.set(key, (map.get(key) || 0) + 1);
    }
    let best = null;
    for (const [roomId, count] of map.entries()) {
      if (!best || count > best.count) best = { roomId, count };
    }
    if (!best) return null;
    const room = rooms.find((r) => r.id === best.roomId);
    return { ...best, name: room?.name || `Room #${best.roomId}` };
  }, [booked, rooms]);

  if (loading) return <div className="panel muted">Loading dashboard…</div>;

  return (
    <div className="stack">
      <div className="hero compact">
        <div className="hero-topline" />
        <div className="hero-inner">
          <div>
            <div className="kicker">Employee dashboard</div>
            <h1 className="display" style={{ fontSize: 56, marginBottom: 6 }}>
              Analytics
            </h1>
            <div className="subhead">Welcome, {user?.email}</div>
          </div>
          <div className="hero-actions">
            <Link className="btn" to="/rooms">
              Browse rooms
            </Link>
            <Link className="btn secondary" to="/my-bookings">
              My bookings
            </Link>
          </div>
        </div>
        <div className="hero-bottomline" />
      </div>

      {error && <div className="panel error">{error}</div>}

      <div className="grid-4">
        <div className="panel">
          <div className="panel-title">Upcoming</div>
          <div className="metric">{upcoming.length}</div>
          <div className="muted">Booked meetings ahead</div>
        </div>
        <div className="panel">
          <div className="panel-title">Total booked</div>
          <div className="metric">{booked.length}</div>
          <div className="muted">All-time</div>
        </div>
        <div className="panel">
          <div className="panel-title">Cancelled</div>
          <div className="metric">{cancelled.length}</div>
          <div className="muted">All-time</div>
        </div>
        <div className="panel">
          <div className="panel-title">Time booked</div>
          <div className="metric">{Math.round(totalMinutes / 60)}</div>
          <div className="muted">Hours (approx)</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Next meeting</div>
          {upcoming.length === 0 ? (
            <div className="muted">No upcoming bookings.</div>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              <div>
                <strong>{upcoming[0].Room?.name || `Room #${upcoming[0].room_id}`}</strong>
              </div>
              <div className="muted">
                {new Date(upcoming[0].start_time).toLocaleString()} → {new Date(upcoming[0].end_time).toLocaleString()}
              </div>
              <div className="muted">Attendees: {upcoming[0].attendees ?? 1}</div>
              <Link className="btn secondary" to="/my-bookings">
                Manage bookings
              </Link>
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-title">Favorite room</div>
          {!favoriteRoom ? (
            <div className="muted">No bookings yet.</div>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              <div>
                <strong>{favoriteRoom.name}</strong>
              </div>
              <div className="muted">Bookings: {favoriteRoom.count}</div>
              <div className="muted">Tip: use “Rooms” to check availability quickly.</div>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Rooms snapshot</div>
        <div className="muted" style={{ marginBottom: 10 }}>
          Total rooms: <strong>{rooms.length}</strong> • Available:{" "}
          <strong>{rooms.filter((r) => r.status === "AVAILABLE").length}</strong> • Blocked:{" "}
          <strong>{rooms.filter((r) => r.status === "BLOCKED").length}</strong>
        </div>
        <Link className="btn secondary" to="/rooms">
          Open rooms list
        </Link>
      </div>
    </div>
  );
}

