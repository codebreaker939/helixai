export type ServiceState = "healthy" | "degraded" | "unavailable" | "unconfigured";

export interface Patient {
  id: number;
  full_name: string;
  age: number;
  gender: string;
  disease: string;
}

export type PatientInput = Omit<Patient, "id">;

export interface ServiceCheck {
  name: string;
  status: ServiceState;
  latency_ms: number | null;
  detail?: string;
}

export interface Overview {
  status: "healthy" | "degraded";
  environment: string;
  version: string;
  uptime_seconds: number;
  patient_count: number;
  services: ServiceCheck[];
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  kind: string;
  message: string;
  status: string;
  timestamp: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
  updated_at: string;
}

export interface PrometheusSeries {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface MonitoringResponse {
  status: "available" | "unavailable";
  range_minutes: number;
  series: Record<string, PrometheusSeries[]>;
  updated_at: string;
  detail?: string | null;
}

export interface JenkinsStage {
  id?: string;
  name: string;
  status: string;
  durationMillis?: number;
  startTimeMillis?: number;
  error?: { message?: string };
}

export interface JenkinsResponse {
  status: "available" | "unavailable";
  environment: string;
  build: null | {
    number: number;
    url: string;
    result: string;
    building: boolean;
    duration_ms: number;
    started_at: string | null;
    commit_id: string | null;
    branch: string | null;
    commit_message: string | null;
    triggered_by: string | null;
    stages: JenkinsStage[];
  };
  history: {
    number: number;
    url: string;
    result: string;
    duration_ms: number;
    started_at: string | null;
  }[];
  detail?: string;
  updated_at: string;
}

export interface JenkinsLog {
  status: "available" | "unavailable";
  content: string;
  detail?: string;
  updated_at: string;
}

export interface KubernetesResponse {
  status: "available" | "unavailable";
  namespace: string;
  deployments: {
    name: string;
    replicas: number;
    ready_replicas: number;
    unavailable_replicas: number;
    images: string[];
    created_at: string;
  }[];
  pods: {
    name: string;
    phase: string;
    ready: boolean;
    restarts: number;
    node?: string;
    created_at: string;
  }[];
  services: {
    name: string;
    type: string;
    cluster_ip: string;
    ports: { port: number; targetPort: number; protocol: string }[];
  }[];
  detail?: string;
  updated_at: string;
}

export interface SecurityResponse {
  status: "available" | "unavailable";
  vault: null | {
    initialized: boolean;
    sealed: boolean;
    standby: boolean;
    version: string;
    cluster_name: string;
  };
  configuration: {
    database_url: string;
    jenkins_credentials: string;
    cors_origins: number;
  };
  detail?: string;
  updated_at: string;
}

export interface OpenApiDocument {
  info: { title: string; version: string; description?: string };
  paths: Record<
    string,
    Record<
      string,
      {
        tags?: string[];
        summary?: string;
        description?: string;
        responses?: Record<string, unknown>;
      }
    >
  >;
}
