import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/ui";

const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((module) => ({ default: module.LandingPage }))
);
const OverviewPage = lazy(() =>
  import("./pages/OverviewPage").then((module) => ({ default: module.OverviewPage }))
);
const PatientsPage = lazy(() =>
  import("./pages/PatientsPage").then((module) => ({ default: module.PatientsPage }))
);
const PipelinePage = lazy(() =>
  import("./pages/PipelinePage").then((module) => ({ default: module.PipelinePage }))
);
const MonitoringPage = lazy(() =>
  import("./pages/MonitoringPage").then((module) => ({ default: module.MonitoringPage }))
);
const KubernetesPage = lazy(() =>
  import("./pages/KubernetesPage").then((module) => ({ default: module.KubernetesPage }))
);
const SecurityPage = lazy(() =>
  import("./pages/SecurityPage").then((module) => ({ default: module.SecurityPage }))
);
const ApiExplorerPage = lazy(() =>
  import("./pages/ApiExplorerPage").then((module) => ({ default: module.ApiExplorerPage }))
);
const ActivityPage = lazy(() =>
  import("./pages/ActivityPage").then((module) => ({ default: module.ActivityPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);

export function App() {
  return (
    <Suspense fallback={<LoadingState label="Loading HelixAI workspace" />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="kubernetes" element={<KubernetesPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="api" element={<ApiExplorerPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
