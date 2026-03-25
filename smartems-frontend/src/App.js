import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import EmergencyForm from "./components/EmergencyForm";
import MapView from "./components/MapView";
import Login from "./components/Login";
import SOSButton from "./components/SOSButton";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);

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

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "form", label: "New Emergency" },
    { key: "map", label: "Live Map" },
  ];

  return (
    <div className="app-shell">
      <div className="app-frame">
        <nav className="app-topbar">
          <div className="topbar-left">
            <div className="brand-lockup">
              <div className="brand-badge">+</div>
              <div>
                <h1 className="brand-title">SmartEMS Control</h1>
                <p className="brand-subtitle">Glossy command center for rapid emergency coordination</p>
              </div>
            </div>
            <div className="nav-cluster soft-scroll">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`nav-pill ${activeTab === tab.key ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="topbar-right">
            <div className="user-chip">
              <div className="user-avatar">{user.username.slice(0, 1).toUpperCase()}</div>
              <div className="user-meta">
                <span className="user-name">{user.username}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="ghost-danger-btn">
              Logout
            </button>
          </div>
        </nav>

        <div className="page-shell">
          {activeTab === "dashboard" && <Dashboard token={user.token} />}
          {activeTab === "form" && <EmergencyForm token={user.token} />}
          {activeTab === "map" && <MapView token={user.token} />}
          <SOSButton />
        </div>
      </div>
    </div>
  );
}

export default App;
