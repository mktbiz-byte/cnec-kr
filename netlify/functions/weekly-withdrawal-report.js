import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Google Sheets API 초기화
function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return google.sheets({ version: 'v4', auth });
}

// 네이버 웍스 메시지 전송
async function sendNaverWorksMessage(message) {
  const botId = process.env.NAVER_WORKS_BOT_ID;
  const botSecret = process.env.NAVER_WORKS_BOT_SECRET;
  const channelId = process.env.NAVER_WORKS_CHANNEL_ID;

  if (!botId || !botSecret || !channelId) {
    console.log('[WARN] Naver Works credentials not configured');
    return false;
  }

  try {
    // 네이버 웍스 Bot API - 메시지 전송
    const response = await fetch(`https://www.worksapis.com/v1.0/bots/${botId}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          type: 'text',
          text: message
        }
      })
    });

    if (!response.ok) {
      console.error('[ERROR] Naver Works API error:', await response.text());
      return false;
    }

    console.log('[SUCCESS] Naver Works message sent');
    return true;
  } catch (error) {
    console.error('[ERROR] Naver Works send error:', error);
    return false;
  }
}

// 3.3% 세금 차감 계산
function calculateNetAmount(grossAmount) {
  const taxRate = 0.033;
  const taxAmount = Math.floor(grossAmount * taxRate);
  return grossAmount - taxAmount;
}

// 주민번호 마스킹 (앞 6자리만 표시)
function maskResidentNumber(residentNumber) {
  if (!residentNumber) return '-';
  // 복호화된 주민번호가 있다면 마스킹
  if (residentNumber.length >= 6) {
    return residentNumber.substring(0, 6) + '-*******';
  }
  return residentNumber;
}

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// 금액 포맷팅 (천 단위 콤마)
function formatAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

// 메인 핸들러 - Netlify Scheduled Function
export const handler = async (event) => {
  console.log('[INFO] Weekly withdrawal report started at:', new Date().toISOString());

  try {
    // 지난 주 월요일부터 일요일까지의 기간 계산
    const now = new Date();
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - 7);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    console.log('[INFO] Fetching withdrawals from:', lastMonday.toISOString(), 'to:', lastSunday.toISOString());

    // 출금 신청 데이터 조회 (pending 또는 approved 상태)
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select(`
        id,
        user_id,
        amount,
        bank_name,
        bank_account_number,
        bank_account_holder,
        resident_number_encrypted,
        status,
        created_at,
        user_profiles!withdrawals_user_id_fkey (
          name,
          email
        )
      `)
      .gte('created_at', lastMonday.toISOString())
      .lte('created_at', lastSunday.toISOString())
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: true });

    if (withdrawalError) {
      console.error('[ERROR] Failed to fetch withdrawals:', withdrawalError);
      throw withdrawalError;
    }

    console.log('[INFO] Found', withdrawals?.length || 0, 'withdrawal requests');

    if (!withdrawals || withdrawals.length === 0) {
      console.log('[INFO] No withdrawal requests for this period');

      // 네이버 웍스로 "출금 신청 없음" 알림
      await sendNaverWorksMessage(
        `📋 주간 출금 보고서 (${formatDate(lastMonday)} ~ ${formatDate(lastSunday)})\n\n` +
        `이번 주 출금 신청 내역이 없습니다.`
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No withdrawals to report' })
      };
    }

    // Google Sheets에 데이터 작성
    const spreadsheetId = process.env.GOOGLE_SHEETS_WITHDRAWAL_ID;

    if (!spreadsheetId) {
      console.error('[ERROR] GOOGLE_SHEETS_WITHDRAWAL_ID not configured');
      throw new Error('Google Sheets ID not configured');
    }

    const sheets = getGoogleSheetsClient();

    // 시트 이름 (날짜 기반)
    const sheetName = `${formatDate(lastMonday)}_출금내역`;

    // 새 시트 생성 시도
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
      console.log('[INFO] Created new sheet:', sheetName);
    } catch (sheetError) {
      // 시트가 이미 존재하면 무시
      console.log('[INFO] Sheet may already exist, continuing...');
    }

    // 헤더 행 준비
    const headers = [
      '번호',
      '신청일',
      '예금주',
      '주민번호',
      '은행명',
      '계좌번호',
      '신청금액',
      '세금(3.3%)',
      '실입금액',
      '상태'
    ];

    // 데이터 행 준비
    let totalGross = 0;
    let totalNet = 0;

    const rows = withdrawals.map((w, index) => {
      const grossAmount = w.amount;
      const netAmount = calculateNetAmount(grossAmount);
      const taxAmount = grossAmount - netAmount;

      totalGross += grossAmount;
      totalNet += netAmount;

      return [
        index + 1,
        formatDate(w.created_at),
        w.bank_account_holder || w.user_profiles?.name || '-',
        maskResidentNumber(w.resident_number_encrypted),
        w.bank_name || '-',
        w.bank_account_number || '-',
        formatAmount(grossAmount),
        formatAmount(taxAmount),
        formatAmount(netAmount),
        w.status === 'pending' ? '대기중' : w.status === 'approved' ? '승인됨' : w.status
      ];
    });

    // 합계 행 추가
    rows.push([]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '합계',
      formatAmount(totalGross),
      formatAmount(totalGross - totalNet),
      formatAmount(totalNet),
      ''
    ]);

    // 시트에 데이터 작성
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [headers, ...rows]
      }
    });

    console.log('[SUCCESS] Data written to Google Sheets');

    // 스프레드시트 URL 생성
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // 네이버 웍스로 알림 전송
    const naverMessage =
      `📋 주간 출금 보고서 (${formatDate(lastMonday)} ~ ${formatDate(lastSunday)})\n\n` +
      `✅ 총 ${withdrawals.length}건의 출금 신청\n` +
      `💰 총 신청금액: ${formatAmount(totalGross)}원\n` +
      `💵 총 실입금액: ${formatAmount(totalNet)}원 (세금 3.3% 차감)\n\n` +
      `📊 상세 내역: ${sheetUrl}\n` +
      `📄 시트명: ${sheetName}`;

    await sendNaverWorksMessage(naverMessage);

    console.log('[SUCCESS] Weekly withdrawal report completed');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Weekly withdrawal report generated successfully',
        count: withdrawals.length,
        totalGross,
        totalNet,
        sheetUrl
      })
    };

  } catch (error) {
    console.error('[ERROR] Weekly withdrawal report failed:', error);

    // 에러 발생 시 네이버 웍스로 알림
    await sendNaverWorksMessage(
      `⚠️ 주간 출금 보고서 생성 실패\n\n` +
      `오류: ${error.message}\n` +
      `시간: ${new Date().toISOString()}`
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Netlify Scheduled Function 설정
export const config = {
  schedule: '0 1 * * 1'  // 매주 월요일 01:00 UTC = 10:00 KST
};
