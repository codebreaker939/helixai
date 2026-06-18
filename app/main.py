import base64
import json
import os
import ssl
import tempfile
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

import yaml
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import asc, desc, func, or_, text

from database import SessionLocal, engine
from models import Base, Patient

app = FastAPI(
    title="HelixAI API",
    version="2.0.0",
    description="Clinical data and operational APIs for the HelixAI platform.",
)
Base.metadata.create_all(bind=engine)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
PATIENT_RECORDS = Gauge(
    "helixai_patient_records",
    "Current number of patient records managed by HelixAI.",
)
APP_STARTED_AT = time.time()
ACTIVITY = deque(maxlen=100)
JENKINS_STATUS_CACHE: dict | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def record_activity(kind: str, message: str, status: str = "success") -> None:
    ACTIVITY.appendleft(
        {
            "id": f"{int(time.time() * 1000)}-{len(ACTIVITY)}",
            "kind": kind,
            "message": message,
            "status": status,
            "timestamp": utc_now(),
        }
    )


@app.middleware("http")
async def collect_metrics(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        path = request.url.path
        REQUEST_COUNT.labels(request.method, path, "500").inc()
        REQUEST_LATENCY.labels(request.method, path).observe(time.perf_counter() - start)
        raise

    duration = time.perf_counter() - start
    route = request.scope.get("route")
    path = route.path if route else request.url.path
    REQUEST_COUNT.labels(request.method, path, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, path).observe(duration)
    response.headers["X-Response-Time"] = f"{duration:.4f}"
    return response


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    age: int = Field(ge=0, le=130)
    gender: str = Field(min_length=1, max_length=40)
    disease: str = Field(min_length=2, max_length=160)


class PatientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, min_length=1, max_length=40)
    disease: str | None = Field(default=None, min_length=2, max_length=160)


class PatientRead(PatientCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


def serialize_patient(patient: Patient) -> dict:
    return PatientRead.model_validate(patient).model_dump()


def request_json(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    timeout: float = 2.5,
    context: ssl.SSLContext | None = None,
) -> dict | list:
    request = UrlRequest(url, headers=headers or {"Accept": "application/json"})
    with urlopen(request, timeout=timeout, context=context) as response:
        return json.loads(response.read().decode("utf-8"))


def service_check(
    name: str,
    url: str | None,
    *,
    headers: dict[str, str] | None = None,
    timeout: float = 2.5,
) -> dict:
    if not url:
        return {"name": name, "status": "unconfigured", "latency_ms": None}
    started = time.perf_counter()
    try:
        request = UrlRequest(url, headers=headers or {}, method="GET")
        with urlopen(request, timeout=timeout) as response:
            status = "healthy" if response.status < 400 else "degraded"
        return {
            "name": name,
            "status": status,
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
        }
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        return {
            "name": name,
            "status": "unavailable",
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
            "detail": str(exc.reason if isinstance(exc, URLError) else exc),
        }


@app.get("/", tags=["Platform"])
def home():
    return {"platform": "HelixAI", "status": "Running", "version": app.version}


@app.get("/health", tags=["Platform"])
def health():
    database = "healthy"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        database = "unavailable"
    status_code = 200 if database == "healthy" else 503
    return Response(
        content=json.dumps({"service": "healthy", "database": database}),
        media_type="application/json",
        status_code=status_code,
    )


@app.get("/metrics", tags=["Platform"])
def metrics():
    with SessionLocal() as db:
        PATIENT_RECORDS.set(db.query(func.count(Patient.id)).scalar() or 0)
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/patients", response_model=list[PatientRead], tags=["Patients"])
def get_patients(
    response: Response,
    search: str | None = Query(default=None, max_length=120),
    gender: str | None = Query(default=None, max_length=40),
    sort_by: Literal["id", "full_name", "age", "gender", "disease"] = "id",
    sort_order: Literal["asc", "desc"] = "desc",
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
):
    with SessionLocal() as db:
        query = db.query(Patient)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Patient.full_name.ilike(pattern),
                    Patient.disease.ilike(pattern),
                    Patient.gender.ilike(pattern),
                )
            )
        if gender:
            query = query.filter(func.lower(Patient.gender) == gender.lower())
        total = query.count()
        sort_column = getattr(Patient, sort_by)
        query = query.order_by(
            asc(sort_column) if sort_order == "asc" else desc(sort_column)
        )
        patients = query.offset(offset).limit(limit).all()
        response.headers["X-Total-Count"] = str(total)
        response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
        return patients


@app.get("/patients/{patient_id}", response_model=PatientRead, tags=["Patients"])
def get_patient(patient_id: int):
    with SessionLocal() as db:
        patient = db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient


@app.post("/patients", status_code=201, tags=["Patients"])
def create_patient(patient: PatientCreate):
    with SessionLocal() as db:
        new_patient = Patient(**patient.model_dump())
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        record_activity("patient", f"Patient record created for {new_patient.full_name}")
        return {
            "message": "Patient created successfully",
            "id": new_patient.id,
            "patient": serialize_patient(new_patient),
        }


@app.put("/patients/{patient_id}", response_model=PatientRead, tags=["Patients"])
def update_patient(patient_id: int, changes: PatientUpdate):
    with SessionLocal() as db:
        patient = db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        for field, value in changes.model_dump(exclude_unset=True).items():
            setattr(patient, field, value)
        db.commit()
        db.refresh(patient)
        record_activity("patient", f"Patient record updated for {patient.full_name}")
        return patient


@app.delete("/patients/{patient_id}", status_code=204, tags=["Patients"])
def delete_patient(patient_id: int):
    with SessionLocal() as db:
        patient = db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        name = patient.full_name
        db.delete(patient)
        db.commit()
        record_activity("patient", f"Patient record deleted for {name}", "warning")
    return Response(status_code=204)


@app.get("/api/ops/overview", tags=["Operations"])
def operations_overview():
    database = service_check("PostgreSQL", None)
    started = time.perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = {
            "name": "PostgreSQL",
            "status": "healthy",
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
        }
    except Exception as exc:
        database = {
            "name": "PostgreSQL",
            "status": "unavailable",
            "latency_ms": None,
            "detail": str(exc),
        }

    checks = [
        {"name": "FastAPI", "status": "healthy", "latency_ms": 0},
        database,
        service_check("Prometheus", os.getenv("PROMETHEUS_URL", "http://prometheus:9090/-/healthy")),
        service_check("Grafana", os.getenv("GRAFANA_URL", "http://grafana:3000/api/health")),
        service_check("Loki", os.getenv("LOKI_URL", "http://loki:3100/ready")),
        service_check("Vault", os.getenv("VAULT_URL", "http://vault:8200/v1/sys/health")),
        service_check(
            "Jenkins",
            f"{os.getenv('JENKINS_URL', 'http://jenkins:8080').rstrip('/')}/api/json",
            headers=jenkins_headers(),
            timeout=10,
        ),
    ]
    with SessionLocal() as db:
        patient_count = db.query(func.count(Patient.id)).scalar() or 0
    return {
        "status": "healthy"
        if all(item["status"] == "healthy" for item in checks[:2])
        else "degraded",
        "environment": os.getenv("HELIXAI_ENVIRONMENT", "development"),
        "version": app.version,
        "uptime_seconds": round(time.time() - APP_STARTED_AT),
        "patient_count": patient_count,
        "services": checks,
        "updated_at": utc_now(),
    }


@app.get("/api/ops/activity", tags=["Operations"])
def operations_activity(limit: int = Query(default=20, ge=1, le=100)):
    return {"items": list(ACTIVITY)[:limit], "updated_at": utc_now()}


@app.get("/api/ops/monitoring", tags=["Operations"])
def monitoring_snapshot(minutes: int = Query(default=60, ge=5, le=1440)):
    prometheus = os.getenv("PROMETHEUS_URL", "http://prometheus:9090").rstrip("/")
    queries = {
        "request_rate": "sum(rate(helixai_http_requests_total[5m]))",
        "error_rate": 'sum(rate(helixai_http_requests_total{status_code=~"5.."}[5m]))',
        "latency_p95": "histogram_quantile(0.95, sum(rate(helixai_http_request_duration_seconds_bucket[5m])) by (le))",
        "api_up": 'up{job="helixai-api"}',
        "active_instances": 'sum(up{job="helixai-api"})',
        "patient_records": "helixai_patient_records",
    }
    now = time.time()
    step = max(15, int((minutes * 60) / 120))
    series = {}
    errors = []
    for key, query in queries.items():
        params = urlencode(
            {"query": query, "start": now - minutes * 60, "end": now, "step": step}
        )
        try:
            payload = request_json(f"{prometheus}/api/v1/query_range?{params}")
            series[key] = payload.get("data", {}).get("result", [])
        except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
            series[key] = []
            errors.append(str(exc))
    return {
        "status": "available" if len(errors) < len(queries) else "unavailable",
        "range_minutes": minutes,
        "series": series,
        "updated_at": utc_now(),
        "detail": errors[0] if errors else None,
    }


def jenkins_headers() -> dict[str, str]:
    username = os.getenv("JENKINS_USERNAME")
    token = os.getenv("JENKINS_API_TOKEN")
    headers = {"Accept": "application/json"}
    if username and token:
        encoded = base64.b64encode(f"{username}:{token}".encode()).decode()
        headers["Authorization"] = f"Basic {encoded}"
    return headers


@app.get("/api/ops/jenkins", tags=["Operations"])
def jenkins_status():
    global JENKINS_STATUS_CACHE
    base_url = os.getenv("JENKINS_URL", "http://jenkins:8080").rstrip("/")
    job = os.getenv("JENKINS_JOB", "helixai")
    api_url = (
        f"{base_url}/job/{job}/api/json?"
        + urlencode(
            {
                "tree": (
                    "lastBuild[number,url,result,building,duration,timestamp,displayName,"
                    "description,actions[causes[*],lastBuiltRevision[SHA1,branch[*]]],"
                    "changeSet[items[msg,commitId,author[fullName]]]],"
                    "builds[number,url,result,building,duration,timestamp]{0,10}"
                )
            }
        )
    )
    try:
        job_data = request_json(api_url, headers=jenkins_headers(), timeout=10)
        build = job_data.get("lastBuild")
        if not build:
            response = {
                "status": "available",
                "build": None,
                "history": [],
                "environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "not reported"),
                "detail": "The Jenkins job exists but has not run yet.",
                "updated_at": utc_now(),
            }
            JENKINS_STATUS_CACHE = response
            return response
        wf_url = (
            f"{base_url}/job/{job}/{build['number']}/wfapi/describe"
        )
        try:
            workflow = request_json(wf_url, headers=jenkins_headers(), timeout=3.5)
        except Exception:
            workflow = {"stages": []}
        actions = build.get("actions", [])
        revision = next(
            (action.get("lastBuiltRevision") for action in actions if action.get("lastBuiltRevision")),
            {},
        )
        causes = [
            cause
            for action in actions
            for cause in action.get("causes", [])
        ]
        changes = build.get("changeSet", {}).get("items", [])
        response = {
            "status": "available",
            "environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "not reported"),
            "build": {
                "number": build.get("number"),
                "url": build.get("url"),
                "result": "RUNNING" if build.get("building") else build.get("result"),
                "building": build.get("building", False),
                "duration_ms": build.get("duration", 0),
                "started_at": datetime.fromtimestamp(
                    build.get("timestamp", 0) / 1000, timezone.utc
                ).isoformat()
                if build.get("timestamp")
                else None,
                "commit_id": revision.get("SHA1")
                or (changes[0].get("commitId") if changes else None),
                "branch": (
                    revision.get("branch", [{}])[0].get("name")
                    if revision.get("branch")
                    else None
                ),
                "commit_message": changes[0].get("msg") if changes else None,
                "triggered_by": causes[0].get("shortDescription") if causes else None,
                "stages": workflow.get("stages", []),
            },
            "history": [
                {
                    "number": item.get("number"),
                    "url": item.get("url"),
                    "result": "RUNNING" if item.get("building") else item.get("result"),
                    "duration_ms": item.get("duration", 0),
                    "started_at": datetime.fromtimestamp(
                        item.get("timestamp", 0) / 1000, timezone.utc
                    ).isoformat()
                    if item.get("timestamp")
                    else None,
                }
                for item in job_data.get("builds", [])
            ],
            "updated_at": utc_now(),
        }
        JENKINS_STATUS_CACHE = response
        return response
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError) as exc:
        detail = str(exc.reason if isinstance(exc, URLError) else exc)
        if JENKINS_STATUS_CACHE:
            return {
                **JENKINS_STATUS_CACHE,
                "detail": f"Showing the last Jenkins response while reconnecting: {detail}",
                "updated_at": utc_now(),
            }
        return {
            "status": "unavailable",
            "build": None,
            "history": [],
            "environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "not reported"),
            "detail": detail,
            "updated_at": utc_now(),
        }


@app.get("/api/ops/jenkins/log", tags=["Operations"])
def jenkins_log():
    base_url = os.getenv("JENKINS_URL", "http://jenkins:8080").rstrip("/")
    job = os.getenv("JENKINS_JOB", "helixai")
    url = f"{base_url}/job/{job}/lastBuild/consoleText"
    try:
        request = UrlRequest(url, headers=jenkins_headers())
        with urlopen(request, timeout=4) as response:
            content = response.read(250_000).decode("utf-8", errors="replace")
        return {"status": "available", "content": content, "updated_at": utc_now()}
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        return {"status": "unavailable", "content": "", "detail": str(exc), "updated_at": utc_now()}


def kubernetes_request(path: str) -> dict:
    host = os.getenv("KUBERNETES_SERVICE_HOST")
    port = os.getenv("KUBERNETES_SERVICE_PORT", "443")
    token_path = Path("/var/run/secrets/kubernetes.io/serviceaccount/token")
    ca_path = Path("/var/run/secrets/kubernetes.io/serviceaccount/ca.crt")
    if host and token_path.exists():
        token = token_path.read_text().strip()
        context = ssl.create_default_context(cafile=str(ca_path) if ca_path.exists() else None)
        return request_json(
            f"https://{host}:{port}{path}",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=4,
            context=context,
        )

    kubeconfig_path = Path(os.getenv("KUBECONFIG", "/root/.kube/config"))
    if not kubeconfig_path.exists():
        raise RuntimeError("Neither an in-cluster service account nor a local kubeconfig is available")

    config = yaml.safe_load(kubeconfig_path.read_text())
    current_context = config.get("current-context")
    context_entry = next(
        item for item in config.get("contexts", []) if item.get("name") == current_context
    )["context"]
    cluster = next(
        item for item in config.get("clusters", []) if item.get("name") == context_entry["cluster"]
    )["cluster"]
    user = next(
        item for item in config.get("users", []) if item.get("name") == context_entry["user"]
    )["user"]

    server = cluster["server"]
    host_override = os.getenv("KUBERNETES_HOST_OVERRIDE")
    if host_override:
        from urllib.parse import urlsplit, urlunsplit

        parsed = urlsplit(server)
        override_netloc = (
            host_override
            if ":" in host_override
            else f"{host_override}:{parsed.port}"
        )
        server = urlunsplit(
            (parsed.scheme, override_netloc, parsed.path, parsed.query, parsed.fragment)
        )

    with tempfile.NamedTemporaryFile() as ca_file, tempfile.NamedTemporaryFile() as cert_file, tempfile.NamedTemporaryFile() as key_file:
        ca_file.write(base64.b64decode(cluster["certificate-authority-data"]))
        cert_file.write(base64.b64decode(user["client-certificate-data"]))
        key_file.write(base64.b64decode(user["client-key-data"]))
        ca_file.flush()
        cert_file.flush()
        key_file.flush()
        context = ssl.create_default_context(cafile=ca_file.name)
        context.check_hostname = False
        context.load_cert_chain(certfile=cert_file.name, keyfile=key_file.name)
        return request_json(
            f"{server.rstrip('/')}{path}",
            headers={"Accept": "application/json"},
            timeout=6,
            context=context,
        )


@app.get("/api/ops/kubernetes", tags=["Operations"])
def kubernetes_status():
    namespace = os.getenv("KUBERNETES_NAMESPACE", "default")
    try:
        deployments = kubernetes_request(f"/apis/apps/v1/namespaces/{namespace}/deployments")
        pods = kubernetes_request(f"/api/v1/namespaces/{namespace}/pods")
        services = kubernetes_request(f"/api/v1/namespaces/{namespace}/services")
        return {
            "status": "available",
            "namespace": namespace,
            "deployments": [
                {
                    "name": item["metadata"]["name"],
                    "replicas": item.get("status", {}).get("replicas", 0),
                    "ready_replicas": item.get("status", {}).get("readyReplicas", 0),
                    "unavailable_replicas": item.get("status", {}).get("unavailableReplicas", 0),
                    "images": [
                        container.get("image")
                        for container in item.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [])
                    ],
                    "created_at": item["metadata"].get("creationTimestamp"),
                }
                for item in deployments.get("items", [])
            ],
            "pods": [
                {
                    "name": item["metadata"]["name"],
                    "phase": item.get("status", {}).get("phase", "Unknown"),
                    "ready": all(
                        status.get("ready", False)
                        for status in item.get("status", {}).get("containerStatuses", [])
                    ),
                    "restarts": sum(
                        status.get("restartCount", 0)
                        for status in item.get("status", {}).get("containerStatuses", [])
                    ),
                    "node": item.get("spec", {}).get("nodeName"),
                    "created_at": item["metadata"].get("creationTimestamp"),
                }
                for item in pods.get("items", [])
            ],
            "services": [
                {
                    "name": item["metadata"]["name"],
                    "type": item.get("spec", {}).get("type"),
                    "cluster_ip": item.get("spec", {}).get("clusterIP"),
                    "ports": item.get("spec", {}).get("ports", []),
                }
                for item in services.get("items", [])
            ],
            "updated_at": utc_now(),
        }
    except Exception as exc:
        return {
            "status": "unavailable",
            "namespace": namespace,
            "deployments": [],
            "pods": [],
            "services": [],
            "detail": str(exc),
            "updated_at": utc_now(),
        }


@app.get("/api/ops/security", tags=["Operations"])
def security_status():
    vault_url = os.getenv("VAULT_URL", "http://vault:8200").rstrip("/")
    try:
        payload = request_json(f"{vault_url}/v1/sys/health", timeout=3)
        return {
            "status": "available",
            "vault": {
                "initialized": payload.get("initialized"),
                "sealed": payload.get("sealed"),
                "standby": payload.get("standby"),
                "version": payload.get("version"),
                "cluster_name": payload.get("cluster_name"),
            },
            "configuration": {
                "database_url": "configured" if os.getenv("DATABASE_URL") else "default",
                "jenkins_credentials": "configured"
                if os.getenv("JENKINS_USERNAME") and os.getenv("JENKINS_API_TOKEN")
                else "not configured",
                "cors_origins": len(cors_origins),
            },
            "updated_at": utc_now(),
        }
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        return {
            "status": "unavailable",
            "vault": None,
            "configuration": {
                "database_url": "configured" if os.getenv("DATABASE_URL") else "default",
                "jenkins_credentials": "configured"
                if os.getenv("JENKINS_USERNAME") and os.getenv("JENKINS_API_TOKEN")
                else "not configured",
                "cors_origins": len(cors_origins),
            },
            "detail": str(exc),
            "updated_at": utc_now(),
        }
