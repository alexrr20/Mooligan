import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Page } from "../components/page";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [cards, setCards] = useState<CatalogCardSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialLoadStarted = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(async (nextQuery: string, offset = 0) => {
    const query = nextQuery.trim();
    const catalog = window.catalog;
    const id = ++requestId.current;

    if (!catalog) {
      setError("Catalog browsing is available in the desktop app.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    if (offset === 0) {
      setActiveQuery(query);
      setHasMore(false);
      setTotal(null);
    }

    try {
      const page = await catalog.list({ limit: 100, offset, query });

      if (id !== requestId.current) {
        return;
      }

      setCards((current) => (offset === 0 ? page.cards : [...current, ...page.cards]));
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch {
      if (id !== requestId.current) {
        return;
      }

      setCards([]);
      setHasMore(false);
      setTotal(0);
      setError("The local card index could not be read.");
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!initialLoadStarted.current) {
      initialLoadStarted.current = true;
      void load("");
    }
  }, [load]);

  useEffect(() => {
    const refresh = () => void load(activeQuery);

    window.addEventListener("catalogready", refresh);
    return () => window.removeEventListener("catalogready", refresh);
  }, [activeQuery, load]);

  const search = useCallback((query: string) => void load(query), [load]);

  return (
    <Page
      description="Browse every printing in the local card index, then narrow the shelves by name, set, collector number, or type."
      eyebrow="Index"
      number="06"
      title="Every card, accounted for."
    >
      <section {...stylex.props(styles.catalog)} aria-labelledby="catalog-title">
        <SearchControls activeQuery={activeQuery} loading={loading} onSearch={search} />

        <div {...stylex.props(styles.indexMeta)}>
          <h2 {...stylex.props(styles.indexTitle)} id="catalog-title">
            {activeQuery ? `Results for “${activeQuery}”` : "Complete card index"}
          </h2>
          <span {...stylex.props(styles.count)} aria-live="polite">
            {loading && cards.length === 0
              ? activeQuery
                ? "Searching…"
                : "Reading index…"
              : `${(total ?? cards.length).toLocaleString()}${total === null && hasMore ? "+" : ""} ${activeQuery ? "matches" : total === 1 ? "printing" : "printings"}`}
          </span>
        </div>

        {error ? (
          <div {...stylex.props(styles.message)} role="alert">
            <span {...stylex.props(styles.messageMark)} aria-hidden="true">
              !
            </span>
            <div>
              <strong {...stylex.props(styles.messageTitle)}>Index unavailable</strong>
              <p {...stylex.props(styles.messageCopy)}>{error}</p>
            </div>
          </div>
        ) : cards.length === 0 && !loading ? (
          <div {...stylex.props(styles.message)}>
            <span {...stylex.props(styles.messageMark)} aria-hidden="true">
              0
            </span>
            <div>
              <strong {...stylex.props(styles.messageTitle)}>No matching cards</strong>
              <p {...stylex.props(styles.messageCopy)}>
                Try a card name or a three-letter set code.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div {...stylex.props(styles.columnHead)} aria-hidden="true">
              <span>No.</span>
              <span>Card / Type</span>
              <span>Printing</span>
            </div>
            <ol {...stylex.props(styles.cardList)} start={1}>
              {cards.map((card, index) => (
                <li {...stylex.props(styles.cardRow)} key={card.id}>
                  <span {...stylex.props(styles.rowNumber)}>
                    {String(index + 1).padStart(3, "0")}
                  </span>
                  <div {...stylex.props(styles.cardIdentity)}>
                    <strong {...stylex.props(styles.cardName)}>{card.name}</strong>
                    <span {...stylex.props(styles.typeLine)}>{card.typeLine ?? "Card"}</span>
                  </div>
                  <div {...stylex.props(styles.printing)}>
                    <span {...stylex.props(styles.setCode)}>{card.setCode}</span>
                    <span {...stylex.props(styles.printingCopy)}>
                      {card.setName ?? "Unknown set"} · #{card.collectorNumber}
                      {card.rarity ? ` · ${card.rarity}` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
            {hasMore ? (
              <button
                {...stylex.props(styles.moreButton)}
                disabled={loading}
                type="button"
                onClick={() => void load(activeQuery, cards.length)}
              >
                <span>{loading ? "Reading…" : "Show 100 more"}</span>
                <span {...stylex.props(styles.moreCount)}>
                  {cards.length.toLocaleString()}
                  {total === null ? "+" : ` / ${total.toLocaleString()}`}
                </span>
              </button>
            ) : null}
          </>
        )}
      </section>
    </Page>
  );
}

type SearchControlsProps = {
  activeQuery: string;
  loading: boolean;
  onSearch: (query: string) => void;
};

function SearchControls({ activeQuery, loading, onSearch }: SearchControlsProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const nextQuery = query.trim();

    if (nextQuery === activeQuery) {
      return;
    }

    const timeout = window.setTimeout(() => onSearch(nextQuery), 160);
    return () => window.clearTimeout(timeout);
  }, [activeQuery, onSearch, query]);

  return (
    <form
      {...stylex.props(styles.searchBar)}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
    >
      <label {...stylex.props(styles.searchLabel)} htmlFor="card-search">
        Filter the index
      </label>
      <input
        {...stylex.props(styles.searchInput)}
        id="card-search"
        name="query"
        placeholder="Card, set, number, or type"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button {...stylex.props(styles.searchButton)} disabled={loading} type="submit">
        Search <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

const styles = stylex.create({
  catalog: {
    borderTop: "1px solid #1b1d19",
  },
  searchBar: {
    minHeight: "78px",
    display: "grid",
    gridTemplateColumns: {
      default: "150px minmax(0, 1fr) 132px",
      "@media (max-width: 820px)": "1fr 110px",
    },
    alignItems: "center",
    columnGap: "18px",
    borderBottom: "1px solid #bbb9af",
  },
  searchLabel: {
    color: "#6f7169",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    "@media (max-width: 820px)": {
      display: "none",
    },
  },
  searchInput: {
    width: "100%",
    minWidth: 0,
    padding: "13px 0",
    borderWidth: "0 0 1px",
    borderStyle: "solid",
    borderColor: "#9c9d94",
    borderRadius: 0,
    color: "#1b1d19",
    backgroundColor: "transparent",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "18px",
    outline: "none",
    "::placeholder": {
      color: "#9b9c94",
    },
    ":focus": {
      borderColor: "#1b1d19",
    },
  },
  searchButton: {
    minHeight: "42px",
    paddingInline: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    border: "1px solid #1b1d19",
    borderRadius: "2px",
    color: "#f4f1e8",
    backgroundColor: "#1b1d19",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background-color 160ms ease, color 160ms ease",
    ":hover:not(:disabled)": {
      color: "#1b1d19",
      backgroundColor: "#caff42",
    },
    ":focus-visible": {
      outline: "2px solid #1b1d19",
      outlineOffset: "3px",
    },
    ":disabled": {
      cursor: "wait",
      opacity: 0.58,
    },
  },
  indexMeta: {
    minHeight: "66px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    borderBottom: "1px solid #d0cdc3",
  },
  indexTitle: {
    margin: 0,
    color: "#252720",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "20px",
    fontWeight: 400,
    letterSpacing: "-0.02em",
  },
  count: {
    color: "#73756d",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
  },
  columnHead: {
    minHeight: "34px",
    display: "grid",
    gridTemplateColumns: {
      default: "54px minmax(0, 1fr) minmax(180px, 0.72fr)",
      "@media (max-width: 820px)": "42px minmax(0, 1fr) 150px",
    },
    alignItems: "center",
    borderBottom: "1px solid #bbb9af",
    color: "#8a8b83",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "7px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  cardList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  cardRow: {
    minHeight: "72px",
    display: "grid",
    gridTemplateColumns: {
      default: "54px minmax(0, 1fr) minmax(180px, 0.72fr)",
      "@media (max-width: 820px)": "42px minmax(0, 1fr) 150px",
    },
    alignItems: "center",
    borderBottom: "1px solid #d0cdc3",
    transition: "background-color 140ms ease, padding 140ms ease",
    ":hover": {
      paddingInline: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.55)",
    },
  },
  rowNumber: {
    color: "#989990",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.06em",
  },
  cardIdentity: {
    minWidth: 0,
    paddingRight: "22px",
    display: "grid",
    gap: "3px",
  },
  cardName: {
    overflow: "hidden",
    color: "#20221d",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "18px",
    fontWeight: 400,
    letterSpacing: "-0.015em",
    lineHeight: 1.1,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  typeLine: {
    overflow: "hidden",
    color: "#7b7c74",
    fontSize: "9px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  printing: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "42px minmax(0, 1fr)",
    alignItems: "center",
    gap: "10px",
  },
  setCode: {
    minHeight: "24px",
    display: "grid",
    placeItems: "center",
    border: "1px solid #b4b3aa",
    borderRadius: "2px",
    color: "#1b1d19",
    backgroundColor: "#caff42",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  printingCopy: {
    overflow: "hidden",
    color: "#70726a",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "7px",
    letterSpacing: "0.05em",
    lineHeight: 1.55,
    textOverflow: "ellipsis",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  message: {
    minHeight: "180px",
    display: "flex",
    alignItems: "center",
    gap: "22px",
    borderBottom: "1px solid #bbb9af",
  },
  messageMark: {
    width: "54px",
    height: "72px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    border: "1px solid #1b1d19",
    borderRadius: "3px",
    backgroundColor: "#caff42",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "9px",
    boxShadow: "6px 6px 0 #dedbd2",
  },
  messageTitle: {
    color: "#242620",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "22px",
    fontWeight: 400,
  },
  messageCopy: {
    margin: "6px 0 0",
    color: "#77786f",
    fontSize: "11px",
  },
  moreButton: {
    width: "100%",
    minHeight: "58px",
    paddingInline: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: "0 0 1px",
    borderStyle: "solid",
    borderColor: "#1b1d19",
    borderRadius: 0,
    color: "#1b1d19",
    backgroundColor: "transparent",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background-color 160ms ease",
    ":hover:not(:disabled)": {
      backgroundColor: "#caff42",
    },
    ":focus-visible": {
      outline: "2px solid #1b1d19",
      outlineOffset: "3px",
    },
    ":disabled": {
      cursor: "wait",
      opacity: 0.58,
    },
  },
  moreCount: {
    color: "#73756d",
  },
});
