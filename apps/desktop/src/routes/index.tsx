import * as stylex from "@stylexjs/stylex";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion, MotionConfig } from "motion/react";

const healthUrl = "http://127.0.0.1:3000/health";

type HealthResponse = {
  status: "ok";
};

type ScreenStatus = "checking" | "connected" | "unavailable";

const statusCopy: Record<ScreenStatus, { label: string; title: string; description: string }> = {
  checking: {
    label: "Checking",
    title: "Reaching Hono.",
    description: "Looking for the local service on port 3000.",
  },
  connected: {
    label: "Connected",
    title: "Hono is ready.",
    description: "The desktop and local API are speaking normally.",
  },
  unavailable: {
    label: "Unavailable",
    title: "Hono is offline.",
    description: "Start the API, then retry the health check.",
  },
};

function isHealthResponse(value: unknown): value is HealthResponse {
  return typeof value === "object" && value !== null && "status" in value && value.status === "ok";
}

async function loadHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(healthUrl, {
    cache: "no-store",
    signal,
  });

  if (response.status !== 200) {
    throw new Error(`Health check returned ${response.status}`);
  }

  const body: unknown = await response.json();

  if (!isHealthResponse(body)) {
    throw new Error("Health check returned an invalid response");
  }

  return body;
}

export const Route = createFileRoute("/")({
  loader: ({ abortController }) => loadHealth(abortController.signal),
  pendingMs: 0,
  pendingComponent: () => <HealthScreen status="checking" />,
  component: ConnectedScreen,
  errorComponent: UnavailableScreen,
});

function ConnectedScreen() {
  const health = Route.useLoaderData();
  return <HealthScreen status={health.status === "ok" ? "connected" : "unavailable"} />;
}

function UnavailableScreen() {
  const router = useRouter();

  return (
    <HealthScreen
      status="unavailable"
      onRetry={() => {
        void router.invalidate();
      }}
    />
  );
}

function HealthScreen({ status, onRetry }: { status: ScreenStatus; onRetry?: () => void }) {
  const copy = statusCopy[status];

  return (
    <MotionConfig reducedMotion="user">
      <motion.main
        {...stylex.props(styles.page)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <header {...stylex.props(styles.header)} data-window-drag-region>
          <span {...stylex.props(styles.wordmark)}>Mooligan</span>
          <span {...stylex.props(styles.context)}>Local desktop / 01</span>
        </header>

        <div {...stylex.props(styles.content)}>
          <section
            {...stylex.props(styles.panel)}
            aria-live={status === "unavailable" ? "assertive" : "polite"}
            role={status === "unavailable" ? "alert" : "status"}
          >
            <p {...stylex.props(styles.eyebrow)}>Service health</p>

            <div {...stylex.props(styles.state)}>
              <span
                {...stylex.props(
                  styles.dot,
                  status === "checking" && styles.dotChecking,
                  status === "connected" && styles.dotConnected,
                  status === "unavailable" && styles.dotUnavailable,
                )}
                aria-hidden="true"
              />
              <span {...stylex.props(styles.stateLabel)}>{copy.label}</span>
            </div>

            <h1 {...stylex.props(styles.title)}>{copy.title}</h1>
            <p {...stylex.props(styles.description)}>{copy.description}</p>

            <dl {...stylex.props(styles.details)}>
              <div {...stylex.props(styles.detail)}>
                <dt {...stylex.props(styles.term)}>Endpoint</dt>
                <dd {...stylex.props(styles.value)}>127.0.0.1:3000/health</dd>
              </div>
              <div {...stylex.props(styles.detail)}>
                <dt {...stylex.props(styles.term)}>Expected</dt>
                <dd {...stylex.props(styles.value)}>200 · status ok</dd>
              </div>
            </dl>

            {onRetry ? (
              <button {...stylex.props(styles.button)} type="button" onClick={onRetry}>
                Retry
                <span aria-hidden="true">↗</span>
              </button>
            ) : null}
          </section>
        </div>

        <footer {...stylex.props(styles.footer)}>
          <span>Electron renderer</span>
          <span>Hono 4</span>
        </footer>
      </motion.main>
    </MotionConfig>
  );
}

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    padding: {
      default: "28px 32px",
      "@media (max-width: 600px)": "22px 20px",
    },
    display: "flex",
    flexDirection: "column",
    color: "#20221f",
    backgroundColor: "#f2f1ed",
    backgroundImage: "radial-gradient(circle at 82% 14%, rgba(255,255,255,0.82), transparent 34%)",
    fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "24px",
  },
  wordmark: {
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "19px",
    letterSpacing: "-0.01em",
  },
  context: {
    color: "#6d7069",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "10px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  content: {
    flex: 1,
    width: "100%",
    display: "grid",
    placeItems: "center",
    paddingBlock: "48px",
  },
  panel: {
    width: "100%",
    maxWidth: "680px",
    paddingBlock: "30px 34px",
    borderTop: "1px solid #c9c9c2",
    borderBottom: "1px solid #c9c9c2",
  },
  eyebrow: {
    margin: "0 0 54px",
    color: "#777a73",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "10px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  state: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  dotChecking: {
    backgroundColor: "#9d8d5a",
    boxShadow: "0 0 0 4px rgba(157, 141, 90, 0.12)",
  },
  dotConnected: {
    backgroundColor: "#44735a",
    boxShadow: "0 0 0 4px rgba(68, 115, 90, 0.12)",
  },
  dotUnavailable: {
    backgroundColor: "#9a554a",
    boxShadow: "0 0 0 4px rgba(154, 85, 74, 0.12)",
  },
  stateLabel: {
    color: "#565952",
    fontSize: "13px",
    letterSpacing: "0.02em",
  },
  title: {
    maxWidth: "620px",
    margin: "0",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: {
      default: "clamp(48px, 8vw, 78px)",
      "@media (max-width: 600px)": "46px",
    },
    fontWeight: 400,
    lineHeight: 0.98,
    letterSpacing: "-0.045em",
  },
  description: {
    maxWidth: "440px",
    margin: "24px 0 46px",
    color: "#656861",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  details: {
    margin: 0,
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 520px)": "1fr",
    },
    gap: {
      default: "20px",
      "@media (max-width: 520px)": "14px",
    },
  },
  detail: {
    paddingTop: "12px",
    borderTop: "1px solid #d9d9d3",
  },
  term: {
    marginBottom: "7px",
    color: "#85877f",
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  value: {
    margin: 0,
    color: "#454841",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "11px",
  },
  button: {
    marginTop: "30px",
    padding: "10px 0",
    display: "inline-flex",
    alignItems: "center",
    gap: "34px",
    color: "#20221f",
    backgroundColor: {
      default: "transparent",
      ":hover": "transparent",
    },
    border: 0,
    borderBottom: "1px solid #20221f",
    borderRadius: 0,
    font: "inherit",
    fontSize: "13px",
    cursor: "pointer",
    outline: {
      default: "none",
      ":focus-visible": "2px solid #20221f",
    },
    outlineOffset: "5px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    color: "#898b84",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "9px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
});
