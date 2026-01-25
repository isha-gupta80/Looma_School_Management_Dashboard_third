from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.deps import get_current_user
from app.core.exceptions import InvalidCredentials
from app.schemas.auth import UserLoginUsername
from app.schemas.user import UserOut, UserUpdatePassword
from app.services.auth import login as login_svc, logout as logout_svc, update_user_password as update_user_password_svc
from app.core.config import settings


router = APIRouter()


@router.post("/login")
async def login(user_data: UserLoginUsername, response: Response):
    result = await login_svc(user_data.username, user_data.password)

    if not result:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    user, token, expires = result
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.SESSION_EXPIRES_DAYS * 24 * 60 * 60,
        path="/",
    )

    user_out = UserOut(**user.model_dump())
    return {"user": user_out, "token": token}


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        await logout_svc(token)
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    return {"detail": "success"}

@router.get("/me")
async def get_me(current_user: UserOut = Depends(get_current_user)):
    return current_user

@router.patch("/change_password", status_code=204)
async def update_password(password_data: UserUpdatePassword, current_user: UserOut = Depends(get_current_user)):
    try:
        await update_user_password_svc(current_user.id, password_data.old_password, password_data.new_password)
    except InvalidCredentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
