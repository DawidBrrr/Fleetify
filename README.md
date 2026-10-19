# Fleetify

**Fleetify** is a modern, intelligent fleet management platform designed to streamline operations, reduce costs, and provide real-time insights into vehicle and driver performance. Built on a robust microservices architecture, it combines predictive analytics with day-to-day operational tools.

---

## Key Features

- **Interactive Dashboard:** Role-based panels for administrators and employees.
- **Vehicle Management:** Inventory tracking including VIN, fuel type, mileage, and service status.
- **Predictive Analytics:** Cost forecasting, fuel consumption trends, and efficiency analysis.
- **Cost Control:** Logging for fuel, trips, and tolls with automated cost breakdowns.
- **Smart Notifications:** Alerts for service requirements, task assignments, and critical vehicle issues via RabbitMQ.
- **Team Management:** Employee onboarding, role assignment, and presence tracking.
- **PDF Reports:** Asynchronous report generation through RabbitMQ.

---

## Architecture

Fleetify follows a **Microservices Architecture** containerized with Docker.

| Service | Tech Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind, Bootstrap | The SPA user interface. Uses Recharts for analytics and Leaflet for mapping. |
| **Mobile** | Expo SDK 57, React Native | Mobile driver application for trips, fueling, issue reports, and vehicle assignments. |
| **Dashboard Service** | Python (FastAPI) | BFF (Backend for Frontend) aggregator that orchestrates data between services. |
| **Vehicle Service** | Python (FastAPI), PostgreSQL | Manages vehicle inventory, status, and technical specifications. |
| **Analytics Service** | Python (FastAPI), PostgreSQL | Handles data crunching, cost predictions, and chart generation. |
| **User Management** | Python (Django), PostgreSQL | Handles bearer-session authentication, user profiles, and team structures. |
| **Notifications** | Python (FastAPI), RabbitMQ | Async service for processing alerts and delivering messages. |
| **Report Service** | Java (Spring Boot), RabbitMQ, iText | Async PDF report generation with queue-based processing and professional formatting. |
| **Gateway** | Nginx | Reverse proxy routing traffic to appropriate services. |

---

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** installed on your machine.
- **Node.js 20+** for local frontend or mobile development.
- An existing Fleetify user account for signing in to the mobile app.

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/DawidBrrr/Fleetify.git
   cd Fleetify
   ```

2. **Configure environment files**

   Docker Compose expects these local, untracked files:

   - `.env` — RabbitMQ credentials used by Compose.
   - `frontend/.env` — frontend API configuration.
   - `services/nginx-gateway/.env`
   - `services/user-managment/.env`
   - `services/vehicle-service/.env`
   - `services/dashboard-service/.env`
   - `services/notifications-service/.env`
   - `services/report-service/.env`

   The exact service-specific values depend on the local deployment. Never
   commit passwords, access tokens, API keys, or other secrets.

   Create the root RabbitMQ environment file from the example:

   ```powershell
   Copy-Item rabbitmq.env.example .env
   ```

   Replace the example password in `.env` before starting the stack:

   ```env
   RABBITMQ_DEFAULT_USER=fleetify
   RABBITMQ_DEFAULT_PASS=<unique-local-password>
   ```

   For local frontend development, `frontend/.env` should contain:

   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

3. **Build and run with Docker Compose**

   This builds the microservices, starts the databases, and runs the Nginx
   gateway:

   ```bash
   docker compose up --build
   ```

4. **Access the application**

   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **API Gateway:** [http://localhost:8080](http://localhost:8080)

### Mobile development

The mobile app uses the API gateway. Start the backend first, then create
`mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8080/api
```

Choose the URL based on the device:

- Physical phone: use the computer's LAN IP, and connect both devices to the same network.
- Android Emulator: use `http://10.0.2.2:8080/api`.
- iOS Simulator: usually use `http://localhost:8080/api`.
- Production or shared preview builds: use an HTTPS URL.

For a physical phone or emulator, set the same host value in
`services/user-managment/.env`:

```env
GATEWAY_IP_ADDRESS=<your-computer-ip>
```

Restart Docker Compose after changing this value. On Windows, make sure the
firewall allows incoming connections to port `8080`. Do not use `localhost`
for a physical phone.

Install dependencies and start Expo:

```bash
cd mobile
npm install
npx expo start --clear --lan
```

The mobile app currently provides login but not registration. Use an existing
Fleetify account created through the web application or backend.

Do not commit `mobile/.env`. The `EXPO_PUBLIC_API_URL` value is bundled into
the application, so it must not contain secrets.

### EAS builds

Log in to EAS and configure `EXPO_PUBLIC_API_URL` separately for the
`development`, `preview`, and `production` environments:

```bash
eas login
cd mobile
eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://<your-api-host>/api --visibility plaintext
```

Repeat the command for the other environments with their corresponding HTTPS
URLs. The API URL is not a secret and can use `plaintext` visibility.

Build with the profile that matches the target:

```bash
cd mobile
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

The `development` profile produces a development build, `preview` produces an
installable APK, and `production` is intended for release builds.

### Validation

Run these checks after changing mobile dependencies or native configuration:

```bash
cd mobile
npx expo-doctor
npx expo export --platform android
```

Generated folders such as `node_modules`, `.expo`, and temporary export output
must not be committed.

---

## Project Structure

```text
.
├── databases/               # SQL initialization scripts for microservices
│   ├── analytics/
│   ├── notifications/
│   ├── user-management/
│   └── vehicle/
├── frontend/                # React application (Vite)
│   ├── src/
│   │   ├── components/      # UI Components (Dashboard, VehiclesPage, etc.)
│   │   ├── services/        # API integration logic
│   │   └── ...
├── mobile/                  # Expo React Native driver application
├── infrastructure/          # Infrastructure configuration
├── services/                # Backend Microservices
│   ├── analytics-service/   # Data processing & predictions
│   ├── dashboard-service/   # API Aggregator
│   ├── notifications-service/ # RabbitMQ consumer
│   ├── report-service/      # PDF report generation (Java/Spring Boot)
│   ├── user-managment/      # Django Auth system
│   └── vehicle-service/     # Vehicle CRUD
└── docker-compose.yaml      # Orchestration
```
