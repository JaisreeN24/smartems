# SmartEMS

SmartEMS is an AI-powered real-time emergency response and management platform that improves emergency reporting, severity assessment, responder coordination, and live monitoring. It combines emergency reporting, GPS location capture, AI triage, automatic responder assignment, hospital mapping, live dashboard updates, responder workflow tracking, and first-aid guidance in one system.

## Features
- JWT-based authentication and role-based access
- Public SOS and emergency reporting
- GPS-based location capture
- AI severity classification
- Automatic responder assignment
- Hospital association support
- Real-time dashboard and live map
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
Frontend
cd smartems-frontend
npm install
npm start
Environment Variables
DB_URL=jdbc:mysql://localhost:3306/smartems
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
OPENROUTER_API_KEY=your_openrouter_api_key
JWT_SECRET_BASE64=your_base64_secret
Team
Archives
Saveetha Engineering College, Chennai


Your current one is fine, but this version is a bit cleaner because:
- `Real-time` is written properly
- wording is smoother
- formatting is slightly more professional

If you want, I can also give you a **very attractive GitHub README** with:
- demo section
- screenshots
- architecture image
- feature highlights
- badges

