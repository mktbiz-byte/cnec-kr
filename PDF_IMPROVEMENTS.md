# CNEC Korea 메인페이지 개선사항 (PDF 기준)

## 1. 히어로 섹션 (Hero Section)

### 현재 (Before)
```
Plain Text:
K-Beauty × 숏폼 영상
전문플랫폼

집에서 부업하는 크리에이터 플랫폼
```

### 개선 (After)
```html
<div class="logo">
  <img src="cnec-new-logo.svg" alt="CNEC Korea">
  <p class="tagline">K-부티와 크리에이터를 연결합니다</p>
</div>

<h1 class="hero-title">
  K-Beauty 크리에이터와 함께
  <span class="highlight">성장하는 플랫폼</span>
</h1>

<p class="hero-subtitle">
  뷰티 크리에이터를 육성하고 양성하며,
  브랜드와 함께 성장하는 전문 파트너십 플랫폼
</p>

<!-- CTA 버튼 -->
<div class="hero-cta">
  <button class="primary-btn">크리에이터 등록하기</button>
  <button class="secondary-btn">프로그램 알아보기</button>
</div>

<!-- 핵심 가치 제안 (3가지) -->
<div class="value-props">
  <div class="value-item">
    <span class="icon">🎓</span>
    <h3>체계적인 교육</h3>
    <p>뷰티 콘텐츠 제작 노하우 전수</p>
  </div>
  <div class="value-item">
    <span class="icon">🤝</span>
    <h3>브랜드 파트너십</h3>
    <p>100+ 뷰티 브랜드와 직접 협업</p>
  </div>
  <div class="value-item">
    <span class="icon">✅</span>
    <h3>성장 지원</h3>
    <p>유튜브 채널 육성 프로그램</p>
  </div>
</div>
```

### UX/UI 개선 포인트
1. "부업" 대신 "성장" 강조 → 전문성 및 장기 비전 제시
2. 3가지 핵심 가치 명확히 제시 → 교육, 파트너십, 성장
3. CTA 2개 제공 → 즉시 등록 vs 정보 탐색 (다양한 사용자 니즈 충족)

---

## 2. 서비스 소개 섹션

### 현재 (Before)
```
Plain Text:
CNEC Korea이란
한국 화장품 브랜드와 크리에이터를 연결하는 전문 플랫폼

타겟특화
K-Beauty에특화된마케팅에효과적으로모델실현

숏폼영상중시
TikTok, Instagram Reels등숏폼영상플랫폼에최적화

안심의지원
브랜드와크리에이터쌍방을지원하기충실한서비스
```

### 개선 (After)
```html
<section class="about-section">
  <h2 class="section-title">CNEC Korea란?</h2>
  <p class="section-subtitle">
    K-뷰티 크리에이터를 육성하고 양성하는 전문 플랫폼입니다.
    브랜드와 크리에이터가 함께 성장하며, 지속 가능한 파트너십을 구축합니다.
  </p>

  <div class="features-grid">
    <!-- Feature 1 -->
    <div class="feature-card">
      <div class="feature-icon">
        <span>🎓</span>
      </div>
      <h3>크리에이터 육성</h3>
      <p>
        체계적인 교육 프로그램과 멘토링을 통해
        초보 크리에이터도 전문가로 성장할 수 있도록 지원합니다.
      </p>
      <ul class="feature-list">
        <li>✓ 콘텐츠 제작 교육</li>
        <li>✓ 1:1 멘토링</li>
        <li>✓ 성공 사례 공유</li>
      </ul>
    </div>

    <!-- Feature 2 -->
    <div class="feature-card">
      <div class="feature-icon">
        <span>🤝</span>
      </div>
      <h3>브랜드 파트너십</h3>
      <p>
        100개 이상의 K-뷰티 브랜드와 직접 협업하며,
        크리에이터에게 다양한 기회를 제공합니다.
      </p>
      <ul class="feature-list">
        <li>✓ 브랜드 직접 매칭</li>
        <li>✓ 장기 계약 기회</li>
        <li>✓ 독점 캠페인 참여</li>
      </ul>
    </div>

    <!-- Feature 3 -->
    <div class="feature-card">
      <div class="feature-icon">
        <span>✅</span>
      </div>
      <h3>성장 지원 시스템</h3>
      <p>
        유튜브 채널 육성부터 숏폼 크리에이터 프로그램까지,
        단계별 성장을 체계적으로 지원합니다.
      </p>
      <ul class="feature-list">
        <li>✓ 유튜브 육성 프로그램</li>
        <li>✓ 숏폼 크리에이터 혜택</li>
        <li>✓ 포인트 추가 지급</li>
      </ul>
    </div>

    <!-- Feature 4 -->
    <div class="feature-card">
      <div class="feature-icon">
        <span>📱</span>
      </div>
      <h3>숏폼 콘텐츠 전문</h3>
      <p>
        TikTok, Instagram Reels, YouTube Shorts 등
        숏폼 플랫폼에 최적화된 콘텐츠 제작을 지원합니다.
      </p>
      <ul class="feature-list">
        <li>✓ 숏폼 트렌드 분석</li>
        <li>✓ 편집 가이드 제공</li>
        <li>✓ 바이럴 전략 공유</li>
      </ul>
    </div>
  </div>
</section>
```

### UX/UI 개선 포인트
1. 4개 카드 그리드 → 시각적 균형 및 정보 구조화
2. 구체적인 혜택 나열 → 추상적 문구 대신 실질적 가치 제시
3. 아이콘 + 제목 + 설명 + 리스트 → 정보 계층 명확화

---

## 3. 신규 프로그램 섹션 추가

### 새로운 색션: 크리에이터 성장 프로그램

```html
<section class="programs-section">
  <h2 class="section-title">크리에이터 성장 프로그램</h2>
  <p class="section-subtitle">
    CNEC와 함께 뷰티 크리에이터로 성장하세요.
    단계별 프로그램으로 체계적인 성장을 지원합니다.
  </p>

  <div class="programs-grid">
    <!-- 프로그램 1: 유튜브 육성 -->
    <div class="program-card featured">
      <div class="program-badge">🏆 인기 프로그램</div>
      <div class="program-icon">
        <span>📺</span>
      </div>
      <h3 class="program-title">유튜브 육성 프로그램</h3>
      <p class="program-description">
        뷰티 전문 유튜브 채널을 함께 성장시키는
        CNEC의 대표 프로그램입니다.
      </p>

      <div class="program-benefits">
        <h4>프로그램 혜택</h4>
        <ul>
          <li>
            <span class="benefit-icon">💰</span>
            <strong>100만 포인트 지원</strong>
            <p>초기 채널 운영 자금 전액 지원</p>
          </li>
          <li>
            <span class="benefit-icon">🎬</span>
            <strong>제품비 100% 지원</strong>
            <p>리뷰용 뷰티 제품 무제한 제공</p>
          </li>
          <li>
            <span class="benefit-icon">🎓</span>
            <strong>체계적인 교육</strong>
            <p>콘텐츠 기획, 촬영, 편집 전문 교육</p>
          </li>
          <li>
            <span class="benefit-icon">🤝</span>
            <strong>1:1 멘토링</strong>
            <p>성공한 크리에이터의 노하우 전수</p>
          </li>
          <li>
            <span class="benefit-icon">✅</span>
            <strong>채널 성장 전략</strong>
            <p>알고리즘 분석 및 최적화 지원</p>
          </li>
        </ul>
      </div>

      <div class="program-requirements">
        <h4>지원 자격</h4>
        <ul>
          <li>✓ 뷰티에 관심이 많은 크리에이터</li>
          <li>✓ 주 3회 이상 콘텐츠 업로드 가능</li>
          <li>✓ 6개월 이상 장기 활동 의지</li>
          <li>✓ 구독자 수 무관 (초보 환영)</li>
        </ul>
      </div>

      <div class="program-stats">
        <div class="stat-item">
          <span class="stat-number">50+</span>
          <span class="stat-label">참여 크리에이터</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">평균 5만</span>
          <span class="stat-label">구독자 성장</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">6개월</span>
          <span class="stat-label">프로그램 기간</span>
        </div>
      </div>

      <button class="program-cta-btn primary">
        유튜브 육성 프로그램 지원하기 →
      </button>
    </div>

    <!-- 프로그램 2: 숏폼 크리에이터 -->
    <div class="program-card">
      <div class="program-badge">⭐ 추천</div>
      <div class="program-icon">
        <span>📱</span>
      </div>
      <h3 class="program-title">숏폼 크리에이터 프로그램</h3>
      <p class="program-description">
        CNEC의 공식 숏폼 크리에이터로 활동하며
        특별한 혜택과 기회를 누리세요.
      </p>

      <div class="program-benefits">
        <h4>프로그램 혜택</h4>
        <ul>
          <li>
            <span class="benefit-icon">💎</span>
            <strong>포인트 추가 지급</strong>
            <p>일반 캠페인 대비 20-50% 추가 보상</p>
          </li>
          <li>
            <span class="benefit-icon">⭐</span>
            <strong>추천 크리에이터 선정</strong>
            <p>매일 페이지 및 브랜드에 우선 노출</p>
          </li>
          <li>
            <span class="benefit-icon">🔥</span>
            <strong>브랜드 협업 참여</strong>
            <p>오프라인 이벤트 및 팝업스토어 초대</p>
          </li>
          <li>
            <span class="benefit-icon">📊</span>
            <strong>공동구매 협업</strong>
            <p>크리에이터 전용 공동구매 기획 및 수익 분배</p>
          </li>
          <li>
            <span class="benefit-icon">🎯</span>
            <strong>독점 캠페인 우선 배정</strong>
            <p>고액 캠페인 및 장기 계약 우선 제안</p>
          </li>
          <li>
            <span class="benefit-icon">📢</span>
            <strong>전문 매니지먼트</strong>
            <p>전담 매니저의 1:1 케어 및 성장 관리</p>
          </li>
        </ul>
      </div>

      <div class="program-requirements">
        <h4>선정 기준</h4>
        <ul>
          <li>✓ CNEC 캠페인 5회 이상 참여</li>
          <li>✓ 평균 평점 4.5점 이상</li>
          <li>✓ SNS 팔로워 1만 명 이상 (또는 높은 참여율)</li>
          <li>✓ 뷰티 콘텐츠 전문성 및 일관성</li>
        </ul>
      </div>

      <div class="program-stats">
        <div class="stat-item">
          <span class="stat-number">30+</span>
          <span class="stat-label">숏폼 크리에이터</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">평균 150만원</span>
          <span class="stat-label">월 수익</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">장기</span>
          <span class="stat-label">계약 기간</span>
        </div>
      </div>

      <button class="program-cta-btn secondary">
        숏폼 크리에이터 지원하기 →
      </button>
    </div>

    <!-- 프로그램 3: 일반 캠페인 -->
    <div class="program-card">
      <div class="program-icon">
        <span>📝</span>
      </div>
      <h3 class="program-title">일반 캠페인 참여</h3>
      <p class="program-description">
        부담 없이 시작하는 캠페인 참여로
        크리에이터 활동을 경험해보세요.
      </p>

      <div class="program-benefits">
        <h4>프로그램 혜택</h4>
        <ul>
          <li>
            <span class="benefit-icon">✨</span>
            <strong>자유로운 참여</strong>
            <p>원하는 캠페인만 선택하여 참여</p>
          </li>
          <li>
            <span class="benefit-icon">💰</span>
            <strong>포인트 즉시 지급</strong>
            <p>캠페인 완료 후 3-7일 내 지급</p>
          </li>
          <li>
            <span class="benefit-icon">🎁</span>
            <strong>제품 무료 제공</strong>
            <p>리뷰용 뷰티 제품 무료 배송</p>
          </li>
          <li>
            <span class="benefit-icon">✅</span>
            <strong>결제 쓱기</strong>
            <p>캠페인 참여 이력으로 상위 프로그램 진입</p>
          </li>
        </ul>
      </div>

      <div class="program-requirements">
        <h4>참여 조건</h4>
        <ul>
          <li>✓ SNS 계정 보유 (Instagram, TikTok, YouTube 등)</li>
          <li>✓ 팔로워 수 무관</li>
          <li>✓ 뷰티에 관심 있는 누구나</li>
        </ul>
      </div>

      <div class="program-stats">
        <div class="stat-item">
          <span class="stat-number">500+</span>
          <span class="stat-label">참여 크리에이터</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">평균 30만원</span>
          <span class="stat-label">월 수익</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">즉시</span>
          <span class="stat-label">시작 가능</span>
        </div>
      </div>

      <button class="program-cta-btn tertiary">
        캠페인 둘러보기 →
      </button>
    </div>
  </div>
</section>
```

---

## 4. 프로그램 비교 테이블

```html
<div class="program-comparison">
  <h3>프로그램 비교</h3>
  <table class="comparison-table">
    <thead>
      <tr>
        <th>혜택</th>
        <th>일반 캠페인</th>
        <th>숏폼 크리에이터</th>
        <th>유튜브 육성</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>캠페인 참여</td>
        <td>✓</td>
        <td>✓ (우선 배정)</td>
        <td>✓</td>
      </tr>
      <tr>
        <td>포인트 지급</td>
        <td>기본</td>
        <td>20-50% 추가</td>
        <td>100만P 지원</td>
      </tr>
      <tr>
        <td>제품 지원</td>
        <td>✓</td>
        <td>✓</td>
        <td>100% 지원</td>
      </tr>
      <tr>
        <td>교육/멘토링</td>
        <td>✗</td>
        <td>✓</td>
        <td>✓ (1:1)</td>
      </tr>
      <tr>
        <td>브랜드 협업</td>
        <td>✗</td>
        <td>✓</td>
        <td>✓</td>
      </tr>
      <tr>
        <td>매니지먼트</td>
        <td>✗</td>
        <td>✓</td>
        <td>✓</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 구현 우선순위

1. **Phase 1**: 히어로 섹션 개선 (로고, 타이틀, 3가지 핵심 가치)
2. **Phase 2**: 서비스 소개 4개 카드 그리드
3. **Phase 3**: 신규 프로그램 섹션 3개 추가
4. **Phase 4**: 프로그램 비교 테이블
5. **Phase 5**: 반응형 디자인 및 모바일 최적화

