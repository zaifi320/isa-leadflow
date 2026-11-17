import sys
import os
sys.path.append(os.path.dirname(__file__))

from database import engine, SessionLocal
from sqlalchemy import text
import models
from auth import hash_password

INITIAL_USERS = [
    {
        "id": 1,
        "name": "Huzaifa Saeed",
        "email": "huzaifa@isaleads.com",
        "role": "Admin",
        "department": "Executive / Leadership",
        "avatar_color": "#2563eb",
        "password": "Admin@123",
        "is_active": True
    },
    {
        "id": 2,
        "name": "Adam Smith",
        "email": "adam.smith@isaleads.com",
        "role": "Agent",
        "department": "ISA Sales Team",
        "avatar_color": "#10b981",
        "password": "Lead@2026",
        "is_active": True
    },
    {
        "id": 3,
        "name": "Sarah Johnson",
        "email": "sarah.j@isaleads.com",
        "role": "Agent",
        "department": "ISA Sales Team",
        "avatar_color": "#8b5cf6",
        "password": "Lead@2026",
        "is_active": True
    },
    {
        "id": 4,
        "name": "Mike Davis",
        "email": "mike.davis@isaleads.com",
        "role": "Agent",
        "department": "ISA Sales Team",
        "avatar_color": "#f59e0b",
        "password": "Lead@2026",
        "is_active": True
    },
    {
        "id": 5,
        "name": "Jessica Brown",
        "email": "jessica.b@isaleads.com",
        "role": "Manager",
        "department": "Client Acquisition",
        "avatar_color": "#06b6d4",
        "password": "Lead@2026",
        "is_active": True
    },
    {
        "id": 6,
        "name": "David Wilson",
        "email": "david.w@isaleads.com",
        "role": "Agent",
        "department": "ISA Sales Team",
        "avatar_color": "#6366f1",
        "password": "Lead@2026",
        "is_active": True
    },
    {
        "id": 7,
        "name": "Emily Clark",
        "email": "emily.c@isaleads.com",
        "role": "Agent",
        "department": "ISA Sales Team",
        "avatar_color": "#ec4899",
        "password": "Lead@2026",
        "is_active": True
    },
    {
        "id": 8,
        "name": "Chris Brown",
        "email": "chris.b@isaleads.com",
        "role": "Agent",
        "department": "ISA Sales Team",
        "avatar_color": "#14b8a6",
        "password": "Lead@2026",
        "is_active": True
    },
]

def ensure_users_and_passwords():
    db = SessionLocal()
    try:
        for u_data in INITIAL_USERS:
            user = db.query(models.User).filter(models.User.email == u_data["email"]).first()
            if not user:
                user = models.User(
                    id=u_data["id"],
                    name=u_data["name"],
                    email=u_data["email"],
                    role=u_data["role"],
                    department=u_data["department"],
                    avatar_color=u_data["avatar_color"],
                    password_hash=hash_password(u_data["password"]),
                    is_active=u_data["is_active"],
                    is_online=False
                )
                db.add(user)
                print(f"[Added User] {u_data['name']} ({u_data['email']})")
            else:
                user.password_hash = hash_password(u_data["password"])
                user.is_active = True
                user.role = u_data["role"]
                user.department = u_data["department"]
                print(f"[Updated User] {u_data['name']} ({u_data['email']})")

        db.commit()
        print("[Auth Setup] All 8 users verified with credentials.")
    finally:
        db.close()

if __name__ == "__main__":
    ensure_users_and_passwords()
