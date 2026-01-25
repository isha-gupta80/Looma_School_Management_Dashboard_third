from typing import Literal
from beanie import Document
from pydantic import EmailStr
from datetime import datetime

Role = Literal["admin", "staff", "viewer"]

class UserDoc(Document):
    username: str
    email: EmailStr
    passwordHash: str
    role: Role
    createdAt: datetime
    lastLogin: datetime | None = None

    class Settings:
        name = "users"
