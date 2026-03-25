import React, { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useWebSocket from "../useWebSocket";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

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

const missionIcon = (label, color) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;border-radius:14px;
      background:linear-gradient(145deg, ${color}, rgba(7,18,33,0.92));
      border:1px solid rgba(255,255,255,0.4);
      box-shadow:0 14px 24px rgba(0,0,0,0.28), 0 0 18px ${color}55;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:12px;font-weight:900;
      font-family:Manrope, sans-serif;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const emergencyIcon = (severity) => missionIcon("E", severityColor(severity));
const responderIcon = missionIcon("R", "#4da2ff");
const hospitalIcon = missionIcon("H", "#a272ff");

export default function MapView({ token }) {
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [eRes, rRes, hRes] = await Promise.all([
        fetch("http://localhost:8080/emergencies", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/responders", { headers: authHeaders(token) }),
        fetch("http://localhost:8080/hospitals", { headers: authHeaders(token) }),
      ]);

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
  }, [token]);

  const { connected } = useWebSocket((newEmergency) => {
    setEmergencies((prev) => [newEmergency, ...prev.filter((e) => e.id !== newEmergency.id)]);
    setLastUpdated(new Date().toLocaleTimeString());
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const selectedHospital = selectedEmergency
    ? hospitals.find((h) => h.name === selectedEmergency.hospitalName)
    : null;

  const mapStats = [
    { label: "Tracked", value: emergencies.length, color: "#4da2ff" },
    { label: "Critical", value: emergencies.filter((e) => e.severity === "CRITICAL").length, color: "#ff6d7b" },
    { label: "Responders", value: responders.length, color: "#6be3ff" },
    { label: "Hospitals", value: hospitals.length, color: "#a272ff" },
  ];

  return (
    <div style={{ minHeight: "100vh", color: "var(--text)" }}>
      <div className="glass-panel strong" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Mission map</span>
            <h2 className="panel-title" style={{ marginTop: 12, fontSize: 40 }}>Live routing surface</h2>
            <p className="panel-subtitle">Track incidents, assets, and destination facilities on a single tactical board.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="status-pill live">{connected ? "Realtime feed active" : "Connecting"}</span>
            <span className="status-pill">Updated {lastUpdated || "Loading..."}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 18 }}>
          {mapStats.map((stat) => (
            <div key={stat.label} className="glass-panel" style={{ padding: 14, borderRadius: 18 }}>
              <div className="eyebrow" style={{ color: stat.color }}>{stat.label}</div>
              <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-shell">
        <div className="glass-panel strong soft-scroll" style={{ padding: 18, overflowY: "auto", maxHeight: "calc(100vh - 240px)" }}>
          <div className="eyebrow">Incident queue</div>
          <h3 className="panel-title" style={{ marginTop: 10 }}>Emergency stack</h3>

          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {emergencies.length === 0 ? (
              <div className="glass-panel" style={{ padding: 20, borderRadius: 18 }}>
                <p className="panel-subtitle">No emergencies found.</p>
              </div>
            ) : (
              emergencies.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEmergency(selectedEmergency?.id === e.id ? null : e)}
                  className="glass-panel"
                  style={{
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 20,
                    cursor: "pointer",
                    borderColor: selectedEmergency?.id === e.id ? `${severityColor(e.severity)}66` : "rgba(167, 199, 255, 0.12)",
                    background: selectedEmergency?.id === e.id
                      ? `linear-gradient(145deg, ${severityColor(e.severity)}16, rgba(17,31,53,0.8))`
                      : undefined,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: `${severityColor(e.severity)}20`,
                        border: `1px solid ${severityColor(e.severity)}33`,
                        color: severityColor(e.severity),
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {e.severity}
                    </span>
                    <span className="panel-subtitle" style={{ margin: 0 }}>#{e.id}</span>
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 800 }}>{e.type}</div>
                  <div className="panel-subtitle" style={{ marginTop: 8 }}>{e.location}</div>
                  <div className="panel-subtitle">Responder: {e.responderName || "Unassigned"}</div>
                  <div className="panel-subtitle">Hospital: {e.hospitalName || "Not assigned"}</div>
                  <div style={{ marginTop: 10, color: statusColor(e.status), fontWeight: 800, fontSize: 12 }}>{e.status}</div>
                </button>
              ))
            )}
          </div>

          <div style={{ marginTop: 22 }}>
            <div className="eyebrow">Asset readiness</div>
            <h3 className="panel-title" style={{ marginTop: 10, fontSize: 20 }}>Responders</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {responders.map((r) => (
                <div key={r.id} className="glass-panel" style={{ padding: 14, borderRadius: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{r.name}</div>
                      <div className="panel-subtitle" style={{ marginTop: 4 }}>{r.skill || "No specialization"}</div>
                    </div>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: r.available ? "rgba(50,211,154,0.15)" : "rgba(255,109,123,0.15)",
                        border: r.available ? "1px solid rgba(50,211,154,0.24)" : "1px solid rgba(255,109,123,0.22)",
                        color: r.available ? "#8dffc9" : "#ffb7bf",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {r.available ? "Available" : "On duty"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel strong" style={{ padding: 18, minHeight: "calc(100vh - 240px)" }}>
          <div className="map-stage">
            <div style={{ position: "relative", minHeight: 640 }}>
              <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: "100%", width: "100%", borderRadius: 24 }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                {emergencies.map((e) =>
                  e.latitude && e.longitude ? (
                    <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={emergencyIcon(e.severity)}>
                      <Popup>
                        <div style={{ minWidth: 180 }}>
                          <strong style={{ color: severityColor(e.severity) }}>{e.severity}</strong>
                          <p style={{ margin: "6px 0" }}>{e.type}</p>
                          <p style={{ margin: "4px 0" }}>{e.location}</p>
                          <p style={{ margin: "4px 0" }}>Responder: {e.responderName || "Unassigned"}</p>
                          <p style={{ margin: "4px 0" }}>Hospital: {e.hospitalName || "N/A"}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                )}

                {responders.map((r) =>
                  r.latitude && r.longitude ? (
                    <Marker key={`r-${r.id}`} position={[r.latitude, r.longitude]} icon={responderIcon}>
                      <Popup>
                        <div>
                          <strong>{r.name}</strong>
                          <p style={{ margin: "4px 0" }}>{r.skill}</p>
                          <p style={{ margin: "4px 0" }}>{r.phone}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                )}

                {hospitals.map((h) =>
                  h.latitude && h.longitude ? (
                    <Marker key={`h-${h.id}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                      <Popup>
                        <div>
                          <strong>{h.name}</strong>
                          <p style={{ margin: "4px 0" }}>{h.address}</p>
                          <p style={{ margin: "4px 0" }}>Beds: {h.availableBeds}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                )}

                {selectedEmergency && selectedHospital?.latitude && selectedHospital?.longitude && (
                  <Polyline
                    positions={[
                      [selectedEmergency.latitude, selectedEmergency.longitude],
                      [selectedHospital.latitude, selectedHospital.longitude],
                    ]}
                    color={severityColor(selectedEmergency.severity)}
                    weight={4}
                    dashArray="10"
                  />
                )}
              </MapContainer>

              <div
                className="glass-panel"
                style={{
                  position: "absolute",
                  left: 16,
                  top: 16,
                  padding: 14,
                  borderRadius: 18,
                  minWidth: 220,
                }}
              >
                <div className="eyebrow">Map legend</div>
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {[
                    { color: "#ff6d7b", label: "Emergency" },
                    { color: "#4da2ff", label: "Responder" },
                    { color: "#a272ff", label: "Hospital" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 11, height: 11, borderRadius: 999, background: item.color }} />
                      <span className="panel-subtitle" style={{ margin: 0 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="glass-panel" style={{ padding: 18, borderRadius: 20 }}>
                <div className="eyebrow">Selected mission</div>
                {selectedEmergency ? (
                  <>
                    <h3 className="panel-title" style={{ marginTop: 12, fontSize: 24 }}>{selectedEmergency.type}</h3>
                    <p className="panel-subtitle">{selectedEmergency.location}</p>
                    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                      {[
                        ["Severity", selectedEmergency.severity, severityColor(selectedEmergency.severity)],
                        ["Status", selectedEmergency.status, statusColor(selectedEmergency.status)],
                        ["Responder", selectedEmergency.responderName || "Unassigned"],
                        ["Hospital", selectedEmergency.hospitalName || "Not assigned"],
                      ].map(([label, value, color]) => (
                        <div key={label} className="glass-panel" style={{ padding: 12, borderRadius: 16 }}>
                          <div className="eyebrow" style={{ color: "var(--muted)" }}>{label}</div>
                          <div style={{ marginTop: 8, fontWeight: 800, color: color || "var(--text)" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="panel-title" style={{ marginTop: 12, fontSize: 24 }}>No mission selected</h3>
                    <p className="panel-subtitle">Choose any emergency from the queue to spotlight it on the board.</p>
                  </>
                )}
              </div>

              <div className="glass-panel" style={{ padding: 18, borderRadius: 20 }}>
                <div className="eyebrow">Routing line</div>
                <h3 className="panel-title" style={{ marginTop: 12, fontSize: 24 }}>Hospital path preview</h3>
                <p className="panel-subtitle">
                  {selectedEmergency && selectedHospital
                    ? `Showing the current link from incident #${selectedEmergency.id} to ${selectedHospital.name}.`
                    : "Select an emergency with a hospital assignment to preview the destination path."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
