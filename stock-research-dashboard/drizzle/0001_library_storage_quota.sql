-- Account quotas include archived entries, so archiving cannot bypass storage limits.
CREATE TRIGGER library_storage_quota_guard
BEFORE INSERT ON library_items
BEGIN
  SELECT CASE WHEN (SELECT COUNT(*) FROM library_items WHERE owner_id=NEW.owner_id)>=1000
    OR COALESCE((SELECT SUM(size) FROM library_items WHERE owner_id=NEW.owner_id),0)+NEW.size>262144000
    THEN RAISE(ABORT, 'library storage quota exceeded') END;
END;
