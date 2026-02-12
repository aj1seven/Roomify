import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="nav">
      <div className="nav-inner container">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div className="nav-brand">
            <Link to="/">Roomify</Link>
          </div>
          <div className="nav-links">
            {!user ? (
              <>
                <Link className="pill" to="/">
                  Home
                </Link>
                <Link className="pill" to="/login">
                  Login
                </Link>
                <Link className="pill" to="/register">
                  Register
                </Link>
              </>
            ) : (
              <>
                {user.role === "EMPLOYEE" && (
                  <>
                    <Link className="pill" to="/dashboard">
                      Dashboard
                    </Link>
                    <Link className="pill" to="/rooms">
                      Rooms
                    </Link>
                    <Link className="pill" to="/my-bookings">
                      My bookings
                    </Link>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <>
                    <Link className="pill" to="/admin">
                      Admin dashboard
                    </Link>
                    <Link className="pill" to="/rooms">
                      Rooms
                    </Link>
                  </>
                )}
                <span className="pill">{user.email}</span>
                <button className="btn secondary" onClick={logout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

