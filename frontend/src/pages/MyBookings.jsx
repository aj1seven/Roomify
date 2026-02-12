import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/bookings/my");
      setBookings(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.delete(`/bookings/${id}`);
      setMessage("Booking cancelled.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Cancel failed");
    }
  };

  const checkIn = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.post(`/bookings/${id}/checkin`);
      setMessage("Checked in.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Check-in failed");
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>My bookings</h2>
            <div className="muted">View and cancel your bookings.</div>
          </div>
          <button className="btn secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="card error">{error}</div>}
      {message && <div className="card success">{message}</div>}

      <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="muted">No bookings yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Room</th>
                <th>Attendees</th>
                <th>Start</th>
                <th>End</th>
                <th>Check-in</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td>{b.Room?.name || `Room #${b.room_id}`}</td>
                  <td>{b.attendees ?? 1}</td>
                  <td>{new Date(b.start_time).toLocaleString()}</td>
                  <td>{new Date(b.end_time).toLocaleString()}</td>
                  <td>{b.checked_in_at ? new Date(b.checked_in_at).toLocaleTimeString() : <span className="muted">Not checked in</span>}</td>
                  <td>{b.status}</td>
                  <td>
                    {b.status === "BOOKED" ? (
                      <div className="row" style={{ justifyContent: "flex-end" }}>
                        {!b.checked_in_at && (
                          <button className="btn secondary" onClick={() => checkIn(b.id)}>
                            Check in
                          </button>
                        )}
                        <button className="btn danger" onClick={() => cancel(b.id)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="muted">—</span>
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

