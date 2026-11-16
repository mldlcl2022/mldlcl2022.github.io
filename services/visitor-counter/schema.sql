CREATE TABLE IF NOT EXISTS visits (
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  PRIMARY KEY (day, visitor_hash)
);
CREATE TABLE IF NOT EXISTS counts (
  bucket TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
CREATE TRIGGER IF NOT EXISTS count_visit AFTER INSERT ON visits BEGIN
  INSERT INTO counts (bucket, value) VALUES (NEW.day, 1)
    ON CONFLICT (bucket) DO UPDATE SET value = value + 1;
  INSERT INTO counts (bucket, value) VALUES ('total', 1)
    ON CONFLICT (bucket) DO UPDATE SET value = value + 1;
END;
