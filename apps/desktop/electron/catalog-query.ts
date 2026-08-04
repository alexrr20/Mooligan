import type { DatabaseSync } from "node:sqlite";

export type CatalogCardSummary = {
  collectorNumber: string;
  gridImageUrl: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
  rarity: string;
  setCode: string;
  setName: string;
  typeLine: string;
};

export type CatalogListRequest = {
  hideArtSeries?: boolean;
  limit?: number;
  offset?: number;
  query?: string;
  uniqueCards?: boolean;
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
                     COALESCE(
                       json_extract(cards.json, '$.image_uris.small'),
                       json_extract(cards.json, '$.card_faces[0].image_uris.small'),
                       json_extract(cards.json, '$.image_uris.normal'),
                       json_extract(cards.json, '$.card_faces[0].image_uris.normal')
                     ) AS imageUrl,
                     COALESCE(
                       json_extract(cards.json, '$.image_uris.normal'),
                       json_extract(cards.json, '$.card_faces[0].image_uris.normal'),
                       json_extract(cards.json, '$.image_uris.small'),
                       json_extract(cards.json, '$.card_faces[0].image_uris.small')
                     ) AS gridImageUrl,
                     cards.set_code AS setCode,
                     cards.set_name AS setName,
                     cards.collector_number AS collectorNumber,
                     cards.type_line AS typeLine,
                     cards.rarity`;
const summaryColumns =
  "id, name, imageUrl, gridImageUrl, setCode, setName, collectorNumber, typeLine, rarity";
const artSeriesFilter =
  "NOT ? OR COALESCE(json_extract(cards.json, '$.layout'), '') <> 'art_series'";

export function createCatalogQuery(database: DatabaseSync) {
  const browse = database.prepare(
    `SELECT ${cardColumns}
     FROM cards
     WHERE ${artSeriesFilter}
     ORDER BY cards.name COLLATE NOCASE,
              cards.set_code COLLATE NOCASE,
              cards.collector_number COLLATE NOCASE
     LIMIT ? OFFSET ?`,
  );
  const search = database.prepare(
    `SELECT ${cardColumns}
     FROM card_search
     JOIN cards ON cards.rowid = card_search.rowid
     WHERE card_search MATCH ? AND (${artSeriesFilter})
     ORDER BY rank
     LIMIT ? OFFSET ?`,
  );
  const browseUniqueCards = database.prepare(
    `WITH ranked AS (
       SELECT ${cardColumns},
              ROW_NUMBER() OVER (
                PARTITION BY COALESCE(cards.oracle_id, cards.id)
                ORDER BY cards.set_code COLLATE NOCASE,
                         cards.collector_number COLLATE NOCASE,
                         cards.id
              ) AS printingRank
       FROM cards
       WHERE ${artSeriesFilter}
     )
     SELECT ${summaryColumns}
     FROM ranked
     WHERE printingRank = 1
     ORDER BY name COLLATE NOCASE,
              setCode COLLATE NOCASE,
              collectorNumber COLLATE NOCASE
     LIMIT ? OFFSET ?`,
  );
  const searchUniqueCards = database.prepare(
    `WITH matches AS (
       SELECT ${cardColumns},
              cards.oracle_id AS oracleId,
              card_search.rank AS searchRank
       FROM card_search
       JOIN cards ON cards.rowid = card_search.rowid
       WHERE card_search MATCH ? AND (${artSeriesFilter})
     ), ranked AS (
       SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY COALESCE(oracleId, id)
                ORDER BY searchRank,
                         setCode COLLATE NOCASE,
                         collectorNumber COLLATE NOCASE,
                         id
              ) AS printingRank
       FROM matches
     )
     SELECT ${summaryColumns}
     FROM ranked
     WHERE printingRank = 1
     ORDER BY searchRank,
              name COLLATE NOCASE,
              setCode COLLATE NOCASE,
              collectorNumber COLLATE NOCASE
     LIMIT ? OFFSET ?`,
  );
  const catalogTotal = database.prepare(
    "SELECT card_count AS total FROM catalog_meta WHERE singleton = 1",
  );
  const nonArtSeriesTotal = database.prepare(
    "SELECT COUNT(*) AS total FROM cards WHERE COALESCE(json_extract(json, '$.layout'), '') <> 'art_series'",
  );
  const uniqueCardTotal = database.prepare(
    `SELECT COUNT(DISTINCT COALESCE(oracle_id, id)) AS total
     FROM cards
     WHERE ${artSeriesFilter}`,
  );

  return (input: CatalogListRequest = {}): CatalogListPage => {
    const request = validateCatalogListRequest(input);
    const limit =
      Number.isSafeInteger(request.limit) && request.limit! > 0
        ? Math.min(request.limit!, 250)
        : 100;
    const offset =
      Number.isSafeInteger(request.offset) && request.offset! >= 0 ? request.offset! : 0;
    const query = request.query?.trim().slice(0, 100) ?? "";
    const ftsQuery = toFtsQuery(query);
    const hideArtSeries = request.hideArtSeries === true;
    const uniqueCards = request.uniqueCards === true;

    if (query && !ftsQuery) {
      return { cards: [], hasMore: false, total: 0 };
    }

    const statement = uniqueCards
      ? ftsQuery
        ? searchUniqueCards
        : browseUniqueCards
      : ftsQuery
        ? search
        : browse;
    const rows = (
      ftsQuery
        ? statement.all(ftsQuery, Number(hideArtSeries), limit + 1, offset)
        : statement.all(Number(hideArtSeries), limit + 1, offset)
    ) as CatalogCardSummary[];
    const hasMore = rows.length > limit;
    const cards = rows.slice(0, limit).map((row) => ({ ...row }));
    const total = ftsQuery
      ? hasMore
        ? null
        : offset + cards.length
      : (
          (uniqueCards
            ? uniqueCardTotal.get(Number(hideArtSeries))
            : hideArtSeries
              ? nonArtSeriesTotal.get()
              : catalogTotal.get()) as { total: number }
        ).total;

    return { cards, hasMore, total };
  };
}

export function validateCatalogListRequest(value: unknown): CatalogListRequest {
  if (value === undefined) {
    return {};
  }
  if (
    !isRecord(value) ||
    Object.keys(value).some(
      (key) => !["hideArtSeries", "limit", "offset", "query", "uniqueCards"].includes(key),
    ) ||
    (Object.hasOwn(value, "hideArtSeries") && typeof value.hideArtSeries !== "boolean") ||
    (Object.hasOwn(value, "uniqueCards") && typeof value.uniqueCards !== "boolean") ||
    (Object.hasOwn(value, "query") &&
      (typeof value.query !== "string" || value.query.length > 500)) ||
    (Object.hasOwn(value, "limit") &&
      (typeof value.limit !== "number" ||
        !Number.isSafeInteger(value.limit) ||
        value.limit < 1 ||
        value.limit > 250)) ||
    (Object.hasOwn(value, "offset") &&
      (typeof value.offset !== "number" || !Number.isSafeInteger(value.offset) || value.offset < 0))
  ) {
    throw new TypeError("Invalid catalog list request.");
  }

  return { ...value };
}

function toFtsQuery(query: string) {
  return (query.match(/[\p{L}\p{N}]+/gu) ?? []).map((term) => `"${term}"*`).join(" AND ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
