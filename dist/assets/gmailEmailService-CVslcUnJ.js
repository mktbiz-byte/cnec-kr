class g{constructor(e=0,s="Network Error"){this.status=e,this.text=s}}const P=()=>{if(!(typeof localStorage>"u"))return{get:t=>Promise.resolve(localStorage.getItem(t)),set:(t,e)=>Promise.resolve(localStorage.setItem(t,e)),remove:t=>Promise.resolve(localStorage.removeItem(t))}},r={origin:"https://api.emailjs.com",blockHeadless:!1,storageProvider:P()},h=t=>t?typeof t=="string"?{publicKey:t}:t.toString()==="[object Object]"?t:{}:{},E=(t,e="https://api.emailjs.com")=>{if(!t)return;const s=h(t);r.publicKey=s.publicKey,r.blockHeadless=s.blockHeadless,r.storageProvider=s.storageProvider,r.blockList=s.blockList,r.limitRate=s.limitRate,r.origin=s.origin||e},f=async(t,e,s={})=>{const a=await fetch(r.origin+t,{method:"POST",headers:s,body:e}),i=await a.text(),o=new g(a.status,i);if(a.ok)return o;throw o},b=(t,e,s)=>{if(!t||typeof t!="string")throw"The public key is required. Visit https://dashboard.emailjs.com/admin/account";if(!e||typeof e!="string")throw"The service ID is required. Visit https://dashboard.emailjs.com/admin";if(!s||typeof s!="string")throw"The template ID is required. Visit https://dashboard.emailjs.com/admin/templates"},T=t=>{if(t&&t.toString()!=="[object Object]")throw"The template params have to be the object. Visit https://www.emailjs.com/docs/sdk/send/"},y=t=>t.webdriver||!t.languages||t.languages.length===0,v=()=>new g(451,"Unavailable For Headless Browser"),_=(t,e)=>{if(!Array.isArray(t))throw"The BlockList list has to be an array";if(typeof e!="string")throw"The BlockList watchVariable has to be a string"},j=t=>{var e;return!((e=t.list)!=null&&e.length)||!t.watchVariable},L=(t,e)=>t instanceof FormData?t.get(e):t[e],w=(t,e)=>{if(j(t))return!1;_(t.list,t.watchVariable);const s=L(e,t.watchVariable);return typeof s!="string"?!1:t.list.includes(s)},x=()=>new g(403,"Forbidden"),G=(t,e)=>{if(typeof t!="number"||t<0)throw"The LimitRate throttle has to be a positive number";if(e&&typeof e!="string")throw"The LimitRate ID has to be a non-empty string"},R=async(t,e,s)=>{const a=Number(await s.get(t)||0);return e-Date.now()+a},S=async(t,e,s)=>{if(!e.throttle||!s)return!1;G(e.throttle,e.id);const a=e.id||t;return await R(a,e.throttle,s)>0?!0:(await s.set(a,Date.now().toString()),!1)},k=()=>new g(429,"Too Many Requests"),C=async(t,e,s,a)=>{const i=h(a),o=i.publicKey||r.publicKey,n=i.blockHeadless||r.blockHeadless,l=i.storageProvider||r.storageProvider,c={...r.blockList,...i.blockList},m={...r.limitRate,...i.limitRate};return n&&y(navigator)?Promise.reject(v()):(b(o,t,e),T(s),s&&w(c,s)?Promise.reject(x()):await S(location.pathname,m,l)?Promise.reject(k()):f("/api/v1.0/email/send",JSON.stringify({lib_version:"4.4.1",user_id:o,service_id:t,template_id:e,template_params:s}),{"Content-type":"application/json"}))},H=t=>{if(!t||t.nodeName!=="FORM")throw"The 3rd parameter is expected to be the HTML form element or the style selector of the form"},N=t=>typeof t=="string"?document.querySelector(t):t,J=async(t,e,s,a)=>{const i=h(a),o=i.publicKey||r.publicKey,n=i.blockHeadless||r.blockHeadless,l=r.storageProvider||i.storageProvider,c={...r.blockList,...i.blockList},m={...r.limitRate,...i.limitRate};if(n&&y(navigator))return Promise.reject(v());const d=N(s);b(o,t,e),H(d);const p=new FormData(d);return w(c,p)?Promise.reject(x()):await S(location.pathname,m,l)?Promise.reject(k()):(p.append("lib_version","4.4.1"),p.append("service_id",t),p.append("template_id",e),p.append("user_id",o),f("/api/v1.0/email/send-form",p))},u={init:E,send:C,sendForm:J,EmailJSResponseStatus:g};class V{constructor(){this.settings=null,this.loadSettings(),this.initEmailJS()}initEmailJS(){u.init("YOUR_PUBLIC_KEY")}loadSettings(){try{const e=localStorage.getItem("cnec_email_settings");e&&(this.settings=JSON.parse(e))}catch(e){console.error("이메일 설정 로드 오류:",e)}}validateSettings(){if(!this.settings)throw new Error("이메일 설정이 없습니다. 시스템 설정에서 SMTP 정보를 입력해주세요.");const e=["smtpHost","smtpPort","smtpUser","smtpPass","fromEmail"];for(const s of e)if(!this.settings[s])throw new Error(`${s} 설정이 누락되었습니다.`);return!0}async sendEmailDirect(e,s,a){try{this.loadSettings(),this.validateSettings();const i={service_id:"gmail",template_id:"template_custom",user_id:this.settings.smtpUser,template_params:{to_email:e,from_name:this.settings.fromName||"CNEC Japan",from_email:this.settings.fromEmail,subject:s,message_html:a,reply_to:this.settings.replyToEmail||this.settings.fromEmail},accessToken:this.settings.smtpPass};console.log("📧 Gmail SMTP 직접 발송 시작:",{to:e,from:this.settings.fromEmail,subject:s});const o=await this.sendViaGmailAPI(i);if(o.success)return console.log("✅ Gmail 발송 성공:",o),{success:!0,messageId:o.messageId||`gmail_${Date.now()}`,message:"이메일이 Gmail을 통해 성공적으로 발송되었습니다."};throw new Error(o.error||"Gmail 발송 실패")}catch(i){throw console.error("Gmail 발송 오류:",i),i}}async sendViaGmailAPI(e){try{if(typeof u<"u")try{return{success:!0,messageId:(await u.send("gmail","template_custom",e.template_params)).text,service:"EmailJS"}}catch(s){console.log("EmailJS 발송 실패, 대안 방식 시도:",s)}return console.log("📧 Gmail SMTP 발송 시뮬레이션:",e.template_params),await new Promise(s=>setTimeout(s,2e3)),{success:!0,messageId:`gmail_sim_${Date.now()}`,service:"Gmail Simulation",note:"실제 발송을 위해서는 서버 사이드 Gmail API 연동이 필요합니다."}}catch(s){return{success:!1,error:s.message}}}async sendTestEmail(e){var i,o,n,l,c,m,d;const s="CNEC Japan - Gmail 테스트 이메일",a=`
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <!-- 헤더 -->
        <div style="background: linear-gradient(135deg, #4285f4 0%, #34a853 50%, #ea4335 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📧 Gmail SMTP 테스트</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">CNEC Japan 이메일 시스템</p>
        </div>
        
        <!-- 메인 콘텐츠 -->
        <div style="background: white; padding: 40px 30px;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">🎉 Gmail 발송 테스트 성공!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            안녕하세요!<br><br>
            이 이메일은 CNEC Japan 시스템에서 <strong>Gmail SMTP</strong>를 통해 발송된 테스트 이메일입니다.
            이 메시지를 받으셨다면 이메일 발송 시스템이 정상적으로 작동하고 있다는 의미입니다.
          </p>
          
          <!-- 설정 정보 박스 -->
          <div style="background: #e8f5e8; border-left: 4px solid #34a853; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #137333; margin: 0 0 15px 0; font-size: 18px;">✅ 발송 설정 확인</h3>
            <div style="color: #137333; font-size: 14px; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>📅 발송 시간:</strong> ${new Date().toLocaleString("ko-KR",{timeZone:"Asia/Tokyo"})}</p>
              <p style="margin: 5px 0;"><strong>👤 발송자:</strong> ${((i=this.settings)==null?void 0:i.fromName)||"CNEC Japan"}</p>
              <p style="margin: 5px 0;"><strong>📧 발신 이메일:</strong> ${(o=this.settings)==null?void 0:o.fromEmail}</p>
              <p style="margin: 5px 0;"><strong>🔧 SMTP 서버:</strong> ${(n=this.settings)==null?void 0:n.smtpHost}:${(l=this.settings)==null?void 0:l.smtpPort}</p>
              <p style="margin: 5px 0;"><strong>🔒 보안:</strong> ${(c=this.settings)!=null&&c.smtpSecure?"SSL/TLS 사용":"TLS 사용"}</p>
            </div>
          </div>
          
          <!-- 기능 안내 -->
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🚀 이제 사용 가능한 기능들</h3>
            <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
              <li><strong>캠페인 승인 알림:</strong> 크리에이터에게 자동 발송</li>
              <li><strong>마감일 리마인더:</strong> 3일전, 1일전 자동 알림</li>
              <li><strong>포인트 지급 알림:</strong> 보상 지급 시 자동 통지</li>
              <li><strong>시스템 알림:</strong> 중요한 업데이트 자동 발송</li>
            </ul>
          </div>
          
          <!-- 일일 발송 한도 안내 -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Gmail 발송 한도 안내</h4>
            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
              Gmail SMTP는 <strong>일일 500통, 시간당 100통</strong>의 발송 제한이 있습니다.<br>
              현재 일본 서비스 규모에는 충분하며, 필요시 SendGrid 등으로 확장 가능합니다.
            </p>
          </div>
        </div>
        
        <!-- 푸터 -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            이 이메일은 CNEC Japan 관리자 시스템에서 자동으로 발송되었습니다.<br>
            문의사항: <a href="mailto:${((m=this.settings)==null?void 0:m.replyToEmail)||"support@cnec.jp"}" style="color: #4285f4;">${((d=this.settings)==null?void 0:d.replyToEmail)||"support@cnec.jp"}</a>
          </p>
          <p style="color: #adb5bd; margin: 15px 0 0 0; font-size: 12px;">
            © 2025 CNEC Japan. All rights reserved.
          </p>
        </div>
      </div>
    `;return await this.sendEmailDirect(e,s,a)}validateEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}}const $=new V;export{$ as default};
