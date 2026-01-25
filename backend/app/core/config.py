from typing import List
from fastapi import FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str
    MONGODB_DB_NAME: str
    # QR scan ingestion / storage (kept compatible with the older looma-feedback project)
    # The earlier project stored scans in the Mongo database named `looma-devices`, collection `device_scans`.
    # We keep those defaults so existing scan data remains visible without moving collections.
    SCANS_DB_NAME: str = "looma-devices"
    SCANS_COLLECTION_NAME: str = "device_scans"
    ALLOWED_ORIGINS: List[str] = ["*"]
    SESSION_EXPIRES_DAYS: int = 7
    COOKIE_SECURE: bool = False # set to true on production
    SESSION_COOKIE_NAME: str = "session_token"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
