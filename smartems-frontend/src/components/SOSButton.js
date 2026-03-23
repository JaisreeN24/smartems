import React, { useState } from "react";
import FirstAidChatbot from "./FirstAidChatbot";

const severityColor = (severity) => {
  if (severity === "CRITICAL") return "#ef4444";
  if (severity === "HIGH") return "#f97316";
  if (severity === "MEDIUM") return "#eab308";
  return "#22c55e";
};

export default function SOSButton() {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState("form");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false); // ✅ NEW

  const openModal = () => {
    setShowModal(true);
    setStep("form");
    setDescription("");
    setLocation("");
    setLat("");
    setLng("");
    setResult(null);
    setError(null);
    setGpsStatus(null);
    setShowChatbot(false);
    detectGPS();
  };

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("❌ GPS not supported");
      return;
    }
    setGpsStatus("📡 Detecting location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const loc = data.display_name
            ? data.display_name.split(",").slice(0, 3).join(", ")
            : `${latitude}, ${longitude}`;
          setLocation(loc);
          setGpsStatus("✅ Location detected!");
        } catch {
          setLocation(`${latitude}, ${longitude}`);
          setGpsStatus("✅ GPS captured!");
        }
      },
      () => setGpsStatus("❌ GPS denied — enter location manually"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSOS = async () => {
    if (!description.trim()) {
      setError("Please describe the emergency!");
      return;
    }
    if (!lat || !lng) {
      setError("Location not detected. Please allow GPS or enter manually.");
      return;
    }
    setStep("submitting");
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/emergencies/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: description,
          location: location,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        }),
      });
      const data = await res.json();
      setResult(data);
      setStep("success");
    } catch (err) {
      setError("Failed to send SOS. Please call 112!");
      setStep("form");
    }
  };

  return (
    <>
      {/* ✅ Floating SOS Button */}
      <button
        onClick={openModal}
        style={{
          position: "fixed", bottom: "30px", left: "30px", zIndex: 9998,
          width: "70px", height: "70px", borderRadius: "50%",
          background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          color: "white", border: "none", cursor: "pointer",
          fontSize: "13px", fontWeight: "900",
          boxShadow: "0 0 0 0 rgba(239,68,68,0.7)",
          animation: "sospulse 2s infinite",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "2px"
        }}
      >
        <span style={{ fontSize: "22px" }}>🆘</span>
        <span style={{ fontSize: "11px", fontWeight: "900" }}>SOS</span>
      </button>

      {/* ✅ SOS Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#0f172a", borderRadius: "20px",
            padding: "32px", width: "100%", maxWidth: "460px",
            border: "2px solid #ef4444",
            boxShadow: "0 0 40px rgba(239,68,68,0.3)"
          }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>🆘</div>
              <h2 style={{ margin: 0, color: "white", fontSize: "24px", fontWeight: "900" }}>
                Emergency SOS
              </h2>
              <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "13px" }}>
                Help is on the way — fill in the details below
              </p>
            </div>

            {/* FORM STEP */}
            {step === "form" && (
              <>
                {gpsStatus && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "8px", marginBottom: "14px",
                    background: gpsStatus.includes("✅") ? "#22c55e20" :
                                gpsStatus.includes("❌") ? "#ef444420" : "#3b82f620",
                    color: gpsStatus.includes("✅") ? "#22c55e" :
                           gpsStatus.includes("❌") ? "#ef4444" : "#3b82f6",
                    fontSize: "13px", fontWeight: "600"
                  }}>
                    {gpsStatus}
                  </div>
                )}

                {location && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "8px", marginBottom: "14px",
                    background: "#1e293b", border: "1px solid #334155"
                  }}>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                      📍 Your Location
                    </div>
                    <div style={{ fontSize: "13px", color: "white" }}>{location}</div>
                  </div>
                )}

                {!location && (
                  <div style={{ marginBottom: "14px" }}>
                    <input
                      type="text"
                      placeholder="📍 Enter your location manually"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      style={{
                        width: "100%", background: "#1e293b",
                        border: "1px solid #334155", borderRadius: "8px",
                        padding: "10px 14px", color: "white",
                        fontSize: "14px", boxSizing: "border-box", outline: "none"
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    display: "block", fontSize: "12px", color: "#94a3b8",
                    marginBottom: "6px", fontWeight: "600"
                  }}>
                    🚨 What is the emergency?
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Person collapsed and unconscious..."
                    rows={3}
                    style={{
                      width: "100%", background: "#1e293b",
                      border: "1px solid #ef444460", borderRadius: "8px",
                      padding: "10px 14px", color: "white",
                      fontSize: "14px", resize: "none",
                      boxSizing: "border-box", outline: "none"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                    ⚡ Quick select:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {[
                      "Person collapsed unconscious",
                      "Cardiac arrest not breathing",
                      "Severe bleeding injury",
                      "Road accident victim",
                      "Stroke symptoms",
                      "Child high fever seizures",
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setDescription(q)}
                        style={{
                          background: description === q ? "#ef444430" : "#1e293b",
                          color: description === q ? "#ef4444" : "#94a3b8",
                          border: `1px solid ${description === q ? "#ef4444" : "#334155"}`,
                          borderRadius: "6px", padding: "4px 10px",
                          cursor: "pointer", fontSize: "11px"
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: "#ef444420", border: "1px solid #ef444440",
                    borderRadius: "8px", padding: "10px", marginBottom: "14px",
                    color: "#ef4444", fontSize: "13px"
                  }}>
                    ❌ {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: "10px",
                      background: "#1e293b", color: "#94a3b8",
                      border: "1px solid #334155", cursor: "pointer",
                      fontSize: "14px", fontWeight: "600"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSOS}
                    style={{
                      flex: 2, padding: "12px", borderRadius: "10px",
                      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                      color: "white", border: "none", cursor: "pointer",
                      fontSize: "16px", fontWeight: "900",
                      boxShadow: "0 4px 20px rgba(239,68,68,0.4)"
                    }}
                  >
                    🆘 SEND SOS NOW
                  </button>
                </div>
              </>
            )}

            {/* SUBMITTING STEP */}
            {step === "submitting" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{
                  fontSize: "48px", marginBottom: "16px",
                  animation: "spin 1s linear infinite", display: "inline-block"
                }}>
                  🚨
                </div>
                <p style={{ color: "white", fontSize: "18px", fontWeight: "700" }}>
                  Sending SOS...
                </p>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                  Locating nearest responder and hospital
                </p>
              </div>
            )}

            {/* SUCCESS STEP */}
            {step === "success" && result && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <h3 style={{ color: "white", margin: "0 0 6px", fontSize: "20px" }}>
                  Help is on the way!
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
                  Stay calm. Responder has been notified.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { label: "Emergency ID", value: `#${result.id}`, color: "white" },
                    { label: "AI Severity", value: result.severity, color: severityColor(result.severity) },
                    { label: "Status", value: result.status, color: result.status === "ASSIGNED" ? "#22c55e" : "#f97316" },
                    { label: "🏥 Hospital", value: result.hospitalName || "Locating...", color: "#8b5cf6" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: "#1e293b", borderRadius: "10px", padding: "12px"
                    }}>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                        {item.label}
                      </div>
                      <div style={{ fontWeight: "800", color: item.color, fontSize: "14px" }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ First Aid Chatbot Button */}
                <button
                  onClick={() => setShowChatbot(true)}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white", border: "none", cursor: "pointer",
                    fontSize: "14px", fontWeight: "700", marginBottom: "10px",
                    boxShadow: "0 4px 20px rgba(34,197,94,0.3)"
                  }}
                >
                  🏥 Get First Aid Instructions (AI)
                </button>

                <div style={{
                  background: "#ef444420", border: "1px solid #ef444440",
                  borderRadius: "10px", padding: "12px", marginBottom: "16px"
                }}>
                  <p style={{ margin: 0, color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>
                    📞 Also call 112 for additional help!
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    background: "#334155", color: "white",
                    border: "none", cursor: "pointer",
                    fontSize: "15px", fontWeight: "700"
                  }}
                >
                  ✅ Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ First Aid Chatbot */}
      {showChatbot && (
        <FirstAidChatbot
          emergency={description}
          onClose={() => setShowChatbot(false)}
        />
      )}

      <style>{`
        @keyframes sospulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}