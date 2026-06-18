import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Braces, CheckCircle2, Copy, Search, Server } from "lucide-react";
import { useMemo, useState } from "react";
import { endpoints, externalUrls } from "../lib/api";
import { Card, EmptyState, LoadingState, PageHeader, StatusBadge, useToast } from "../components/ui";

const methodOrder = ["get", "post", "put", "patch", "delete"];

export function ApiExplorerPage() {
  const [search, setSearch] = useState("");
  const notify = useToast();
  const schema = useQuery({ queryKey: ["openapi"], queryFn: endpoints.openapi });
  const overview = useQuery({ queryKey: ["overview"], queryFn: endpoints.overview });
  const operations = useMemo(() => {
    if (!schema.data) return [];
    return Object.entries(schema.data.paths)
      .flatMap(([path, methods]) =>
        Object.entries(methods)
          .filter(([method]) => methodOrder.includes(method.toLowerCase()))
          .map(([method, operation]) => ({
            path,
            method: method.toUpperCase(),
            tag: operation.tags?.[0] ?? "Other",
            summary: operation.summary ?? operation.description ?? "No description provided",
            responses: Object.keys(operation.responses ?? {})
          }))
      )
      .filter((operation) =>
        `${operation.method} ${operation.path} ${operation.summary} ${operation.tag}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => a.tag.localeCompare(b.tag) || a.path.localeCompare(b.path));
  }, [schema.data, search]);

  const groups = operations.reduce<Record<string, typeof operations>>((result, operation) => {
    (result[operation.tag] ??= []).push(operation);
    return result;
  }, {});

  if (schema.isLoading) return <LoadingState label="Reading generated OpenAPI schema" />;
  return (
    <>
      <PageHeader
        eyebrow="Developer platform"
        title="API explorer"
        description="Generated from the live FastAPI OpenAPI document—never maintained as a separate endpoint list."
      >
        <a className="button button-primary" href={externalUrls.docs} target="_blank" rel="noreferrer">
          Open Swagger UI <ArrowUpRight size={15} />
        </a>
      </PageHeader>

      <section className="api-summary">
        <Card>
          <span className="api-summary-icon">
            <Braces size={20} />
          </span>
          <div>
            <span>API definition</span>
            <strong>{schema.data?.info.title ?? "HelixAI API"}</strong>
          </div>
          <code>v{schema.data?.info.version ?? "—"}</code>
        </Card>
        <Card>
          <span className="api-summary-icon green">
            <Server size={20} />
          </span>
          <div>
            <span>Connectivity test</span>
            <strong>{overview.data ? "Backend connected" : "Awaiting response"}</strong>
          </div>
          <StatusBadge status={overview.data ? "healthy" : overview.isError ? "unavailable" : "degraded"} />
        </Card>
        <Card>
          <span className="api-summary-icon violet">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <span>Documented operations</span>
            <strong>{operations.length} endpoints</strong>
          </div>
          <span className="type-tag">OpenAPI 3.1</span>
        </Card>
      </section>

      <Card className="api-explorer-card">
        <div className="table-toolbar">
          <label className="search-box api-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search methods, paths, or descriptions" />
          </label>
          <span className="schema-source">Source: <code>/openapi.json</code></span>
        </div>
        {operations.length === 0 ? (
          <EmptyState title="No matching endpoints" description="Clear the search to view the complete generated API surface." />
        ) : (
          <div className="endpoint-groups">
            {Object.entries(groups).map(([tag, items]) => (
              <section key={tag}>
                <div className="endpoint-group-title"><span>{tag}</span><i /> <small>{items?.length ?? 0} operations</small></div>
                {items?.map((operation) => (
                  <article className="endpoint-row" key={`${operation.method}-${operation.path}`}>
                    <span className={`method method-${operation.method.toLowerCase()}`}>{operation.method}</span>
                    <code>{operation.path}</code>
                    <p>{operation.summary}</p>
                    <span className="response-codes">{operation.responses.join(" · ")}</span>
                    <button aria-label="Copy endpoint path" onClick={() => { navigator.clipboard.writeText(operation.path); notify("Endpoint path copied"); }}><Copy size={15} /></button>
                  </article>
                ))}
              </section>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
