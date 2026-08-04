import { useCallback, useEffect, useRef, useState } from "react";

export function useCatalogSearch() {
  const [cards, setCards] = useState<CatalogCardSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [hideArtSeries, setHideArtSeries] = useState(false);
  const [uniqueCards, setUniqueCards] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialLoadStarted = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (nextQuery: string, nextUniqueCards: boolean, nextHideArtSeries: boolean, offset = 0) => {
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
        const page = await catalog.list({
          hideArtSeries: nextHideArtSeries,
          limit: 100,
          offset,
          query,
          uniqueCards: nextUniqueCards,
        });

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
    },
    [],
  );

  useEffect(() => {
    if (!initialLoadStarted.current) {
      initialLoadStarted.current = true;
      void load("", false, false);
    }
  }, [load]);

  useEffect(() => {
    const refresh = () => void load(activeQuery, uniqueCards, hideArtSeries);

    window.addEventListener("catalogready", refresh);
    return () => window.removeEventListener("catalogready", refresh);
  }, [activeQuery, hideArtSeries, load, uniqueCards]);

  const search = useCallback(
    (query: string) => void load(query, uniqueCards, hideArtSeries),
    [hideArtSeries, load, uniqueCards],
  );

  const changeUniqueCards = useCallback(
    (nextUniqueCards: boolean) => {
      setUniqueCards(nextUniqueCards);
      void load(activeQuery, nextUniqueCards, hideArtSeries);
    },
    [activeQuery, hideArtSeries, load],
  );

  const changeHideArtSeries = useCallback(
    (nextHideArtSeries: boolean) => {
      setHideArtSeries(nextHideArtSeries);
      void load(activeQuery, uniqueCards, nextHideArtSeries);
    },
    [activeQuery, load, uniqueCards],
  );

  const loadMore = useCallback(
    () => void load(activeQuery, uniqueCards, hideArtSeries, cards.length),
    [activeQuery, cards.length, hideArtSeries, load, uniqueCards],
  );

  return {
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
  };
}
