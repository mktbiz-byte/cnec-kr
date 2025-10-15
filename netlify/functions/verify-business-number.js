const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { b_no, start_dt, p_nm } = JSON.parse(event.body);

    if (!b_no || !start_dt || !p_nm) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const apiKey = process.env.BUSINESS_API_KEY;
    if (!apiKey) {
        // 개발 환경에서는 테스트용 API 키를 사용하거나 모의 응답을 반환합니다.
        console.warn("BUSINESS_API_KEY is not set. Using mock response for development.");
        
        // 테스트용 사업자등록번호 (하우파파)
        if (b_no.replace(/-/g, ") === "6218126056" && start_dt === "20150428" && p_nm === "박현용") {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    "status_code": "OK",
                    "request_cnt": 1,
                    "valid_cnt": 1,
                    "data": [
                        {
                            "b_no": "6218126056",
                            "valid": "01",
                            "valid_msg": "국세청에 등록된 사업자등록번호 입니다."
                        }
                    ]
                })
            };
        }

        // 그 외의 경우, 유효하지 않음으로 응답
        return {
            statusCode: 200,
            body: JSON.stringify({
                "status_code": "OK",
                "request_cnt": 1,
                "valid_cnt": 1,
                "data": [
                    {
                        "b_no": b_no,
                        "valid": "02",
                        "valid_msg": "국세청에 등록되지 않은 사업자등록번호입니다."
                    }
                ]
            })
        };
    }

    const response = await fetch(
      "https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          businesses: [
            {
              b_no: b_no.replace(/-/g, ""),
              start_dt: start_dt,
              p_nm: p_nm,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error verifying business number:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
