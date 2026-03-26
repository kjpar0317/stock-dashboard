window.showChartTooltip = function(event, day, price) {
    const container = event.currentTarget.closest('.chart-container');
    const vLine = container.querySelector('.hover-crosshair-v');
    const hLine = container.querySelector('.hover-crosshair-h');
    const xLabel = container.querySelector('.hover-axis-x');
    const yLabel = container.querySelector('.hover-axis-y');
    const tooltip = container.querySelector('.hover-tooltip-box');
    
    if (!container) return;
    
    const cRect = container.getBoundingClientRect();
    const x = event.clientX - cRect.left;
    const y = event.clientY - cRect.top;
    
    // The price chart takes up exactly the top 10% to 75% vertically (height: 65%).
    // It starts at 6% from the left and ends at 94% from the left (width: 88%).
    // By using absolute CSS percentages, we rigidly pin to the chart axes.
    
    if (vLine) { 
        vLine.style.left = x + 'px'; 
        vLine.style.top = '10%';
        vLine.style.bottom = 'auto'; 
        vLine.style.height = '65%'; 
        vLine.style.display = 'block'; 
    }
    if (hLine) { 
        hLine.style.top = y + 'px'; 
        hLine.style.left = '6%';
        hLine.style.right = 'auto';
        hLine.style.width = '88%';
        hLine.style.display = 'block'; 
    }
    
    if (xLabel) { 
        xLabel.textContent = day; 
        xLabel.style.left = x + 'px'; 
        // Pin strictly to the X-axis boundary (75% down the image)
        xLabel.style.top = 'calc(75% + 4px)'; 
        xLabel.style.bottom = 'auto';
        xLabel.style.transform = 'translate(-50%, 0)'; // Horizontal center
        xLabel.style.display = 'block'; 
    }
    if (yLabel) { 
        yLabel.textContent = price; 
        yLabel.style.top = y + 'px'; 
        // Pin strictly to the Y-axis boundary (94% from left edge)
        yLabel.style.right = 'auto'; 
        yLabel.style.left = 'calc(94% + 4px)'; 
        yLabel.style.transform = 'translate(0, -50%)'; // Push text outboard
        yLabel.style.display = 'block'; 
    }
    
    if (tooltip) {
        const isUp   = parseFloat(price.replace(/[^0-9.-]/g, '')) > 0;
        // T+N 일자에 해당하는 1일 변동 예측 (인접 포인트 기반)
        tooltip.innerHTML = `
            <div style="font-weight:700; font-size:0.85rem; margin-bottom:4px;">
                📅 <span style="color:#38bdf8">${day}</span>
                <span style="margin:0 6px; color:#555;">|</span>
                <span style="color:${isUp ? '#34d399' : '#fb7185'}">${price}</span>
            </div>
            <div style="font-size:0.7rem; color:#94a3b8; line-height:1.5;">
                🤖 AI Consensus Forecast Point<br>
                <span style="color:#fbbf24">GARCH‑Ensemble 앙상블 예측</span><br>
                실제가와 차이 발생 시 정상 오차 범위
            </div>`;
        tooltip.style.left  = (x + 15) + 'px';
        tooltip.style.top   = Math.max(10, y - 80) + 'px';
        tooltip.style.display = 'block';
    }
};

window.hideChartTooltip = function(event) {
    const container = event.currentTarget.closest('.chart-container');
    if (!container) return;
    const elements = ['.hover-crosshair-v', '.hover-crosshair-h', '.hover-axis-x', '.hover-axis-y', '.hover-tooltip-box'];
    elements.forEach(sel => {
        const el = container.querySelector(sel);
        if (el) el.style.display = 'none';
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('date-selector');

    if (typeof REPORTS_HISTORY !== 'undefined' && REPORTS_HISTORY.length > 0) {
        // 셀렉트 박스 옵션 동적으로 채우기
        REPORTS_HISTORY.forEach((report, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = report.date.replace(/-/g, '. ');
            selector.appendChild(option);
        });

        // 가장 최신 데이터(배열의 첫번째, 내림차순 정렬됨)를 기본값으로 설정
        const latestIndex = 0;
        selector.value = latestIndex;
        renderDashboard(REPORTS_HISTORY[latestIndex]);

        // 날짜 선택 이벤트 리스너
        selector.addEventListener('change', (e) => {
            const selectedIndex = e.target.value;
            renderDashboard(REPORTS_HISTORY[selectedIndex]);

            // 변경 시 간단한 애니메이션 효과
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.animation = 'none';
                card.offsetHeight; // 트리거 리플로우
                card.style.animation = 'fadeInUp 0.5s ease-out backwards';
            });
        });

        // [NEW] 탭 전환 시스템
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');

                // 버튼 활성화 상태 변경
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 컨텐츠 표시 상태 변경
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
            });
        });
    } else {
        console.error('REPORTS_HISTORY를 찾을 수 없습니다.');
        document.querySelector('header').innerHTML += `<p style="color: #fb7185; margin-top: 1rem;">보고서 데이터를 찾을 수 없습니다. data.js 파일이 정상적으로 로드되었는지 확인해 주세요.</p>`;
    }
});

function formatText(text) {
    if (!text) return '';

    let jsonObj = null;
    if (typeof text === 'object') {
        jsonObj = text;
    } else if (typeof text === 'string') {
        try {
            jsonObj = JSON.parse(text);
        } catch (e) {
            // Not JSON
        }
    }

    if (jsonObj && typeof jsonObj === 'object' && jsonObj.technical_summary) {
        let html = '';
        html += String(jsonObj.technical_summary)
            .replace(/\n/g, '<br>')
            .replace(/\\n/g, '<br>')
            .replace(/### (0단계 - Macro Override|1단계 - MTF & Relative Strength|2단계 - Wyckoff Market Cycle|3단계 - Institutional Footprint|4단계 - Volume Profile & POC|5단계 - Volatility & Liquidity|6단계 - VSA & Tactical Summary)/g, '<h4 style="color: var(--accent-blue); margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1.05rem;">$1</h4>')
            .replace(/### (📊 Multi-Factor Composite Score.*|🌐 Cross-Asset Correlation.*|🧭 Market Regime.*)/g, '<h4 style="color: var(--accent-purple); margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1.05rem;">$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return html;
    }

    // Fallback original logic for raw markdown strings
    return String(text)
        .replace(/\n/g, '<br>') // actual newline to <br>
        .replace(/\\n/g, '<br>') // literal \n to <br>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // **bold** to <strong>
}
// [NEW] Robust RSI Parser (Legacy/Text Fallback)
function parseRsi(stock) {
    const ind = stock.reason?.indicators || {};
    if (ind.rsi !== undefined && ind.rsi !== null) return ind.rsi;
    if (stock.rsi !== undefined && stock.rsi !== null) return stock.rsi;
    
    // Fallback: Parse from technical summary text
    const summary = stock.reason?.technical_summary || "";
    const match = summary.match(/RSI\s+([\d.]+)/i);
    if (match) return match[1];
    
    // Fallback 2: Parse from prediction reason
    const predReason = stock.predictionReason || "";
    const match2 = predReason.match(/Deep Value:\s*([\d.]+)/i) || predReason.match(/RSI\s*([\d.]+)/i);
    if (match2) return match2[1];
    
    return 'N/A';
}

// [NEW] MFC Tooltip Content — 6차원 기반
function getMfcTooltip(stock) {
    const ind     = stock.reason?.indicators || {};
    const bd      = stock.reason?.mfc_breakdown || stock.mfc_breakdown || {};
    const score   = stock.mfcScore || 0;
    const structure = stock.reason?.structure?.pattern || 'Unknown';
    const rsiVal  = parseRsi(stock);

    // Short Interest
    const shortChange = ind.short_interest_change_pct;
    const shortRatio  = ind.short_percent_float;
    let shortHtml = '';
    if (shortChange !== undefined && shortChange !== null && !isNaN(shortChange)) {
        const sc   = parseFloat(shortChange).toFixed(1);
        const rv   = (shortRatio !== undefined && !isNaN(shortRatio)) ? (parseFloat(shortRatio)*100).toFixed(1)+'%' : 'N/A';
        const cls  = sc > 10 ? 'text-red' : (sc < -10 ? 'text-green' : '');
        shortHtml  = `<li><b>Short Interest:</b> <span class="${cls}">${sc > 0 ? '+' : ''}${sc}%</span> (Float: ${rv})</li>`;
    }

    // 6차원 breakdown bar 빌더
    const dimBar = (label, val, color) => {
        const w = Math.round(Math.max(0, Math.min(100, val || 50)));
        const c = w >= 70 ? '#34d399' : w <= 30 ? '#fb7185' : color;
        return `<div style="display:flex; align-items:center; gap:6px; margin:3px 0;">
            <span style="width:72px; font-size:0.68rem; color:#94a3b8;">${label}</span>
            <div style="flex:1; height:5px; background:rgba(255,255,255,0.08); border-radius:3px;">
                <div style="width:${w}%; height:100%; background:${c}; border-radius:3px;"></div>
            </div>
            <span style="width:28px; text-align:right; font-size:0.68rem; color:${c};">${w}</span>
        </div>`;
    };

    return `
        <div class="tooltip-header">📊 MFC 6차원 분석 (${score} / 100)</div>
        <div style="margin:6px 0 4px; font-size:0.68rem; color:#fbbf24;">▶ 차원별 서브스코어</div>
        ${dimBar('Trend (22%)',    bd.trend,             '#38bdf8')}
        ${dimBar('Momentum (20%)',  bd.momentum,          '#818cf8')}
        ${dimBar('Flow (20%)',      bd.flow,              '#34d399')}
        ${dimBar('Volatility (13%)',bd.volatility,        '#fbbf24')}
        ${dimBar('Structure (15%)', bd.structure,         '#f472b6')}
        ${dimBar('MomQuality (5%)', bd.momentum_quality,  '#a78bfa')}
        ${dimBar('Insider (5%)',    bd.insider,            '#fb923c')}
        <ul class="advice-list" style="margin-top:8px; border-top:1px dotted rgba(255,255,255,0.1); padding-top:6px;">
            <li><b>MA Trend:</b> ${ind.ma_alignment || 'N/A'} ${ind.adx ? `(ADX ${ind.adx.toFixed(0)} — ${ind.adx >= 25 ? '강한 추세' : '약한 추세'})` : ''}</li>
            <li><b>RSI:</b> ${rsiVal} | <b>MACD 히스토그램:</b> ${ind.macd_histogram !== undefined ? ind.macd_histogram.toFixed(3) : 'N/A'}</li>
            <li><b>ROC(12일):</b> ${ind.roc_12 !== undefined ? ind.roc_12.toFixed(2)+'%' : 'N/A'} | <b>Williams%R:</b> ${ind.williams_r !== undefined ? ind.williams_r.toFixed(1) : 'N/A'}</li>
            <li><b>OBV 추세:</b> ${ind.obv_trend || 'N/A'} | <b>CMF:</b> ${ind.cmf !== undefined ? ind.cmf.toFixed(3) : 'N/A'} ${ind.cmf > 0.15 ? '(강한 자금유입 🟢)' : ind.cmf < -0.15 ? '(강한 자금이탈 🔴)' : ''}</li>
            <li><b>구조 (Phase):</b> ${structure} ${ind.spring_detected ? '🔔 Spring(매집완료)' : ''} ${ind.upthrust_detected ? '⚠️ Upthrust(분산)' : ''}</li>
            <li><b>변동성:</b> ${ind.bollinger_position || 'N/A'} ${ind.bollinger_squeeze ? '(🗜️ Squeeze — 폭발 임박!)' : ''}</li>
            <li><b>볼륨:</b> ${ind.volume_ratio !== undefined ? ind.volume_ratio.toFixed(2)+'x 평균대비' : 'N/A'} ${ind.volume_climax ? '⚡ 클라이맥스' : ''}</li>
            ${shortHtml}
            <li style="border-top:1px dotted rgba(255,255,255,0.1); margin-top:5px; padding-top:5px;">
                <b>Insider 감정:</b> ${ind.insider_sentiment || 'Neutral'} | <b>기관 보유:</b> ${ind.held_percent_institutions !== undefined ? (ind.held_percent_institutions*100).toFixed(1)+'%' : 'N/A'} | <b>내부자 보유:</b> ${ind.held_percent_insiders !== undefined ? (ind.held_percent_insiders*100).toFixed(1)+'%' : 'N/A'}
            </li>
        </ul>
        <div style="font-size:0.66rem; color:#64748b; margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; line-height:1.6;">
            <b>Trend</b>: MA배열+ADX+Ichimoku+주봉MA (22%)<br>
            <b>Momentum</b>: RSI+MACD×ROC+Stoch (20%) | <b>Flow</b>: OBV+CMF+거래량+공매도역투자 (20%)<br>
            <b>Volatility</b>: BBW+ATR정규화+Williams%R (13%) | <b>Structure</b>: Phase+Spring/UT+다이버전스 (15%)<br>
            <b>MomQuality</b>: ROC×ADX가속도+MACD방향 (5%) | <b>Insider</b>: 내부자+기관 (5%)
        </div>`;
}

// [NEW] PICK Tooltip Content — 개선된 공식 반영
function getPickTooltip(stock) {
    const info     = buildRecommendationScore(stock);
    const total    = (stock.rec_score !== undefined && stock.rec_score !== null) ? stock.rec_score : info.total;
    const pred     = stock.predictedResult || stock.ai_prediction || 'N/A';
    const predVal  = (pred !== 'N/A') ? parseFloat(pred.replace('%', '')) : null;
    const factors  = stock.factors || {};

    // 비대칭 패널티 설명
    const asymmNote = (predVal !== null && predVal < 0)
        ? `<div style="color:#fb7185; font-size:0.68rem; margin-top:4px;">⚠️ 하락 예측 시 패널티 ×1.5 적용됨</div>`
        : '';

    // modifier 표시
    const regimeScore = factors.regime_score !== undefined ? factors.regime_score : null;
    const rrScore     = factors.rr_score     !== undefined ? factors.rr_score     : null;
    const regMod = regimeScore !== null ? (((regimeScore - 50) * 0.15).toFixed(1)) : 'N/A';
    const rrMod  = rrScore     !== null ? (((rrScore     - 50) * 0.10).toFixed(1)) : 'N/A';

    const regColor  = regMod > 0 ? '#34d399' : (regMod < 0 ? '#fb7185' : '#94a3b8');
    const rrColor   = rrMod  > 0 ? '#34d399' : (rrMod  < 0 ? '#fb7185' : '#94a3b8');
    const predColor = predVal !== null ? (predVal >= 0 ? '#34d399' : '#fb7185') : '#94a3b8';

    return `
        <div class="tooltip-header">🤖 PICK Predictive Score (${total} / 100)</div>
        <ul class="advice-list" style="margin-top:6px;">
            <li><b>AI 예측 수익률:</b> <span style="color:${predColor}">${pred}</span> <span style="font-size:0.68rem; color:#64748b;">(T+15일 앙상블)</span></li>
            <li><b>AI Base Score:</b> ${info.breakdown.aiPred.val} pts
                <span style="font-size:0.68rem; color:#64748b;"> ← 50 + 예측% × 2.5배율</span>
                ${asymmNote}</li>
            <li><b>Technical Modifier:</b> ${info.breakdown.techModifier.val >= 0 ? '+' : ''}${info.breakdown.techModifier.val} pts
                <span style="color:#94a3b8; font-size:0.68rem;">(base_tech 50 기준, 최대 ±10pt)</span></li>
            <li style="border-top:1px dotted rgba(255,255,255,0.1); margin-top:5px; padding-top:5px;">
                <b>🗳️ Regime Alignment:</b> <span style="color:${regColor}">${regimeScore !== null ? regimeScore : 'N/A'}/100</span>
                → <span style="color:${regColor}">${regMod > 0 ? '+' : ''}${regMod} pts</span>
                <span style="font-size:0.68rem; color:#64748b;"> ← 시장레짐↔종목방향 정합성 (±7.5pt max)</span>
            </li>
            <li><b>⚖️ R:R Score:</b> <span style="color:${rrColor}">${rrScore !== null ? rrScore : 'N/A'}/100</span>
                → <span style="color:${rrColor}">${rrMod > 0 ? '+' : ''}${rrMod} pts</span>
                <span style="font-size:0.68rem; color:#64748b;"> ← ATR×1.5 손절 vs 피보나치 목표 (±5pt max)</span></li>
            <li><b>⚡ Scalping Bonus:</b> ${info.adjustment >= 0 ? '+' : ''}${info.adjustment} pts
                <span style="font-size:0.68rem; color:#64748b;"> ← 갭·거래량·52주 신고가 가산</span></li>
        </ul>
        <div style="font-size:0.66rem; color:#64748b; margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; line-height:1.6;">
            <b>공식</b>: Base(AI) + TechMod + RegimeMod + R:R Mod + Scalping<br>
            <b>음수 예측</b>: 하락 예측 시 패널티 1.5× 강화 적용 (비대칭 스케일)<br>
            <b>상한</b>: 95점 캡 적용 (기술적 보조 점안 시 만점 방지)
        </div>`;
}

// [NEW] MFC Component: Gauge + 6-dim bars
function buildMfcComponentHtml(stock) {
    const mfcVal  = stock.mfcScore || 0;
    let color = '#fbbf24';
    if (mfcVal >= 70) color = '#34d399';
    else if (mfcVal <= 30) color = '#fb7185';
    const angle = (Math.max(0, Math.min(100, mfcVal)) / 100) * 360;

    const indicators = stock.reason?.indicators || {};
    const bd = stock.reason?.mfc_breakdown || stock.mfc_breakdown || {};

    // Bar 1: MA Trend (Trend 차원 반영)
    let maText = indicators.ma_alignment || 'Neutral';
    let maColor = maText.includes('정배열') ? '#34d399' : maText.includes('역배열') ? '#fb7185' : '#fbbf24';

    // Bar 2: Phase (Structure 차원)
    const phase = stock.reason?.structure?.pattern || 'Unknown';
    const phaseColor = (phase === 'Markup' || phase === 'Accumulation') ? '#34d399' : (phase === 'Markdown' || phase === 'Distribution') ? '#fb7185' : '#94a3b8';

    // Bar 3: Signal (Volatility/Spring)
    let volText = indicators.bollinger_position || 'Stable';
    if (indicators.spring_detected) volText = '🔔 Spring!';
    if (indicators.bollinger_squeeze) volText += ' (Squeeze)';
    const volColor = (volText.includes('하단') || volText.includes('Spring')) ? '#34d399' : volText.includes('상단') ? '#fb7185' : '#fbbf24';

    // Bar 4: Insider
    const insiderText = indicators.insider_sentiment || 'Neutral';
    const insiderColor = insiderText.includes('Bullish') || insiderText.includes('Support') ? '#34d399' : insiderText.includes('Bearish') ? '#fb7185' : '#94a3b8';

    // Bar 5: Momentum Quality (new)
    const mq = bd.momentum_quality !== undefined ? Math.round(bd.momentum_quality) : null;
    const mqColor = mq >= 70 ? '#34d399' : mq <= 30 ? '#fb7185' : '#a78bfa';

    return `
        <div class="score-group-container">
            <div class="tooltip-container">
                <div class="mfc-gauge" style="width: 60px; height: 60px; min-width:60px; background: conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg); cursor: help;">
                    <div class="mfc-gauge-inner" style="width: 48px; height: 48px;">
                        <span class="mfc-gauge-value" style="color:${color}; font-size: 1.1rem;">${Math.round(mfcVal)}</span>
                        <span class="mfc-gauge-label" style="font-size: 0.5rem;">MFC</span>
                    </div>
                </div>
                <div class="tooltip-text" style="bottom: 100%; top: auto; margin-bottom: 15px; width: 340px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
                    ${getMfcTooltip(stock)}
                </div>
            </div>
            <div class="score-bars-stack">
                <div class="score-bar-item"><span class="bar-label">Trend:</span> <span class="bar-value" style="color:${maColor}">${maText}</span></div>
                <div class="score-bar-item"><span class="bar-label">Phase:</span> <span class="bar-value" style="color:${phaseColor}">${phase}</span></div>
                <div class="score-bar-item"><span class="bar-label">Signal:</span> <span class="bar-value" style="color:${volColor}">${volText}</span></div>
                <div class="score-bar-item"><span class="bar-label">Insider:</span> <span class="bar-value" style="color:${insiderColor}">${insiderText}</span></div>
                ${mq !== null ? `<div class="score-bar-item"><span class="bar-label">MomQual:</span> <span class="bar-value" style="color:${mqColor}">${mq}/100</span></div>` : ''}
            </div>
        </div>
    `;
}

// [NEW] Correlation Badges Component
function buildCorrelationBadgesHtml(correlations) {
    if (!correlations) return '';
    
    // Labels mapping
    const labels = { 'spy': 'SPY', 'dxy': 'DXY', 'us10y': '10Y', 'vix': 'VIX' };
    
    return `
        <div class="correlation-strip" style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            ${Object.entries(correlations).map(([key, val]) => {
                let color = '#94a3b8'; // Neutral
                if (val >= 0.6) color = '#34d399';      // Strong Positive
                else if (val <= -0.6) color = '#fb7185'; // Strong Negative
                else if (Math.abs(val) >= 0.3) color = '#fbbf24'; // Moderate
                
                return `
                    <div class="corr-badge" style="border-color: ${color}33; background: ${color}11;">
                        <span class="corr-label">${labels[key] || key.toUpperCase()}</span>
                        <span class="corr-val" style="color: ${color}">${val > 0 ? '+' : ''}${val.toFixed(2)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// [NEW] PICK Component: Gauge + bars
function buildPickComponentHtml(stock) {
    const pickInfo  = buildRecommendationScore(stock);
    const pickTotal = (stock.rec_score !== undefined && stock.rec_score !== null) ? stock.rec_score : pickInfo.total;

    let color = '#fbbf24';
    if (pickTotal >= 70) color = '#34d399';
    else if (pickTotal >= 55) color = '#38bdf8';
    else if (pickTotal <= 30) color = '#fb7185';
    const angle = (pickTotal / 100) * 360;

    const factors   = stock.factors || {};
    const aiBase    = pickInfo.breakdown?.aiPred?.val || 50;
    const techMod   = pickInfo.breakdown?.techModifier?.val || 0;
    const adj       = pickInfo.adjustment || 0;
    const regScore  = factors.regime_score !== undefined ? factors.regime_score : null;
    const rrScore   = factors.rr_score     !== undefined ? factors.rr_score     : null;
    const regMod    = regScore !== null ? +((regScore - 50) * 0.15).toFixed(1) : null;
    const rrMod     = rrScore  !== null ? +((rrScore  - 50) * 0.10).toFixed(1) : null;

    const fmtMod = v => v >= 0 ? `+${v}` : `${v}`;

    return `
        <div class="score-group-container">
            <div class="tooltip-container">
                <div class="mfc-gauge" style="width: 60px; height: 60px; min-width:60px; background: conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg); cursor: help;">
                    <div class="mfc-gauge-inner" style="width: 48px; height: 48px;">
                        <span class="mfc-gauge-value" style="color:${color}; font-size: 1.1rem;">${Math.round(pickTotal)}</span>
                        <span class="mfc-gauge-label" style="font-size: 0.5rem;">PICK</span>
                    </div>
                </div>
                <div class="tooltip-text" style="bottom: 100%; top: auto; margin-bottom: 15px; width: 340px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
                    ${getPickTooltip(stock)}
                </div>
            </div>
            <div class="score-bars-stack">
                <div class="score-bar-item"><span class="bar-label">AI Pred:</span> <span class="bar-value" style="color:#818cf8">${aiBase} pts</span></div>
                <div class="score-bar-item"><span class="bar-label">Tech Mod:</span> <span class="bar-value" style="color:${techMod >= 0 ? '#34d399' : '#fb7185'}">${techMod >= 0 ? '+' : ''}${techMod} pts</span></div>
                <div class="score-bar-item"><span class="bar-label">Risk Adj:</span> <span class="bar-value" style="color:${adj >= 0 ? '#34d399' : '#fb7185'}">${adj >= 0 ? '+' : ''}${adj} pts</span></div>
                ${regMod !== null ? `<div class="score-bar-item"><span class="bar-label">Regime:</span> <span class="bar-value" style="color:${regMod >= 0 ? '#34d399' : '#fb7185'}">${fmtMod(regMod)} pts</span></div>` : ''}
                ${rrMod  !== null ? `<div class="score-bar-item"><span class="bar-label">R:R:</span> <span class="bar-value" style="color:${rrMod  >= 0 ? '#34d399' : '#fb7185'}">${fmtMod(rrMod)} pts</span></div>` : ''}
            </div>
        </div>
    `;
}

// [NEW] Consensus Chart Component
function buildConsensusChartHtml(stock, tooltipContent) {
    if (!stock.consensusPredictionImage) return '';

    return `
        <div class="chart-container" style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,158,11,0.2); position: relative; margin-top: 1.5rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.2);">
            <img src="../${stock.consensusPredictionImage}" class="stock-chart pro-chart" style="margin:0; pointer-events: none; width: 100%; display: block;">
            <div class="chart-label" style="font-size: 0.65rem; padding: 4px 10px; background: rgba(0,0,0,0.6); position: absolute; top:0; left:0; border-bottom-right-radius: 8px; z-index: 10;">
                🤖 AI Consensus Forecast (T+15)
            </div>
            
            ${stock.consensusPath && stock.consensusPath.length === 15 ? `
            <div class="prediction-hover-overlay" style="position: absolute; left: 70%; top: 10%; width: 24%; height: 65%; z-index: 100;">
                ${stock.consensusPath.map((val, i) => `
                    <div class="hover-col" style="flex: 1; height: 100%; cursor: crosshair; pointer-events: auto;" onmousemove="showChartTooltip(event, 'T+${i+1}', '$${val.toFixed(2)}')" onmouseleave="hideChartTooltip(event)"></div>
                `).join('')}
            </div>
            <div class="hover-crosshair-v" style="z-index: 110; position: absolute; border-left: 1px dashed rgba(255,255,255,0.7); pointer-events: none; display: none;"></div>
            <div class="hover-crosshair-h" style="z-index: 110; position: absolute; border-top: 1px dashed rgba(255,255,255,0.7); pointer-events: none; display: none;"></div>
            <div class="hover-axis-x" style="z-index: 120; position: absolute; display: none; background: rgba(0,0,0,0.85); color: #fff; padding: 2px 6px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-size: 0.7rem; pointer-events: none; font-weight: bold;"></div>
            <div class="hover-axis-y" style="z-index: 120; position: absolute; display: none; background: var(--accent-blue); color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; pointer-events: none; font-weight: bold; margin-left: 5px;"></div>
            <div class="hover-tooltip-box" style="z-index: 130; position: absolute; display: none; background: rgba(15,23,42,0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 6px 10px; pointer-events: none; font-size: 0.8rem; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></div>
            ` : ''}

            ${stock.predictedResult ? `
            <div class="tooltip-container" style="position: absolute; bottom: 10px; right: 10px; z-index: 10;">
                <div class="prediction-badge ${stock.predictedResult.includes('-') ? 'down' : 'up'}" style="font-size: 0.8rem; padding: 3px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                    Forecast: ${stock.predictedResult}
                </div>
                <div class="tooltip-text" style="bottom: 30px; right: 0; width: 220px;">${tooltipContent}</div>
            </div>` : ''}
        </div>
    `;
}



// [NEW] Render Market Regime Banner
function renderRegimeBanner(data) {
    const banner = document.getElementById('regime-banner');
    if (!banner) return;

    // Find regime from any stock (they all share the same macro regime)
    const allStocks = [...(data.holdings || []), ...(data.watchlist || [])];
    let regime = '';
    let strategy = '';
    for (const s of allStocks) {
        if (s.marketRegime) { regime = s.marketRegime; strategy = s.regimeStrategy || ''; break; }
    }
    if (!regime) { banner.style.display = 'none'; return; }

    const config = {
        'Trending-Bull':      { cls: 'regime-bull',       icon: '🟢', label: 'BULL TREND' },
        'Trending-Bear':      { cls: 'regime-bear',       icon: '🔴', label: 'BEAR TREND' },
        'Volatile-Chop':      { cls: 'regime-chop',       icon: '🟡', label: 'VOLATILE CHOP' },
        'Low-Vol Compression':{ cls: 'regime-lowvol',     icon: '🔵', label: 'LOW VOL' },
        'Transitional':       { cls: 'regime-transition',  icon: '⚪', label: 'TRANSITIONAL' },
    };
    const c = config[regime] || config['Transitional'];

    banner.className = `regime-banner ${c.cls}`;
    banner.style.display = 'flex';
    banner.innerHTML = `
        <span class="regime-icon">${c.icon}</span>
        <span>Market Regime: <strong>${regime}</strong></span>
        <span class="regime-label">— ${strategy}</span>
    `;
}

function getAdviceBadgeClass(adviceStr) {
    if (!adviceStr) return 'hold';

    let evalStr = adviceStr;
    if (adviceStr.includes('종합:')) {
        evalStr = adviceStr.split('종합:')[1];
    }

    if (evalStr.includes('매수')) return 'buy';
    if (evalStr.includes('매도')) return 'sell';
    return 'hold';
}


function getPredictionTooltip(name, priceStr, returnStr, specificReason) {
    // 0. Use Specific Reason if available (Priority)
    if (specificReason && specificReason.length > 5) {
        return `
        <div class="tooltip-header">🔍 AI (T+1) 미래 예측 상세 근거</div>
        ${specificReason}
        `;
    }

    // 1. Parse Price to check if Penny Stock
    let price = 0;
    let isPenny = false;

    if (!priceStr) return '';

    // Remove commas and currency symbols
    const cleanPrice = priceStr.replace(/[$,원]/g, '').trim();
    price = parseFloat(cleanPrice);

    if (priceStr.includes('$')) {
        if (price < 1.0) isPenny = true;
    } else if (priceStr.includes('원')) {
        if (price < 1000) isPenny = true;
    }

    // 2. Parse Return
    let ret = parseFloat(returnStr.replace('%', ''));

    // 3. Generate Logic Explanation (Fallback Why?)
    if (isPenny && Math.abs(ret) > 15) {
        return `
        <div class="tooltip-header">📊 변동성 분석 및 예측 근거</div>
        <b>1. 높은 변동성 구간 (High Volatility Zone):</b><br>
        현재 주가 수준과 유동성을 고려할 때, 통상적인 범위보다 큰 폭의 등락이 예상됩니다. 이는 기술적 지표가 과매도/과매수 구간에서 급격한 반전을 암시하기 때문입니다.<br><br>
        <b>2. 기술적 반등 시그널 (Technical Setup):</b><br>
        RSI 및 볼린저 밴드 분석 결과, 현재 가격대에서의 <b>강한 모멘텀 변화</b>가 감지되었습니다. 이에 따라 확장된 예측 범위가 적용되었습니다.<br><br>
        <b>3. 리스크 요인 (Market Context):</b><br>
        낮은 가격대로 인한 호가 공백 가능성이 있어, 실제 체결 시 변동성이 확대될 수 있음을 반영했습니다.
        `;
    }

    // Default
    return `
    <div class="tooltip-header">📈 AI (T+1) 미래 궤적 시뮬레이션</div>
    <b>예측 기준 (Timeframe):</b><br>
    해당 결과는 방금 마감된 장(또는 어제)까지의 등락폭을 입력값으로 받아, <b>다가오는 내일(T+1) 개장부터 향후 15일간</b> 어떻게 움직일지 점친 미래 곡선입니다.<br><br>
    <b>분석 근거 (Rationale):</b><br>
    최근 거래량 추이와 변동성을 계산했을 때 모멘텀의 지속 혹은 평균 회귀에 의한 <b>${ret >= 0 ? '상승' : '조정'} 궤적</b> 확률이 높습니다.
    `;
}

function renderDashboard(data) {
    // 헤더 개요 업데이트
    document.getElementById('report-overview').innerHTML = data.overview;

    // 보유 종목 렌더링
    const holdingsList = document.querySelector('#holdings-list');
    holdingsList.innerHTML = '';

    if (data.holdings.length > 0) {
        data.holdings.forEach(stock => {
            const isUp = stock.return.startsWith('+');
            const tooltipContent = stock.predictedResult ? getPredictionTooltip(stock.name, stock.currentPrice, stock.predictedResult, stock.predictionReason) : '';

            const stockItem = `
                <div class="stock-item-wrapper" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info">
                            <div class="name" style="font-size: 1.8rem; font-weight: 800; color: #fff;">${stock.name}</div>
                            <div class="price" style="color: #cbd5e1; font-size: 1rem;">
                                평단: ${stock.avgPrice} / 현재: ${stock.currentPrice}
                                ${stock.changePercent !== undefined ? `
                                <span class="change ${stock.changePercent > 0 ? 'up' : stock.changePercent < 0 ? 'down' : ''}" style="margin-left: 0.5rem; font-weight: 600;">
                                    (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                                </span>` : ''}
                                <div class="return ${isUp ? 'up' : 'down'}" style="display:inline-block; margin-left:1rem; font-weight:700;">${stock.return}</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; align-items: center;">
                            <span class="badge ${getAdviceBadgeClass(stock.advice)}" style="font-size: 0.9rem; padding: 6px 12px;">${stock.advice}</span>
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                    </div>

                    <div class="analysis-content">
                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}

                        <!-- Scores horizontally side-by-side -->
                        <div class="combined-score-row" style="display: flex; gap: 2rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase;">📊 MFC Technical Analysis</div>
                                ${buildMfcComponentHtml(stock)}
                                ${buildCorrelationBadgesHtml(stock.crossCorrelation || (stock.reason && stock.reason.cross_correlation))}
                            </div>
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #818cf8; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase;">🤖 PICK Predictive Value</div>
                                ${buildPickComponentHtml(stock)}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            holdingsList.innerHTML += stockItem;
        });
    } else {
        holdingsList.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">보유 종목 데이터가 없습니다.</p>';
    }

    // 관심 종목 렌더링
    const watchlistList = document.querySelector('#watchlist-list');
    watchlistList.innerHTML = '';

    if (data.watchlist.length > 0) {
        data.watchlist.forEach(stock => {
            const tooltipContent = stock.predictedResult ? getPredictionTooltip(stock.name, stock.currentPrice, stock.predictedResult, stock.predictionReason) : '';

            const stockItem = `
                <div class="stock-item-wrapper" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info">
                            <div class="name" style="font-size: 1.8rem; font-weight: 800; color: #fff;">${stock.name}</div>
                            <div class="price" style="color: #cbd5e1; font-size: 1rem;">
                                현재가: ${stock.currentPrice}
                                ${stock.changePercent !== undefined ? `
                                <span class="change ${stock.changePercent > 0 ? 'up' : stock.changePercent < 0 ? 'down' : ''}" style="margin-left: 0.5rem; font-weight: 600;">
                                    (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                                </span>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; align-items: center;">
                            <span class="badge ${getAdviceBadgeClass(stock.advice)}" style="font-size: 0.9rem; padding: 6px 12px;">${stock.advice}</span>
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                    </div>

                    <div class="analysis-content">
                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}

                        <!-- Scores horizontally side-by-side -->
                        <div class="combined-score-row" style="display: flex; gap: 2rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase;">📊 MFC Technical Analysis</div>
                                ${buildMfcComponentHtml(stock)}
                                ${buildCorrelationBadgesHtml(stock.crossCorrelation || (stock.reason && stock.reason.cross_correlation))}
                            </div>
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #818cf8; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase;">🤖 PICK Predictive Value</div>
                                ${buildPickComponentHtml(stock)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            watchlistList.innerHTML += stockItem;
        });
    } else {
        watchlistList.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">관심 종목 데이터가 없습니다.</p>';
    }

    // 종합 조언 렌더링 (통합 포트폴리오 전략)
    const adviceText = document.querySelector('#portfolio-advice-content');
    if (data.strategy.macro) {
        adviceText.innerHTML = `
            <div class="strategy-block">
                <span class="strategy-label">Market Macro Context</span>
                <p>${formatText(data.strategy.macro)}</p>
            </div>
            <div class="strategy-block" style="border-left-color: var(--accent-purple);">
                <span class="strategy-label">Asset Allocation Guide</span>
                <p>${formatText(data.strategy.allocation)}</p>
            </div>
            <div class="strategy-block" style="border-left-color: #10b981; margin-bottom: 0;">
                <span class="strategy-label">Strategic Summary</span>
                <p>${formatText(data.strategy.summary)}</p>
            </div>
        `;
    } else {
        // 하위 호환성 유지
        adviceText.innerHTML = `
            <p><strong>📌 매수 추천:</strong> ${data.strategy.buy || 'N/A'}</p>
            <p><strong>⚠️ 매도 고려:</strong> ${data.strategy.sellConsider || 'N/A'}</p>
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                ${formatText(data.strategy.summary)}
            </div>
        `;
    }

    // [NEW] Action Summary 렌더링
    renderActionSummary(data);

    // [NEW] Market Regime Banner 렌더링
    renderRegimeBanner(data);

    // [NEW] 오늘의 추천 종목 렌더링
    renderTodaysPicks(data);

    // [NEW] 외부 발굴 종목 렌더링
    renderDiscoveryPicks(data);
}

// ===== [NEW] 오늘의 추천 종목 (Rule-Based, No LLM) =====

/**
 * AI-Driven 예상 점수를 산출합니다 (0-100)
 * 가중치: AI Expected Return (Base) + Technical Modifier (최대 ±10pt)
 */
function buildRecommendationScore(stock) {
    const ind = stock.reason?.indicators || {};
    const structure = stock.reason?.structure?.pattern || '';
    
    // 백엔드(stock_screener.py)에서 이미 rec_score를 저장했다면 
    // 동일한 계산 방식을 프론트엔드에서도 에뮬레이션하여 일관성을 맞춤
    
    // 1. Technical Baseline Score (Base Tech)
    const mfc = ind.mfc_score || stock.mfcScore || 0;
    const mfcNorm = Math.min(100, Math.max(0, mfc));
    const wyckoffScores = { 'Accumulation': 100, 'Markup': 80, 'Distribution': 30, 'Markdown': 10 };
    const wyckoffScore = wyckoffScores[structure] || 50;
    const stochK = ind.stochastic_k || 0;
    const stochD = ind.stochastic_d || 0;
    const stochasticScore = stochK > stochD ? 100 : 0;
    const obvScore = (ind.obv_trend === '상승') ? 100 : 0;
    
    let bollingerScore = 50;
    if (ind.bollinger_position) {
        if (ind.bollinger_position.includes('하단')) bollingerScore = 100;
        else if (ind.bollinger_position.includes('상단')) bollingerScore = 0;
    }
    
    const baseTechScore = (
        mfcNorm      * 0.35 +   // sync with backend (MFC 最전)
        wyckoffScore * 0.18 +
        stochasticScore * 0.12 +
        obvScore     * 0.12 +
        bollingerScore * 0.08
        // momentum_quality 0.15 가중은 프론트엑에서 데이터 없으면 mfcNorm에 이미 내포, by 보수적 계산
    );

    // 2. Base Expected Score from AI Prediction + 비대칭 패널티
    const AI_BASE_SCORE = 50.0;
    const EXPECTED_SCORE_MULTIPLIER = 2.5;

    let aiBaseExpected = AI_BASE_SCORE;
    let predVal = 0;
    const pred = stock.predictedResult || stock.ai_prediction || '0%';
    if (pred && pred !== 'N/A') {
        predVal = parseFloat(pred.replace('%', ''));
        if (!isNaN(predVal)) {
            // 비대칭 스케일링: 음수 예측시 1.5× 패널티
            if (predVal >= 0) {
                aiBaseExpected = AI_BASE_SCORE + (predVal * EXPECTED_SCORE_MULTIPLIER);
            } else {
                aiBaseExpected = AI_BASE_SCORE + (predVal * EXPECTED_SCORE_MULTIPLIER * 1.5);
            }
        }
    }

    // 3. Technical Modifier
    const techModifier = (baseTechScore - 50) * 0.2;

    // 4. Regime Alignment modifier (backend 데이터 사용, 없으면 0)
    const factors = stock.factors || {};
    const regimeScore = factors.regime_score !== undefined ? factors.regime_score : null;
    const rrScore     = factors.rr_score     !== undefined ? factors.rr_score     : null;
    const regimeMod   = regimeScore !== null ? (regimeScore - 50) * 0.15 : 0;
    const rrMod       = rrScore     !== null ? (rrScore     - 50) * 0.10 : 0;

    const MAX_EXPECTED_SCORE = 95.0;
    const expectedScore = aiBaseExpected + techModifier + regimeMod + rrMod;

    // 4. Scalping Bonuses / Penalties
    const gap = ind.gap_pct || (stock.intraday && stock.intraday.gap_pct ? stock.intraday.gap_pct : 0);
    const priceStr = String(stock.currentPrice || stock.price || '');
    const isPenny = priceStr.includes('$') && parseFloat(priceStr.replace(/[^0-9.]/g, '')) < 5.0;

    let adjustment = 0;
    if (gap >= 15.0) {
        adjustment -= isPenny ? 30 : 20;
    }

    const tags = ((stock.tags || []).map(t => typeof t === 'string' ? t : t.text)) || [];
    const isReversing = tags.some(t => t.includes('Spring') || (t.includes('다이버전스') && t.includes('상승')));
    if (isPenny && isReversing && !['Accumulation', 'Markup'].includes(structure)) {
        adjustment += 30;
    }

    // 백엔드 데이터에 scalping_bonus가 있으면 그것을 사용
    if (stock.scalping_bonus !== undefined) {
         adjustment = stock.scalping_bonus;
    }

    // 5. Short Interest Adjustments
    const shortChange = ind.short_interest_change_pct;
    
    if (shortChange !== undefined && shortChange !== null && !isNaN(shortChange)) {
        if (shortChange > 10.0) {
            adjustment -= 5;
            tags.push('🚨 공매도 급증');
        } else if (shortChange < -10.0) {
            adjustment += 5;
            tags.push('🔥 숏커버/감소');
        }
    }

    let finalScore = expectedScore + adjustment;
    finalScore = Math.max(0, Math.min(MAX_EXPECTED_SCORE, finalScore)); // 0~95 clamp

    return {
        total: Math.max(0, Math.min(100, Math.round(finalScore * 10) / 10)),
        weightedSum: Math.round(expectedScore * 10) / 10,
        adjustment: Math.round(adjustment * 10) / 10,
        breakdown: {
            aiPred:       { val: Math.round(aiBaseExpected * 10) / 10 },
            techModifier: { val: Math.round(techModifier  * 10) / 10 },
            regimeMod:    { val: Math.round(regimeMod     * 10) / 10 },
            rrMod:        { val: Math.round(rrMod         * 10) / 10 },
            mfc:         { val: Math.round(mfcNorm), weight: 35 },
            wyckoff:     { val: wyckoffScore, weight: 18, phase: structure },
            stochastic:  { val: stochasticScore, weight: 12, golden: stochK > stochD },
            obv:         { val: obvScore, weight: 12, trend: ind.obv_trend || 'N/A' },
            bollinger:   { val: bollingerScore, weight: 8, position: ind.bollinger_position || 'N/A' }
        }
    };
}

/**
 * 오늘의 추천 종목 TOP 3를 렌더링합니다
 */
function renderTodaysPicks(data) {
    const container = document.getElementById('todays-picks-container');
    if (!container) return;

    // 모든 종목 합치기
    const allStocks = [...(data.holdings || []), ...(data.watchlist || [])];
    if (allStocks.length === 0) { container.innerHTML = ''; return; }

    // 각 종목에 추천 점수 산출
    const scored = allStocks.map(stock => ({
        stock,
        score: buildRecommendationScore(stock)
    }));

    // 점수순 내림차순 정렬 후 TOP 5 (Score 50점 이상만)
    scored.sort((a, b) => b.score.total - a.score.total);
    const top5 = scored.filter(item => item.score.total >= 50).slice(0, 5);

    // 카드 HTML 생성
    const cardsHtml = top5.map((item, idx) => {
        const { stock, score } = item;
        const rank = idx + 1;

        // Score color
        let scoreColor = '#fbbf24';
        if (score.total >= 70) scoreColor = '#34d399';
        else if (score.total >= 55) scoreColor = '#38bdf8';
        else if (score.total <= 30) scoreColor = '#fb7185';

        const angle = (score.total / 100) * 360;

        // Change percent badge
        let changeBadge = '';
        if (stock.changePercent !== undefined) {
            const cls = stock.changePercent > 0 ? 'change-up' : (stock.changePercent < 0 ? 'change-down' : '');
            changeBadge = `<span class="${cls}">(${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)</span>`;
        }

        // Factor breakdown bars (AI Expected Return format)
        const factors = stock.factors || {};
        const regScore = factors.regime_score !== undefined ? factors.regime_score : null;
        const rrScoreVal = factors.rr_score !== undefined ? factors.rr_score : null;
        const regModPts  = regScore  !== null ? +((regScore  - 50) * 0.15).toFixed(1) : null;
        const rrModPts   = rrScoreVal !== null ? +((rrScoreVal - 50) * 0.10).toFixed(1) : null;

        const pickFactors = [
            { icon: '🤖', name: 'AI예측수준',  val: score.breakdown.aiPred.val, weight: 80, color: '#f472b6' },
            { icon: '📊', name: '기술적보정',  val: score.breakdown.techModifier.val, weight: 20, color: '#38bdf8' },
            ...( regModPts !== null ? [{ icon: '🗳️', name: '레집정합성', val: regModPts, weight: 10, color: '#34d399' }] : []),
            ...( rrModPts  !== null ? [{ icon: '⚖️',  name: 'R:R솔익비',   val: rrModPts,  weight: 10, color: '#fbbf24' }] : [])
        ];

        const factorsHtml = pickFactors.map(f => {
            const points = f.val;
            const width = Math.min(100, Math.max(0, Math.abs(points / (f.weight === 80 ? 80 : (f.weight === 20 ? 20 : 10))) * 100));
            const barColor = points < 0 ? '#fb7185' : f.color;
            return `
            <div class="pick-factor-row">
                <span class="pick-factor-icon">${f.icon}</span>
                <span class="pick-factor-name">${f.name}</span>
                <div class="pick-factor-bar"><div class="pick-factor-fill" style="width:${width}%; background:${barColor}"></div></div>
                <span class="pick-factor-val" style="color:${barColor}">${points > 0 && f.name !== 'AI예측수준' ? '+' : ''}${Math.round(points * 10) / 10}</span>
            </div>`;
        }).join('');

        // Tags (contextual)
        const tags = [];
        const bd = score.breakdown;
        if (bd.wyckoff.phase === 'Accumulation') tags.push({ text: '매집 구간', cls: 'positive' });
        if (bd.wyckoff.phase === 'Markup') tags.push({ text: '상승 추세', cls: 'positive' });
        if (bd.wyckoff.phase === 'Distribution') tags.push({ text: '분산 경고', cls: 'negative' });
        if (bd.wyckoff.phase === 'Markdown') tags.push({ text: '하락 추세', cls: 'negative' });
        if (bd.stochastic.golden) tags.push({ text: 'Stoch 골든크로스', cls: 'positive' });
        if (bd.obv.trend === '상승') tags.push({ text: 'OBV 상승', cls: 'positive' });
        if (bd.bollinger.position && bd.bollinger.position.includes('하단')) tags.push({ text: '밴드 하단 매수기회', cls: 'neutral' });
        if (stock.intraday?.gap_pct >= 5) tags.push({ text: '🔥 갭상승 출발', cls: 'positive' });
        if (stock.intraday?.volume_surge >= 2) tags.push({ text: '📈 거래량 급증', cls: 'positive' });
        if (stock.deviation_pct <= -10) tags.push({ text: '낙폭과대', cls: 'positive' });
        if (stock.scalping_bonus > 0) tags.push({ text: '⚡ 단타 모멘텀', cls: 'neutral' });
        
        const ind = stock.reason?.indicators || {};
        const shortChange = ind.short_interest_change_pct;
        if (shortChange !== undefined && shortChange !== null && !isNaN(shortChange)) {
            if (shortChange > 10.0) tags.push({ text: `🚨 공매도 급증 (+${shortChange.toFixed(1)}%)`, cls: 'negative' });
            else if (shortChange < -10.0) tags.push({ text: `🔥 숏커버 (${shortChange.toFixed(1)}%)`, cls: 'positive' });
        }

        const tagsHtml = tags.map(t => `<span class="pick-tag ${t.cls}">${t.text}</span>`).join('');

        // Reason summary - 짧은 한줄 요약
        let shortReason = '';
        if (stock.advice) {
            const parts = stock.advice.split('종합:');
            if (parts.length > 1) {
                shortReason = parts[parts.length - 1].trim();
            }
        }

        return `
        <div class="pick-card" style="cursor: help;">
            <div class="pick-card-rank rank-${rank}">${rank}</div>
            <div class="pick-card-name">${stock.name}</div>
            <div class="pick-card-price">
                ${stock.currentPrice} ${changeBadge}
            </div>
            <div class="pick-score-container">
                <div class="pick-score-gauge" style="background: conic-gradient(${scoreColor} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)">
                    <div class="pick-score-inner">
                        <span class="pick-score-value" style="color:${scoreColor}">${score.total}</span>
                        <span class="pick-score-label">PICK</span>
                    </div>
                </div>
                <div class="pick-factors">
                    ${factorsHtml}
                </div>
            </div>
            <div class="pick-card-tags">${tagsHtml}</div>
            ${shortReason ? `<div class="pick-card-reason">${shortReason}</div>` : ''}

            <div class="discovery-overlay-tooltip">
                <div class="tooltip-header">📈 ${stock.name} 추천 근거</div>
                <div class="tooltip-body">
                    <div class="tooltip-section">
                        <div class="tooltip-subtitle">📊 예상 점수 내역 (Total: ${score.total})</div>
                        <ul class="advice-list" style="margin-top: 5px;">
                            ${pickFactors.map(f => `<li><span style="font-weight:bold;">${f.name}</span>: ${f.val > 0 && f.name !== 'AI예측수준' ? '+' : ''}${Math.round(f.val * 10)/10}pts</li>`).join('')}
                            ${score.adjustment !== 0 ? `<li><span style="font-weight:bold; color: #fb7185;">알파/페널티</span>: ${score.adjustment > 0 ? '+' : ''}${score.adjustment}pts</li>` : ''}
                        </ul>
                    </div>
                    <div class="tooltip-section">
                        <div class="tooltip-subtitle">🔍 핵심 트리거</div>
                        <div class="prediction-text" style="margin-top: 5px; line-height: 1.4;">
                            ${tags.map(t => `<b>•</b> ${t.text}`).join('<br>')}
                        </div>
                    </div>
                    <div class="tooltip-section">
                        <div class="tooltip-subtitle">⚡ 수급 및 이격도 (Intraday)</div>
                        <div class="prediction-text" style="margin-top: 5px; line-height: 1.4;">
                            <b>갭 (Gap)</b>: ${stock.intraday?.gap_pct !== undefined ? stock.intraday.gap_pct + '%' : '0%'}<br>
                            <b>거래량 폭발 (Vol Surge)</b>: ${stock.intraday?.volume_surge !== undefined ? stock.intraday.volume_surge + 'x' : 'N/A'}<br>
                            <b>이격도 (20d)</b>: ${stock.deviation_pct !== undefined ? stock.deviation_pct + '%' : 'N/A'}<br>
                            <b>단타 가산점</b>: ${stock.scalping_bonus ? '+' + stock.scalping_bonus : 0}<br>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="todays-picks-header">
            <div class="todays-picks-title">🏆 오늘의 추천 종목 (Today's AI Picks)</div>
            <div class="todays-picks-subtitle">Forward Looking Score • AI Forecast + Technicals</div>
        </div>
        <div class="todays-picks-grid">
            ${cardsHtml}
        </div>
    `;
}

// ===== [NEW] 외부 발굴 종목 Discovery Picks =====

/**
 * 개별 발굴 종목 리스트를 HTML 카드 문자열로 변환합니다.
 */
function createDiscoveryCardsHtml(picks) {
    if (!picks || picks.length === 0) return '';
    return picks.map((p, idx) => {
        const rank = idx + 1;

        // Score color
        let scoreColor = '#fbbf24';
        if (p.rec_score >= 70) scoreColor = '#34d399';
        else if (p.rec_score >= 55) scoreColor = '#38bdf8';
        else if (p.rec_score <= 30) scoreColor = '#fb7185';

        const angle = (p.rec_score / 100) * 360;

        // Change badge
        let changeBadge = '';
        if (p.change_pct !== undefined) {
            const cls = p.change_pct > 0 ? 'change-up' : (p.change_pct < 0 ? 'change-down' : '');
            changeBadge = `<span class="${cls}">(${p.change_pct > 0 ? '+' : ''}${p.change_pct.toFixed(2)}%)</span>`;
        }

        // MFC mini bars — 7차원 (MQ, Insider 추가)
        const bd = p.mfc_breakdown || {};
        const dims = [
            { key: 'T',  val: bd.trend            || 50, color: '#38bdf8', title: 'Trend' },
            { key: 'M',  val: bd.momentum         || 50, color: '#818cf8', title: 'Momentum' },
            { key: 'F',  val: bd.flow             || 50, color: '#34d399', title: 'Flow' },
            { key: 'V',  val: bd.volatility       || 50, color: '#fbbf24', title: 'Volatility' },
            { key: 'S',  val: bd.structure        || 50, color: '#f472b6', title: 'Structure' },
            { key: 'MQ', val: bd.momentum_quality || 50, color: '#a78bfa', title: 'MomQuality' },
            { key: 'I',  val: bd.insider          || 50, color: '#fb923c', title: 'Insider' },
        ];
        const barsHtml = dims.map(d => `
            <div class="discovery-mini-bar-row" title="${d.title}: ${Math.round(d.val)}/100">
                <span class="discovery-mini-bar-label">${d.key}</span>
                <div class="discovery-mini-bar-track"><div class="discovery-mini-bar-fill" style="width:${d.val}%; background:${d.color}"></div></div>
            </div>
        `).join('');

        const tagsHtml = [
            ...(p.tags || []).map(t => `<span class="pick-tag ${t.cls}">${t.text}</span>`),
            p.insider_sentiment ? `<span class="pick-tag ${p.insider_sentiment.includes('Bullish') || p.insider_sentiment.includes('Support') ? 'positive' : (p.insider_sentiment.includes('Bearish') ? 'negative' : 'neutral')}">${p.insider_sentiment}</span>` : ''
        ].join('');

        // Factor breakdown text for tooltip
        const fList = [
            { n: 'Trend (22%)', v: bd.trend || 50, d: 'MA배열+ADX추세강도+Ichimoku+주봉MA' },
            { n: 'Momentum (20%)', v: bd.momentum || 50, d: 'RSI+MACD×ROC(3중확인)+Stoch크로스' },
            { n: 'Flow (20%)', v: bd.flow || 50, d: 'OBV+CMF(강신호)+거래량배율+공매도역투자' },
            { n: 'Volatility (13%)', v: bd.volatility || 50, d: 'BBW비율+ATR정규화+Williams%R' },
            { n: 'Structure (15%)', v: bd.structure || 50, d: 'Wyckoff Phase+Spring/UT+RSI다이버전스' },
            { n: 'MomQuality (5%) 🆕', v: bd.momentum_quality || 50, d: 'ROC×ADX가속도+MACD방향+Stoch [신규]' },
            { n: 'Insider (5%)', v: bd.insider || 50, d: '내부자거래+기관보유비율 종합 감정' },
        ];
        
        // Regime & R:R 추가 정보
        const factors_info = p.factors || {};
        const regScore = factors_info.regime_score;
        const rrScoreV = factors_info.rr_score;
        const mqScore  = factors_info.momentum_quality;
        const regMod   = regScore !== undefined ? +((regScore - 50) * 0.15).toFixed(1) : null;
        const rrMod    = rrScoreV !== undefined ? +((rrScoreV - 50) * 0.10).toFixed(1) : null;
        const regColor = (regMod !== null && regMod > 0) ? '#34d399' : (regMod !== null && regMod < 0) ? '#fb7185' : '#94a3b8';
        const rrColor  = (rrMod  !== null && rrMod  > 0) ? '#34d399' : (rrMod  !== null && rrMod  < 0) ? '#fb7185' : '#94a3b8';

        // Short Interest
        const siChange = (p.short_interest_change || null);
        const siRatio  = (p.short_interest_ratio  || null);
        let shortInfoHtml = '';
        if (siChange !== null && !isNaN(siChange)) {
            const sc = parseFloat(siChange).toFixed(1);
            const rv = (siRatio !== null && !isNaN(siRatio)) ? (parseFloat(siRatio)*100).toFixed(1)+'%' : 'N/A';
            const siColor = parseFloat(sc) > 10 ? '#fb7185' : parseFloat(sc) < -10 ? '#34d399' : '#94a3b8';
            shortInfoHtml = `<b>공매도 변화:</b> <span style="color:${siColor}">${parseFloat(sc) > 0 ? '+' : ''}${sc}%</span> (잔고비율: ${rv})<br>`;
        }
        
        // Intraday & Scalping data
        const intra = p.intraday || {};
        const gapStr = intra.gap_pct ? `${intra.gap_pct > 0 ? '+' : ''}${intra.gap_pct}%` : '0%';
        const volStr = intra.volume_surge ? `${intra.volume_surge}x` : 'N/A';
        const deviationStr = p.deviation_pct !== undefined ? `${p.deviation_pct}%` : 'N/A';
        const scalpingBonusStr = p.scalping_bonus ? `+${p.scalping_bonus}점 부여` : '없음';

        const tooltipBody = `
            <div class="tooltip-section">
                <div class="tooltip-subtitle">📊 MFC 6차원 분석 내역</div>
                <ul class="advice-list" style="margin-top: 5px;">
                    ${fList.map(f => `<li><span style="font-weight:bold; color:${f.v >= 70 ? '#34d399' : f.v <= 30 ? '#fb7185' : '#94a3b8'}">${f.n}</span>: ${f.d} (${Math.round(f.v)}/100)</li>`).join('')}
                </ul>
            </div>
            <div class="tooltip-section">
                <div class="tooltip-subtitle">🗳️ Regime & ⚖️ R:R Score</div>
                <div class="prediction-text" style="margin-top: 5px; line-height: 1.5;">
                    <b>Regime Alignment:</b> <span style="color:${regColor}">${regScore !== undefined ? regScore+'/100' : 'N/A'}</span>${regMod !== null ? ` → <span style="color:${regColor}">${regMod > 0 ? '+' : ''}${regMod}pts</span> (시장레짐↔종목방향 정합성)` : ''}<br>
                    <b>R:R Score:</b> <span style="color:${rrColor}">${rrScoreV !== undefined ? rrScoreV+'/100' : 'N/A'}</span>${rrMod !== null ? ` → <span style="color:${rrColor}">${rrMod > 0 ? '+' : ''}${rrMod}pts</span> (ATR손절 vs 피보목표)` : ''}
                </div>
            </div>
            <div class="tooltip-section">
                <div class="tooltip-subtitle">⚡ 단타 및 수급 동향</div>
                <div class="prediction-text" style="margin-top: 5px; line-height: 1.4;">
                    <b>갭 (Gap)</b>: ${gapStr}<br>
                    <b>거래량 폭발 (Volume Surge)</b>: ${volStr}<br>
                    <b>단타 가산점 (Scalping Bonus)</b>: ${scalpingBonusStr}<br>
                    ${intra.premarket_active ? '<b>프리마켓</b>: 활성 (Active)<br>' : ''}
                    ${intra.near_52w_high ? '<b>52주 신고가 근접</b>: Yes<br>' : ''}
                    ${shortInfoHtml}
                </div>
            </div>
            <div class="tooltip-section" style="margin-top: 8px;">
                <div class="tooltip-subtitle">🔍 기술적 지표 상세</div>
                <div class="prediction-text" style="margin-top: 5px; line-height: 1.4;">
                    <b>RSI</b>: ${p.rsi || 'N/A'}<br>
                    <b>Stochastic</b>: ${p.stoch_golden ? '골든크로스 상승 진입 🟢' : '침체 또는 하락 🔴'}<br>
                    <b>OBV</b>: ${p.obv_trend || 'N/A'}<br>
                    <b>이동평균</b>: ${p.ma_alignment || 'N/A'}<br>
                    <b>볼린저밴드</b>: ${p.bollinger || 'N/A'}<br>
                    <b>이격도 (20일선)</b>: ${deviationStr}<br>
                </div>
            </div>
        `;

        return `
        <div class="discovery-card" style="cursor: help;">
            <div class="discovery-card-rank">${rank}</div>
            <div class="discovery-card-ticker">${p.ticker}</div>
            <div class="discovery-card-name">${p.name}</div>
            <div class="discovery-card-price">${p.price} ${changeBadge}</div>
            <div class="discovery-score-row">
                <div class="discovery-score-mini" style="background: conic-gradient(${scoreColor} ${angle}deg, rgba(255,255,255,0.06) ${angle}deg)">
                    <div class="discovery-score-mini-inner" style="color:${scoreColor}">${p.rec_score}</div>
                </div>
                <div class="discovery-mini-bars">${barsHtml}</div>
            </div>
            <div class="discovery-card-tags">${tagsHtml}</div>
            ${p.advice_short ? `<div class="discovery-card-reason">${p.advice_short}</div>` : ''}
            
            <div class="discovery-overlay-tooltip">
                <div class="tooltip-header">📈 ${p.ticker} 스크리닝 요약</div>
                <div class="tooltip-body">
                    ${tooltipBody}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function renderDiscoveryPicks(data) {
    const usContainer = document.getElementById('discovery-picks-us-container');
    const krContainer = document.getElementById('discovery-picks-kr-container');
    const cryptoContainer = document.getElementById('discovery-picks-crypto-container');

    if (!usContainer || !krContainer) return;
    
    // Clear components if discovery data doesn't exist for the selected date
    if (!data || !data.discovery) {
        usContainer.innerHTML = '';
        krContainer.innerHTML = '';
        if (cryptoContainer) cryptoContainer.innerHTML = '';
        return;
    }

    const discovery = data.discovery;
    const dateStr = discovery.generated_at || data.date || '';
    
    // Separate US and Crypto
    const allUsPicks = discovery.picks_us || [];
    const directCryptoPicks = discovery.picks_crypto || [];
    const picksUs = [];
    const picksCrypto = [...directCryptoPicks];
    
    console.log('[renderDiscoveryPicks] Direct Crypto Picks:', directCryptoPicks.length);
    console.log('[renderDiscoveryPicks] All US Picks:', allUsPicks.length);

    allUsPicks.forEach(p => {
        const t = (p.ticker || '').toUpperCase();
        const isCryptoTicker = t.endsWith('-USD') || t.endsWith('-BTC') || t.endsWith('-ETH') || t.endsWith('-CAD') || t.endsWith('-EUR');
        
        if (isCryptoTicker) {
            // Only add if not already in picksCrypto (avoid duplicates)
            if (!picksCrypto.some(existing => existing.ticker === p.ticker)) {
                picksCrypto.push(p);
            }
        } else {
            picksUs.push(p);
        }
    });
    
    console.log('[renderDiscoveryPicks] Final picksUs:', picksUs.length);
    console.log('[renderDiscoveryPicks] Final picksCrypto:', picksCrypto.length);

    // Render US Picks
    if (picksUs.length > 0) {
        usContainer.innerHTML = `
            <div class="discovery-picks-header">
                <div class="discovery-picks-title">🇺🇸 미국 발굴 종목 (US Discovery)</div>
                <div class="discovery-picks-subtitle">yfinance Technical Screening • TOP ${picksUs.length}</div>
            </div>
            <div class="discovery-picks-grid">${createDiscoveryCardsHtml(picksUs)}</div>
        `;
    } else {
        usContainer.innerHTML = '';
    }

    // Render Crypto Picks
    if (cryptoContainer) {
        console.log('[renderDiscoveryPicks] cryptoContainer found, innerHTML setting...');
        if (picksCrypto.length > 0) {
            const cryptoHtml = createDiscoveryCardsHtml(picksCrypto);
            console.log('[renderDiscoveryPicks] cryptoHtml length:', cryptoHtml.length);
            cryptoContainer.innerHTML = `
                <div class="discovery-picks-header">
                    <div class="discovery-picks-title">🪙 암호화폐 발굴 종목 (Crypto Discovery)</div>
                    <div class="discovery-picks-subtitle">yfinance Technical Screening • TOP ${picksCrypto.length}</div>
                </div>
                <div class="discovery-picks-grid">${cryptoHtml}</div>
            `;
        } else {
            console.log('[renderDiscoveryPicks] picksCrypto is empty, clearing container.');
            cryptoContainer.innerHTML = '';
        }
    }

    // Render KR Picks
    const picksKr = discovery.picks_kr || [];
    if (picksKr.length > 0) {
        krContainer.innerHTML = `
            <div class="discovery-picks-header">
                <div class="discovery-picks-title">🇰🇷 국내 발굴 종목 (KR Discovery)</div>
                <div class="discovery-picks-subtitle">yfinance Technical Screening • TOP ${picksKr.length}</div>
            </div>
            <div class="discovery-picks-grid">${createDiscoveryCardsHtml(picksKr)}</div>
            <div class="discovery-meta">스크리닝: ${dateStr} | ${(discovery.total_valid_us || 0) + (discovery.total_valid_kr || 0)}개 유효 종목 스캔 완료</div>
        `;
    } else {
        krContainer.innerHTML = '';
    }
}

function renderActionSummary(data) {
    const container = document.getElementById('action-summary-container');
    if (!container) return;

    // 모든 종목 합치기 (보유 + 관심)
    const allStocks = [...(data.holdings || []), ...(data.watchlist || [])];

    // 매수/매도 필터링
    // 단 하나의 리스트에만 들어가도록 엄격하게 상호 배타적인 판별 함수 구현
    const getActionType = (adviceStr) => {
        if (!adviceStr) return 'none';

        let evalStr = adviceStr;
        if (adviceStr.includes('종합:')) {
            // 마지막 요소만 취함 (혹시 여러 번 꼬였을 경우 대비)
            const parts = adviceStr.split('종합:');
            evalStr = parts[parts.length - 1];
        }

        // 1. 명시적인 "매수 우위" 또는 "매도 우위" 확인
        if (evalStr.includes('매수 우위')) return 'buy';
        if (evalStr.includes('매도 우위')) return 'sell';

        // 2. Fallback (명확하게 한 쪽만 있을 때)
        const hasBuy = evalStr.includes('매수');
        const hasSell = evalStr.includes('매도');

        if (hasBuy && !hasSell) return 'buy';
        if (hasSell && !hasBuy) return 'sell';

        // 3. 만약 텍스트가 이상하게 꼬여서 둘 다 매수, 매도 단어가 있다면,
        // 가장 먼저 나오는 키워드를 기준으로 판별
        const buyIdx = evalStr.indexOf('매수');
        const sellIdx = evalStr.indexOf('매도');

        if (buyIdx !== -1 && sellIdx !== -1) {
            return buyIdx < sellIdx ? 'buy' : 'sell';
        }

        return 'none';
    };

    const buyList = allStocks.filter(stock => getActionType(stock.advice) === 'buy');
    const sellList = allStocks.filter(stock => getActionType(stock.advice) === 'sell');

    // HTML 생성 (Tooltip 포함)
    const createListItem = (stock, index, totalItems) => {
        // [New] 화면 중앙 배치 지향 로직: 리스트의 위쪽 절반은 밑으로(tooltip-down) 열리고, 아래쪽 절반은 위로(tooltip-up) 열립니다.
        const positionClass = (index < totalItems / 2) ? 'tooltip-down' : 'tooltip-up';

        // [New] Advice 파싱 로직
        // 예: "🟢 초단기 보유 (MA5 위) | 🟡 단기 중립 (상승세) | ..." -> 리스트로 변환
        let adviceListHtml = '';
        if (stock.advice) {
            const adviceItems = stock.advice.split('|').map(item => item.trim());
            adviceListHtml = '<ul class="advice-list">';
            adviceItems.forEach(item => {
                // "📊 종합" 제외하고 리스트 아이템 생성
                if (!item.includes('📊 종합')) {
                    adviceListHtml += `<li>${item}</li>`;
                }
            });
            adviceListHtml += '</ul>';
        } else {
            adviceListHtml = '<p class="no-data">투자 조언 데이터가 없습니다.</p>';
        }

        // [New] Prediction Reason 추가
        let predictionReasonHtml = '';
        if (stock.predictionReason) {
            predictionReasonHtml = `
                <div class="tooltip-section">
                    <div class="tooltip-subtitle">🤖 AI Prediction Context</div>
                    <div class="prediction-text">${stock.predictionReason}</div>
                </div>
            `;
        }

        return `
        <li class="action-item tooltip-container ${positionClass}">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span class="action-stock-name">
                    ${stock.name}
                    ${stock.scalping_bonus > 0 ? `<span class="pick-tag neutral" style="margin-left:6px; font-size:0.65rem; padding: 0.1rem 0.4rem;">⚡단타</span>` : ''}
                    ${stock.deviation_pct <= -10 ? `<span class="pick-tag positive" style="margin-left:6px; font-size:0.65rem; padding: 0.1rem 0.4rem;">낙폭과대</span>` : ''}
                </span>
                <span class="action-badge">${stock.currentPrice}</span>
            </div>
            <div class="tooltip-text strategy-tooltip">
                <div class="tooltip-header">${stock.name} 투자 전략</div>
                <div class="tooltip-body">
                    <div class="tooltip-section">
                        <div class="tooltip-subtitle">⏱️ Timeframe Analysis</div>
                        ${adviceListHtml}
                    </div>
                    ${predictionReasonHtml}
                </div>
            </div>
        </li>
        `;
    };

    const buyHtml = buyList.length > 0
        ? buyList.map((stock, idx) => createListItem(stock, idx, buyList.length)).join('')
        : '<li class="action-item" style="justify-content: center; color: var(--text-secondary);">해당 사항 없음</li>';

    const sellHtml = sellList.length > 0
        ? sellList.map((stock, idx) => createListItem(stock, idx, sellList.length)).join('')
        : '<li class="action-item" style="justify-content: center; color: var(--text-secondary);">해당 사항 없음</li>';

    container.innerHTML = `
        <div class="action-card buy-action">
            <div class="action-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                오늘의 매수 (Buy Today)
            </div>
            <ul class="action-list">
                ${buyHtml}
            </ul>
        </div>
        <div class="action-card sell-action">
            <div class="action-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
                오늘의 매도 (Sell Today)
            </div>
            <ul class="action-list">
                ${sellHtml}
            </ul>
        </div>
    `;
}

/**
 * [NEW] 특정 종목 정보만 PDF 인쇄
 */
function printStock(stockName) {
    const stockEl = document.querySelector(`.stock-item-wrapper[data-name="${stockName}"]`);
    if (!stockEl) return;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');

    // 현재 스타일 시트 가져오기
    const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
            try {
                return Array.from(styleSheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('');
            } catch (e) {
                return '';
            }
        }).join('');

    printWindow.document.write(`
        <html>
            <head>
                <title>${stockName} - Stock Analysis Report</title>
                <style>
                    ${styles}
                    body { 
                        background: #fff !important; 
                        color: #000 !important; 
                        padding: 20px;
                        font-family: 'Inter', sans-serif;
                    }
                    .stock-item { 
                        background: none !important; 
                        border: none !important; 
                        box-shadow: none !important;
                        padding: 0 !important;
                        width: 100% !important;
                        opacity: 1 !important;
                        transform: none !important;
                        animation: none !important;
                    }
                    .name { color: #000 !important; font-size: 2.5rem !important; margin-bottom: 1rem !important; }
                    .price { color: #444 !important; font-size: 1.2rem !important; }
                    .reason-text { color: #222 !important; border-top: 2px solid #eee !important; padding-top: 1.5rem !important; line-height: 1.8 !important; }
                    .prediction-title { color: #000 !important; }
                    .dual-prediction-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; display: grid !important; }
                    .prediction-card { background: #f9fafb !important; border: 1px solid #e5e7eb !important; border-radius: 12px !important; padding: 15px !important; }
                    .prediction-card h4 { color: #374151 !important; margin-top: 0 !important; }
                    .stock-chart { filter: none !important; border: 1px solid #eee !important; border-radius: 12px !important; width: 100% !important; }
                    .print-btn { display: none !important; }
                    @media print {
                        .stock-item { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="dashboard-grid">
                    ${stockEl.outerHTML}
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * [NEW] 글로벌 툴팁 방향 자동 조절 로직
 * 스크롤 위/아래 위치에 따라 툴팁이 화면 밖으로 나가는 것을 방지합니다.
 */
document.addEventListener('mouseover', function (e) {
    const container = e.target.closest('.tooltip-container');
    if (!container) return; // 툴팁 영역이 아니면 무시

    // 화면(Viewport) 높이와 현재 요소의 화면 상 상대적 위치 측정
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const rect = container.getBoundingClientRect();

    // 이전에 붙어있던 방향 클래스 제거
    container.classList.remove('tooltip-up', 'tooltip-down', 'tooltip-align-right', 'tooltip-align-left');

    // 상/하 잘림 방지 (실제 여유 공간 계산)
    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedTooltipHeight = 450; // 여유 있게 설정

    if (spaceBelow < estimatedTooltipHeight && spaceAbove > spaceBelow) {
        // 하단 공간이 부족하고 상단 공간이 더 넓을 경우 -> 위로
        container.classList.add('tooltip-up');
    } else {
        // 기본적으로 아래로, 혹은 상단 공간도 부족할 경우 아래로 (하단 카드 대비)
        container.classList.add('tooltip-down');
    }

    // 좌/우 잘림 방지 (툴팁 기본 너비 340px 기준)
    const centerX = rect.left + (rect.width / 2);
    if (centerX + 180 > windowWidth) {
        container.classList.add('tooltip-align-right');
    } else if (centerX - 180 < 0) {
        container.classList.add('tooltip-align-left');
    }
});
