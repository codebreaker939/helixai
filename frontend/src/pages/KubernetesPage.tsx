import { useQuery } from "@tanstack/react-query";
import { Boxes, Container, Network, RefreshCw, RotateCcw, Server } from "lucide-react";
import { endpoints } from "../lib/api";
import { Button, Card, EmptyState, formatDate, LoadingState, PageHeader, StatusBadge } from "../components/ui";

export function KubernetesPage() {
  const query = useQuery({ queryKey: ["kubernetes"], queryFn: endpoints.kubernetes, refetchInterval: 15_000 });
  if (query.isLoading) return <LoadingState label="Reading restricted cluster status" />;
  const data = query.data;
  return (
    <>
      <PageHeader eyebrow="Orchestration" title="Kubernetes runtime" description="Read-only deployment, pod, and service state from the current namespace.">
        <div className="namespace-badge"><Boxes size={15} /> Namespace: {data?.namespace ?? "default"}</div>
        <Button variant="secondary" onClick={() => query.refetch()}><RefreshCw size={15} /> Refresh</Button>
      </PageHeader>
      {data?.status !== "available" ? (
        <Card><EmptyState unavailable title="Cluster data is unavailable" description={data?.detail ?? "The API is not running inside Kubernetes with a restricted service account. Docker and local development remain fully supported."} /></Card>
      ) : (
        <>
          <section className="resource-summary">
            <Card><span><Boxes size={19} /></span><div><strong>{data.deployments.length}</strong><small>Deployments</small></div></Card>
            <Card><span><Container size={19} /></span><div><strong>{data.pods.length}</strong><small>Pods</small></div></Card>
            <Card><span><Network size={19} /></span><div><strong>{data.services.length}</strong><small>Services</small></div></Card>
            <Card><span><RotateCcw size={19} /></span><div><strong>{data.pods.reduce((sum, pod) => sum + pod.restarts, 0)}</strong><small>Pod restarts</small></div></Card>
          </section>
          <Card className="table-card resource-card">
            <div className="card-heading"><div><span className="eyebrow">Workloads</span><h2>Deployments</h2></div></div>
            <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Replicas</th><th>Ready</th><th>Unavailable</th><th>Container image</th><th>Created</th></tr></thead><tbody>{data.deployments.map((item) => <tr key={item.name}><td><strong>{item.name}</strong></td><td>{item.replicas}</td><td><StatusBadge status={item.ready_replicas === item.replicas ? "healthy" : "degraded"} label={`${item.ready_replicas} ready`} /></td><td>{item.unavailable_replicas}</td><td><code>{item.images.join(", ")}</code></td><td>{formatDate(item.created_at)}</td></tr>)}</tbody></table></div>
          </Card>
          <section className="kube-grid">
            <Card>
              <div className="card-heading"><div><span className="eyebrow">Compute</span><h2>Pods</h2></div><Container size={19} /></div>
              <div className="resource-list">{data.pods.map((pod) => <div key={pod.name}><span className="resource-icon"><Container size={16} /></span><div><strong>{pod.name}</strong><small>{pod.node ?? "Node not reported"} · {pod.restarts} restarts</small></div><StatusBadge status={pod.ready ? "healthy" : "degraded"} label={pod.phase} /></div>)}</div>
            </Card>
            <Card>
              <div className="card-heading"><div><span className="eyebrow">Networking</span><h2>Services</h2></div><Server size={19} /></div>
              <div className="resource-list">{data.services.map((service) => <div key={service.name}><span className="resource-icon violet"><Network size={16} /></span><div><strong>{service.name}</strong><small>{service.cluster_ip} · {service.ports.map((port) => port.port).join(", ")}</small></div><span className="type-tag">{service.type}</span></div>)}</div>
            </Card>
          </section>
        </>
      )}
    </>
  );
}
