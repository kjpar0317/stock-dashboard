window.showChartHistoryTooltip = function(event, day, price, o, h, l, v, change) {
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
    
    if (vLine) { vLine.style.left = x + 'px'; vLine.style.display = 'block'; vLine.style.height = '65%'; vLine.style.top = '10%'; }
    if (hLine) { hLine.style.top = y + 'px'; hLine.style.display = 'block'; hLine.style.width = '88%'; hLine.style.left = '6%'; }
    
    if (xLabel) { 
        xLabel.textContent = day; 
        xLabel.style.left = x + 'px'; 
        xLabel.style.top = '75%'; 
        xLabel.style.display = 'block'; 
    }
    
    const pctNum = parseFloat(change) || 0;
    const pctColor = pctNum >= 0 ? '#34d399' : '#fb7185';

    if (tooltip) {
        tooltip.innerHTML = `
            <div style="font-weight:700; font-size:0.85rem; margin-bottom:4px; white-space:nowrap;">
                📅 <span style="color:#e2e8f0">${day}</span>
                <span style="margin:0 6px; color:#555;">|</span>
                <span style="color:#fff">${price}</span>
                <span style="margin-left:8px; color:${pctColor}; font-weight:800;">${pctNum >= 0 ? '+' : ''}${change}%</span>
            </div>
            <div style="font-size:0.7rem; color:#94a3b8; line-height:1.5; margin-bottom:2px; font-family: monospace;">
                <span style="color:#64748b">O:</span> ${o} | <span style="color:#64748b">H:</span> <span style="color:#fb7185">${h}</span> | <span style="color:#64748b">L:</span> <span style="color:#34d399">${l}</span>
            </div>
            <div style="font-size:0.7rem; color:#94a3b8; font-family: monospace;">
                <span style="color:#64748b">Vol:</span> ${v}
            </div>`;
        tooltip.style.left  = (x + 15) + 'px';
        tooltip.style.top   = Math.max(10, y - 80) + 'px';
        tooltip.style.display = 'block';
    }
};

window.showChartTooltip = function(event, day, price, pctChange, o, h, l, v) {
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
        xLabel.style.top = 'calc(75% + 4px)'; 
        xLabel.style.bottom = 'auto';
        xLabel.style.transform = 'translate(-50%, 0)';
        xLabel.style.display = 'block'; 
    }
    if (yLabel) { 
        const pctText = pctChange || '';
        yLabel.textContent = pctText; 
        yLabel.style.top = y + 'px'; 
        yLabel.style.right = 'auto'; 
        yLabel.style.left = 'calc(94% + 4px)'; 
        yLabel.style.transform = 'translate(0, -50%)';
        const pctNum = pctText ? parseFloat(pctText.replace(/[^0-9.+-]/g, '')) : 0;
        yLabel.style.background = pctNum >= 0 ? '#34d399' : '#fb7185';
        yLabel.style.display = pctText ? 'block' : 'none'; 
    }
    
    const pctNum = pctChange ? parseFloat(pctChange.replace(/[^0-9.+-]/g, '')) : 0;
    const pctColor = pctNum >= 0 ? '#34d399' : '#fb7185';
    
    if (tooltip) {
        let extraInfo = '';
        if (o && h && l) {
            extraInfo = `
            <div style="font-size:0.7rem; color:#94a3b8; line-height:1.5; margin-bottom:2px; font-family: monospace;">
                <span style="color:#64748b">O:</span> ${o} | <span style="color:#64748b">H:</span> <span style="color:#fb7185">${h}</span> | <span style="color:#64748b">L:</span> <span style="color:#34d399">${l}</span>
            </div>
            <div style="font-size:0.7rem; color:#94a3b8; font-family: monospace; margin-bottom: 4px;">
                <span style="color:#64748b">Vol:</span> ${v || 'N/A'}
            </div>`;
        }

        tooltip.innerHTML = `
            <div style="font-weight:700; font-size:0.85rem; margin-bottom:4px; white-space:nowrap;">
                📅 <span style="color:#38bdf8">${day}</span>
                <span style="margin:0 6px; color:#555;">|</span>
                <span style="color:#e2e8f0">${price}</span>
                ${pctChange ? `<span style="margin-left:8px; color:${pctColor}; font-weight:800;">${pctChange}</span>` : ''}
            </div>
            ${extraInfo}
            <div style="font-size:0.7rem; color:#94a3b8; line-height:1.5; border-top: 1px dotted rgba(255,255,255,0.1); padding-top: 4px;">
                🤖 AI Consensus Forecast Point<br>
                <span style="color:#fbbf24">GARCH‑Ensemble 앙상블 예측</span>
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
        const tabBtns = document.querySelectorAll('.segment-btn');
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
        // [NEW] 전역 네비게이션 탭 (HOME vs DASHBOARD) 시스템
        const globalTabs = document.querySelectorAll('.global-tab');
        const pageViews = document.querySelectorAll('.page-view');

        globalTabs.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');

                // 네비바 클래스 변경
                globalTabs.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // 페이지 뷰 토글
                pageViews.forEach(view => {
                    view.classList.remove('active');
                    if (view.id === targetId) {
                        view.classList.add('active');
                    }
                });
                
                const isDashboard = targetId === 'view-dashboard';
                const headerSearch = document.querySelector('.header-search-wrapper');
                const headerRegime = document.getElementById('header-regime-indicator');
                
                if (headerRegime) {
                    headerRegime.style.display = isDashboard ? 'none' : 'flex';
                }
                if (headerSearch) {
                    headerSearch.style.display = isDashboard ? 'block' : 'none';
                    // 애니메이션이나 부드러운 전환 효과를 위해
                }
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // [New] Set initial header search visibility based on active tab
        const initialTab = document.querySelector('.global-tab.active');
        if (initialTab) {
            const isDashboard = initialTab.getAttribute('data-target') === 'view-dashboard';
            const headerSearch = document.querySelector('.header-search-wrapper');
            if (headerSearch) {
                headerSearch.style.display = isDashboard ? 'flex' : 'none';
            }
        }

    } else {
        console.error('REPORTS_HISTORY를 찾을 수 없습니다.');
        document.querySelector('header').innerHTML += `<p style="color: #fb7185; margin-top: 1rem;">보고서 데이터를 찾을 수 없습니다. data.js 파일이 정상적으로 로드되었는지 확인해 주세요.</p>`;
    }

    // [NEW] Refresh Button Logic
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const icon = refreshBtn.querySelector('.refresh-icon');
            if (icon) icon.classList.add('spinning');
            
            // Reload page to fetch new `data.js` and clear cache
            setTimeout(() => {
                window.location.reload(true);
            }, 400);
        });
    }

    // [NEW] Glossary Toggle Logic
    const glossaryBtn = document.getElementById('glossary-btn');
    const glossaryTooltip = document.getElementById('glossary-tooltip');
    const glossaryOverlay = document.getElementById('glossary-overlay');
    const glossaryCloseBtn = document.getElementById('glossary-close-btn');
    const glossarySearchInput = document.getElementById('glossary-search-input');
    const glossaryItems = document.querySelectorAll('.glossary-item');
    const glossaryCategories = document.querySelectorAll('.glossary-category');
    const glossaryNoResults = document.getElementById('glossary-no-results');

    function closeGlossary() {
        if(glossaryTooltip) glossaryTooltip.classList.remove('show');
        if(glossaryOverlay) glossaryOverlay.classList.remove('show');
        document.body.style.overflow = ''; // Unlock scroll
        if(glossarySearchInput) glossarySearchInput.value = ''; // Reset search on close
        filterGlossary(''); // Reset filter
    }

    if (glossaryBtn) {
        glossaryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShowing = glossaryTooltip.classList.contains('show');
            if (isShowing) {
                closeGlossary();
            } else {
                glossaryTooltip.classList.add('show');
                if (window.innerWidth <= 768) {
                    if(glossaryOverlay) glossaryOverlay.classList.add('show');
                    document.body.style.overflow = 'hidden'; // Lock scroll on mobile
                }
                // Focus search input after small delay for animation
                setTimeout(() => {
                    if(glossarySearchInput) glossarySearchInput.focus();
                }, 400);
            }
        });
    }

    if (glossaryOverlay) glossaryOverlay.addEventListener('click', closeGlossary);
    if (glossaryCloseBtn) glossaryCloseBtn.addEventListener('click', closeGlossary);

    // [NEW] Search Logic
    if (glossarySearchInput) {
        glossarySearchInput.addEventListener('input', (e) => {
            filterGlossary(e.target.value.trim().toLowerCase());
        });
    }

    function filterGlossary(query) {
        let visibleCount = 0;

        glossaryItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const isMatch = text.includes(query);
            
            if (isMatch) {
                item.style.display = 'block';
                visibleCount++;
                
                // [PREMIUM] Highlighting logic
                if (query.length > 0) {
                    const originalText = item.getAttribute('data-original-html') || item.innerHTML;
                    if (!item.getAttribute('data-original-html')) {
                        item.setAttribute('data-original-html', originalText);
                    }
                    
                    const regex = new RegExp(`(${query})`, 'gi');
                    item.innerHTML = originalText.replace(regex, '<span class="highlight">$1</span>');
                } else {
                    const originalText = item.getAttribute('data-original-html');
                    if (originalText) item.innerHTML = originalText;
                }
            } else {
                item.style.display = 'none';
            }
        });

        // Toggle category headers based on visible children
        glossaryCategories.forEach(cat => {
            let next = cat.nextElementSibling;
            let hasVisibleItem = false;
            while (next && !next.classList.contains('glossary-category')) {
                if (next.classList.contains('glossary-item') && next.style.display !== 'none') {
                    hasVisibleItem = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            cat.style.display = hasVisibleItem ? 'block' : 'none';
        });

        if (glossaryNoResults) {
            glossaryNoResults.style.display = visibleCount === 0 && query.length > 0 ? 'block' : 'none';
        }
    }

    // Close when clicking outside on desktop
    document.addEventListener('click', (e) => {
        if (glossaryTooltip && glossaryTooltip.classList.contains('show')) {
            if (!glossaryTooltip.contains(e.target) && (!glossaryBtn || !glossaryBtn.contains(e.target))) {
                closeGlossary();
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            if(glossaryOverlay) glossaryOverlay.classList.remove('show');
            document.body.style.overflow = '';
        } else {
            if(glossaryTooltip && glossaryTooltip.classList.contains('show')) {
                if(glossaryOverlay) glossaryOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }
    });
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
    
    // Total Ratio: show N/A if null or exactly 0.0 (usually means no data)
    const rv = (shortRatio === null || shortRatio === undefined || shortRatio === 0) 
               ? 'N/A' 
               : (shortRatio * 100).toFixed(1) + '%';
               
    // Change: show N/A only if null/undefined. Confirm 0.0% if calculated.
    const sc = (shortChange === null || shortChange === undefined) 
               ? 'N/A' 
               : (shortChange > 0 ? '+' : '') + shortChange.toFixed(1) + '%';

    const cls = (sc !== 'N/A') ? (parseFloat(sc) > 10 ? 'text-red' : (parseFloat(sc) < -10 ? 'text-green' : '')) : '';
    const shortHtml = `<li title="전체 유동주식 대비 공매도 잔고 비중(Total)과 최근 보고 시점 대비 변동률(Chg)을 나타냅니다."><b>Short Interest:</b> ${rv} (Chg: <span class="${cls}">${sc}</span>)</li>`;

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

// ═══════════════════════════════════════════════════════════════════
//  [v5 NEW] Conviction Badge + PnL Badge + Rating Alert + Position Gauge
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a top-level status bar with Conviction, PnL, Position Size
 */
function buildStatusBarHtml(stock) {
    const conviction = stock.convictionLevel || stock.reason?.conviction_level || '';
    const pnl = stock.holdingPnlPct ?? stock.reason?.holding_pnl_pct ?? null;
    const adjustedReason = stock.adjustedRatingReason || stock.reason?.adjusted_rating_reason || '';
    const positionPct = stock.positionSizePct || stock.reason?.position_size_pct || null;
    const factors = stock.factors || stock.reason?.factors || {};

    let html = '<div class="v5-status-bar">';

    // ── Conviction Badge ──
    if (conviction) {
        const convColors = {
            'High':   { bg: 'rgba(52,211,153,0.15)', border: '#34d399', text: '#34d399', icon: '🔥', label: '높음' },
            'Medium': { bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24', text: '#fbbf24', icon: '⚡', label: '보통' },
            'Low':    { bg: 'rgba(251,113,133,0.15)', border: '#fb7185', text: '#fb7185', icon: '⚠️', label: '낮음' }
        };
        const c = convColors[conviction] || convColors['Medium'];
        const convTooltip = "분석 신뢰도: MFC 점수, 시장 레짐, 손익비를 종합하여 산출한 분석의 확신 수준입니다.";
        html += `<div class="v5-badge" style="background:${c.bg}; border:1px solid ${c.border}; color:${c.text};" title="${convTooltip}">
            ${c.icon} 분석 신뢰도: <b>${c.label}</b>
        </div>`;
    }

    // ── PnL Badge (Holdings only) ──
    if (pnl !== null && pnl !== undefined) {
        const pnlVal = parseFloat(pnl);
        const isProfit = pnlVal >= 0;
        const pnlColor = pnlVal >= 20 ? '#34d399' : pnlVal >= 0 ? '#86efac' : pnlVal >= -10 ? '#fbbf24' : '#fb7185';
        const pnlBg = pnlVal >= 20 ? 'rgba(52,211,153,0.15)' : pnlVal >= 0 ? 'rgba(134,239,172,0.1)' : pnlVal >= -10 ? 'rgba(251,191,36,0.12)' : 'rgba(251,113,133,0.15)';
        const pnlIcon = pnlVal >= 30 ? '💰' : pnlVal >= 0 ? '📈' : pnlVal >= -10 ? '📉' : '🚨';
        const pnlTooltip = `현재 수익률: 사용자 평단가(${stock.avgPrice}) 대비 현재가 기준 손익률입니다.`;
        html += `<div class="v5-badge" style="background:${pnlBg}; border:1px solid ${pnlColor}; color:${pnlColor};" title="${pnlTooltip}">
            ${pnlIcon} 현재 수익률: <b>${isProfit ? '+' : ''}${pnlVal.toFixed(1)}%</b>
        </div>`;
    }

    // ── Position Size Gauge ──
    if (positionPct !== null && positionPct !== undefined) {
        const psPct = Math.min(100, Math.max(0, parseFloat(positionPct)));
        const psColor = psPct >= 70 ? '#34d399' : psPct >= 40 ? '#fbbf24' : '#fb7185';
        const psTooltip = "추천 비중: 현재 시장 상황과 종목 리스크를 고려하여 산출한 포트폴리오 내 권장 투입 비중입니다.";
        html += `<div class="v5-badge v5-position-gauge" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; min-width:130px;" title="${psTooltip}">
            📊 추천 비중: <b style="color:${psColor}">${psPct.toFixed(0)}%</b>
            <div class="v5-gauge-track">
                <div class="v5-gauge-fill" style="width:${psPct}%; background:${psColor};"></div>
            </div>
        </div>`;
    }

    // ── Factor Scores (Regime, R:R, MQ) ──
    if (factors.regime_score !== undefined || factors.rr_score !== undefined) {
        const regime = factors.regime_score ?? '-';
        const rr = factors.rr_score ?? '-';
        const mq = factors.momentum_quality ?? '-';
        html += `<div class="v5-badge v5-factors" style="background:rgba(129,140,248,0.08); border:1px solid rgba(129,140,248,0.2); color:#a5b4fc;">
            <span title="시장 부합도 (Regime Alignment): 현재 시장 레짐과 종목의 성격이 얼마나 일치하는지 나타냅니다.">🧭 ${typeof regime === 'number' ? regime.toFixed(0) : regime}</span>
            <span class="v5-sep">|</span>
            <span title="손익비 (Risk/Reward): 예상 수익 대비 감수해야 할 하방 리스크의 비율입니다.">⚖️ ${typeof rr === 'number' ? rr.toFixed(0) : rr}</span>
            <span class="v5-sep">|</span>
            <span title="모멘텀 품질 (Momentum Quality): 상승 추세의 지속성과 매수세의 견고함을 평가한 점수입니다.">🚀 ${typeof mq === 'number' ? mq.toFixed(0) : mq}</span>
        </div>`;
    }

    html += '</div>';

    // ── Adjusted Rating Alert ──
    if (adjustedReason) {
        const isProfit = adjustedReason.includes('이익실현') || adjustedReason.includes('차익');
        const isLoss = adjustedReason.includes('손절');
        const isAvg = adjustedReason.includes('물타기') || adjustedReason.includes('추매');
        let alertColor, alertBg, alertIcon;
        if (isLoss) {
            alertColor = '#fb7185'; alertBg = 'rgba(251,113,133,0.1)'; alertIcon = '🚨';
        } else if (isProfit) {
            alertColor = '#fbbf24'; alertBg = 'rgba(251,191,36,0.08)'; alertIcon = '💰';
        } else if (isAvg) {
            alertColor = '#34d399'; alertBg = 'rgba(52,211,153,0.08)'; alertIcon = '📉';
        } else {
            alertColor = '#94a3b8'; alertBg = 'rgba(148,163,184,0.08)'; alertIcon = 'ℹ️';
        }
        html += `<div class="v5-alert" style="background:${alertBg}; border-left:3px solid ${alertColor}; color:${alertColor};">
            ${alertIcon} ${adjustedReason}
        </div>`;
    }

    return html;
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

// [NEW] Capital Flow Component: Advanced Donut Chart
function buildCapitalFlowComponentHtml(stock) {
    const ind = stock.reason?.indicators || {};
    const cf = ind.capital_flow;
    
    // If no synthetic capital flow data is available, fallback to basic message
    if (!cf || cf.total_inflow === undefined || cf.total_inflow === 0) {
        return `<div style="padding: 10px; text-align: center; color: #94a3b8; font-size: 0.75rem;">데이터를 수집 중입니다.</div>`;
    }

    const t_in = cf.total_inflow || 0;
    const t_out = cf.total_outflow || 0;
    const total = t_in + t_out;
    
    // Inflow breakdowns
    const in_l = cf.inflow_large || 0;
    const in_m = cf.inflow_medium || 0;
    const in_s = cf.inflow_small || 0;
    // Outflow breakdowns
    const out_l = cf.outflow_large || 0;
    const out_m = cf.outflow_medium || 0;
    const out_s = cf.outflow_small || 0;

    // Percentages for Donut segments
    const p_in_l = total > 0 ? (in_l / total) * 360 : 0;
    const p_in_m = total > 0 ? (in_m / total) * 360 : 0;
    const p_in_s = total > 0 ? (in_s / total) * 360 : 0;
    const p_out_l = total > 0 ? (out_l / total) * 360 : 0;
    const p_out_m = total > 0 ? (out_m / total) * 360 : 0;
    const p_out_s = total > 0 ? (out_s / total) * 360 : 0;

    // Conic gradient stops
    let currentAngle = 0;
    const gradientStops = [];
    
    // Inflow Colors (Green)
    const c_in_l = '#10b981'; // Strong Green
    const c_in_m = '#34d399'; // Medium Green
    const c_in_s = '#6ee7b7'; // Light Green
    
    // Outflow Colors (Red)
    const c_out_l = '#ef4444'; // Strong Red
    const c_out_m = '#f87171'; // Medium Red
    const c_out_s = '#fca5a5'; // Light Red

    const addSegment = (deg, color) => {
        if (deg <= 0.1) return;
        gradientStops.push(`${color} ${currentAngle}deg ${currentAngle + deg}deg`);
        currentAngle += deg;
    };

    addSegment(p_in_l, c_in_l);
    addSegment(p_in_m, c_in_m);
    addSegment(p_in_s, c_in_s);
    addSegment(p_out_l, c_out_l);
    addSegment(p_out_m, c_out_m);
    addSegment(p_out_s, c_out_s);
    
    // If somehow empty due to 0 total, fallback
    const gradientStr = gradientStops.length > 0 ? gradientStops.join(', ') : '#334155 0deg 360deg';

    // Formatter (USD to K/M, KRW to 백만/억)
    const isKrw = stock.nativeCurrency === 'KRW';
    const fmtValue = (val) => {
        if (val === 0) return '0';
        if (isKrw) {
            if (val >= 100000000) return (val / 100000000).toFixed(1) + '억';
            if (val >= 1000000) return (val / 1000000).toFixed(1) + '백만';
            return val.toFixed(0);
        } else {
            if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
            return val.toFixed(0);
        }
    };

    const inPct = total > 0 ? Math.round((t_in / total) * 100) : 0;
    const outPct = total > 0 ? Math.round((t_out / total) * 100) : 0;
    const centerColor = inPct >= outPct ? c_in_m : c_out_m;
    const centerText = inPct >= outPct ? inPct + '%' : outPct + '%';
    const centerLabel = inPct >= outPct ? 'INFLOW' : 'OUTFLOW';

    return `
        <div class="cf-donut-wrapper tooltip-container" style="display:flex; align-items:center; gap:10px;">
            <!-- Donut Chart -->
            <div style="flex-shrink: 0; position: relative; width: 68px; height: 68px; border-radius: 50%; background: conic-gradient(${gradientStr}); display: flex; justify-content: center; align-items: center; cursor: help; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                <div style="position: absolute; width: 52px; height: 52px; background: #0f172a; border-radius: 50%; z-index: 2; box-shadow: inset 0 2px 4px rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: ${centerColor}; line-height: 1;">${centerText}</span>
                </div>
            </div>
            
            <!-- Side Summary -->
            <div style="flex: 1; display:flex; flex-direction: column; gap:4px; font-size: 0.65rem;">
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <span style="color:#94a3b8">Buy (Inflow)</span>
                    <span style="color:${c_in_l}; font-weight:700;">${fmtValue(t_in)}</span>
                </div>
                <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                    <div style="width:${inPct}%; height:100%; background:linear-gradient(90deg, ${c_in_l}, ${c_in_s});"></div>
                </div>
                <div style="display:flex; justify-content: space-between; align-items:center; margin-top:2px;">
                    <span style="color:#94a3b8">Sell (Outflow)</span>
                    <span style="color:${c_out_l}; font-weight:700;">${fmtValue(t_out)}</span>
                </div>
                <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                    <div style="width:${outPct}%; height:100%; background:linear-gradient(90deg, ${c_out_m}, ${c_out_s});"></div>
                </div>
            </div>

            <!-- Detailed Tooltip -->
            <div class="tooltip-text" style="bottom: 100%; margin-bottom: 10px; width: 300px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 40px rgba(0,0,0,0.9); z-index: 100;">
                <div class="tooltip-header">🌊 Capital Flow Details</div>
                
                <!-- Inflow Row -->
                <div style="font-size: 0.7rem; font-weight:700; color:${c_in_m}; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; margin-bottom:6px;">
                    Inflow (매수): ${fmtValue(t_in)} (${inPct}%)
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.65rem; margin-bottom:10px;">
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="width:12px; height:12px; background:${c_in_l}; border-radius:50%; margin-bottom:2px;"></div>
                        <span style="color:#94a3b8">Large</span>
                        <span style="font-weight:700">${fmtValue(in_l)}</span>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="width:12px; height:12px; background:${c_in_m}; border-radius:50%; margin-bottom:2px;"></div>
                        <span style="color:#94a3b8">Medium</span>
                        <span style="font-weight:700">${fmtValue(in_m)}</span>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="width:12px; height:12px; background:${c_in_s}; border-radius:50%; margin-bottom:2px;"></div>
                        <span style="color:#94a3b8">Small</span>
                        <span style="font-weight:700">${fmtValue(in_s)}</span>
                    </div>
                </div>

                <!-- Outflow Row -->
                <div style="font-size: 0.7rem; font-weight:700; color:${c_out_m}; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; margin-bottom:6px; margin-top:10px;">
                    Outflow (매도): ${fmtValue(t_out)} (${outPct}%)
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.65rem;">
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="width:12px; height:12px; background:${c_out_l}; border-radius:50%; margin-bottom:2px;"></div>
                        <span style="color:#94a3b8">Large</span>
                        <span style="font-weight:700">${fmtValue(out_l)}</span>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="width:12px; height:12px; background:${c_out_m}; border-radius:50%; margin-bottom:2px;"></div>
                        <span style="color:#94a3b8">Medium</span>
                        <span style="font-weight:700">${fmtValue(out_m)}</span>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="width:12px; height:12px; background:${c_out_s}; border-radius:50%; margin-bottom:2px;"></div>
                        <span style="color:#94a3b8">Small</span>
                        <span style="font-weight:700">${fmtValue(out_s)}</span>
                    </div>
                </div>
                
                <div style="margin-top:10px; font-size:0.6rem; color:#64748b; line-height:1.4; border-top:1px dotted rgba(255,255,255,0.1); padding-top:6px;">
                    * 일일 거래대금 및 수급 대용치를 기반으로 한 거시적 자본 흐름 모델(Synthetic Flow Model)입니다.<br>
                    * Large: 대형손/기관, Medium: 중소형 법인, Small: 개인 투자자
                </div>
            </div>
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

    // Compute overlay positions from actual data lengths.
    // _plot_unified_forecast: visible_start = max(0, len(history)-40), fc_len = consensusPath.length
    // matplotlib figure: ~6% left margin, ~6% right margin → 88% plot width.
    const CHART_LEFT  = 6;
    const CHART_PLOT  = 88;
    const HIST_BARS   = 40; // must match visible_start in _plot_unified_forecast
    const fcLen       = (stock.consensusPath || []).length || 10;
    const totalBars   = HIST_BARS + fcLen;
    const histW       = (HIST_BARS / totalBars) * CHART_PLOT;
    const foreW       = (fcLen     / totalBars) * CHART_PLOT;
    const foreLeft    = CHART_LEFT + histW;

    // Only show the last HIST_BARS entries (matches what the chart image shows)
    const visibleHistory = (stock.historyPath || []).slice(-HIST_BARS);

    return `
        <div class="chart-container" style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,158,11,0.2); position: relative; margin-top: 1.5rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.2);">
            <img src="../${stock.consensusPredictionImage}" class="stock-chart pro-chart" style="margin:0; pointer-events: none; width: 100%; display: block;">
            <div class="chart-label" style="font-size: 0.65rem; padding: 4px 10px; background: rgba(0,0,0,0.6); position: absolute; top:0; left:0; border-bottom-right-radius: 8px; z-index: 10;">
                🤖 AI Consensus Forecast (T+${fcLen})
            </div>
            
            ${visibleHistory.length > 0 ? `
            <div class="history-hover-overlay" style="position: absolute; left: ${CHART_LEFT}%; top: 10%; width: ${histW.toFixed(1)}%; height: 65%; z-index: 100; display: flex; flex-direction: row;">
                ${visibleHistory.map((item, i) => {
                    const isKrw = stock.nativeCurrency === 'KRW';
                    const fmt = (v) => isKrw ? v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : v.toFixed(2);
                    const curPrice = (isKrw ? fmt(item.close) + '원' : '$' + fmt(item.close));
                    const o = fmt(item.open);
                    const h = fmt(item.high);
                    const l = fmt(item.low);
                    const v = item.volume > 1000000 ? (item.volume/1000000).toFixed(1) + 'M' : (item.volume/1000).toFixed(0) + 'K';
                    
                    return `
                    <div class="hover-col" style="flex: 1; height: 100%; cursor: crosshair; pointer-events: auto;" 
                         onmousemove="showChartHistoryTooltip(event, '${item.date.substring(5)}', '${curPrice}', '${o}', '${h}', '${l}', '${v}', '${item.change}')" 
                         onmouseleave="hideChartTooltip(event)"></div>
                    `;
                }).join('')}
            </div>
            ` : ''}

            ${stock.forecastPath && stock.forecastPath.length > 0 ? `
            <div class="prediction-hover-overlay" style="position: absolute; left: ${foreLeft.toFixed(1)}%; top: 10%; width: ${foreW.toFixed(1)}%; height: 65%; z-index: 100; display: flex; flex-direction: row;">
                ${stock.forecastPath.map((item, i) => {
                    const isKrw = stock.nativeCurrency === 'KRW';
                    const fmt = (v) => isKrw ? v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : v.toFixed(2);
                    const curPrice = (isKrw ? fmt(item.close) + '원' : '$' + fmt(item.close));
                    const o = fmt(item.open);
                    const h = fmt(item.high);
                    const l = fmt(item.low);
                    const v = item.volume > 1000000 ? (item.volume/1000000).toFixed(1) + 'M' : (item.volume/1000).toFixed(0) + 'K';
                    const change = (item.change >= 0 ? '+' : '') + item.change + '%';
                    
                    return `
                    <div class="hover-col" style="flex: 1; height: 100%; cursor: crosshair; pointer-events: auto;" 
                         onmousemove="showChartTooltip(event, '${item.date}', '${curPrice}', '${change}', '${o}', '${h}', '${l}', '${v}')" 
                         onmouseleave="hideChartTooltip(event)"></div>
                    `;
                }).join('')}
            </div>
            ` : (stock.consensusPath && stock.consensusPath.length > 0 ? `
            <div class="prediction-hover-overlay" style="position: absolute; left: ${foreLeft.toFixed(1)}%; top: 10%; width: ${foreW.toFixed(1)}%; height: 65%; z-index: 100; display: flex; flex-direction: row;">
                ${stock.consensusPath.map((val, i) => {
                    const basePrice = stock.rawPrice || 0;
                    // T+1: vs rawPrice (진입 기준), T+2 이후: vs 전일 예측가 (일간 변화율)
                    const prevVal = i === 0 ? basePrice : stock.consensusPath[i - 1];
                    const pctChange = prevVal > 0 ? (((val - prevVal) / prevVal) * 100) : 0;
                    const pctStr = (pctChange >= 0 ? '+' : '') + pctChange.toFixed(2) + '%';
                    const isKrw = stock.nativeCurrency === 'KRW';
                    const priceStr = isKrw ? val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원' : '$' + val.toFixed(2);
                    return `
                    <div class="hover-col" style="flex: 1; height: 100%; cursor: crosshair; pointer-events: auto;" onmousemove="showChartTooltip(event, 'T+${i+1}', '${priceStr}', '${pctStr}')" onmouseleave="hideChartTooltip(event)"></div>
                `;
                }).join('')}
            </div>
            ` : '')}
            <div class="hover-crosshair-v" style="z-index: 110; position: absolute; border-left: 1px dashed rgba(255,255,255,0.7); pointer-events: none; display: none;"></div>
            <div class="hover-crosshair-h" style="z-index: 110; position: absolute; border-top: 1px dashed rgba(255,255,255,0.7); pointer-events: none; display: none;"></div>
            <div class="hover-axis-x" style="z-index: 120; position: absolute; display: none; background: rgba(0,0,0,0.85); color: #fff; padding: 2px 6px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-size: 0.7rem; pointer-events: none; font-weight: bold; transform: translate(-50%, 0);"></div>
            <div class="hover-axis-y" style="z-index: 120; position: absolute; display: none; background: var(--accent-blue); color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; pointer-events: none; font-weight: bold; margin-left: 5px;"></div>
            <div class="hover-tooltip-box" style="z-index: 130; position: absolute; display: none; background: rgba(15,23,42,0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 6px 10px; pointer-events: none; font-size: 0.8rem; box-shadow: 0 4px 12px rgba(0,0,0,0.5); min-width: 140px;"></div>

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

// [NEW] Render Compact Header Regime Indicator
function renderHeaderRegimeIndicator(data) {
    const indicator = document.getElementById('header-regime-indicator');
    if (!indicator) return;

    const allStocks = [...(data.holdings || []), ...(data.watchlist || [])];
    const totalAnalyzed = allStocks.length;

    let regime = '';
    for (const s of allStocks) {
        if (s.marketRegime) { regime = s.marketRegime; break; }
    }

    if (!regime) { 
        indicator.style.display = 'none'; 
        return; 
    }

    const config = {
        'Trending-Bull':      { color: '#34d399', label: 'BULL TREND' },
        'Trending-Bear':      { color: '#fb7185', label: 'BEAR TREND' },
        'Volatile-Chop':      { color: '#fbbf24', label: 'VOLATILE CHOP' },
        'Low-Vol Compression':{ color: '#38bdf8', label: 'LOW VOL' },
        'Transitional':       { color: '#94a3b8', label: 'TRANSITION' },
    };
    const c = config[regime] || { color: '#94a3b8', label: regime.toUpperCase() };

    indicator.style.display = 'flex';
    indicator.innerHTML = `
        <span class="regime-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${c.color}; box-shadow:0 0 8px ${c.color}; margin-right:0.5rem;"></span>
        <span class="regime-text" style="color:#cbd5e1; letter-spacing:0.02rem;"><span class="hide-mobile">Regime: </span><strong style="color:${c.color}; text-shadow:0 0 10px ${c.color}33;">${c.label}</strong></span>
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

    // 1. Parse Price and check volatility context
    let price = 0;

    if (!priceStr) return '';

    // Remove commas and currency symbols
    const cleanPrice = priceStr.replace(/[$,원]/g, '').trim();
    price = parseFloat(cleanPrice);

    // High-volatility flag: use ATR from indicators if available, else fall back to return magnitude
    const ind2 = stock?.reason?.indicators || {};
    const atrPct = (ind2.atr && price > 0) ? (ind2.atr / price * 100) : 0;
    const isHighVol = atrPct > 20 || Math.abs(parseFloat(returnStr)) > 15;

    // 2. Parse Return
    let ret = parseFloat(returnStr.replace('%', ''));

    // 3. Generate Logic Explanation (Fallback Why?)
    if (isHighVol && Math.abs(ret) > 15) {
        return `
        <div class="tooltip-header">📊 변동성 분석 및 예측 근거</div>
        <b>1. 높은 변동성 구간 (High Volatility Zone):</b><br>
        현재 종목의 ATR(${atrPct > 0 ? atrPct.toFixed(1) + '%' : '높음'})이 평균 대비 크게 확대된 상태입니다. 이는 기술적 지표가 과매도/과매수 구간에서 급격한 반전을 암시하기 때문입니다.<br><br>
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

// [NEW] Valuation & 60-Day Range Chart Component
function buildValuationComponentHtml(stock) {
    const curStr = stock.currentPrice || stock.rawPrice;
    let tgtStr = stock.reason?.fundamentals?.target_price;
    if (!tgtStr || tgtStr === 'N/A') {
        const match = stock.reason?.technical_summary?.match(/목표가:\s*\*{0,2}([$\d,.]+[a-zA-Z가-힣]*)/);
        if (match) tgtStr = match[1];
    }
    
    const fib = stock.reason?.indicators?.fibonacci || {};
    const high60 = parseFloat(fib.high_60d);
    const low60 = parseFloat(fib.low_60d);

    if (!curStr) return '';
    
    const curVal = parseFloat(String(curStr).replace(/[^\d.]/g, ''));
    if (isNaN(curVal) || curVal === 0) return '';
    
    let tgtVal = tgtStr && tgtStr !== 'N/A' ? parseFloat(String(tgtStr).replace(/[^\d.]/g, '')) : null;
    if (isNaN(tgtVal)) tgtVal = null;

    const useLow = !isNaN(low60) && low60 > 0 ? low60 : curVal * 0.8;
    const useHigh = !isNaN(high60) && high60 > 0 ? high60 : curVal * 1.2;
    
    const minVal = Math.min(useLow, curVal, (tgtVal || curVal));
    const maxVal = Math.max(useHigh, curVal, (tgtVal || curVal));
    const pad = (maxVal - minVal) * 0.1;
    const viewMin = Math.max(0, minVal - pad);
    const viewMax = maxVal + pad;
    
    const range = viewMax - viewMin || 1;
    
    const curPct = Math.max(0, Math.min(100, ((curVal - viewMin) / range) * 100));
    
    let tgtHtml = '';
    let badgeHtml = '';
    
    if (tgtVal && tgtVal > 0) {
        const tgtPct = Math.max(0, Math.min(100, ((tgtVal - viewMin) / range) * 100));
        const upside = ((tgtVal - curVal) / curVal) * 100;
        const isKrw = stock.nativeCurrency === 'KRW';
        const displayTgtStr = tgtStr || (isKrw ? tgtVal.toLocaleString() + '원' : '$' + tgtVal.toFixed(2));
        
        let color, badgeIcon, badgeText, badgeClass;
        if (upside > 0) {
            color = '#34d399';
            badgeIcon = '🟩';
            badgeText = `저평가 구간 (Upside: +${upside.toFixed(1)}%)`;
            badgeClass = 'positive';
        } else {
            color = '#fb7185';
            badgeIcon = '🟥';
            badgeText = `고평가 위험 (Downside: ${upside.toFixed(1)}%)`;
            badgeClass = 'negative';
        }
        
        tgtHtml = `
            <div class="valuation-marker-target" style="left: ${tgtPct}%;">
                <div class="marker-dot" style="background: ${color}; box-shadow: 0 0 8px ${color}; border-color: #0f172a;"></div>
                <div class="marker-label" style="color: ${color};">${displayTgtStr}</div>
            </div>
        `;
        badgeHtml = `<div class="valuation-badge ${badgeClass}" style="margin-left:auto;">${badgeIcon} ${badgeText}</div>`;
    } else {
         badgeHtml = `<div class="valuation-badge neutral" style="margin-left:auto;">평가 보류 (목표가 없음)</div>`;
    }

    const fmtMin = viewMin > 1000 ? viewMin.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : viewMin.toFixed(2);
    const fmtMax = viewMax > 1000 ? viewMax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : viewMax.toFixed(2);

    return `
        <div class="valuation-range-container">
            <div class="valuation-header">
                <span class="valuation-title">⚖️ Valuation & 60-Day Range</span>
                ${badgeHtml}
            </div>
            <div class="valuation-track-wrapper">
                <span class="valuation-range-label">${fmtMin}</span>
                <div class="valuation-track">
                    <div class="valuation-gradient"></div>
                    <div class="valuation-marker-current" style="left: ${curPct}%;">
                        <div class="marker-line"></div>
                        <div class="marker-label">${curStr}</div>
                    </div>
                    ${tgtHtml}
                </div>
                <span class="valuation-range-label">${fmtMax}</span>
            </div>
        </div>
    `;
}

function renderDashboard(data) {
    // 헤더 개요 업데이트
    document.getElementById('report-overview').innerHTML = data.overview;

    // [NEW] Market Pulse 동적 생성
    const pulseContainer = document.getElementById('market-pulse-container');
    if (pulseContainer) {
        // data.strategy.regime이 없으면 텍스트에서 파싱 시도 (단순화)
        let regimeStr = data.strategy?.regime || 'Transitional';
        if (regimeStr === 'Transitional' && typeof data.overview === 'string') {
            if (data.overview.includes('상승장') || data.overview.includes('Bull')) regimeStr = 'Trending-Bull';
            else if (data.overview.includes('하락장') || data.overview.includes('Bear')) regimeStr = 'Trending-Bear';
        }
        
        const usdKrw = data.usdToKrwRate ? data.usdToKrwRate.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1}) : '-';
        
        let upCount = 0;
        let downCount = 0;
        data.holdings.forEach(s => {
            const pnl = s.holdingPnlPct ?? s.reason?.holding_pnl_pct;
            if (pnl > 0) upCount++;
            else if (pnl < 0) downCount++;
        });

        pulseContainer.innerHTML = `
            <div class="pulse-widget">
                <div class="pulse-title">Market Regime</div>
                <div class="pulse-value" style="color: #38bdf8;">${regimeStr}</div>
                <div class="pulse-change">현재 시장 기조</div>
            </div>
            <div class="pulse-widget">
                <div class="pulse-title">USD/KRW</div>
                <div class="pulse-value">₩${usdKrw}</div>
                <div class="pulse-change">환율</div>
            </div>
            <div class="pulse-widget">
                <div class="pulse-title">Portfolio Status</div>
                <div class="pulse-value">${data.holdings.length} <span style="font-size:0.9rem; font-weight: 600; color:#94a3b8;">종목</span></div>
                <div class="pulse-change">수익 <span style="color:#34d399">+${upCount}</span> / 손실 <span style="color:#fb7185">${downCount}</span></div>
            </div>
            <div class="pulse-widget">
                <div class="pulse-title">Watchlist</div>
                <div class="pulse-value">${data.watchlist.length} <span style="font-size:0.9rem; font-weight: 600; color:#94a3b8;">종목</span></div>
                <div class="pulse-change">관심 종목 모니터링 중</div>
            </div>
        `;
        pulseContainer.style.display = 'grid';
    }

    // [NEW] 탭 배지 업데이트
    const holdingsBadge = document.getElementById('holdings-badge');
    const watchlistBadge = document.getElementById('watchlist-badge');
    if(holdingsBadge) holdingsBadge.textContent = data.holdings.length;
    if(watchlistBadge) watchlistBadge.textContent = data.watchlist.length;

    // [NEW] HOME 메타데이터 (날짜, 환율) 업데이트
    const dateDisplay = document.getElementById('home-date-display');
    const rateDisplay = document.getElementById('home-exchange-rate');
    
    if (dateDisplay) {
        const fullDate = data.generatedAt || data.date || '-';
        dateDisplay.textContent = fullDate.replace(/-/g, '. ');
    }
    if (rateDisplay && data.usdToKrwRate) {
        rateDisplay.textContent = `₩${data.usdToKrwRate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else if (rateDisplay) {
        rateDisplay.textContent = '-';
    }
    // 보유 종목 렌더링
    const holdingsList = document.querySelector('#holdings-list');
    holdingsList.innerHTML = '';

    if (data.holdings.length > 0) {
        data.holdings.forEach(stock => {
            const isUp = stock.return.startsWith('+');
            const tooltipContent = stock.predictedResult ? getPredictionTooltip(stock.name, stock.currentPrice, stock.predictedResult, stock.predictionReason) : '';

            const ind = stock.reason?.indicators || {};
            const isShortSqueeze = (ind.short_interest_change_pct >= 8);
            const pnl = stock.holdingPnlPct ?? stock.reason?.holding_pnl_pct ?? null;
            const isTakeProfit = (pnl !== null && parseFloat(pnl) >= 30 && (stock.adjustedRatingReason || '').includes('이익실현'));
            const wrapperClass = isTakeProfit ? "stock-item-wrapper take-profit-glow" : "stock-item-wrapper";
            const shortSqueezeBadge = isShortSqueeze ? `<span class="short-squeeze-badge" title="공매도 잔고 8% 이상 급증! 숏 스퀴즈 또는 하방 압력 주의">🔥 Short Surge Alert</span>` : '';

            const stockItem = `
                <div class="${wrapperClass}" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info" style="min-width: 0; flex: 1; word-break: keep-all;">
                            <div class="name" style="font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
                                ${stock.name}
                                ${shortSqueezeBadge}
                            </div>
                            <div class="price" style="color: #cbd5e1; font-size: 1rem;">
                                평단: ${stock.avgPrice} / 현재: ${stock.currentPrice}
                                ${stock.changePercent !== undefined ? `
                                <span class="change ${stock.changePercent > 0 ? 'up' : stock.changePercent < 0 ? 'down' : ''}" style="margin-left: 0.5rem; font-weight: 600;">
                                    (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                                </span>` : ''}
                            </div>
                        </div>
                        <div class="stock-header-actions" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; flex-shrink: 0;">
                            <span class="badge ${getAdviceBadgeClass(stock.advice)}" style="font-size: 0.9rem; padding: 6px 12px;">${stock.advice}</span>
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    ${buildStatusBarHtml(stock)}

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                    </div>

                    <div class="analysis-content">
                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}
                        
                        ${buildValuationComponentHtml(stock)}

                        <!-- Scores horizontally side-by-side -->
                        <div class="combined-score-row">
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
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #34d399; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase;">🌊 Capital Flow Analysis</div>
                                ${buildCapitalFlowComponentHtml(stock)}
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

            const ind = stock.reason?.indicators || {};
            const isShortSqueeze = (ind.short_interest_change_pct >= 8);
            const pnl = stock.holdingPnlPct ?? stock.reason?.holding_pnl_pct ?? null;
            const isTakeProfit = (pnl !== null && parseFloat(pnl) >= 30 && (stock.adjustedRatingReason || '').includes('이익실현'));
            const wrapperClass = isTakeProfit ? "stock-item-wrapper take-profit-glow" : "stock-item-wrapper";
            const shortSqueezeBadge = isShortSqueeze ? `<span class="short-squeeze-badge" title="공매도 잔고 8% 이상 급증! 숏 스퀴즈 또는 하방 압력 주의">🔥 Short Surge Alert</span>` : '';

            const stockItem = `
                <div class="${wrapperClass}" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info" style="min-width: 0; flex: 1; word-break: keep-all;">
                            <div class="name" style="font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
                                ${stock.name}
                                ${shortSqueezeBadge}
                            </div>
                            <div class="price" style="color: #cbd5e1; font-size: 1rem;">
                                현재가: ${stock.currentPrice}
                                ${stock.changePercent !== undefined ? `
                                <span class="change ${stock.changePercent > 0 ? 'up' : stock.changePercent < 0 ? 'down' : ''}" style="margin-left: 0.5rem; font-weight: 600;">
                                    (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                                </span>` : ''}
                            </div>
                        </div>
                        <div class="stock-header-actions" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; flex-shrink: 0;">
                            <span class="badge ${getAdviceBadgeClass(stock.advice)}" style="font-size: 0.9rem; padding: 6px 12px;">${stock.advice}</span>
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    ${buildStatusBarHtml(stock)}

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                    </div>

                    <div class="analysis-content">
                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}

                        ${buildValuationComponentHtml(stock)}

                        <!-- Scores horizontally side-by-side -->
                        <div class="combined-score-row">
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
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #34d399; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase;">🌊 Capital Flow Analysis</div>
                                ${buildCapitalFlowComponentHtml(stock)}
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

    // [NEW] Header Compact Regime Indicator 렌더링
    renderHeaderRegimeIndicator(data);

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
    // High-volatility flag: ATR > 20% of price, or fallback to gap magnitude
    const priceVal = parseFloat(priceStr.replace(/[$,원]/g, '').trim()) || 0;
    const atrVal = ind.atr || 0;
    const isHighVol = (priceVal > 0 && atrVal > 0) ? (atrVal / priceVal * 100 > 20) : (Math.abs(gap) > 15);

    let adjustment = 0;
    if (gap >= 15.0) {
        adjustment -= isHighVol ? 30 : 20;
    }

    const tags = ((stock.tags || []).map(t => typeof t === 'string' ? t : t.text)) || [];
    const isReversing = tags.some(t => t.includes('Spring') || (t.includes('다이버전스') && t.includes('상승')));
    if (isHighVol && isReversing && !['Accumulation', 'Markup'].includes(structure)) {
        adjustment += 30;
    }

    // 백엔드 데이터에 scalping_bonus가 있으면 그것을 사용
    if (stock.scalping_bonus !== undefined) {
         adjustment = stock.scalping_bonus;
    }

    // 5. Short Interest Adjustments
    const shortPct = ind.short_percent_float;
    const shortChange = ind.short_interest_change_pct;
    
    if (shortPct !== undefined && shortPct !== null && shortPct >= 0.10) {
        adjustment -= 5;
        tags.push('🚨 공매도 비중 주의');
    } else if (shortChange !== undefined && shortChange !== null && !isNaN(shortChange)) {
        if (shortChange >= 8.0) {
            adjustment -= 25;
            tags.push('🚨 강력한 하방 압력(공매도 급증)');
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
 * [NEW] 마우스 드래그로 수평 스크롤을 지원하는 함수
 */
function enableDragScroll(slider) {
    if (!slider) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        // 향상된 드래그 경험을 위해 snap 동작 임시 해제
        slider.style.scrollSnapType = 'none';
        slider.style.scrollBehavior = 'auto'; // 드래그 시 부드러운 이동을 위해
    });
    
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.scrollSnapType = 'x mandatory';
        slider.style.scrollBehavior = 'smooth';
    });
    
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.scrollSnapType = 'x mandatory';
        slider.style.scrollBehavior = 'smooth';
    });
    
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // 드래그 속도 조절
        slider.scrollLeft = scrollLeft - walk;
    });

    // 기본 커서 설정
    slider.style.cursor = 'grab';
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
        const shortPct = ind.short_percent_float;
        const shortChange = ind.short_interest_change_pct;
        
        if (shortPct !== undefined && shortPct !== null && shortPct >= 0.10) {
            tags.push({ text: `🚨 공매도 비중 주의 (${(shortPct * 100).toFixed(2)}%)`, cls: 'negative' });
        } else if (shortChange !== undefined && shortChange !== null && !isNaN(shortChange)) {
            if (shortChange >= 8.0) tags.push({ text: `🚨 강력한 하방 압력(공매도 급증 +${shortChange.toFixed(1)}%)`, cls: 'negative' });
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
    
    enableDragScroll(container.querySelector('.todays-picks-grid'));
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
    const usValueContainer = document.getElementById('discovery-picks-us-value-container');
    const krContainer = document.getElementById('discovery-picks-kr-container');
    const cryptoContainer = document.getElementById('discovery-picks-crypto-container');

    if (!usContainer || !krContainer) return;
    
    // Clear components if discovery data doesn't exist for the selected date
    if (!data || !data.discovery) {
        usContainer.innerHTML = '';
        if (usValueContainer) usValueContainer.innerHTML = '';
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
        enableDragScroll(usContainer.querySelector('.discovery-picks-grid'));
    } else {
        usContainer.innerHTML = '';
    }

    // [NEW] Render US Value Growth Picks ($10 이하 저평가 성장주)
    if (usValueContainer) {
        const picksUsValue = discovery.picks_us_value || [];
        console.log('[renderDiscoveryPicks] US Value Growth Picks:', picksUsValue.length);
        if (picksUsValue.length > 0) {
            usValueContainer.innerHTML = `
                <div class="discovery-picks-header">
                    <div class="discovery-picks-title">🌱 US 저평가 성장주 (Value Growth ≤$3)</div>
                    <div class="discovery-picks-subtitle">$3 이하 고PICK 종목 • TOP ${picksUsValue.length} <span style="color:#f59e0b;font-size:0.75rem;margin-left:6px;">⚠️ 고위험·고보상</span></div>
                </div>
                <div class="discovery-picks-grid">${createDiscoveryCardsHtml(picksUsValue)}</div>
            `;
            enableDragScroll(usValueContainer.querySelector('.discovery-picks-grid'));
        } else {
            usValueContainer.innerHTML = '';
        }
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
            enableDragScroll(cryptoContainer.querySelector('.discovery-picks-grid'));
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
        enableDragScroll(krContainer.querySelector('.discovery-picks-grid'));
    } else {
        krContainer.innerHTML = '';
    }
}

function renderActionSummary(data) {
    const container = document.getElementById('action-summary-container');
    if (!container) return;

    // 모든 종목 합치기 (보유 + 관심)
    const allStocks = [...(data.holdings || []), ...(data.watchlist || [])];

    // ── PICK 점수 계산 (rec_score 우선, 없으면 프론트 에뮬레이션) ──
    const getPickScore = (stock) => {
        if (stock.rec_score !== undefined && stock.rec_score !== null) return stock.rec_score;
        const info = buildRecommendationScore(stock);
        return info.total;
    };

    const getMfc = (stock) => stock.mfcScore || stock.reason?.indicators?.mfc_score || 0;

    // ── advice 텍스트 파싱 (보조 판별) ──
    const getAdviceDirection = (adviceStr) => {
        if (!adviceStr) return 'none';
        let evalStr = adviceStr;
        if (adviceStr.includes('종합:')) {
            const parts = adviceStr.split('종합:');
            evalStr = parts[parts.length - 1];
        }
        if (evalStr.includes('매수 우위')) return 'buy';
        if (evalStr.includes('매도 우위')) return 'sell';
        const hasBuy = evalStr.includes('매수');
        const hasSell = evalStr.includes('매도');
        if (hasBuy && !hasSell) return 'buy';
        if (hasSell && !hasBuy) return 'sell';
        if (hasBuy && hasSell) {
            return evalStr.indexOf('매수') < evalStr.indexOf('매도') ? 'buy' : 'sell';
        }
        return 'none';
    };

    // ── PICK 점수 + advice 방향 결합 분류 ──
    // Buy: PICK >= 55 AND advice가 매수 방향  (강한 확신)
    //       OR PICK >= 65 (PICK 자체가 높으면 advice 무관하게 매수)
    // Sell: PICK < 35 AND advice가 매도 방향  (강한 확신)
    //       OR PICK < 25 (PICK 자체가 낮으면 advice 무관하게 매도)
    //       OR advice가 매도이고 PICK < 45
    const getActionType = (stock) => {
        const pick = getPickScore(stock);
        const dir = getAdviceDirection(stock.advice);

        // Buy 판별
        if (pick >= 65) return 'buy';
        if (pick >= 55 && dir === 'buy') return 'buy';

        // Sell 판별
        if (pick < 25) return 'sell';
        if (pick < 35 && dir === 'sell') return 'sell';
        if (pick < 45 && dir === 'sell') return 'sell';

        // Fallback: advice 방향만으로 판별 (PICK이 중간대인 경우)
        if (dir === 'buy' && pick >= 50) return 'buy';
        if (dir === 'sell' && pick < 50) return 'sell';

        return 'none';
    };

    // ── 분류 및 PICK 점수 기준 정렬 ──
    const buyList = allStocks
        .filter(stock => getActionType(stock) === 'buy')
        .sort((a, b) => getPickScore(b) - getPickScore(a));  // PICK 높은 순

    const sellList = allStocks
        .filter(stock => getActionType(stock) === 'sell')
        .sort((a, b) => getPickScore(a) - getPickScore(b));  // PICK 낮은 순 (위험도 높은 순)

    // ── PICK 점수 색상 ──
    const pickColor = (score) => {
        if (score >= 70) return '#34d399';
        if (score >= 55) return '#38bdf8';
        if (score >= 40) return '#fbbf24';
        return '#fb7185';
    };

    // HTML 생성 (Tooltip 포함)
    const createListItem = (stock, index, totalItems, isBuy) => {
        const positionClass = (index < totalItems / 2) ? 'tooltip-down' : 'tooltip-up';
        const pick = Math.round(getPickScore(stock));
        const mfc = Math.round(getMfc(stock));
        const pColor = pickColor(pick);
        const mColor = mfc >= 60 ? '#34d399' : mfc >= 40 ? '#fbbf24' : '#fb7185';

        // Advice 파싱
        let adviceListHtml = '';
        if (stock.advice) {
            const adviceItems = stock.advice.split('|').map(item => item.trim());
            adviceListHtml = '<ul class="advice-list">';
            adviceItems.forEach(item => {
                if (!item.includes('📊 종합')) {
                    adviceListHtml += `<li>${item}</li>`;
                }
            });
            adviceListHtml += '</ul>';
        } else {
            adviceListHtml = '<p class="no-data">투자 조언 데이터가 없습니다.</p>';
        }

        // Prediction Reason
        let predictionReasonHtml = '';
        if (stock.predictionReason) {
            predictionReasonHtml = `
                <div class="tooltip-section">
                    <div class="tooltip-subtitle">🤖 AI Prediction Context</div>
                    <div class="prediction-text">${stock.predictionReason}</div>
                </div>
            `;
        }

        // AI 예측 수익률
        const pred = stock.predictedResult || stock.ai_prediction || '';
        const predHtml = pred ? `<span style="font-size:0.65rem; color:${pred.includes('-') ? '#fb7185' : '#34d399'}; margin-left:4px;">${pred}</span>` : '';

        return `
        <li class="action-item tooltip-container ${positionClass}">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; gap: 0.5rem;">
                <span class="action-stock-name" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    ${stock.name}
                    <span style="font-size:0.6rem; font-weight:800; color:${pColor}; background:${pColor}18; border:1px solid ${pColor}40; padding:1px 5px; border-radius:4px; letter-spacing:0.02em;">PICK ${pick}</span>
                    <span style="font-size:0.6rem; font-weight:700; color:${mColor}; opacity:0.8;">MFC ${mfc}</span>
                    ${predHtml}
                    ${stock.scalping_bonus > 0 ? `<span class="pick-tag neutral" style="font-size:0.6rem; padding: 0.1rem 0.4rem;">⚡단타</span>` : ''}
                    ${stock.deviation_pct <= -10 ? `<span class="pick-tag positive" style="font-size:0.6rem; padding: 0.1rem 0.4rem;">낙폭과대</span>` : ''}
                </span>
                <span class="action-badge">${stock.currentPrice}</span>
            </div>
            <div class="tooltip-text strategy-tooltip">
                <div class="tooltip-header">${stock.name} 투자 전략</div>
                <div class="tooltip-body">
                    <div class="tooltip-section">
                        <div class="tooltip-subtitle">📊 Score Summary</div>
                        <div style="display:flex; gap:1rem; margin-bottom:0.5rem; font-size:0.8rem;">
                            <span><b style="color:${pColor}">PICK ${pick}</b>/100</span>
                            <span><b style="color:${mColor}">MFC ${mfc}</b>/100</span>
                            ${pred ? `<span>AI: <b style="color:${pred.includes('-') ? '#fb7185' : '#34d399'}">${pred}</b></span>` : ''}
                        </div>
                    </div>
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
        ? buyList.map((stock, idx) => createListItem(stock, idx, buyList.length, true)).join('')
        : '<li class="action-item" style="justify-content: center; color: var(--text-secondary);">해당 사항 없음</li>';

    const sellHtml = sellList.length > 0
        ? sellList.map((stock, idx) => createListItem(stock, idx, sellList.length, false)).join('')
        : '<li class="action-item" style="justify-content: center; color: var(--text-secondary);">해당 사항 없음</li>';

    container.innerHTML = `
        <div class="action-card buy-action">
            <div class="action-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                오늘의 매수 (Buy Today)
                <span style="font-size:0.65rem; color:#94a3b8; font-weight:400; margin-left:0.5rem;">PICK ≥55 기준</span>
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
                <span style="font-size:0.65rem; color:#94a3b8; font-weight:400; margin-left:0.5rem;">PICK ≤45 기준</span>
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

// ==========================================
// [NEW UI ENHANCEMENTS LOGIC]
// ==========================================
function initUIEnhancements() {
    // 1. Search Functionality
    const searchInput = document.getElementById('global-search');
    let activeTabId = null;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const allItems = document.querySelectorAll('.stock-item-wrapper'); // Only Portfolio & Watchlist
            const holdingsSection = document.getElementById('holdings-section');
            const watchlistSection = document.getElementById('watchlist-section');
            const tabsContainer = document.querySelector('.segmented-control-wrapper');
            
            if (query.length > 0) {
                // Force both sections to be active to show results from both
                holdingsSection.classList.add('active');
                watchlistSection.classList.add('active');
                if (tabsContainer) tabsContainer.style.display = 'none'; // Hide tabs temporarily
                
                allItems.forEach(item => {
                    const nameText = (item.getAttribute('data-name') || '').toLowerCase();
                    // Fallback to checking full text to allow searching by ticker if it's rendered inside
                    const fullText = (item.innerText || '').toLowerCase();
                    
                    if (nameText.includes(query) || fullText.includes(query)) {
                        item.classList.remove('display-none');
                    } else {
                        item.classList.add('display-none');
                    }
                });
            } else {
                // Restore tabs
                if (tabsContainer) tabsContainer.style.display = 'flex';
                
                // Which tab was naturally active before search?
                // Let's just rely on the active tab button
                const activeBtn = document.querySelector('.segment-btn.active');
                const targetId = activeBtn ? activeBtn.getAttribute('data-target') : 'holdings-section';
                
                holdingsSection.classList.toggle('active', targetId === 'holdings-section');
                watchlistSection.classList.toggle('active', targetId === 'watchlist-section');

                allItems.forEach(item => item.classList.remove('display-none'));
            }
        });
    }

    // 2. Scroll to Top Button
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 3. Modal Lightbox for Charts
    const modal = document.getElementById('chart-modal');
    const modalImg = document.getElementById('modal-chart-img');
    const closeBtn = document.querySelector('.close-modal');

    // Attach click event to all charts dynamically
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('stock-chart') || e.target.closest('.stock-chart')) {
            const chart = e.target.classList.contains('stock-chart') ? e.target : e.target.closest('.stock-chart');
            if (modal && modalImg) {
                modalImg.src = chart.src;
                modal.classList.add('show');
                document.body.classList.add('modal-open');
            }
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            setTimeout(() => { modalImg.src = ''; }, 300);
        });
    }

    // Close on background click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        });
    }

    // 4. Stagger Animations
    function applyStagger(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            el.style.animationDelay = `${(index % 10) * 0.05}s`;
            el.classList.add('stagger-applied');
        });
    }
    
    // Mutation observer to apply stagger when content is heavily modified
    const observer = new MutationObserver((mutations) => {
        applyStagger('.stock-item-wrapper:not(.stagger-applied), .discovery-card:not(.stagger-applied), .todays-picks-card:not(.stagger-applied)');
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUIEnhancements);
} else {
    initUIEnhancements();
}

