import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import useWebSocket from "../useWebSocket";

const severityColor = (severity) => {
  if (severity === "CRITICAL") return "#ff6d7b";
  if (severity === "HIGH") return "#ffb34d";
  if (severity === "MEDIUM") return "#ffe066";
  return "#32d39a";
};

const statusColor = (status) => {
  if (status === "ASSIGNED") return "#4da2ff";
  if (status === "ACCEPTED") return "#32d39a";
  if (status === "ARRIVED") return "#a272ff";
  if (status === "CLOSED") return "#9aa9c0";
  if (status === "PENDING") return "#ffb34d";
  return "#94a3b8";
};

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const tableCell = {
  padding: "14px 10px",
  borderBottom: "1px solid rgba(167, 199, 255, 0.08)",
  verticalAlign: "top",
};

export default function Dashboard({ token }) {
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [myResponder, setMyResponder] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notification, setNotification] = useState(null);
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const fetchData = async () => {
    try {
      const [eRes, rRes, hRes, meRes] = await Promise.all([
        fetch("http://localhost:8080/emergencies", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/responders", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/hospitals", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/responders/me", { headers: authHeaders(token) }),
      ]);

      const eData = eRes.ok ? await eRes.json() : [];
      const rData = rRes.ok ? await rRes.json() : [];
      const hData = hRes.ok ? await hRes.json() : [];
      const meData = meRes.ok ? await meRes.json() : null;

      setEmergencies(Array.isArray(eData) ? eData : []);
      setResponders(Array.isArray(rData) ? rData : []);
      setHospitals(Array.isArray(hData) ? hData : []);
      setMyResponder(meData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const deleteEmergency = async (id) => {
    await fetch(`http://localhost:8080/emergencies/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    fetchData();
  };

  const updateEmergencyStatus = async (id, action) => {
    await fetch(`http://localhost:8080/emergencies/${id}/${action}`, {
      method: "POST",
      headers: authHeaders(token),
    });
    fetchData();
  };

  const actionForStatus = (status) => {
    if (status === "ASSIGNED") return { label: "Accept", action: "accept", color: "#4da2ff" };
    if (status === "ACCEPTED") return { label: "Arrive", action: "arrive", color: "#a272ff" };
    if (status === "ARRIVED") return { label: "Close", action: "close", color: "#32d39a" };
    return null;
  };

  const canManageEmergency = (emergency) => {
    if (role === "ADMIN") return true;
    if (role !== "RESPONDER") return false;
    return Boolean(myResponder && emergency.responderId === myResponder.id);
  };

  const { connected } = useWebSocket((newEmergency) => {
    setEmergencies((prev) => {
      const next = [newEmergency, ...prev.filter((item) => item.id !== newEmergency.id)];
      return next;
    });
    setNotification(newEmergency);
    setTimeout(() => setNotification(null), 5000);
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Total Emergencies", value: emergencies.length, color: "#4da2ff", icon: "01", glow: "rgba(77, 162, 255, 0.22)" },
    { label: "Critical", value: emergencies.filter((e) => e.severity === "CRITICAL").length, color: "#ff6d7b", icon: "02", glow: "rgba(255, 109, 123, 0.22)" },
    { label: "High", value: emergencies.filter((e) => e.severity === "HIGH").length, color: "#ffb34d", icon: "03", glow: "rgba(255, 179, 77, 0.22)" },
    { label: "Assigned", value: emergencies.filter((e) => e.status === "ASSIGNED").length, color: "#4da2ff", icon: "04", glow: "rgba(77, 162, 255, 0.18)" },
    { label: "En Route", value: emergencies.filter((e) => e.status === "ACCEPTED").length, color: "#32d39a", icon: "05", glow: "rgba(50, 211, 154, 0.2)" },
    { label: "Arrived", value: emergencies.filter((e) => e.status === "ARRIVED").length, color: "#a272ff", icon: "06", glow: "rgba(162, 114, 255, 0.22)" },
    { label: "Responders", value: responders.length, color: "#6be3ff", icon: "07", glow: "rgba(107, 227, 255, 0.16)" },
    { label: "Available", value: responders.filter((r) => r.available).length, color: "#32d39a", icon: "08", glow: "rgba(50, 211, 154, 0.2)" },
    { label: "Hospitals", value: hospitals.length, color: "#ff8fd8", icon: "09", glow: "rgba(255, 143, 216, 0.14)" },
  ];

  const locationMap = {};
  emergencies.forEach((e) => {
    const loc = e.location || "Unknown";
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });

  const locationData = Object.entries(locationMap)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const severityData = [
    { severity: "CRITICAL", count: emergencies.filter((e) => e.severity === "CRITICAL").length, color: "#ff6d7b" },
    { severity: "HIGH", count: emergencies.filter((e) => e.severity === "HIGH").length, color: "#ffb34d" },
    { severity: "MEDIUM", count: emergencies.filter((e) => e.severity === "MEDIUM").length, color: "#ffe066" },
    { severity: "LOW", count: emergencies.filter((e) => e.severity === "LOW").length, color: "#32d39a" },
  ];

  const myActiveEmergency = role === "RESPONDER" && myResponder
    ? emergencies.find((e) => e.responderId === myResponder.id && e.status !== "CLOSED")
    : null;

  return (
    <div style={{ minHeight: "100vh", color: "var(--text)" }}>
      {notification && (
        <div
          className="glass-panel strong"
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            minWidth: 320,
            padding: 18,
            borderColor: `${severityColor(notification.severity)}50`,
            animation: "slideIn 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div className="eyebrow" style={{ color: severityColor(notification.severity) }}>Incoming alert</div>
              <h3 className="panel-title" style={{ marginTop: 10 }}>{notification.type}</h3>
              <p className="panel-subtitle">{notification.location}</p>
              <p className="panel-subtitle" style={{ marginTop: 6 }}>
                {notification.hospitalName || "Assigning hospital"} | {notification.status}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}
            >
              x
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel strong" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Live command surface</span>
            <h2 className="panel-title" style={{ marginTop: 12, fontSize: 42 }}>SmartEMS Dashboard</h2>
            <p className="panel-subtitle">
              {role === "RESPONDER" ? `Responder view for ${username}` : "Unified dispatch visibility for active incidents, assets, and trends."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span className="status-pill live">{connected ? "Live stream active" : "Connecting"}</span>
            <span className="status-pill">Updated {lastUpdated || "Loading..."}</span>
          </div>
        </div>
      </div>

      {role === "RESPONDER" && (
        <div className="glass-panel" style={{ padding: 22, marginBottom: 22 }}>
          <div className="eyebrow">My responder profile</div>
          {myResponder ? (
            <>
              <h3 className="panel-title" style={{ marginTop: 12, fontSize: 32 }}>{myResponder.name}</h3>
              <p className="panel-subtitle">@{myResponder.username} | {myResponder.skill || "No skill set"} | {myResponder.available ? "Available" : "Busy"}</p>
              <div className={myActiveEmergency ? "info-box" : "success-box"} style={{ marginTop: 16 }}>
                {myActiveEmergency
                  ? `Active case #${myActiveEmergency.id}: ${myActiveEmergency.type} (${myActiveEmergency.status})`
                  : "No active case assigned right now."}
              </div>
            </>
          ) : (
            <div className="error-box" style={{ marginTop: 14 }}>
              Your account is not linked to a responder profile yet. Create or update a responder record with username "{username}".
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-panel metric-card"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.08), transparent), linear-gradient(135deg, ${stat.glow}, rgba(17,31,53,0.78))`,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="eyebrow" style={{ color: stat.color }}>{stat.icon}</span>
              <span style={{ width: 11, height: 11, borderRadius: 999, background: stat.color, boxShadow: `0 0 18px ${stat.color}` }} />
            </div>
            <div className="metric-value" style={{ color: stat.color, marginTop: 18 }}>{stat.value}</div>
            <div className="metric-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel strong soft-scroll" style={{ padding: 22, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Active incident board</div>
              <h3 className="panel-title" style={{ marginTop: 10 }}>Live Emergencies</h3>
            </div>
            <span className="status-pill">{emergencies.length} tracked</span>
          </div>

          {emergencies.length === 0 ? (
            <div className="glass-panel" style={{ padding: 28, textAlign: "center" }}>
              <p className="panel-subtitle">No emergencies yet</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>
                  {["ID", "Type", "Location", "Severity", "Status", "Responder", "Hospital", "Action"].map((h) => (
                    <th
                      key={h}
                      style={{
                        ...tableCell,
                        color: "var(--muted)",
                        fontSize: 11,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emergencies.map((e) => {
                  const statusAction = actionForStatus(e.status);
                  return (
                    <tr key={e.id}>
                      <td style={{ ...tableCell, color: "var(--muted)", fontWeight: 700 }}>#{e.id}</td>
                      <td style={tableCell}>
                        <div style={{ maxWidth: 220, fontWeight: 700 }}>{e.type}</div>
                      </td>
                      <td style={{ ...tableCell, color: "var(--muted)", maxWidth: 240 }}>{e.location}</td>
                      <td style={tableCell}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 11px",
                            borderRadius: 999,
                            background: `${severityColor(e.severity)}20`,
                            border: `1px solid ${severityColor(e.severity)}30`,
                            color: severityColor(e.severity),
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {e.severity}
                        </span>
                      </td>
                      <td style={tableCell}>
                        <span style={{ color: statusColor(e.status), fontWeight: 800 }}>{e.status}</span>
                      </td>
                      <td style={{ ...tableCell, color: "var(--muted)" }}>{e.responderName || "Unassigned"}</td>
                      <td style={{ ...tableCell, color: "var(--muted)" }}>{e.hospitalName || "-"}</td>
                      <td style={tableCell}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {statusAction && canManageEmergency(e) && (
                            <button
                              onClick={() => updateEmergencyStatus(e.id, statusAction.action)}
                              className="pill-btn"
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                background: `${statusAction.color}20`,
                                border: `1px solid ${statusAction.color}35`,
                                color: statusAction.color,
                                fontWeight: 800,
                              }}
                            >
                              {statusAction.label}
                            </button>
                          )}
                          {role === "RESPONDER" && !canManageEmergency(e) && statusAction && (
                            <span style={{ color: "var(--muted)", fontSize: 11 }}>Assigned to {e.responderName || "another responder"}</span>
                          )}
                          {role === "ADMIN" && (
                            <button
                              onClick={() => deleteEmergency(e.id)}
                              className="pill-btn"
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                background: "rgba(255,109,123,0.12)",
                                border: "1px solid rgba(255,109,123,0.24)",
                                color: "#ff9ca6",
                                fontWeight: 800,
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="glass-panel strong" style={{ padding: 20 }}>
            <div className="eyebrow">Field assets</div>
            <h3 className="panel-title" style={{ marginTop: 10 }}>Responders</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {responders.length === 0 ? (
                <p className="panel-subtitle">No responders found</p>
              ) : (
                responders.map((r) => (
                  <div key={r.id} className="glass-panel" style={{ padding: 14, borderRadius: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{r.name}</div>
                        <div className="panel-subtitle" style={{ marginTop: 4 }}>{r.skill || "No specialization"}</div>
                        <div className="panel-subtitle">{r.phone || "No phone listed"}</div>
                      </div>
                      <span
                        style={{
                          alignSelf: "flex-start",
                          padding: "7px 11px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 800,
                          color: r.available ? "#8dffc9" : "#ffb7bf",
                          background: r.available ? "rgba(50,211,154,0.14)" : "rgba(255,109,123,0.14)",
                          border: r.available ? "1px solid rgba(50,211,154,0.22)" : "1px solid rgba(255,109,123,0.2)",
                        }}
                      >
                        {r.available ? "Available" : "On duty"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel strong" style={{ padding: 20 }}>
            <div className="eyebrow">Receiving facilities</div>
            <h3 className="panel-title" style={{ marginTop: 10 }}>Hospitals</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {hospitals.length === 0 ? (
                <p className="panel-subtitle">No hospitals found</p>
              ) : (
                hospitals.map((h) => (
                  <div key={h.id} className="glass-panel" style={{ padding: 14, borderRadius: 18 }}>
                    <div style={{ fontWeight: 800 }}>{h.name}</div>
                    <div className="panel-subtitle" style={{ marginTop: 4 }}>{h.address}</div>
                    <div className="panel-subtitle">{h.phone}</div>
                    <div className="status-pill" style={{ marginTop: 12, color: "#8dffc9" }}>
                      Beds {h.availableBeds}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="glass-panel strong" style={{ padding: 20 }}>
          <div className="eyebrow">Geographic concentration</div>
          <h3 className="panel-title" style={{ marginTop: 10 }}>Top Locations</h3>
          <p className="panel-subtitle">Areas carrying the highest emergency load right now.</p>
          {locationData.length === 0 ? (
            <div className="glass-panel" style={{ marginTop: 16, padding: 30, textAlign: "center" }}>
              <p className="panel-subtitle">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={locationData} layout="vertical" margin={{ left: 10, right: 20, top: 16 }}>
                <XAxis type="number" tick={{ fill: "#8aa1c3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="location"
                  width={130}
                  tick={{ fill: "#8aa1c3", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val.length > 16 ? `${val.slice(0, 16)}...` : val)}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(7,18,33,0.96)",
                    border: "1px solid rgba(167,199,255,0.18)",
                    borderRadius: 16,
                    color: "#e8f1ff",
                  }}
                />
                <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                  {locationData.map((_, index) => (
                    <Cell key={index} fill={["#4da2ff", "#6be3ff", "#32d39a", "#a272ff", "#ffb34d", "#ff6d7b"][index % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-panel strong" style={{ padding: 20 }}>
          <div className="eyebrow">Case intensity</div>
          <h3 className="panel-title" style={{ marginTop: 10 }}>Severity Breakdown</h3>
          <p className="panel-subtitle">Current incident mix by severity level.</p>
          {emergencies.length === 0 ? (
            <div className="glass-panel" style={{ marginTop: 16, padding: 30, textAlign: "center" }}>
              <p className="panel-subtitle">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={severityData} margin={{ top: 18, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="severity" tick={{ fill: "#8aa1c3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8aa1c3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(7,18,33,0.96)",
                      border: "1px solid rgba(167,199,255,0.18)",
                      borderRadius: 16,
                      color: "#e8f1ff",
                    }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
                {severityData.map((item) => (
                  <div key={item.severity} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color }} />
                    <span className="panel-subtitle" style={{ margin: 0 }}>{item.severity} ({item.count})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
