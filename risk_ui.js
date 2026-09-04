/* ============================================================================
 * risk_ui.js — 리스크 플랜 카드 · 팬 차트 · 예측 위상 하향
 * ----------------------------------------------------------------------------
 * 설계 근거: .claude/plans/prediction-system-remake.md
 *
 *   방향 예측은 4.5년 시점정합 백테스트에서 무작위와 구분되지 않았다 (z = +0.05).
 *   재현된 성과는 위험 관리뿐이다 (MDD -11.9% vs 매수후보유 -60.0%).
 *
 * 따라서 화면의 주인공은 예측 수치가 아니라 **실행 리스크 플랜**이어야 한다.
 *
 * script.js(14,865줄) 오염을 피하기 위해 별도 모듈로 분리한다.
 * 전역 네임스페이스: window.RiskUI
 * ========================================================================== */
(function (global) {
    'use strict';

    const KRW_THRESHOLD = 500;

    // 이모지 대신 stroke 아이콘 — 없으면 조용히 생략한다
    function ic(name) {
        return (global.Icons && global.Icons.icon) ? global.Icons.icon(name) : '';
    }

    function fmtPrice(v, isKrw) {
        if (v === null || v === undefined || isNaN(v)) return 'N/A';
        return isKrw
            ? Math.round(v).toLocaleString('ko-KR') + '원'
            : '$' + Number(v).toFixed(Number(v) < 1 ? 4 : 2);
    }

    function isKrwStock(stock) {
        if (!stock) return false;
        if (stock.nativeCurrency) return stock.nativeCurrency === 'KRW';
        const raw = parseFloat(stock.rawPrice || 0);
        return raw > KRW_THRESHOLD;
    }

    /* ------------------------------------------------------------------
     * 1) 실행 리스크 플랜 카드
     *    손절가를 가장 크게 —  실전에서 가장 먼저 정해야 하는 값이다.
     * ---------------------------------------------------------------- */
    function renderRiskPlanCard(stock) {
        const rp = stock && stock.riskPlan;
        if (!rp || !rp.stop_loss) return '';

        const krw = isKrwStock(stock);
        const validated = rp.validated === true;
        const badge = validated
            ? '<span class="rp-badge rp-badge-ok" title="S&P500 시점정합 4.5년 백테스트에서 MDD -11.9% (매수후보유 -60.0%)로 검증된 구조">백테스트 검증</span>'
            : '<span class="rp-badge rp-badge-warn" title="구조는 검증안을 따르나 이 전략 조합은 아직 미검증입니다">미검증 전략</span>';

        const scale = (rp.scale_out || []).map(function (s) {
            return '<li>' + fmtPrice(s[0], krw) + ' 도달 시 ' + Math.round(s[1] * 100) + '% 부분익절</li>';
        }).join('');

        return ''
            + '<div class="risk-plan-card">'
            +   '<div class="rp-head"><span class="rp-title">' + ic('shield') + '실행 리스크 플랜</span>' + badge + '</div>'
            +   '<div class="rp-grid">'
            +     '<div class="rp-item"><span class="rp-label">진입 기준가</span>'
            +       '<span class="rp-value">' + fmtPrice(rp.entry, krw) + '</span></div>'
            +     '<div class="rp-item rp-stop"><span class="rp-label">손절가</span>'
            +       '<span class="rp-value rp-value-lg">' + fmtPrice(rp.stop_loss, krw) + '</span>'
            +       '<span class="rp-sub">−' + rp.risk_pct + '%</span></div>'
            +     '<div class="rp-item rp-target"><span class="rp-label">익절가</span>'
            +       '<span class="rp-value rp-value-lg">' + fmtPrice(rp.take_profit, krw) + '</span>'
            +       '<span class="rp-sub">+' + rp.reward_pct + '%</span></div>'
            +     '<div class="rp-item"><span class="rp-label">손익비</span>'
            +       '<span class="rp-value">1 : ' + rp.rr_ratio + '</span></div>'
            +     '<div class="rp-item"><span class="rp-label">보유 상한</span>'
            +       '<span class="rp-value">' + (rp.max_holding_days || '-') + '영업일</span></div>'
            +   '</div>'
            +   (scale ? '<ul class="rp-scale">' + scale + '</ul>' : '')
            +   '<div class="rp-note">검증된 것은 <b>위험 축소 효과</b>이며 종목 선별의 우위가 아닙니다. '
            +     '동일 규칙을 무작위 선별에 적용해도 같은 결과가 나왔습니다 (z=+0.05).</div>'
            + '</div>';
    }

    /* ------------------------------------------------------------------
     * 2) 팬 차트 밴드 (50 / 80 / 95 분위)
     *    기댓값 경로가 부드러운 것은 정상이다. 불확실성을 함께 그려야
     *    "예측이 밋밋하다"는 오해가 사라진다.
     * ---------------------------------------------------------------- */
    function buildFanBands(stock, mapX, mapY, histLen) {
        const bands = stock && stock.consensusBands;
        if (!bands) return '';

        const spec = [
            { q: '95', opacity: 0.10 },
            { q: '80', opacity: 0.16 },
            { q: '50', opacity: 0.24 }
        ];

        let out = '';
        spec.forEach(function (s) {
            const b = bands[s.q];
            if (!b || !b.upper || !b.lower || !b.upper.length) return;

            const n = b.upper.length;
            let up = '', dn = '';
            for (let i = 0; i < n; i++) {
                const x = mapX(histLen + i);
                up += (i === 0 ? 'M' : 'L') + x + ',' + mapY(b.upper[i]) + ' ';
            }
            for (let i = n - 1; i >= 0; i--) {
                const x = mapX(histLen + i);
                dn += 'L' + x + ',' + mapY(b.lower[i]) + ' ';
            }
            out += '<path d="' + up + dn + 'Z" fill="var(--accent-blue, #0ea5e9)" '
                +  'fill-opacity="' + s.opacity + '" stroke="none" '
                +  'class="fan-band fan-band-' + s.q + '"><title>'
                +  s.q + '% 신뢰구간</title></path>';
        });
        return out;
    }

    function fanLegend() {
        return ''
            + '<div class="fan-legend">'
            +   '<span class="fl-item"><i class="fl-sw fl-50"></i>50%</span>'
            +   '<span class="fl-item"><i class="fl-sw fl-80"></i>80%</span>'
            +   '<span class="fl-item"><i class="fl-sw fl-95"></i>95%</span>'
            +   '<span class="fl-note">중심선은 <b>기댓값 경로</b>입니다. 실제 가격은 밴드 안에서 움직입니다.</span>'
            + '</div>';
    }

    /* ------------------------------------------------------------------
     * 3) 예측 수치 위상 하향
     *    숫자를 지우지는 않되, 신뢰 수준을 함께 보여 오독을 막는다.
     * ---------------------------------------------------------------- */
    function renderPredictionBadge(stock) {
        const pred = stock && stock.predictedResult;
        if (!pred) return '';

        const hr = stock.recent_hit_rate;
        const hitStr = (hr !== null && hr !== undefined)
            ? (hr * 100).toFixed(0) + '%'
            : '집계중';
        const down = String(pred).indexOf('-') >= 0;

        const tip = '방향 예측은 4.5년 시점정합 백테스트에서 무작위 선별과 '
            + '통계적으로 구분되지 않았습니다 (샤프 0.74 vs 0.73, z=+0.05). '
            + '투자 판단의 주된 근거로 사용하지 마십시오. '
            + '검증된 것은 손절·익절 규칙의 위험 축소 효과입니다.';

        return ''
            + '<div class="pred-demoted" title="' + tip + '">'
            +   '<span class="pd-ref">참고</span>'
            +   '<span class="pd-val ' + (down ? 'down' : 'up') + '">' + pred + '</span>'
            +   '<span class="pd-hit">최근 적중률 ' + hitStr + '</span>'
            + '</div>';
    }

    /* ------------------------------------------------------------------
     * 4) 밸류에이션 · 센티먼트 패널
     *    수집만 되고 표시되지 않던 데이터. 가치투자 전략의 진입 게이트가
     *    이 값을 쓰므로, 차단 사유를 이해하려면 화면이 필요하다.
     * ---------------------------------------------------------------- */
    function fmtBig(v) {
        if (v === null || v === undefined || isNaN(v)) return 'N/A';
        const a = Math.abs(v);
        if (a >= 1e12) return (v / 1e12).toFixed(2) + 'T';
        if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
        if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
        return Number(v).toLocaleString();
    }

    // 각 지표의 "좋음/주의/나쁨" 판정 — trade_rules.value_screen 과 동일 기준
    function judge(key, v) {
        if (v === null || v === undefined || isNaN(v)) return ['na', 'N/A'];
        switch (key) {
            case 'pe':   return v <= 0 ? ['bad', '적자'] : (v <= 25 ? ['good', '양호'] : ['warn', '高']);
            case 'peg':  return (v > 0 && v <= 1.5) ? ['good', '양호'] : ['warn', '高'];
            case 'ev':   return v <= 0 ? ['bad', '음수'] : (v <= 15 ? ['good', '양호'] : ['warn', '高']);
            case 'de':   return v <= 100 ? ['good', '안정'] : ['warn', '높음'];
            case 'fcf':  return v > 0 ? ['good', '흑자'] : ['bad', '적자'];
            default:     return ['na', ''];
        }
    }

    function metric(label, value, key, raw) {
        const j = judge(key, raw);
        return '<div class="vp-metric vp-' + j[0] + '">'
            + '<span class="vp-k">' + label + '</span>'
            + '<span class="vp-v">' + value + '</span>'
            + '<span class="vp-j">' + j[1] + '</span></div>';
    }

    function renderValuationSentiment(stock) {
        const r = (stock && stock.reason) || {};
        const v = r.valuation_data;
        const s = r.sentiment_data;
        if (!v && !s) return '';

        let html = '<div class="vs-wrap">';

        if (v) {
            const score = v.valuation_score;
            const pass = score >= 50;
            html += '<div class="vs-card">'
                + '<div class="vs-head"><span>' + ic('tag') + '밸류에이션</span>'
                +   '<span class="vs-score ' + (pass ? 'ok' : 'ng') + '">'
                +     (score !== undefined && score !== null ? Math.round(score) : '-') + '/100'
                +     (pass ? ' 통과' : ' 미달') + '</span></div>'
                + '<div class="vp-grid">'
                +   metric('PER', v.pe_ratio != null ? Number(v.pe_ratio).toFixed(1) : 'N/A', 'pe', v.pe_ratio)
                +   metric('PSR', v.ps_ratio != null ? Number(v.ps_ratio).toFixed(1) : 'N/A', 'na', null)
                +   metric('PEG', v.peg_ratio != null ? Number(v.peg_ratio).toFixed(2) : 'N/A', 'peg', v.peg_ratio)
                +   metric('EV/EBITDA', v.ev_ebitda != null ? Number(v.ev_ebitda).toFixed(1) : 'N/A', 'ev', v.ev_ebitda)
                +   metric('부채비율', v.debt_equity != null ? Number(v.debt_equity).toFixed(1) + '%' : 'N/A', 'de', v.debt_equity)
                +   metric('FCF', fmtBig(v.free_cashflow), 'fcf', v.free_cashflow)
                +   metric('시가총액', fmtBig(v.market_cap), 'na', null)
                + '</div>'
                + '<div class="vs-note">가치투자·배당성장 전략은 이 점수 <b>50점 이상</b>에서만 진입이 허용됩니다.</div>'
                + '</div>';
        }

        if (s) {
            const unavailable = s.data_unavailable || !(s.article_count > 0);
            const sc = Number(s.score || 0);
            const tone = sc >= 0.3 ? 'up' : (sc <= -0.3 ? 'down' : 'flat');
            const heads = (s.top_headlines || []).slice(0, 2)
                .map(function (h) { return '<li>' + String(h).slice(0, 120) + '</li>'; }).join('');

            html += '<div class="vs-card">'
                + '<div class="vs-head"><span>' + ic('news') + '뉴스 센티먼트</span>'
                +   '<span class="vs-conf">' + (unavailable ? '데이터 없음'
                        : (s.confidence || 'medium') + ' · ' + s.article_count + '건') + '</span></div>'
                + (unavailable
                    ? '<div class="vs-empty">수집된 기사가 없습니다. '
                      + '점수 0.0을 <b>중립</b>으로 해석하지 마십시오.</div>'
                    : '<div class="vs-sent">'
                      + '<span class="vs-label ' + tone + '">' + (s.label || 'Neutral') + '</span>'
                      + '<span class="vs-score-num ' + tone + '">' + (sc > 0 ? '+' : '') + sc.toFixed(3) + '</span>'
                      + '</div>'
                      + (heads ? '<ul class="vs-heads">' + heads + '</ul>' : ''))
                + '<div class="vs-note">예측 보정은 <b>±2.0%p</b>로 제한됩니다 '
                +   '(RSS 키워드 기반이라 큰 보정을 정당화하기 어렵습니다).</div>'
                + '</div>';
        }

        return html + '</div>';
    }

    global.RiskUI = {
        renderRiskPlanCard: renderRiskPlanCard,
        renderValuationSentiment: renderValuationSentiment,
        buildFanBands: buildFanBands,
        fanLegend: fanLegend,
        renderPredictionBadge: renderPredictionBadge,
        _fmtPrice: fmtPrice,
        _isKrwStock: isKrwStock
    };
})(window);
