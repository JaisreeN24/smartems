import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import useWebSocket from "../useWebSocket";

const severityColor = (severity) => {
  if (severity === "CRITICAL") return "#ef4444";
  if (severity === "HIGH") return "#f97316";
  if (severity === "MEDIUM") return "#eab308";
  return "#22c55e";
};

const statusColor = (status) => {
  if (status === "ASSIGNED") return "#22c55e";
  if (status === "PENDING") return "#f97316";
  return "#94a3b8";
};

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});

export default function Dashboard({ token }) {
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notification, setNotification] = useState(null); // ✅ popup state

  const fetchData = async () => {
      console.log("🔑 Token:", token); // ← ADD THIS

  try {
    const [eRes, rRes, hRes] = await Promise.all([
      fetch("http://localhost:8080/emergencies", { headers: authHeaders(token) }),
      fetch("http://localhost:8080/responders", { headers: authHeaders(token) }),
      fetch("http://localhost:8080/hospitals", { headers: authHeaders(token) }),
    ]);

    // ✅ Handle 403 gracefully — don't crash if forbidden
    const eData = eRes.ok ? await eRes.json() : [];
    const rData = rRes.ok ? await rRes.json() : [];
    const hData = hRes.ok ? await hRes.json() : [];

    setEmergencies(Array.isArray(eData) ? eData : []);
    setResponders(Array.isArray(rData) ? rData : []);
    setHospitals(Array.isArray(hData) ? hData : []);
    setLastUpdated(new Date().toLocaleTimeString());
  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  const deleteEmergency = async (id) => {
    await fetch(`http://localhost:8080/emergencies/${id}`, {
      method: "DELETE",
      headers: authHeaders(token)
    });
    fetchData();
  };

  // ✅ WebSocket — instant updates + popup
  const { connected } = useWebSocket((newEmergency) => {
    setEmergencies(prev => {
      const exists = prev.find(e => e.id === newEmergency.id);
      if (exists) return prev;
      return [newEmergency, ...prev];
    });
    setNotification(newEmergency);
    setTimeout(() => setNotification(null), 5000);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Total Emergencies", value: emergencies.length, color: "#3b82f6", icon: "🚨" },
    { label: "Critical", value: emergencies.filter(e => e.severity === "CRITICAL").length, color: "#ef4444", icon: "🔴" },
    { label: "High", value: emergencies.filter(e => e.severity === "HIGH").length, color: "#f97316", icon: "🟠" },
    { label: "Assigned", value: emergencies.filter(e => e.status === "ASSIGNED").length, color: "#22c55e", icon: "✅" },
    { label: "Responders", value: responders.length, color: "#8b5cf6", icon: "🚑" },
    { label: "Available", value: responders.filter(r => r.available).length, color: "#06b6d4", icon: "✅" },
    { label: "Hospitals", value: hospitals.length, color: "#ec4899", icon: "🏥" },
  ];

  const locationMap = {};
  emergencies.forEach(e => {
    const loc = e.location || "Unknown";
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });
  const locationData = Object.entries(locationMap)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const severityData = [
    { severity: "CRITICAL", count: emergencies.filter(e => e.severity === "CRITICAL").length, color: "#ef4444" },
    { severity: "HIGH",     count: emergencies.filter(e => e.severity === "HIGH").length,     color: "#f97316" },
    { severity: "MEDIUM",   count: emergencies.filter(e => e.severity === "MEDIUM").length,   color: "#eab308" },
    { severity: "LOW",      count: emergencies.filter(e => e.severity === "LOW").length,      color: "#22c55e" },
  ];

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "24px", color: "white" }}>

      {/* ✅ Real-time Notification Popup */}
      {notification && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "#1e293b", borderRadius: "14px", padding: "16px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          border: `2px solid ${severityColor(notification.severity)}`,
          minWidth: "300px", animation: "slideIn 0.3s ease"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>🚨</span>
                <strong style={{ color: "white", fontSize: "14px" }}>New Emergency!</strong>
                <span style={{
                  fontSize: "10px", fontWeight: "800", color: "white",
                  padding: "2px 8px", borderRadius: "12px",
                  background: severityColor(notification.severity)
                }}>
                  {notification.severity}
                </span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#cbd5e1" }}>
                {notification.type}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                📍 {notification.location}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                🏥 {notification.hospitalName || "Assigning..."} • {notification.status}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: "none", border: "none", color: "#64748b",
                cursor: "pointer", fontSize: "18px", padding: "0 0 0 12px"
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "white" }}>
            🚨 SmartEMS Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
            Real-time Emergency Management System
          </p>
        </div>
        {/* ✅ Live indicator */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{
            fontSize: "11px", fontWeight: "700", padding: "4px 10px",
            borderRadius: "20px",
            background: connected ? "#22c55e20" : "#ef444420",
            color: connected ? "#22c55e" : "#ef4444",
            border: `1px solid ${connected ? "#22c55e40" : "#ef444440"}`
          }}>
            {connected ? "⚡ Live" : "○ Connecting..."}
          </span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            🔄 Updated: {lastUpdated || "Loading..."}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            background: "#1e293b", borderRadius: "12px", padding: "16px",
            borderLeft: `4px solid ${stat.color}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>{stat.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>

        {/* Emergencies Table */}
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "white" }}>
            🚨 Live Emergencies
          </h3>
          {emergencies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
              <p>No emergencies yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    {["ID", "Type", "Location", "Severity", "Status", "Hospital", "Action"].map(h => (
                      <th key={h} style={{ padding: "10px 8px", textAlign: "left", color: "#94a3b8", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emergencies.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "12px 8px", color: "#64748b" }}>#{e.id}</td>
                      <td style={{ padding: "12px 8px", color: "white", maxWidth: "180px" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.type}
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", color: "#94a3b8" }}>📍 {e.location}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{
                          background: severityColor(e.severity), color: "white",
                          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700"
                        }}>
                          {e.severity}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ color: statusColor(e.status), fontSize: "12px", fontWeight: "600" }}>
                          ● {e.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", color: "#94a3b8", fontSize: "12px" }}>
                        {e.hospitalName || "—"}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <button
                          onClick={() => deleteEmergency(e.id)}
                          style={{
                            background: "#ef444420", color: "#ef4444",
                            border: "1px solid #ef444440", borderRadius: "6px",
                            padding: "4px 10px", cursor: "pointer", fontSize: "11px"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Responders */}
          <div style={{ background: "#1e293b", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", color: "white" }}>🚑 Responders</h3>
            {responders.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>No responders found</p>
            ) : (
              responders.map((r) => (
                <div key={r.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px", marginBottom: "8px", borderRadius: "8px",
                  background: "#0f172a", border: "1px solid #334155"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "13px", color: "white" }}>🚑 {r.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>🔧 {r.skill}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>📞 {r.phone}</div>
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px",
                    background: r.available ? "#22c55e20" : "#ef444420",
                    color: r.available ? "#22c55e" : "#ef4444",
                    border: `1px solid ${r.available ? "#22c55e40" : "#ef444440"}`
                  }}>
                    {r.available ? "✅ Available" : "🔴 On Duty"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Hospitals */}
          <div style={{ background: "#1e293b", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", color: "white" }}>🏥 Hospitals</h3>
            {hospitals.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>No hospitals found</p>
            ) : (
              hospitals.map((h) => (
                <div key={h.id} style={{
                  padding: "10px", marginBottom: "8px", borderRadius: "8px",
                  background: "#0f172a", border: "1px solid #334155"
                }}>
                  <div style={{ fontWeight: "600", fontSize: "13px", color: "white" }}>🏥 {h.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>📍 {h.address}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>📞 {h.phone}</div>
                  <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px", fontWeight: "600" }}>
                    🛏️ Beds: {h.availableBeds}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>{/* ── END MAIN GRID ── */}

      {/* ── CHARTS SECTION ── */}
      <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* 🏆 Top Locations */}
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "white" }}>🏆 Top Locations</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#64748b" }}>Areas with most emergencies</p>
          {locationData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
              <p style={{ fontSize: "13px" }}>No data yet — submit some emergencies!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={locationData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  type="category" dataKey="location" width={120}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(val) => val.length > 16 ? val.slice(0, 16) + "..." : val}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white" }}
                  formatter={(value) => [`${value} emergencies`, "Count"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {locationData.map((_, index) => (
                    <Cell key={index} fill={["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"][index % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 🚨 Severity Breakdown */}
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "white" }}>🚨 Severity Breakdown</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#64748b" }}>Emergencies count by severity level</p>
          {emergencies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
              <p style={{ fontSize: "13px" }}>No data yet — submit some emergencies!</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={severityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="severity" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "white" }}
                    formatter={(value) => [`${value} emergencies`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px" }}>
                {severityData.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{item.severity} ({item.count})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>{/* ── END CHARTS ── */}

    </div>
  );
}