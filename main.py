from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "platform": "HelixAI",
        "status": "Running"
    }

@app.get("/patients")
def patients():
    return {
        "total_patients": 1000,
        "active_patients": 850
    }

@app.get("/genomics")
def genomics():
    return {
        "genomic_jobs": 5000,
        "completed_jobs": 4500
    }

@app.get("/health")
def health():
    return {
        "service": "healthy"
    }