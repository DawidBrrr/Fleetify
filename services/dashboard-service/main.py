from fastapi import FastAPI, HTTPException, Header
import asyncio
import httpx
import os
import threading
from app.messaging import consume_messages

app = FastAPI(title="Dashboard Service")

ANALYTICS_SERVICE_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://analytics-service:8000")

@app.on_event("startup")
async def startup_event():
    # Start RabbitMQ consumer in background thread
    thread = threading.Thread(target=consume_messages, daemon=True)
    thread.start()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "dashboard-service"}

async def fetch_data(endpoint: str, authorization: str = None):
    headers = {}
    if authorization:
        headers["Authorization"] = authorization
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ANALYTICS_SERVICE_URL}{endpoint}", headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=503, detail="Analytics service unavailable")
        except httpx.HTTPStatusError as exc:
            print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=exc.response.status_code, detail="Error fetching data")

@app.get("/dashboard/admin")
async def get_admin_dashboard(authorization: str = Header(None)):
    stats = await fetch_data("/analytics/admin/stats", authorization)
    costs = await fetch_data("/analytics/admin/costs", authorization)
    alerts = await fetch_data("/analytics/admin/alerts", authorization)
    fleet_health = await fetch_data("/analytics/admin/fleet-health", authorization)

    return {
        "stats": stats,
        "costBreakdown": costs,
        "alerts": alerts,
        "fleetHealth": fleet_health
    }

@app.get("/dashboard/employee")
async def get_employee_dashboard(authorization: str = Header(None)):
    assignment = await fetch_data("/analytics/employee/assignment", authorization)
    trips = await fetch_data("/analytics/employee/trips", authorization)
    reminders = await fetch_data("/analytics/employee/reminders", authorization)

    return {
        "assignment": assignment,
        "trips": trips,
        "reminders": reminders
    }

@app.get("/dashboard/stats")
async def get_stats(authorization: str = Header(None)):
    # For now, we can just reuse the admin stats or fetch a specific endpoint if we made one
    # But let's just return a simplified version derived from admin stats for consistency
    stats = await fetch_data("/analytics/admin/stats", authorization)
    # Transform the list back to the simple dict expected by this endpoint
    # Original format: {"total_vehicles": 42, "active_rentals": 12, "maintenance_alerts": 3}
    # New format from analytics: [{"label": "Total Vehicles", "value": 42...}, ...]
    
    result = {}
    for item in stats:
        key = item["label"].lower().replace(" ", "_")
        result[key] = item["value"]
        
    # Ensure keys match what might be expected if they differ, but "total_vehicles" matches.
    # "Active Rentals" -> "active_rentals"
    # "Maintenance" -> "maintenance" (original was maintenance_alerts)
    
    if "maintenance" in result:
        result["maintenance_alerts"] = result.pop("maintenance")
        
    return result
