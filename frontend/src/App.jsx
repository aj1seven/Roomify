import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Rooms from "./pages/Rooms";
import BookRoom from "./pages/BookRoom";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import { getUser } from "./services/api";

function RequireAuth({ children }) {
  const user = getUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RequireRole({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/rooms" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <RequireRole role="EMPLOYEE">
                    <EmployeeDashboard />
                  </RequireRole>
                </RequireAuth>
              }
            />

            <Route
              path="/rooms"
              element={
                <RequireAuth>
                  <Rooms />
                </RequireAuth>
              }
            />
            <Route
              path="/rooms/:id/book"
              element={
                <RequireAuth>
                  <RequireRole role="EMPLOYEE">
                    <BookRoom />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <RequireAuth>
                  <RequireRole role="EMPLOYEE">
                    <MyBookings />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <RequireRole role="ADMIN">
                    <AdminDashboard />
                  </RequireRole>
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

