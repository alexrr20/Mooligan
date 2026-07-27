import * as stylex from "@stylexjs/stylex";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type SetupState =
  | { kind: "checking" }
  | { kind: "missing" }
  | { kind: "downloading"; progress: CatalogProgress }
  | { kind: "error"; message: string }
  | { kind: "ready" };

export function CatalogSetup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<SetupState>({ kind: "checking" });
  const visible = !dismissed && state.kind !== "checking" && state.kind !== "ready";

  useEffect(() => {
    const catalog = window.catalog;

    if (!catalog) {
      setState({ kind: "ready" });
      return;
    }

    let active = true;
    const stopProgress = catalog.onProgress((progress) => {
      if (active) {
        setState({ kind: "downloading", progress });
      }
    });

    void catalog
      .status()
      .then((status) => {
        if (active) {
          setState({ kind: status.installed ? "ready" : "missing" });
        }
      })
      .catch(() => {
        if (active) {
          setState({ kind: "error", message: "Mooligan could not check the local card library." });
        }
      });

    return () => {
      active = false;
      stopProgress();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !visible) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const downloading = state.kind === "downloading";
  const progress = downloading ? state.progress : undefined;
  const progressRatio = progress && progress.total > 0 ? progress.completed / progress.total : 0;

  async function download() {
    const catalog = window.catalog;

    if (!catalog) {
      return;
    }

    setState({ kind: "downloading", progress: { completed: 0, total: 0 } });

    try {
      await catalog.download();
      setState({ kind: "ready" });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "The card library could not be downloaded.",
      });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      {...stylex.props(styles.dialog)}
      data-catalog-dialog
      onCancel={(event) => {
        if (downloading) {
          event.preventDefault();
        } else {
          setDismissed(true);
        }
      }}
    >
      <motion.div
        {...stylex.props(styles.panel)}
        initial={{ opacity: 0, scale: 0.985, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div {...stylex.props(styles.topline)}>
          <span>First run / Card index</span>
          <span>{downloading ? "Receiving records" : "Local setup"}</span>
        </div>

        <div {...stylex.props(styles.layout)}>
          <div {...stylex.props(styles.mark)} aria-hidden="true">
            <span {...stylex.props(styles.markNumber)}>∞</span>
            <span {...stylex.props(styles.markLabel)}>Cards</span>
          </div>

          <div {...stylex.props(styles.copy)}>
            <p {...stylex.props(styles.eyebrow)}>One quiet download</p>
            <h2 {...stylex.props(styles.title)}>
              Keep the whole index
              <br />
              close at hand.
            </h2>
            <p {...stylex.props(styles.description)}>
              Download the card library to this device for instant search and offline browsing.
              Prices will still be fetched when you ask for them.
            </p>

            {state.kind === "error" ? (
              <p {...stylex.props(styles.error)} role="alert">
                {cleanError(state.message)}
              </p>
            ) : null}

            {downloading ? (
              <div {...stylex.props(styles.progressBlock)} aria-live="polite">
                <div {...stylex.props(styles.progressMeta)}>
                  <span>Building local index</span>
                  <span>
                    {progress?.total
                      ? `${progress.completed.toLocaleString()} / ${progress.total.toLocaleString()}`
                      : "Connecting…"}
                  </span>
                </div>
                <div
                  {...stylex.props(styles.progressTrack)}
                  role="progressbar"
                  aria-label="Downloading card library"
                  aria-valuemax={progress?.total || undefined}
                  aria-valuenow={progress?.total ? progress.completed : undefined}
                >
                  <motion.div
                    {...stylex.props(styles.progressFill)}
                    animate={{ scaleX: progressRatio }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  />
                </div>
              </div>
            ) : null}

            <div {...stylex.props(styles.actions)}>
              <button
                {...stylex.props(styles.primaryButton)}
                type="button"
                disabled={downloading}
                onClick={() => void download()}
              >
                {downloading
                  ? "Downloading…"
                  : state.kind === "error"
                    ? "Try again"
                    : "Download library"}
                <span aria-hidden="true">↓</span>
              </button>
              <button
                {...stylex.props(styles.secondaryButton)}
                type="button"
                disabled={downloading}
                onClick={() => setDismissed(true)}
              >
                Not now
              </button>
            </div>
          </div>
        </div>

        <p {...stylex.props(styles.footnote)}>
          Stored in Mooligan’s private application data. No folder selection needed.
        </p>
      </motion.div>
    </dialog>
  );
}

function cleanError(message: string) {
  return message.replace(/^Error invoking remote method '[^']+': Error: /, "");
}

const styles = stylex.create({
  dialog: {
    width: "min(760px, calc(100vw - 56px))",
    maxWidth: "none",
    margin: "auto",
    padding: 0,
    overflow: "visible",
    border: "1px solid #1b1d19",
    borderRadius: "3px",
    color: "#1b1d19",
    backgroundColor: "#f1efe8",
    boxShadow: "22px 24px 0 rgba(17, 18, 15, 0.22)",
  },
  panel: {
    padding: "0 30px 24px",
    backgroundImage:
      "radial-gradient(circle at 84% 12%, rgba(255, 255, 255, 0.92), transparent 30%)",
  },
  topline: {
    minHeight: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    borderBottom: "1px solid #c6c3b8",
    color: "#74766d",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.13em",
    textTransform: "uppercase",
  },
  layout: {
    paddingBlock: "34px 32px",
    display: "grid",
    gridTemplateColumns: "138px minmax(0, 1fr)",
    gap: "42px",
    alignItems: "start",
  },
  mark: {
    width: "118px",
    height: "164px",
    padding: "14px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "1px solid #1b1d19",
    borderRadius: "5px",
    backgroundColor: "#caff42",
    boxShadow: "11px 11px 0 #d6d3c9, 12px 12px 0 #1b1d19",
    transform: "rotate(-2.5deg)",
  },
  markNumber: {
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "42px",
    lineHeight: 0.8,
  },
  markLabel: {
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  copy: {
    minWidth: 0,
  },
  eyebrow: {
    margin: "0 0 15px",
    color: "#6b6d64",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#1b1d19",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "clamp(34px, 5vw, 49px)",
    fontWeight: 400,
    letterSpacing: "-0.045em",
    lineHeight: 0.94,
  },
  description: {
    maxWidth: "475px",
    margin: "21px 0 0",
    color: "#62645c",
    fontSize: "12px",
    lineHeight: 1.65,
  },
  error: {
    margin: "18px 0 0",
    padding: "10px 12px",
    borderLeft: "3px solid #1b1d19",
    color: "#4a3b31",
    backgroundColor: "#e9d8c9",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  progressBlock: {
    marginTop: "22px",
  },
  progressMeta: {
    marginBottom: "9px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    color: "#696b62",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  progressTrack: {
    height: "7px",
    overflow: "hidden",
    border: "1px solid #1b1d19",
    backgroundColor: "#dedbd1",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#caff42",
    transform: "scaleX(0)",
    transformOrigin: "left center",
  },
  actions: {
    marginTop: "25px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },
  primaryButton: {
    minWidth: "190px",
    minHeight: "44px",
    paddingInline: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    border: "1px solid #1b1d19",
    borderRadius: "2px",
    color: "#f4f1e8",
    backgroundColor: "#1b1d19",
    fontSize: "11px",
    cursor: "pointer",
    transition: "transform 160ms ease, background-color 160ms ease",
    ":hover": {
      transform: "translateY(-2px)",
      backgroundColor: "#2a2c27",
    },
    ":focus-visible": {
      outline: "2px solid #1b1d19",
      outlineOffset: "3px",
    },
    ":disabled": {
      transform: "none",
      color: "#aeb0a6",
      backgroundColor: "#3c3e38",
      cursor: "wait",
    },
  },
  secondaryButton: {
    minHeight: "44px",
    paddingInline: "16px",
    border: 0,
    color: "#686a62",
    backgroundColor: "transparent",
    fontSize: "10px",
    cursor: "pointer",
    ":hover": {
      color: "#1b1d19",
    },
    ":focus-visible": {
      outline: "2px solid #1b1d19",
      outlineOffset: "2px",
    },
    ":disabled": {
      color: "#a4a59e",
      cursor: "wait",
    },
  },
  footnote: {
    margin: 0,
    paddingTop: "15px",
    borderTop: "1px solid #c6c3b8",
    color: "#85867e",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "7px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
});
