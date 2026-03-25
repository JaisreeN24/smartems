import React, { useEffect, useRef, useState } from "react";

const renderText = (text) =>
  text.split("\n").map((line, index) => (
    <div key={`${line}-${index}`} style={{ marginBottom: line ? 8 : 0 }}>
      {line.startsWith("**") && line.endsWith("**") ? <strong>{line.replace(/\*\*/g, "")}</strong> : line}
    </div>
  ));

export default function FirstAidChatbot({ emergency, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const loadGuide = async () => {
      setGuideLoading(true);
      setMessages([
        {
          role: "assistant",
          text: "Preparing first-aid guidance for the reported emergency...",
          loading: true,
        },
      ]);

      try {
        const res = await fetch("http://localhost:8080/firstaid/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emergency }),
        });
        const data = await res.json();

        if (!cancelled) {
          setMessages([
            {
              role: "assistant",
              text: `**Immediate first-aid guidance**\n\n${data.guide}`,
              loading: false,
            },
            {
              role: "assistant",
              text: "Ask anything you need while responders are on the way.",
              loading: false,
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          setMessages([
            {
              role: "assistant",
              text: "Stay calm, keep the patient safe, and call 112 if you have not already.",
              loading: false,
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setGuideLoading(false);
        }
      }
    };

    loadGuide();

    return () => {
      cancelled = true;
    };
  }, [emergency]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/firstaid/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency: `Context: ${emergency}. User question: ${userMessage}`,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.guide }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Keep helping the patient and continue monitoring breathing, bleeding, and responsiveness.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        padding: 20,
        background:
          "radial-gradient(circle at top right, rgba(50,211,154,0.16), transparent 26%), rgba(2,7,17,0.86)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="glass-panel strong"
        style={{
          width: "min(920px, 100%)",
          minHeight: "min(84vh, 760px)",
          maxHeight: "min(90vh, 820px)",
          overflow: "hidden",
          padding: 0,
          borderRadius: 32,
          borderColor: "rgba(50,211,154,0.2)",
        }}
      >
        <div className="chatbot-layout" style={{ minHeight: "inherit" }}>
        <aside
          style={{
            padding: 26,
            borderRight: "1px solid rgba(167,199,255,0.1)",
            background:
              "radial-gradient(circle at top left, rgba(50,211,154,0.16), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent)",
          }}
        >
          <span className="eyebrow" style={{ color: "#8dffc9" }}>
            Aid channel
          </span>
          <h2 className="panel-title" style={{ marginTop: 12, fontSize: 32 }}>
            Field medic assistant
          </h2>
          <p className="panel-subtitle">
            A calm instruction layer for bystanders while responders are closing in.
          </p>

          <div className="glass-panel" style={{ marginTop: 22, padding: 18, borderRadius: 24 }}>
            <div className="eyebrow">Live emergency context</div>
            <div style={{ marginTop: 10, lineHeight: 1.7, fontWeight: 700 }}>{emergency}</div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {[
              "Keep airway clear and observe breathing.",
              "Control severe bleeding with direct pressure.",
              "Use CPR only if the patient is unresponsive and not breathing.",
            ].map((tip, index) => (
              <div key={tip} className="glass-panel" style={{ padding: 14, borderRadius: 18 }}>
                <div className="eyebrow">Priority 0{index + 1}</div>
                <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.6 }}>{tip}</div>
              </div>
            ))}
          </div>
        </aside>

        <section style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              padding: "22px 24px 18px",
              borderBottom: "1px solid rgba(167,199,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div>
              <span className="eyebrow">Conversation</span>
              <h3 className="panel-title" style={{ marginTop: 10, fontSize: 26 }}>
                Live first-aid support
              </h3>
              <p className="panel-subtitle">Ask short, practical questions and get immediate guidance.</p>
            </div>
            <button className="ghost-danger-btn" onClick={onClose}>
              Close
            </button>
          </div>

          <div
            className="soft-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                {message.role === "assistant" && (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 14,
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      color: "#dffff1",
                      background:
                        "linear-gradient(145deg, rgba(50,211,154,0.32), rgba(10,71,50,0.82))",
                      border: "1px solid rgba(50,211,154,0.22)",
                      flexShrink: 0,
                    }}
                  >
                    AI
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "82%",
                    padding: "14px 16px",
                    borderRadius: 22,
                    color: "var(--text)",
                    lineHeight: 1.7,
                    background:
                      message.role === "user"
                        ? "linear-gradient(145deg, rgba(77,162,255,0.9), rgba(34,87,192,0.86))"
                        : "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(17,31,53,0.9))",
                    border:
                      message.role === "user"
                        ? "1px solid rgba(141,198,255,0.24)"
                        : "1px solid rgba(167,199,255,0.12)",
                    boxShadow:
                      message.role === "user"
                        ? "0 18px 30px rgba(31,77,172,0.24)"
                        : "0 16px 28px rgba(0,0,0,0.18)",
                  }}
                >
                  {message.loading ? "Preparing guidance..." : renderText(message.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "#dffff1",
                    background:
                      "linear-gradient(145deg, rgba(50,211,154,0.32), rgba(10,71,50,0.82))",
                    border: "1px solid rgba(50,211,154,0.22)",
                  }}
                >
                  AI
                </div>
                <div className="glass-panel" style={{ padding: "14px 16px", borderRadius: 22 }}>
                  Thinking through the safest next step...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div
            style={{
              padding: 20,
              borderTop: "1px solid rgba(167,199,255,0.1)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a first-aid question, for example: How do I position the patient?"
              disabled={guideLoading}
              className="field-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || guideLoading || !input.trim()}
              style={{
                padding: "14px 18px",
                borderRadius: 18,
                border: "1px solid rgba(50,211,154,0.2)",
                background:
                  loading || guideLoading || !input.trim()
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(145deg, rgba(50,211,154,0.24), rgba(11,102,72,0.86))",
                color: loading || guideLoading || !input.trim() ? "var(--muted)" : "#eafff6",
                fontWeight: 800,
                cursor: loading || guideLoading || !input.trim() ? "not-allowed" : "pointer",
                minWidth: 110,
              }}
            >
              Send
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
