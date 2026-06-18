import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { endpoints, externalUrls } from "../lib/api";
import { Button, Card, EmptyState, LoadingState, PageHeader, StatusBadge } from "../components/ui";

export function SecurityPage() {
  const security = useQuery({
    queryKey: ["security"],
    queryFn: endpoints.security,
    refetchInterval: 30_000
  });
  if (security.isLoading) return <LoadingState label="Reading sanitized security posture" />;
  const data = security.data;

  return (
    <>
      <PageHeader
        eyebrow="Trust center"
        title="Security & secrets"
        description="Connection health and configuration posture without exposing secret material."
      >
        <Button variant="secondary" onClick={() => security.refetch()}>
          <RefreshCw size={15} /> Refresh
        </Button>
        <a className="button button-primary" href={externalUrls.vault} target="_blank" rel="noreferrer">
          Open Vault <ExternalLink size={15} />
        </a>
      </PageHeader>

      <Card className="security-hero">
        <div className="security-shield">
          <ShieldCheck size={34} />
          <i />
        </div>
        <div>
          <span className="eyebrow">Environment security</span>
          <h2>
            {data?.status === "available" && !data.vault?.sealed
              ? "Vault is connected and unsealed"
              : "Vault connection requires attention"}
          </h2>
          <p>
            This interface exposes status metadata only. Tokens, credentials, secret values, and
            environment contents remain server-side.
          </p>
        </div>
        <StatusBadge
          status={data?.status === "available" && !data.vault?.sealed ? "healthy" : "unavailable"}
          label={data?.status === "available" ? "Status verified" : "Unavailable"}
        />
      </Card>

      {data?.status !== "available" ? (
        <Card>
          <EmptyState
            unavailable
            title="Vault is not reachable"
            description={
              data?.detail ??
              "Start the dashboards profile or configure VAULT_URL. Application secrets are not exposed as a fallback."
            }
          />
        </Card>
      ) : (
        <section className="security-grid">
          <Card className="security-detail">
            <div className="card-heading">
              <div>
                <span className="eyebrow">HashiCorp Vault</span>
                <h2>Cluster state</h2>
              </div>
              <LockKeyhole size={20} />
            </div>
            <dl>
              <div>
                <dt>Initialized</dt>
                <dd>
                  <StatusBadge status={data.vault?.initialized ? "healthy" : "degraded"} />
                </dd>
              </div>
              <div>
                <dt>Seal state</dt>
                <dd>
                  <StatusBadge
                    status={data.vault?.sealed ? "degraded" : "healthy"}
                    label={data.vault?.sealed ? "Sealed" : "Unsealed"}
                  />
                </dd>
              </div>
              <div>
                <dt>Cluster</dt>
                <dd>{data.vault?.cluster_name ?? "Not reported"}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{data.vault?.version ?? "Not reported"}</dd>
              </div>
              <div>
                <dt>Node role</dt>
                <dd>{data.vault?.standby ? "Standby" : "Active"}</dd>
              </div>
            </dl>
          </Card>
          <Card className="security-detail">
            <div className="card-heading">
              <div>
                <span className="eyebrow">Configuration</span>
                <h2>Security controls</h2>
              </div>
              <Fingerprint size={20} />
            </div>
            <div className="control-list">
              <div>
                <span className="control-icon">
                  <Database size={16} />
                </span>
                <div>
                  <strong>Database connection</strong>
                  <small>Connection string is server-side only</small>
                </div>
                <StatusBadge status="healthy" label={data.configuration.database_url} />
              </div>
              <div>
                <span className="control-icon violet">
                  <KeyRound size={16} />
                </span>
                <div>
                  <strong>Jenkins credentials</strong>
                  <small>Used only by the FastAPI proxy</small>
                </div>
                <StatusBadge
                  status={
                    data.configuration.jenkins_credentials === "configured"
                      ? "healthy"
                      : "unconfigured"
                  }
                  label={data.configuration.jenkins_credentials}
                />
              </div>
              <div>
                <span className="control-icon green">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <strong>CORS policy</strong>
                  <small>{data.configuration.cors_origins} explicit browser origins</small>
                </div>
                <StatusBadge status="healthy" label="Restricted" />
              </div>
            </div>
          </Card>
        </section>
      )}

      <div className="security-notice">
        <LockKeyhole size={17} />
        <div>
          <strong>Sensitive values are intentionally omitted</strong>
          <span>
            Secret rotation timestamps and secret-engine inventory are marked unavailable because
            the current Vault setup does not expose them through a least-privilege policy.
          </span>
        </div>
      </div>
    </>
  );
}
