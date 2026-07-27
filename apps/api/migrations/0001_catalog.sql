CREATE TABLE catalog_meta (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  version TEXT NOT NULL,
  card_count INTEGER NOT NULL CHECK (card_count >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  oracle_id TEXT,
  name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  collector_number TEXT NOT NULL,
  json TEXT NOT NULL CHECK (json_valid(json)),
  updated_at TEXT NOT NULL
);

CREATE INDEX cards_name ON cards (name);
CREATE INDEX cards_oracle_id ON cards (oracle_id);
CREATE INDEX cards_set_code ON cards (set_code);
