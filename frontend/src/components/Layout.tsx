import {
  Activity,
  Boxes,
  Braces,
  ChevronLeft,
  CircleUserRound,
  Dna,
  HeartPulse,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Settings,
  ShieldCheck,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { endpoints } from "../lib/api";
import { getSettings } from "../lib/settings";
import { StatusBadge } from "./ui";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/patients", label: "Application", icon: Dna },
  { to: "/app/pipeline", label: "CI/CD Pipeline", icon: Rocket },
  { to: "/app/monitoring", label: "Monitoring", icon: HeartPulse },
  { to: "/app/kubernetes", label: "Kubernetes", icon: Boxes },
  { to: "/app/security", label: "Security", icon: ShieldCheck },
  { to: "/app/api", label: "API Explorer", icon: Braces },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/settings", label: "Settings", icon: Settings }
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [refreshInterval, setRefreshInterval] = useState(getSettings().refreshInterval);
  useEffect(() => {
    const update = (event: Event) =>
      setRefreshInterval((event as CustomEvent).detail.refreshInterval);
    window.addEventListener("helixai-settings", update);
    return () => window.removeEventListener("helixai-settings", update);
  }, []);
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: endpoints.overview,
    refetchInterval: refreshInterval
  });

  const page = nav
    .slice()
    .reverse()
    .find((item) => location.pathname.startsWith(item.to));

  return (
    <div className={clsx("app-shell", collapsed && "sidebar-collapsed")}>
      <aside className={clsx("sidebar", mobileOpen && "sidebar-mobile-open")}>
        <div className="sidebar-top">
          <NavLink to="/" className="brand" aria-label="HelixAI home">
            <span className="brand-mark">
              <Dna size={22} />
            </span>
            <span className="brand-copy">
              <strong>HELIX</strong>
              <em>AI</em>
            </span>
          </NavLink>
          <button
            className="icon-button mobile-only"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="environment-card">
          <div>
            <span>Environment</span>
            <strong>{overview.data?.environment ?? "Connecting"}</strong>
          </div>
          <span className={clsx("live-orb", overview.data?.status === "healthy" && "is-live")} />
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard">
          <span className="nav-label">Platform</span>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => clsx("nav-item", isActive && "active")}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <i />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar">HA</span>
            <div>
              <strong>Platform operator</strong>
              <span>Local workspace</span>
            </div>
            <CircleUserRound size={17} />
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            <span>{collapsed ? "Expand" : "Collapse sidebar"}</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} />}

      <section className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-only"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>HelixAI</span>
              <ChevronLeft size={13} />
              <strong>{page?.label ?? "Platform"}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <StatusBadge
              status={overview.data?.status ?? (overview.isError ? "unavailable" : "degraded")}
              label={
                overview.isError
                  ? "API offline"
                  : overview.data?.status === "healthy"
                    ? "All core systems operational"
                    : "Checking systems"
              }
            />
            <span className="topbar-divider" />
            <div className="topbar-avatar">HA</div>
          </div>
        </header>

        <motion.main
          className="page-content"
          key={location.pathname}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.main>
      </section>
    </div>
  );
}
