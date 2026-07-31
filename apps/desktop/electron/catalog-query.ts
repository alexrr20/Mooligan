import { DatabaseSync } from "node:sqlite";

export type CatalogCardSummary = {
  collectorNumber: string;
  id: string;
  name: string;
  rarity: string | null;
  setCode: string;
  setName: string | null;
  typeLine: string | null;
};

export type CatalogListRequest = {
  limit?: number;
  offset?: number;
  query?: string;
};

export type CatalogListPage = {
  cards: CatalogCardSummary[];
  total: number;
};

export function listCatalogCards(path: string, request: CatalogListRequest = {}): CatalogListPage {
  const limit =
    Number.isSafeInteger(request.limit) && request.limit! > 0 ? Math.min(request.limit!, 250) : 100;
  const offset = Number.isSafeInteger(request.offset) && request.offset! >= 0 ? request.offset! : 0;
  const query = request.query?.trim().slice(0, 100) ?? "";
  const value = `%${query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const filter = query
    ? `WHERE name LIKE ? ESCAPE '\\' COLLATE NOCASE
       OR set_code LIKE ? ESCAPE '\\' COLLATE NOCASE
       OR collector_number LIKE ? ESCAPE '\\' COLLATE NOCASE
       OR json_extract(json, '$.type_line') LIKE ? ESCAPE '\\' COLLATE NOCASE`
    : "";
  const parameters = query ? [value, value, value, value] : [];
  const database = new DatabaseSync(path, { readOnly: true });

  try {
    const rows = database
      .prepare(
        `SELECT id,
                name,
                set_code AS setCode,
                collector_number AS collectorNumber,
                json_extract(json, '$.set_name') AS setName,
                json_extract(json, '$.type_line') AS typeLine,
                json_extract(json, '$.rarity') AS rarity
         FROM cards
         ${filter}
         ORDER BY name COLLATE NOCASE, set_code COLLATE NOCASE, collector_number COLLATE NOCASE
         LIMIT ? OFFSET ?`,
      )
      .all(...parameters, limit, offset) as CatalogCardSummary[];
    const count = database
      .prepare(`SELECT COUNT(*) AS total FROM cards ${filter}`)
      .get(...parameters) as { total: number };

    return { cards: rows.map((row) => ({ ...row })), total: count.total };
  } finally {
    database.close();
  }
}
