import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import EmergencyForm from "./components/EmergencyForm";
import MapView from "./components/MapView";
import Login from "./components/Login";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (token) setUser({ token, username, role });
  }, []);

  const handleLogin = (data) => setUser(data);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div>
      {/* Navigation */}
      <nav style={{
        background: "#1e293b", padding: "10px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {[
            { key: "dashboard", label: "📊 Dashboard" },
            { key: "form", label: "🚨 New Emergency" },
            { key: "map", label: "🗺️ Live Map" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "8px 16px", borderRadius: "6px", border: "none",
              cursor: "pointer", fontWeight: "600", fontSize: "13px",
              background: activeTab === tab.key ? "#3b82f6" : "#334155",
              color: "white"
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* User Info + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            {user.role === "ADMIN" ? "👑" : "🚑"} {user.username}
            <span style={{
              marginLeft: "6px", fontSize: "11px", fontWeight: "700",
              color: user.role === "ADMIN" ? "#f59e0b" : "#3b82f6"
            }}>
              ({user.role})
            </span>
          </span>
          <button onClick={handleLogout} style={{
            padding: "6px 14px", borderRadius: "6px",
            border: "1px solid #ef444440", background: "#ef444420",
            color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "600"
          }}>
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Pages */}
      {activeTab === "dashboard" && <Dashboard token={user.token} />}
      {activeTab === "form" && <EmergencyForm token={user.token} />}
      {activeTab === "map" && <MapView token={user.token} />}
    </div>
  );
}

export default App;