import React, { useMemo, useState } from "react";
import FirstAidChatbot from "./FirstAidChatbot";

const severityColor = (severity) => {
  if (severity === "CRITICAL") return "#ff6d7b";
  if (severity === "HIGH") return "#ffb34d";
  if (severity === "MEDIUM") return "#ffe066";
  return "#32d39a";
};

const quickScenarios = [
  "Person collapsed unconscious",
  "Cardiac arrest not breathing",
  "Severe bleeding injury",
  "Road accident victim",
  "Stroke symptoms",
  "Child high fever seizures",
];

const gpsTone = (status) => {
  if (!status) return { color: "var(--muted)", background: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)" };
  if (status.type === "success") return { color: "#8dffc9", background: "rgba(50,211,154,0.14)", border: "rgba(50,211,154,0.2)" };
  if (status.type === "error") return { color: "#ffb7bf", background: "rgba(255,109,123,0.16)", border: "rgba(255,109,123,0.24)" };
  return { color: "#a9d9ff", background: "rgba(77,162,255,0.14)", border: "rgba(77,162,255,0.2)" };
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
  const [showChatbot, setShowChatbot] = useState(false);

  const gpsStyle = useMemo(() => gpsTone(gpsStatus), [gpsStatus]);

  const closeModal = () => {
    setShowModal(false);
    setShowChatbot(false);
  };

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus({ type: "error", text: "GPS is not supported on this device." });
      return;
    }

    setGpsStatus({ type: "pending", text: "Scanning for current location..." });

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
          setGpsStatus({ type: "success", text: "Location lock acquired." });
        } catch {
          setLocation(`${latitude}, ${longitude}`);
          setGpsStatus({ type: "success", text: "Coordinates captured. Address lookup skipped." });
        }
      },
      () => setGpsStatus({ type: "error", text: "Location access denied. Enter the location manually." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openModal = () => {
    setShowModal(true);
    setStep("form");
    setDescription("");
    setLocation("");
    setLat("");
    setLng("");
    setResult(null);
    setError(null);
    setGpsStatus({ type: "pending", text: "Scanning for current location..." });
    setShowChatbot(false);
    detectGPS();
  };

  const handleSOS = async () => {
    if (!description.trim()) {
      setError("Please describe the emergency before dispatch.");
      return;
    }

    if (!lat || !lng) {
      setError("Location is missing. Allow GPS or provide the location manually.");
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
          location,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        }),
      });

      const data = await res.json();
      setResult(data);
      setStep("success");
    } catch {
      setError("Failed to send SOS. Please call 112 immediately.");
      setStep("form");
    }
  };

  const resultCards = result
    ? [
        { label: "Emergency ID", value: `#${result.id}`, color: "var(--text)" },
        { label: "AI severity", value: result.severity, color: severityColor(result.severity) },
        { label: "Status", value: result.status, color: result.status === "ASSIGNED" ? "#6be3ff" : "#ffb34d" },
        { label: "Responder", value: result.responderName || "Dispatching...", color: "#8dffc9" },
        { label: "Hospital", value: result.hospitalName || "Locating...", color: "#d1bbff" },
        { label: "Location", value: location || "Captured", color: "var(--muted)" },
      ]
    : [];

  return (
    <>
      <button
        onClick={openModal}
        aria-label="Open SOS dispatch"
        style={{
          position: "fixed",
          left: 24,
          bottom: 24,
          zIndex: 9998,
          width: 92,
          height: 92,
          padding: 0,
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 28,
          cursor: "pointer",
          color: "#fff6f7",
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28), transparent 28%), linear-gradient(145deg, rgba(255,109,123,0.98), rgba(134,14,40,0.98))",
          boxShadow:
            "0 28px 60px rgba(93,7,26,0.44), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 10px rgba(255,109,123,0.08)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.12), transparent 50%)",
          }}
        />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.26em", opacity: 0.9 }}>ALERT</div>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>SOS</div>
        </div>
      </button>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            padding: 20,
            background:
              "radial-gradient(circle at top, rgba(255,109,123,0.2), transparent 28%), rgba(2,7,17,0.84)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="glass-panel strong"
            style={{
              width: "min(1080px, 100%)",
              maxHeight: "min(92vh, 880px)",
              overflow: "auto",
              padding: 0,
              borderRadius: 32,
              borderColor: "rgba(255,109,123,0.22)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            }}
          >
            <div className="sos-layout">
              <section
                style={{
                  padding: 28,
                  borderRight: "1px solid rgba(167,199,255,0.1)",
                  background:
                    "radial-gradient(circle at top left, rgba(255,109,123,0.18), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent)",
                }}
              >
                <span className="eyebrow" style={{ color: "#ffb7bf" }}>
                  Rapid dispatch
                </span>
                <h2 className="panel-title" style={{ marginTop: 12, fontSize: 36 }}>
                  Emergency beacon
                </h2>
                <p className="panel-subtitle">
                  Trigger a high-priority dispatch, capture your live position, and stay connected while responders are routed in.
                </p>

                <div
                  className="glass-panel"
                  style={{
                    marginTop: 22,
                    padding: 18,
                    borderRadius: 24,
                    background:
                      "linear-gradient(145deg, rgba(255,109,123,0.12), rgba(17,31,53,0.72))",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div className="eyebrow" style={{ color: "#ff9ca6" }}>
                        Dispatch state
                      </div>
                      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 800, color: "#fff1f2" }}>
                        {step === "success" ? "Locked in" : step === "submitting" ? "Dispatching" : "Standby"}
                      </div>
                    </div>
                    <span
                      style={{
                        minWidth: 84,
                        textAlign: "center",
                        padding: "12px 14px",
                        borderRadius: 20,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.16em",
                      }}
                    >
                      SOS
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                    {[
                      ["Location", location || "Awaiting capture"],
                      ["Coordinates", lat && lng ? `${lat}, ${lng}` : "Not captured"],
                      ["Instructions", "Call 112 in parallel if the emergency is life-threatening."],
                    ].map(([label, value]) => (
                      <div key={label} className="glass-panel" style={{ padding: 14, borderRadius: 18 }}>
                        <div className="eyebrow">{label}</div>
                        <div style={{ marginTop: 8, lineHeight: 1.6 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {quickScenarios.slice(0, 4).map((item, index) => (
                    <div
                      key={item}
                      className="glass-panel"
                      style={{
                        padding: "14px 16px",
                        borderRadius: 18,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          color: "#ffcad0",
                          background: "rgba(255,109,123,0.12)",
                          border: "1px solid rgba(255,109,123,0.18)",
                        }}
                      >
                        0{index + 1}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 14 }}>{item}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                  <div>
                    <span className="eyebrow">Live request</span>
                    <h3 className="panel-title" style={{ marginTop: 10, fontSize: 28 }}>
                      {step === "success" ? "Responder pipeline active" : "Dispatch intake"}
                    </h3>
                  </div>
                  <button className="ghost-danger-btn" onClick={closeModal}>
                    Close
                  </button>
                </div>

                {step === "form" && (
                  <>
                    <div
                      className="glass-panel"
                      style={{
                        marginTop: 18,
                        padding: 14,
                        borderRadius: 18,
                        color: gpsStyle.color,
                        background: gpsStyle.background,
                        border: `1px solid ${gpsStyle.border}`,
                      }}
                    >
                      <div className="eyebrow" style={{ color: gpsStyle.color }}>
                        GPS feed
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 700 }}>{gpsStatus?.text || "Ready to scan for location."}</div>
                    </div>

                    <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
                      <div className="glass-panel" style={{ padding: 18, borderRadius: 22 }}>
                        <div className="eyebrow">Emergency location</div>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter landmark, street, or area"
                          className="field-input"
                          style={{ marginTop: 12 }}
                        />
                        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                          <button className="secondary-btn" type="button" onClick={detectGPS}>
                            Refresh GPS
                          </button>
                          <div className="panel-subtitle" style={{ margin: 0 }}>
                            Coordinates: {lat && lng ? `${lat}, ${lng}` : "Awaiting location"}
                          </div>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: 18, borderRadius: 22 }}>
                        <div className="eyebrow">Emergency description</div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe what is happening right now so dispatch can prioritize correctly."
                          rows={5}
                          className="field-input"
                          style={{ marginTop: 12, resize: "vertical", minHeight: 132 }}
                        />
                      </div>

                      <div className="glass-panel" style={{ padding: 18, borderRadius: 22 }}>
                        <div className="eyebrow">Rapid scenario tags</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                          {quickScenarios.map((scenario) => (
                            <button
                              key={scenario}
                              type="button"
                              onClick={() => setDescription(scenario)}
                              style={{
                                padding: "10px 14px",
                                borderRadius: 999,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 800,
                                color: description === scenario ? "#fff1f2" : "var(--muted)",
                                background:
                                  description === scenario
                                    ? "linear-gradient(145deg, rgba(255,109,123,0.32), rgba(113,17,39,0.74))"
                                    : "rgba(255,255,255,0.04)",
                                border:
                                  description === scenario
                                    ? "1px solid rgba(255,109,123,0.34)"
                                    : "1px solid rgba(167,199,255,0.1)",
                              }}
                            >
                              {scenario}
                            </button>
                          ))}
                        </div>
                      </div>

                      {error && (
                        <div
                          className="glass-panel"
                          style={{
                            padding: 16,
                            borderRadius: 20,
                            background: "rgba(255,109,123,0.16)",
                            borderColor: "rgba(255,109,123,0.24)",
                            color: "#ffd2d7",
                          }}
                        >
                          {error}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button className="secondary-btn" type="button" onClick={closeModal} style={{ flex: "1 1 160px" }}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSOS}
                          style={{
                            flex: "2 1 240px",
                            padding: "15px 18px",
                            border: "1px solid rgba(255,255,255,0.16)",
                            borderRadius: 18,
                            cursor: "pointer",
                            color: "#fff4f5",
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            background:
                              "radial-gradient(circle at top, rgba(255,255,255,0.22), transparent 34%), linear-gradient(145deg, rgba(255,109,123,0.96), rgba(143,16,44,0.98))",
                            boxShadow: "0 22px 34px rgba(113,17,39,0.34)",
                          }}
                        >
                          Launch dispatch
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {step === "submitting" && (
                  <div
                    style={{
                      minHeight: 420,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div style={{ textAlign: "center", maxWidth: 380 }}>
                      <div
                        style={{
                          width: 96,
                          height: 96,
                          margin: "0 auto",
                          borderRadius: 28,
                          background:
                            "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.3), transparent 24%), linear-gradient(145deg, rgba(255,109,123,0.94), rgba(143,16,44,0.98))",
                          boxShadow: "0 26px 50px rgba(110,12,33,0.38)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 24,
                          fontWeight: 900,
                          letterSpacing: "0.14em",
                        }}
                      >
                        SOS
                      </div>
                      <h3 className="panel-title" style={{ marginTop: 22, fontSize: 28 }}>
                        Dispatch in progress
                      </h3>
                      <p className="panel-subtitle">
                        Matching the closest responder, evaluating severity, and preparing destination guidance.
                      </p>
                    </div>
                  </div>
                )}

                {step === "success" && result && (
                  <div style={{ marginTop: 18 }}>
                    <div
                      className="glass-panel"
                      style={{
                        padding: 18,
                        borderRadius: 22,
                        background:
                          "linear-gradient(145deg, rgba(50,211,154,0.14), rgba(17,31,53,0.78))",
                        borderColor: "rgba(50,211,154,0.2)",
                      }}
                    >
                      <div className="eyebrow" style={{ color: "#8dffc9" }}>
                        Dispatch confirmed
                      </div>
                      <h3 className="panel-title" style={{ marginTop: 10, fontSize: 28 }}>
                        Help is on the way
                      </h3>
                      <p className="panel-subtitle">
                        Stay calm, keep the patient safe, and keep this screen open for first-aid guidance.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                        marginTop: 16,
                      }}
                    >
                      {resultCards.map((item) => (
                        <div key={item.label} className="glass-panel" style={{ padding: 16, borderRadius: 20 }}>
                          <div className="eyebrow">{item.label}</div>
                          <div style={{ marginTop: 10, fontWeight: 800, color: item.color, lineHeight: 1.45 }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="glass-panel"
                      style={{
                        marginTop: 16,
                        padding: 16,
                        borderRadius: 20,
                        background: "rgba(255,109,123,0.12)",
                        borderColor: "rgba(255,109,123,0.18)",
                      }}
                    >
                      <div className="eyebrow" style={{ color: "#ffb7bf" }}>
                        Critical reminder
                      </div>
                      <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                        Call 112 in parallel if the patient is unresponsive, not breathing, or in immediate danger.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                      <button
                        type="button"
                        onClick={() => setShowChatbot(true)}
                        style={{
                          flex: "1 1 260px",
                          padding: "15px 18px",
                          borderRadius: 18,
                          cursor: "pointer",
                          fontWeight: 800,
                          color: "#eafff6",
                          border: "1px solid rgba(50,211,154,0.2)",
                          background:
                            "linear-gradient(145deg, rgba(50,211,154,0.22), rgba(15,86,61,0.8))",
                        }}
                      >
                        Open first-aid assistant
                      </button>
                      <button className="secondary-btn" type="button" onClick={closeModal} style={{ flex: "1 1 180px" }}>
                        Close panel
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {showChatbot && <FirstAidChatbot emergency={description} onClose={() => setShowChatbot(false)} />}
    </>
  );
}
