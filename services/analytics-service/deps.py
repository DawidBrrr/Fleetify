from fastapi import Header, HTTPException, status
import httpx

from config import USER_MANAGEMENT_URL

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        # For development/testing if no auth header, maybe return a default user or raise error?
        # The user asked for data to belong to "some user".
        # If I raise error, the frontend might break if it doesn't send token correctly yet.
        # But let's try to be correct.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{USER_MANAGEMENT_URL}/api/users/me",
                headers={"Authorization": authorization}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                )
            return response.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="User management service unavailable",
            )
