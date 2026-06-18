import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CircleDot,
  LoaderCircle,
  RefreshCw,
  ServerOff,
  X
} from "lucide-react";
import {
  createContext,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { clsx } from "clsx";
import type { ServiceState } from "../types";

export function Card({
  children,
  className,
  interactive = false
}: PropsWithChildren<{ className?: string; interactive?: boolean }>) {
  return (
    <div className={clsx("panel", interactive && "panel-interactive", className)}>{children}</div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button className={clsx("button", `button-${variant}`, className)} {...props}>
      {children}
    </button>
  );
}

export function StatusBadge({
  status,
  label
}: {
  status: ServiceState | string;
  label?: string;
}) {
  const normalized =
    status.toLowerCase() === "successful" || status.toLowerCase() === "success"
      ? "healthy"
      : status.toLowerCase();
  return (
    <span className={clsx("status-badge", `status-${normalized}`)}>
      <span className="status-dot" aria-hidden />
      {label ?? status}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children
}: PropsWithChildren<{ eyebrow?: string; title: string; description: string }>) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading live data" }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <div className="skeleton skeleton-wide" />
      <div className="skeleton-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  unavailable = false
}: {
  title: string;
  description: string;
  unavailable?: boolean;
}) {
  const Icon = unavailable ? ServerOff : CircleDot;
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={22} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-state">
      <AlertTriangle size={20} />
      <div>
        <strong>Unable to load data</strong>
        <p>{message}</p>
      </div>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          <RefreshCw size={15} /> Retry
        </Button>
      )}
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose
}: PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}>) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
          >
            <button className="icon-button modal-close" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
            <h2 id="modal-title">{title}</h2>
            {description && <p className="modal-description">{description}</p>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

const ToastContext = createContext<(message: string, tone?: ToastItem["tone"]) => void>(() => {});

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const notify = useCallback((message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now();
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3600);
  }, []);
  const value = useMemo(() => notify, [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={clsx("toast", `toast-${item.tone}`)}
              initial={{ opacity: 0, x: 30, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {item.tone === "success" ? (
                <Check size={17} />
              ) : item.tone === "error" ? (
                <AlertTriangle size={17} />
              ) : (
                <LoaderCircle size={17} />
              )}
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function formatDate(value?: string | number | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
