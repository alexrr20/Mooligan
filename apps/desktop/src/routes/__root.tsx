import * as stylex from "@stylexjs/stylex";
import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion, MotionConfig } from "motion/react";

import { CatalogSetup } from "../components/catalog-setup";

export const Route = createRootRoute({
  component: AppShell,
});

const navigation = [
  { to: "/", label: "Home", number: "01" },
  { to: "/collection", label: "Collection", number: "02" },
  { to: "/decks", label: "Decks", number: "03" },
  { to: "/sets", label: "Sets", number: "04" },
  { to: "/lists", label: "Lists", number: "05" },
  { to: "/search", label: "Search", number: "06" },
  { to: "/settings", label: "Settings", number: "07" },
] as const;

function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <MotionConfig reducedMotion="user">
      <div {...stylex.props(styles.app)}>
        <header {...stylex.props(styles.chrome)} data-window-drag-region>
          <span {...stylex.props(styles.wordmark)}>Mooligan</span>
          <span {...stylex.props(styles.windowTitle)}>The card keeper</span>
          <span {...stylex.props(styles.windowMeta)}>Local / Desktop</span>
        </header>

        <aside {...stylex.props(styles.sidebar)}>
          <div>
            <p {...stylex.props(styles.sectionLabel)}>Workspace</p>
            <nav {...stylex.props(styles.navigation)} aria-label="Primary" data-window-no-drag>
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  {...stylex.props(styles.navItem)}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{
                    style: {
                      color: "#1b1d19",
                      backgroundColor: "#caff42",
                    },
                  }}
                  to={item.to}
                >
                  <span {...stylex.props(styles.navNumber)}>{item.number}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div {...stylex.props(styles.localNote)}>
            <span {...stylex.props(styles.localDot)} aria-hidden="true" />
            <div>
              <p {...stylex.props(styles.localTitle)}>Local library</p>
              <p {...stylex.props(styles.localCopy)}>Your workspace lives on this device.</p>
            </div>
          </div>
        </aside>

        <main {...stylex.props(styles.main)} data-window-no-drag>
          <motion.div
            key={pathname}
            {...stylex.props(styles.route)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <CatalogSetup />
    </MotionConfig>
  );
}

const styles = stylex.create({
  app: {
    height: "100vh",
    display: "grid",
    gridTemplateColumns: {
      default: "238px minmax(0, 1fr)",
      "@media (max-width: 820px)": "190px minmax(0, 1fr)",
    },
    gridTemplateRows: "52px minmax(0, 1fr)",
    overflow: "hidden",
    backgroundColor: "#1b1d19",
  },
  chrome: {
    gridColumn: "1 / -1",
    display: "grid",
    gridTemplateColumns: {
      default: "238px 1fr 238px",
      "@media (max-width: 820px)": "190px 1fr 190px",
    },
    alignItems: "center",
    minWidth: 0,
    paddingInline: "22px",
    borderBottom: "1px solid #34362f",
    color: "#f4f1e8",
    backgroundColor: "#1b1d19",
  },
  wordmark: {
    paddingLeft: {
      default: "64px",
      "@media (max-width: 820px)": "52px",
    },
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "17px",
    letterSpacing: "-0.01em",
  },
  windowTitle: {
    overflow: "hidden",
    color: "#a6a89d",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "9px",
    letterSpacing: "0.15em",
    textAlign: "center",
    textOverflow: "ellipsis",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  windowMeta: {
    color: "#73766b",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.12em",
    textAlign: "right",
    textTransform: "uppercase",
  },
  sidebar: {
    minHeight: 0,
    padding: "34px 20px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid #34362f",
    color: "#d9d9cf",
    backgroundColor: "#1b1d19",
  },
  sectionLabel: {
    margin: "0 12px 18px",
    color: "#70736a",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },
  navigation: {
    display: "grid",
    gap: "4px",
  },
  navItem: {
    minHeight: "42px",
    paddingInline: "12px",
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    alignItems: "center",
    borderRadius: "2px",
    color: "#b7b9af",
    backgroundColor: "transparent",
    fontSize: "13px",
    textDecoration: "none",
    transition: "color 160ms ease, background-color 160ms ease",
    ":hover": {
      color: "#f7f4eb",
      backgroundColor: "#262823",
    },
    ":focus-visible": {
      outline: "2px solid #caff42",
      outlineOffset: "2px",
    },
  },
  navNumber: {
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    opacity: 0.62,
  },
  localNote: {
    padding: "16px 12px 0",
    display: "grid",
    gridTemplateColumns: "8px 1fr",
    gap: "10px",
    borderTop: "1px solid #34362f",
  },
  localDot: {
    width: "6px",
    height: "6px",
    marginTop: "5px",
    borderRadius: "50%",
    backgroundColor: "#caff42",
    boxShadow: "0 0 0 3px rgba(202, 255, 66, 0.09)",
  },
  localTitle: {
    margin: "0 0 4px",
    color: "#d9d9cf",
    fontSize: "11px",
  },
  localCopy: {
    margin: 0,
    color: "#70736a",
    fontSize: "9px",
    lineHeight: 1.5,
  },
  main: {
    minWidth: 0,
    minHeight: 0,
    overflowY: "auto",
    backgroundColor: "#f1efe8",
    backgroundImage: "radial-gradient(circle at 88% 4%, rgba(255, 255, 255, 0.9), transparent 30%)",
  },
  route: {
    minHeight: "100%",
  },
});
