from fastapi import FastAPI, HTTPException, Header, Body
from pydantic import BaseModel
import asyncio
import httpx
import threading
from app.messaging import consume_messages

from config import (
    ANALYTICS_SERVICE_URL,
    VEHICLE_SERVICE_URL,
    USER_MANAGEMENT_URL,
)

app = FastAPI(title="Dashboard Service")


from typing import Optional

class VehicleCreate(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    license_plate: str
    fuel_type: Optional[str] = "gasoline"
    fuel_level: Optional[int] = 100
    battery_level: Optional[int] = None
    odometer: Optional[int] = 0
    fuel_capacity: Optional[float] = None

class UserInvite(BaseModel):
    email: str
    full_name: str

class AssignmentCreate(BaseModel):
    user_id: str
    vehicle_id: str
    vehicle_model: str
    vehicle_vin: str
    vehicle_mileage: str
    vehicle_battery: int
    vehicle_tire_pressure: str
    tasks: list[dict]

class TaskUpdate(BaseModel):
    task_id: int
    status: str

class VehicleUpdate(BaseModel):
    mileage: str
    battery: int

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
    
    # Fetch real vehicles from Vehicle Service instead of Analytics Service mock
    try:
        vehicles = await fetch_data(VEHICLE_SERVICE_URL, "/vehicles/", authorization)
        # Transform vehicle data to match fleet health format if needed
        fleet_health = []
        for v in vehicles:
            fleet_health.append({
                "id": v["id"],
                "model": f"{v['make']} {v['model']}",
                "status": v["status"],
                "location": "Unknown", # Location not yet tracked
                "battery": v.get("battery_level", 0) if v.get("fuel_type") in ["electric", "hybrid"] else v.get("fuel_level", 0),
                "fuel_type": v.get("fuel_type", "gasoline")
            })
    except Exception as e:
        print(f"Failed to fetch vehicles for fleet health: {e}")
        fleet_health = []

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

@app.post("/dashboard/assignments")
async def create_assignment(assignment: AssignmentCreate, authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/admin/assignments", assignment.dict(), authorization)

@app.post("/dashboard/employee/tasks/update")
async def update_task_status(update: TaskUpdate, authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/employee/tasks/update", update.dict(), authorization)

@app.post("/dashboard/employee/vehicle/return")
async def return_vehicle(authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/employee/vehicle/return", {}, authorization)

@app.post("/dashboard/employee/vehicle/update")
async def update_vehicle_status(update: VehicleUpdate, authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/employee/vehicle/update", update.dict(), authorization)
