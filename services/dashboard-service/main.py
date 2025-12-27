from fastapi import FastAPI, HTTPException, Header, Body, status
from pydantic import BaseModel
import asyncio
import httpx
import threading
from typing import Optional, Dict, Any

from app.messaging import consume_messages

from config import (
    ANALYTICS_SERVICE_URL,
    VEHICLE_SERVICE_URL,
    USER_MANAGEMENT_URL,
    NOTIFICATIONS_SERVICE_URL,
    NOTIFICATIONS_SERVICE_TOKEN,
)

app = FastAPI(title="Dashboard Service")


def build_query(params: Dict[str, Optional[Any]]) -> str:
    query = [f"{key}={value}" for key, value in params.items() if value is not None]
    return f"?{'&'.join(query)}" if query else ""


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


class NotificationResponse(BaseModel):
    action: str

@app.on_event("startup")
async def startup_event():
    # Start RabbitMQ consumer in background thread
    thread = threading.Thread(target=consume_messages, daemon=True)
    thread.start()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "dashboard-service"}

async def _request_service(
    method: str,
    url: str,
    endpoint: str,
    authorization: Optional[str] = None,
    data: Optional[dict] = None,
    error_context: str = "requesting",
):
    headers = {}
    if authorization:
        headers["Authorization"] = authorization

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.request(method, f"{url}{endpoint}", json=data, headers=headers)
            response.raise_for_status()
            if response.status_code == status.HTTP_204_NO_CONTENT or not response.content:
                return None
            return response.json()
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=503, detail=f"Service unavailable: {url}")
        except httpx.HTTPStatusError as exc:
            print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=exc.response.status_code, detail=f"Error {error_context} data")


async def fetch_data(url: str, endpoint: str, authorization: str = None):
    return await _request_service("GET", url, endpoint, authorization, None, "fetching")


async def post_data(url: str, endpoint: str, data: dict, authorization: str = None):
    return await _request_service("POST", url, endpoint, authorization, data, "posting")


async def put_data(url: str, endpoint: str, data: dict, authorization: str = None):
    return await _request_service("PUT", url, endpoint, authorization, data, "updating")


async def patch_data(url: str, endpoint: str, data: dict, authorization: str = None):
    return await _request_service("PATCH", url, endpoint, authorization, data, "updating")


async def delete_data(url: str, endpoint: str, authorization: str = None):
    return await _request_service("DELETE", url, endpoint, authorization, None, "deleting")


async def send_service_notification(payload: dict):
    if not NOTIFICATIONS_SERVICE_TOKEN:
        return
    headers = {
        "X-Service-Token": NOTIFICATIONS_SERVICE_TOKEN,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            await client.post(f"{NOTIFICATIONS_SERVICE_URL}/notifications", json=payload, headers=headers)
        except httpx.RequestError as exc:
            print(f"Notification service error: {exc}")

@app.get("/dashboard/admin")
async def get_admin_dashboard(authorization: str = Header(None)):
    stats = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/stats", authorization)
    costs = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/costs", authorization)
    alerts = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/admin/alerts", authorization)
    recent_trips = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/trips?limit=5", authorization)
    recent_fuel_logs = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/fuel-logs?limit=5", authorization)
    
    # Fetch real vehicles from Vehicle Service instead of Analytics Service mock
    try:
        vehicles = await fetch_data(VEHICLE_SERVICE_URL, "/vehicles/", authorization)
        # Transform vehicle data to match fleet health format if needed
        fleet_health = []
        issue_summary = {"open": 0, "byVehicle": []}
        for v in vehicles:
            issues = v.get("issues") or []
            open_count = sum(1 for issue in issues if issue.get("status") != "resolved")
            fleet_health.append({
                "id": v["id"],
                "model": f"{v['make']} {v['model']}",
                "status": v["status"],
                "location": "Unknown", # Location not yet tracked
                "battery": v.get("battery_level", 0) if v.get("fuel_type") in ["electric", "hybrid"] else v.get("fuel_level", 0),
                "fuel_level": v.get("fuel_level", 0),
                "fuel_type": v.get("fuel_type", "gasoline"),
                "last_service_date": v.get("last_service_date"),
                "open_issues": open_count,
            })
            if open_count:
                issue_summary["open"] += open_count
                issue_summary["byVehicle"].append(
                    {
                        "vehicle_id": v["id"],
                        "vehicle_label": f"{v['make']} {v['model']}",
                        "open_issues": open_count,
                        "last_service_date": v.get("last_service_date"),
                    }
                )
    except Exception as e:
        print(f"Failed to fetch vehicles for fleet health: {e}")
        fleet_health = []
        issue_summary = {"open": 0, "byVehicle": []}

    return {
        "stats": stats,
        "costBreakdown": costs,
        "alerts": alerts,
        "fleetHealth": fleet_health,
        "recentTrips": recent_trips,
        "recentFuelLogs": recent_fuel_logs,
        "issueSummary": issue_summary,
    }

@app.get("/dashboard/employee")
async def get_employee_dashboard(authorization: str = Header(None)):
    assignment = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/assignment", authorization)
    trips = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/trips", authorization)
    fuel_logs = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/fuel-logs", authorization)
    reminders = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/reminders", authorization)

    return {
        "assignment": assignment,
        "tripLogs": trips,
        "fuelLogs": fuel_logs,
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


@app.get("/dashboard/vehicles/me")
async def get_my_vehicles(authorization: str = Header(None)):
    assignment = await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/employee/assignment", authorization)
    if not assignment or not assignment.get("vehicle"):
        return []
    vehicle_id = assignment["vehicle"].get("id")
    if vehicle_id:
        try:
            vehicle = await fetch_data(VEHICLE_SERVICE_URL, f"/vehicles/{vehicle_id}", authorization)
            return [vehicle]
        except HTTPException:
            pass

    vehicle_fallback = assignment["vehicle"]
    return [
        {
            "id": vehicle_fallback.get("id"),
            "make": (vehicle_fallback.get("model") or "Pojazd").split(" ")[0],
            "model": vehicle_fallback.get("model"),
            "vin": vehicle_fallback.get("vin"),
            "status": "assigned",
            "fuel_type": "gasoline",
            "fuel_level": vehicle_fallback.get("battery") or 0,
            "battery_level": vehicle_fallback.get("battery"),
            "odometer": vehicle_fallback.get("mileage"),
            "issues": [],
            "last_service_date": None,
        }
    ]

@app.post("/dashboard/vehicles")
async def add_vehicle(vehicle: VehicleCreate, authorization: str = Header(None)):
    return await post_data(VEHICLE_SERVICE_URL, "/vehicles/", vehicle.dict(), authorization)

@app.get("/dashboard/employees")
async def get_employees(authorization: str = Header(None)):
    return await fetch_data(USER_MANAGEMENT_URL, "/api/users", authorization)


@app.get("/dashboard/team")
async def get_team(authorization: str = Header(None)):
    return await fetch_data(USER_MANAGEMENT_URL, "/api/users/team", authorization)


@app.get("/dashboard/notifications")
async def list_notifications(authorization: str = Header(None)):
    return await fetch_data(NOTIFICATIONS_SERVICE_URL, "/notifications", authorization)


@app.post("/dashboard/notifications/{notification_id}/ack")
async def acknowledge_notification(notification_id: str, authorization: str = Header(None)):
    return await post_data(
        NOTIFICATIONS_SERVICE_URL,
        f"/notifications/{notification_id}/ack",
        {},
        authorization,
    )


@app.post("/dashboard/notifications/{notification_id}/respond")
async def respond_notification(notification_id: str, payload: NotificationResponse, authorization: str = Header(None)):
    return await post_data(
        NOTIFICATIONS_SERVICE_URL,
        f"/notifications/{notification_id}/respond",
        payload.dict(),
        authorization,
    )

@app.post("/dashboard/employees")
async def invite_employee(invite: UserInvite, authorization: str = Header(None)):
    return await post_data(USER_MANAGEMENT_URL, "/api/users/invite", invite.dict(), authorization)


@app.delete("/dashboard/employees/{user_id}")
async def remove_employee(user_id: str, authorization: str = Header(None)):
    await delete_data(USER_MANAGEMENT_URL, f"/api/users/{user_id}", authorization)
    return {"status": "removed"}

@app.post("/dashboard/assignments")
async def create_assignment(assignment: AssignmentCreate, authorization: str = Header(None)):
    result = await post_data(ANALYTICS_SERVICE_URL, "/analytics/admin/assignments", assignment.dict(), authorization)
    try:
        current_user = await fetch_data(USER_MANAGEMENT_URL, "/api/users/me", authorization)
        await send_service_notification(
            {
                "recipient_id": assignment.user_id,
                "sender_id": current_user.get("id"),
                "type": "task_assignment",
                "title": "Przydzielono nowe zadania",
                "body": f"{current_user.get('full_name')} przydzielił Ci zadania dla pojazdu {assignment.vehicle_model}.",
                "metadata": {
                    "vehicle_id": assignment.vehicle_id,
                    "vehicle_model": assignment.vehicle_model,
                    "tasks": assignment.tasks,
                },
                "action_required": False,
                "status": "unread",
            }
        )
    except Exception as exc:
        print(f"Failed to push task notification: {exc}")
    return result


@app.post("/dashboard/assignments/vehicle")
async def assign_vehicle(assignment: dict = Body(...), authorization: str = Header(None)):
    result = await post_data(
        ANALYTICS_SERVICE_URL,
        "/analytics/admin/assignments/vehicle",
        assignment,
        authorization,
    )
    vehicle_id = assignment.get("vehicle_id")
    if vehicle_id:
        update_payload = {
            "status": "assigned",
            "current_driver_id": assignment.get("user_id"),
        }
        try:
            await put_data(
                VEHICLE_SERVICE_URL,
                f"/vehicles/{vehicle_id}",
                update_payload,
                authorization,
            )
        except HTTPException as exc:
            print(f"Failed to update vehicle status during assignment: {exc.detail}")
    return result


@app.post("/dashboard/assignments/tasks")
async def assign_tasks(payload: dict = Body(...), authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/admin/assignments/tasks", payload, authorization)

@app.post("/dashboard/employee/tasks/update")
async def update_task_status(update: TaskUpdate, authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/employee/tasks/update", update.dict(), authorization)

@app.post("/dashboard/employee/vehicle/return")
async def return_vehicle(authorization: str = Header(None)):
    result = await post_data(
        ANALYTICS_SERVICE_URL,
        "/analytics/employee/vehicle/return",
        {},
        authorization,
    )
    vehicle_id = result.get("vehicle_id") if isinstance(result, dict) else None
    if vehicle_id:
        try:
            await put_data(
                VEHICLE_SERVICE_URL,
                f"/vehicles/{vehicle_id}",
                {"status": "available", "current_driver_id": None},
                authorization,
            )
        except HTTPException as exc:
            print(f"Failed to reset vehicle status on return: {exc.detail}")
    return result

@app.post("/dashboard/employee/vehicle/update")
async def update_vehicle_status(update: VehicleUpdate, authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/employee/vehicle/update", update.dict(), authorization)


@app.get("/dashboard/trips")
async def list_trips(
    user_id: Optional[str] = None,
    limit: Optional[int] = None,
    authorization: str = Header(None),
):
    query = build_query({"user_id": user_id, "limit": limit})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/trips{query}", authorization)


@app.post("/dashboard/trips")
async def create_trip_log(payload: Dict[str, Any] = Body(...), authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/trips", payload, authorization)


@app.put("/dashboard/trips/{trip_id}")
async def update_trip_log_endpoint(
    trip_id: int,
    payload: Dict[str, Any] = Body(...),
    authorization: str = Header(None),
):
    return await put_data(ANALYTICS_SERVICE_URL, f"/analytics/trips/{trip_id}", payload, authorization)


@app.delete("/dashboard/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip_log_endpoint(trip_id: int, authorization: str = Header(None)):
    await delete_data(ANALYTICS_SERVICE_URL, f"/analytics/trips/{trip_id}", authorization)


@app.get("/dashboard/fuel-logs")
async def list_fuel_logs(
    user_id: Optional[str] = None,
    limit: Optional[int] = None,
    authorization: str = Header(None),
):
    query = build_query({"user_id": user_id, "limit": limit})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/fuel-logs{query}", authorization)


@app.post("/dashboard/fuel-logs")
async def create_fuel_log(payload: Dict[str, Any] = Body(...), authorization: str = Header(None)):
    return await post_data(ANALYTICS_SERVICE_URL, "/analytics/fuel-logs", payload, authorization)


@app.put("/dashboard/fuel-logs/{log_id}")
async def update_fuel_log_endpoint(
    log_id: int,
    payload: Dict[str, Any] = Body(...),
    authorization: str = Header(None),
):
    return await put_data(ANALYTICS_SERVICE_URL, f"/analytics/fuel-logs/{log_id}", payload, authorization)


@app.delete("/dashboard/fuel-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fuel_log_endpoint(log_id: int, authorization: str = Header(None)):
    await delete_data(ANALYTICS_SERVICE_URL, f"/analytics/fuel-logs/{log_id}", authorization)


@app.get("/dashboard/vehicles/{vehicle_id}/issues")
async def list_vehicle_issues_endpoint(vehicle_id: int, authorization: str = Header(None)):
    return await fetch_data(VEHICLE_SERVICE_URL, f"/vehicles/{vehicle_id}/issues", authorization)


@app.post("/dashboard/vehicles/{vehicle_id}/issues")
async def create_vehicle_issue_endpoint(
    vehicle_id: int,
    payload: Dict[str, Any] = Body(...),
    authorization: str = Header(None),
):
    return await post_data(VEHICLE_SERVICE_URL, f"/vehicles/{vehicle_id}/issues", payload, authorization)


@app.patch("/dashboard/vehicles/{vehicle_id}/issues/{issue_id}")
async def update_vehicle_issue_endpoint(
    vehicle_id: int,
    issue_id: int,
    payload: Dict[str, Any] = Body(...),
    authorization: str = Header(None),
):
    return await patch_data(
        VEHICLE_SERVICE_URL,
        f"/vehicles/{vehicle_id}/issues/{issue_id}",
        payload,
        authorization,
    )


# ==================== ANALYTICS CHARTS PROXY ====================

@app.get("/dashboard/charts/fuel-consumption")
async def proxy_fuel_consumption_chart(
    days: int = 30,
    vehicle_id: Optional[str] = None,
    group_by: str = "day",
    authorization: str = Header(None),
):
    """Proxy do wykresu zużycia paliwa - dane z cache"""
    query = build_query({"days": days, "vehicle_id": vehicle_id, "group_by": group_by})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/fuel-consumption{query}", authorization)


@app.get("/dashboard/charts/cost-breakdown")
async def proxy_cost_breakdown_chart(
    days: int = 30,
    authorization: str = Header(None),
):
    """Proxy do wykresu podziału kosztów - dane z cache"""
    query = build_query({"days": days})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/cost-breakdown{query}", authorization)


@app.get("/dashboard/charts/vehicle-mileage")
async def proxy_vehicle_mileage_chart(
    days: int = 30,
    limit: int = 10,
    authorization: str = Header(None),
):
    """Proxy do wykresu przebiegu pojazdów - dane z cache"""
    query = build_query({"days": days, "limit": limit})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/vehicle-mileage{query}", authorization)


@app.get("/dashboard/charts/fuel-efficiency")
async def proxy_fuel_efficiency_chart(
    days: int = 30,
    vehicle_id: Optional[str] = None,
    authorization: str = Header(None),
):
    """Proxy do wykresu efektywności paliwowej - dane z cache"""
    query = build_query({"days": days, "vehicle_id": vehicle_id})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/fuel-efficiency{query}", authorization)


@app.get("/dashboard/charts/cost-trend")
async def proxy_cost_trend_chart(
    months: int = 6,
    vehicle_id: Optional[str] = None,
    authorization: str = Header(None),
):
    """Proxy do wykresu trendu kosztów - dane z cache"""
    query = build_query({"months": months, "vehicle_id": vehicle_id})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/cost-trend{query}", authorization)


@app.get("/dashboard/charts/fleet-summary")
async def proxy_fleet_summary(authorization: str = Header(None)):
    """Proxy do podsumowania floty - dane z cache"""
    return await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/charts/fleet-summary", authorization)


@app.get("/dashboard/charts/cost-prediction")
async def proxy_cost_prediction(
    history_days: int = 90,
    predict_days: int = 30,
    vehicle_id: Optional[str] = None,
    authorization: str = Header(None),
):
    """Proxy do predykcji kosztów"""
    query = build_query({"history_days": history_days, "predict_days": predict_days, "vehicle_id": vehicle_id})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/cost-prediction{query}", authorization)


@app.get("/dashboard/charts/monthly-prediction")
async def proxy_monthly_prediction(
    history_months: int = 6,
    predict_months: int = 3,
    authorization: str = Header(None),
):
    """Proxy do miesięcznej predykcji kosztów"""
    query = build_query({"history_months": history_months, "predict_months": predict_months})
    return await fetch_data(ANALYTICS_SERVICE_URL, f"/analytics/charts/monthly-prediction{query}", authorization)


@app.get("/dashboard/vehicles-list")
async def proxy_vehicles_list(authorization: str = Header(None)):
    """Proxy do listy pojazdów dla filtrów"""
    return await fetch_data(ANALYTICS_SERVICE_URL, "/analytics/vehicles-list", authorization)
