import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useWebSocket from "../useWebSocket";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});

const severityColor = (severity) => {
  if (severity === "CRITICAL") return "#ef4444";
  if (severity === "HIGH") return "#f97316";
  if (severity === "MEDIUM") return "#eab308";
  return "#22c55e";
};

const emergencyIcon = (severity) => L.divIcon({
  className: "",
  html: `<div style="
    background:${severityColor(severity)};
    width:22px; height:22px; border-radius:50%;
    border:3px solid white;
    box-shadow:0 0 8px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
    font-size:11px;">🚨</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const responderIcon = L.divIcon({
  className: "",
  html: `<div style="
    background:#3b82f6; width:22px; height:22px;
    border-radius:50%; border:3px solid white;
    box-shadow:0 0 8px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
    font-size:11px;">🚑</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="
    background:#8b5cf6; width:22px; height:22px;
    border-radius:50%; border:3px solid white;
    box-shadow:0 0 8px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
    font-size:11px;">🏥</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function MapView({ token }) {
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const [eRes, rRes, hRes] = await Promise.all([
        fetch("http://localhost:8080/emergencies", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/responders", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/hospitals", { headers: authHeaders(token) }),
      ]);
      const [eData, rData, hData] = await Promise.all([
        eRes.json(), rRes.json(), hRes.json(),
      ]);
      setEmergencies(Array.isArray(eData) ? eData : []);
      setResponders(Array.isArray(rData) ? rData : []);
      setHospitals(Array.isArray(hData) ? hData : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  // ✅ WebSocket — instant map updates
  const { connected } = useWebSocket((newEmergency) => {
    setEmergencies(prev => {
      const exists = prev.find(e => e.id === newEmergency.id);
      if (exists) return prev;
      return [newEmergency, ...prev];
    });
    setLastUpdated(new Date().toLocaleTimeString());
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", height: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        background: "#1e293b", color: "white", padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0
      }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>🗺️ SmartEMS Live Tracker</h2>

        {/* ✅ Live indicator + updated time */}
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
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            🔄 Updated: {lastUpdated || "Loading..."}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: "flex", gap: "10px", padding: "10px 16px",
        background: "#f1f5f9", flexWrap: "wrap", flexShrink: 0
      }}>
        {[
          { label: "All", value: emergencies.length, color: "#1e293b" },
          { label: "🔴 Critical", value: emergencies.filter(e => e.severity === "CRITICAL").length, color: "#ef4444" },
          { label: "🟠 High", value: emergencies.filter(e => e.severity === "HIGH").length, color: "#f97316" },
          { label: "🟡 Medium", value: emergencies.filter(e => e.severity === "MEDIUM").length, color: "#eab308" },
          { label: "🟢 Low", value: emergencies.filter(e => e.severity === "LOW").length, color: "#22c55e" },
          { label: "🚑 Responders", value: responders.length, color: "#3b82f6" },
          { label: "🏥 Hospitals", value: hospitals.length, color: "#8b5cf6" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "white", borderRadius: "8px", padding: "6px 14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center",
            borderTop: `3px solid ${stat.color}`
          }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{
          width: "270px", overflowY: "auto", background: "white",
          borderRight: "1px solid #e2e8f0", padding: "10px", flexShrink: 0
        }}>
          <h4 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: "14px" }}>
            🚨 Emergencies ({emergencies.length})
          </h4>

          {emergencies.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>No emergencies found</p>
          )}

          {emergencies.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelectedEmergency(
                selectedEmergency?.id === e.id ? null : e
              )}
              style={{
                padding: "10px", marginBottom: "8px", borderRadius: "8px",
                cursor: "pointer", border: `2px solid ${severityColor(e.severity)}`,
                background: selectedEmergency?.id === e.id ? "#f8fafc" : "white",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: "10px", fontWeight: "bold", color: "white",
                  background: severityColor(e.severity),
                  padding: "2px 8px", borderRadius: "12px"
                }}>
                  {e.severity}
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>#{e.id}</span>
              </div>
              <div style={{ fontSize: "12px", marginTop: "6px", color: "#1e293b", fontWeight: "500" }}>
                {e.type}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                📍 {e.location}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                🏥 {e.hospitalName || "Not assigned"}
              </div>
              <div style={{
                fontSize: "11px", marginTop: "4px", fontWeight: "bold",
                color: e.status === "ASSIGNED" ? "#22c55e" : "#f97316"
              }}>
                ● {e.status}
              </div>
            </div>
          ))}

          {/* Responders Section */}
          <h4 style={{ margin: "16px 0 10px", color: "#1e293b", fontSize: "14px" }}>
            🚑 Responders ({responders.length})
          </h4>
          {responders.map((r) => (
            <div key={r.id} style={{
              padding: "8px 10px", marginBottom: "6px", borderRadius: "8px",
              border: "1px solid #e2e8f0", fontSize: "12px"
            }}>
              <div style={{ fontWeight: "600", color: "#1e293b" }}>🚑 {r.name}</div>
              <div style={{ color: "#64748b" }}>🔧 {r.skill}</div>
              <div style={{
                fontWeight: "bold", marginTop: "2px",
                color: r.available ? "#22c55e" : "#ef4444"
              }}>
                {r.available ? "✅ Available" : "🔴 On Duty"}
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={[13.0827, 80.2707]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Emergency Markers */}
            {emergencies.map((e) =>
              e.latitude && e.longitude ? (
                <Marker
                  key={`e-${e.id}`}
                  position={[e.latitude, e.longitude]}
                  icon={emergencyIcon(e.severity)}
                >
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <strong style={{ color: severityColor(e.severity) }}>
                        🚨 {e.severity}
                      </strong>
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>{e.type}</p>
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>📍 {e.location}</p>
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>🏥 {e.hospitalName || "N/A"}</p>
                      <p style={{
                        margin: "2px 0", fontSize: "12px", fontWeight: "bold",
                        color: e.status === "ASSIGNED" ? "#22c55e" : "#f97316"
                      }}>
                        {e.status}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Responder Markers */}
            {responders.map((r) =>
              r.latitude && r.longitude ? (
                <Marker
                  key={`r-${r.id}`}
                  position={[r.latitude, r.longitude]}
                  icon={responderIcon}
                >
                  <Popup>
                    <div style={{ minWidth: "160px" }}>
                      <strong>🚑 {r.name}</strong>
                      <p style={{ margin: "4px 0", fontSize: "12px" }}>📞 {r.phone}</p>
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>🔧 {r.skill}</p>
                      <p style={{
                        margin: "2px 0", fontSize: "12px", fontWeight: "bold",
                        color: r.available ? "#22c55e" : "#ef4444"
                      }}>
                        {r.available ? "✅ Available" : "🔴 On Duty"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Hospital Markers */}
            {hospitals.map((h) =>
              h.latitude && h.longitude ? (
                <Marker
                  key={`h-${h.id}`}
                  position={[h.latitude, h.longitude]}
                  icon={hospitalIcon}
                >
                  <Popup>
                    <div style={{ minWidth: "160px" }}>
                      <strong>🏥 {h.name}</strong>
                      <p style={{ margin: "4px 0", fontSize: "12px" }}>📍 {h.address}</p>
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>📞 {h.phone}</p>
                      <p style={{ margin: "2px 0", fontSize: "12px" }}>
                        🛏️ Beds: {h.availableBeds}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Route line: selected emergency → hospital */}
            {selectedEmergency && (() => {
              const hospital = hospitals.find(
                h => h.name === selectedEmergency.hospitalName
              );
              if (hospital?.latitude && hospital?.longitude) {
                return (
                  <Polyline
                    positions={[
                      [selectedEmergency.latitude, selectedEmergency.longitude],
                      [hospital.latitude, hospital.longitude],
                    ]}
                    color={severityColor(selectedEmergency.severity)}
                    weight={3}
                    dashArray="8"
                  />
                );
              }
              return null;
            })()}
          </MapContainer>

          {/* Legend */}
          <div style={{
            position: "absolute", bottom: "20px", right: "20px",
            background: "white", padding: "12px", borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: "12px", zIndex: 1000
          }}>
            <strong style={{ display: "block", marginBottom: "6px" }}>Legend</strong>
            {[
              { color: "#ef4444", label: "🚨 Critical" },
              { color: "#f97316", label: "🚨 High" },
              { color: "#eab308", label: "🚨 Medium" },
              { color: "#22c55e", label: "🚨 Low" },
              { color: "#3b82f6", label: "🚑 Responder" },
              { color: "#8b5cf6", label: "🏥 Hospital" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                gap: "8px", marginBottom: "4px"
              }}>
                <div style={{
                  width: "12px", height: "12px", borderRadius: "50%",
                  background: item.color, flexShrink: 0
                }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}