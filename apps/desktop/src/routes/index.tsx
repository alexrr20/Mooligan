import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Page } from "../components/page";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Page
      description="A quiet place to catalog cards, shape decks, and keep the next idea within reach."
      eyebrow="Welcome back"
      number="01"
      title="Keep good cards in play."
    >
      <section {...stylex.props(styles.quickGrid)} aria-label="Quick starts">
        <Link {...stylex.props(styles.quickLink, styles.quickLinkAccent)} to="/collection">
          <span {...stylex.props(styles.cardMeta)}>02 / Collection</span>
          <strong {...stylex.props(styles.cardTitle)}>Catalog what you own.</strong>
          <span {...stylex.props(styles.arrow)} aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link {...stylex.props(styles.quickLink)} to="/decks">
          <span {...stylex.props(styles.cardMeta)}>03 / Decks</span>
          <strong {...stylex.props(styles.cardTitle)}>Shape the next build.</strong>
          <span {...stylex.props(styles.arrow)} aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link {...stylex.props(styles.quickLink)} to="/search">
          <span {...stylex.props(styles.cardMeta)}>06 / Search</span>
          <strong {...stylex.props(styles.cardTitle)}>Find a card quickly.</strong>
          <span {...stylex.props(styles.arrow)} aria-hidden="true">
            ↗
          </span>
        </Link>
      </section>
    </Page>
  );
}

const styles = stylex.create({
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },
  quickLink: {
    minHeight: "190px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "1px solid #c9c6bb",
    borderRadius: "3px",
    color: "#252720",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    textDecoration: "none",
    transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
    ":hover": {
      transform: "translateY(-3px)",
      borderColor: "#8d8e84",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
    },
    ":focus-visible": {
      outline: "2px solid #1b1d19",
      outlineOffset: "3px",
    },
  },
  quickLinkAccent: {
    borderColor: "#1b1d19",
    color: "#f4f1e8",
    backgroundColor: "#1b1d19",
    ":hover": {
      borderColor: "#1b1d19",
      backgroundColor: "#292b26",
    },
  },
  cardMeta: {
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.12em",
    opacity: 0.66,
    textTransform: "uppercase",
  },
  cardTitle: {
    maxWidth: "180px",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: {
      default: "23px",
      "@media (max-width: 820px)": "20px",
    },
    fontWeight: 400,
    letterSpacing: "-0.025em",
    lineHeight: 1.08,
  },
  arrow: {
    alignSelf: "flex-end",
    fontSize: "18px",
  },
});
