-- ============================================================================
-- TRACK STACK: Initial Database Migration (Phase 1)
-- Campuses, Profiles, User Roles, Clubs, Club Members, Settings, Audit Log, Notifications
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPUSES TABLE
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    student_id TEXT,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE RESTRICT,
    year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 5),
    program TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER ROLES TABLE
-- Roles: admin, campus_manager, faculty_advisor, student_coordinator, student
-- A user can hold different roles in different clubs/campuses
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'campus_manager', 'faculty_advisor', 'student_coordinator', 'student')),
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    club_id UUID, -- Foreign key added after clubs table definition
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role, campus_id, club_id)
);

-- 4. CLUBS & SOCIETIES TABLE
-- parent_club_id allows modeling parent societies (e.g. Kaizen Society) with child clubs (Kaizen Dev, CP Club, KI)
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    parent_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
    category TEXT NOT NULL CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Entrepreneurship', 'Parent Society')),
    capacity INTEGER NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'inactive', 'archived')),
    meeting_day TEXT DEFAULT 'Saturday',
    meeting_time TEXT DEFAULT '10:00 AM - 1:00 PM',
    meeting_venue TEXT,
    logo_url TEXT,
    accent_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, campus_id)
);

-- Add foreign key back to user_roles
ALTER TABLE public.user_roles 
    DROP CONSTRAINT IF EXISTS fk_user_roles_club,
    ADD CONSTRAINT fk_user_roles_club FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

-- 5. CLUB MEMBERS TABLE (Enrolment)
CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    designation TEXT NOT NULL DEFAULT 'primary' CHECK (designation IN ('primary', 'secondary')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn')),
    join_request_note TEXT,
    decision_note TEXT,
    waitlist_position INTEGER,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, user_id)
);

-- 6. SETTINGS TABLE (Admin-editable config)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT LOG TABLE (Immutable compliance log)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'action_required')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_campus ON public.profiles(campus_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_club ON public.user_roles(club_id);
CREATE INDEX IF NOT EXISTS idx_clubs_campus ON public.clubs(campus_id);
CREATE INDEX IF NOT EXISTS idx_clubs_parent ON public.clubs(parent_club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_status ON public.club_members(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS & ROLE CHECKS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_role(
    target_user_id UUID,
    required_role TEXT,
    check_campus_id UUID DEFAULT NULL,
    check_club_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Global Admin has all permissions
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = target_user_id AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Campus Manager check
    IF required_role = 'campus_manager' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = target_user_id 
              AND role = 'campus_manager' 
              AND (check_campus_id IS NULL OR campus_id = check_campus_id)
        );
    END IF;

    -- Faculty Advisor check
    IF required_role = 'faculty_advisor' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = target_user_id 
              AND role = 'faculty_advisor' 
              AND (check_club_id IS NULL OR club_id = check_club_id)
        );
    END IF;

    -- Student Coordinator check
    IF required_role = 'student_coordinator' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = target_user_id 
              AND role = 'student_coordinator' 
              AND (check_club_id IS NULL OR club_id = check_club_id)
        );
    END IF;

    -- Generic role check
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = target_user_id 
          AND role = required_role
          AND (check_campus_id IS NULL OR campus_id = check_campus_id)
          AND (check_club_id IS NULL OR club_id = check_club_id)
    );
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Campuses: Public read, Admin write
CREATE POLICY "Campuses are viewable by all authenticated users" 
    ON public.campuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Campuses are manageable by admin" 
    ON public.campuses FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles: Users can read all profiles (needed for member lists), update own profile, admin manages all
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE TO authenticated 
    USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" 
    ON public.profiles FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- 3. User Roles: Viewable by self and admins/managers, manageable by admin
CREATE POLICY "Users can view their own roles" 
    ON public.user_roles FOR SELECT TO authenticated 
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'campus_manager'));
CREATE POLICY "Admins can manage user roles" 
    ON public.user_roles FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- 4. Clubs: Approved clubs viewable by everyone, coordinators/advisors can view pending of their assigned club, admins/managers manage
CREATE POLICY "Approved clubs are viewable by all users" 
    ON public.clubs FOR SELECT TO authenticated 
    USING (
        status = 'approved' 
        OR public.has_role(auth.uid(), 'admin') 
        OR public.has_role(auth.uid(), 'campus_manager', campus_id)
        OR public.has_role(auth.uid(), 'faculty_advisor', NULL, id)
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, id)
    );

CREATE POLICY "Admins and Campus Managers can insert and update clubs" 
    ON public.clubs FOR ALL TO authenticated 
    USING (
        public.has_role(auth.uid(), 'admin') 
        OR public.has_role(auth.uid(), 'campus_manager', campus_id)
    );

-- 5. Club Members:
-- Students can view their memberships; coordinators and advisors can view memberships of their assigned club; admins view all
CREATE POLICY "Memberships viewable by owners and club coordinators/advisors" 
    ON public.club_members FOR SELECT TO authenticated 
    USING (
        auth.uid() = user_id 
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
        OR public.has_role(auth.uid(), 'faculty_advisor', NULL, club_id)
        OR public.has_role(auth.uid(), 'campus_manager')
    );

CREATE POLICY "Students can request to join a club" 
    ON public.club_members FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coordinators and Admins can update memberships" 
    ON public.club_members FOR UPDATE TO authenticated 
    USING (
        auth.uid() = user_id -- Student withdrawing
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'student_coordinator', NULL, club_id)
    );

-- 6. Settings: Read by all authenticated, modified only by admin
CREATE POLICY "Settings are viewable by authenticated users" 
    ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings are modifiable only by admins" 
    ON public.settings FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- 7. Audit Log: Insertable by system/authenticated, viewable only by admins
CREATE POLICY "Admins can view audit logs" 
    ON public.audit_log FOR SELECT TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert audit logs" 
    ON public.audit_log FOR INSERT TO authenticated 
    WITH CHECK (true);

-- 8. Notifications: Viewable and updatable only by the notification recipient
CREATE POLICY "Users can manage their own notifications" 
    ON public.notifications FOR ALL TO authenticated 
    USING (auth.uid() = user_id);
