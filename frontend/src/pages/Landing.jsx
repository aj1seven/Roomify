import { Link } from "react-router-dom";
import { getUser } from "../services/api";
import officeIllustration from "../assets/office-illustration.png";

export default function Landing() {
  const user = getUser();

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="hero">
        <div className="hero-topline" />
        <div className="hero-inner">
          <div>
            <div className="kicker">Roomify</div>
            <h1 className="display">Meeting rooms</h1>
            <div className="subhead">
              Select a room, pick a time slot, and book it—conflict-free, within office rules, with capacity control.
            </div>
          </div>

          <div className="hero-actions">
            {!user ? (
              <>
                <Link className="btn" to="/login">
                  Login
                </Link>
                <Link className="btn secondary" to="/register">
                  Register (Employee)
                </Link>
              </>
            ) : (
              <>
                <Link className="btn" to={user.role === "ADMIN" ? "/admin" : "/dashboard"}>
                  Go to dashboard
                </Link>
                <Link className="btn secondary" to="/rooms">
                  Browse rooms
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-bottomline" />
      </div>

      <div className="grid-3">
        <div className="panel">
          <div className="panel-title">Rooms</div>
          <div className="muted">Admins create, edit, delete, and block rooms for maintenance.</div>
        </div>
        <div className="panel">
          <div className="panel-title">Rules</div>
          <div className="muted">Working hours, slot size, and max duration are enforced by the backend.</div>
        </div>
        <div className="panel">
          <div className="panel-title">Analytics</div>
          <div className="muted">Employees see personal insights. Admins monitor overall booking usage.</div>
        </div>
      </div>

      <div className="media-strip">
        <div className="media-strip-inner">
          <div className="media-caption">
            <div className="panel-title">Smooth, minimal, fast</div>
            <div className="muted">A clean interface inspired by editorial layouts—with subtle transitions.</div>
          </div>
          <div className="media-imgwrap">
            <img className="media-img" src={officeIllustration} alt="Office illustration" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  );
}

