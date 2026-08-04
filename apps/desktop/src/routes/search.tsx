import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Page } from "../components/page";
import { SearchForm, SearchToggle, SearchViewToggle } from "../features/search/search-controls";
import { SearchResults } from "../features/search/search-results";
import { useCatalogSearch } from "../features/search/use-catalog-search";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [gridView, setGridView] = useState(false);
  const {
    activeQuery,
    cards,
    changeHideArtSeries,
    changeUniqueCards,
    error,
    hasMore,
    hideArtSeries,
    loading,
    loadMore,
    search,
    total,
    uniqueCards,
  } = useCatalogSearch();

  return (
    <Page
      description="Browse the local card index by printing or card, then narrow the shelves by name, set, collector number, or type."
      eyebrow="Index"
      number="06"
      title="Every card, accounted for."
    >
      <section {...stylex.props(styles.catalog)} aria-labelledby="catalog-title">
        <SearchForm activeQuery={activeQuery} onSearch={search} />

        <div {...stylex.props(styles.indexMeta)}>
          <h2 {...stylex.props(styles.indexTitle)} id="catalog-title">
            {activeQuery ? `Results for “${activeQuery}”` : "Complete card index"}
          </h2>
          <div {...stylex.props(styles.indexActions)}>
            <SearchToggle
              checked={uniqueCards}
              label="One print per card"
              onChange={changeUniqueCards}
            />
            <SearchToggle
              checked={hideArtSeries}
              label="Hide art series"
              onChange={changeHideArtSeries}
            />
            <SearchViewToggle grid={gridView} onChange={setGridView} />
            <span {...stylex.props(styles.count)} aria-live="polite">
              {loading && cards.length === 0
                ? activeQuery
                  ? "Searching…"
                  : "Reading index…"
                : `${(total ?? cards.length).toLocaleString()}${total === null && hasMore ? "+" : ""} ${activeQuery ? "matches" : uniqueCards ? (total === 1 ? "card" : "cards") : total === 1 ? "printing" : "printings"}`}
            </span>
          </div>
        </div>

        <SearchResults
          cards={cards}
          error={error}
          grid={gridView}
          hasMore={hasMore}
          loading={loading}
          total={total}
          onLoadMore={loadMore}
        />
      </section>
    </Page>
  );
}

const styles = stylex.create({
  catalog: {
    borderTop: "1px solid #1b1d19",
  },
  indexMeta: {
    minHeight: "66px",
    paddingBlock: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "24px",
    borderBottom: "1px solid #d0cdc3",
  },
  indexActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: {
      default: "24px",
      "@media (max-width: 820px)": "12px",
    },
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
    whiteSpace: "nowrap",
  },
});
