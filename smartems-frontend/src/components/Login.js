import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "RESPONDER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (isRegister) {
        setIsRegister(false);
        alert("Registered successfully. Please log in.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);
        onLogin(data);
      }
    } catch (err) {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-layout">
        <div className="glass-panel strong hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Real-time emergency operations</span>
            <h1 className="hero-title">Dispatch faster. Coordinate smarter. See everything live.</h1>
            <p className="hero-text">
              SmartEMS brings responders, maps, severity scoring, and emergency workflows into a single glossy command
              center built for quick decisions under pressure.
            </p>

            <div className="hero-grid">
              <div className="hero-mini">
                <strong>Live emergency board</strong>
                <p>Track assignments, arrivals, closures, and responder state in one continuously updated view.</p>
              </div>
              <div className="hero-mini">
                <strong>AI-assisted dispatch</strong>
                <p>Use severity classification and first-aid support to guide action in the first critical minutes.</p>
              </div>
              <div className="hero-mini">
                <strong>Responder workflows</strong>
                <p>Move incidents from assigned to accepted, arrived, and closed with role-aware permissions.</p>
              </div>
              <div className="hero-mini">
                <strong>Map visibility</strong>
                <p>See emergencies, hospitals, and responders on a live geographic layer with instant updates.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel strong auth-card">
          <span className="eyebrow">Secure access</span>
          <h2 className="panel-title" style={{ marginTop: 14, fontSize: 30 }}>
            {isRegister ? "Create your control account" : "Enter the command center"}
          </h2>
          <p className="panel-subtitle">
            {isRegister
              ? "Create an admin or responder account to join the SmartEMS workspace."
              : "Sign in to monitor incidents, manage assignments, and coordinate response."}
          </p>

          <div className="segmented" style={{ marginTop: 22 }}>
            {["Login", "Register"].map((tab, index) => (
              <button
                key={tab}
                className={!isRegister === (index === 0) ? "active" : ""}
                onClick={() => setIsRegister(index === 1)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="field-stack">
            <div className="field">
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {isRegister && (
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="RESPONDER">Responder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="error-box" style={{ marginTop: 18 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="primary-btn"
            style={{ marginTop: 20, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </button>

          <div className="glass-panel" style={{ marginTop: 22, padding: 18, borderRadius: 20 }}>
            <div className="eyebrow" style={{ color: "var(--warning)" }}>Access roles</div>
            <p className="panel-subtitle" style={{ marginTop: 10 }}>
              Admins see the full command center. Responders get assignment-focused workflows and active case handling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
