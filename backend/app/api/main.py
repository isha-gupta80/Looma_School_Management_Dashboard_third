from fastapi import APIRouter, Depends
from app.api.routes import auth, schools, user
from app.api.routes import scans
from app.core.deps import get_current_session


api_router = APIRouter()
api_router.include_router(schools.router, prefix="/schools", dependencies=[Depends(get_current_session)], tags=["schools"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["user"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
