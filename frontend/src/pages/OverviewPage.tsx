import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Clock3,
  Database,
  Dna,
  HeartPulse,
  RefreshCw,
  Rocket,
  Server,
  ShieldCheck,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { endpoints } from "../lib/api";
import { getSettings } from "../lib/settings";
import {
  Button,
  Card,
  ErrorState,
  formatDate,
  formatDuration,
  LoadingState,
  PageHeader,
  StatusBadge
} from "../components/ui";

function seriesData(series = [] as { values: [number, string][] }[]) {
  const values = series[0]?.values ?? [];
  return values.slice(-35).map(([timestamp, value]) => ({
    time: new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    value: Number(value)
  }));
}

export function OverviewPage() {
  const refreshInterval = getSettings().refreshInterval;
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: endpoints.overview,
    refetchInterval: refreshInterval
  });
  const monitoring = useQuery({
    queryKey: ["monitoring", 60],
    queryFn: () => endpoints.monitoring(60),
    refetchInterval: refreshInterval
  });
  const pipeline = useQuery({
    queryKey: ["jenkins"],
    queryFn: endpoints.jenkins,
    refetchInterval: 5_000
  });
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: endpoints.activity,
    refetchInterval: refreshInterval
  });

  if (overview.isLoading) return <LoadingState label="Connecting to the HelixAI control plane" />;
  if (overview.isError)
    return <ErrorState message={overview.error.message} retry={() => overview.refetch()} />;

  const data = overview.data!;
  const requestRate = seriesData(monitoring.data?.series.request_rate);
  const healthy = data.services.filter((service) => service.status === "healthy").length;
  const failed = data.services.length - healthy;

  return (
    <>
      <PageHeader
        eyebrow="Control plane"
        title="Good morning, operator."
        description="A live view of clinical application health, delivery, and infrastructure."
      >
        <div className="last-updated">
          <span>Last updated</span>
          <strong>{new Date(data.updated_at).toLocaleTimeString()}</strong>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            overview.refetch();
            monitoring.refetch();
            pipeline.refetch();
          }}
          disabled={overview.isFetching}
        >
          <RefreshCw size={15} className={overview.isFetching ? "spin" : ""} /> Refresh
        </Button>
      </PageHeader>

      <section className="metric-grid">
        <Card className="metric-card metric-primary">
          <div className="metric-top">
            <span className="metric-icon">
              <HeartPulse size={19} />
            </span>
            <StatusBadge status={data.status} />
          </div>
          <span className="metric-label">Core platform</span>
          <strong className="metric-value">{healthy}/{data.services.length}</strong>
          <p>{failed ? `${failed} optional integration${failed > 1 ? "s" : ""} need attention` : "All connected systems healthy"}</p>
          <div className="metric-glow" />
        </Card>
        <Card className="metric-card">
          <div className="metric-top">
            <span className="metric-icon violet">
              <Users size={19} />
            </span>
            <span className="trend neutral">Live</span>
          </div>
          <span className="metric-label">Patient records</span>
          <strong className="metric-value">{data.patient_count.toLocaleString()}</strong>
          <p>Stored in PostgreSQL</p>
        </Card>
        <Card className="metric-card">
          <div className="metric-top">
            <span className="metric-icon cyan">
              <Clock3 size={19} />
            </span>
            <span className="trend neutral">v{data.version}</span>
          </div>
          <span className="metric-label">API uptime</span>
          <strong className="metric-value">{formatDuration(data.uptime_seconds)}</strong>
          <p>Since the current service start</p>
        </Card>
        <Card className="metric-card">
          <div className="metric-top">
            <span className="metric-icon green">
              <Rocket size={19} />
            </span>
            <StatusBadge
              status={
                pipeline.data?.status === "available"
                  ? pipeline.data.build?.result ?? "degraded"
                  : "unavailable"
              }
            />
          </div>
          <span className="metric-label">Latest build</span>
          <strong className="metric-value">
            {pipeline.data?.build ? `#${pipeline.data.build.number}` : "—"}
          </strong>
          <p>
            {pipeline.data?.build?.branch ??
              (pipeline.isLoading ? "Checking Jenkins" : "Jenkins data unavailable")}
          </p>
        </Card>
      </section>

      <section className="overview-grid">
        <Card className="chart-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Application traffic</span>
              <h2>API request rate</h2>
            </div>
            <span className="chart-unit">requests / second</span>
          </div>
          {monitoring.data?.status === "available" && requestRate.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestRate}>
                  <defs>
                    <linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4d7cff" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#4d7cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1b2740" strokeDasharray="3 6" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#697795", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={35}
                  />
                  <YAxis
                    tick={{ fill: "#697795", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={34}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0c1424",
                      border: "1px solid #24324d",
                      borderRadius: 12
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6d91ff"
                    strokeWidth={2}
                    fill="url(#requestFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-unavailable">
              <Activity size={22} />
              <strong>Prometheus history is not available</strong>
              <span>The chart will populate automatically when metrics are reachable.</span>
            </div>
          )}
        </Card>

        <Card className="services-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Service mesh</span>
              <h2>Connected systems</h2>
            </div>
            <Link to="/app/monitoring" className="text-link">
              Details <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="service-list">
            {data.services.map((service) => {
              const Icon =
                service.name === "PostgreSQL"
                  ? Database
                  : service.name === "Vault"
                    ? ShieldCheck
                    : service.name === "FastAPI"
                      ? Dna
                      : Server;
              return (
                <div className="service-row" key={service.name}>
                  <span className="service-icon">
                    <Icon size={17} />
                  </span>
                  <div>
                    <strong>{service.name}</strong>
                    <span>
                      {service.latency_ms !== null
                        ? `${service.latency_ms} ms response`
                        : service.detail ?? "No active signal"}
                    </span>
                  </div>
                  <StatusBadge status={service.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="overview-grid lower">
        <Card className="activity-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Audit trail</span>
              <h2>Recent activity</h2>
            </div>
            <Link to="/app/activity" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="timeline">
            {activity.data?.items.length ? (
              activity.data.items.slice(0, 5).map((item) => (
                <div className="timeline-row" key={item.id}>
                  <span className={`timeline-icon tone-${item.status}`}>
                    <Activity size={15} />
                  </span>
                  <div>
                    <strong>{item.message}</strong>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="mini-empty">
                Activity will appear when patient records are created, updated, or deleted.
              </div>
            )}
          </div>
        </Card>
        <Card className="deployment-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Deployment posture</span>
              <h2>Cloud-native runtime</h2>
            </div>
            <Boxes size={20} className="muted-icon" />
          </div>
          <div className="architecture-stack">
            <div>
              <span>01</span>
              <div>
                <strong>FastAPI workload</strong>
                <small>Readiness + liveness probes</small>
              </div>
              <StatusBadge status={data.services[0]?.status ?? "unavailable"} />
            </div>
            <div>
              <span>02</span>
              <div>
                <strong>PostgreSQL persistence</strong>
                <small>Health-aware service dependency</small>
              </div>
              <StatusBadge status={data.services[1]?.status ?? "unavailable"} />
            </div>
            <div>
              <span>03</span>
              <div>
                <strong>Observability plane</strong>
                <small>Prometheus, Grafana, Loki</small>
              </div>
              <StatusBadge status={data.services[2]?.status ?? "unavailable"} />
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
