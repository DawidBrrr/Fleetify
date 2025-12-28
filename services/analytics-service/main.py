from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, cast, Date
from sqlalchemy.dialects.postgresql import insert
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import models
from database import engine, get_db, SessionLocal
from deps import get_current_user
from config import RABBITMQ_HOST, RABBITMQ_USER, RABBITMQ_PASS, ANALYTICS_QUEUE
import json
import threading
import time
import pika

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Analytics Service")


# =====================================================
# RABBITMQ & BACKGROUND WORKER
# =====================================================

def publish_analytics_event(event_type: str, vehicle_id: str = None):
    """Publikuj event do kolejki - triggeruje przeliczenie w tle"""
    try:
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        params = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue=ANALYTICS_QUEUE, durable=True)
        
        message = json.dumps({"type": event_type, "vehicle_id": vehicle_id})
        channel.basic_publish(exchange="", routing_key=ANALYTICS_QUEUE, body=message,
                              properties=pika.BasicProperties(delivery_mode=2))
        connection.close()
        print(f"[Analytics] Event published: {event_type}, vehicle={vehicle_id}")
    except Exception as e:
        print(f"[Analytics] Failed to publish event: {e}")


def get_worker_db():
    return SessionLocal()


def save_precomputed(db: Session, chart_type: str, vehicle_id: str, period_days: int, data: dict):
    """Zapisz przeliczone dane do cache (upsert)"""
    stmt = insert(models.PrecomputedChart).values(
        chart_type=chart_type, vehicle_id=vehicle_id, period_days=period_days,
        data_json=data, computed_at=datetime.now()
    ).on_conflict_do_update(
        index_elements=['chart_type', 'vehicle_id', 'period_days'],
        set_={'data_json': data, 'computed_at': datetime.now()}
    )
    db.execute(stmt)
    db.commit()


def compute_and_cache_charts(db: Session, vehicle_id: str = None):
    """Przelicz wszystkie wykresy i zapisz do cache"""
    periods = [7, 30, 90, 180, 365]
    vid = vehicle_id
    
    for days in periods:
        start_date = datetime.now() - timedelta(days=days)
        
        # Fuel consumption
        fuel_q = db.query(
            cast(models.FuelLog.created_at, Date).label("date"),
            sql_func.sum(models.FuelLog.liters).label("liters"),
            sql_func.sum(models.FuelLog.total_cost).label("cost")
        ).filter(models.FuelLog.created_at >= start_date)
        if vid:
            fuel_q = fuel_q.filter(models.FuelLog.vehicle_id == vid)
        fuel_q = fuel_q.group_by(cast(models.FuelLog.created_at, Date)).order_by("date")
        
        fuel_data = [{"date": r.date.isoformat(), "liters": float(r.liters or 0), "cost": float(r.cost or 0)} 
                     for r in fuel_q.all() if r.date]
        save_precomputed(db, "fuel_consumption", vid, days, {"data": fuel_data, "period_days": days})
        
        # Cost breakdown (format zgodny z frontendem: category, amount)
        fuel_cost = db.query(sql_func.sum(models.FuelLog.total_cost)).filter(
            models.FuelLog.created_at >= start_date
        )
        if vid:
            fuel_cost = fuel_cost.filter(models.FuelLog.vehicle_id == vid)
        fuel_cost = float(fuel_cost.scalar() or 0)
        
        tolls_cost = db.query(sql_func.sum(models.TripLog.tolls_cost)).filter(
            models.TripLog.created_at >= start_date
        )
        if vid:
            tolls_cost = tolls_cost.filter(models.TripLog.vehicle_id == vid)
        tolls_cost = float(tolls_cost.scalar() or 0)
        
        breakdown = []
        if fuel_cost > 0:
            breakdown.append({"category": "Paliwo", "amount": fuel_cost})
        if tolls_cost > 0:
            breakdown.append({"category": "Opłaty drogowe", "amount": tolls_cost})
        save_precomputed(db, "cost_breakdown", vid, days, {"data": breakdown, "total": fuel_cost + tolls_cost})
        
        # Vehicle mileage (format zgodny z frontendem: distance_km)
        mileage_q = db.query(
            models.TripLog.vehicle_id, models.TripLog.vehicle_label,
            sql_func.sum(models.TripLog.distance_km).label("total_km"),
            sql_func.count(models.TripLog.id).label("trips")
        ).filter(models.TripLog.created_at >= start_date, models.TripLog.vehicle_id.isnot(None))
        if vid:
            mileage_q = mileage_q.filter(models.TripLog.vehicle_id == vid)
        mileage_q = mileage_q.group_by(models.TripLog.vehicle_id, models.TripLog.vehicle_label).limit(10)
        
        mileage_data = [{"vehicle_id": r.vehicle_id, "vehicle_label": r.vehicle_label or r.vehicle_id,
                         "distance_km": float(r.total_km or 0), "trips_count": r.trips} for r in mileage_q.all()]
        save_precomputed(db, "vehicle_mileage", vid, days, {"data": mileage_data})
        
        # Fuel efficiency (l/100km)
        efficiency_q = db.query(
            cast(models.TripLog.created_at, Date).label("date"),
            sql_func.sum(models.TripLog.distance_km).label("total_km"),
            sql_func.sum(models.TripLog.fuel_used_l).label("total_fuel")
        ).filter(
            models.TripLog.created_at >= start_date,
            models.TripLog.distance_km > 0,
            models.TripLog.fuel_used_l > 0
        )
        if vid:
            efficiency_q = efficiency_q.filter(models.TripLog.vehicle_id == vid)
        efficiency_q = efficiency_q.group_by(cast(models.TripLog.created_at, Date)).order_by("date")
        
        efficiency_data = []
        for r in efficiency_q.all():
            total_km = float(r.total_km or 0)
            total_fuel = float(r.total_fuel or 0)
            eff = (total_fuel / total_km * 100) if total_km > 0 else 0
            efficiency_data.append({
                "date": r.date.isoformat() if r.date else None,
                "efficiency": round(eff, 2),
                "distance_km": total_km,
                "fuel_used_l": total_fuel
            })
        save_precomputed(db, "fuel_efficiency", vid, days, {"data": efficiency_data, "period_days": days})
        
        # Cost trend (monthly)
        months = max(1, days // 30)
        fuel_monthly = db.query(
            sql_func.date_trunc('month', models.FuelLog.created_at).label("month"),
            sql_func.sum(models.FuelLog.total_cost).label("cost")
        ).filter(models.FuelLog.created_at >= start_date)
        if vid:
            fuel_monthly = fuel_monthly.filter(models.FuelLog.vehicle_id == vid)
        fuel_monthly = fuel_monthly.group_by(sql_func.date_trunc('month', models.FuelLog.created_at))
        fuel_m = {r.month: float(r.cost or 0) for r in fuel_monthly.all()}
        
        tolls_monthly = db.query(
            sql_func.date_trunc('month', models.TripLog.created_at).label("month"),
            sql_func.sum(models.TripLog.tolls_cost).label("cost")
        ).filter(models.TripLog.created_at >= start_date)
        if vid:
            tolls_monthly = tolls_monthly.filter(models.TripLog.vehicle_id == vid)
        tolls_monthly = tolls_monthly.group_by(sql_func.date_trunc('month', models.TripLog.created_at))
        tolls_m = {r.month: float(r.cost or 0) for r in tolls_monthly.all()}
        
        all_months = sorted(set(fuel_m.keys()) | set(tolls_m.keys()))
        trend_data = [{"month": m.strftime("%Y-%m"), "month_label": m.strftime("%b %Y"),
                       "fuel_cost": fuel_m.get(m, 0), "tolls_cost": tolls_m.get(m, 0),
                       "total_cost": fuel_m.get(m, 0) + tolls_m.get(m, 0)} for m in all_months if m]
        save_precomputed(db, "cost_trend", vid, days, {"data": trend_data})
        
        # Cost prediction (regression)
        try:
            import numpy as np
            from sklearn.linear_model import LinearRegression
            
            fuel_daily = db.query(
                cast(models.FuelLog.created_at, Date).label("date"),
                sql_func.sum(models.FuelLog.total_cost).label("cost")
            ).filter(models.FuelLog.created_at >= start_date)
            if vid:
                fuel_daily = fuel_daily.filter(models.FuelLog.vehicle_id == vid)
            fuel_daily = fuel_daily.group_by(cast(models.FuelLog.created_at, Date)).order_by("date")
            fuel_d = {r.date: float(r.cost or 0) for r in fuel_daily.all()}
            
            tolls_daily = db.query(
                cast(models.TripLog.created_at, Date).label("date"),
                sql_func.sum(models.TripLog.tolls_cost).label("cost")
            ).filter(models.TripLog.created_at >= start_date)
            if vid:
                tolls_daily = tolls_daily.filter(models.TripLog.vehicle_id == vid)
            tolls_daily = tolls_daily.group_by(cast(models.TripLog.created_at, Date)).order_by("date")
            tolls_d = {r.date: float(r.cost or 0) for r in tolls_daily.all()}
            
            all_dates = sorted(set(fuel_d.keys()) | set(tolls_d.keys()))
            
            if len(all_dates) >= 3:
                base = all_dates[0]
                historical = []
                X, y = [], []
                for d in all_dates:
                    idx = (d - base).days
                    total = fuel_d.get(d, 0) + tolls_d.get(d, 0)
                    historical.append({"date": d.isoformat(), "total_cost": total, "is_prediction": False})
                    X.append([idx])
                    y.append(total)
                
                model = LinearRegression().fit(np.array(X), np.array(y))
                r2 = model.score(np.array(X), np.array(y))
                
                predict_days = max(14, days // 3)
                last_idx = (all_dates[-1] - base).days
                prediction = []
                for i in range(1, predict_days + 1):
                    future_date = all_dates[-1] + timedelta(days=i)
                    pred = max(0, model.predict([[last_idx + i]])[0])
                    prediction.append({"date": future_date.isoformat(), "predicted_cost": round(pred, 2), "is_prediction": True})
                
                pred_data = {
                    "historical": historical, "prediction": prediction,
                    "model_stats": {"r_squared": round(r2, 4), "daily_trend": round(model.coef_[0], 2),
                                    "trend_direction": "wzrostowy" if model.coef_[0] > 0 else "spadkowy"},
                    "summary": {"avg_daily_cost": round(np.mean(y), 2),
                                "predicted_next_period_cost": round(sum(p["predicted_cost"] for p in prediction), 2)}
                }
                save_precomputed(db, "cost_prediction", vid, days, pred_data)
            else:
                save_precomputed(db, "cost_prediction", vid, days, {"historical": [], "prediction": [], "model_stats": {"error": "Za mało danych"}})
        except Exception as e:
            print(f"[Analytics] Prediction error: {e}")
            save_precomputed(db, "cost_prediction", vid, days, {"historical": [], "prediction": [], "model_stats": {"error": str(e)}})
    
    # Fleet summary (only for all vehicles)
    if not vid:
        today = datetime.now()
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        
        cur_fuel = float(db.query(sql_func.sum(models.FuelLog.total_cost)).filter(models.FuelLog.created_at >= month_start).scalar() or 0)
        cur_dist = float(db.query(sql_func.sum(models.TripLog.distance_km)).filter(models.TripLog.created_at >= month_start).scalar() or 0)
        cur_trips = db.query(sql_func.count(models.TripLog.id)).filter(models.TripLog.created_at >= month_start).scalar() or 0
        
        last_fuel = float(db.query(sql_func.sum(models.FuelLog.total_cost)).filter(
            models.FuelLog.created_at >= last_month_start, models.FuelLog.created_at < month_start).scalar() or 0)
        last_dist = float(db.query(sql_func.sum(models.TripLog.distance_km)).filter(
            models.TripLog.created_at >= last_month_start, models.TripLog.created_at < month_start).scalar() or 0)
        
        def delta(cur, last):
            if last == 0:
                return "+100%" if cur > 0 else "0%"
            return f"{'+' if (cur-last)/last >= 0 else ''}{((cur-last)/last)*100:.0f}%"
        
        summary = {
            "current_month": {"fuel_cost": cur_fuel, "total_distance_km": cur_dist, "trips_count": cur_trips},
            "deltas": {"fuel_cost": delta(cur_fuel, last_fuel), "distance": delta(cur_dist, last_dist)}
        }
        save_precomputed(db, "fleet_summary", None, 0, summary)
        
        # Vehicles list
        trip_v = db.query(models.TripLog.vehicle_id, models.TripLog.vehicle_label).filter(
            models.TripLog.vehicle_id.isnot(None)).distinct().all()
        fuel_v = db.query(models.FuelLog.vehicle_id, models.FuelLog.vehicle_label).filter(
            models.FuelLog.vehicle_id.isnot(None)).distinct().all()
        vehicles_map = {}
        for v in trip_v + fuel_v:
            if v.vehicle_id and v.vehicle_id not in vehicles_map:
                vehicles_map[v.vehicle_id] = v.vehicle_label or v.vehicle_id
        save_precomputed(db, "vehicles_list", None, 0, {"vehicles": [{"id": k, "label": v} for k, v in vehicles_map.items()]})
    
    print(f"[Analytics] Cache updated for vehicle_id={vid or 'ALL'}")


def process_analytics_event(event: dict):
    """Przetwórz event - przelicz dane"""
    db = get_worker_db()
    try:
        vehicle_id = event.get("vehicle_id")
        compute_and_cache_charts(db, vehicle_id)
        compute_and_cache_charts(db, None)  # Też globalne
    except Exception as e:
        print(f"[Analytics Worker] Error: {e}")
    finally:
        db.close()


def analytics_worker():
    """Worker RabbitMQ - nasłuchuje na eventy i przelicza"""
    while True:
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            params = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials, heartbeat=600)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.queue_declare(queue=ANALYTICS_QUEUE, durable=True)
            channel.basic_qos(prefetch_count=1)
            
            def callback(ch, method, props, body):
                try:
                    event = json.loads(body)
                    print(f"[Analytics Worker] Processing: {event}")
                    process_analytics_event(event)
                except Exception as e:
                    print(f"[Analytics Worker] Callback error: {e}")
                ch.basic_ack(delivery_tag=method.delivery_tag)
            
            channel.basic_consume(queue=ANALYTICS_QUEUE, on_message_callback=callback)
            print(f"[Analytics Worker] Listening on {ANALYTICS_QUEUE}")
            channel.start_consuming()
        except Exception as e:
            print(f"[Analytics Worker] Connection error, retrying in 5s: {e}")
            time.sleep(5)


def initial_cache_build():
    """Początkowe przeliczenie przy starcie"""
    time.sleep(5)  # Poczekaj na bazę
    db = get_worker_db()
    try:
        # Pobierz listę pojazdów
        vehicles = db.query(models.TripLog.vehicle_id).filter(models.TripLog.vehicle_id.isnot(None)).distinct().all()
        vehicle_ids = [v.vehicle_id for v in vehicles]
        
        for vid in vehicle_ids:
            compute_and_cache_charts(db, vid)
        compute_and_cache_charts(db, None)
        print("[Analytics] Initial cache build complete")
    except Exception as e:
        print(f"[Analytics] Initial cache error: {e}")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    """Uruchom worker i początkowe przeliczenie"""
    threading.Thread(target=initial_cache_build, daemon=True).start()
    threading.Thread(target=analytics_worker, daemon=True).start()
    print("[Analytics Service] Background worker started")


# =====================================================
# HELPER: Read from cache
# =====================================================

def get_cached_chart(db: Session, chart_type: str, vehicle_id: str = None, period_days: int = 30) -> dict:
    """Pobierz dane z cache"""
    q = db.query(models.PrecomputedChart).filter(
        models.PrecomputedChart.chart_type == chart_type,
        models.PrecomputedChart.period_days == period_days
    )
    if vehicle_id:
        q = q.filter(models.PrecomputedChart.vehicle_id == vehicle_id)
    else:
        q = q.filter(models.PrecomputedChart.vehicle_id.is_(None))
    
    # Sortuj po computed_at DESC żeby brać najnowsze dane
    q = q.order_by(models.PrecomputedChart.computed_at.desc())
    
    result = q.first()
    if not result:
        return None  # Zwróć None żeby endpoint użył fallback on-demand
    
    data = dict(result.data_json)
    data["cached"] = True
    data["computed_at"] = result.computed_at.isoformat() if result.computed_at else None
    return data


# =====================================================
# ORIGINAL CODE CONTINUES BELOW
# =====================================================

class AssignmentCreate(BaseModel):
    user_id: str
    vehicle_id: str
    vehicle_model: str
    vehicle_vin: str
    vehicle_mileage: str
    vehicle_battery: int
    vehicle_tire_pressure: str
    tasks: List[Dict[str, Any]]


class VehicleAssignmentPayload(BaseModel):
    user_id: str
    vehicle_id: str
    vehicle_model: str
    vehicle_vin: str
    vehicle_mileage: Optional[str] = None
    vehicle_battery: Optional[int] = None
    vehicle_tire_pressure: Optional[str] = None


class TaskAssignmentPayload(BaseModel):
    user_id: str
    tasks: List[Dict[str, Any]]

class TaskUpdate(BaseModel):
    task_id: int
    status: str

class VehicleUpdate(BaseModel):
    mileage: str
    battery: int


class TripLogBase(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    route_label: Optional[str] = None
    distance_km: Optional[float] = None
    fuel_used_l: Optional[float] = None
    fuel_cost: Optional[float] = None
    tolls_cost: Optional[float] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    user_id: Optional[str] = None


class TripLogCreate(TripLogBase):
    distance_km: float


class TripLogUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    route_label: Optional[str] = None
    distance_km: Optional[float] = None
    fuel_used_l: Optional[float] = None
    fuel_cost: Optional[float] = None
    tolls_cost: Optional[float] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    user_id: Optional[str] = None


class FuelLogBase(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    liters: Optional[float] = None
    price_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    station: Optional[str] = None
    odometer: Optional[int] = None
    notes: Optional[str] = None
    user_id: Optional[str] = None


class FuelLogCreate(FuelLogBase):
    liters: float


class FuelLogUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    liters: Optional[float] = None
    price_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    station: Optional[str] = None
    odometer: Optional[int] = None
    notes: Optional[str] = None
    user_id: Optional[str] = None


def decimal_to_float(value: Optional[Decimal]) -> Optional[float]:
    if value is None:
        return None
    return float(value)


def serialize_trip(log: models.TripLog) -> Dict[str, Any]:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "vehicle_id": log.vehicle_id,
        "vehicle_label": log.vehicle_label,
        "route_label": log.route_label,
        "distance_km": decimal_to_float(log.distance_km),
        "fuel_used_l": decimal_to_float(log.fuel_used_l),
        "fuel_cost": decimal_to_float(log.fuel_cost),
        "tolls_cost": decimal_to_float(log.tolls_cost),
        "notes": log.notes,
        "started_at": log.started_at,
        "created_at": log.created_at,
    }


def serialize_fuel(log: models.FuelLog) -> Dict[str, Any]:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "vehicle_id": log.vehicle_id,
        "vehicle_label": log.vehicle_label,
        "liters": decimal_to_float(log.liters),
        "price_per_liter": decimal_to_float(log.price_per_liter),
        "total_cost": decimal_to_float(log.total_cost),
        "station": log.station,
        "odometer": log.odometer,
        "notes": log.notes,
        "created_at": log.created_at,
    }


def resolve_target_user(current_user: dict, explicit_user_id: Optional[str]) -> str:
    if explicit_user_id:
        if current_user.get("role") != "admin" and explicit_user_id != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return explicit_user_id
    return current_user["id"]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "analytics-service"}

@app.post("/analytics/admin/assignments")
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if assignment exists for user
    db_assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == assignment.user_id).first()
    
    if db_assignment:
        # Update existing
        db_assignment.vehicle_id = assignment.vehicle_id
        db_assignment.vehicle_model = assignment.vehicle_model
        db_assignment.vehicle_vin = assignment.vehicle_vin
        db_assignment.vehicle_mileage = assignment.vehicle_mileage
        db_assignment.vehicle_battery = assignment.vehicle_battery
        db_assignment.vehicle_tire_pressure = assignment.vehicle_tire_pressure
        db_assignment.task_json = json.dumps(assignment.tasks)
    else:
        # Create new
        db_assignment = models.UserAssignment(
            user_id=assignment.user_id,
            vehicle_id=assignment.vehicle_id,
            vehicle_model=assignment.vehicle_model,
            vehicle_vin=assignment.vehicle_vin,
            vehicle_mileage=assignment.vehicle_mileage,
            vehicle_battery=assignment.vehicle_battery,
            vehicle_tire_pressure=assignment.vehicle_tire_pressure,
            task_json=json.dumps(assignment.tasks)
        )
        db.add(db_assignment)
    
    db.commit()
    db.refresh(db_assignment)
    return {"status": "success", "id": db_assignment.id}


def _get_assignment_record(db: Session, user_id: str) -> Optional[models.UserAssignment]:
    return db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()


@app.post("/analytics/admin/assignments/vehicle")
def assign_vehicle_to_employee(
    payload: VehicleAssignmentPayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    assignment = _get_assignment_record(db, payload.user_id)
    if assignment:
        assignment.vehicle_id = payload.vehicle_id
        assignment.vehicle_model = payload.vehicle_model
        assignment.vehicle_vin = payload.vehicle_vin
        assignment.vehicle_mileage = payload.vehicle_mileage
        assignment.vehicle_battery = payload.vehicle_battery
        assignment.vehicle_tire_pressure = payload.vehicle_tire_pressure
    else:
        assignment = models.UserAssignment(
            user_id=payload.user_id,
            vehicle_id=payload.vehicle_id,
            vehicle_model=payload.vehicle_model,
            vehicle_vin=payload.vehicle_vin,
            vehicle_mileage=payload.vehicle_mileage,
            vehicle_battery=payload.vehicle_battery,
            vehicle_tire_pressure=payload.vehicle_tire_pressure,
            task_json=json.dumps([]),
        )
        db.add(assignment)

    db.commit()
    db.refresh(assignment)
    return {"status": "success", "id": assignment.id}


@app.post("/analytics/admin/assignments/tasks")
def assign_tasks_to_employee(
    payload: TaskAssignmentPayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    assignment = _get_assignment_record(db, payload.user_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle must be assigned before tasks")

    assignment.task_json = json.dumps(payload.tasks or [])
    db.commit()
    return {"status": "success", "tasks_count": len(payload.tasks or [])}

@app.get("/analytics/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    stats = db.query(models.UserStat).filter(models.UserStat.user_id == user_id).all()
    return stats

@app.get("/analytics/admin/costs")
def get_admin_costs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    costs = db.query(models.UserCost).filter(models.UserCost.user_id == user_id).all()
    # Transform to dictionary format expected by frontend
    return {cost.category: cost.amount for cost in costs}

@app.get("/analytics/admin/alerts")
def get_admin_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    alerts = db.query(models.UserAlert).filter(models.UserAlert.user_id == user_id).all()
    return alerts

@app.get("/analytics/trips")
def list_trip_logs(
    user_id: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(models.TripLog)
    if user_id:
        target = resolve_target_user(current_user, user_id)
        query = query.filter(models.TripLog.user_id == target)
    elif current_user.get("role") != "admin":
        query = query.filter(models.TripLog.user_id == current_user["id"])
    query = query.order_by(models.TripLog.created_at.desc())
    if limit:
        query = query.limit(limit)
    logs = query.all()
    return [serialize_trip(log) for log in logs]


@app.post("/analytics/trips")
def create_trip_log(
    payload: TripLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    target = resolve_target_user(current_user, payload.user_id)
    log = models.TripLog(
        user_id=target,
        vehicle_id=payload.vehicle_id,
        vehicle_label=payload.vehicle_label,
        route_label=payload.route_label,
        distance_km=payload.distance_km,
        fuel_used_l=payload.fuel_used_l,
        fuel_cost=payload.fuel_cost,
        tolls_cost=payload.tolls_cost,
        notes=payload.notes,
        started_at=payload.started_at or datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    publish_analytics_event("trip_added", payload.vehicle_id)
    return serialize_trip(log)


@app.put("/analytics/trips/{trip_id}")
def update_trip_log(
    trip_id: int,
    payload: TripLogUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = payload.dict(exclude_unset=True)
    target_user = updates.pop("user_id", None)
    if target_user:
        if current_user.get("role") != "admin" and target_user != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        log.user_id = target_user
    for field, value in updates.items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    publish_analytics_event("trip_updated", log.vehicle_id)
    return serialize_trip(log)


@app.delete("/analytics/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_log(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    vehicle_id = log.vehicle_id
    db.delete(log)
    db.commit()
    publish_analytics_event("trip_deleted", vehicle_id)
    return {"status": "deleted"}


@app.get("/analytics/fuel-logs")
def list_fuel_logs(
    user_id: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(models.FuelLog)
    if user_id:
        target = resolve_target_user(current_user, user_id)
        query = query.filter(models.FuelLog.user_id == target)
    elif current_user.get("role") != "admin":
        query = query.filter(models.FuelLog.user_id == current_user["id"])
    query = query.order_by(models.FuelLog.created_at.desc())
    if limit:
        query = query.limit(limit)
    logs = query.all()
    return [serialize_fuel(log) for log in logs]


@app.post("/analytics/fuel-logs")
def create_fuel_log(
    payload: FuelLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    target = resolve_target_user(current_user, payload.user_id)
    log = models.FuelLog(
        user_id=target,
        vehicle_id=payload.vehicle_id,
        vehicle_label=payload.vehicle_label,
        liters=payload.liters,
        price_per_liter=payload.price_per_liter,
        total_cost=payload.total_cost,
        station=payload.station,
        odometer=payload.odometer,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    publish_analytics_event("fuel_added", payload.vehicle_id)
    return serialize_fuel(log)


@app.put("/analytics/fuel-logs/{log_id}")
def update_fuel_log(
    log_id: int,
    payload: FuelLogUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.FuelLog).filter(models.FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = payload.dict(exclude_unset=True)
    target_user = updates.pop("user_id", None)
    if target_user:
        if current_user.get("role") != "admin" and target_user != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        log.user_id = target_user
    for field, value in updates.items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    publish_analytics_event("fuel_updated", log.vehicle_id)
    return serialize_fuel(log)


@app.delete("/analytics/fuel-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fuel_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.FuelLog).filter(models.FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    vehicle_id = log.vehicle_id
    db.delete(log)
    db.commit()
    publish_analytics_event("fuel_deleted", vehicle_id)
    return {"status": "deleted"}

@app.get("/analytics/employee/assignment")
def get_employee_assignment(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    
    if not assignment:
        return None # Or empty object depending on frontend expectation

    return {
        "vehicle": {
            "id": assignment.vehicle_id,
            "model": assignment.vehicle_model,
            "vin": assignment.vehicle_vin,
            "mileage": assignment.vehicle_mileage,
            "battery": assignment.vehicle_battery,
            "tirePressure": assignment.vehicle_tire_pressure
        },
        "tasks": json.loads(assignment.task_json) if assignment.task_json else []
    }

@app.get("/analytics/employee/trips")
def get_employee_trips(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    logs = (
        db.query(models.TripLog)
        .filter(models.TripLog.user_id == user_id)
        .order_by(models.TripLog.created_at.desc())
        .all()
    )
    return [serialize_trip(log) for log in logs]


@app.get("/analytics/employee/fuel-logs")
def get_employee_fuel_logs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    logs = (
        db.query(models.FuelLog)
        .filter(models.FuelLog.user_id == user_id)
        .order_by(models.FuelLog.created_at.desc())
        .all()
    )
    return [serialize_fuel(log) for log in logs]

@app.get("/analytics/employee/reminders")
def get_employee_reminders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    reminders = db.query(models.UserReminder).filter(models.UserReminder.user_id == user_id).all()
    return reminders

@app.post("/analytics/employee/tasks/update")
def update_task_status(
    update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    tasks = json.loads(assignment.task_json)
    for task in tasks:
        if task['id'] == update.task_id:
            task['status'] = update.status
            break
    
    assignment.task_json = json.dumps(tasks)
    db.commit()
    return {"status": "success"}

@app.post("/analytics/employee/vehicle/return")
def return_vehicle(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    vehicle_id = assignment.vehicle_id
    
    db.delete(assignment)
    db.commit()
    return {"status": "success", "vehicle_id": vehicle_id}

@app.post("/analytics/employee/vehicle/update")
def update_vehicle_status(
    update: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.vehicle_mileage = update.mileage
    assignment.vehicle_battery = update.battery
    db.commit()
    return {"status": "success"}


# ==================== CHART ENDPOINTS ====================

from sqlalchemy import func as sql_func, cast, Date
from datetime import timedelta

@app.get("/analytics/charts/fuel-consumption")
def get_fuel_consumption_chart(
    days: int = 30,
    vehicle_id: Optional[str] = None,
    group_by: str = "day",  # day, week, month
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz dane o zużyciu paliwa w czasie dla wykresów (z cache)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Próbuj pobrać z cache
    cached = get_cached_chart(db, "fuel_consumption", vehicle_id, days)
    if cached is not None:
        return cached
    
    # Fallback na obliczenie on-demand (np. jeśli cache pusty)
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        cast(models.FuelLog.created_at, Date).label("date"),
        sql_func.sum(models.FuelLog.liters).label("total_liters"),
        sql_func.sum(models.FuelLog.total_cost).label("total_cost"),
        sql_func.count(models.FuelLog.id).label("refuels_count")
    ).filter(models.FuelLog.created_at >= start_date)
    
    if vehicle_id:
        query = query.filter(models.FuelLog.vehicle_id == vehicle_id)
    
    query = query.group_by(cast(models.FuelLog.created_at, Date)).order_by("date")
    results = query.all()
    
    data = []
    for row in results:
        data.append({
            "date": row.date.isoformat() if row.date else None,
            "liters": float(row.total_liters or 0),
            "cost": float(row.total_cost or 0),
            "refuels": row.refuels_count or 0
        })
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/cost-breakdown")
def get_cost_breakdown_chart(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz podział kosztów dla wykresu kołowego (z cache)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Próbuj pobrać z cache
    cached = get_cached_chart(db, "cost_breakdown", None, days)
    if cached is not None:
        return cached
    
    # Fallback na obliczenie on-demand
    start_date = datetime.now() - timedelta(days=days)
    
    # Koszty z tabeli user_costs
    costs_query = db.query(
        models.UserCost.category,
        sql_func.sum(models.UserCost.amount).label("total")
    ).filter(
        models.UserCost.created_at >= start_date
    ).group_by(models.UserCost.category).all()
    
    # Koszty paliwa z fuel_logs
    fuel_cost = db.query(
        sql_func.sum(models.FuelLog.total_cost)
    ).filter(models.FuelLog.created_at >= start_date).scalar() or 0
    
    # Koszty opłat drogowych z trip_logs
    tolls_cost = db.query(
        sql_func.sum(models.TripLog.tolls_cost)
    ).filter(models.TripLog.created_at >= start_date).scalar() or 0
    
    data = []
    for row in costs_query:
        data.append({
            "category": row.category,
            "amount": float(row.total or 0)
        })
    
    # Dodaj koszty paliwa jeśli nie ma w costs
    fuel_exists = any(d["category"].lower() == "paliwo" for d in data)
    if not fuel_exists and fuel_cost > 0:
        data.append({"category": "Paliwo", "amount": float(fuel_cost)})
    
    if tolls_cost > 0:
        data.append({"category": "Opłaty drogowe", "amount": float(tolls_cost)})
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/vehicle-mileage")
def get_vehicle_mileage_chart(
    days: int = 30,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz przebieg per pojazd dla wykresu słupkowego (z cache)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Próbuj pobrać z cache
    cached = get_cached_chart(db, "vehicle_mileage", None, days)
    if cached is not None:
        return cached
    
    # Fallback na obliczenie on-demand
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        models.TripLog.vehicle_id,
        models.TripLog.vehicle_label,
        sql_func.sum(models.TripLog.distance_km).label("total_km"),
        sql_func.count(models.TripLog.id).label("trips_count")
    ).filter(
        models.TripLog.created_at >= start_date,
        models.TripLog.vehicle_id.isnot(None)
    ).group_by(
        models.TripLog.vehicle_id,
        models.TripLog.vehicle_label
    ).order_by(sql_func.sum(models.TripLog.distance_km).desc()).limit(limit)
    
    results = query.all()
    
    data = []
    for row in results:
        data.append({
            "vehicle_id": row.vehicle_id,
            "vehicle_label": row.vehicle_label or row.vehicle_id,
            "distance_km": float(row.total_km or 0),
            "trips_count": row.trips_count or 0
        })
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/fuel-efficiency")
def get_fuel_efficiency_chart(
    days: int = 30,
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz efektywność paliwową (l/100km) w czasie (z cache)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Próbuj pobrać z cache
    cached = get_cached_chart(db, "fuel_efficiency", vehicle_id, days)
    if cached is not None:
        return cached
    
    # Fallback na obliczenie on-demand
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        cast(models.TripLog.created_at, Date).label("date"),
        sql_func.sum(models.TripLog.distance_km).label("total_km"),
        sql_func.sum(models.TripLog.fuel_used_l).label("total_fuel")
    ).filter(
        models.TripLog.created_at >= start_date,
        models.TripLog.distance_km > 0,
        models.TripLog.fuel_used_l > 0
    )
    
    if vehicle_id:
        query = query.filter(models.TripLog.vehicle_id == vehicle_id)
    
    query = query.group_by(cast(models.TripLog.created_at, Date)).order_by("date")
    results = query.all()
    
    data = []
    for row in results:
        total_km = float(row.total_km or 0)
        total_fuel = float(row.total_fuel or 0)
        efficiency = (total_fuel / total_km * 100) if total_km > 0 else 0
        
        data.append({
            "date": row.date.isoformat() if row.date else None,
            "efficiency": round(efficiency, 2),
            "distance_km": total_km,
            "fuel_used_l": total_fuel
        })
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/cost-trend")
def get_cost_trend_chart(
    months: int = 6,
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz trend kosztów miesięcznych (z cache)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Próbuj pobrać z cache (months*30 dla spójności z days)
    cached = get_cached_chart(db, "cost_trend", vehicle_id, months * 30)
    if cached is not None:
        return cached
    
    # Fallback na obliczenie on-demand
    start_date = datetime.now() - timedelta(days=months * 30)
    
    # Koszty paliwa per miesiąc
    fuel_query = db.query(
        sql_func.date_trunc('month', models.FuelLog.created_at).label("month"),
        sql_func.sum(models.FuelLog.total_cost).label("fuel_cost")
    ).filter(
        models.FuelLog.created_at >= start_date
    )
    if vehicle_id:
        fuel_query = fuel_query.filter(models.FuelLog.vehicle_id == vehicle_id)
    fuel_query = fuel_query.group_by(sql_func.date_trunc('month', models.FuelLog.created_at))
    
    fuel_results = {row.month: float(row.fuel_cost or 0) for row in fuel_query.all()}
    
    # Koszty opłat drogowych per miesiąc
    tolls_query = db.query(
        sql_func.date_trunc('month', models.TripLog.created_at).label("month"),
        sql_func.sum(models.TripLog.tolls_cost).label("tolls_cost")
    ).filter(
        models.TripLog.created_at >= start_date
    )
    if vehicle_id:
        tolls_query = tolls_query.filter(models.TripLog.vehicle_id == vehicle_id)
    tolls_query = tolls_query.group_by(sql_func.date_trunc('month', models.TripLog.created_at))
    
    tolls_results = {row.month: float(row.tolls_cost or 0) for row in tolls_query.all()}
    
    # Połącz dane
    all_months = set(fuel_results.keys()) | set(tolls_results.keys())
    
    data = []
    for month in sorted(all_months):
        if month:
            data.append({
                "month": month.strftime("%Y-%m"),
                "month_label": month.strftime("%b %Y"),
                "fuel_cost": fuel_results.get(month, 0),
                "tolls_cost": tolls_results.get(month, 0),
                "total_cost": fuel_results.get(month, 0) + tolls_results.get(month, 0)
            })
    
    return {"data": data, "period_months": months}


@app.get("/analytics/charts/fleet-summary")
def get_fleet_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz podsumowanie statystyk floty (z cache)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Próbuj pobrać z cache (period_days=0 dla fleet_summary)
    cached = get_cached_chart(db, "fleet_summary", None, 0)
    if cached and cached.get("current_month"):
        return cached
    
    # Fallback na obliczenie on-demand
    today = datetime.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # Statystyki bieżącego miesiąca
    current_fuel = db.query(sql_func.sum(models.FuelLog.total_cost)).filter(
        models.FuelLog.created_at >= month_start
    ).scalar() or 0
    
    current_distance = db.query(sql_func.sum(models.TripLog.distance_km)).filter(
        models.TripLog.created_at >= month_start
    ).scalar() or 0
    
    current_trips = db.query(sql_func.count(models.TripLog.id)).filter(
        models.TripLog.created_at >= month_start
    ).scalar() or 0
    
    # Statystyki poprzedniego miesiąca (do porównania)
    last_fuel = db.query(sql_func.sum(models.FuelLog.total_cost)).filter(
        models.FuelLog.created_at >= last_month_start,
        models.FuelLog.created_at < month_start
    ).scalar() or 0
    
    last_distance = db.query(sql_func.sum(models.TripLog.distance_km)).filter(
        models.TripLog.created_at >= last_month_start,
        models.TripLog.created_at < month_start
    ).scalar() or 0
    
    # Oblicz zmiany procentowe
    def calc_delta(current, last):
        if last == 0:
            return "+100%" if current > 0 else "0%"
        change = ((current - last) / last) * 100
        return f"{'+' if change >= 0 else ''}{change:.0f}%"
    
    return {
        "current_month": {
            "fuel_cost": float(current_fuel),
            "total_distance_km": float(current_distance),
            "trips_count": current_trips
        },
        "deltas": {
            "fuel_cost": calc_delta(float(current_fuel), float(last_fuel)),
            "distance": calc_delta(float(current_distance), float(last_distance))
        },
        "period": month_start.strftime("%B %Y")
    }


@app.get("/analytics/vehicles-list")
def get_vehicles_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz listę unikalnych pojazdów do filtrów"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Pobierz unikalne pojazdy z trip_logs i fuel_logs
    trip_vehicles = db.query(
        models.TripLog.vehicle_id,
        models.TripLog.vehicle_label
    ).filter(models.TripLog.vehicle_id.isnot(None)).distinct().all()
    
    fuel_vehicles = db.query(
        models.FuelLog.vehicle_id,
        models.FuelLog.vehicle_label
    ).filter(models.FuelLog.vehicle_id.isnot(None)).distinct().all()
    
    # Połącz i deduplikuj
    vehicles_map = {}
    for v in trip_vehicles + fuel_vehicles:
        if v.vehicle_id and v.vehicle_id not in vehicles_map:
            vehicles_map[v.vehicle_id] = v.vehicle_label or v.vehicle_id
    
    vehicles = [{"id": k, "label": v} for k, v in vehicles_map.items()]
    
    return {"vehicles": vehicles}


# ==================== PREDICTION ENDPOINTS ====================

import numpy as np
from sklearn.linear_model import LinearRegression

@app.get("/analytics/charts/cost-prediction")
def get_cost_prediction(
    history_days: int = 90,
    predict_days: int = 30,
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Predykcja kosztów na podstawie regresji liniowej.
    Analizuje dane historyczne i przewiduje koszty na następne dni.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=history_days)
    
    # Pobierz dzienne koszty paliwa
    fuel_query = db.query(
        cast(models.FuelLog.created_at, Date).label("date"),
        sql_func.sum(models.FuelLog.total_cost).label("cost")
    ).filter(
        models.FuelLog.created_at >= start_date
    )
    if vehicle_id:
        fuel_query = fuel_query.filter(models.FuelLog.vehicle_id == vehicle_id)
    fuel_query = fuel_query.group_by(cast(models.FuelLog.created_at, Date)).order_by("date")
    
    fuel_data = {row.date: float(row.cost or 0) for row in fuel_query.all()}
    
    # Pobierz dzienne koszty opłat drogowych
    tolls_query = db.query(
        cast(models.TripLog.created_at, Date).label("date"),
        sql_func.sum(models.TripLog.tolls_cost).label("cost")
    ).filter(
        models.TripLog.created_at >= start_date
    )
    if vehicle_id:
        tolls_query = tolls_query.filter(models.TripLog.vehicle_id == vehicle_id)
    tolls_query = tolls_query.group_by(cast(models.TripLog.created_at, Date)).order_by("date")
    
    tolls_data = {row.date: float(row.cost or 0) for row in tolls_query.all()}
    
    # Połącz dane w serie czasowe
    all_dates = sorted(set(fuel_data.keys()) | set(tolls_data.keys()))
    
    if len(all_dates) < 3:
        return {
            "historical": [],
            "prediction": [],
            "model_stats": {"error": "Za mało danych do predykcji (min. 3 dni)"},
            "summary": {}
        }
    
    # Przygotuj dane do regresji
    base_date = all_dates[0]
    historical = []
    X_train = []
    y_train = []
    
    for date in all_dates:
        day_index = (date - base_date).days
        fuel_cost = fuel_data.get(date, 0)
        tolls_cost = tolls_data.get(date, 0)
        total_cost = fuel_cost + tolls_cost
        
        historical.append({
            "date": date.isoformat(),
            "day_index": day_index,
            "fuel_cost": fuel_cost,
            "tolls_cost": tolls_cost,
            "total_cost": total_cost,
            "is_prediction": False
        })
        
        X_train.append([day_index])
        y_train.append(total_cost)
    
    # Trenuj model regresji liniowej
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Oblicz metryki modelu
    y_pred_train = model.predict(X_train)
    ss_res = np.sum((y_train - y_pred_train) ** 2)
    ss_tot = np.sum((y_train - np.mean(y_train)) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Przewiduj na następne dni
    last_day_index = (all_dates[-1] - base_date).days
    prediction = []
    
    for i in range(1, predict_days + 1):
        future_day_index = last_day_index + i
        future_date = all_dates[-1] + timedelta(days=i)
        predicted_cost = max(0, model.predict([[future_day_index]])[0])  # Nie może być ujemne
        
        prediction.append({
            "date": future_date.isoformat(),
            "day_index": future_day_index,
            "predicted_cost": round(predicted_cost, 2),
            "is_prediction": True
        })
    
    # Podsumowanie
    total_historical = sum(y_train)
    avg_daily = total_historical / len(y_train) if len(y_train) > 0 else 0
    total_predicted = sum(p["predicted_cost"] for p in prediction)
    
    # Trend (wzrost/spadek dzienny)
    daily_trend = model.coef_[0]
    trend_direction = "wzrostowy" if daily_trend > 0 else "spadkowy" if daily_trend < 0 else "stabilny"
    
    return {
        "historical": historical,
        "prediction": prediction,
        "model_stats": {
            "r_squared": round(r_squared, 4),
            "daily_trend": round(daily_trend, 2),
            "trend_direction": trend_direction,
            "intercept": round(model.intercept_, 2),
            "data_points": len(all_dates)
        },
        "summary": {
            "total_historical_cost": round(total_historical, 2),
            "avg_daily_cost": round(avg_daily, 2),
            "predicted_next_period_cost": round(total_predicted, 2),
            "history_days": history_days,
            "predict_days": predict_days
        }
    }


@app.get("/analytics/charts/monthly-prediction")
def get_monthly_prediction(
    history_months: int = 6,
    predict_months: int = 3,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Predykcja miesięcznych kosztów na podstawie regresji liniowej.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=history_months * 30)
    
    # Pobierz miesięczne koszty paliwa
    fuel_query = db.query(
        sql_func.date_trunc('month', models.FuelLog.created_at).label("month"),
        sql_func.sum(models.FuelLog.total_cost).label("cost")
    ).filter(
        models.FuelLog.created_at >= start_date
    ).group_by(sql_func.date_trunc('month', models.FuelLog.created_at))
    
    fuel_data = {row.month: float(row.cost or 0) for row in fuel_query.all()}
    
    # Pobierz miesięczne koszty opłat
    tolls_query = db.query(
        sql_func.date_trunc('month', models.TripLog.created_at).label("month"),
        sql_func.sum(models.TripLog.tolls_cost).label("cost")
    ).filter(
        models.TripLog.created_at >= start_date
    ).group_by(sql_func.date_trunc('month', models.TripLog.created_at))
    
    tolls_data = {row.month: float(row.cost or 0) for row in tolls_query.all()}
    
    # Połącz dane
    all_months = sorted(set(fuel_data.keys()) | set(tolls_data.keys()))
    
    if len(all_months) < 2:
        return {
            "historical": [],
            "prediction": [],
            "model_stats": {"error": "Za mało danych do predykcji (min. 2 miesiące)"},
            "summary": {}
        }
    
    # Przygotuj dane
    historical = []
    X_train = []
    y_train = []
    
    for i, month in enumerate(all_months):
        fuel_cost = fuel_data.get(month, 0)
        tolls_cost = tolls_data.get(month, 0)
        total_cost = fuel_cost + tolls_cost
        
        historical.append({
            "month": month.strftime("%Y-%m"),
            "month_label": month.strftime("%b %Y"),
            "month_index": i,
            "fuel_cost": fuel_cost,
            "tolls_cost": tolls_cost,
            "total_cost": total_cost,
            "is_prediction": False
        })
        
        X_train.append([i])
        y_train.append(total_cost)
    
    # Trenuj model
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Metryki
    y_pred_train = model.predict(X_train)
    ss_res = np.sum((y_train - y_pred_train) ** 2)
    ss_tot = np.sum((y_train - np.mean(y_train)) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Predykcja
    prediction = []
    last_month = all_months[-1]
    
    for i in range(1, predict_months + 1):
        future_index = len(all_months) - 1 + i
        # Oblicz przyszły miesiąc
        future_month = last_month + timedelta(days=32 * i)
        future_month = future_month.replace(day=1)
        
        predicted_cost = max(0, model.predict([[future_index]])[0])
        
        prediction.append({
            "month": future_month.strftime("%Y-%m"),
            "month_label": future_month.strftime("%b %Y"),
            "month_index": future_index,
            "predicted_cost": round(predicted_cost, 2),
            "is_prediction": True
        })
    
    # Podsumowanie
    monthly_trend = model.coef_[0]
    trend_direction = "wzrostowy" if monthly_trend > 50 else "spadkowy" if monthly_trend < -50 else "stabilny"
    
    return {
        "historical": historical,
        "prediction": prediction,
        "model_stats": {
            "r_squared": round(r_squared, 4),
            "monthly_trend": round(monthly_trend, 2),
            "trend_direction": trend_direction,
            "data_points": len(all_months)
        },
        "summary": {
            "avg_monthly_cost": round(np.mean(y_train), 2),
            "predicted_next_months_total": round(sum(p["predicted_cost"] for p in prediction), 2)
        }
    }


