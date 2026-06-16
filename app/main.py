from fastapi import FastAPI
from pydantic import BaseModel

from database import SessionLocal
from models import Patient

app = FastAPI()


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