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
        setError(null);
        setIsRegister(false);
        alert("✅ Registered! Please login.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);
        onLogin(data);
      }
    } catch (err) {
      setError("Cannot connect to server!");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#1e293b", borderRadius: "20px",
        padding: "40px", width: "380px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🚨</div>
          <h1 style={{ margin: 0, color: "white", fontSize: "24px", fontWeight: "800" }}>
            SmartEMS
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "13px" }}>
            Emergency Management System
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: "flex", background: "#0f172a",
          borderRadius: "10px", padding: "4px", marginBottom: "24px"
        }}>
          {["Login", "Register"].map((tab, i) => (
            <button key={tab} onClick={() => setIsRegister(i === 1)} style={{
              flex: 1, padding: "8px", border: "none", borderRadius: "8px",
              cursor: "pointer", fontWeight: "600", fontSize: "13px",
              background: isRegister === (i === 1) ? "#3b82f6" : "transparent",
              color: isRegister === (i === 1) ? "white" : "#64748b",
              transition: "all 0.2s"
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Username */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
            👤 Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="Enter username"
            style={{
              width: "100%", background: "#0f172a", border: "1px solid #334155",
              borderRadius: "8px", padding: "10px 14px", color: "white",
              fontSize: "14px", boxSizing: "border-box", outline: "none"
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
            🔒 Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Enter password"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%", background: "#0f172a", border: "1px solid #334155",
              borderRadius: "8px", padding: "10px 14px", color: "white",
              fontSize: "14px", boxSizing: "border-box", outline: "none"
            }}
          />
        </div>

        {/* Role (Register only) */}
        {isRegister && (
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
              🎭 Role
            </label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{
                width: "100%", background: "#0f172a", border: "1px solid #334155",
                borderRadius: "8px", padding: "10px 14px", color: "white",
                fontSize: "14px", boxSizing: "border-box", outline: "none"
              }}
            >
              <option value="RESPONDER">🚑 Responder</option>
              <option value="ADMIN">👑 Admin</option>
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#ef444420", border: "1px solid #ef444440",
            borderRadius: "8px", padding: "10px", marginBottom: "14px",
            color: "#ef4444", fontSize: "13px"
          }}>
            ❌ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "13px",
            background: loading ? "#334155" : "#3b82f6",
            color: "white", border: "none", borderRadius: "10px",
            fontSize: "15px", fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "⏳ Please wait..." : isRegister ? "✅ Register" : "🔐 Login"}
        </button>

        {/* Role info */}
        <div style={{ marginTop: "20px", padding: "14px", background: "#0f172a", borderRadius: "10px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
            Role Permissions:
          </p>
          <p style={{ margin: "2px 0", fontSize: "11px", color: "#94a3b8" }}>
            👑 <strong style={{ color: "#f59e0b" }}>Admin</strong> — Full access
          </p>
          <p style={{ margin: "2px 0", fontSize: "11px", color: "#94a3b8" }}>
            🚑 <strong style={{ color: "#3b82f6" }}>Responder</strong> — View & manage emergencies
          </p>
        </div>
      </div>
    </div>
  );
}