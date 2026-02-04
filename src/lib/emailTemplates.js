// 이메일 템플릿 및 자동화 시스템

export const emailTemplates = {
  // 1. 가입 축하 메일
  welcome: {
    subject: 'CNEC へようこそ！アカウント作成完了のお知らせ',
    template: (userName) => `
      <div style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CNEC</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">K-Beauty インフルエンサープラットフォーム</p>
        </div>
        
        <div style="background: white; padding: 40px 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">ようこそ、${userName}さん！</h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            CNECへのご登録ありがとうございます。あなたのアカウントが正常に作成されました。
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">次のステップ</h3>
            <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>プロフィールを完成させる</li>
              <li>興味のあるキャンペーンを探す</li>
              <li>キャンペーンに応募する</li>
              <li>承認後、コンテンツを作成・投稿する</li>
              <li>報酬を獲得する</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cnec.jp" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              マイページを見る
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            ご質問がございましたら、いつでもお気軽にお問い合わせください。<br>
            CNECチーム一同、あなたの成功を応援しています！
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">© 2024 CNEC. All rights reserved.</p>
        </div>
      </div>
    `
  },

  // 2. 캠페인 승인 메일
  campaignApproved: {
    subject: 'キャンペーン承認のお知らせ - {campaignTitle}',
    template: (userName, campaignTitle, campaignBrand, rewardAmount, driveLink, guideLink) => `
      <div style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 承認おめでとうございます！</h1>
        </div>
        
        <div style="background: white; padding: 40px 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${userName}さん</h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            「<strong>${campaignTitle}</strong>」キャンペーンへの応募が承認されました！
          </p>
          
          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">キャンペーン詳細</h3>
            <p style="margin: 5px 0; color: #333;"><strong>ブランド:</strong> ${campaignBrand}</p>
            <p style="margin: 5px 0; color: #333;"><strong>報酬:</strong> ¥${rewardAmount?.toLocaleString()}</p>
          </div>
          
          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #d97706; margin: 0 0 15px 0; font-size: 18px;">⚠️ 重要な注意事項</h3>
            <p style="color: #92400e; line-height: 1.6; margin: 0;">
              動画は1次共有後、修正を経てからSNSにアップロードしてください。<br>
              <strong>任意でのアップロードは禁止されています。</strong>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">次のステップ</h3>
            <ol style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>ガイド資料を確認する</li>
              <li>動画を作成する</li>
              <li>1次共有フォルダにアップロードする</li>
              <li>修正後、SNSに投稿する</li>
              <li>マイページで投稿URLを報告する</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="margin: 10px;">
              <a href="${guideLink || '#'}" 
                 style="background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                📋 ガイド資料
              </a>
            </div>
            <div style="margin: 10px;">
              <a href="${driveLink || '#'}" 
                 style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                📁 共有フォルダ
              </a>
            </div>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">© 2024 CNEC. All rights reserved.</p>
        </div>
      </div>
    `
  }
}

// 이메일 발송 서비스
export const emailService = {
  sendWelcomeEmail: async (userEmail, userName) => {
    console.log('Sending welcome email')
    return { success: true }
  },
  
  sendCampaignApprovedEmail: async (userEmail, userName, campaignData) => {
    console.log('Sending campaign approved email')
    return { success: true }
  }
}
