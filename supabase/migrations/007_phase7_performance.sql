-- ============================================================================
-- MIGRATION 007: Performance Optimization & Query Indexing (Phase 7)
-- ============================================================================

-- 1. Attendances table indexes for sub-second concurrent check-ins
CREATE INDEX IF NOT EXISTS idx_attendances_session_user 
  ON attendances(session_id, user_id);

CREATE INDEX IF NOT EXISTS idx_attendances_activity_status 
  ON attendances(activity_id, status);

CREATE INDEX IF NOT EXISTS idx_attendances_device_fingerprint 
  ON attendances(device_fingerprint);

-- 2. Submissions table indexes for fast evaluation lookup
CREATE INDEX IF NOT EXISTS idx_submissions_activity_user 
  ON submissions(activity_id, user_id);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
  ON submissions(created_at DESC);

-- 3. Events & registrations indexes for 500+ student concurrency
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_user 
  ON event_registrations(event_id, user_id);

CREATE INDEX IF NOT EXISTS idx_event_teams_event_id 
  ON event_teams(event_id);

-- 4. User profile & membership indexes for role verification
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_club 
  ON club_memberships(user_id, club_id);

CREATE INDEX IF NOT EXISTS idx_users_campus_role 
  ON users(campus_id, role);

-- 5. Audit log index for sub-second admin query response
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
  ON audit_log(created_at DESC);

-- 6. Connection pooling & query plan note:
-- In Supabase production environments, connect via Transaction Pooler port 6543
-- (Supavisor) with statement_timeout = '5s' to ensure high concurrency throughput.
