DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS catalog_meta;

CREATE TABLE catalog_release (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  updated_at TEXT NOT NULL,
  download_url TEXT NOT NULL,
  compressed_size INTEGER NOT NULL CHECK (compressed_size > 0)
);
