import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Braces,
  CheckCircle2,
  Container,
  Database,
  Dna,
  Gauge,
  Github,
  LockKeyhole,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { endpoints, externalUrls } from "../lib/api";
import { StatusBadge } from "../components/ui";

const capabilities = [
  {
    icon: Braces,
    name: "FastAPI",
    copy: "Typed clinical APIs with generated OpenAPI documentation.",
    tone: "blue"
  },
  {
    icon: Database,
    name: "PostgreSQL",
    copy: "Durable patient data with health-aware connectivity.",
    tone: "violet"
  },
  {
    icon: Container,
    name: "Docker",
    copy: "Reproducible runtime images and local service composition.",
    tone: "cyan"
  },
  {
    icon: Boxes,
    name: "Kubernetes",
    copy: "Replicated workloads, probes, services, and autoscaling.",
    tone: "green"
  },
  {
    icon: Rocket,
    name: "Jenkins",
    copy: "Traceable delivery stages from source to deployment.",
    tone: "blue"
  },
  {
    icon: LockKeyhole,
    name: "Vault",
    copy: "Server-side secret management with sanitized status.",
    tone: "violet"
  },
  {
    icon: Gauge,
    name: "Prometheus",
    copy: "Request, latency, availability, and workload telemetry.",
    tone: "cyan"
  },
  {
    icon: Network,
    name: "Grafana",
    copy: "Provisioned dashboards for metrics and centralized logs.",
    tone: "green"
  }
];

export function LandingPage() {
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: endpoints.overview,
    refetchInterval: 15_000,
    retry: 1
  });
  const checks = overview.data?.services.slice(0, 4) ?? [
    { name: "FastAPI", status: "degraded" as const, latency_ms: null },
    { name: "PostgreSQL", status: "degraded" as const, latency_ms: null },
    { name: "Prometheus", status: "degraded" as const, latency_ms: null },
    { name: "Grafana", status: "degraded" as const, latency_ms: null }
  ];

  return (
    <div className="landing">
      <div className="landing-grid" />
      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Dna size={22} />
          </span>
          <span className="brand-copy">
            <strong>HELIX</strong>
            <em>AI</em>
          </span>
        </Link>
        <nav>
          <a href="#platform">Platform</a>
          <a href="#architecture">Architecture</a>
          <a href={externalUrls.docs} target="_blank" rel="noreferrer">
            API
          </a>
        </nav>
        <Link to="/app" className="button button-secondary nav-cta">
          Open console <ArrowRight size={15} />
        </Link>
      </header>

      <main>
        <section className="hero" id="platform">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-kicker">
              <Sparkles size={14} />
              Clinical intelligence meets operational clarity
            </div>
            <h1>
              Precision medicine,
              <span> engineered for trust.</span>
            </h1>
            <p>
              HelixAI unifies patient operations, delivery pipelines, infrastructure health, and
              observability in one calm, high-signal command center.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="button button-primary button-large">
                Open dashboard <ArrowRight size={17} />
              </Link>
              <a
                href={externalUrls.docs}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary button-large"
              >
                Explore the API <Braces size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <CheckCircle2 size={15} /> Live API integration
              </span>
              <span>
                <CheckCircle2 size={15} /> Secure operational proxies
              </span>
              <span>
                <CheckCircle2 size={15} /> Cloud-native deployment
              </span>
            </div>
          </motion.div>

          <motion.div
            className="hero-console"
            initial={{ opacity: 0, scale: 0.97, x: 24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
          >
            <div className="console-header">
              <div>
                <span className="window-dot red" />
                <span className="window-dot amber" />
                <span className="window-dot green" />
              </div>
              <span>HELIXAI / LIVE SYSTEM</span>
              <ShieldCheck size={16} />
            </div>
            <div className="console-body">
              <div className="console-summary">
                <div>
                  <span>Platform state</span>
                  <strong>{overview.data?.status === "healthy" ? "Operational" : "Connecting"}</strong>
                </div>
                <StatusBadge
                  status={overview.data?.status ?? (overview.isError ? "unavailable" : "degraded")}
                  label={overview.isError ? "API offline" : "Live"}
                />
              </div>
              <div className="console-pulse">
                {Array.from({ length: 32 }).map((_, index) => (
                  <i key={index} style={{ height: `${16 + ((index * 19) % 44)}px` }} />
                ))}
              </div>
              <div className="console-checks">
                {checks.map((service, index) => (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + index * 0.08 }}
                  >
                    <span className={`service-orb ${service.status}`} />
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        {service.latency_ms === null ? "Awaiting signal" : `${service.latency_ms} ms`}
                      </span>
                    </div>
                    <StatusBadge status={service.status} />
                  </motion.div>
                ))}
              </div>
              <div className="console-footer">
                <span>
                  <Dna size={15} /> {overview.data?.patient_count ?? "—"} clinical records
                </span>
                <span>v{overview.data?.version ?? "2.0.0"}</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="capabilities" id="architecture">
          <div className="section-heading">
            <span className="eyebrow">Integrated architecture</span>
            <h2>Every operational layer, one coherent system.</h2>
            <p>
              Purpose-built around HelixAI’s existing application and DevOps stack—not a detached
              dashboard template.
            </p>
          </div>
          <div className="capability-grid">
            {capabilities.map(({ icon: Icon, name, copy, tone }) => (
              <motion.article
                key={name}
                className="capability-card"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`capability-icon tone-${tone}`}>
                  <Icon size={20} />
                </div>
                <h3>{name}</h3>
                <p>{copy}</p>
                <span className="capability-line" />
              </motion.article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div className="cta-mark">
            <Dna size={38} />
          </div>
          <div>
            <span className="eyebrow">Built for signal, not noise</span>
            <h2>Move from patient data to platform health in seconds.</h2>
          </div>
          <Link to="/app" className="button button-primary button-large">
            Enter HelixAI <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="brand">
          <span className="brand-mark small">
            <Dna size={18} />
          </span>
          <span className="brand-copy">
            <strong>HELIX</strong>
            <em>AI</em>
          </span>
        </div>
        <p>Cloud-native precision medicine operations.</p>
        <a href="https://github.com/codebreaker939/helixai" target="_blank" rel="noreferrer">
          <Github size={17} /> Source
        </a>
      </footer>
    </div>
  );
}
