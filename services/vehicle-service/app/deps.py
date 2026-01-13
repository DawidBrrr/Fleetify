"""
Authorization dependencies for Vehicle Service.
Validates user token and extracts user context.
"""
from fastapi import Header, HTTPException
import httpx
import os

USER_MANAGEMENT_URL = os.getenv("USER_MANAGEMENT_URL", "http://user-management:8000")


async def get_current_user(authorization: str = Header(...)):
    """
    Validate authorization token and get current user info from user-management service.
    Returns dict with user id, role, and manager_id (for employees).
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{USER_MANAGEMENT_URL}/api/users/me",
                headers={"Authorization": authorization}
            )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user = resp.json()
        
        # Return minimal user context needed for filtering
        return {
            "id": user.get("id"),
            "role": user.get("role", "employee"),
            "manager_id": user.get("manager_id"),  # For employees, their admin's ID
            "email": user.get("email"),
        }
    
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")


def get_owner_id(current_user: dict) -> str:
    """
    Get the owner_id to filter vehicles by.
    - For admins: their own ID (they own the vehicles)
    - For employees: their manager's ID (they see their admin's vehicles)
    """
    if current_user.get("role") == "admin":
        return current_user["id"]
    else:
        # Employee sees vehicles owned by their manager (admin)
        manager_id = current_user.get("manager_id")
        if not manager_id:
            raise HTTPException(
                status_code=403, 
                detail="Employee not assigned to any admin. Contact your administrator."
            )
        return manager_id
