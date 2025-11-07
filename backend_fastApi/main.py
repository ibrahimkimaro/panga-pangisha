from fastapi import FastAPI
from sqladmin import Admin
from database import engine, create_db_and_tables
from admin.admin_panel import AdminUserAdmin, UserAdmin, HouseAdmin
from routers.user import router
from routers.houses import house_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Panga Pangisha Backend")

# Create tables on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Mount SQLAdmin
admin = Admin(app=app, engine=engine)
admin.add_view(AdminUserAdmin)
admin.add_view(UserAdmin)
admin.add_view(HouseAdmin)

# Mount authentication routes
app.include_router(router)
app.include_router(house_router)


origins = [
    "http://localhost:5173",  # Vite
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
