from functools import wraps
from fastapi import HTTPException, status
from app.models.user import User


def require_role(*roles: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = None, **kwargs):
            if current_user and current_user.role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{current_user.role}' not authorized. Required: {', '.join(roles)}",
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator


def check_role(user: User, *roles: str):
    if user.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user.role}' not authorized. Required: {', '.join(roles)}",
        )
