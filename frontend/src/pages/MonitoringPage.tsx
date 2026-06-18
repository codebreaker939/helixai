import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Gauge, RefreshCw, Server, Timer, TriangleAlert } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useState } from "react";
import { endpoints, externalUrls } from "../lib/api";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "../components/ui";

function chartData(series?: { values: [number, string][] }[]) {
  return (series?.[0]?.values ?? []).map(([timestamp, value]) => ({
    time: new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: Number(value)
  }));
}

function latest(series?: { values: [number, string][] }[]) {
  const values = series?.[0]?.values;
  return Number(values?.[values.length - 1]?.[1] ?? 0);
}

export function MonitoringPage() {
  const [range, setRange] = useState(60);
  const monitoring = useQuery({
    queryKey: ["monitoring", range],
    queryFn: () => endpoints.monitoring(range),
    refetchInterval: 15_000
  });
  const series = monitoring.data?.series;
  const requestRate = chartData(series?.request_rate);
  const latency = chartData(series?.latency_p95);
  const errorRate = latest(series?.error_rate);
  const apiUp = latest(series?.api_up);
  const instances = latest(series?.active_instances);
  const patients = latest(series?.patient_records);

  return (
    <>
      <PageHeader
        eyebrow="Observability"
        title="Metrics & telemetry"
        description="Prometheus-backed application performance and availability signals."
      >
        <select className="range-select" value={range} onChange={(event) => setRange(Number(event.target.value))}>
          <option value={15}>Last 15 minutes</option>
          <option value={60}>Last hour</option>
          <option value={360}>Last 6 hours</option>
          <option value={1440}>Last 24 hours</option>
        </select>
        <Button variant="secondary" onClick={() => monitoring.refetch()}>
          <RefreshCw size={15} /> Refresh
        </Button>
        <a className="button button-primary" href={externalUrls.grafana} target="_blank" rel="noreferrer">
          Open Grafana <ArrowUpRight size={15} />
        </a>
      </PageHeader>

      <section className="metric-grid metric-grid-small">
        <Card className="metric-card">
          <div className="metric-top"><span className="metric-icon"><Activity size={19} /></span><StatusBadge status={apiUp >= 1 ? "healthy" : "unavailable"} /></div>
          <span className="metric-label">API availability</span>
          <strong className="metric-value">{apiUp >= 1 ? "Online" : "No signal"}</strong>
          <p>Prometheus target health</p>
        </Card>
        <Card className="metric-card">
          <div className="metric-top"><span className="metric-icon cyan"><Gauge size={19} /></span></div>
          <span className="metric-label">Request rate</span>
          <strong className="metric-value">{latest(series?.request_rate).toFixed(2)}</strong>
          <p>Requests per second</p>
        </Card>
        <Card className="metric-card">
          <div className="metric-top"><span className="metric-icon violet"><Timer size={19} /></span></div>
          <span className="metric-label">p95 latency</span>
          <strong className="metric-value">{(latest(series?.latency_p95) * 1000).toFixed(0)} ms</strong>
          <p>95th percentile response time</p>
        </Card>
        <Card className="metric-card">
          <div className="metric-top"><span className="metric-icon green"><Server size={19} /></span></div>
          <span className="metric-label">Active instances</span>
          <strong className="metric-value">{instances || "—"}</strong>
          <p>{patients ? `${patients} patient records observed` : "Exporter signal"}</p>
        </Card>
      </section>

      {monitoring.data?.status !== "available" ? (
        <Card>
          <EmptyState unavailable title="Prometheus is not reachable" description={monitoring.data?.detail ?? "Start the dashboards profile to populate real metric history. This page will retry automatically."} />
        </Card>
      ) : (
        <section className="monitor-grid">
          <Card className="chart-card">
            <div className="card-heading"><div><span className="eyebrow">Throughput</span><h2>Request rate</h2></div><StatusBadge status="healthy" label="Live metric" /></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestRate}>
                  <defs><linearGradient id="monitorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#44d7e8" stopOpacity={0.42} /><stop offset="100%" stopColor="#44d7e8" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#1b2740" strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: "#697795", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={35} />
                  <YAxis tick={{ fill: "#697795", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={{ background: "#0c1424", border: "1px solid #24324d", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#44d7e8" strokeWidth={2} fill="url(#monitorFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="chart-card">
            <div className="card-heading"><div><span className="eyebrow">Performance</span><h2>p95 response latency</h2></div><span className="chart-unit">seconds</span></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latency}>
                  <CartesianGrid stroke="#1b2740" strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: "#697795", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={35} />
                  <YAxis tick={{ fill: "#697795", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={{ background: "#0c1424", border: "1px solid #24324d", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#9668ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      <Card className="threshold-card">
        <div className="threshold-icon"><TriangleAlert size={20} /></div>
        <div><strong>Error-rate threshold</strong><span>Current 5xx rate: {errorRate.toFixed(3)} requests/sec. Investigate when sustained above 0.1.</span></div>
        <StatusBadge status={errorRate > 0.1 ? "degraded" : "healthy"} label={errorRate > 0.1 ? "Threshold exceeded" : "Within threshold"} />
        <a href={externalUrls.prometheus} target="_blank" rel="noreferrer">Query Prometheus <ArrowUpRight size={14} /></a>
      </Card>
    </>
  );
}
