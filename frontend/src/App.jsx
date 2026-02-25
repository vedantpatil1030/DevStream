// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./features/auth/authSlice";

import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ThreeBackground from "./components/layout/ThreeBackground";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Stream from "./pages/Stream";
import GoLive from "./pages/GoLive";
import Profile from "./pages/Profile";

export default function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden" style={{ background: "#020408" }}>
      {/* 3-D Canvas */}
      <ThreeBackground />

      {/* Content above canvas */}
      <div className="relative z-10 flex flex-col w-full h-full">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/stream/:id" element={<Stream />} />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/" /> : <Register />}
            />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/u/:username" element={<Profile />} />
              <Route path="/go-live" element={<GoLive />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}