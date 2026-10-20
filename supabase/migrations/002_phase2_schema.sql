-- ============================================================================
-- TRACK STACK: Phase 2 Database Migration
-- Club Day Calendar, Activity Planning, Activity Comments, Membership Limits & Triggers
-- ============================================================================

-- 1. CLUB DAYS TABLE
CREATE TABLE IF NOT EXISTS public.club_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    academic_term TEXT NOT NULL DEFAULT 'Term 1 2026-27',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'planning', 'announced', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campus_id, date)
);

-- 2. ACTIVITIES TABLE
-- Planning per club per Club Day with status machine:
-- draft > submitted > approved / changes_requested > announced > live > closed > evaluated
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    club_day_id UUID NOT NULL REFERENCES public.club_days(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'workshop' CHECK (format IN ('workshop', 'hackathon', 'practice', 'performance', 'discussion', 'guest_lecture', 'competition')),
    venue TEXT NOT NULL,
    description TEXT NOT NULL,
    deliverable_spec TEXT,
    submission_deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'changes_requested', 'announced', 'live', 'closed', 'evaluated')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, club_day_id)
);

-- 3. ACTIVITY COMMENTS TABLE
-- Comment thread for Advisor approval and feedback
CREATE TABLE IF NOT EXISTS public.activity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'change_request', 'approval')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PHASE 2
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_club_days_campus ON public.club_days(campus_id);
CREATE INDEX IF NOT EXISTS idx_club_days_date ON public.club_days(date);
CREATE INDEX IF NOT EXISTS idx_activities_club ON public.activities(club_id);
CREATE INDEX IF NOT EXISTS idx_activities_club_day ON public.activities(club_day_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON public.activity_comments(activity_id);

-- ============================================================================
-- MEMBERSHIP RULES & LIMIT ENFORCEMENT
-- ============================================================================

-- Function to get the student's allowed max clubs from settings
CREATE OR REPLACE FUNCTION public.get_student_club_limit(student_profile_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_limit INTEGER := 2;
    settings_val JSONB;
    student_year INTEGER;
    year_override INTEGER;
BEGIN
    -- Read settings table
    SELECT value INTO settings_val FROM public.settings WHERE key = 'membership_rules';
    
    IF settings_val IS NOT NULL THEN
        -- Default limit
        IF (settings_val->>'max_clubs_per_student') IS NOT NULL THEN
            default_limit := (settings_val->>'max_clubs_per_student')::INTEGER;
        END IF;

        -- Check year of study override
        SELECT year_of_study INTO student_year FROM public.profiles WHERE id = student_profile_id;
        IF student_year IS NOT NULL AND (settings_val->'year_overrides'->(student_year::text)) IS NOT NULL THEN
            year_override := (settings_val->'year_overrides'->(student_year::text))::INTEGER;
            RETURN year_override;
        END IF;
    END IF;

    RETURN default_limit;
END;
$$;

-- Trigger Function: Enforce 2-club limit & capacity check on club_members
CREATE OR REPLACE FUNCTION public.check_club_membership_limit_and_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    allowed_limit INTEGER;
    active_count INTEGER;
    club_cap INTEGER;
    current_enrolled INTEGER;
    max_waitlist_pos INTEGER;
BEGIN
    -- Only check limit if membership is active or pending join
    IF NEW.status IN ('approved', 'pending') THEN
        allowed_limit := public.get_student_club_limit(NEW.user_id);

        -- Count current active clubs for this student (excluding the one being modified)
        SELECT COUNT(*) INTO active_count
        FROM public.club_members
        WHERE user_id = NEW.user_id 
          AND status IN ('approved', 'pending')
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

        IF (active_count + 1) > allowed_limit THEN
            RAISE EXCEPTION 'Membership limit exceeded: Students are allowed a maximum of % clubs. You currently have % active/pending memberships.', allowed_limit, active_count;
        END IF;
    END IF;

    -- Check capacity when a student is attempting to join / be approved
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        SELECT capacity INTO club_cap FROM public.clubs WHERE id = NEW.club_id;
        SELECT COUNT(*) INTO current_enrolled FROM public.club_members WHERE club_id = NEW.club_id AND status = 'approved';

        -- If club is full, automatically put student on waitlist
        IF current_enrolled >= club_cap THEN
            SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO max_waitlist_pos
            FROM public.club_members
            WHERE club_id = NEW.club_id AND status = 'waitlisted';

            NEW.status := 'waitlisted';
            NEW.waitlist_position := max_waitlist_pos;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_club_membership_limit ON public.club_members;
CREATE TRIGGER trg_enforce_club_membership_limit
BEFORE INSERT OR UPDATE ON public.club_members
FOR EACH ROW
EXECUTE FUNCTION public.check_club_membership_limit_and_capacity();

-- Function to promote next waitlisted student when a seat opens up
CREATE OR REPLACE FUNCTION public.promote_waitlist_on_member_departure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_waitlisted_id UUID;
BEGIN
    -- When a member withdraws, is rejected, or is deleted
    IF (TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status IN ('withdrawn', 'rejected')) 
       OR (TG_OP = 'DELETE' AND OLD.status = 'approved') THEN
       
        SELECT id INTO next_waitlisted_id
        FROM public.club_members
        WHERE club_id = OLD.club_id AND status = 'waitlisted'
        ORDER BY waitlist_position ASC
        LIMIT 1;

        IF next_waitlisted_id IS NOT NULL THEN
            UPDATE public.club_members
            SET status = 'pending', waitlist_position = NULL, updated_at = NOW()
            WHERE id = next_waitlisted_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_waitlist ON public.club_members;
CREATE TRIGGER trg_promote_waitlist
AFTER UPDATE OR DELETE ON public.club_members
FOR EACH ROW
EXECUTE FUNCTION public.promote_waitlist_on_member_departure();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR PHASE 2 TABLES
-- ============================================================================

ALTER TABLE public.club_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- 1. Club Days: All authenticated can view; Admin and Campus Manager can edit/import
CREATE POLICY "Club days are viewable by all authenticated users"
    ON public.club_days FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Campus Managers can manage club days"
    ON public.club_days FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin') 
        OR public.has_role(auth.uid(), 'campus_manager', campus_id)
    );

-- 2. Activities:
-- - Approved/Announced/Live/Closed/Evaluated activities are viewable by all
-- - Draft / Submitted / Changes_Requested are viewable ONLY by:
--   * Club Coordinator (own club)
--   * Faculty Advisor (assigned club)
--   * Campus Manager & Admin
CREATE POLICY "Activities viewable based on status and assigned role"
    ON public.activities FOR SELECT TO authenticated
    USING (
        status NOT IN ('draft', 'submitted', 'changes_requested')
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
        OR public.has_role(auth.uid(), 'faculty_advisor', NULL, club_id)
        OR public.has_role(auth.uid(), 'campus_manager')
    );

-- Coordinators can create and edit their own club's activities
CREATE POLICY "Coordinators can create and edit own club activities"
    ON public.activities FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
        OR public.has_role(auth.uid(), 'faculty_advisor', NULL, club_id)
    );

-- 3. Activity Comments:
-- Viewable by coordinators of that club, advisors of that club, and admins
CREATE POLICY "Activity comments viewable by club leaders and admins"
    ON public.activity_comments FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.activities a 
            WHERE a.id = activity_id 
              AND (
                  public.has_role(auth.uid(), 'admin')
                  OR public.has_role(auth.uid(), 'student_coordinator', NULL, a.club_id)
                  OR public.has_role(auth.uid(), 'faculty_advisor', NULL, a.club_id)
                  OR public.has_role(auth.uid(), 'campus_manager')
              )
        )
    );

CREATE POLICY "Activity comments insertable by authorized reviewers"
    ON public.activity_comments FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.activities a 
            WHERE a.id = activity_id 
              AND (
                  public.has_role(auth.uid(), 'admin')
                  OR public.has_role(auth.uid(), 'student_coordinator', NULL, a.club_id)
                  OR public.has_role(auth.uid(), 'faculty_advisor', NULL, a.club_id)
              )
        )
    );
