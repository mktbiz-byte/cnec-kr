-- Migration 12: video_submissions 테이블의 불필요한 알림 트리거 제거
--
-- 문제: video_submissions 테이블에 'video_submission_notification' 트리거가 설정되어 있음.
-- 이 트리거는 INSERT 시 notify_video_submission() 함수를 호출하고,
-- 해당 함수 내부에서 supabase_functions.http_request()를 호출하는데
-- pg_net 확장이 비활성화되어 함수가 존재하지 않아 INSERT가 실패함:
--   "function supabase_functions.http_request(unknown, unknown, unknown, text, unknown) does not exist"
--
-- 알림 발송은 이미 클라이언트 측 Netlify Function(send-alimtalk)으로 처리되므로
-- 이 트리거와 함수는 불필요함.
--
-- 진단 결과:
--   video_submission_notification → public.notify_video_submission (문제 원인)
--   update_video_submissions_updated_at_trigger → public.update_video_submissions_updated_at (정상, 보존)

-- Step 1: 문제 트리거 삭제
DROP TRIGGER IF EXISTS "video_submission_notification" ON public.video_submissions;

-- Step 2: 문제 함수 삭제
DROP FUNCTION IF EXISTS public.notify_video_submission();

-- Step 3: supabase_functions 스키마의 웹훅 트리거가 혹시 있으면 함께 삭제
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

-- Step 4: 정상 트리거(updated_at 자동 갱신) 보존 확인, 없으면 재생성
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
