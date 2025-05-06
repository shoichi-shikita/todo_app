from email import message
from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import User, Task, TaskUpdate  # ← 追加！
from database import init_db, get_session
from auth import hash_password, verify_password, create_access_token, decode_access_token
from typing import List, Any
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from ai_utils import parse_natural_task
# from ai_utils import classify_priority
from ai_utils import suggest_schedule

app = FastAPI()
init_db()
openai.api_key = os.getenv("OPENAI_API_KEY")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React開発サーバーを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NaturalTask(BaseModel):
    message: str

class ParsedTask(BaseModel):
    title: str
    deadline: str
    priority: str

# curl -X PUT "http://127.0.0.1:8000/tasks/d88438d3-94ff-4dc3-b0e1-4491ba4f1753" ^
#   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUZXN0IiwiZXhwIjoxNzQ2MzYyOTMwfQ.zkIyOC6X7UJbnqtGRoWFYBOr_NQho2AjBQCv9UTBbAY" ^
#   -H "Content-Type: application/json" ^
#   -d "{\"status\": \"完了\", \"description\": \"24hスーパーに変更\"}"



@app.post("/register")
def register(form: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.username == form.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=form.username, password_hash=hash_password(form.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "User registered"}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form.username)).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me")
def read_me(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    username = payload.get("sub")
    user = session.exec(select(User).where(User.username == username)).first()
    return {"id": user.id, "username": user.username}

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    username = payload.get("sub")
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(task: Task, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    task.owner_id = current_user.id
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@app.get("/tasks", response_model=List[Task])
def get_tasks(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.owner_id == current_user.id)).all()
    return tasks

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, updated: TaskUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    task = session.exec(select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if updated.title is not None:
        task.title = updated.title
    if updated.description is not None:
        task.description = updated.description
    if updated.status is not None:
        task.status = updated.status
    if updated.deadline is not None:
        task.deadline = updated.deadline
    if updated.priority is not None:
        task.priority = updated.priority

    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    task = session.exec(select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()
    return {"detail": "Task deleted"}

@app.post("/parse_task", response_model=ParsedTask)
async def parse_task(task: NaturalTask):
    try:
        parsed = parse_natural_task(task.message)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# @app.post("/classify_priority")
# async def classify_priority_endpoint(task: NaturalTask):
#     try:
#         priority = classify_priority(task.message)
#         return {"priority": priority}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/suggest_schedule")
async def suggest_schedule_api(tasks: List[dict], current_user: User = Depends(get_current_user)):
    try:
        suggestions = suggest_schedule(tasks)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

