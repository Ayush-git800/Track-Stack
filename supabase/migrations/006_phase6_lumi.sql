-- ============================================================================
-- TRACK STACK: Phase 6 Database Schema Migration
-- "Lumi" AI Assistant: Knowledge Base, Chat Sessions, Feedback & Support Escalation
-- ============================================================================

-- 1. LUMI KNOWLEDGE BASE (FAQ) TABLE
CREATE TABLE IF NOT EXISTS public.lumi_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'membership', 'checkin', 'submissions', 'evaluations',
    'events', 'certificates', 'duty_leave', 'transcript', 'general'
  )),
  roles TEXT[] NOT NULL DEFAULT '{student,student_coordinator,faculty_advisor,campus_manager,admin}',
  keywords TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  unhelpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lumi_faq_cat ON public.lumi_faq(category, active);
CREATE INDEX IF NOT EXISTS idx_lumi_faq_active ON public.lumi_faq(active);

-- Full-text search index for high-speed retrieval
CREATE INDEX IF NOT EXISTS idx_lumi_faq_fts ON public.lumi_faq USING gin(
  to_tsvector('english', question || ' ' || answer)
);

-- 2. LUMI CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.lumi_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- null for unauthenticated pre-login
  title TEXT NOT NULL DEFAULT 'New Conversation',
  role TEXT NOT NULL DEFAULT 'student',
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lumi_conv_user ON public.lumi_conversations(user_id, updated_at DESC);

-- 3. LUMI MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.lumi_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.lumi_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB DEFAULT '[]',
  tool_results JSONB DEFAULT '[]',
  deep_links JSONB DEFAULT '[]',
  feedback TEXT CHECK (feedback IN ('thumbs_up', 'thumbs_down', null)),
  feedback_comment TEXT,
  tokens_used JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lumi_msg_conv ON public.lumi_messages(conversation_id, created_at ASC);

-- 4. SUPPORT REQUESTS (HUMAN ESCALATION) TABLE
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  conversation_id UUID REFERENCES public.lumi_conversations(id) ON DELETE SET NULL,
  routed_to_role TEXT NOT NULL CHECK (routed_to_role IN ('student_coordinator', 'campus_manager', 'admin')),
  routed_to_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_user ON public.support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON public.support_requests(status, routed_to_role);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.lumi_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumi_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumi_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- FAQ: Everyone can read active FAQs; only admins can insert/update/delete
CREATE POLICY p_lumi_faq_select ON public.lumi_faq FOR SELECT USING (active = true OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));
CREATE POLICY p_lumi_faq_admin ON public.lumi_faq FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Conversations: Users only see and manage their own conversations
CREATE POLICY p_lumi_conv_user ON public.lumi_conversations FOR ALL USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- Messages: Users only see messages from their own conversations
CREATE POLICY p_lumi_msg_user ON public.lumi_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.lumi_conversations
    WHERE id = conversation_id AND (user_id = auth.uid() OR user_id IS NULL)
  )
);

-- Support Requests:
-- 1. Student sees their own requests
CREATE POLICY p_support_student ON public.support_requests FOR SELECT USING (user_id = auth.uid());
-- 2. Staff sees requests routed to their role or campus
CREATE POLICY p_support_staff ON public.support_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'campus_manager', 'student_coordinator'))
);
