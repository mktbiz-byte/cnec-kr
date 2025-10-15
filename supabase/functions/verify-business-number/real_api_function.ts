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
    const { b_no, start_dt, p_nm } = await req.json()
    const serviceKey = Deno.env.get("NTS_API_KEY")

    if (!serviceKey) {
      throw new Error("NTS_API_KEY (Service key) is not available in Edge Function Secrets.");
    }

    const response = await fetch("https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=" + serviceKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        "businesses": [
          {
            "b_no": b_no,
            "start_dt": start_dt,
            "p_nm": p_nm
          }
        ]
      })
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

