import { useQuery } from "@tanstack/react-query";
import { Activity, Dna, RefreshCw } from "lucide-react";
import { endpoints } from "../lib/api";
import { Button, Card, EmptyState, formatDate, LoadingState, PageHeader, StatusBadge } from "../components/ui";

export function ActivityPage() {
  const query = useQuery({ queryKey: ["activity"], queryFn: endpoints.activity, refetchInterval: 10_000 });
  if (query.isLoading) return <LoadingState label="Loading current runtime activity" />;
  return (
    <>
      <PageHeader eyebrow="Operational timeline" title="System activity" description="Real mutation events captured by the running FastAPI process.">
        <Button variant="secondary" onClick={() => query.refetch()}><RefreshCw size={15} /> Refresh</Button>
      </PageHeader>
      <Card className="activity-page-card">
        {query.data?.items.length ? (
          <div className="activity-feed">
            {query.data.items.map((item) => (
              <article key={item.id}>
                <div className={`activity-node tone-${item.status}`}><Dna size={16} /></div>
                <div>
                  <span>{item.kind}</span>
                  <h3>{item.message}</h3>
                  <time>{formatDate(item.timestamp)}</time>
                </div>
                <StatusBadge status={item.status} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No runtime activity yet" description="Create, update, or delete a patient record to generate a real event. Activity is process-local because the current schema does not include an audit table." />
        )}
      </Card>
      <div className="data-note"><Activity size={17} /><div><strong>Current capability boundary</strong><span>Activity is real but in-memory and resets when the API restarts. A durable audit log would require a new database table and migration, which is intentionally outside this frontend-focused change.</span></div></div>
    </>
  );
}
