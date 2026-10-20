-- ============================================================================
-- TRACK STACK: Phase 4 Database Migration
-- Events, Teams, Registrations, Certificates, Duty Leave, and Transcripts
-- ============================================================================

-- 1. EVENTS TABLE (Campus & Inter-Campus Events)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Sports', 'Technical', 'Academic', 'Cultural')),
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL, -- NULL means Inter-Campus
    banner_url TEXT,
    venue TEXT NOT NULL,
    rules TEXT NOT NULL,
    schedule_details TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_start TIMESTAMPTZ NOT NULL,
    registration_end TIMESTAMPTZ NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('individual', 'team', 'both')),
    min_team_size INTEGER NOT NULL DEFAULT 1,
    max_team_size INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL DEFAULT 100,
    is_inter_campus BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'live', 'completed', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EVENT TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.event_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('forming', 'registered', 'waitlisted', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, name)
);

-- 3. EVENT REGISTRATIONS TABLE (Enforces 1 registration & team per event)
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.event_teams(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'individual' CHECK (role IN ('leader', 'member', 'individual')),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'invited', 'declined', 'cancelled')),
    checked_in BOOLEAN NOT NULL DEFAULT false,
    checkin_time TIMESTAMPTZ,
    position TEXT CHECK (position IS NULL OR position IN ('1st', '2nd', '3rd', 'finalist', 'participant')),
    score NUMERIC,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

-- 4. CERTIFICATES TABLE (With HMAC-SHA256 Cryptographic Signature)
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY, -- e.g. 'MSOT-CERT-2026-0001'
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('participation', 'achievement', 'winner')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    signatory_name TEXT NOT NULL,
    signatory_title TEXT NOT NULL,
    canonical_data TEXT NOT NULL,
    signature TEXT NOT NULL,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DUTY LEAVE REQUESTS TABLE (Auto-created for Inter-Campus Events)
CREATE TABLE IF NOT EXISTS public.duty_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    event_registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    dates TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approver_comments TEXT,
    letter_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

-- 6. CERTIFICATE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    header_logo_url TEXT,
    signatory_name TEXT NOT NULL DEFAULT 'Dr. Vikram Malhotra',
    signatory_title TEXT NOT NULL DEFAULT 'Dean of Student Affairs & Campus Director',
    default_border_color TEXT NOT NULL DEFAULT '#0284C7',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR FAST CONCURRENT LOOKUPS & INTEGRITY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_inter_campus ON public.events(is_inter_campus);
CREATE INDEX IF NOT EXISTS idx_event_teams_event ON public.event_teams(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_team ON public.event_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_duty_leaves_user ON public.duty_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_duty_leaves_status ON public.duty_leaves(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Events: Everyone can view published/live events; Admin/Campus Manager can manage
CREATE POLICY "Public read on active events"
    ON public.events FOR SELECT
    USING (status IN ('published', 'live', 'completed') OR auth.role() = 'authenticated');

CREATE POLICY "Admin & Campus Manager manage events"
    ON public.events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'campus_manager')
        )
    );

-- Event Registrations: Users read own and event roster; register self
CREATE POLICY "Users view registrations"
    ON public.event_registrations FOR SELECT
    USING (true);

CREATE POLICY "Users register self"
    ON public.event_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin & Manager update registrations"
    ON public.event_registrations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'campus_manager')
        )
    );

-- Certificates: Public read for verification; Admins/Advisors issue
CREATE POLICY "Public read on certificates for verification"
    ON public.certificates FOR SELECT
    USING (true);

CREATE POLICY "Staff can issue certificates"
    ON public.certificates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'campus_manager', 'faculty_advisor')
        )
    );

CREATE POLICY "Admin revoke certificates"
    ON public.certificates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'campus_manager')
        )
    );

-- Duty Leave: Students see own; Campus Manager approves
CREATE POLICY "Students view own duty leaves"
    ON public.duty_leaves FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'campus_manager')
        )
    );

CREATE POLICY "Campus Manager approve duty leaves"
    ON public.duty_leaves FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'campus_manager')
        )
    );

-- ============================================================================
-- TRIGGERS: AUTO-CREATE DUTY LEAVE ON INTER-CAMPUS REGISTRATION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_auto_create_duty_leave()
RETURNS TRIGGER AS $$
DECLARE
    v_is_inter_campus BOOLEAN;
    v_event_name TEXT;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
BEGIN
    SELECT is_inter_campus, name, start_date, end_date
    INTO v_is_inter_campus, v_event_name, v_start_date, v_end_date
    FROM public.events
    WHERE id = NEW.event_id;

    IF v_is_inter_campus AND NEW.status = 'confirmed' THEN
        INSERT INTO public.duty_leaves (
            user_id,
            event_id,
            event_registration_id,
            dates,
            reason,
            status
        ) VALUES (
            NEW.user_id,
            NEW.event_id,
            NEW.id,
            to_char(v_start_date, 'YYYY-MM-DD') || ' to ' || to_char(v_end_date, 'YYYY-MM-DD'),
            'Participation in inter-campus flagship event: ' || v_event_name,
            'pending'
        ) ON CONFLICT (event_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_registration_duty_leave ON public.event_registrations;
CREATE TRIGGER trg_event_registration_duty_leave
    AFTER INSERT OR UPDATE OF status ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_auto_create_duty_leave();
