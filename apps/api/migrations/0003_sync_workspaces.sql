CREATE TABLE sync_workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  owner_user_id TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE sync_workspace_bindings (
  local_workspace_id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES sync_workspaces (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE workspace_preferences (
  workspace_id TEXT NOT NULL REFERENCES sync_workspaces (id) ON DELETE CASCADE,
  key TEXT NOT NULL CHECK (key = 'motion'),
  value TEXT NOT NULL CHECK (value IN ('system', 'reduced', 'full')),
  version INTEGER NOT NULL CHECK (version > 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, key)
) STRICT;
