import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuth } from "../services/api";

const ADMIN_EMAIL = "aj17cit@gmail.com";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.token, data.user);
      navigate(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillAdminEmail = () => {
    setEmail(ADMIN_EMAIL);
    setPassword("");
    setError("");
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "24px auto" }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <p className="muted" style={{ marginTop: -6 }}>
        Employees can register. Admins can login using the seeded admin credentials.
      </p>
      <form className="stack" onSubmit={submit}>
        <div className="stack" style={{ gap: 6 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
          <button type="button" className="btn secondary" onClick={fillAdminEmail} disabled={loading}>
            Login as a administrator
          </button>
        </div>
      </form>
    </div>
  );
}

