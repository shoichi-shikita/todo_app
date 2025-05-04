# models.py

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
import uuid

class User(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    username: str
    password_hash: str

# ↓ ここから追加
class Task(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str = ""
    status: str = "未着手"
    deadline: Optional[str] = None
    owner_id: str = Field(foreign_key="user.id")

class TaskUpdate(SQLModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[str]
    deadline: Optional[str]