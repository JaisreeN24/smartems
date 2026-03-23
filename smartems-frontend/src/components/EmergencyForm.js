import React, { useState } from "react";

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

export default function EmergencyForm({ token }) {
  const [form, setForm] = useState({
    type: "",
    location: "",
    latitude: "",
    longitude: "",
    patientName: "",
    contactNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null);

  // ✅ Real GPS from browser
  const getGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("❌ GPS not supported in this browser");
      return;
    }
    setGpsLoading(true);
    setGpsStatus("📡 Getting your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        // Reverse geocode to get location name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const locationName = data.display_name
            ? data.display_name.split(",").slice(0, 3).join(", ")
            : `${lat}, ${lng}`;

          setForm(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: locationName,
          }));
          setGpsStatus(`✅ Location detected!`);
        } catch {
          setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
          setGpsStatus("✅ GPS coordinates captured!");
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsStatus("❌ GPS denied. Please allow location access.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const quickFill = (type, location, lat, lng) => {
    setForm({ ...form, type, location, latitude: lat, longitude: lng });
    setGpsStatus(null);
  };

  const handleSubmit = async () => {
    if (!form.type || !form.location || !form.latitude || !form.longitude) {
      setError("Please fill in Type, Location, Latitude and Longitude!");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/emergencies", {
        method: "POST",
        headers: authHeaders(token),   // ✅ JWT token
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      const data = await res.json();
      setResult(data);
      setForm({ type: "", location: "", latitude: "", longitude: "", patientName: "", contactNumber: "" });
      setGpsStatus(null);
    } catch (err) {
      setError("Failed to submit. Make sure backend is running!");
    }
    setLoading(false);
  };

  const quickExamples = [
    { label: "🔴 Cardiac Arrest", type: "Patient cardiac arrest unconscious", location: "Chennai Central", lat: "13.0827", lng: "80.2707" },
    { label: "🟠 High Fever", type: "Child with high fever 104F seizures", location: "Adyar", lat: "13.0012", lng: "80.2565" },
    { label: "🟡 Mild Headache", type: "Mild headache and nausea", location: "Porur", lat: "13.0358", lng: "80.1567" },
    { label: "🟢 Minor Bruise", type: "Small bruise on arm after minor fall", location: "Sholinganallur", lat: "12.9010", lng: "80.2279" },
  ];

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "24px", color: "white" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>
            🚨 Report Emergency
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "13px" }}>
            AI will automatically classify severity and assign responder + hospital
          </p>
        </div>

        {/* Quick Fill Buttons */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "8px" }}>
            ⚡ Quick Test Examples:
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {quickExamples.map((ex, i) => (
              <button
                key={i}
                onClick={() => quickFill(ex.type, ex.location, ex.lat, ex.lng)}
                style={{
                  background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155",
                  borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                  fontSize: "12px", transition: "all 0.2s"
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ background: "#1e293b", borderRadius: "16px", padding: "28px" }}>

          {/* Emergency Type */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
              🚨 Emergency Description *
            </label>
            <textarea
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              placeholder="Describe the emergency (e.g. Patient unconscious not breathing...)"
              rows={3}
              style={{
                width: "100%", background: "#0f172a", border: "1px solid #334155",
                borderRadius: "8px", padding: "10px 14px", color: "white",
                fontSize: "14px", resize: "vertical", boxSizing: "border-box", outline: "none"
              }}
            />
          </div>

          {/* GPS Button */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
              📍 Location *
            </label>

            {/* GPS Auto-detect Button */}
            <button
              onClick={getGPS}
              disabled={gpsLoading}
              style={{
                width: "100%", padding: "10px", marginBottom: "10px",
                background: gpsLoading ? "#334155" : "#0f4c8a",
                color: "white", border: "1px solid #1d4ed8",
                borderRadius: "8px", cursor: gpsLoading ? "not-allowed" : "pointer",
                fontSize: "13px", fontWeight: "600", transition: "all 0.2s"
              }}
            >
              {gpsLoading ? "📡 Detecting location..." : "📍 Use My Current Location (GPS)"}
            </button>

            {/* GPS Status */}
            {gpsStatus && (
              <div style={{
                padding: "8px 12px", borderRadius: "6px", marginBottom: "8px",
                background: gpsStatus.includes("✅") ? "#22c55e20" : gpsStatus.includes("❌") ? "#ef444420" : "#3b82f620",
                color: gpsStatus.includes("✅") ? "#22c55e" : gpsStatus.includes("❌") ? "#ef4444" : "#3b82f6",
                fontSize: "12px", fontWeight: "600"
              }}>
                {gpsStatus}
              </div>
            )}

            {/* Manual Location Input */}
            <input
              type="text"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Or type location manually..."
              style={{
                width: "100%", background: "#0f172a", border: "1px solid #334155",
                borderRadius: "8px", padding: "10px 14px", color: "white",
                fontSize: "14px", boxSizing: "border-box", outline: "none"
              }}
            />
          </div>

          {/* Lat / Lng */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                🌐 Latitude *
              </label>
              <input
                type="number"
                value={form.latitude}
                onChange={e => setForm({ ...form, latitude: e.target.value })}
                placeholder="Auto-filled by GPS"
                style={{
                  width: "100%", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", padding: "10px 14px", color: "white",
                  fontSize: "14px", boxSizing: "border-box", outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                🌐 Longitude *
              </label>
              <input
                type="number"
                value={form.longitude}
                onChange={e => setForm({ ...form, longitude: e.target.value })}
                placeholder="Auto-filled by GPS"
                style={{
                  width: "100%", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", padding: "10px 14px", color: "white",
                  fontSize: "14px", boxSizing: "border-box", outline: "none"
                }}
              />
            </div>
          </div>

          {/* Patient Name / Contact */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                👤 Patient Name
              </label>
              <input
                type="text"
                value={form.patientName}
                onChange={e => setForm({ ...form, patientName: e.target.value })}
                placeholder="Optional"
                style={{
                  width: "100%", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", padding: "10px 14px", color: "white",
                  fontSize: "14px", boxSizing: "border-box", outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                📞 Contact Number
              </label>
              <input
                type="text"
                value={form.contactNumber}
                onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="Optional"
                style={{
                  width: "100%", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", padding: "10px 14px", color: "white",
                  fontSize: "14px", boxSizing: "border-box", outline: "none"
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#ef444420", border: "1px solid #ef444440",
              borderRadius: "8px", padding: "12px", marginBottom: "16px",
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
              width: "100%", padding: "14px",
              background: loading ? "#334155" : "#3b82f6",
              color: "white", border: "none", borderRadius: "10px",
              fontSize: "15px", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s"
            }}
          >
            {loading ? "⏳ Submitting..." : "🚨 Submit Emergency"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: "20px", background: "#1e293b",
            borderRadius: "16px", padding: "24px",
            border: `2px solid ${severityColor(result.severity)}`
          }}>
            <h3 style={{ margin: "0 0 16px", color: "white", fontSize: "16px" }}>
              ✅ Emergency Submitted Successfully!
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Emergency ID", value: `#${result.id}` },
                { label: "AI Severity", value: result.severity, color: severityColor(result.severity) },
                { label: "Status", value: result.status, color: result.status === "ASSIGNED" ? "#22c55e" : "#f97316" },
                { label: "Hospital", value: result.hospitalName || "Not assigned" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#0f172a", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ fontWeight: "700", color: item.color || "white", fontSize: "15px" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}