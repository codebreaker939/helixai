import time

from fastapi import FastAPI, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from pydantic import BaseModel
from models import Base
from database import engine
from database import SessionLocal
from models import Patient

app = FastAPI()
Base.metadata.create_all(bind=engine)

REQUEST_COUNT = Counter(
    "helixai_http_requests_total",
    "Total HTTP requests handled by HelixAI.",
    ["method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "helixai_http_request_duration_seconds",
    "HTTP request latency for HelixAI.",
    ["method", "path"],
)


@app.middleware("http")
async def collect_metrics(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start

    path = request.scope.get("route").path if request.scope.get("route") else request.url.path
    REQUEST_COUNT.labels(request.method, path, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, path).observe(duration)

    return response


class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    disease: str


@app.get("/")
def home():
    return {
        "platform": "HelixAI",
        "status": "Running"
    }


@app.get("/health")
def health():
    return {
        "service": "healthy"
    }


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/patients")
def get_patients():

    db = SessionLocal()

    patients = db.query(Patient).all()

    result = []

    for p in patients:
        result.append({
            "id": p.id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "disease": p.disease
        })

    db.close()

    return result


@app.post("/patients")
def create_patient(patient: PatientCreate):

    db = SessionLocal()

    new_patient = Patient(
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        disease=patient.disease
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    patient_id = new_patient.id

    db.close()

    return {
        "message": "Patient created successfully",
        "id": patient_id
    }
