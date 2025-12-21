// 이메일 발송 서비스
import { supabase } from './supabase'

// 한국어 이메일 템플릿 정의
const EMAIL_TEMPLATES_KO = {
  // 캠페인 확정 (승인) - 한국어
  APPLICATION_APPROVED: {
    subject: '【CNEC Korea】🎉 캠페인 참여가 확정되었습니다!',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Korea - 캠페인 참여 확정</title>
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .deadline-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 축하합니다!</h1>
            <p>캠페인 참여가 확정되었습니다</p>
        </div>
        <div class="content">
            <div class="success-box">
                <h2>✅ ${data.campaignTitle}</h2>
                <p><strong>${data.name}님의 캠페인 참여가 정식으로 확정되었습니다!</strong></p>
            </div>

            <h3>📅 중요 일정</h3>
            <div class="deadline-box">
                <p><strong>🎬 영상 업로드 마감일:</strong> ${data.deadline}</p>
                <p><strong>📦 제품 발송 예정일:</strong> ${data.shippingDate}</p>
                <p><strong>💰 리워드 금액:</strong> ${data.rewardAmount}원</p>
            </div>

            <h3>📋 다음 단계</h3>
            <ol>
                <li><strong>캠페인 자료 확인</strong><br>
                    아래 링크에서 가이드라인과 소재를 다운로드하세요</li>
                <li><strong>제품 수령</strong><br>
                    등록하신 주소로 제품을 발송해 드립니다</li>
                <li><strong>콘텐츠 제작</strong><br>
                    가이드라인에 맞춰 매력적인 영상을 제작하세요</li>
                <li><strong>SNS 업로드</strong><br>
                    지정 해시태그를 사용하여 SNS에 업로드하세요</li>
                <li><strong>업로드 URL 제출</strong><br>
                    마이페이지에서 업로드한 영상 URL을 제출하세요</li>
            </ol>

            <div style="text-align: center;">
                ${data.googleDriveLink ? `<a href="${data.googleDriveLink}" class="button">📁 Google Drive</a>` : ''}
                ${data.googleSlidesLink ? `<a href="${data.googleSlidesLink}" class="button">📊 Google Slides</a>` : ''}
                <a href="https://cnec.co.kr/profile" class="button">📱 마이페이지</a>
            </div>

            <h3>⚠️ 중요 주의사항</h3>
            <ul>
                <li>업로드 마감일을 반드시 지켜주세요</li>
                <li>가이드라인에 맞는 내용으로 업로드해주세요</li>
                <li>지정 해시태그 사용은 필수입니다</li>
                <li>업로드 후 반드시 URL을 제출해주세요</li>
            </ul>

            <p>문의사항이 있으시면 언제든지 연락해주세요.<br>
            멋진 콘텐츠 제작을 기대합니다!</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Korea. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  }
}

// 일본어 이메일 템플릿 정의
const EMAIL_TEMPLATES = {
  // 1. 회원가입 완료
  SIGNUP_COMPLETE: {
    subject: '【CNEC Japan】会員登録が完了しました',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - 会員登録完了</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .highlight { background: #f0f8ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 CNEC Japan</h1>
            <p>K-Beauty × ショート動画専門プラットフォーム</p>
        </div>
        <div class="content">
            <h2>会員登録が完了しました！</h2>
            <p>${data.name}様</p>
            
            <p>CNEC Japanへのご登録、誠にありがとうございます。<br>
            あなたのアカウントが正常に作成されました。</p>
            
            <div class="highlight">
                <h3>📧 登録情報</h3>
                <p><strong>お名前:</strong> ${data.name}</p>
                <p><strong>メールアドレス:</strong> ${data.email}</p>
                <p><strong>登録日時:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
            </div>
            
            <h3>🚀 次のステップ</h3>
            <ol>
                <li><strong>プロフィール完成:</strong> SNSアカウントや詳細情報を登録</li>
                <li><strong>キャンペーン参加:</strong> 興味のあるK-Beautyキャンペーンに応募</li>
                <li><strong>コンテンツ制作:</strong> 承認後、魅力的な動画を制作</li>
                <li><strong>報酬獲得:</strong> ポイントを獲得して日本の銀行口座へ送金</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="https://cnec.jp/" class="button">マイページを見る</a>
            </div>
            
            <p>ご質問やサポートが必要な場合は、いつでもお気軽にお問い合わせください。</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
            <p>このメールは自動送信されています。</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 2. 캠페인 신청 완료
  APPLICATION_SUBMITTED: {
    subject: '【CNEC Japan】キャンペーン応募を受け付けました',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - キャンペーン応募完了</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .campaign-info { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .status-badge { background: #ffd700; color: #333; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 CNEC Japan</h1>
            <p>キャンペーン応募完了</p>
        </div>
        <div class="content">
            <h2>キャンペーン応募を受け付けました</h2>
            <p>${data.name}様</p>
            
            <p>以下のキャンペーンへの応募を受け付けました。<br>
            審査結果は2-3営業日以内にご連絡いたします。</p>
            
            <div class="campaign-info">
                <h3>📋 応募キャンペーン情報</h3>
                <p><strong>キャンペーン名:</strong> ${data.campaignTitle}</p>
                <p><strong>ブランド:</strong> ${data.brandName}</p>
                <p><strong>報酬金額:</strong> ${data.rewardAmount}円</p>
                <p><strong>応募日時:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
                <p><strong>ステータス:</strong> <span class="status-badge">審査中</span></p>
            </div>
            
            <h3>📝 提出いただいた情報</h3>
            <ul>
                <li>基本情報（お名前、年齢、連絡先）</li>
                <li>肌タイプ・肌悩み情報</li>
                <li>配送先住所</li>
                <li>SNSアカウント情報</li>
                <li>応募動機・企画案</li>
            </ul>
            
            <h3>🔍 審査について</h3>
            <p>以下の基準で審査を行います：</p>
            <ul>
                <li>SNSアカウントの活動状況</li>
                <li>フォロワー数と エンゲージメント率</li>
                <li>コンテンツの質と一貫性</li>
                <li>ブランドとの親和性</li>
            </ul>
            
            <p>審査結果は登録いただいたメールアドレスにご連絡いたします。</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 3. 캠페인 확정 (승인)
  APPLICATION_APPROVED: {
    subject: '【CNEC Japan】🎉 キャンペーン参加が確定しました！',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - キャンペーン参加確定</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .deadline-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 おめでとうございます！</h1>
            <p>キャンペーン参加が確定しました</p>
        </div>
        <div class="content">
            <div class="success-box">
                <h2>✅ ${data.campaignTitle}</h2>
                <p><strong>${data.name}様のキャンペーン参加が正式に確定いたしました！</strong></p>
            </div>
            
            <h3>📅 重要な日程</h3>
            <div class="deadline-box">
                <p><strong>🎬 動画投稿締切:</strong> ${data.deadline}</p>
                <p><strong>📦 商品発送予定:</strong> ${data.shippingDate}</p>
                <p><strong>💰 報酬金額:</strong> ${data.rewardAmount}円</p>
            </div>
            
            <h3>📋 次のステップ</h3>
            <ol>
                <li><strong>キャンペーン資料の確認</strong><br>
                    下記リンクからガイドラインと素材をダウンロードしてください</li>
                <li><strong>商品の受け取り</strong><br>
                    登録住所に商品をお送りします</li>
                <li><strong>コンテンツ制作</strong><br>
                    ガイドラインに沿って魅力的な動画を制作</li>
                <li><strong>SNS投稿</strong><br>
                    指定ハッシュタグを使用してSNSに投稿</li>
                <li><strong>投稿URLの報告</strong><br>
                    マイページから投稿URLを報告</li>
            </ol>
            
            <div style="text-align: center;">
                ${data.googleDriveLink ? `<a href="${data.googleDriveLink}" class="button">📁 Google Drive</a>` : ''}
                ${data.googleSlidesLink ? `<a href="${data.googleSlidesLink}" class="button">📊 Google Slides</a>` : ''}
                <a href="https://cnec.jp/mypage" class="button">📱 マイページ</a>
            </div>
            
            <h3>⚠️ 重要な注意事項</h3>
            <ul>
                <li>投稿締切を必ずお守りください</li>
                <li>ガイドラインに沿った内容で投稿してください</li>
                <li>指定ハッシュタグの使用は必須です</li>
                <li>投稿後は必ずURLを報告してください</li>
            </ul>
            
            <p>ご質問がございましたら、いつでもお気軽にお問い合わせください。<br>
            素晴らしいコンテンツの制作をお待ちしております！</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 4. 가이드 전달 (자료 업로드 완료)
  GUIDE_DELIVERED: {
    subject: '【CNEC Japan】📋 キャンペーンガイドをお送りします',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - キャンペーンガイド</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .guide-box { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 キャンペーンガイド</h1>
            <p>制作に必要な資料をお送りします</p>
        </div>
        <div class="content">
            <h2>キャンペーン資料の準備が完了しました</h2>
            <p>${data.name}様</p>
            
            <p>${data.campaignTitle}のキャンペーン資料とガイドラインの準備が完了いたしました。<br>
            以下のリンクから必要な資料をダウンロードしてください。</p>
            
            <div class="guide-box">
                <h3>📁 利用可能な資料</h3>
                <ul>
                    <li>📖 キャンペーンガイドライン</li>
                    <li>🎨 ブランド素材・ロゴ</li>
                    <li>📝 投稿テンプレート</li>
                    <li>🏷️ 必須ハッシュタグリスト</li>
                    <li>📊 商品情報・特徴</li>
                    <li>🎬 参考動画・事例</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                ${data.googleDriveLink ? `<a href="${data.googleDriveLink}" class="button">📁 Google Drive で開く</a>` : ''}
                ${data.googleSlidesLink ? `<a href="${data.googleSlidesLink}" class="button">📊 Google Slides で開く</a>` : ''}
            </div>
            
            <h3>📅 スケジュール確認</h3>
            <ul>
                <li><strong>商品発送:</strong> ${data.shippingDate}</li>
                <li><strong>投稿締切:</strong> ${data.deadline}</li>
                <li><strong>3日前リマインド:</strong> ${data.reminder3Days}</li>
                <li><strong>1日前リマインド:</strong> ${data.reminder1Day}</li>
            </ul>
            
            <h3>💡 制作のポイント</h3>
            <ul>
                <li>ガイドラインを必ずお読みください</li>
                <li>ブランドの世界観を大切にしてください</li>
                <li>商品の魅力を自然に伝えてください</li>
                <li>指定ハッシュタグを忘れずに使用してください</li>
            </ul>
            
            <p>資料をご確認いただき、素晴らしいコンテンツの制作をお願いいたします。<br>
            ご不明な点がございましたら、お気軽にお問い合わせください。</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 5. 영상 마감일 3일전 알림
  DEADLINE_REMINDER_3DAYS: {
    subject: '【CNEC Japan】⏰ 投稿締切まで3日です - リマインダー',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - 投稿締切リマインダー</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fd7e14 0%, #ffc107 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #fd7e14; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .countdown { font-size: 2em; font-weight: bold; color: #fd7e14; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ 投稿締切リマインダー</h1>
            <p>締切まで3日です</p>
        </div>
        <div class="content">
            <div class="countdown">⏰ 残り 3日</div>
            
            <h2>投稿締切が近づいています</h2>
            <p>${data.name}様</p>
            
            <p>${data.campaignTitle}の投稿締切まで<strong>3日</strong>となりました。<br>
            制作の進捗はいかがでしょうか？</p>
            
            <div class="warning-box">
                <h3>📅 重要な日程</h3>
                <p><strong>投稿締切:</strong> ${data.deadline}</p>
                <p><strong>残り時間:</strong> 3日</p>
                <p><strong>報酬金額:</strong> ${data.rewardAmount}円</p>
            </div>
            
            <h3>✅ 投稿前チェックリスト</h3>
            <ul>
                <li>□ ガイドラインに沿った内容になっているか</li>
                <li>□ 商品の魅力が伝わる内容になっているか</li>
                <li>□ 指定ハッシュタグを使用しているか</li>
                <li>□ 投稿文に必要な情報が含まれているか</li>
                <li>□ 動画の品質は十分か</li>
            </ul>
            
            <h3>📋 投稿後の手順</h3>
            <ol>
                <li>SNSに動画を投稿</li>
                <li>投稿URLをコピー</li>
                <li>マイページから投稿URLを報告</li>
                <li>報酬の確定を待つ</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="https://cnec.jp/mypage" class="button">📱 マイページで報告</a>
                ${data.googleDriveLink ? `<a href="${data.googleDriveLink}" class="button">📁 資料を確認</a>` : ''}
            </div>
            
            <p>まだ投稿がお済みでない場合は、お早めの投稿をお願いいたします。<br>
            ご質問やサポートが必要でしたら、いつでもお気軽にお問い合わせください。</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 6. 영상 마감일 1일전 알림
  DEADLINE_REMINDER_1DAY: {
    subject: '【CNEC Japan】🚨 投稿締切まで1日です - 最終リマインダー',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - 最終リマインダー</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; }
        .urgent-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .countdown { font-size: 2.5em; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 最終リマインダー</h1>
            <p>投稿締切まで1日です！</p>
        </div>
        <div class="content">
            <div class="countdown">🚨 残り 1日</div>
            
            <h2>投稿締切が明日に迫っています</h2>
            <p>${data.name}様</p>
            
            <div class="urgent-box">
                <h3>⚠️ 緊急：投稿締切について</h3>
                <p><strong>キャンペーン:</strong> ${data.campaignTitle}</p>
                <p><strong>投稿締切:</strong> ${data.deadline}</p>
                <p><strong>残り時間:</strong> 約24時間</p>
                <p><strong>報酬金額:</strong> ${data.rewardAmount}円</p>
            </div>
            
            <p>まだ投稿がお済みでない場合は、<strong>本日中</strong>の投稿を強くお勧めいたします。<br>
            締切を過ぎますと、報酬をお支払いできない場合がございます。</p>
            
            <h3>🚀 今すぐやるべきこと</h3>
            <ol>
                <li><strong>動画の最終確認</strong> - 品質とガイドライン準拠をチェック</li>
                <li><strong>SNSに投稿</strong> - 指定ハッシュタグを忘れずに</li>
                <li><strong>URLを報告</strong> - マイページから投稿URLを報告</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="https://cnec.jp/mypage" class="button">🚨 今すぐ投稿を報告</a>
            </div>
            
            <h3>📞 緊急サポート</h3>
            <p>技術的な問題や緊急の質問がございましたら、以下までご連絡ください：</p>
            <ul>
                <li>📧 メール: support@cnec.jp</li>
                <li>⏰ 対応時間: 平日 9:00-18:00</li>
            </ul>
            
            <p><strong>重要:</strong> 締切を過ぎた投稿は報酬対象外となる場合がございます。<br>
            お早めの投稿をお願いいたします。</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 7. 영상 마감일 당일 알림
  DEADLINE_TODAY: {
    subject: '【CNEC Japan】🔥 本日が投稿締切日です！',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - 投稿締切日</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; animation: pulse 2s infinite; }
        .critical-box { background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .countdown { font-size: 3em; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; animation: blink 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 投稿締切日</h1>
            <p>本日中に投稿してください！</p>
        </div>
        <div class="content">
            <div class="countdown">🔥 本日締切</div>
            
            <div class="critical-box">
                <h2>⚠️ 重要：本日が投稿締切日です</h2>
                <p><strong>キャンペーン:</strong> ${data.campaignTitle}</p>
                <p><strong>投稿締切:</strong> ${data.deadline} 23:59まで</p>
                <p><strong>報酬金額:</strong> ${data.rewardAmount}円</p>
            </div>
            
            <p>${data.name}様</p>
            
            <p><strong>本日が${data.campaignTitle}の投稿締切日です。</strong><br>
            23:59までに投稿を完了し、マイページから投稿URLを報告してください。</p>
            
            <h3>🚨 今すぐ必要な作業</h3>
            <ol>
                <li><strong>SNSに投稿</strong> - 指定ハッシュタグを使用</li>
                <li><strong>投稿URLをコピー</strong></li>
                <li><strong>マイページで報告</strong> - 23:59まで</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="https://cnec.jp/mypage" class="button">🚨 緊急：投稿を報告</a>
            </div>
            
            <h3>📋 最終チェックリスト</h3>
            <ul>
                <li>□ 指定ハッシュタグを使用</li>
                <li>□ ガイドラインに準拠</li>
                <li>□ 商品が映っている</li>
                <li>□ 投稿文が適切</li>
                <li>□ URLを正確にコピー</li>
            </ul>
            
            <h3>⚠️ 重要な注意事項</h3>
            <p style="color: #dc3545; font-weight: bold;">
            締切時刻（23:59）を過ぎた投稿は報酬対象外となります。<br>
            必ず時間内に投稿とURL報告を完了してください。
            </p>
            
            <p>最後まで頑張ってください！<br>
            素晴らしいコンテンツをお待ちしております。</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 8. 포인트 신청 완료
  POINT_REQUEST_SUBMITTED: {
    subject: '【CNEC Japan】💰 ポイント申請を受け付けました',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - ポイント申請完了</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .point-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .process-box { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 ポイント申請完了</h1>
            <p>申請を受け付けました</p>
        </div>
        <div class="content">
            <h2>ポイント申請を受け付けました</h2>
            <p>${data.name}様</p>
            
            <p>以下の内容でポイント申請を受け付けました。<br>
            審査完了後、ご指定の銀行口座に送金いたします。</p>
            
            <div class="point-box">
                <h3>💰 申請内容</h3>
                <p><strong>申請ポイント:</strong> ${data.pointAmount}ポイント</p>
                <p><strong>申請金額:</strong> ${data.amount}円</p>
                <p><strong>申請日時:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
                <p><strong>申請理由:</strong> ${data.reason}</p>
            </div>
            
            <h3>🏦 送金先情報</h3>
            <ul>
                <li><strong>銀行名:</strong> ${data.bankName}</li>
                <li><strong>支店名:</strong> ${data.branchName}</li>
                <li><strong>口座番号:</strong> ${data.accountNumber}</li>
                <li><strong>口座名義:</strong> ${data.accountHolder}</li>
            </ul>
            
            <div class="process-box">
                <h3>📋 処理の流れ</h3>
                <ol>
                    <li><strong>申請受付</strong> ✅ 完了</li>
                    <li><strong>内容審査</strong> ⏳ 1-2営業日</li>
                    <li><strong>送金処理</strong> ⏳ 2-3営業日</li>
                    <li><strong>入金完了</strong> ⏳ 3-5営業日</li>
                </ol>
            </div>
            
            <h3>📅 予定スケジュール</h3>
            <ul>
                <li><strong>審査完了予定:</strong> ${data.reviewDate}</li>
                <li><strong>送金予定日:</strong> ${data.transferDate}</li>
                <li><strong>入金予定日:</strong> ${data.depositDate}</li>
            </ul>
            
            <h3>📧 通知について</h3>
            <p>以下のタイミングでメールをお送りします：</p>
            <ul>
                <li>審査完了時</li>
                <li>送金処理完了時</li>
                <li>入金確認時</li>
            </ul>
            
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。<br>
            お疲れ様でした！</p>
        </div>
        <div class="footer">
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  // 9. 포인트 입금 완료
  POINT_TRANSFER_COMPLETED: {
    subject: '【CNEC Japan】🎉 ポイント入金が完了しました！',
    template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CNEC Japan - 入金完了</title>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .transfer-details { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .celebration { font-size: 2em; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="celebration">🎉✨🎊</div>
            <h1>入金完了おめでとうございます！</h1>
            <p>ポイントの現金化が完了しました</p>
        </div>
        <div class="content">
            <div class="success-box">
                <h2>💰 入金完了のお知らせ</h2>
                <p><strong>${data.name}様</strong></p>
                <p>ポイント申請いただいた金額の入金が完了いたしました！</p>
            </div>
            
            <div class="transfer-details">
                <h3>💳 入金詳細</h3>
                <p><strong>入金金額:</strong> ${data.amount}円</p>
                <p><strong>入金日時:</strong> ${data.transferDate}</p>
                <p><strong>取引ID:</strong> ${data.transactionId}</p>
                <p><strong>入金先:</strong> ${data.bankName} ${data.branchName}</p>
                <p><strong>口座番号:</strong> ${data.accountNumber}</p>
            </div>
            
            <h3>📊 キャンペーン実績</h3>
            <ul>
                <li><strong>参加キャンペーン:</strong> ${data.campaignTitle}</li>
                <li><strong>獲得ポイント:</strong> ${data.pointAmount}ポイント</li>
                <li><strong>投稿プラットフォーム:</strong> ${data.platform}</li>
                <li><strong>投稿日:</strong> ${data.postDate}</li>
            </ul>
            
            <h3>🎯 次のステップ</h3>
            <p>今回のキャンペーンは完了です。引き続きCNEC Japanで新しいキャンペーンにご参加ください！</p>
            
            <ul>
                <li>🔍 新しいキャンペーンをチェック</li>
                <li>📈 フォロワー数を増やしてより多くの案件を獲得</li>
                <li>🎬 コンテンツの質を向上させて報酬アップ</li>
                <li>🤝 CNEC Japanのコミュニティに参加</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://cnec.jp/" style="display: inline-block; background: #ffd700; color: #333; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    🚀 新しいキャンペーンを見る
                </a>
            </div>
            
            <h3>📞 お問い合わせ</h3>
            <p>入金に関してご質問がございましたら：</p>
            <ul>
                <li>📧 メール: finance@cnec.jp</li>
                <li>📱 LINE: @cnecjapan</li>
                <li>⏰ 対応時間: 平日 9:00-18:00</li>
            </ul>
            
            <p><strong>この度は、CNEC Japanのキャンペーンにご参加いただき、誠にありがとうございました。</strong><br>
            今後ともよろしくお願いいたします！</p>
        </div>
        <div class="footer">
            <p>🎬 CNEC Japan - K-Beauty × ショート動画専門プラットフォーム</p>
            <p>© 2025 CNEC Japan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  }
}

// 이메일 발송 함수
export const sendEmail = async (templateType, recipientEmail, data) => {
  try {
    const template = EMAIL_TEMPLATES[templateType]
    if (!template) {
      throw new Error(`Email template ${templateType} not found`)
    }

    const emailData = {
      to: recipientEmail,
      subject: template.subject,
      html: template.template(data),
      created_at: new Date().toISOString()
    }

    // Supabase에 이메일 로그 저장
    const { data: logData, error: logError } = await supabase
      .from('email_logs')
      .insert([{
        recipient_email: recipientEmail,
        template_type: templateType,
        subject: template.subject,
        data: data,
        status: 'pending',
        created_at: new Date().toISOString()
      }])

    if (logError) {
      console.error('Email log error:', logError)
    }

    // Gmail SMTP 직접 발송 - 시스템 설정에서 SMTP 정보 가져오기
    const emailSettings = JSON.parse(localStorage.getItem('cnec_email_settings') || '{}')
    
    if (emailSettings.smtpHost && emailSettings.smtpUser && emailSettings.smtpPass) {
      try {
        // Gmail 직접 발송 서비스 사용
        const gmailEmailService = await import('./gmailEmailService.js')
        const emailService = gmailEmailService.default
        
        const result = await emailService.sendEmailDirect(
          recipientEmail,
          template.subject,
          template.template(data)
        )

        if (result.success) {
          console.log('✅ Gmail 실제 이메일 발송 성공:', {
            type: templateType,
            to: recipientEmail,
            subject: template.subject,
            messageId: result.messageId
          })
          
          // 성공 시 로그 업데이트
          if (logData?.[0]?.id) {
            await supabase
              .from('email_logs')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString(),
                message_id: result.messageId
              })
              .eq('id', logData[0].id)
          }
        } else {
          throw new Error(result.error || 'Gmail 발송 실패')
        }
      } catch (gmailError) {
        console.error('Gmail 발송 오류:', gmailError)
        // Gmail 실패 시에도 로그는 남기고 콘솔 출력
        console.log('📧 이메일 발송 (Gmail 실패, 콘솔 출력):', {
          type: templateType,
          to: recipientEmail,
          subject: template.subject,
          error: gmailError.message
        })
      }
    } else {
      // SMTP 설정이 없으면 콘솔 출력만
      console.log('📧 이메일 발송 (SMTP 미설정, 콘솔 출력):', {
        type: templateType,
        to: recipientEmail,
        subject: template.subject,
        note: '시스템 설정에서 Gmail SMTP 정보를 입력하면 실제 발송됩니다.'
      })
    }

    return { success: true, logId: logData?.[0]?.id }

  } catch (error) {
    console.error('Send email error:', error)
    return { success: false, error: error.message }
  }
}

// 스케줄된 이메일 발송 (마감일 알림용)
export const scheduleReminderEmails = async (campaignId, deadline) => {
  try {
    const deadlineDate = new Date(deadline)
    const now = new Date()

    // 3일전 알림 스케줄
    const reminder3Days = new Date(deadlineDate)
    reminder3Days.setDate(reminder3Days.getDate() - 3)

    // 1일전 알림 스케줄
    const reminder1Day = new Date(deadlineDate)
    reminder1Day.setDate(reminder1Day.getDate() - 1)

    // 당일 알림 스케줄
    const reminderToday = new Date(deadlineDate)
    reminderToday.setHours(9, 0, 0, 0) // 오전 9시

    const schedules = []

    // 3일전 알림이 미래인 경우에만 스케줄
    if (reminder3Days > now) {
      schedules.push({
        campaign_id: campaignId,
        email_type: 'DEADLINE_REMINDER_3DAYS',
        scheduled_at: reminder3Days.toISOString(),
        status: 'scheduled'
      })
    }

    // 1일전 알림이 미래인 경우에만 스케줄
    if (reminder1Day > now) {
      schedules.push({
        campaign_id: campaignId,
        email_type: 'DEADLINE_REMINDER_1DAY',
        scheduled_at: reminder1Day.toISOString(),
        status: 'scheduled'
      })
    }

    // 당일 알림이 미래인 경우에만 스케줄
    if (reminderToday > now) {
      schedules.push({
        campaign_id: campaignId,
        email_type: 'DEADLINE_TODAY',
        scheduled_at: reminderToday.toISOString(),
        status: 'scheduled'
      })
    }

    if (schedules.length > 0) {
      const { error } = await supabase
        .from('email_schedules')
        .insert(schedules)

      if (error) {
        console.error('Schedule email error:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true, scheduled: schedules.length }

  } catch (error) {
    console.error('Schedule reminder emails error:', error)
    return { success: false, error: error.message }
  }
}

// 이메일 발송 트리거 함수들
export const emailTriggers = {
  // 회원가입 완료
  onSignupComplete: async (user) => {
    await sendEmail('SIGNUP_COMPLETE', user.email, {
      name: user.name || 'ユーザー',
      email: user.email
    })
  },

  // 캠페인 신청 완료
  onApplicationSubmitted: async (application, campaign, user) => {
    await sendEmail('APPLICATION_SUBMITTED', user.email, {
      name: user.name || 'ユーザー',
      campaignTitle: campaign.title,
      brandName: campaign.brand,
      rewardAmount: campaign.reward_amount
    })
  },

  // 캠페인 승인
  onApplicationApproved: async (application, campaign, user) => {
    const deadline = new Date(campaign.deadline).toLocaleDateString('ja-JP')
    const shippingDate = new Date()
    shippingDate.setDate(shippingDate.getDate() + 3)

    await sendEmail('APPLICATION_APPROVED', user.email, {
      name: user.name || 'ユーザー',
      campaignTitle: campaign.title,
      deadline: deadline,
      shippingDate: shippingDate.toLocaleDateString('ja-JP'),
      rewardAmount: campaign.reward_amount,
      googleDriveLink: campaign.google_drive_link,
      googleSlidesLink: campaign.google_slides_link
    })

    // 마감일 알림 스케줄
    await scheduleReminderEmails(campaign.id, campaign.deadline)
  },

  // 가이드 전달
  onGuideDelivered: async (campaign, user) => {
    const deadline = new Date(campaign.deadline).toLocaleDateString('ja-JP')
    const shippingDate = new Date()
    shippingDate.setDate(shippingDate.getDate() + 3)

    const reminder3Days = new Date(campaign.deadline)
    reminder3Days.setDate(reminder3Days.getDate() - 3)

    const reminder1Day = new Date(campaign.deadline)
    reminder1Day.setDate(reminder1Day.getDate() - 1)

    await sendEmail('GUIDE_DELIVERED', user.email, {
      name: user.name || 'ユーザー',
      campaignTitle: campaign.title,
      deadline: deadline,
      shippingDate: shippingDate.toLocaleDateString('ja-JP'),
      reminder3Days: reminder3Days.toLocaleDateString('ja-JP'),
      reminder1Day: reminder1Day.toLocaleDateString('ja-JP'),
      googleDriveLink: campaign.google_drive_link,
      googleSlidesLink: campaign.google_slides_link
    })
  },

  // 포인트 신청 완료
  onPointRequestSubmitted: async (pointRequest, user, bankInfo) => {
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + 2)

    const transferDate = new Date()
    transferDate.setDate(transferDate.getDate() + 5)

    const depositDate = new Date()
    depositDate.setDate(depositDate.getDate() + 7)

    await sendEmail('POINT_REQUEST_SUBMITTED', user.email, {
      name: user.name || 'ユーザー',
      pointAmount: pointRequest.amount,
      amount: pointRequest.amount, // 1포인트 = 1엔 가정
      reason: pointRequest.reason,
      bankName: bankInfo.bank_name,
      branchName: bankInfo.branch_name,
      accountNumber: bankInfo.account_number,
      accountHolder: bankInfo.account_holder,
      reviewDate: reviewDate.toLocaleDateString('ja-JP'),
      transferDate: transferDate.toLocaleDateString('ja-JP'),
      depositDate: depositDate.toLocaleDateString('ja-JP')
    })
  },

  // 포인트 입금 완료
  onPointTransferCompleted: async (transfer, user, campaign) => {
    await sendEmail('POINT_TRANSFER_COMPLETED', user.email, {
      name: user.name || 'ユーザー',
      amount: transfer.amount,
      transferDate: new Date(transfer.completed_at).toLocaleDateString('ja-JP'),
      transactionId: transfer.transaction_id,
      bankName: transfer.bank_name,
      branchName: transfer.branch_name,
      accountNumber: transfer.account_number,
      campaignTitle: campaign.title,
      pointAmount: transfer.point_amount,
      platform: transfer.platform || 'Instagram',
      postDate: new Date(transfer.post_date).toLocaleDateString('ja-JP')
    })
  }
}

// 한국어 이메일 발송 함수
export const sendEmailKorean = async (templateType, recipientEmail, data) => {
  try {
    const template = EMAIL_TEMPLATES_KO[templateType]
    if (!template) {
      console.error(`Korean email template ${templateType} not found`)
      return { success: false, error: 'Template not found' }
    }

    const emailData = {
      to: recipientEmail,
      subject: template.subject,
      html: template.template(data),
      created_at: new Date().toISOString()
    }

    // Supabase에 이메일 로그 저장
    const { data: logData, error: logError } = await supabase
      .from('email_logs')
      .insert([{
        recipient_email: recipientEmail,
        template_type: templateType,
        subject: template.subject,
        data: data,
        status: 'pending',
        created_at: new Date().toISOString()
      }])

    if (logError) {
      console.error('Email log error:', logError)
    }

    // Gmail SMTP 직접 발송 - 시스템 설정에서 SMTP 정보 가져오기
    const emailSettings = JSON.parse(localStorage.getItem('cnec_email_settings') || '{}')

    if (emailSettings.smtpHost && emailSettings.smtpUser && emailSettings.smtpPass) {
      try {
        const gmailEmailService = await import('./gmailEmailService.js')
        const emailService = gmailEmailService.default

        const result = await emailService.sendEmailDirect(
          recipientEmail,
          template.subject,
          template.template(data)
        )

        if (result.success) {
          console.log('✅ 한국어 이메일 발송 성공:', {
            type: templateType,
            to: recipientEmail,
            subject: template.subject,
            messageId: result.messageId
          })

          if (logData?.[0]?.id) {
            await supabase
              .from('email_logs')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                message_id: result.messageId
              })
              .eq('id', logData[0].id)
          }
        } else {
          throw new Error(result.error || '이메일 발송 실패')
        }
      } catch (gmailError) {
        console.error('Gmail 발송 오류:', gmailError)
        console.log('📧 이메일 발송 (Gmail 실패, 콘솔 출력):', {
          type: templateType,
          to: recipientEmail,
          subject: template.subject,
          error: gmailError.message
        })
      }
    } else {
      console.log('📧 이메일 발송 (SMTP 미설정, 콘솔 출력):', {
        type: templateType,
        to: recipientEmail,
        subject: template.subject,
        note: '시스템 설정에서 Gmail SMTP 정보를 입력하면 실제 발송됩니다.'
      })
    }

    return { success: true, logId: logData?.[0]?.id }

  } catch (error) {
    console.error('Send Korean email error:', error)
    return { success: false, error: error.message }
  }
}

// 한국어 이메일 트리거
export const emailTriggersKorean = {
  // 캠페인 승인 (한국어)
  onApplicationApproved: async (application, campaign, user) => {
    const deadline = campaign.deadline
      ? new Date(campaign.deadline).toLocaleDateString('ko-KR')
      : '추후 안내'
    const shippingDate = new Date()
    shippingDate.setDate(shippingDate.getDate() + 3)

    await sendEmailKorean('APPLICATION_APPROVED', user.email, {
      name: user.name || '크리에이터',
      campaignTitle: campaign.title,
      deadline: deadline,
      shippingDate: shippingDate.toLocaleDateString('ko-KR'),
      rewardAmount: campaign.reward_amount || campaign.reward || 0,
      googleDriveLink: application.google_drive_url || campaign.google_drive_link,
      googleSlidesLink: application.google_slides_url || campaign.google_slides_link
    })
  }
}

export default {
  sendEmail,
  sendEmailKorean,
  scheduleReminderEmails,
  emailTriggers,
  emailTriggersKorean,
  EMAIL_TEMPLATES,
  EMAIL_TEMPLATES_KO
}
