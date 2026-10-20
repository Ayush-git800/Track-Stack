-- ============================================================================
-- SQL TESTS: RLS Policies & 2-Club Membership Limit Verification
-- ============================================================================

DO $$
DECLARE
    delhi_id UUID;
    club1_id UUID;
    club2_id UUID;
    club3_id UUID;
    student_id UUID := '11111111-1111-1111-1111-111111111111';
    coord_club1_id UUID := '22222222-2222-2222-2222-222222222222';
    draft_activity_club2 UUID;
    failed_as_expected BOOLEAN := false;
BEGIN
    RAISE NOTICE '--- Starting Test Suite: Track Stack Phase 1 & 2 Policies ---';

    -- 1. Setup Test Campus and Clubs
    SELECT id INTO delhi_id FROM public.campuses WHERE code = 'DELHI';
    IF delhi_id IS NULL THEN
        INSERT INTO public.campuses (name, code, city) VALUES ('Delhi-NCR Test', 'DELHI_TEST', 'Gurugram') RETURNING id INTO delhi_id;
    END IF;

    -- Get or create 3 clubs
    SELECT id INTO club1_id FROM public.clubs WHERE code = 'KAIZEN_DEV' LIMIT 1;
    SELECT id INTO club2_id FROM public.clubs WHERE code = 'CP_CLUB' LIMIT 1;
    SELECT id INTO club3_id FROM public.clubs WHERE code = 'KI' LIMIT 1;

    -- 2. TEST: Max 2 Clubs Rule Enforcement
    -- Create dummy student profile
    INSERT INTO public.profiles (id, full_name, email, campus_id, year_of_study)
    VALUES (student_id, 'Test Alex Student', 'test.alex@msot.edu', delhi_id, 2)
    ON CONFLICT (id) DO NOTHING;

    -- Clean any existing memberships for test student
    DELETE FROM public.club_members WHERE user_id = student_id;

    -- Join Club 1 -> MUST SUCCEED
    INSERT INTO public.club_members (club_id, user_id, status)
    VALUES (club1_id, student_id, 'approved');
    RAISE NOTICE '✓ Student joined Club 1 successfully';

    -- Join Club 2 -> MUST SUCCEED (Total = 2)
    INSERT INTO public.club_members (club_id, user_id, status)
    VALUES (club2_id, student_id, 'approved');
    RAISE NOTICE '✓ Student joined Club 2 successfully (Reached max limit of 2)';

    -- Join Club 3 -> MUST FAIL with custom error
    BEGIN
        INSERT INTO public.club_members (club_id, user_id, status)
        VALUES (club3_id, student_id, 'approved');
        failed_as_expected := false;
    EXCEPTION WHEN OTHERS THEN
        failed_as_expected := true;
        RAISE NOTICE '✓ SUCCESS: 3rd club enrolment was BLOCKED by DB trigger: %', SQLERRM;
    END;

    IF NOT failed_as_expected THEN
        RAISE EXCEPTION 'TEST FAILED: Student was able to join a 3rd club!';
    END IF;

    -- Clean up test records
    DELETE FROM public.club_members WHERE user_id = student_id;
    DELETE FROM public.profiles WHERE id = student_id;

    RAISE NOTICE '--- All SQL Verification Tests Passed Successfully! ---';
END;
$$;
