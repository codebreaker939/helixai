import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  Circle,
  Clock3,
  GitBranch,
  GitCommit,
  RefreshCw,
  ScrollText,
  Terminal,
  Timer,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { endpoints, externalUrls } from "../lib/api";
import type { JenkinsStage } from "../types";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  formatDate,
  PageHeader,
  StatusBadge
} from "../components/ui";

const expectedStages = [
  "Source checkout",
  "Dependencies",
  "Tests & quality",
  "Docker build",
  "Image push",
  "Kubernetes deploy",
  "Health verification"
];

function normalizedStage(status: string) {
  const value = status.toLowerCase();
  if (["success", "successful", "passed"].includes(value)) return "success";
  if (["failed", "failure", "error"].includes(value)) return "failed";
  if (["in_progress", "running"].includes(value)) return "running";
  if (["aborted", "cancelled"].includes(value)) return "aborted";
  return "pending";
}

export function PipelinePage() {
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<HTMLPreElement>(null);
  const pipeline = useQuery({
    queryKey: ["jenkins"],
    queryFn: endpoints.jenkins,
    refetchInterval: 4_000
  });
  const logs = useQuery({
    queryKey: ["jenkins-log"],
    queryFn: endpoints.jenkinsLog,
    refetchInterval: 4_000
  });

  useEffect(() => {
    if (autoScroll && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs.data?.content, autoScroll]);

  const build = pipeline.data?.build;
  const stages: JenkinsStage[] = build?.stages.length
    ? build.stages
    : expectedStages.map((name) => ({ name, status: "PENDING" }));

  return (
    <>
      <PageHeader
        eyebrow="Continuous delivery"
        title="Pipeline control room"
        description="Sanitized Jenkins build state, stages, metadata, and console output."
      >
        <Button
          variant="secondary"
          onClick={() => {
            pipeline.refetch();
            logs.refetch();
          }}
        >
          <RefreshCw size={15} /> Refresh
        </Button>
        <a
          className="button button-primary"
          href={build?.url ?? externalUrls.jenkins}
          target="_blank"
          rel="noreferrer"
        >
          Open Jenkins <ArrowUpRight size={15} />
        </a>
      </PageHeader>

      {pipeline.isError ? (
        <ErrorState message={pipeline.error.message} retry={() => pipeline.refetch()} />
      ) : pipeline.data?.status !== "available" || !build ? (
        <Card>
          <EmptyState
            unavailable={pipeline.data?.status !== "available"}
            title={
              pipeline.data?.status === "available"
                ? "No Jenkins builds yet"
                : "Jenkins is not connected"
            }
            description={
              pipeline.data?.detail ??
              "Configure JENKINS_URL, JENKINS_JOB, and server-side credentials to stream real build data. The dashboard retries every four seconds."
            }
          />
        </Card>
      ) : (
        <>
          <Card className="build-hero">
            <div className="build-state">
              <div className={`build-state-icon ${normalizedStage(build.result)}`}>
                {normalizedStage(build.result) === "success" ? (
                  <Check size={26} />
                ) : normalizedStage(build.result) === "failed" ? (
                  <X size={26} />
                ) : (
                  <RefreshCw size={25} className={build.building ? "spin" : ""} />
                )}
              </div>
              <div>
                <span>Latest Jenkins build</span>
                <h2>Build #{build.number}</h2>
                <StatusBadge status={build.result} />
              </div>
            </div>
            <div className="build-meta-grid">
              <div>
                <GitBranch size={16} />
                <span>Branch</span>
                <strong>{build.branch ?? "Not reported"}</strong>
              </div>
              <div>
                <GitCommit size={16} />
                <span>Commit</span>
                <strong>{build.commit_id?.slice(0, 9) ?? "Not reported"}</strong>
              </div>
              <div>
                <UserRound size={16} />
                <span>Triggered by</span>
                <strong>{build.triggered_by ?? "Not reported"}</strong>
              </div>
              <div>
                <Timer size={16} />
                <span>Duration</span>
                <strong>{Math.round(build.duration_ms / 1000)}s</strong>
              </div>
              <div>
                <Clock3 size={16} />
                <span>Started</span>
                <strong>{formatDate(build.started_at)}</strong>
              </div>
            </div>
            {build.commit_message && <div className="commit-message">“{build.commit_message}”</div>}
          </Card>

          <Card className="pipeline-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">Execution graph</span>
                <h2>Delivery stages</h2>
              </div>
              <span className="live-label">
                <i /> Polling every 4 seconds
              </span>
            </div>
            <div className="pipeline-stages">
              {stages.map((stage, index) => {
                const state = normalizedStage(stage.status);
                return (
                  <div className={`pipeline-stage ${state}`} key={`${stage.name}-${index}`}>
                    <div className="stage-connector" />
                    <div className="stage-node">
                      {state === "success" ? (
                        <Check size={18} />
                      ) : state === "failed" ? (
                        <X size={18} />
                      ) : state === "running" ? (
                        <RefreshCw size={17} className="spin" />
                      ) : (
                        <Circle size={14} />
                      )}
                    </div>
                    <div className="stage-copy">
                      <span>Stage {String(index + 1).padStart(2, "0")}</span>
                      <strong>{stage.name}</strong>
                      <small>
                        {stage.durationMillis
                          ? `${(stage.durationMillis / 1000).toFixed(1)} seconds`
                          : state}
                      </small>
                    </div>
                    {stage.error?.message && <p className="stage-error">{stage.error.message}</p>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="build-history-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">Recent delivery history</span>
                <h2>Build history</h2>
              </div>
              <span className="type-tag">{pipeline.data.environment}</span>
            </div>
            <div className="build-history">
              {pipeline.data.history.map((item) => (
                <a href={item.url} target="_blank" rel="noreferrer" key={item.number}>
                  <strong>#{item.number}</strong>
                  <StatusBadge status={item.result} />
                  <span>{formatDate(item.started_at)}</span>
                  <span>{Math.round(item.duration_ms / 1000)}s</span>
                  <ArrowUpRight size={14} />
                </a>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card className="console-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">Build output</span>
            <h2>Console log</h2>
          </div>
          <label className="toggle-label">
            <span>Auto-scroll</span>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(event) => setAutoScroll(event.target.checked)}
            />
            <i />
          </label>
        </div>
        <div className="console-terminal">
          <div className="terminal-bar">
            <span>
              <Terminal size={14} /> lastBuild / consoleText
            </span>
            <span>{logs.data?.status === "available" ? "Connected" : "Disconnected"}</span>
          </div>
          <pre ref={logRef}>
            {logs.data?.content ||
              (logs.isLoading
                ? "$ Connecting to the Jenkins console stream…"
                : `$ Jenkins console unavailable\n$ ${logs.data?.detail ?? "The server-side Jenkins adapter could not reach the job."}`)}
          </pre>
        </div>
        <div className="console-note">
          <ScrollText size={15} />
          Console output is capped and sanitized through FastAPI; Jenkins credentials are never sent
          to the browser.
        </div>
      </Card>
    </>
  );
}
