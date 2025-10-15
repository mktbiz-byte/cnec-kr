import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { b_no, start_dt, p_nm } = await req.json();

    // --- 임시 모의 인증 로직 시작 ---
    const mockSuccessData = {
      b_no: "5758102253",
      start_dt: "20210901",
      p_nm: "박현용",
    };

    let responseData;

    if (
      b_no === mockSuccessData.b_no &&
      start_dt === mockSuccessData.start_dt &&
      p_nm === mockSuccessData.p_nm
    ) {
      // 성공 케이스
      responseData = {
        "request_cnt": 1,
        "valid_cnt": 1,
        "status_code": "OK",
        "data": [
          {
            "b_no": b_no,
            "valid": "01",
            "valid_msg": "[MOCK] 국세청에 등록된 사업자등록번호입니다."
          }
        ]
      };
    } else {
      // 실패 케이스
      responseData = {
        "request_cnt": 1,
        "valid_cnt": 0,
        "status_code": "OK",
        "data": [
          {
            "b_no": b_no,
            "valid": "02",
            "valid_msg": "[MOCK] 국세청에 등록되지 않은 사업자등록번호입니다."
          }
        ]
      };
    }
    // --- 임시 모의 인증 로직 종료 ---

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

