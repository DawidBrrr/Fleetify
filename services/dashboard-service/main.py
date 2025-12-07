from fastapi import FastAPI, HTTPException, Header, Body
from pydantic import BaseModel
import asyncio
import httpx
import os
import threading
from app.messaging import consume_messages

app = FastAPI(title="Dashboard Service")

ANALYTICS_SERVICE_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://analytics-service:8000")
VEHICLE_SERVICE_URL = os.getenv("VEHICLE_SERVICE_URL", "http://vehicle-service:8000")
USER_MANAGEMENT_URL = os.getenv("USER_MANAGEMENT_URL", "http://user-management:8000")

class VehicleCreate(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    license_plate: str

class UserInvite(BaseModel):
    email: str
    full_name: str

@app.on_event("startup")
async def startup_event():
    # Start RabbitMQ consumer in background thread
    thread = threading.Thread(target=consume_messages, daemon=True)
    thread.start()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "dashboard-service"}

async def fetch_data(url: str, endpoint: str, authorization: str = None):
    headers = {}
    if authorization:
        headers["Authorization"] = authorization
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{url}{endpoint}", headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=503, detail=f"Service unavailable: {url}")
        except httpx.HTTPStatusError as exc:
            print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=exc.response.status_code, detail="Error fetching data")

async def post_data(url: str, endpoint: str, data: dict, authorization: str = None):
    headers = {}
    if authorization:
        headers["Authorization"] = authorization
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{url}{endpoint}", json=data, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=503, detail=f"Service unavailable: {url}")
        except httpx.HTTPStatusError as exc:
            print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=exc.response.status_code, detail="Error posting data")

@app.get("/dashboard/admin")
async def get_admin_dashboard(authorization: str = Header(None)):
    stats = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/stats", authorization)
    costs = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/costs", authorization)
    alerts = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/alerts", authorization)
    fleet_health = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/fleet-health", authorization)

    return {
        "stats": stats,
        "costBreakdown": costs,
        "alerts": alerts,
        "fleetHealth": fleet_health
    }

@app.get("/dashboard/employee")
async def get_employee_dashboard(authorization: str = Header(None)):
    assignment = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/assignment", authorization)
    trips = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/trips", authorization)
    reminders = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/reminders", authorization)

    return {
        "assignment": assignment,
        "trips": trips,
        "reminders": reminders
    }

@app.get("/dashboard/stats")
async def get_stats(authorization: str = Header(None)):
    stats = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/stats", authorization)
    
    result = {}
    for item in stats:
        key = item["label"].lower().replace(" ", "_")
        result[key] = item["value"]
    
    if "maintenance" in result:
        result["maintenance_alerts"] = result.pop("maintenance")
        
    return result

@app.get("/dashboard/vehicles")
async def get_vehicles(authorization: str = Header(None)):
    return await fetch_data(VEHICLE_SERVICE_URL, "/vehicles/", authorization)

@app.post("/dashboard/vehicles")
async def add_vehicle(vehicle: VehicleCreate, authorization: str = Header(None)):
    return await post_data(VEHICLE_SERVICE_URL, "/vehicles/", vehicle.dict(), authorization)

@app.get("/dashboard/employees")
async def get_employees(authorization: str = Header(None)):
    return await fetch_data(USER_MANAGEMENT_URL, "/api/users", authorization)

@app.post("/dashboard/employees")
async def invite_employee(invite: UserInvite, authorization: str = Header(None)):
    return await post_data(USER_MANAGEMENT_URL, "/api/users/invite", invite.dict(), authorization)
