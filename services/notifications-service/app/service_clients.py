import httpx

from .config import USER_MANAGEMENT_URL, USER_MANAGEMENT_SERVICE_TOKEN

async def set_worker_manager(user_id: str, manager_id: str | None, action: str = "accept"):
    if not USER_MANAGEMENT_SERVICE_TOKEN:
        return
    headers = {
        "Content-Type": "application/json",
        "X-Service-Token": USER_MANAGEMENT_SERVICE_TOKEN,
    }
    payload = {"user_id": user_id, "manager_id": manager_id, "action": action}
    async with httpx.AsyncClient(follow_redirects=True) as client:
        await client.post(f"{USER_MANAGEMENT_URL}/api/internal/team/accept", json=payload, headers=headers)

async def fetch_admin_ids() -> list[str]:
    if not USER_MANAGEMENT_SERVICE_TOKEN:
        return []
    headers = {"X-Service-Token": USER_MANAGEMENT_SERVICE_TOKEN}
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(f"{USER_MANAGEMENT_URL}/api/internal/admins", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            return [item["id"] for item in data]
        return []
