-- ============================================================================
-- TRACK STACK: Phase 3 Database Migration
-- Check-in Sessions, Attendances, Submissions, and Rubric Evaluations
-- ============================================================================

-- 1. CHECKIN SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.checkin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    club_day_id UUID NOT NULL REFERENCES public.club_days(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    grace_until TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
    current_otp TEXT NOT NULL,
    geo_enabled BOOLEAN NOT NULL DEFAULT false,
    campus_lat NUMERIC(9, 6) DEFAULT 28.459500,
    campus_lng NUMERIC(9, 6) DEFAULT 77.026600,
    radius_meters NUMERIC DEFAULT 300,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ATTENDANCES TABLE
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.checkin_sessions(id) ON DELETE SET NULL,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    club_day_id UUID NOT NULL REFERENCES public.club_days(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused', 'late')),
    checkin_method TEXT NOT NULL DEFAULT 'qr' CHECK (checkin_method IN ('qr', 'code', 'manual_coordinator')),
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    distance_meters NUMERIC,
    device_hash TEXT,
    ip_hash TEXT,
    device_reuse_flag BOOLEAN NOT NULL DEFAULT false,
    is_presenter BOOLEAN NOT NULL DEFAULT false,
    spot_result TEXT CHECK (spot_result IS NULL OR spot_result IN ('winner', 'runner_up', 'honourable_mention', 'participant')),
    correction_reason TEXT,
    corrected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    corrected_at TIMESTAMPTZ,
    UNIQUE (club_day_id, club_id, user_id)
);

-- 3. SUBMISSIONS TABLE (With Version History)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    file_url TEXT,
    link_url TEXT,
    is_late BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (activity_id, user_id, version)
);

-- 4. EVALUATIONS TABLE (Rubric Scoring)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rubric_scores JSONB NOT NULL DEFAULT '{"content": 0, "presentation": 0, "participation": 0, "total": 0}'::jsonb,
    feedback TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (submission_id, evaluator_id)
);

-- ============================================================================
-- INDEXES FOR PHASE 3
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_club ON public.checkin_sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_day ON public.checkin_sessions(club_day_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_status ON public.checkin_sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendances_user ON public.attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_club ON public.attendances(club_id);
CREATE INDEX IF NOT EXISTS idx_attendances_day ON public.attendances(club_day_id);
CREATE INDEX IF NOT EXISTS idx_attendances_device_hash ON public.attendances(device_hash);
CREATE INDEX IF NOT EXISTS idx_submissions_activity ON public.submissions(activity_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON public.evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_published ON public.evaluations(is_published);

-- ============================================================================
-- AUDIT TRIGGER: Log Attendance Corrections
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_attendance_correction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (OLD.status != NEW.status OR OLD.spot_result IS DISTINCT FROM NEW.spot_result OR OLD.is_presenter != NEW.is_presenter)) THEN
        IF NEW.correction_reason IS NULL OR TRIM(NEW.correction_reason) = '' THEN
            RAISE EXCEPTION 'Attendance corrections require a mandatory reason.';
        END IF;

        INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, details)
        VALUES (
            NEW.corrected_by,
            'ATTENDANCE_CORRECTION',
            'attendances',
            NEW.id::text,
            jsonb_build_object(
                'student_id', NEW.user_id,
                'club_id', NEW.club_id,
                'club_day_id', NEW.club_day_id,
                'before_status', OLD.status,
                'after_status', NEW.status,
                'reason', NEW.correction_reason,
                'corrected_by', NEW.corrected_by
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_attendance_correction ON public.attendances;
CREATE TRIGGER trg_log_attendance_correction
BEFORE UPDATE ON public.attendances
FOR EACH ROW
EXECUTE FUNCTION public.log_attendance_correction();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR PHASE 3
-- ============================================================================
ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 1. Check-in Sessions
CREATE POLICY "Checkin sessions viewable by authenticated users"
    ON public.checkin_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Checkin sessions manageable by club coordinators and admins"
    ON public.checkin_sessions FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
        OR public.has_role(auth.uid(), 'campus_manager')
    );

-- 2. Attendances
CREATE POLICY "Students can view their own attendances"
    ON public.attendances FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
        OR public.has_role(auth.uid(), 'faculty_advisor', NULL, club_id)
        OR public.has_role(auth.uid(), 'campus_manager')
    );

CREATE POLICY "Students can insert their own attendance during checkin"
    ON public.attendances FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coordinators and Admins can update attendance with corrections"
    ON public.attendances FOR UPDATE TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
    );

-- 3. Submissions
CREATE POLICY "Submissions viewable by student owner and club reviewers"
    ON public.submissions FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_id
              AND (
                  public.has_role(auth.uid(), 'admin')
                  OR public.has_role(auth.uid(), 'faculty_advisor', NULL, a.club_id)
                  OR public.has_role(auth.uid(), 'student_coordinator', NULL, a.club_id)
              )
        )
    );

CREATE POLICY "Students can insert submissions for their activities"
    ON public.submissions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 4. Evaluations
CREATE POLICY "Evaluations viewable by reviewers, and by student ONLY IF published"
    ON public.evaluations FOR SELECT TO authenticated
    USING (
        (is_published = true AND auth.uid() = student_id)
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'faculty_advisor')
        OR public.has_role(auth.uid(), 'student_coordinator')
    );

CREATE POLICY "Evaluations manageable by advisors and coordinators"
    ON public.evaluations FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'faculty_advisor')
        OR public.has_role(auth.uid(), 'student_coordinator')
    );
