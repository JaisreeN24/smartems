import React, { useState, useEffect, useRef } from "react";

export default function FirstAidChatbot({ emergency, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(true);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load first aid guide automatically
  useEffect(() => {
    loadFirstAidGuide();
  }, []);

  const loadFirstAidGuide = async () => {
    setGuideLoading(true);
    setMessages([{
      role: "assistant",
      text: "🚑 Getting first aid instructions for your emergency...",
      loading: true
    }]);

    try {
      const res = await fetch("http://localhost:8080/firstaid/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergency })
      });
      const data = await res.json();

      setMessages([
        {
          role: "assistant",
          text: `🚑 **First Aid Instructions**\n\n${data.guide}`,
          loading: false
        },
        {
          role: "assistant",
          text: "💬 Do you have any questions? I'm here to help while you wait for responders.",
          loading: false
        }
      ]);
    } catch (err) {
      setMessages([{
        role: "assistant",
        text: "⚠️ Stay calm! Call 112 immediately and keep the person still. Help is on the way!",
        loading: false
      }]);
    }
    setGuideLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/firstaid/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency: `Context: ${emergency}. User question: ${userMsg}`
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.guide }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Stay calm and keep helping. Call 112 if you haven't already!"
      }]);
    }
    setLoading(false);
  };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => (
      <div key={i} style={{ marginBottom: line ? "6px" : "0" }}>
        {line.startsWith("**") && line.endsWith("**")
          ? <strong>{line.replace(/\*\*/g, "")}</strong>
          : line}
      </div>
    ));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#0f172a", borderRadius: "20px",
        width: "100%", maxWidth: "500px",
        height: "600px", display: "flex", flexDirection: "column",
        border: "2px solid #22c55e",
        boxShadow: "0 0 40px rgba(34,197,94,0.2)"
      }}>

        {/* Header */}
        <div style={{
          background: "#1e293b", borderRadius: "18px 18px 0 0",
          padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #334155"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🏥</span>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>
                  AI First Aid Assistant
                </div>
                <div style={{ color: "#22c55e", fontSize: "11px", fontWeight: "600" }}>
                  ● Live — Help is on the way
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#ef444420", border: "1px solid #ef444440",
              color: "#ef4444", borderRadius: "8px", padding: "6px 12px",
              cursor: "pointer", fontSize: "12px", fontWeight: "600"
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Emergency Banner */}
        <div style={{
          background: "#ef444415", borderBottom: "1px solid #ef444430",
          padding: "10px 20px"
        }}>
          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>
            🚨 Emergency: {emergency}
          </span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: "12px"
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "#22c55e20", border: "1px solid #22c55e40",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", marginRight: "8px", flexShrink: 0, marginTop: "4px"
                }}>
                  🏥
                </div>
              )}
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: "12px",
                background: msg.role === "user" ? "#3b82f6" : "#1e293b",
                border: msg.role === "user" ? "none" : "1px solid #334155",
                color: "white", fontSize: "13px", lineHeight: "1.6"
              }}>
                {msg.loading ? (
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span>Getting instructions</span>
                    <span style={{ animation: "dots 1.5s infinite" }}>...</span>
                  </div>
                ) : (
                  formatText(msg.text)
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "#22c55e20", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "16px"
              }}>🏥</div>
              <div style={{
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: "12px", padding: "10px 14px", color: "#94a3b8",
                fontSize: "13px"
              }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "14px 16px", borderTop: "1px solid #334155",
          display: "flex", gap: "8px"
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question... (e.g. How do I do CPR?)"
            disabled={guideLoading}
            style={{
              flex: 1, background: "#1e293b", border: "1px solid #334155",
              borderRadius: "8px", padding: "10px 14px", color: "white",
              fontSize: "13px", outline: "none"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || guideLoading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "#334155" : "#22c55e",
              color: "white", border: "none", borderRadius: "8px",
              padding: "10px 16px", cursor: "pointer",
              fontSize: "13px", fontWeight: "700", transition: "all 0.2s"
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
      `}</style>
    </div>
  );
}