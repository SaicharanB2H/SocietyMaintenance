from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, complaints, notices, settings as settings_router, dashboard

app = FastAPI(
    title="Society Maintenance Tracker API",
    description="API for apartment maintenance tracking, role-based complaint logging, and notice boards.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for simple stage/production setups; can customize using settings.FRONTEND_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(notices.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "app": "Society Maintenance Tracker API",
        "status": "healthy",
        "docs": "/docs"
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
