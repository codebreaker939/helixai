from fastapi import FastAPI
from database import SessionLocal
from models import Patient

app = FastAPI()

@app.get("/")
def home():
    return {
        "platform": "HelixAI",
        "status": "Running"
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