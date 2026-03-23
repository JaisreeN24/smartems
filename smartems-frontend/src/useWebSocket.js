import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function useWebSocket(onNewEmergency) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        console.log("✅ WebSocket connected");

        client.subscribe("/topic/emergencies", (message) => {
          const emergency = JSON.parse(message.body);
          console.log("🚨 New emergency received:", emergency);
          onNewEmergency(emergency);
        });
      },
      onDisconnect: () => {
        setConnected(false);
        console.log("❌ WebSocket disconnected");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  return { connected };
}