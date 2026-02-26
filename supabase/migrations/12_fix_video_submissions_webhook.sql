-- Migration 12: video_submissions 테이블의 불필요한 웹훅 트리거 제거
--
-- 문제: Supabase Dashboard에서 video_submissions 테이블에 Database Webhook이 설정됨.
-- 이 웹훅은 INSERT 시 supabase_functions.http_request() 함수를 호출하는데,
-- pg_net 확장이 비활성화되어 함수가 존재하지 않아 INSERT가 실패함:
--   "function supabase_functions.http_request(unknown, unknown, unknown, text, unknown) does not exist"
--
-- 알림 발송은 이미 클라이언트 측 Netlify Function(send-alimtalk)으로 처리되므로
-- 이 웹훅 트리거는 불필요함.
--
-- 해결: supabase_functions 스키마에 속한 웹훅 트리거만 선별 삭제하고,
-- 정상 트리거(update_video_submissions_updated_at_trigger)는 보존.

-- === 진단 쿼리 (먼저 실행하여 현재 트리거 확인) ===
-- SELECT t.tgname, pn.nspname AS func_schema, p.proname AS func_name
-- FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- JOIN pg_namespace n ON c.relnamespace = n.oid
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- JOIN pg_namespace pn ON p.pronamespace = pn.oid
-- WHERE n.nspname = 'public' AND c.relname = 'video_submissions' AND NOT t.tgisinternal;

-- Step 1: supabase_functions 스키마의 함수를 참조하는 웹훅 트리거 삭제
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT tgname AS trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'video_submissions'
          AND t.tgfoid IN (
              SELECT p.oid FROM pg_proc p
              JOIN pg_namespace pn ON p.pronamespace = pn.oid
              WHERE pn.nspname = 'supabase_functions'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.video_submissions', trigger_rec.trigger_name);
        RAISE NOTICE 'Dropped webhook trigger: %', trigger_rec.trigger_name;
    END LOOP;
END;
$$;

-- Step 2: 일반적인 Supabase 웹훅 트리거 이름 패턴도 시도
DROP TRIGGER IF EXISTS "supabase_functions_trigger" ON public.video_submissions;

-- Step 3: 정상 트리거(updated_at 자동 갱신)가 존재하는지 확인, 없으면 재생성
CREATE OR REPLACE FUNCTION update_video_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'video_submissions'
          AND t.tgname = 'update_video_submissions_updated_at_trigger'
    ) THEN
        CREATE TRIGGER update_video_submissions_updated_at_trigger
          BEFORE UPDATE ON video_submissions
          FOR EACH ROW
          EXECUTE FUNCTION update_video_submissions_updated_at();
        RAISE NOTICE 'Recreated update_video_submissions_updated_at_trigger';
    END IF;
END;
$$;
