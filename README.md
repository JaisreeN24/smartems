# SmartEMS

SmartEMS is an AI-powered real-time emergency response and management platform built to improve emergency reporting, severity assessment, responder coordination, and live monitoring. It combines emergency reporting, GPS location capture, AI triage, automatic responder assignment, hospital mapping, live dashboard updates, responder workflow tracking, and first-aid guidance in a single system.

## Features
- JWT-based authentication and role-based access
- Public SOS and emergency reporting
- GPS-based location capture
- AI severity classification
- Automatic responder assignment
- Hospital association support
- Realtime dashboard and live map
- Responder workflow: `ASSIGNED -> ACCEPTED -> ARRIVED -> CLOSED`
- AI first-aid guidance
- Audit logging and secure secret handling

## Tech Stack
- **Frontend:** React, Leaflet, Recharts
- **Backend:** Java 21, Spring Boot, Spring Security, Spring WebSocket
- **Database:** MySQL, JPA/Hibernate
- **Security:** JWT
- **AI:** OpenRouter API

## Run Locally

### Backend
```bash
./mvnw spring-boot:run
