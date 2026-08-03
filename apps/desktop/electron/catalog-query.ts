import type { DatabaseSync } from "node:sqlite";

export type CatalogCardSummary = {
  collectorNumber: string;
  id: string;
  name: string;
  rarity: string;
  setCode: string;
  setName: string;
  typeLine: string;
};

export type CatalogListRequest = {
  limit?: number;
  offset?: number;
  query?: string;
};

export type CatalogListPage = {
  cards: CatalogCardSummary[];
  hasMore: boolean;
  total: number | null;
};

export type CatalogQueryWorkerRequest = {
  id: number;
  request: CatalogListRequest;
};

export type CatalogQueryWorkerResponse =
  | { id: number; page: CatalogListPage }
  | { error: string; id: number };

const cardColumns = `cards.id,
                     cards.name,
                     cards.set_code AS setCode,
                     cards.set_name AS setName,
                     cards.collector_number AS collectorNumber,
                     cards.type_line AS typeLine,
                     cards.rarity`;

export function createCatalogQuery(database: DatabaseSync) {
  const browse = database.prepare(
    `SELECT ${cardColumns}
     FROM cards
     ORDER BY cards.name COLLATE NOCASE,
              cards.set_code COLLATE NOCASE,
              cards.collector_number COLLATE NOCASE
     LIMIT ? OFFSET ?`,
  );
  const search = database.prepare(
    `SELECT ${cardColumns}
     FROM card_search
     JOIN cards ON cards.rowid = card_search.rowid
     WHERE card_search MATCH ?
     ORDER BY rank
     LIMIT ? OFFSET ?`,
  );
  const catalogTotal = database.prepare(
    "SELECT card_count AS total FROM catalog_meta WHERE singleton = 1",
  );

  return (request: CatalogListRequest = {}): CatalogListPage => {
    const limit =
      Number.isSafeInteger(request.limit) && request.limit! > 0
        ? Math.min(request.limit!, 250)
        : 100;
    const offset =
      Number.isSafeInteger(request.offset) && request.offset! >= 0 ? request.offset! : 0;
    const query = request.query?.trim().slice(0, 100) ?? "";
    const ftsQuery = toFtsQuery(query);

    if (query && !ftsQuery) {
      return { cards: [], hasMore: false, total: 0 };
    }

    const rows = (
      ftsQuery ? search.all(ftsQuery, limit + 1, offset) : browse.all(limit + 1, offset)
    ) as CatalogCardSummary[];
    const hasMore = rows.length > limit;
    const cards = rows.slice(0, limit).map((row) => ({ ...row }));
    const total = ftsQuery
      ? hasMore
        ? null
        : offset + cards.length
      : (catalogTotal.get() as { total: number }).total;

    return { cards, hasMore, total };
  };
}

function toFtsQuery(query: string) {
  return (query.match(/[\p{L}\p{N}]+/gu) ?? []).map((term) => `"${term}"*`).join(" AND ");
}
