from fastapi import Depends, Header, HTTPException, status
import httpx

from .config import USER_MANAGEMENT_URL, USER_MANAGEMENT_SERVICE_TOKEN, SERVICE_TOKEN

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            resp = await client.get(f"{USER_MANAGEMENT_URL}/api/users/me", headers={"Authorization": authorization})
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail="Invalid token") from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="User service unavailable") from exc

async def require_service_token(x_service_token: str = Header(None)):
    if not SERVICE_TOKEN or x_service_token != SERVICE_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid service token")

async def internal_service_headers():
    if not USER_MANAGEMENT_SERVICE_TOKEN:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing internal token")
    return {"X-Service-Token": USER_MANAGEMENT_SERVICE_TOKEN}
