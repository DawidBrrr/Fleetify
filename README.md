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

3.  **Build and Run with Docker Compose**
    This command will build all microservices, set up the databases, and start the Nginx gateway.
    ```bash
    docker-compose up --build
    ```

4.  **Access the Application**
    *   **Frontend:** [http://localhost:5173](http://localhost:5173) 
    *   **API Gateway:** [http://localhost:8080](http://localhost:8080)

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
