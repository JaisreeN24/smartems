import React, { useState } from "react";

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

  const getGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("GPS is not supported in this browser");
      return;
    }

    setGpsLoading(true);
    setGpsStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const locationName = data.display_name
            ? data.display_name.split(",").slice(0, 3).join(", ")
            : `${lat}, ${lng}`;

          setForm((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: locationName,
          }));
          setGpsStatus("Location detected");
        } catch {
          setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          setGpsStatus("GPS coordinates captured");
        }

        setGpsLoading(false);
      },
      () => {
        setGpsStatus("GPS denied. Please allow location access.");
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
      setError("Please fill in type, location, latitude, and longitude.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:8080/emergencies", {
        method: "POST",
        headers: authHeaders(token),
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
      setError("Failed to submit. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const quickExamples = [
    { label: "Cardiac Arrest", type: "Patient cardiac arrest unconscious", location: "Chennai Central", lat: "13.0827", lng: "80.2707" },
    { label: "High Fever", type: "Child with high fever 104F seizures", location: "Adyar", lat: "13.0012", lng: "80.2565" },
    { label: "Mild Headache", type: "Mild headache and nausea", location: "Porur", lat: "13.0358", lng: "80.1567" },
    { label: "Minor Bruise", type: "Small bruise on arm after minor fall", location: "Sholinganallur", lat: "12.9010", lng: "80.2279" },
  ];

  return (
    <div style={{ minHeight: "100vh", color: "var(--text)" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div className="glass-panel strong" style={{ padding: 24, marginBottom: 22 }}>
          <span className="eyebrow">Dispatch intake</span>
          <h2 className="panel-title" style={{ marginTop: 12, fontSize: 40 }}>Report Emergency</h2>
          <p className="panel-subtitle">Create a polished intake record with location, patient context, and live dispatch-ready coordinates.</p>
        </div>

        <div className="glass-panel strong" style={{ padding: 24, marginBottom: 18 }}>
          <div className="eyebrow">Quick scenarios</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            {quickExamples.map((ex) => (
              <button key={ex.label} onClick={() => quickFill(ex.type, ex.location, ex.lat, ex.lng)} className="quick-chip">
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel strong" style={{ padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18 }}>
            <div className="field">
              <label>Emergency Description</label>
              <textarea
                rows={4}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Describe the emergency in clear operational language..."
              />
            </div>

            <div className="glass-panel" style={{ padding: 18, borderRadius: 20 }}>
              <div className="eyebrow">GPS assist</div>
              <p className="panel-subtitle" style={{ marginTop: 10 }}>Pull live coordinates from the device, then refine the address if needed.</p>
              <button
                onClick={getGPS}
                disabled={gpsLoading}
                className="primary-btn"
                style={{ marginTop: 16, opacity: gpsLoading ? 0.7 : 1 }}
              >
                {gpsLoading ? "Detecting location..." : "Use current location"}
              </button>
              {gpsStatus && (
                <div className="info-box" style={{ marginTop: 14 }}>
                  {gpsStatus}
                </div>
              )}
            </div>
          </div>

          <div className="field-stack" style={{ marginTop: 20 }}>
            <div className="field">
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Street, landmark, or auto-detected location"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label>Latitude</label>
                <input
                  type="number"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="Auto-filled by GPS"
                />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input
                  type="number"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="Auto-filled by GPS"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label>Patient Name</label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="field">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
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
            {loading ? "Submitting..." : "Submit emergency"}
          </button>
        </div>

        {result && (
          <div
            className="glass-panel strong"
            style={{
              marginTop: 20,
              padding: 24,
              borderColor: `${severityColor(result.severity)}55`,
            }}
          >
            <span className="eyebrow" style={{ color: severityColor(result.severity) }}>Submission complete</span>
            <h3 className="panel-title" style={{ marginTop: 12 }}>Emergency dispatched successfully</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
              {[
                { label: "Emergency ID", value: `#${result.id}` },
                { label: "AI Severity", value: result.severity, color: severityColor(result.severity) },
                { label: "Status", value: result.status, color: result.status === "ASSIGNED" ? "#4da2ff" : "#ffb34d" },
                { label: "Responder", value: result.responderName || "Not assigned" },
                { label: "Hospital", value: result.hospitalName || "Not assigned" },
              ].map((item) => (
                <div key={item.label} className="glass-panel" style={{ padding: 16, borderRadius: 18 }}>
                  <div className="eyebrow" style={{ color: "var(--muted)" }}>{item.label}</div>
                  <div style={{ marginTop: 12, fontSize: 20, fontWeight: 800, color: item.color || "var(--text)" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
