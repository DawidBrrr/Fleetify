# Fleetify

**Fleetify** is a modern, intelligent fleet management platform designed to streamline operations, reduce costs, and provide real-time insights into vehicle and driver performance. Built on a robust microservices architecture, it combines predictive analytics with day-to-day operational tools.

---

##  Key Features

*   ** Interactive Dashboard:** Role-based panels for Administrators (fleet overview, health stats) and Employees (assigned vehicles, tasks).
*   ** Vehicle Management:** Complete inventory tracking including VIN, fuel type (Gas, Diesel, EV, Hybrid), mileage, and service status.
*   ** Predictive Analytics:** AI-powered cost forecasting, fuel consumption trends, and efficiency analysis.
*   ** Cost Control:** Detailed logging for fuel, trips, and tolls with automated cost breakdown charts.
*   ** Smart Notifications:** Real-time alerts for service requirements, task assignments, and critical vehicle issues via RabbitMQ.
*   ** Team Management:** Employee onboarding, role assignment, and presence tracking.
*   ** PDF Reports:** Professional fleet reports with async generation via RabbitMQ queue processing.

---

##  Architecture

Fleetify follows a **Microservices Architecture** containerized with Docker.

| Service | Tech Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind, Bootstrap | The SPA user interface. Uses Recharts for analytics and Leaflet for mapping. |
| **Mobile** | Expo SDK 57, React Native | Mobile driver application for trips, fueling, issue reports, and vehicle assignments. |
| **Dashboard Service** | Python (FastAPI) | BFF (Backend for Frontend) aggregator that orchestrates data between services. |
| **Vehicle Service** | Python (FastAPI), PostgreSQL | Manages vehicle inventory, status, and technical specifications. |
| **Analytics Service** | Python (FastAPI), PostgreSQL | Handles data crunching, cost predictions, and chart generation. |
| **User Management** | Python (Django), PostgreSQL | Handles Authentication (JWT), user profiles, and team structures. |
| **Notifications** | Python (FastAPI), RabbitMQ | Async service for processing alerts and delivering messages. |
| **Report Service** | Java (Spring Boot), RabbitMQ, iText | Async PDF report generation with queue-based processing and professional formatting. |
| **Gateway** | Nginx | Reverse proxy routing traffic to appropriate services. |

---

##  Getting Started

### Prerequisites

*   **Docker** and **Docker Compose** installed on your machine.
*   **Node.js** (v18+) for local frontend development (optional).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/fleetify.git
    cd fleetify
    ```

2.  **Environment Configuration**
    Ensure `.env` files are present in the service directories where required.
    *   *Note: The frontend expects a `.env` file in `frontend/`.*

    **Mobile app:** create a local, untracked `mobile/.env` file with:
    ```env
    EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8080/api
    ```
    Do not commit this file. Production builds must use an HTTPS API URL.

    For local mobile access, add the same host address to the user-management
    service environment:
    ```env
    # services/user-managment/.env
    GATEWAY_IP_ADDRESS=<your-computer-ip>
    ```
    The value must match the host used in `EXPO_PUBLIC_API_URL`. For the
    Android emulator, use `10.0.2.2` in both places. Keep this setting in the
    local, untracked `.env` file.

    **RabbitMQ:** Docker Compose requires credentials from the root `.env` file
    or the shell environment. Copy `rabbitmq.env.example` to `.env` and replace
    the example password before starting the stack:
    ```env
    RABBITMQ_DEFAULT_USER=fleetify
    RABBITMQ_DEFAULT_PASS=<unique-local-password>
    ```
    Use unique credentials in shared or production environments. Do not commit
    the root `.env` file.

    For EAS builds, configure `EXPO_PUBLIC_API_URL` in each EAS environment
    (`development`, `preview`, and `production`) instead of adding it to
    `mobile/eas.json`:
    ```bash
    cd mobile
    eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://<your-api-host>/api --visibility plaintext
    ```
    Repeat the command for the other environments with their corresponding
    API URLs.

    Do not commit `.env` files, access tokens, passwords, or API keys. The
    local `mobile/.env` file is ignored by Git.

3.  **Build and Run with Docker Compose**
    This command will build all microservices, set up the databases, and start the Nginx gateway.
    ```bash
    docker-compose up --build
    ```

4.  **Access the Application**
    *   **Frontend:** [http://localhost:5173](http://localhost:5173) 
    *   **API Gateway:** [http://localhost:8080](http://localhost:8080)

### Mobile development

Install dependencies and start Expo from the `mobile` directory:

```bash
cd mobile
npm install
npx expo start --clear --lan
```

For a physical phone, connect the phone and computer to the same network and
set the computer's local IP address in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8080/api
```

Do not use `localhost` on a physical phone. For the Android emulator, use
`http://10.0.2.2:8080/api`. Production builds must use an HTTPS API URL.

### EAS builds

After configuring `EXPO_PUBLIC_API_URL` in the EAS environment, build with the
profile that matches the target:

```bash
cd mobile
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

The `preview` profile produces an installable APK. The `production` profile is
intended for release builds.

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

##  Project Structure

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
