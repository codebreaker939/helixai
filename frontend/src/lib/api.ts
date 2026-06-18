import axios, { AxiosError } from "axios";
import type {
  ActivityResponse,
  JenkinsLog,
  JenkinsResponse,
  KubernetesResponse,
  MonitoringResponse,
  OpenApiDocument,
  Overview,
  Patient,
  PatientInput,
  SecurityResponse
} from "../types";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const apiRoot = configuredBaseUrl.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: apiRoot || "/",
  timeout: 12_000,
  headers: { Accept: "application/json" }
});

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { msg?: string }[] }>) => {
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((entry) => entry.msg).filter(Boolean).join(", ")
          : error.message || "The request could not be completed.";
    return Promise.reject(new ApiError(message, error.response?.status));
  }
);

export const endpoints = {
  overview: async () => (await api.get<Overview>("/api/ops/overview")).data,
  activity: async () => (await api.get<ActivityResponse>("/api/ops/activity")).data,
  monitoring: async (minutes: number) =>
    (await api.get<MonitoringResponse>("/api/ops/monitoring", { params: { minutes } })).data,
  jenkins: async () => (await api.get<JenkinsResponse>("/api/ops/jenkins")).data,
  jenkinsLog: async () => (await api.get<JenkinsLog>("/api/ops/jenkins/log")).data,
  kubernetes: async () => (await api.get<KubernetesResponse>("/api/ops/kubernetes")).data,
  security: async () => (await api.get<SecurityResponse>("/api/ops/security")).data,
  openapi: async () => (await api.get<OpenApiDocument>("/openapi.json")).data,
  patients: async (params: Record<string, string | number | undefined>) => {
    const response = await api.get<Patient[]>("/patients", { params });
    return {
      items: response.data,
      total: Number(response.headers["x-total-count"] ?? response.data.length)
    };
  },
  patient: async (id: number) => (await api.get<Patient>(`/patients/${id}`)).data,
  createPatient: async (input: PatientInput) =>
    (await api.post<{ id: number; patient: Patient }>("/patients", input)).data,
  updatePatient: async (id: number, input: PatientInput) =>
    (await api.put<Patient>(`/patients/${id}`, input)).data,
  deletePatient: async (id: number) => api.delete(`/patients/${id}`)
};

export const externalUrls = {
  grafana: import.meta.env.VITE_GRAFANA_URL || "http://localhost:3001",
  prometheus: import.meta.env.VITE_PROMETHEUS_URL || "http://localhost:9091",
  jenkins: import.meta.env.VITE_JENKINS_PUBLIC_URL || "http://localhost:8081",
  vault: import.meta.env.VITE_VAULT_URL || "http://localhost:8200",
  docs: `${apiRoot || ""}/docs`
};
