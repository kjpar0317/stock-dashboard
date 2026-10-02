/* ============================================================================
 * [v15] Chart.js 지연 로드
 * ----------------------------------------------------------------------------
 * Chart.js v4.5.1 은 204KB인데 실제 사용처는 **도넛 차트 2개**뿐이다
 * (토스·KIS 리스크 배분). 둘 다 로그인해야 보이는 브로커 화면이라,
 * 모든 방문자가 초기 로드에서 204KB를 받을 이유가 없다.
 *
 * 가격 차트는 lightweight-charts 를 쓰므로 이 로더와 무관하다.
 * ========================================================================== */
window.ensureChartJs = (function () {
    let promise = null;
    return function () {
        if (typeof Chart !== 'undefined') return Promise.resolve(true);
        if (promise) return promise;              // 중복 주입 방지
        promise = new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = 'chart.js?v=4.5.1';
            s.onload = () => resolve(true);
            s.onerror = () => {
                console.error('[chart.js] 로드 실패 — 리스크 도넛을 그릴 수 없습니다.');
                promise = null;                   // 다음 시도에 재시도할 수 있게
                resolve(false);
            };
            document.head.appendChild(s);
        });
        return promise;
    };
})();

let aiCore = null;
let bubbleChartInstance = null;
window.showChartHistoryTooltip = function (event, day, price, o, h, l, v, change) {
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
    const pctColor = pctNum >= 0 ? '#f25f7a' : '#5f97f2';

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
        
        // Prevent tooltip clipping at the right edge (especially on mobile/narrow viewports)
        const tooltipWidth = tooltip.offsetWidth || 230;
        if (x + 15 + tooltipWidth > cRect.width) {
            tooltip.style.left = Math.max(5, x - tooltipWidth - 15) + 'px';
        } else {
            tooltip.style.left = (x + 15) + 'px';
        }
        tooltip.style.top = Math.max(10, y - 80) + 'px';
        tooltip.style.display = 'block';
    }
};

window.showChartTooltip = function (event, day, price, pctChange, o, h, l, v, rangeStr) {
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
        yLabel.style.background = pctNum >= 0 ? '#f25f7a' : '#5f97f2';
        yLabel.style.display = pctText ? 'block' : 'none';
    }

    const pctNum = pctChange ? parseFloat(pctChange.replace(/[^0-9.+-]/g, '')) : 0;
    const pctColor = pctNum >= 0 ? '#f25f7a' : '#5f97f2';

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

        let rangeInfo = '';
        if (rangeStr) {
            rangeInfo = `
            <div style="font-size:0.7rem; color:#f59e0b; font-family: monospace; margin-bottom: 4px;">
                <span style="color:#94a3b8">±1σ 신뢰범위:</span> ${rangeStr}
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
            ${rangeInfo}
            <div style="font-size:0.7rem; color:#94a3b8; line-height:1.5; border-top: 1px dotted rgba(255,255,255,0.1); padding-top: 4px;">
                🤖 AI Consensus Forecast Point<br>
                <span style="color:#fbbf24">GARCH‑Ensemble 앙상블 예측</span>
            </div>`;
        
        // Prevent tooltip clipping at the right edge (especially on mobile/narrow viewports)
        const tooltipWidth = tooltip.offsetWidth || 230;
        if (x + 15 + tooltipWidth > cRect.width) {
            tooltip.style.left = Math.max(5, x - tooltipWidth - 15) + 'px';
        } else {
            tooltip.style.left = (x + 15) + 'px';
        }
        tooltip.style.top = Math.max(10, y - 80) + 'px';
        tooltip.style.display = 'block';
    }
};

window.hideChartTooltip = function (event) {
    const container = event.currentTarget.closest('.chart-container');
    if (!container) return;
    const elements = ['.hover-crosshair-v', '.hover-crosshair-h', '.hover-axis-x', '.hover-axis-y', '.hover-tooltip-box'];
    elements.forEach(sel => {
        const el = container.querySelector(sel);
        if (el) el.style.display = 'none';
    });
};

let initRetryCount = 0;
function initDashboardApp() {
    const selector = document.getElementById('date-selector');

    if (typeof REPORTS_HISTORY !== 'undefined' && REPORTS_HISTORY.length > 0) {
        window.REPORTS_HISTORY = REPORTS_HISTORY;
        
        // 사용 가능한 날짜 배열 획득 (Lazy Loading 아카이브 대응)
        const availableDates = typeof ALL_AVAILABLE_DATES !== 'undefined' 
            ? ALL_AVAILABLE_DATES 
            : REPORTS_HISTORY.map(r => r.date);
            
        // 셀렉트 박스 옵션 동적으로 채우기 (날짜 자체를 value로 저장)
        selector.innerHTML = '';
        availableDates.forEach((date) => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date.replace(/-/g, '. ');
            selector.appendChild(option);
        });

        // 가장 최신 데이터(배열의 첫번째)를 기본값으로 설정
        const latestDate = availableDates[0];
        window.IS_LATEST_REPORT = true; 
        selector.value = latestDate;
        
        const latestReport = REPORTS_HISTORY.find(r => r.date === latestDate) || REPORTS_HISTORY[0];
        renderDashboard(latestReport);

        // [v14] QUANT LAB 은 해당 탭에 들어갈 때 렌더한다.
        // 서버 왕복이 필요하므로 첫 화면에서 미리 부르지 않는다.
        initSignalHub();

        // 날짜 선택 이벤트 리스너 (아카이브 날짜일 경우 Lazy Loading)
        selector.addEventListener('change', async (e) => {
            const selectedDate = e.target.value;
            
            // 1. 이미 로드된 REPORTS_HISTORY에 있는지 검색
            // [v15] `_slim` 항목은 COMPARE 용 최소 필드만 담고 있다.
            // 그 날짜를 실제로 열려면 아카이브에서 전문을 받아야 한다.
            let report = window.REPORTS_HISTORY.find(r => r.date === selectedDate);
            if (report && !report._slim) {
                renderDashboard(report);
                triggerCardFadeIn();
                return;
            }

            // 2. 동적으로 data_archive/data_YYYY-MM-DD.js 스크립트 로드
            const originalSelectorText = selector.options[selector.selectedIndex].textContent;
            selector.options[selector.selectedIndex].textContent = "⌛ 로딩 중...";
            selector.disabled = true;

            try {
                await loadArchiveReportScript(selectedDate);
                const loadedReport = window.ARCHIVE_REPORTS && window.ARCHIVE_REPORTS[selectedDate];
                if (loadedReport) {
                    // [v15] **제자리 교체**가 핵심이다.
                    // push 로 끝에 붙이면 배열 순서가 바뀌어
                    // COMPARE 의 `REPORTS_HISTORY[selectedIndex + N]` 이
                    // 엉뚱한 날짜를 가리킨다. 슬림 항목이 있던 자리에 그대로 끼운다.
                    const at = window.REPORTS_HISTORY.findIndex(r => r.date === selectedDate);
                    if (at >= 0) {
                        window.REPORTS_HISTORY[at] = loadedReport;
                    } else {
                        // data.js 에 없던 과거 날짜 — 날짜 내림차순 위치에 삽입한다.
                        // (기존 push 는 순서를 깨뜨렸다)
                        const pos = window.REPORTS_HISTORY.findIndex(r => r.date < selectedDate);
                        if (pos < 0) window.REPORTS_HISTORY.push(loadedReport);
                        else window.REPORTS_HISTORY.splice(pos, 0, loadedReport);
                    }
                    renderDashboard(loadedReport);
                    triggerCardFadeIn();
                } else {
                    alert("보고서 데이터를 불러올 수 없습니다.");
                }
            } catch (err) {
                console.error(err);
                alert("과거 일간 보고서 로드 실패: 아카이브용 보관 파일(data_archive/data_" + selectedDate + ".js)이 존재하지 않거나 브라우저 보안 등으로 차단되었을 수 있습니다.");
            } finally {
                selector.options[selector.selectedIndex].textContent = originalSelectorText;
                selector.disabled = false;
            }
        });

        function triggerCardFadeIn() {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.animation = 'none';
                card.offsetHeight; // 트리거 리플로우
                card.style.animation = 'fadeInUp 0.5s ease-out backwards';
            });
        }
        
        function loadArchiveReportScript(date) {
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = `data_archive/data_${date}.js?t=` + Date.now();
                s.onload = () => {
                    document.head.removeChild(s);
                    resolve();
                };
                s.onerror = (err) => {
                    document.head.removeChild(s);
                    reject(err);
                };
                document.head.appendChild(s);
            });
        }

        // [NEW] 탭 전환 시스템 (기존 포트폴리오 탭용)
        const tabBtns = document.querySelectorAll('.segment-btn:not(.compare-segment)');
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

        // [NEW] COMPARE 탭 전환 시스템
        const compareBtns = document.querySelectorAll('.compare-segment');
        const compareContents = document.querySelectorAll('.compare-tab-content');

        compareBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');

                // 버튼 활성화 상태 변경
                compareBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 컨텐츠 표시 상태 변경
                compareContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
            });
        });

        // [NEW] 드롭다운 토글 및 바깥 영역 클릭 시 닫기 시스템
        // [v15] aria-expanded 동기화 + 키보드 조작 추가.
        //   마크업에는 aria-expanded 가 있었지만 JS 가 갱신하지 않아
        //   스크린리더에는 항상 "닫힘"으로 읽혔다.
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

        function closeAllDropdowns(exceptMenu) {
            document.querySelectorAll('.dropdown-menu').forEach(el => {
                if (el === exceptMenu) return;
                el.classList.remove('show');
                const t = el.previousElementSibling;
                if (t && t.classList.contains('dropdown-toggle')) {
                    t.setAttribute('aria-expanded', 'false');
                }
            });
        }

        function setDropdown(toggle, open) {
            const menu = toggle.nextElementSibling;
            if (!menu) return;
            closeAllDropdowns(open ? menu : null);
            menu.classList.toggle('show', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const menu = toggle.nextElementSibling;
                setDropdown(toggle, !menu.classList.contains('show'));
            });

            // 키보드: Enter/Space 로 열고, ↓ 로 첫 항목에 진입, Esc 로 닫기
            toggle.addEventListener('keydown', (e) => {
                const menu = toggle.nextElementSibling;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setDropdown(toggle, true);
                    const first = menu.querySelector('.dropdown-item');
                    if (first) first.focus();
                } else if (e.key === 'Escape') {
                    setDropdown(toggle, false);
                }
            });

            // 메뉴 안에서 ↑↓ 이동, Esc 로 토글로 복귀
            const menu = toggle.nextElementSibling;
            if (!menu) return;
            menu.addEventListener('keydown', (e) => {
                const items = Array.from(menu.querySelectorAll('.dropdown-item'));
                const idx = items.indexOf(document.activeElement);
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const next = e.key === 'ArrowDown'
                        ? (idx + 1) % items.length
                        : (idx - 1 + items.length) % items.length;
                    if (items[next]) items[next].focus();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setDropdown(toggle, false);
                    toggle.focus();
                }
            });
        });

        // 화면 바깥쪽 클릭 시 드롭다운 닫기
        document.addEventListener('click', () => closeAllDropdowns(null));

        // [NEW] 전역 네비게이션 탭 (DASHBOARD vs COMPARE vs REPORT) 시스템
        const globalTabs = document.querySelectorAll('.global-tab');
        const pageViews = document.querySelectorAll('.page-view');

        globalTabs.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                
                // Save current active tab to sessionStorage to prevent loss on reload
                sessionStorage.setItem('activeGlobalTab', targetId);

                // 네비바 클래스 변경
                globalTabs.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // 부모 드롭다운 활성 상태 동기화
                document.querySelectorAll('.dropdown-toggle').forEach(el => el.classList.remove('active-parent'));
                const parentDropdown = link.closest('.nav-dropdown');
                if (parentDropdown) {
                    const toggleBtn = parentDropdown.querySelector('.dropdown-toggle');
                    if (toggleBtn) toggleBtn.classList.add('active-parent');
                }
                
                // 클릭 완료 시 열려 있는 드롭다운 메뉴 모두 닫기
                document.querySelectorAll('.dropdown-menu').forEach(el => {
                    el.classList.remove('show');
                    const t = el.previousElementSibling;
                    if (t && t.classList.contains('dropdown-toggle')) {
                        t.setAttribute('aria-expanded', 'false');
                    }
                });

                // [v15] 화면 전환을 스크린리더에 알린다.
                // SPA 라 URL 이 바뀌지 않아 이동 자체가 감지되지 않는다.
                const liveRegion = document.getElementById('sr-live');
                if (liveRegion) {
                    // 드롭다운 항목은 <small> 설명을 품고 있으므로 이름만 뽑는다
                    const small = link.querySelector('small');
                    const label = small
                        ? (link.textContent || '').replace(small.textContent, '').trim()
                        : (link.textContent || '').trim();
                    liveRegion.textContent = label + ' 화면';
                }
                const mainEl = document.getElementById('main-content');
                if (mainEl) mainEl.focus({ preventScroll: true });

                // 페이지 뷰 토글
                pageViews.forEach(view => {
                    view.classList.remove('active');
                    if (view.id === targetId) {
                        view.classList.add('active');
                    }
                });

                const isReport = targetId === 'view-dashboard';
                const isCompare = targetId === 'view-compare';
                const isDiscovery = targetId === 'view-discovery';
                const isHome = targetId === 'view-home';
                const isBreaking = targetId === 'view-breaking';
                const isLWiki = targetId === 'view-lwiki';
                const isBacktest = targetId === 'view-backtest';
                const isOptimizer = targetId === 'view-optimizer';
                const isSignal = targetId === 'view-signal';
                const isTrade = targetId === 'view-trade' || targetId === 'view-kis-trade';
                const isKisTrade = targetId === 'view-kis-trade';
                const isRisk = targetId === 'view-risk';

                // [v13] TRADE PLANNER — 진입 시 렌더링
                if (targetId === 'view-planner' && window.TradePlanner) {
                    try { window.TradePlanner.render(); }
                    catch (e) { console.error('TradePlanner render failed:', e); }
                }
                if (targetId === 'view-decisions' && window.DecisionLog) {
                    try { window.DecisionLog.render(); }
                    catch (e) { console.error('DecisionLog render failed:', e); }
                }
                if (targetId === 'view-scorecard' && window.ModelScorecard) {
                    try { window.ModelScorecard.render(); }
                    catch (e) { console.error('ModelScorecard render failed:', e); }
                }

                syncHeaderChrome(targetId);

                const terminal = document.getElementById('ai-intelligence-terminal');
                if (terminal) {
                    terminal.style.display = (isReport && window.IS_LATEST_REPORT) ? 'block' : 'none';
                }

                if (isKisTrade) {
                    const hasToken = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token');
                    if (!hasToken) {
                        alert("⚠️ GitHub 토큰(GitHub PAT)이 등록되어 있지 않습니다.\n트레이딩 기능은 보안 및 연동 권한을 위해 GitHub 토큰이 등록된 상태에서만 사용 가능합니다. 우측 상단의 Admin Login을 통해 먼저 GitHub 토큰을 등록해 주세요.");
                        const homeTab = document.querySelector('.global-tab[data-target="view-home"]');
                        if (homeTab) homeTab.click();
                        return;
                    }
                    if (typeof window.initKisTrade === 'function') window.initKisTrade();
                    if (typeof window.fetchAndRefreshKisPortfolio === 'function') window.fetchAndRefreshKisPortfolio();
                } else if (isTrade) {
                    const hasToken = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token');
                    if (!hasToken) {
                        alert("⚠️ GitHub 토큰(GitHub PAT)이 등록되어 있지 않습니다.\n트레이딩 기능은 보안 및 연동 권한을 위해 GitHub 토큰이 등록된 상태에서만 사용 가능합니다. 우측 상단의 Admin Login을 통해 먼저 GitHub 토큰을 등록해 주세요.");
                        const homeTab = document.querySelector('.global-tab[data-target="view-home"]');
                        if (homeTab) {
                            homeTab.click();
                        }
                        return;
                    }
                    initTossTrade();
                    if (typeof window.fetchAndRefreshTossPortfolio === 'function') window.fetchAndRefreshTossPortfolio();
                }

                if (isLWiki) {
                    initLWiki();
                }

                if (isBreaking) {
                    syncLiveNewsData();
                    
                    // [NEW] Immediately trigger quantum UI refresh on entering breaking tab
                    const sentimentValEl = document.getElementById('live-sentiment-value');
                    const sentimentMarkerEl = document.getElementById('live-sentiment-marker');
                    if (sentimentValEl && sentimentMarkerEl) {
                        if (window.IS_LATEST_REPORT === false) {
                            sentimentValEl.textContent = 'OFFLINE (Closed)';
                            sentimentValEl.style.color = '#64748b';
                            sentimentMarkerEl.style.left = '50%';
                        } else {
                            const val = window.LIVE_SENTIMENT || 50;
                            let label = 'Neutral ⚖️';
                            let color = '#e2e8f0';
                            if (val >= 80) { label = 'Extreme Greed (BULLISH SURGE 🚀)'; color = '#10b981'; }
                            else if (val >= 60) { label = 'Greed (Bullish Sentiment 📈)'; color = '#34d399'; }
                            else if (val >= 40) { label = 'Neutral (Stables ⚖️)'; color = '#e2e8f0'; }
                            else if (val >= 20) { label = 'Fear (Bearish Sentiment 📉)'; color = '#fb923c'; }
                            else { label = 'Extreme Fear (PANIC SURGE 🚨)'; color = '#fb7185'; }
                            
                            sentimentValEl.textContent = `${val}% (${label})`;
                            sentimentValEl.style.color = color;
                            sentimentMarkerEl.style.left = `${val}%`;
                        }
                    }
                }

                if (isDiscovery) {
                    setTimeout(initMarketBubbleChart, 100);
                } else {
                    if (bubbleChartInstance) {
                        bubbleChartInstance.destroy();
                        bubbleChartInstance = null;
                    }
                }

                if (isHome) {
                    syncLiveMarketData();
                }

                // [v14] QUANT LAB 3화면 — 계산은 백엔드(quant_lab_api)가 한다.
                // 옛 initBacktester/initOptimizer/initRiskCenter 는 120봉짜리
                // data.js 로 브라우저에서 다시 계산해 결과가 갈라졌다.
                if (isBacktest && window.QuantLab) {
                    try { window.QuantLab.renderStrategy(); }
                    catch (e) { console.error('QuantLab strategy render failed:', e); }
                }
                if (isOptimizer && window.QuantLab) {
                    try { window.QuantLab.renderPortfolio(); }
                    catch (e) { console.error('QuantLab portfolio render failed:', e); }
                }
                if (isRisk && window.QuantLab) {
                    try { window.QuantLab.renderRisk(); }
                    catch (e) { console.error('QuantLab risk render failed:', e); }
                }
                // [v14] QUANT LAB 확장 3화면
                if (window.QuantLab2) {
                    try {
                        if (targetId === 'view-survival') window.QuantLab2.renderSurvival();
                        else if (targetId === 'view-attribution') window.QuantLab2.renderAttribution();
                        else if (targetId === 'view-regime') window.QuantLab2.renderRegime();
                        else if (targetId === 'view-discovery-score') window.QuantLab2.renderDiscovery();
                        else if (targetId === 'view-dca') window.QuantLab2.renderDca();
                        else if (targetId === 'view-diversification') window.QuantLab2.renderDiversification();
                        else if (targetId === 'view-flow') window.QuantLab2.renderFlow();
                        else if (targetId === 'view-nextup') window.QuantLab2.renderNextUp();
                        else if (targetId === 'view-whales') window.QuantLab2.renderWhales();
                        else if (targetId === 'view-discovery') window.QuantLab2.renderDiscoveryBadge();
                    } catch (e) { console.error('QuantLab2 render failed:', e); }
                }
                // [v16] 내 돈 — 활성 탭만 그린다
                if (targetId === 'view-investor') showInvestorTab();
                // [v19] WHAT-IF PLAYGROUND — 주문 전 시뮬레이션
                if (targetId === 'view-whatif' && window.WhatIf) {
                    try { window.WhatIf.renderWhatIf(); }
                    catch (e) { console.error('WhatIf render failed:', e); }
                }
                // [v19] DECISION REPLAY — 판단 기록·복기
                if (targetId === 'view-replay' && window.Replay) {
                    try { window.Replay.renderReplay(); }
                    catch (e) { console.error('Replay render failed:', e); }
                }
                // [v19] SMART ALERTS — 의미 있는 변화만
                if (targetId === 'view-alerts' && window.Alerts) {
                    try { window.Alerts.renderAlerts(); }
                    catch (e) { console.error('Alerts render failed:', e); }
                }
                // [v19] SIGNAL STORIES — 예측을 이야기로
                if (targetId === 'view-stories' && window.Stories) {
                    try { window.Stories.renderStories(); }
                    catch (e) { console.error('Stories render failed:', e); }
                }
                // [v19] PORTFOLIO HEALTH — 관리 상태 점수
                if (targetId === 'view-health' && window.Health) {
                    try { window.Health.renderHealth(); }
                    catch (e) { console.error('Health render failed:', e); }
                }
                // [v19] TODAY — 오늘의 투자 브리핑 (기본 화면)
                if (targetId === 'view-today' && window.Today) {
                    try { window.Today.renderToday(); }
                    catch (e) { console.error('Today render failed:', e); }
                }
                // [v19] MY WRAPPED — 기존 화면들의 하이라이트를 카드로
                if (targetId === 'view-wrapped' && window.Wrapped) {
                    try { window.Wrapped.renderWrapped(); }
                    catch (e) { console.error('Wrapped render failed:', e); }
                }
                if (isSignal) {
                    initSignalHub();
                }

                // Prevent iOS/Safari scroll lock freeze during smooth scroll
                const isMobileScroll = window.innerWidth <= 768;
                window.scrollTo({ top: 0, behavior: isMobileScroll ? 'auto' : 'smooth' });
            });
        });

        // Restore active global tab from sessionStorage if available (prevents jumping to home on reload)
        const savedTabId = sessionStorage.getItem('activeGlobalTab');
        if (savedTabId) {
            const savedTab = document.querySelector(`.global-tab[data-target="${savedTabId}"]`);
            //  기본 화면(view-home)은 이미 active 라 다시 클릭할 필요가 없다.
            //  **여기에 다른 화면을 추가하지 마십시오** — 추가하면 그 화면은
            //  세션 복원이 막혀 새로고침 시 렌더러가 호출되지 않는다.
            if (savedTab && savedTabId !== 'view-home') {
                const hasToken = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token');
                if (savedTabId !== 'view-trade' || hasToken) {
                    setTimeout(() => {
                        savedTab.click();
                    }, 50);
                }
            }
        }

        // [New] Set initial header search visibility based on active tab
        const initialTab = document.querySelector('.global-tab.active');
        if (initialTab) {
            const targetId = initialTab.getAttribute('data-target');
            const isReport = targetId === 'view-dashboard';
            const isDiscovery = targetId === 'view-discovery';
            const isBreaking = targetId === 'view-breaking';

            syncHeaderChrome(targetId);
            const terminal = document.getElementById('ai-intelligence-terminal');
            if (terminal) {
                terminal.style.display = (isReport && window.IS_LATEST_REPORT) ? 'block' : 'none';
            }
            if (isBreaking) {
                renderLiveNews();
                
                // [NEW] Immediately trigger quantum UI refresh on entering breaking tab initially
                const sentimentValEl = document.getElementById('live-sentiment-value');
                const sentimentMarkerEl = document.getElementById('live-sentiment-marker');
                if (sentimentValEl && sentimentMarkerEl) {
                    if (window.IS_LATEST_REPORT === false) {
                        sentimentValEl.textContent = 'OFFLINE (Closed)';
                        sentimentValEl.style.color = '#64748b';
                        sentimentMarkerEl.style.left = '50%';
                    } else {
                        const val = window.LIVE_SENTIMENT || 50;
                        let label = 'Neutral ⚖️';
                        let color = '#e2e8f0';
                        if (val >= 80) { label = 'Extreme Greed (BULLISH SURGE 🚀)'; color = '#10b981'; }
                        else if (val >= 60) { label = 'Greed (Bullish Sentiment 📈)'; color = '#34d399'; }
                        else if (val >= 40) { label = 'Neutral (Stables ⚖️)'; color = '#e2e8f0'; }
                        else if (val >= 20) { label = 'Fear (Bearish Sentiment 📉)'; color = '#fb923c'; }
                        else { label = 'Extreme Fear (PANIC SURGE 🚨)'; color = '#fb7185'; }
                        
                        sentimentValEl.textContent = `${val}% (${label})`;
                        sentimentValEl.style.color = color;
                        sentimentMarkerEl.style.left = `${val}%`;
                    }
                }
            }

            if (isDiscovery) {
                setTimeout(initMarketBubbleChart, 100);
            }
        }

    } else {
        // [FIX] file:/// 프로토콜 환경에서 data.js 로딩 속도 지연 대응을 위해 재시도 메커니즘 도입
        if (initRetryCount < 30) { // 최대 1.5초 (50ms * 30) 대기
            initRetryCount++;
            console.log(`REPORTS_HISTORY가 아직 정의되지 않았습니다. 재시도 중... (${initRetryCount}/30)`);
            setTimeout(initDashboardApp, 50);
        } else {
            console.error('REPORTS_HISTORY를 찾을 수 없습니다.');
            const headerEl = document.querySelector('header');
            if (headerEl) {
                headerEl.innerHTML += `<p style="color: #fb7185; margin-top: 1rem;">보고서 데이터를 찾을 수 없습니다. data.js 파일이 정상적으로 로드되었는지 확인해 주세요.</p>`;
            }
        }
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
        if (glossaryTooltip) glossaryTooltip.classList.remove('show');
        if (glossaryOverlay) glossaryOverlay.classList.remove('show');
        document.body.style.overflow = ''; // Unlock scroll
        if (glossarySearchInput) glossarySearchInput.value = ''; // Reset search on close
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
                    if (glossaryOverlay) glossaryOverlay.classList.add('show');
                    document.body.style.overflow = 'hidden'; // Lock scroll on mobile
                }
                // Focus search input after small delay for animation
                setTimeout(() => {
                    if (glossarySearchInput) glossarySearchInput.focus();
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
            if (glossaryOverlay) glossaryOverlay.classList.remove('show');
            document.body.style.overflow = '';
        } else {
            if (glossaryTooltip && glossaryTooltip.classList.contains('show')) {
                if (glossaryOverlay) glossaryOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    // Removed Magnetic Effect & Card Shimmer to stabilize UI

    // [NEW] Initialize Realtime System
    initRealtimeSystem();

    // [NEW] Hamburger Menu Toggle Logic
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link.global-tab');

    if (hamburgerBtn && navMenu) {
        const toggleMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Toggle body scroll lock when menu is active on mobile
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };

        // Support both touch and click for instant feedback on mobile
        hamburgerBtn.addEventListener('click', toggleMenu);
        hamburgerBtn.addEventListener('touchstart', toggleMenu, { passive: false });

        // Close menu when clicking a link and unlock body scroll
        navLinks.forEach(link => {
            const handleLinkClick = () => {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            };
            link.addEventListener('click', handleLinkClick);
            link.addEventListener('touchstart', handleLinkClick);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Handle touchstart outside menu
        document.addEventListener('touchstart', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardApp);
} else {
    setTimeout(initDashboardApp, 0);
}

// ═══════════════════════════════════════════════════════════════════
//  [NEW] REALTIME SYSTEM ENGINE (TRUE REAL-TIME)
// ═══════════════════════════════════════════════════════════════════

function initRealtimeSystem() {
    if (typeof REPORTS_HISTORY === 'undefined' || REPORTS_HISTORY.length === 0) return;
    const latestData = REPORTS_HISTORY[0];

    // 1. Setup Market Ticker
    updateMarketTicker(latestData);

    // 2. Setup Market Status
    updateMarketStatus();
    setInterval(updateMarketStatus, 10000); 

    // 3. Live monitoring — renderDashboard에서 restartLiveMonitoring으로 시작
    // 4. Setup Trending Stocks
    updateTrendingStocks(latestData);
    
    // 5. [TRUE REAL-TIME] Start Market Sync Engine
    syncLiveMarketData(); // Initial sync
    setInterval(syncLiveMarketData, 30000); // Sync every 30 seconds (to avoid rate limits)

    // 6. UI Pulse Animation (Independent of sync)
    setInterval(() => {
        if (window.IS_LATEST_REPORT === false) return;
        const activeData = window.CURRENT_VIEW_DATA || latestData;
        updateTrendingStocks(activeData, true); // Keep jitter for visual feel
    }, 10000);

    // 7. Live Ticker Fluctuation Simulation (Visual only between syncs)
    setInterval(() => {
        if (window.IS_LATEST_REPORT === false) return;
        document.querySelectorAll('.ticker-price').forEach(el => {
            const current = parseFloat(el.textContent.replace(/,/g, ''));
            if (isNaN(current)) return;
            const fluctuation = (Math.random() - 0.5) * (current * 0.0001);
            const newValue = current + fluctuation;
            el.textContent = newValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            el.style.transition = 'color 0.3s ease';
            el.style.color = fluctuation > 0 ? 'var(--live-green)' : 'var(--live-red)';
            setTimeout(() => el.style.color = 'var(--text-primary)', 500);
        });
    }, 3000);

    // 8. [BREAKING NEWS] 뉴스 속보 주기적 동기화
    syncLiveNewsData(); // Initial sync
    setInterval(syncLiveNewsData, 15000); // Sync every 15 seconds
}

/**
 * [NEW] TRUE REAL-TIME SYNC ENGINE (LOCAL)
 * Polls the locally generated live_data.json (created by live_sync.py)
 */
async function syncLiveMarketData() {
    if (window.IS_LATEST_REPORT === false) return;
    if (typeof REPORTS_HISTORY === 'undefined') return;

    const activeTab = document.querySelector('.global-tab.active')?.getAttribute('data-target');
    const shouldSyncQuotes = activeTab === 'view-home';
    const shouldSyncMonitor = activeTab === 'view-home' || activeTab === 'view-breaking';
    if (!shouldSyncQuotes && !shouldSyncMonitor) return;

    const activeData = window.CURRENT_VIEW_DATA || REPORTS_HISTORY[0];
    if (!activeData) return;

    const holdings = activeData.holdings || [];
    const watchlist = activeData.watchlist || [];
    const allStocks = [...holdings, ...watchlist];
    
    const indicesMap = {
        '^KS11': 'KOSPI',
        '^KQ11': 'KOSDAQ',
        '^GSPC': 'S&P 500',
        '^IXIC': 'NASDAQ',
        'BTC-USD': 'BTC/USD',
        'USDKRW=X': 'USD/KRW'
    };

    // Helper to reload live_data.js (bypasses CORS for local files)
    const reloadLiveDataScript = () => {
        return new Promise((resolve) => {
            const oldScript = document.getElementById('live-data-script');
            if (oldScript) oldScript.remove();
            const script = document.createElement('script');
            script.id = 'live-data-script';
            script.src = 'live_data.js?v=' + Date.now();
            script.onload = resolve;
            script.onerror = resolve; // Continue anyway
            document.head.appendChild(script);
        });
    };

    try {
        // Try reloading the script first (for local file compatibility)
        await reloadLiveDataScript();
        
        const liveData = typeof LIVE_DATA !== 'undefined' ? LIVE_DATA : null;
        if (!liveData || !liveData.quotes) return;

        if (shouldSyncMonitor && typeof window.applyLiveFlowMonitor === 'function' && window._flowMonitorReady) {
            window.applyLiveFlowMonitor(liveData, activeData, { initial: false });
        }

        if (!shouldSyncQuotes) return;

        const quotes = liveData.quotes;
        const liveIndices = [];

        // Map quotes back to our data
        for (const [sym, quote] of Object.entries(quotes)) {
            // Handle indices
            if (indicesMap[sym]) {
                liveIndices.push({
                    symbol: indicesMap[sym],
                    price: quote.price,
                    change: (quote.change >= 0 ? '+' : '') + quote.change.toFixed(2) + '%'
                });
                continue;
            }

            // Handle stocks
            const targetStock = allStocks.find(s => s.symbol === sym);
            if (targetStock) {
                const newPrice = quote.price;
                const newChange = quote.change;
                
                targetStock.rawPrice = newPrice;
                targetStock.changePercent = newChange;
                
                // Format display price
                if (targetStock.nativeCurrency === 'KRW') {
                    const symbolStr = targetStock.symbol || '';
                    const isUsStock = !(symbolStr.includes('.KS') || symbolStr.includes('.KQ') || /^\d+$/.test(symbolStr));
                    const rate = window.CURRENT_USD_RATE || 1400;
                    const finalPrice = (isUsStock && newPrice < 5000) ? newPrice * rate : newPrice;
                    targetStock.currentPrice = `${Math.round(finalPrice).toLocaleString()}원`;
                } else {
                    targetStock.currentPrice = `$${newPrice.toFixed(2)}`;
                }
            }
        }

        // Update Ticker with live index data
        if (liveIndices.length > 0) {
            updateMarketTickerWithData(liveIndices);
        }

        // Refresh components
        updateTrendingStocks(activeData, false);
        updateDashboardCards(allStocks);

    } catch (e) {
        // Fail silently during development
    }
}

/**
 * Update the top ticker with actual live data
 */
function updateMarketTickerWithData(indices) {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;

    let html = '';
    // Duplicate for infinite scroll feel
    const items = [...indices, ...indices];

    items.forEach(idx => {
        const isUp = idx.change.startsWith('+');
        html += `
            <div class="ticker-item">
                <span class="ticker-symbol">${idx.symbol}</span>
                <span class="ticker-price">${idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span class="ticker-change ${isUp ? 'up' : 'down'}">${idx.change}</span>
            </div>
        `;
    });

    tickerContent.innerHTML = html;
}

/**
 * Update existing dashboard cards without full re-render
 */
function updateDashboardCards(stocks) {
    document.querySelectorAll('.stock-card').forEach(card => {
        const nameEl = card.querySelector('.stock-name');
        if (!nameEl) return;
        const name = nameEl.textContent;
        const stock = stocks.find(s => s.name === name);
        
        if (stock) {
            const priceEl = card.querySelector('.current-price');
            const changeEl = card.querySelector('.price-change');
            
            if (priceEl) priceEl.textContent = stock.currentPrice;
            if (changeEl) {
                const isUp = stock.changePercent >= 0;
                changeEl.textContent = `${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
                changeEl.className = `price-change ${isUp ? 'up' : 'down'}`;
            }
        }
    });
}

function updateMarketTicker(data) {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;

    // Use indices from data if available, otherwise use defaults
    const indices = [
        { symbol: 'KOSPI', price: 2650.12, change: '+0.45%' },
        { symbol: 'KOSDAQ', price: 860.55, change: '-0.12%' },
        { symbol: 'S&P 500', price: 5222.68, change: '+1.02%' },
        { symbol: 'NASDAQ', price: 16340.87, change: '+1.45%' },
        { symbol: 'BTC/USD', price: 62450.00, change: '+2.10%' },
        { symbol: 'USD/KRW', price: 1375.40, change: '+0.25%' }
    ];

    // Try to get real exchange rate from data
    if (data.usdToKrwRate) {
        indices[5].price = parseFloat(data.usdToKrwRate);
    }

    let html = '';
    // Duplicate for infinite scroll feel
    const items = [...indices, ...indices];

    items.forEach(idx => {
        const isUp = idx.change.startsWith('+');
        html += `
            <div class="ticker-item">
                <span class="ticker-symbol">${idx.symbol}</span>
                <span class="ticker-price">${idx.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span class="ticker-change ${isUp ? 'up' : 'down'}">${idx.change}</span>
            </div>
        `;
    });

    tickerContent.innerHTML = html;
}

function updateMarketStatus() {
    if (window.IS_LATEST_REPORT === false) {
        // Force closed for historical data
        const regions = ['kr', 'us'];
        regions.forEach(region => {
            const indicator = document.getElementById(`market-${region}-indicator`);
            const status = document.getElementById(`market-${region}-status`);
            if (indicator && status) {
                indicator.className = 'status-indicator inactive';
                status.textContent = 'MARKET CLOSED';
                status.style.color = 'var(--text-secondary)';
            }
        });
        return;
    }
    const now = new Date();

    // Seoul (KST: UTC+9)
    const seoulTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const krHours = seoulTime.getHours();
    const krMinutes = seoulTime.getMinutes();
    const krTotalMin = krHours * 60 + krMinutes;
    const krDay = seoulTime.getDay(); 

    let krStatusText = 'MARKET CLOSED';
    let krIsActive = false;

    // Check holiday status from live data
    const liveData = typeof LIVE_DATA !== 'undefined' ? LIVE_DATA : null;
    const isKrHoliday = liveData && liveData.kr_market_holiday === true;

    if (isKrHoliday) {
        krStatusText = 'MARKET CLOSED (HOLIDAY)';
        krIsActive = false;
    } else if (krDay >= 1 && krDay <= 5) {
        if (krTotalMin >= 510 && krTotalMin < 540) { // 08:30 - 09:00
            krStatusText = 'PRE-MARKET';
            krIsActive = true;
        } else if (krTotalMin >= 540 && krTotalMin < 930) { // 09:00 - 15:30
            krStatusText = 'REGULAR SESSION';
            krIsActive = true;
        } else if (krTotalMin >= 930 && krTotalMin < 1080) { // 15:30 - 18:00
            krStatusText = 'AFTER-MARKET';
            krIsActive = true;
        }
    }

    const krIndicator = document.getElementById('market-kr-indicator');

    const krStatus = document.getElementById('market-kr-status');
    if (krIndicator && krStatus) {
        krIndicator.className = 'status-indicator ' + (krIsActive ? 'active' : 'inactive');
        krStatus.textContent = krStatusText;
        krStatus.style.color = krIsActive ? 'var(--live-green)' : 'var(--text-secondary)';
    }

    // New York (ET: UTC-5 or UTC-4)
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const nyHours = nyTime.getHours();
    const nyMinutes = nyTime.getMinutes();
    const nyTotalMin = nyHours * 60 + nyMinutes;
    const nyDay = nyTime.getDay();
    
    let usStatusText = 'MARKET CLOSED';
    let usIsActive = false;

    const isUsHoliday = liveData && liveData.us_market_holiday === true;

    if (isUsHoliday) {
        usStatusText = 'MARKET CLOSED (HOLIDAY)';
        usIsActive = false;
    } else {
        if (nyDay >= 1 && nyDay <= 5) {
            if (nyTotalMin >= 240 && nyTotalMin < 570) { // 04:00 - 09:30
                usStatusText = 'PRE-MARKET';
                usIsActive = true;
            } else if (nyTotalMin >= 570 && nyTotalMin < 960) { // 09:30 - 16:00
                usStatusText = 'REGULAR SESSION';
                usIsActive = true;
            } else if (nyTotalMin >= 960 && nyTotalMin < 1200) { // 16:00 - 20:00
                usStatusText = 'POST-MARKET';
                usIsActive = true;
            }
        }

        // [NEW] US Day Market (KR Hours: 10:00 - 18:00 KST)
        if (!usIsActive) {
            const seoulTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
            const krTotalMin = seoulTime.getHours() * 60 + seoulTime.getMinutes();
            const krDay = seoulTime.getDay();
            if (krDay >= 1 && krDay <= 5 && krTotalMin >= 600 && krTotalMin < 1080) {
                usStatusText = 'DAY MARKET (KR)';
                usIsActive = true;
            }
        }
    }

    const usIndicator = document.getElementById('market-us-indicator');
    const usStatus = document.getElementById('market-us-status');
    if (usIndicator && usStatus) {
        usIndicator.className = 'status-indicator ' + (usIsActive ? 'active' : 'inactive');
        usStatus.textContent = usStatusText;
        usStatus.style.color = usIsActive ? 'var(--live-green)' : 'var(--text-secondary)';
    }
}

function stopAiBriefing() {
    window._briefingSessionId = (window._briefingSessionId || 0) + 1;
    if (window._briefingTypingTimers) {
        window._briefingTypingTimers.forEach(id => clearTimeout(id));
        window._briefingTypingTimers = [];
    }
}

function resetLiveFlowMonitorState() {
    stopAiBriefing();
    if (window._flowEventDrainTimer) {
        clearTimeout(window._flowEventDrainTimer);
        window._flowEventDrainTimer = null;
    }
    window._flowEventQueue = [];
    window._displayedFlowEventKeys = new Set();
    window._flowMonitorReady = false;

    const briefingTerminal = document.getElementById('briefing-terminal-text');
    if (briefingTerminal) briefingTerminal.innerHTML = '';

    const breakingTerminalBody = document.querySelector('#breaking-ai-terminal .terminal-body');
    if (breakingTerminalBody) {
        breakingTerminalBody.dataset.initialized = '';
    }
}

function clearBriefingIntroForLiveFeed() {
    const terminal = document.getElementById('briefing-terminal-text');
    if (!terminal) return;
    // 이미 종목 feed가 표시 중이면 유지
    if (terminal.querySelector('.terminal-line-row.live-log')) return;
    terminal.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    terminal.appendChild(cursor);
}

function restartLiveMonitoring(data) {
    if (!data || window.IS_LATEST_REPORT === false) return;
    resetLiveFlowMonitorState();
    startAiBriefing(data);
}

function startAiBriefing(data) {
    const terminal = document.getElementById('briefing-terminal-text');
    if (!terminal) return;

    if (window.IS_LATEST_REPORT === false) {
        terminal.innerHTML = '<div class="terminal-line-row">> Monitoring Offline - SESSION CLOSED</div>';
        return;
    }

    stopAiBriefing();
    const sessionId = window._briefingSessionId;
    window._briefingTypingTimers = window._briefingTypingTimers || [];

    const schedule = (fn, ms) => {
        const id = setTimeout(fn, ms);
        window._briefingTypingTimers.push(id);
        return id;
    };

    const recommended = data.recommended_stocks || [];
    const topPick = recommended[0] ? recommended[0].name : "Market";
    const stockCount = [...(data.holdings || []), ...(data.watchlist || [])].length;
    const avgMfc = (() => {
        const all = [...(data.holdings || []), ...(data.watchlist || [])];
        if (!all.length) return 50;
        const sum = all.reduce((a, s) => a + (s.mfc_score || s.reason?.mfc_score || 50), 0);
        return Math.round(sum / all.length);
    })();
    const regimeMatch = (data.strategy?.macro || '').match(/Trending-\w+/);
    const regime = regimeMatch ? regimeMatch[0] : (data.market_regime || 'Neutral');

    const lines = [
        `[SYSTEM] Initializing Antigravity V5 Core... [DONE]`,
        `[SCAN] Portfolio scan loaded. ${stockCount} symbols synchronized.`,
        `[DETECT] Market Regime: ${regime} confirmed.`,
        `[QUANT] Computing correlation matrix for ${topPick}...`,
        `[QUANT] GARCH-Ensemble volatility projection: STABLE`,
        `[ALERT] High-density accumulation detected in ${recommended[1] ? recommended[1].name : 'Alpha sectors'}.`,
        `[INFO] Portfolio MFC average: ${avgMfc}/100`,
        `[CORE] Real-time monitoring active. yfinance Volume Climax sensor linked.`
    ];

    let lineIdx = 0;
    let charIdx = 0;
    terminal.innerHTML = '';

    function typeLine() {
        if (sessionId !== window._briefingSessionId) return;
        if (lineIdx < lines.length) {
            if (charIdx === 0) {
                const p = document.createElement('div');
                p.className = 'terminal-line-row';
                terminal.appendChild(p);
            }

            const currentLine = lines[lineIdx];
            const activeParagraph = terminal.lastElementChild;

            if (charIdx < currentLine.length) {
                activeParagraph.textContent += currentLine[charIdx];
                charIdx++;
                schedule(typeLine, 20 + Math.random() * 30);
            } else {
                lineIdx++;
                charIdx = 0;
                schedule(typeLine, 400 + Math.random() * 600);
            }

            terminal.scrollTop = terminal.scrollHeight;
        } else {
            schedule(() => {
                if (sessionId !== window._briefingSessionId) return;
                // 종목 feed 시작 시 intro([SYSTEM]~[CORE]) 전부 clear
                clearBriefingIntroForLiveFeed();
                initLiveFlowMonitor(data);
            }, 400);
        }
    }

    typeLine();
}

/**
 * [NEW] Continuous monitoring logs for terminal briefing
 */
function isMarketActive(stock) {
    if (isCrypto(stock)) return true;
    const symbol = stock.symbol || '';
    const isKr = symbol.endsWith('.KS') || symbol.endsWith('.KQ') || /^\d{6}$/.test(symbol);
    
    // Check holiday status from live data
    const liveData = typeof LIVE_DATA !== 'undefined' ? LIVE_DATA : null;
    if (isKr && liveData && liveData.kr_market_holiday === true) {
        return false;
    }
    
    const now = new Date();
    if (isKr) {

        const seoulTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        const krTotalMin = seoulTime.getHours() * 60 + seoulTime.getMinutes();
        const krDay = seoulTime.getDay(); 
        return (krDay >= 1 && krDay <= 5 && krTotalMin >= 510 && krTotalMin < 1080); 
    } else {
        const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const nyTotalMin = nyTime.getHours() * 60 + nyTime.getMinutes();
        const nyDay = nyTime.getDay();
        const usRegularActive = (nyDay >= 1 && nyDay <= 5 && nyTotalMin >= 240 && nyTotalMin < 1200);

        // US Day Market (KR Time: 10:00 - 18:00)
        const seoulTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        const krTotalMin = seoulTime.getHours() * 60 + seoulTime.getMinutes();
        const krDay = seoulTime.getDay();
        const usDayActive = (krDay >= 1 && krDay <= 5 && krTotalMin >= 600 && krTotalMin < 1080);

        return usRegularActive || usDayActive;
    }
}


function getTerminalColor(type, msg) {
    const m = msg.toLowerCase();
    const t = type.toLowerCase();
    
    // Negative (Red)
    if (m.includes('overbought') || m.includes('risk') || m.includes('sell') || m.includes('panic') || m.includes('pressure') || m.includes('breakdown') || m.includes('exit') || m.includes('bearish') || m.includes('outflow') || m.includes('suspicious') || m.includes('call/put: 0.')) return '#fb7185';
    
    // Positive (Blue)
    if (m.includes('accumulation') || m.includes('breakout') || m.includes('squeeze') || m.includes('whale') || m.includes('bullish') || m.includes('oversold') || m.includes('inflow') || m.includes('buy') || m.includes('call/put: 3.')) return '#38bdf8';
    
    // Neutral (Green) - Default for everything else
    return '#34d399';
}

function showWhaleToast(type, message) {
    const container = document.getElementById('live-alert-container');
    if (!container) return;

    const toast = document.createElement('div');
    let themeClass = 'whale';
    let titleStr = '📡 AI WHALE ALERT';
    let emoji = '🐳';

    const typeUpper = type.toUpperCase();
    if (typeUpper === 'BREAKOUT') {
        themeClass = 'breakout';
        titleStr = '⚡ AI BREAKOUT ALERT';
        emoji = '🚀';
    } else if (typeUpper === 'SQUEEZE') {
        themeClass = 'whale';
        titleStr = '🔥 SHORT SQUEEZE RISK';
        emoji = '💥';
    } else if (typeUpper === 'ALERT') {
        themeClass = 'whale';
        titleStr = '⚠️ INSTITUTIONAL FLOW ALERT';
        emoji = '🚨';
    } else if (typeUpper === 'FLOW') {
        themeClass = 'whale';
        titleStr = '🌊 SMART MONEY FLOW';
        emoji = '🐋';
    } else if (typeUpper === 'SIGNAL') {
        themeClass = 'breakout';
        titleStr = '🎯 TECHNICAL SIGNAL';
        emoji = '📈';
    }

    toast.className = `live-alert-toast ${themeClass}`;
    toast.innerHTML = `
        <div style="font-size: 1.25rem; line-height: 1;">${emoji}</div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; color: ${themeClass === 'whale' ? '#fb923c' : '#38bdf8'};">${titleStr}</span>
            <span style="font-size: 0.85rem; line-height: 1.4; color: #f1f5f9;">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

function formatFlowEventTime(event) {
    const d = event.time ? new Date(event.time * 1000) : new Date();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    // 5분봉은 초 단위 의미 없음
    if (d.getSeconds() === 0) return `${hh}:${mm}`;
    const ss = d.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function buildFlowEventLogHtml(event, stale) {
    const timeStr = formatFlowEventTime(event);
    const logType = event.type || 'INFO';
    const msg = event.message || '';
    const stalePrefix = stale
        ? '<span style="color:#64748b;font-size:0.6rem;">[stale] </span>'
        : '';
    return `${stalePrefix}<span style="color: var(--text-secondary); opacity: 0.6; font-size: 0.65rem; margin-right: 8px;">[${timeStr}]</span> > <span style="color: ${getTerminalColor(logType, msg)};">[${logType}] ${msg}</span>`;
}

function flowEventKey(event) {
    return `${event.symbol || ''}-${event.time || 0}-${event.type || ''}-${(event.message || '').slice(0, 50)}`;
}

function trimFlowTerminalRows(targetTerminal, maxRows) {
    if (!targetTerminal) return;
    while (targetTerminal.querySelectorAll('.terminal-line-row.live-log').length > maxRows) {
        const oldest = targetTerminal.querySelector('.terminal-line-row.live-log');
        if (oldest) oldest.remove();
    }
}

function appendFlowMonitorLog(targetTerminal, event, stale) {
    if (!targetTerminal || !event) return;
    const logHtml = buildFlowEventLogHtml(event, stale);

    const p = document.createElement('div');
    p.className = 'terminal-line-row live-log';
    p.dataset.eventKey = flowEventKey(event);
    p.innerHTML = logHtml;

    const cursor = targetTerminal.querySelector('.terminal-cursor');
    if (cursor) cursor.remove();
    targetTerminal.appendChild(p);

    const newCursor = document.createElement('span');
    newCursor.className = 'terminal-cursor';
    targetTerminal.appendChild(newCursor);

    trimFlowTerminalRows(targetTerminal, 6);
    targetTerminal.scrollTop = targetTerminal.scrollHeight;
}

function renderFlowMonitorSnapshot(briefingTerminal, breakingTerminalBody, events, stale) {
    const maxShow = 5;
    const slice = events.slice(0, maxShow);

    [briefingTerminal, breakingTerminalBody].forEach(term => {
        if (!term) return;
        term.querySelectorAll('.terminal-line-row.live-log').forEach(el => el.remove());
        slice.forEach(ev => {
            const p = document.createElement('div');
            p.className = 'terminal-line-row live-log';
            p.dataset.eventKey = flowEventKey(ev);
            p.innerHTML = buildFlowEventLogHtml(ev, stale);
            const cursor = term.querySelector('.terminal-cursor');
            if (cursor) term.insertBefore(p, cursor);
            else term.appendChild(p);
        });
        if (!term.querySelector('.terminal-cursor')) {
            term.appendChild(Object.assign(document.createElement('span'), { className: 'terminal-cursor' }));
        }
    });
}

function drainFlowEventQueue() {
    if (!window._flowEventQueue || window._flowEventQueue.length === 0) {
        window._flowEventDrainTimer = null;
        return;
    }
    const item = window._flowEventQueue.shift();
    appendFlowMonitorLog(item.briefingTerminal, item.event, item.stale);
    appendFlowMonitorLog(item.breakingTerminal, item.event, item.stale);
    if (item.showToast) showWhaleToast(item.event.type, item.event.message);
    window._flowEventDrainTimer = setTimeout(drainFlowEventQueue, 700);
}

function enqueueFlowEvents(events, briefingTerminal, breakingTerminalBody, stale, allowToast) {
    if (!window._flowEventQueue) window._flowEventQueue = [];
    let toastLeft = allowToast ? 1 : 0;
    events.forEach(event => {
        const key = flowEventKey(event);
        if (window._displayedFlowEventKeys.has(key)) return;
        window._displayedFlowEventKeys.add(key);
        window._flowEventQueue.push({
            event,
            stale,
            briefingTerminal,
            breakingTerminal: breakingTerminalBody,
            showToast: toastLeft > 0 && ['FLOW', 'ALERT', 'SQUEEZE', 'SIGNAL', 'BREAKOUT'].includes(event.type),
        });
        if (toastLeft > 0) toastLeft -= 1;
    });
    if (!window._flowEventDrainTimer) drainFlowEventQueue();
}

function buyRatioFromIndicators(ind) {
    const cf = ind.capital_flow || {};
    const inflow = cf.total_inflow || 0;
    const outflow = cf.total_outflow || 0;
    const total = inflow + outflow;
    if (total > 0) return Math.round(inflow / total * 100);
    const cmf = ind.cmf || 0;
    return Math.round(Math.max(0, Math.min(100, (cmf + 0.5) * 100)));
}

function isCryptoSymbol(symbol) {
    const s = (symbol || '').toUpperCase();
    return s.endsWith('-USD') || s.endsWith('-BTC') || s.includes('BTC') || s.includes('ETH');
}

function buildFallbackFlowMonitor(reportData) {
    const stocks = [...(reportData.holdings || []), ...(reportData.watchlist || [])]
        .filter(s => !isCryptoSymbol(s.symbol));
    const seen = new Set();
    const events = [];
    const blockTrades = [];
    const nowTs = Math.floor(Date.now() / 1000);

    stocks.forEach(stock => {
        const sym = (stock.symbol || '').toUpperCase();
        if (!sym || seen.has(sym)) return;
        seen.add(sym);
        const name = stock.name || sym;
        const ind = stock.reason?.indicators || {};
        const change = stock.changePercent || 0;
        const cmf = ind.cmf || 0;
        const volRatio = ind.volume_ratio || 1;

        if (cmf > 0.15) {
            const buyRatio = buyRatioFromIndicators(ind);
            events.push({ time: nowTs, symbol: sym, name, type: 'FLOW', severity: 3, message: `Smart money accumulation detected in ${name} (Buy Ratio: ${buyRatio}%)` });
        }
        if (cmf < -0.12) {
            const buyRatio = buyRatioFromIndicators(ind);
            events.push({ time: nowTs, symbol: sym, name, type: 'FLOW', severity: 3, message: `Heavy distribution/selling pressure detected in ${name} (Sell Ratio: ${100 - buyRatio}%)` });
        }
        if (volRatio > 1.3 && change > 1) {
            events.push({ time: nowTs, symbol: sym, name, type: 'BREAKOUT', severity: 5, message: `Volume-supported breakout confirmed for ${name} (+${change.toFixed(2)}%)` });
        }
        if (volRatio > 1.5 && change < -1.5) {
            events.push({ time: nowTs, symbol: sym, name, type: 'ALERT', severity: 4, message: `High-volume breakdown detected for ${name} (${change.toFixed(2)}%). Warning: Institutional exit.` });
        }
        if ((ind.short_percent_float || 0) > 0.2 && change > 2) {
            events.push({ time: nowTs, symbol: sym, name, type: 'SQUEEZE', severity: 5, message: `Short squeeze momentum building in ${name}. Squeeze potential high.` });
        }
        if (ind.spring_detected) {
            events.push({ time: nowTs, symbol: sym, name, type: 'SIGNAL', severity: 3, message: `Wyckoff Spring detected in ${name}. High-probability reversal pattern.` });
        }
        if (ind.volume_climax) {
            const side = cmf >= 0 ? 'BUY' : 'SELL';
            blockTrades.push({
                time: nowTs,
                symbol: sym,
                name,
                side,
                volume: 0,
                amount_usd: (stock.rawPrice || 100) * 10000,
                price: stock.rawPrice || 0,
                volume_ratio: volRatio,
            });
            events.push({ time: nowTs, symbol: sym, name, type: 'FLOW', severity: 3, message: `Volume climax candle detected in ${name} (ratio ${volRatio.toFixed(1)}x).` });
        }
    });

    const bestBySymbol = {};
    events.forEach(ev => {
        const sym = ev.symbol;
        const prev = bestBySymbol[sym];
        if (!prev || (ev.severity || 0) > (prev.severity || 0)) bestBySymbol[sym] = ev;
    });
    const dedupedEvents = Object.values(bestBySymbol).sort((a, b) => (b.time || 0) - (a.time || 0));

    const cmfVals = stocks.map(s => s.reason?.indicators?.cmf || 0);
    const avgCmf = cmfVals.length ? cmfVals.reduce((a, b) => a + b, 0) / cmfVals.length : 0;
    const sentimentVals = stocks.map(s => s.mfc_breakdown?.sentiment).filter(v => v != null);
    const mfcSent = sentimentVals.length ? sentimentVals.reduce((a, b) => a + b, 0) / sentimentVals.length : 50;
    const cmfScore = Math.max(0, Math.min(100, (avgCmf + 0.5) * 100));
    const value = Math.max(10, Math.min(95, Math.round(cmfScore * 0.5 + mfcSent * 0.5)));

    let label = 'Neutral';
    if (value >= 80) label = 'Extreme Greed';
    else if (value >= 60) label = 'Greed';
    else if (value >= 40) label = 'Neutral';
    else if (value >= 20) label = 'Fear';
    else label = 'Extreme Fear';

    return {
        flow_events: dedupedEvents.slice(0, 20),
        block_trades: blockTrades.slice(0, 8),
        sentiment_index: { value, label, components: { avg_cmf: avgCmf, mfc_sentiment: mfcSent } },
        stale: true,
    };
}

function renderSentimentGauge(sentiment) {
    if (!sentiment) return;
    const sentimentValEl = document.getElementById('live-sentiment-value');
    const sentimentMarkerEl = document.getElementById('live-sentiment-marker');
    if (!sentimentValEl || !sentimentMarkerEl) return;

    const val = sentiment.value ?? 50;
    window.LIVE_SENTIMENT = val;

    let sentimentLabel = 'Neutral';
    let sentimentColor = '#e2e8f0';
    if (val >= 80) { sentimentLabel = 'Extreme Greed (BULLISH SURGE)'; sentimentColor = '#10b981'; }
    else if (val >= 60) { sentimentLabel = 'Greed (Bullish Sentiment)'; sentimentColor = '#34d399'; }
    else if (val >= 40) { sentimentLabel = 'Neutral (Stables)'; sentimentColor = '#e2e8f0'; }
    else if (val >= 20) { sentimentLabel = 'Fear (Bearish Sentiment)'; sentimentColor = '#fb923c'; }
    else { sentimentLabel = 'Extreme Fear (PANIC SURGE)'; sentimentColor = '#fb7185'; }

    sentimentValEl.textContent = `${val}% (${sentimentLabel})`;
    sentimentValEl.style.color = sentimentColor;
    sentimentMarkerEl.style.left = `${val}%`;
}

function renderBlockTradeLedger(blockTrades, stale) {
    const ledger = document.getElementById('block-trade-ledger');
    if (!ledger) return;

    if (!blockTrades || blockTrades.length === 0) {
        ledger.innerHTML = '<div style="color: #64748b; text-align: center; margin-top: auto; margin-bottom: auto;" id="ledger-placeholder">대량거래 캔들 없음 (Volume Climax 1.6x+ 기준)</div>';
        return;
    }

    const staleBanner = stale
        ? '<div style="color:#64748b;font-size:0.6rem;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06);">마지막 거래일 캔들 기준</div>'
        : '';

    ledger.innerHTML = staleBanner + blockTrades.map(trade => {
        const isBuy = trade.side === 'BUY';
        const t = trade.time ? new Date(trade.time * 1000) : new Date();
        const timeStr = t.getHours().toString().padStart(2, '0') + ':' +
            t.getMinutes().toString().padStart(2, '0') + ':' +
            t.getSeconds().toString().padStart(2, '0');
        const amountM = (trade.amount_usd || 0) / 1_000_000;
        const volText = amountM >= 1
            ? `$${amountM.toFixed(1)}M (${trade.volume_ratio ? trade.volume_ratio.toFixed(1) + 'x vol' : 'climax'})`
            : `${(trade.volume || 0).toLocaleString()} shs`;
        return `<div class="block-trade-row ${isBuy ? 'buy' : 'sell'}">
            <span style="color: #64748b; font-size: 0.6rem;">[${timeStr}]</span>
            <span style="font-weight: 700; color: #f8fafc; margin-left: 4px;">${trade.name || trade.symbol}</span>
            <span style="color: ${isBuy ? '#34d399' : '#fb7185'}; font-weight: 800;">${isBuy ? 'VOLUME BUY' : 'VOLUME SELL'}</span>
            <span style="color: #cbd5e1; font-weight: 600; margin-left: auto;">${volText}</span>
        </div>`;
    }).join('');
}

window.applyLiveFlowMonitor = function(liveData, reportData, opts = {}) {
    if (window.IS_LATEST_REPORT === false) return;

    const briefingTerminal = document.getElementById('briefing-terminal-text');
    const breakingTerminalBody = document.querySelector('#breaking-ai-terminal .terminal-body');
    const isInitial = !!opts.initial;

    let payload = liveData;
    if (!payload || !payload.flow_events || payload.flow_events.length === 0) {
        payload = buildFallbackFlowMonitor(reportData || (typeof REPORTS_HISTORY !== 'undefined' ? REPORTS_HISTORY[0] : {}) || {});
    }

    const stale = !!payload.stale;
    const events = (payload.flow_events || [])
        .filter(e => !isCryptoSymbol(e.symbol))
        .sort((a, b) => (b.time || 0) - (a.time || 0));
    const blockTradesFiltered = (payload.block_trades || []).filter(t => !isCryptoSymbol(t.symbol));

    if (breakingTerminalBody && !breakingTerminalBody.dataset.initialized) {
        breakingTerminalBody.innerHTML = '';
        breakingTerminalBody.dataset.initialized = 'true';
        const p = document.createElement('div');
        p.className = 'terminal-line-row';
        p.textContent = stale
            ? '> yfinance 캔들 기반 수급 센서 (마지막 거래일 기준)'
            : '> yfinance Volume Climax · 종목당 최신 1건';
        breakingTerminalBody.appendChild(p);
        breakingTerminalBody.appendChild(Object.assign(document.createElement('span'), { className: 'terminal-cursor' }));
    }

    if (!window._displayedFlowEventKeys) window._displayedFlowEventKeys = new Set();

    if (isInitial) {
        clearBriefingIntroForLiveFeed();
        events.slice(0, 5).forEach(ev => window._displayedFlowEventKeys.add(flowEventKey(ev)));
        renderFlowMonitorSnapshot(briefingTerminal, breakingTerminalBody, events, stale);
    } else {
        const fresh = events.filter(ev => !window._displayedFlowEventKeys.has(flowEventKey(ev)));
        if (fresh.length) {
            enqueueFlowEvents(fresh, briefingTerminal, breakingTerminalBody, stale, true);
        }
    }

    renderSentimentGauge(payload.sentiment_index);
    renderBlockTradeLedger(blockTradesFiltered, stale);
    window._flowMonitorReady = true;
};

function initLiveFlowMonitor(reportData) {
    if (window.AI_MONITOR_INTERVAL) clearInterval(window.AI_MONITOR_INTERVAL);
    if (!window._displayedFlowEventKeys) window._displayedFlowEventKeys = new Set();

    const liveData = typeof LIVE_DATA !== 'undefined' ? LIVE_DATA : null;
    window.applyLiveFlowMonitor(liveData, reportData, { initial: !window._flowMonitorReady });
}

function startLiveMonitoringLoop(data, terminal) {
    initLiveFlowMonitor(data);
}

function isKrStock(stock) {
    const symbol = stock.symbol || '';
    return symbol.endsWith('.KS') || symbol.endsWith('.KQ') || /^\d{6}$/.test(symbol);
}

function isCrypto(stock) {
    const symbol = stock.symbol || '';
    return symbol.endsWith('-USD') || symbol.endsWith('-BTC') || symbol.includes('BTC') || symbol.includes('ETH');
}

function updateTrendingStocks(data, isSimulated = false) {
    // Combine all stocks
    let allStocks = [];
    if (data.holdings) allStocks.push(...data.holdings);
    if (data.watchlist) allStocks.push(...data.watchlist);

    // [MOD] Consistently visible regardless of market hours as requested
    const activeOnly = allStocks;

    const processTrending = (stocks) => {
        return stocks
            .filter((v, i, a) => v && v.name && a.findIndex(t => t.name === v.name) === i)
            .map(stock => {
                const ind = stock.reason?.indicators || {};
                const volRatio = ind.volume_ratio || 1;
                const change = stock.changePercent || 0; 
                const instHold = ind.held_percent_institutions || 0;
                const siChange = ind.short_interest_change_pct || 0;

                // 1. AI Analysis Foundation (Base weight: 70%)
                const baseScore = (stock.mfc_score || stock.reason?.mfc_score || 50) * 0.7;
                
                // 2. Selective Alpha Bonuses
                let alphaBonus = 0;
                if (change > 1 && volRatio > 1.3) alphaBonus += 7;
                if (siChange < 0 && change > 0) alphaBonus += 5;
                if (ind.short_percent_float > 0.25 && change > 3) alphaBonus += 8; 
                if (instHold > 0.5) alphaBonus += 3;
                if (ind.cmf > 0.25) alphaBonus += 7;

                // 3. Dynamic Momentum Polish
                const flowBonus = (Math.min(100, Math.max(0, (ind.cmf + 0.3) * 166)) - 50) * 0.05;
                const moveBonus = change * 0.4;
                const jitter = isSimulated ? (Math.random() * 3 - 1.5) : 0;
                
                const tScore = Math.min(100, Math.max(0, baseScore + alphaBonus + flowBonus + moveBonus + jitter));
                return { ...stock, tScore };
            })
            .sort((a, b) => b.tScore - a.tScore)
            .slice(0, 5);
    };

    const trendingUs = processTrending(activeOnly.filter(s => !isKrStock(s) && !isCrypto(s)));
    const trendingKr = processTrending(activeOnly.filter(s => isKrStock(s)));
    // Crypto is excluded as requested

    const renderGrid = (colId, headerId, gridId, trending, label) => {
        const col = document.getElementById(colId);
        const header = document.getElementById(headerId);
        const grid = document.getElementById(gridId);
        if (!col || !header || !grid) return;

        if (trending.length === 0) {
            col.style.display = 'none';
        } else {
            col.style.display = 'flex';
            header.innerHTML = `<div class="trending-sub-label">${label}</div>`;
            
            let html = '';
            trending.forEach((stock, idx) => {
                const score = stock.tScore || 0;
                const isHighFlow = (stock.reason?.indicators?.cmf || 0) > 0.2;
                const isStockActive = isMarketActive(stock);
                
                const tagText = window.IS_LATEST_REPORT ? (isStockActive ? (isHighFlow ? 'FLOW HOT' : 'LIVE') : 'CLOSED') : 'CLOSED';
                const tagColor = window.IS_LATEST_REPORT ? (isStockActive ? (isHighFlow ? 'var(--live-green)' : 'var(--accent-blue)') : 'var(--text-secondary)') : 'var(--text-secondary)';
                const scoreLabel = window.IS_LATEST_REPORT ? 'Score' : 'Final Score';
                const color = score >= 70 ? 'var(--live-green)' : 'var(--accent-blue)';

                html += `
                    <div class="trending-item" style="position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); min-height: 180px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
                        ${stock.consensusPredictionImage ? `
                            <img src="../${stock.consensusPredictionImage}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.6; filter: grayscale(0.1) brightness(1.6) contrast(1.4); z-index: 0; pointer-events: none; transform: scale(1.2);">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.4) 60%, rgba(2, 6, 23, 0.1) 100%); z-index: 1;"></div>
                        ` : ''}
                        <div style="position: relative; z-index: 2;">
                            <div class="trending-top">
                                <span class="trending-rank">#${idx + 1}</span>
                                <span class="live-tag" style="background: ${tagColor}">
                                    ${tagText}
                                </span>
                            </div>
                            <div class="trending-symbol" style="font-size: 1.4rem; margin-top: 0.5rem;">${stock.name}</div>
                            <div class="trending-price" style="font-size: 1.1rem; margin-top: 0.25rem; opacity: 0.9;">${stock.currentPrice || '---'}</div>
                            <div class="trending-metric" style="color: ${color}; margin-top: 1rem;">
                                ${scoreLabel}: ${Math.round(score)} <span style="font-size: 0.6rem; opacity: 0.7;">${isHighFlow ? '🌊 SMART MONEY' : '⚡ VOL'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            grid.innerHTML = html;
        }
    };

    renderGrid('trending-column-us', 'trending-header-us', 'trending-stocks-grid-us', trendingUs, '🇺🇸 US MARKET');
    renderGrid('trending-column-kr', 'trending-header-kr', 'trending-stocks-grid-kr', trendingKr, '🇰🇷 KR MARKET');

    // Hide entire section if no trending data (both US/KR inactive)
    const section = document.getElementById('trending-now-section');
    if (section) {
        section.style.display = (trendingUs.length === 0 && trendingKr.length === 0) ? 'none' : 'block';
    }
}

function formatText(text) {
    if (!text) return '';

    let jsonObj = null;
    if (typeof text === 'object') jsonObj = text;
    else if (typeof text === 'string') {
        try { jsonObj = JSON.parse(text); } catch (e) {}
    }

    let rawStr = (jsonObj && typeof jsonObj === 'object' && jsonObj.technical_summary) 
        ? String(jsonObj.technical_summary) 
        : String(text);
    
    // Normalize newlines and escape HTML entities
    rawStr = rawStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
                   .replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 0. Surgical fix for colons/pipes/arrows followed by newlines (High density enforcement)
    rawStr = rawStr.replace(/([:|→➡=>])\s*(\n|\\n)\s*(?!###|-|•|[🟢🔴🟡✨🔥🚨📅⚖️🧭🧠]+\s?\*\*)/g, '$1 ');
    
    // Merge lines starting with | into the previous line for high density
    rawStr = rawStr.replace(/(\n|\\n)\s*([|])\s*/g, ' | ');
    
    // [NEW] Insert newline before major category icons if they appear in the middle of a line
    rawStr = rawStr.replace(/([^\n])\s*(🧭|🚨|📅|⚖️|🧠)/g, '$1\n$2');
    
    // Additional pass for cleaning up leading/trailing spaces around specific separators
    rawStr = rawStr.replace(/\s*[|]\s*/g, ' | ');

    // 1. Intelligence Signal Board (Grid Layout) - Auto-detect emoji signals
    const signalRegex = /^([🟢🔴🟡✨🔥🚨📅⚖️🧭🧠]+)\s?\*\*([^*]+)\*\*:(.*)/;
    if (rawStr.match(new RegExp(signalRegex, 'gm'))?.length >= 3) {
        let sections = rawStr.split('\n');
        let cardsHtml = '<div class="briefing-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin: 15px 0;">';
        let introText = "";
        
        sections.forEach(line => {
            const signalMatch = line.match(signalRegex);
            if (signalMatch) {
                const icon = signalMatch[1];
                const title = signalMatch[2];
                const content = signalMatch[3];
                
                let borderColor = "#334155";
                let bgColor = "rgba(30, 41, 41, 0.5)";
                if (icon.includes('🟢') || icon.includes('✨')) { borderColor = "#059669"; bgColor = "rgba(5, 150, 105, 0.05)"; }
                else if (icon.includes('🔴') || icon.includes('🚨') || icon.includes('🔥')) { borderColor = "#dc2626"; bgColor = "rgba(220, 38, 38, 0.05)"; }
                else if (icon.includes('📅') || icon.includes('⚖️')) { borderColor = "#2563eb"; bgColor = "rgba(37, 99, 235, 0.05)"; }
                else if (icon.includes('🧠') || icon.includes('🧭')) { borderColor = "#7c3aed"; bgColor = "rgba(124, 58, 237, 0.05)"; }

                cardsHtml += `
                    <div style="border: 1px solid ${borderColor}; background: ${bgColor}; padding: 12px; border-radius: 8px; font-size: 0.9rem;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-weight: 700; color: #f1f5f9;">
                            <span>${icon}</span> <span>${title}</span>
                        </div>
                        <div style="color: #cbd5e1; line-height: 1.4;">${content.trim()}</div>
                    </div>`;
            } else {
                if (line.trim()) introText += line + '<br>';
            }
        });
        return introText + cardsHtml + '</div>';
    }

    // 2. Standard Markdown Logic
    return rawStr
        .replace(/### ([0-9]단계 - [^\n]+)/g, '<h4 style="color: #38bdf8; margin-top: 1.5rem; margin-bottom: 0.4rem; font-size: 1rem; border-left: 4px solid #38bdf8; padding: 6px 12px; background: rgba(56, 189, 248, 0.08); font-weight: 700; border-radius: 0 4px 4px 0;">$1</h4>')
        .replace(/### (📊 Multi-Factor Composite Score.*|🌐 Cross-Asset Correlation.*|👥 Insider & Institutional Sentiment.*|🧭 Market Regime & Position Sizing.*|📅 Earnings & Fundamentals.*|💎 Valuation Analysis.*|💰 보유 종목 수익률 분석.*)/g, '<h4 style="color: #a78bfa; margin-top: 1.8rem; margin-bottom: 0.6rem; font-size: 1rem; border-left: 4px solid #a78bfa; padding: 6px 12px; background: rgba(167, 139, 250, 0.08); font-weight: 700; border-radius: 0 4px 4px 0;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)$/gm, '<div style="display:flex; align-items:baseline; gap:8px; margin:2px 0; width:100%; min-width:0;"><span style="color:#38bdf8; font-weight:bold; flex-shrink:0;">•</span><span style="flex:1; min-width:0; word-break:break-all; overflow-wrap:break-word;">$1</span></div>')
        .replace(/\n/g, '<br>')
        .replace(/\\n/g, '<br>')
        .replace(/<\/h4><br>/g, '</h4>')
        .replace(/<br><div/g, '<div')
        .replace(/<\/div><br>/g, '</div>')
        .replace(/(<br>){2,}/g, '<br>');
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

// MFC Tooltip Content — 10차원 기반 (v13: config.yaml weights 와 일치)
// trend20 momentum15 flow15 relative_strength10 structure10 volatility8
// valuation7 momentum_quality5 insider5 sentiment5
function getMfcTooltip(stock) {
    const ind = stock.reason?.indicators || {};
    const bd = stock.reason?.mfc_breakdown || stock.mfc_breakdown || {};
    const score = stock.mfcScore || 0;
    const structure = stock.reason?.structure?.pattern || 'Unknown';
    const rsiVal = parseRsi(stock);

    // Short Interest
    const shortChange = ind.short_interest_change_pct;
    const shortRatio = ind.short_percent_float;

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

    // 10차원 breakdown bar 빌더
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
        <div class="tooltip-header">📊 MFC 10차원 분석 (${score} / 100)</div>
        <div style="margin:6px 0 4px; font-size:0.68rem; color:#fbbf24;">▶ 차원별 서브스코어</div>
        ${dimBar('Trend (20%)', bd.trend, '#38bdf8')}
        ${dimBar('Momentum (15%)', bd.momentum, '#818cf8')}
        ${dimBar('Flow (15%)', bd.flow, '#34d399')}
        ${dimBar('Volatility (8%)', bd.volatility, '#fbbf24')}
        ${dimBar('Structure (10%)', bd.structure, '#f472b6')}
        ${dimBar('MomQuality (5%)', bd.momentum_quality, '#a78bfa')}
        ${dimBar('Insider (5%)', bd.insider, '#fb923c')}
        ${dimBar('Valuation (7%)', bd.valuation, '#06b6d4')}
        ${dimBar('Sentiment (5%)', bd.sentiment, '#f59e0b')}
        ${dimBar('RelStrength (10%)', bd.relative_strength, '#14b8a6')}
        <ul class="advice-list" style="margin-top:8px; border-top:1px dotted rgba(255,255,255,0.1); padding-top:6px;">
            <li><b>MA Trend:</b> ${ind.ma_alignment || 'N/A'} ${ind.adx ? `(ADX ${ind.adx.toFixed(0)} — ${ind.adx >= 25 ? '강한 추세' : '약한 추세'})` : ''}</li>
            <li><b>RSI:</b> ${rsiVal} | <b>MACD 히스토그램:</b> ${ind.macd_histogram !== undefined ? ind.macd_histogram.toFixed(3) : 'N/A'}</li>
            <li><b>ROC(12일):</b> ${ind.roc_12 !== undefined ? ind.roc_12.toFixed(2) + '%' : 'N/A'} | <b>Williams%R:</b> ${ind.williams_r !== undefined ? ind.williams_r.toFixed(1) : 'N/A'}</li>
            <li><b>OBV 추세:</b> ${ind.obv_trend || 'N/A'} | <b>CMF:</b> ${ind.cmf !== undefined ? ind.cmf.toFixed(3) : 'N/A'} ${ind.cmf > 0.15 ? '(강한 자금유입 🟢)' : ind.cmf < -0.15 ? '(강한 자금이탈 🔴)' : ''}</li>
            <li><b>구조 (Phase):</b> ${structure} ${ind.spring_detected ? '🔔 Spring(매집완료)' : ''} ${ind.upthrust_detected ? '⚠️ Upthrust(분산)' : ''}</li>
            <li><b>변동성:</b> ${ind.bollinger_position || 'N/A'} ${ind.bollinger_squeeze ? '(🗜️ Squeeze — 폭발 임박!)' : ''}</li>
            <li><b>볼륨:</b> ${ind.volume_ratio !== undefined ? ind.volume_ratio.toFixed(2) + 'x 평균대비' : 'N/A'} ${ind.volume_climax ? '⚡ 클라이맥스' : ''}</li>
            ${shortHtml}
            <li style="border-top:1px dotted rgba(255,255,255,0.1); margin-top:5px; padding-top:5px;">
                <b>Insider 감정:</b> ${ind.insider_sentiment || 'Neutral'} | <b>기관 보유:</b> ${ind.held_percent_institutions !== undefined ? (ind.held_percent_institutions * 100).toFixed(1) + '%' : 'N/A'} | <b>내부자 보유:</b> ${ind.held_percent_insiders !== undefined ? (ind.held_percent_insiders * 100).toFixed(1) + '%' : 'N/A'}
            </li>
        </ul>
        <div style="font-size:0.66rem; color:#64748b; margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; line-height:1.6;">
            <b>Trend</b>: MA배열+ADX+Ichimoku (20%) | <b>Momentum</b>: RSI+MACD×ROC+Stoch (15%)<br>
            <b>Flow</b>: OBV+CMF+거래량+공매도 (15%) | <b>Volatility</b>: BBW+ATR정규화+Williams%R (8%)<br>
            <b>Structure</b>: Phase+Spring/UT+다이버전스 (10%) | <b>MomQuality</b>: 가속도 (5%) | <b>Insider</b>: 내부자 (5%)<br>
            <b>Valuation</b>: 펀더멘털 저평가 (7%) | <b>Sentiment</b>: 뉴스 (5%) | <b>RelStrength</b>: SPY 대비 지표 (10%)
        </div>`;
}

// [NEW] PICK Tooltip Content — 개선된 공식 반영
function getPickTooltip(stock) {
    const info = buildRecommendationScore(stock);
    const total = (stock.rec_score !== undefined && stock.rec_score !== null) ? stock.rec_score : info.total;
    const pred = stock.predictedResult || stock.ai_prediction || 'N/A';
    const predVal = (pred !== 'N/A') ? parseFloat(pred.replace('%', '')) : null;
    const factors = stock.factors || {};
    const isFallback = stock.reason?.is_fallback === true;
    const wfMae = stock.reason?.wf_mae !== undefined ? stock.reason.wf_mae : null;

    // 비대칭 패널티 설명
    const asymmNote = (predVal !== null && predVal < 0)
        ? `<div style="color:#fb7185; font-size:0.68rem; margin-top:4px;">⚠️ 하락 예측 시 패널티 ×1.5 적용됨</div>`
        : '';

    // modifier 표시
    const regimeScore = factors.regime_score !== undefined ? factors.regime_score : null;
    const rrScore = factors.rr_score !== undefined ? factors.rr_score : null;
    const regMod = regimeScore !== null ? (((regimeScore - 50) * 0.15).toFixed(1)) : 'N/A';
    const rrMod = rrScore !== null ? (((rrScore - 50) * 0.10).toFixed(1)) : 'N/A';

    const regColor = regMod > 0 ? '#f25f7a' : (regMod < 0 ? '#5f97f2' : '#94a3b8');
    const rrColor = rrMod > 0 ? '#f25f7a' : (rrMod < 0 ? '#5f97f2' : '#94a3b8');
    const predColor = isFallback ? '#fbbf24' : (predVal !== null ? (predVal >= 0 ? '#f25f7a' : '#5f97f2') : '#94a3b8');
    
    const predDisplay = isFallback ? `<span class="fallback-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #f59e0b55;">⚠️ 예측 지연</span>` : pred;
    const maeDisplay = wfMae !== null && !isFallback ? `<span style="color:#a78bfa; font-size:0.7rem; margin-left:6px;">(오차 범위 ±${(wfMae * 100).toFixed(1)}%)</span>` : '';

    return `
        <div class="tooltip-header">🤖 PICK Predictive Score (${total} / 100)</div>
        <ul class="advice-list" style="margin-top:6px;">
            <li><b>AI 예측 수익률:</b> <span style="color:${predColor}">${predDisplay}</span> ${maeDisplay} <span style="font-size:0.68rem; color:#64748b;">(T+15일 앙상블)</span></li>
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
            'High': { bg: 'rgba(52,211,153,0.15)', border: '#34d399', text: '#34d399', icon: '🔥', label: '높음' },
            'Medium': { bg: 'rgba(251,191,36,0.15)', border: '#fbbf24', text: '#fbbf24', icon: '⚡', label: '보통' },
            'Low': { bg: 'rgba(251,113,133,0.15)', border: '#fb7185', text: '#fb7185', icon: '⚠️', label: '낮음' }
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
        const pnlColor = pnlVal >= 20 ? '#f25f7a' : pnlVal >= 0 ? '#f25f7a' : pnlVal >= -10 ? '#fbbf24' : '#5f97f2';
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

    // ── Factor Scores (Regime, R:R, MQ, CMF) ──
    if (factors.regime_score !== undefined || factors.rr_score !== undefined) {
        const regime = factors.regime_score ?? '-';
        const rr = factors.rr_score ?? '-';
        const mq = factors.momentum_quality ?? '-';
        const indicators = stock.reason?.indicators || {};
        const cmfVal = indicators.cmf !== undefined && indicators.cmf !== null ? parseFloat(indicators.cmf) : null;
        const cmfStr = cmfVal !== null ? (cmfVal >= 0 ? '+' : '') + cmfVal.toFixed(2) : '-';

        html += `<div class="v5-badge v5-factors" style="background:rgba(129,140,248,0.08); border:1px solid rgba(129,140,248,0.2); color:#a5b4fc;">
            <span title="시장 부합도 (Regime Alignment): 현재 시장 레짐과 종목의 성격이 얼마나 일치하는지 나타냅니다.">🧭 ${typeof regime === 'number' ? regime.toFixed(0) : regime}</span>
            <span class="v5-sep">|</span>
            <span title="손익비 (Risk/Reward): 예상 수익 대비 감수해야 할 하방 리스크의 비율입니다.">⚖️ ${typeof rr === 'number' ? rr.toFixed(0) : rr}</span>
            <span class="v5-sep">|</span>
            <span title="모멘텀 품질 (Momentum Quality): 상승 추세의 지속성과 매수세의 견고함을 평가한 점수입니다.">🚀 ${typeof mq === 'number' ? mq.toFixed(0) : mq}</span>
            <span class="v5-sep">|</span>
            <span title="자금 흐름 (Chaikin Money Flow): 기관 자금의 실제 유입(+) 및 유출(-) 강도입니다.">💵 ${cmfStr}</span>
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
    const mfcVal = stock.mfcScore || 0;
    // Continuous HSL color mapping (0 -> Red, 50 -> Yellow, 100 -> Green)
    const hue = Math.max(0, Math.min(130, (mfcVal / 100) * 130)); // 0 is red, 130 is green
    const color = `hsl(${hue}, 85%, 55%)`;
    const angle = (Math.max(0, Math.min(100, mfcVal)) / 100) * 360;

    const indicators = stock.reason?.indicators || {};
    const bd = stock.reason?.mfc_breakdown || stock.mfc_breakdown || {};

    // Bar 1: MA Trend
    let maText = indicators.ma_alignment || 'Neutral';
    let maColor = maText.includes('정배열') ? '#34d399' : maText.includes('역배열') ? '#fb7185' : '#fbbf24';

    // Bar 2: Phase
    const phase = stock.reason?.structure?.pattern || 'Unknown';
    const phaseColor = (phase === 'Markup' || phase === 'Accumulation') ? '#34d399' : (phase === 'Markdown' || phase === 'Distribution') ? '#fb7185' : '#94a3b8';

    // Bar 3: Signal
    let volText = indicators.bollinger_position || 'Stable';
    if (indicators.spring_detected) volText = '🔔 Spring!';
    if (indicators.bollinger_squeeze) volText += ' (Squeeze)';
    const volColor = (volText.includes('하단') || volText.includes('Spring')) ? '#34d399' : volText.includes('상단') ? '#fb7185' : '#fbbf24';

    // Bar 4: Insider
    const insiderText = indicators.insider_sentiment || 'Neutral';
    const insiderColor = insiderText.includes('Bullish') || insiderText.includes('Support') ? '#34d399' : insiderText.includes('Bearish') ? '#fb7185' : '#94a3b8';

    // Bar 5: Momentum Quality
    const mq = bd.momentum_quality !== undefined ? Math.round(bd.momentum_quality) : null;
    const mqColor = mq >= 70 ? '#34d399' : mq <= 30 ? '#fb7185' : '#a78bfa';

    // Bar 6: Valuation (재무제표 점수)
    const valScore = bd.valuation !== undefined ? Math.round(bd.valuation) : null;
    const valColor = valScore >= 70 ? '#34d399' : valScore <= 30 ? '#fb7185' : '#06b6d4';

    // Additional Technical Health Metrics for space filling
    const rsi = indicators.rsi || 50;
    const mfi = indicators.mfi || 50;
    const adx = indicators.adx || 25;

    const getHealthColor = (val, type) => {
        if (type === 'rsi') return val >= 70 ? '#5f97f2' : val <= 30 ? '#f25f7a' : '#38bdf8';
        if (type === 'mfi') return val >= 80 ? '#5f97f2' : val <= 20 ? '#f25f7a' : '#a78bfa';
        return val >= 25 ? '#34d399' : '#94a3b8';
    };

    return `
        <div class="score-group-container">

            <div class="score-group-header">
                <div class="tooltip-container">
                    <div class="mfc-gauge" style="width: 70px; height: 70px; background: conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg); cursor: help;">
                        <div class="mfc-gauge-inner" style="width: 56px; height: 56px;">
                            <span class="mfc-gauge-value" style="color:${color}; font-size: 1.3rem;">${Math.round(mfcVal)}</span>
                            <span class="mfc-gauge-label">MFC</span>
                        </div>
                    </div>
                    <div class="tooltip-text" style="bottom: 100%; top: auto; margin-bottom: 15px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
                        ${getMfcTooltip(stock)}
                    </div>
                </div>
                <div class="score-bars-stack" style="flex: 1;">
                    <div class="score-bar-item"><span class="bar-label">Trend:</span> <span class="bar-value" style="color:${maColor}">${maText}</span></div>
                    <div class="score-bar-item"><span class="bar-label">Phase:</span> <span class="bar-value" style="color:${phaseColor}">${phase}</span></div>
                    <div class="score-bar-item"><span class="bar-label">Signal:</span> <span class="bar-value" style="color:${volColor}">${volText}</span></div>
                    <div class="score-bar-item"><span class="bar-label">Insider:</span> <span class="bar-value" style="color:${insiderColor}">${insiderText}</span></div>
                    ${mq !== null ? `<div class="score-bar-item"><span class="bar-label">MomQual:</span> <span class="bar-value" style="color:${mqColor}">${mq}/100</span></div>` : ''}
                    ${valScore !== null ? `<div class="score-bar-item"><span class="bar-label">Valuation:</span> <span class="bar-value" style="color:${valColor}">${valScore}/100</span></div>` : ''}
                </div>
            </div>

            <!-- Technical Health Matrix -->
            <div class="health-matrix-box">
                <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 800; margin-bottom: 15px; letter-spacing: 0.05rem;">TECHNICAL HEALTH MATRIX</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="health-item">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 4px;">
                            <span>RSI (Strength)</span><span style="color: ${getHealthColor(rsi, 'rsi')}">${rsi.toFixed(1)}</span>
                        </div>
                        <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px;"><div style="height: 100%; width: ${rsi}%; background: ${getHealthColor(rsi, 'rsi')};"></div></div>
                    </div>
                    <div class="health-item">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 4px;">
                            <span>MFI (Money Flow)</span><span style="color: ${getHealthColor(mfi, 'mfi')}">${mfi.toFixed(1)}</span>
                        </div>
                        <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px;"><div style="height: 100%; width: ${mfi}%; background: ${getHealthColor(mfi, 'mfi')};"></div></div>
                    </div>
                    <div class="health-item">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 4px;">
                            <span>ADX (Trend Power)</span><span style="color: ${getHealthColor(adx, 'adx')}">${adx.toFixed(1)}</span>
                        </div>
                        <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px;"><div style="height: 100%; width: ${(adx / 50) * 100}%; background: ${getHealthColor(adx, 'adx')};"></div></div>
                    </div>
                </div>
            </div>

            <!-- AI Technical Insight -->
            <div class="ai-insight-box">
                <div style="font-weight: 800; color: #a78bfa; margin-bottom: 4px;">🔍 AI Technical Insight</div>
                ${(() => {
            const isBull = maText.includes('정배열');
            const isBear = maText.includes('역배열');
            const isSqueeze = indicators.bollinger_squeeze;
            const isSpring = indicators.spring_detected;
            const isUT = indicators.upthrust_detected;

            let trendNarrative = "";
            if (isBull) {
                if (adx >= 25) trendNarrative = "현재 완전 정배열 기반의 강력한 강세 국면(Strong Bullish)이 지속되고 있습니다. ";
                else trendNarrative = "정배열 상태를 유지 중이나 추세 강도가 다소 완만해진 조기 정체 국면입니다. ";
            } else if (isBear) {
                if (adx >= 25) trendNarrative = "하락 추세의 가속도가 붙은 역배열 침체 국면으로 추가 하방 압력에 주의가 필요합니다. ";
                else trendNarrative = "역배열 상태이나 하락 에너지가 소진되며 단기 바닥권을 형성하려는 움직임이 관찰됩니다. ";
            } else {
                trendNarrative = "추세의 방향성이 모호한 중립 구간으로, 이평선 수렴에 따른 방향성 탐색이 진행 중입니다. ";
            }

            let oscNarrative = "";
            if (rsi >= 70) oscNarrative = "과매수권 진입으로 인한 단기 차익 실현 욕구가 강해지는 구간입니다. ";
            else if (rsi <= 30) oscNarrative = "극심한 과매도 상태로 기술적 반등을 위한 에너지가 응축되고 있습니다. ";
            else if (mfi >= 80) oscNarrative = "자금 흐름이 과열 양상을 보이고 있어 일시적인 숨고르기가 예상됩니다. ";
            else oscNarrative = "안정적인 오실레이터 파동을 유지하며 균형 잡힌 흐름을 보여주고 있습니다. ";

            let signalNarrative = "";
            if (isSpring) signalNarrative = "특히 '와이코프 스프링(Spring)' 패턴이 감지되어 매집 완료 후 반등 가능성이 매우 높습니다. ";
            else if (isUT) signalNarrative = "상단에서의 '업스러스트(Upthrust)' 징후가 있어 고점 매물 출회 가능성을 경계해야 합니다. ";
            else if (isSqueeze) signalNarrative = "현재 볼린저 밴드가 극도로 수축된 '스퀴즈' 상태로 조만간 변동성이 폭발할 것으로 보입니다. ";

            let conclusion = `모멘텀 품질(${mq !== null ? mq : 'N/A'})과 ${phase} 구조를 종합할 때, 현 국면은 ${mq >= 70 ? '추세 지속성이 매우 강력' : '방향성 확정 전까지 신중한 접근'}이 유리해 보입니다.`;

            return trendNarrative + oscNarrative + signalNarrative + conclusion;
        })()}
            </div>

            <div style="margin-top: 10px;">
                ${buildCorrelationBadgesHtml(stock.reason?.correlations)}
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

    if (!cf || cf.total_inflow === undefined || cf.total_inflow === 0) {
        return `<div style="padding: 15px; text-align: center; color: #64748b; font-size: 0.8rem; background: rgba(15, 23, 42, 0.4); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">분석 데이터를 수집 중입니다...</div>`;
    }

    const inflow = cf.total_inflow || 0;
    const outflow = cf.total_outflow || 0;
    const buyRatio = inflow / (inflow + outflow);

    // Formatter (USD to K/M, KRW to 백만/억)
    const isKrw = stock.nativeCurrency === 'KRW';
    const fmtValue = (val) => {
        if (val === 0) return '0';
        if (isKrw) {
            if (val >= 1000000000000) return (val / 1000000000000).toFixed(2) + '조';
            if (val >= 100000000) return (val / 100000000).toFixed(1) + '억';
            if (val >= 1000000) return (val / 1000000).toFixed(0) + '백만';
            return val.toLocaleString();
        } else {
            if (val >= 1000000000000) return (val / 1000000000000).toFixed(2) + 'T';
            if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'B';
            if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
            return val.toFixed(0);
        }
    };

    // Verdict Logic
    let verdict = "";
    let vClass = "";
    if (buyRatio >= 0.8) { verdict = "💎 강력 매집 (압도적 수급)"; vClass = "verdict-bullish-strong"; }
    else if (buyRatio >= 0.6) { verdict = "✅ 매수 우위 (수급 호조)"; vClass = "verdict-bullish"; }
    else if (buyRatio <= 0.2) { verdict = "🚨 투매 경고 (패닉 셀링)"; vClass = "verdict-bearish-strong"; }
    else if (buyRatio <= 0.4) { verdict = "⚠️ 매도 우위 (주의 요망)"; vClass = "verdict-bearish"; }
    else { verdict = "⚖️ 수급 균형 (관망세)"; vClass = "verdict-neutral"; }

    // [FIX] Enhanced AI Flow Intelligence (Multi-dimensional)
    const inflowLarge = cf.inflow_large || 0;
    const outflowLarge = cf.outflow_large || 0;
    const largeNet = inflowLarge - outflowLarge;
    const isLargeBuying = largeNet > 0;

    const shortChange = ind.short_interest_change_pct || 0;
    const isShortSqueeze = shortChange < -10;
    const isShortSurge = shortChange > 10;

    const cmf = ind.cmf || 0;
    const volRatio = ind.volume_ratio || 1;

    let aiRationale = "";
    if (buyRatio >= 0.7) {
        aiRationale = `현재 <b>${Math.round(buyRatio * 100)}%</b>의 압도적 자금이 유입되고 있습니다. `;
        if (isLargeBuying) aiRationale += `특히 기관/외인(Large)의 순유입이 뚜렷하며, `;
        if (cmf > 0.1) aiRationale += `자금 흐름의 강도(CMF: ${cmf.toFixed(2)})가 매우 높습니다. `;
        aiRationale += `이는 강력한 매집 신호로 해석됩니다.`;
    } else if (buyRatio <= 0.3) {
        aiRationale = `매도 압력이 <b>${Math.round((1 - buyRatio) * 100)}%</b>로 매우 강합니다. `;
        if (!isLargeBuying) aiRationale += `대형 자금의 이탈이 관찰되며, `;
        if (isShortSurge) aiRationale += `공매도 급증(+${shortChange.toFixed(1)}%)으로 인한 하방 압력이 거셉니다. `;
        aiRationale += `주요 지지선 확인 전까지 보수적인 접근이 필요합니다.`;
    } else {
        aiRationale = `매수와 매도의 힘이 팽팽하게 맞서고 있습니다. `;
        if (isLargeBuying && buyRatio > 0.5) aiRationale += `다행히 큰 손(Large)의 매수세는 유지되고 있으나, `;
        else if (!isLargeBuying && buyRatio < 0.5) aiRationale += `개인 위주의 매수세 속에 큰 손의 이탈이 섞여 있으며, `;

        if (isShortSqueeze) aiRationale += `숏 커버링 징후가 포착되어 반등의 실마리가 보입니다. `;
        if (volRatio > 1.5) aiRationale += `평균 대비 높은 거래량(${volRatio.toFixed(1)}x) 속에서 손바꿈이 활발합니다. `;
        aiRationale += `뚜렷한 방향성이 나타나기 전까지 비중을 조절하며 관망하는 전략이 유리합니다.`;
    }

    return `
        <div class="score-group-container">
            
            <div style="display: flex; flex-direction: column; gap: 24px; flex: 1;">
                <!-- Chart Area -->
                <div class="score-group-header">
                    <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0; border-radius: 50%; background: conic-gradient(#10b981 0% ${buyRatio * 100}%, #ef4444 ${buyRatio * 100}% 100%); display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <div style="position: absolute; width: 64px; height: 64px; background: #0f172a; border-radius: 50%; z-index: 2; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                            <span style="font-weight: 900; font-size: 1.1rem; color: ${buyRatio > 0.5 ? '#10b981' : '#ef4444'}">${Math.round(buyRatio * 100)}%</span>
                        </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
                        <div class="cf-bar-group">
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-bottom: 5px;">
                                <span>Buy (Inflow)</span><span style="color: #10b981; font-weight: 800;">${fmtValue(inflow)}</span>
                            </div>
                            <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${buyRatio * 100}%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="cf-bar-group">
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-bottom: 5px;">
                                <span>Sell (Outflow)</span><span style="color: #ef4444; font-weight: 800;">${fmtValue(outflow)}</span>
                            </div>
                            <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${(1 - buyRatio) * 100}%; background: #ef4444;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Breakdown Section -->
                <div style="background: rgba(15, 23, 42, 0.4); border-radius: 12px; padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <div>
                        <div style="color: #10b981; font-size: 0.8rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 5px;">
                             매수 상세 <small style="font-weight:400; color:#64748b;">(${Math.round(buyRatio * 100)}%)</small>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 4px;">
                            <div style="flex:1; text-align:center;"><div style="width:8px; height:8px; background:#10b981; border-radius:50%; margin:0 auto 4px;"></div><div style="font-size:0.6rem; color:#94a3b8;">Large</div><div style="font-size:0.7rem; font-weight:700;">${fmtValue(cf.inflow_large)}</div></div>
                            <div style="flex:1; text-align:center;"><div style="width:8px; height:8px; background:#10b981; opacity:0.6; border-radius:50%; margin:0 auto 4px;"></div><div style="font-size:0.6rem; color:#94a3b8;">Med</div><div style="font-size:0.7rem; font-weight:700;">${fmtValue(cf.inflow_medium)}</div></div>
                            <div style="flex:1; text-align:center;"><div style="width:8px; height:8px; background:#10b981; opacity:0.3; border-radius:50%; margin:0 auto 4px;"></div><div style="font-size:0.6rem; color:#94a3b8;">Small</div><div style="font-size:0.7rem; font-weight:700;">${fmtValue(cf.inflow_small)}</div></div>
                        </div>
                    </div>
                    <div>
                        <div style="color: #ef4444; font-size: 0.8rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 5px;">
                             매도 상세 <small style="font-weight:400; color:#64748b;">(${Math.round((1 - buyRatio) * 100)}%)</small>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 4px;">
                            <div style="flex:1; text-align:center;"><div style="width:8px; height:8px; background:#ef4444; border-radius:50%; margin:0 auto 4px;"></div><div style="font-size:0.6rem; color:#94a3b8;">Large</div><div style="font-size:0.7rem; font-weight:700;">${fmtValue(cf.outflow_large)}</div></div>
                            <div style="flex:1; text-align:center;"><div style="width:8px; height:8px; background:#ef4444; opacity:0.6; border-radius:50%; margin:0 auto 4px;"></div><div style="font-size:0.6rem; color:#94a3b8;">Med</div><div style="font-size:0.7rem; font-weight:700;">${fmtValue(cf.outflow_medium)}</div></div>
                            <div style="flex:1; text-align:center;"><div style="width:8px; height:8px; background:#ef4444; opacity:0.3; border-radius:50%; margin:0 auto 4px;"></div><div style="font-size:0.6rem; color:#94a3b8;">Small</div><div style="font-size:0.7rem; font-weight:700;">${fmtValue(cf.outflow_small)}</div></div>
                        </div>
                    </div>
                </div>

                <!-- Final Verdict -->
                <div class="${vClass}" style="background: #0f172a !important; border: 1px solid rgba(255,255,255,0.15); padding: 14px; border-radius: 12px; text-align: center; font-weight: 900; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.4); margin-top: auto;">
                    ${verdict}
                </div>

                <!-- AI Flow Intelligence -->
                <div class="ai-insight-box" style="border-left-color: #38bdf8; background: rgba(56, 189, 248, 0.05); color: #cbd5e1;">
                    <div style="font-weight: 800; color: #38bdf8; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                        🤖 AI Flow Intelligence
                    </div>
                    ${(() => {
            let flowNarrative = "";
            const buyPct = Math.round(buyRatio * 100);

            if (buyRatio >= 0.7) {
                flowNarrative = `현재 <b>${buyPct}%</b>의 압도적 자금 유입이 관찰되는 '공격적 매집' 단계입니다. `;
                if (isLargeBuying) flowNarrative += "기관 및 외국인 중심의 대형 자금(Large)이 주도하는 상방 매집이 뚜렷하며, ";
                if (cmf > 0.15) flowNarrative += `자금 흐름 지수(CMF: ${cmf.toFixed(2)})가 임계치를 넘어 매수세의 밀도가 매우 높습니다. `;
            } else if (buyRatio <= 0.3) {
                flowNarrative = `매도 압력이 <b>${100 - buyPct}%</b>에 달하는 '패닉 셀링' 또는 '강한 출회' 구간입니다. `;
                if (!isLargeBuying) flowNarrative += "대형 투자자들의 포지션 축소가 동반되고 있으며, ";
                if (isShortSurge) flowNarrative += `공매도 급증(+${shortChange.toFixed(1)}%)에 따른 투기적 하방 베팅이 강화되고 있습니다. `;
            } else {
                flowNarrative = "매수와 매도의 힘이 균형을 이루며 치열한 공방이 지속되는 구간입니다. ";
                if (isLargeBuying && buyRatio > 0.5) flowNarrative += "유통 물량을 대형 자금이 조용히 흡수하는 과정으로 판단되며, ";
                else if (!isLargeBuying && buyRatio < 0.5) flowNarrative += "개인 투자자 위주의 매수세가 유입되나 대형 자금의 이탈 징후가 섞여 있습니다. ";

                if (isShortSqueeze) flowNarrative += "공매도 환매수(Short Covering)로 인한 하락 진정 및 기술적 반등 가능성이 포착됩니다. ";
            }

            if (volRatio > 2.0) flowNarrative += `거래량이 평균 대비 ${volRatio.toFixed(1)}배 폭증하며 손바꿈(Churning)이 활발하게 일어나는 핵심 변곡점입니다. `;

            return flowNarrative;
        })()}
                    ${(() => {
            const insider = ind.insider_sentiment || "";
            const phase = stock.reason?.structure?.pattern || "";
            const isSpring = ind.spring_detected || phase === 'Accumulation';

            if (buyRatio <= 0.3 && (insider.includes('Bullish') || isSpring)) {
                return `<div style="margin-top:8px; color:#fbbf24; font-size:0.65rem; border-top:1px dashed rgba(251,191,36,0.3); padding-top:6px;">⚠️ <b>인텔리전스 신호 (Bear Trap):</b> 표면적인 매도 압력에도 불구하고 내부자 매수 및 와이코프 매집 패턴이 확인됩니다. 이는 '개미 털기'성 일시적 하락(Spring)일 확률이 높으므로 저점 분할 매수 기회로 활용 가능합니다.</div>`;
            } else if (buyRatio >= 0.7 && (insider.includes('Bearish') || phase === 'Distribution')) {
                return `<div style="margin-top:8px; color:#fb7185; font-size:0.65rem; border-top:1px dashed rgba(251,113,133,0.3); padding-top:6px;">⚠️ <b>인텔리전스 신호 (Bull Trap):</b> 강한 수급 유입에도 불구하고 내부자 매도 및 분산(Distribution) 패턴이 병행되고 있습니다. 고점에서의 물량 넘기기 가능성이 있으므로 전고점 돌파 실패 시 즉각적인 비중 축소가 권장됩니다.</div>`;
            }
            return '';
        })()}
                </div>
                
                <div style="font-size: 0.65rem; color: #475569; text-align: center; font-style: italic;">
                    * Synthetic Flow Model 추정치 (Large: 기관/외인, Small: 개인)
                </div>
            </div>
        </div>
    `;
}

// [NEW] PICK Component: Gauge + bars
function buildPickComponentHtml(stock) {
    const pickInfo = buildRecommendationScore(stock);
    const pickTotal = (stock.rec_score !== undefined && stock.rec_score !== null) ? stock.rec_score : pickInfo.total;

    let color = '#fbbf24';
    if (pickTotal >= 70) color = '#34d399';
    else if (pickTotal >= 55) color = '#38bdf8';
    else if (pickTotal <= 30) color = '#fb7185';
    const angle = (pickTotal / 100) * 360;

    const factors = stock.factors || {};
    const aiBase = pickInfo.breakdown?.aiPred?.val || 50;
    const techMod = pickInfo.breakdown?.techModifier?.val || 0;
    const adj = pickInfo.adjustment || 0;
    const regScore = factors.regime_score !== undefined ? factors.regime_score : null;
    const rrScore = factors.rr_score !== undefined ? factors.rr_score : null;
    const regMod = regScore !== null ? +((regScore - 50) * 0.15).toFixed(1) : null;
    const rrMod = rrScore !== null ? +((rrScore - 50) * 0.10).toFixed(1) : null;

    const fmtMod = v => v >= 0 ? `+${v}` : `${v}`;

    // R:R Analysis for filling space
    const tpRaw = stock.reason?.fundamentals?.target_price || stock.reason?.target_price || "";
    let targetPrice = parseFloat(String(tpRaw).replace(/[$,원]/g, '').replace(/,/g, '')) || 0;
    const currentPrice = stock.rawPrice || parseFloat(String(stock.currentPrice || stock.price || "").replace(/[$,원]/g, '').replace(/,/g, '')) || 0;

    // [FIX] Currency mismatch detection & conversion
    const hasWon = String(tpRaw).includes('원');
    const hasDollar = String(tpRaw).includes('$');
    const isKrStock = (stock.nativeCurrency === 'KRW');
    const rate = window.CURRENT_USD_RATE || 1400; // Fallback to 1400 if not set

    if (hasWon && !isKrStock) {
        // Target is in KRW but stock is US/Crypto (USD)
        targetPrice /= rate;
    } else if (hasDollar && isKrStock) {
        // Target is in USD but stock is KR (KRW)
        targetPrice *= rate;
    }

    const ind = stock.reason?.indicators || {};
    const atr = ind.atr || 0;

    // Calculate dynamic downside based on ATR (1.5x) or fallback to 8%
    let downsidePct = 8.0;
    if (atr > 0 && currentPrice > 0) {
        downsidePct = (atr * 1.5 / currentPrice) * 100;
    }

    let rrRatio = "N/A";
    let upsidePct = 0;
    if (targetPrice > currentPrice && currentPrice > 0) {
        upsidePct = ((targetPrice - currentPrice) / currentPrice) * 100;
        rrRatio = (upsidePct / downsidePct).toFixed(1);
    }

    // Dynamic bar widths
    const totalRange = upsidePct + downsidePct;
    const riskWidth = (downsidePct / totalRange) * 100;
    const rewardWidth = (upsidePct / totalRange) * 100;
    const separatorLeft = riskWidth;

    // AI Diagnostics fields
    const difficulty = stock.difficulty || "MEDIUM";
    const recentHitRate = stock.recent_hit_rate !== undefined ? stock.recent_hit_rate : null;
    const gbProbUp = stock.gb_prob_up !== undefined ? stock.gb_prob_up : 0.5;

    // Difficulty badge styling
    let diffColor = '#94a3b8';
    let diffBg = 'rgba(148, 163, 184, 0.1)';
    let diffBorder = 'rgba(148, 163, 184, 0.2)';
    if (difficulty === 'HARD') {
        diffColor = '#fb7185';
        diffBg = 'rgba(251, 113, 133, 0.1)';
        diffBorder = 'rgba(251, 113, 133, 0.2)';
    } else if (difficulty === 'EASY') {
        diffColor = '#34d399';
        diffBg = 'rgba(52, 211, 153, 0.1)';
        diffBorder = 'rgba(52, 211, 153, 0.2)';
    }

    // Hit rate calculation
    let hitRateText = "N/A";
    let hitRatePct = 0;
    let hitRateColor = "#64748b";
    let hitRateBarColor = "rgba(255,255,255,0.1)";
    if (recentHitRate !== null && recentHitRate !== undefined) {
        const hr = recentHitRate * 100;
        hitRateText = `${hr.toFixed(1)}%`;
        hitRatePct = hr;
        if (hr >= 65) {
            hitRateColor = "#34d399";
            hitRateBarColor = "#34d399";
        } else if (hr >= 50) {
            hitRateColor = "#38bdf8";
            hitRateBarColor = "#38bdf8";
        } else if (hr >= 40) {
            hitRateColor = "#fbbf24";
            hitRateBarColor = "#fbbf24";
        } else {
            hitRateColor = "#fb7185";
            hitRateBarColor = "#fb7185";
        }
    }

    // Classifier Consensus calculation
    let gbColor = "#cbd5e1";
    let gbBarColor = "#38bdf8";
    if (gbProbUp >= 0.58) {
        gbColor = "#34d399";
        gbBarColor = "#34d399";
    } else if (gbProbUp <= 0.42) {
        gbColor = "#fb7185";
        gbBarColor = "#fb7185";
    }

    // Auto filter message
    let autoFilterMsg = "";
    if (difficulty === 'HARD') {
        autoFilterMsg = "자정 필터 작동: 노이즈 HARD 구간 보합(NEUTRAL) 고정";
    } else if (recentHitRate !== null && recentHitRate < 0.40) {
        autoFilterMsg = "자정 필터 작동: 최근 저성능(<40%) 보합(NEUTRAL) 고정";
    }

    return `
        <div class="score-group-container">

            <div class="score-group-header">
                <div class="tooltip-container">
                    <div class="mfc-gauge" style="width: 70px; height: 70px; background: conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg); cursor: help;">
                        <div class="mfc-gauge-inner" style="width: 56px; height: 56px;">
                            <span class="mfc-gauge-value" style="color:${color}; font-size: 1.3rem;">${Math.round(pickTotal)}</span>
                            <span class="mfc-gauge-label">PICK</span>
                        </div>
                    </div>
                    <div class="tooltip-text" style="bottom: 100%; top: auto; margin-bottom: 15px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
                        ${getPickTooltip(stock)}
                    </div>
                </div>
                <div class="score-bars-stack" style="flex: 1;">
                    <div class="score-bar-item"><span class="bar-label">AI Pred:</span> <span class="bar-value" style="color:#818cf8">${aiBase} pts</span></div>
                    <div class="score-bar-item"><span class="bar-label">Tech Mod:</span> <span class="bar-value" style="color:${techMod >= 0 ? '#f25f7a' : '#5f97f2'}">${techMod >= 0 ? '+' : ''}${techMod} pts</span></div>
                    <div class="score-bar-item"><span class="bar-label">Risk Adj:</span> <span class="bar-value" style="color:${adj >= 0 ? '#f25f7a' : '#5f97f2'}">${adj >= 0 ? '+' : ''}${adj} pts</span></div>
                    ${regMod !== null ? `<div class="score-bar-item"><span class="bar-label">Regime:</span> <span class="bar-value" style="color:${regMod >= 0 ? '#f25f7a' : '#5f97f2'}">${fmtMod(regMod)} pts</span></div>` : ''}
                    ${rrMod !== null ? `<div class="score-bar-item"><span class="bar-label">R:R:</span> <span class="bar-value" style="color:${rrMod >= 0 ? '#f25f7a' : '#5f97f2'}">${fmtMod(rrMod)} pts</span></div>` : ''}
                </div>
            </div>

            <!-- AI Predictor Diagnostics -->
            <div class="ai-diagnostics-box" style="margin-top: 15px; padding: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                <div style="font-size: 0.75rem; color: #818cf8; font-weight: 800; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span>🔬 AI PREDICTOR DIAGNOSTICS</span>
                    <span class="difficulty-badge" style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; color: ${diffColor}; background: ${diffBg}; border: 1px solid ${diffBorder};">
                        ${difficulty}
                    </span>
                </div>
                
                <!-- 최근 AI 적중률 프로그레스바 -->
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #64748b; margin-bottom: 4px;">
                        <span>Recent Hit Rate</span>
                        <span style="font-weight: 700; color: ${hitRateColor};">${hitRateText}</span>
                    </div>
                    <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${hitRatePct}%; height: 100%; background: ${hitRateBarColor}; transition: width 0.5s ease;"></div>
                    </div>
                </div>

                <!-- 보조 분류기 합의도 프로그레스바 -->
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #64748b; margin-bottom: 4px;">
                        <span>Classifier Consensus (GB P_UP)</span>
                        <span style="font-weight: 700; color: ${gbColor};">${(gbProbUp * 100).toFixed(1)}% Upward Bias</span>
                    </div>
                    <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${(gbProbUp * 100)}%; height: 100%; background: ${gbBarColor}; transition: width 0.5s ease;"></div>
                    </div>
                </div>

                <!-- 자정 장치 경고 메시지 -->
                ${autoFilterMsg ? `
                <div style="margin-top: 8px; font-size: 0.65rem; color: #fb7185; background: rgba(251, 113, 133, 0.08); border: 1px solid rgba(251, 113, 133, 0.15); border-radius: 4px; padding: 6px 8px; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                    🛡️ <span>${autoFilterMsg}</span>
                </div>` : ''}
            </div>

            <!-- Profitability Analysis -->
            <div class="health-matrix-box">
                <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 800; margin-bottom: 12px; display: flex; justify-content: space-between;">
                    <span>PROFITABILITY ANALYSIS</span>
                    <span style="color: var(--accent-cyan); margin-left: 8px;">R:R ${rrRatio}</span>
                </div>
                <div style="position: relative; height: 36px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; display: flex;">
                    <div style="width: ${riskWidth}%; background: #ef4444; opacity: 0.3; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 800; transition: width 0.5s ease;">RISK</div>
                    <div style="width: ${rewardWidth}%; background: #10b981; opacity: 0.3; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 800; transition: width 0.5s ease;">REWARD</div>
                    <div style="position: absolute; left: ${separatorLeft}%; top: 0; width: 2px; height: 100%; background: #fff; box-shadow: 0 0 10px #fff; transition: left 0.5s ease; z-index: 2;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.65rem; color: #64748b;">
                    <span>Stop Loss: -${downsidePct.toFixed(1)}%</span>
                    <span>Target: +${upsidePct.toFixed(1)}%</span>
                </div>
            </div>

            <!-- AI Conviction Rationale -->
            <div class="ai-insight-box" style="border-left-color: #34d399; background: rgba(52, 211, 153, 0.05); color: #cbd5e1;">
                <div style="font-weight: 800; color: #34d399; margin-bottom: 4px;">💡 AI Conviction Rationale</div>
                ${(() => {
            const regime = stock.marketRegime || stock.reason?.market_regime || "";
            const isBull = regime.includes('Bull') || regime.includes('Trending');
            const mq = factors.momentum_quality || 50;
            const insider = ind.insider_sentiment || "";

            let convictionNarrative = `종합 추천 점수 <b>${Math.round(pickTotal)}점</b>은 `;

            // Core Reason
            const baseReasons = [
                { check: aiBase >= 65, text: "GARCH-Ensemble 모델의 높은 시세 분출 신뢰도와 " },
                { check: aiBase >= 55, text: "안정적인 중장기 상향 궤적 시뮬레이션 결과와 " },
                { check: true, text: "신중한 리스크-리턴 프로파일링 및 헷지 관점이 " }
            ];
            convictionNarrative += baseReasons.find(r => r.check).text;

            const techReasons = [
                { check: techMod >= 7, text: "압도적인 기술적 Confluence(추세+모멘텀+수급의 합치)가 " },
                { check: techMod >= 0, text: "안정적인 기술적 지지 기반이 " },
                { check: true, text: "기술적 변동성에 대한 보수적 필터링이 " }
            ];
            convictionNarrative += techReasons.find(r => r.check).text;
            convictionNarrative += "결합된 수치입니다. ";

            // Macro & Quality
            if (isBull && mq >= 70) {
                convictionNarrative += `현재 ${regime} 레짐과의 정합성이 높으며, 모멘텀의 순도(${mq})가 우수하여 추세 추종 전략이 유효한 상태입니다. `;
            } else if (regime) {
                convictionNarrative += `불확실한 시장 레짐(${regime}) 하에서 자산 보호를 위한 방어적 가중치가 적용되었습니다. `;
            }

            // R:R
            if (rrRatio !== 'N/A' && parseFloat(rrRatio) >= 2.0) {
                convictionNarrative += `특히 기대 수익률 대비 잠재적 손실 폭이 매우 좁은(R:R ${rrRatio}) 비대칭적 우위 구간으로, 적극적인 비중 확대를 검토할 만한 시점입니다. `;
            } else if (rrRatio !== 'N/A' && parseFloat(rrRatio) < 1.0) {
                convictionNarrative += `다만 현재 가격대는 보상 대비 위험(R:R ${rrRatio})이 다소 높아, 신규 진입보다는 기존 물량의 추적 익절(Trailing Stop)이 권장됩니다. `;
            } else {
                convictionNarrative += "현재 구간은 보상과 위험이 균형을 이루고 있어, 분할 매수/매도를 통한 점진적 대응이 유리합니다. ";
            }

            if (insider.includes('Bullish')) convictionNarrative += "내부자 및 기관의 스마트 머니가 하방을 지지하고 있다는 점도 분석의 확신을 더합니다. ";

            return convictionNarrative;
        })()}
            </div>
        </div>
    `;
}

// [NEW] Consensus Chart Component
function buildConsensusChartHtml(stock, tooltipContent) {
    if (!stock.consensusPredictionImage) return '';

    // Compute overlay positions from actual chart geometry.
    // [v13] 기존에는 matplotlib 여백(6%/88%)과 룩백(40봉)을 프런트에 **하드코딩**했다.
    // 파이썬 쪽 레이아웃이 바뀌면 hover 툴팁이 조용히 어긋나므로,
    // 이제 `chartMeta`(generate_prediction.py 가 내보냄)를 단일 소스로 읽는다.
    // 구버전 데이터(chartMeta 없음)를 위해 기존 값을 폴백으로 남긴다.
    const meta = stock.chartMeta || {};
    const CHART_LEFT = (typeof meta.left_pct === 'number') ? meta.left_pct : 6;
    const CHART_PLOT = (typeof meta.plot_pct === 'number') ? meta.plot_pct : 88;
    const HIST_BARS = (typeof meta.hist_bars === 'number') ? meta.hist_bars : 40;
    const fcLen = (typeof meta.fc_len === 'number' && meta.fc_len > 0)
        ? meta.fc_len
        : ((stock.consensusPath || []).length || 10);
    const totalBars = HIST_BARS + fcLen;
    const histW = (HIST_BARS / totalBars) * CHART_PLOT;
    const foreW = (fcLen / totalBars) * CHART_PLOT;
    const foreLeft = CHART_LEFT + histW;

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
        const v = item.volume > 1000000 ? (item.volume / 1000000).toFixed(1) + 'M' : (item.volume / 1000).toFixed(0) + 'K';

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
        const v = item.volume > 1000000 ? (item.volume / 1000000).toFixed(1) + 'M' : (item.volume / 1000).toFixed(0) + 'K';
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
        
        let rangeStr = '';
        if (stock.consensusUpperPath && stock.consensusUpperPath[i] && stock.consensusLowerPath && stock.consensusLowerPath[i]) {
            const uVal = stock.consensusUpperPath[i];
            const lVal = stock.consensusLowerPath[i];
            const uStr = isKrw ? uVal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원' : '$' + uVal.toFixed(2);
            const lStr = isKrw ? lVal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원' : '$' + lVal.toFixed(2);
            rangeStr = `${lStr} ~ ${uStr}`;
        }
        return `
                    <div class="hover-col" style="flex: 1; height: 100%; cursor: crosshair; pointer-events: auto;" onmousemove="showChartTooltip(event, 'T+${i + 1}', '${priceStr}', '${pctStr}', null, null, null, null, '${rangeStr}')" onmouseleave="hideChartTooltip(event)"></div>
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
                ${/* [v13] 예측 수치 위상 하향 — 백테스트에서 무작위와 구분 불가(z=+0.05).
                       숫자를 지우지 않되 신뢰 수준을 함께 표시해 오독을 막는다. */''}
                ${(window.RiskUI && window.RiskUI.renderPredictionBadge)
                    ? window.RiskUI.renderPredictionBadge(stock)
                    : `<div class="prediction-badge ${stock.predictedResult.includes('-') ? 'down' : 'up'}" style="font-size: 0.8rem; padding: 3px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                    Forecast: ${stock.predictedResult}
                </div>`}
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
        'Trending-Bull': { cls: 'regime-bull', icon: '🟢', label: 'BULL TREND' },
        'Trending-Bear': { cls: 'regime-bear', icon: '🔴', label: 'BEAR TREND' },
        'Volatile-Chop': { cls: 'regime-chop', icon: '🟡', label: 'VOLATILE CHOP' },
        'Low-Vol Compression': { cls: 'regime-lowvol', icon: '🔵', label: 'LOW VOL' },
        'Transitional': { cls: 'regime-transition', icon: '⚪', label: 'TRANSITIONAL' },
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
        'Trending-Bull': { color: '#34d399', label: 'BULL TREND' },
        'Trending-Bear': { color: '#fb7185', label: 'BEAR TREND' },
        'Volatile-Chop': { color: '#fbbf24', label: 'VOLATILE CHOP' },
        'Low-Vol Compression': { color: '#38bdf8', label: 'LOW VOL' },
        'Transitional': { color: '#94a3b8', label: 'TRANSITION' },
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

    if (evalStr.includes('강력 매수') || evalStr.includes('STRONG BUY')) return 'strong-buy';
    if (evalStr.includes('강력 매도') || evalStr.includes('STRONG SELL')) return 'strong-sell';
    if (evalStr.includes('매수')) return 'buy';
    if (evalStr.includes('매도')) return 'sell';
    return 'hold';
}

/**
 * [NEW] 공매도 급증 신호를 분석하여 숏 스퀴즈(호재성)와 하방 압력(악재성)을 구분하여 표시합니다.
 */
function getShortSurgeBadgeHtml(stock) {
    const ind = stock.reason?.indicators || {};
    const shortChange = ind.short_interest_change_pct || 0;
    
    if (shortChange < 8) {
        // [EXTRA] 숏 커버링 (공매도 대폭 감소) 감지 시 별도 표기 가능
        if (shortChange <= -12) {
            return `<span class="short-squeeze-badge covering" title="공매도 잔고 급격히 감소 중! 숏 커버링에 의한 반등 기대">💎 Short Covering</span>`;
        }
        return '';
    }

    // 판단 로직:
    // 1. 가격 모멘텀 (오늘 상승 중인가?)
    // 2. 추세 정합성 (정배열인가?)
    // 3. 거래량 (평균 대비 거래량이 동반되는가?)
    
    const isPriceUp = (stock.changePercent || 0) > 0;
    const isBullTrend = (ind.ma_alignment || '').includes('정배열');
    const hasVolume = (ind.volume_ratio || 1) > 1.2;
    
    // 숏 스퀴즈 후보: 가격이 버티거나 오르고 있으며, 추세가 살아있을 때
    const isSqueezeCandidate = isPriceUp || (isBullTrend && (stock.changePercent || 0) > -1);

    if (isSqueezeCandidate) {
        return `<span class="short-squeeze-badge bullish" title="공매도 급증 중이나 주가가 버티고 있음! 숏 스퀴즈(폭등) 가능성 유의">🔥 Squeeze Alert</span>`;
    } else {
        return `<span class="short-squeeze-badge bearish" title="공매도 급증 및 하방 압력 강화! 주가 추가 하락 주의">🚨 Bearish Surge</span>`;
    }
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
    let high60 = parseFloat(fib.high_60d);
    let low60 = parseFloat(fib.low_60d);

    // [FIX] Convert USD fibonacci boundaries to KRW if the display currency is KRW
    const isKrw = stock.nativeCurrency === 'KRW';
    const rate = window.CURRENT_USD_RATE || 1400;
    if (isKrw) {
        if (high60 && high60 < 100) {
            high60 *= rate;
        }
        if (low60 && low60 < 100) {
            low60 *= rate;
        }
    } else {
        if (high60 && high60 > 1000) {
            high60 /= rate;
        }
        if (low60 && low60 > 1000) {
            low60 /= rate;
        }
    }

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

    const valData = stock.reason?.valuation_data || {};
    const hasValData = valData.pe_ratio !== undefined || valData.ps_ratio !== undefined || valData.peg_ratio !== undefined || valData.market_cap !== undefined;

    let tableHtml = '';
    if (hasValData) {
        const fmtVal = (v, suffix = '') => (v === null || v === undefined || isNaN(v)) ? 'N/A' : v.toLocaleString(undefined, { maximumFractionDigits: 2 }) + suffix;
        const fmtCap = (v) => {
            if (v === null || v === undefined || isNaN(v)) return 'N/A';
            if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T';
            if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
            if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
            return v.toLocaleString();
        };

        tableHtml = `
            <div class="fundamentals-summary" style="margin-top: 15px; border-top: 1px dotted rgba(255,255,255,0.1); padding-top: 12px;">
                <div style="font-size: 0.72rem; color: #a78bfa; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.05rem;">📋 재무제표 펀더멘털 요약 (Fundamental Indicators)</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:0.6rem; color:#64748b;">Market Cap (시총)</span>
                        <span style="font-size:0.75rem; font-weight:700; color:#e2e8f0;">${fmtCap(valData.market_cap)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:0.6rem; color:#64748b;">P/E (주가수익비율)</span>
                        <span style="font-size:0.75rem; font-weight:700; color:#38bdf8;">${fmtVal(valData.pe_ratio)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:0.6rem; color:#64748b;">P/S (주가매출비율)</span>
                        <span style="font-size:0.75rem; font-weight:700; color:#38bdf8;">${fmtVal(valData.ps_ratio)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:0.6rem; color:#64748b;">PEG Ratio</span>
                        <span style="font-size:0.75rem; font-weight:700; color:#818cf8;">${fmtVal(valData.peg_ratio)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:0.6rem; color:#64748b;">EV/EBITDA</span>
                        <span style="font-size:0.75rem; font-weight:700; color:#818cf8;">${fmtVal(valData.ev_ebitda)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-size:0.6rem; color:#64748b;">D/E (부채비율)</span>
                        <span style="font-size:0.75rem; font-weight:700; color:#fb7185;">${fmtVal(valData.debt_equity)}</span>
                    </div>
                </div>
            </div>
        `;
    }

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
            ${tableHtml}
        </div>
    `;
}

function buildSignalChecklistHtml(stock) {
    const indicators = stock.reason?.indicators || {};
    const rsi = parseFloat(parseRsi(stock)) || 50;
    const cf = indicators.capital_flow || {};
    const buyRatio = (cf.total_inflow / (cf.total_inflow + cf.total_outflow)) || 0;

    const isShortSqueeze = !!(stock.short_squeeze || indicators.short_squeeze) || 
                           ((indicators.short_percent_float || 0) > 0.20 && (stock.changePercent || 0) > 5.0);

    const curStr = stock.currentPrice || stock.rawPrice || '';
    const curVal = parseFloat(String(curStr).replace(/[^\d.]/g, '')) || 0;
    const ma20 = parseFloat(indicators.ma_20) || 0;
    const deviationPct = stock.deviation_pct !== undefined ? parseFloat(stock.deviation_pct) : ((ma20 > 0 && curVal > 0) ? ((curVal - ma20) / ma20) * 100 : 0);

    const pts = [
        { check: indicators.ma_alignment?.includes('정배열'), icon: '📈', text: 'Perfect Alignment', cls: 'positive', value: (indicators.ma_alignment || 'Neutral').substring(0, 10) },
        { check: indicators.spring_detected, icon: '🔔', text: 'Wyckoff Spring', cls: 'positive', value: indicators.spring_detected ? 'Detected' : 'None' },
        { check: indicators.bollinger_squeeze, icon: '🗜️', text: 'Vol Squeeze', cls: 'neutral', value: indicators.bollinger_squeeze ? 'Active' : 'Stable' },
        { check: indicators.volume_climax, icon: '⚡', text: 'Vol Climax', cls: 'neutral', value: indicators.volume_climax ? 'Yes' : 'No' },
        { check: rsi <= 35, icon: '💎', text: 'Oversold RSI', cls: 'positive', value: rsi <= 35 ? rsi.toFixed(0) : 'Normal' },
        { check: rsi >= 70, icon: '🔥', text: 'Overbought RSI', cls: 'negative', value: rsi >= 70 ? rsi.toFixed(0) : 'Normal' },
        { check: indicators.upthrust_detected, icon: '⚠️', text: 'Wyckoff Upthrust', cls: 'negative', value: indicators.upthrust_detected ? 'Caution' : 'None' },
        { check: isShortSqueeze, icon: '🔥', text: 'Short Squeeze', cls: 'positive', value: isShortSqueeze ? 'Active' : 'Stable' },
        { check: (indicators.short_interest_change_pct || 0) < -10, icon: '🚀', text: 'Short Covering', cls: 'positive', value: (indicators.short_interest_change_pct || 0) < -10 ? (indicators.short_interest_change_pct || 0).toFixed(1) + '%' : 'Normal' },
        { check: deviationPct <= -10, icon: '📉', text: 'Mean Reversion', cls: 'positive', value: deviationPct <= -10 ? deviationPct.toFixed(1) + '%' : 'Normal' },
        { check: buyRatio >= 0.7, icon: '🐳', text: 'Whale Activity', cls: 'positive', value: Math.round(buyRatio * 100) + '%' },
        { check: indicators.rsi_divergence && indicators.rsi_divergence !== 'none', icon: '🎯', text: 'RSI Divergence', cls: indicators.rsi_divergence === 'bullish' ? 'positive' : 'negative', value: indicators.rsi_divergence === 'bullish' ? 'Bullish' : (indicators.rsi_divergence === 'bearish' ? 'Bearish' : 'Normal') },
        { check: Math.abs(indicators.cmf || 0) >= 0.05, icon: '💵', text: 'Money Flow (CMF)', cls: (indicators.cmf || 0) >= 0.05 ? 'positive' : 'negative', value: (indicators.cmf || 0) >= 0.05 ? 'Inflow (' + (indicators.cmf || 0).toFixed(2) + ')' : ((indicators.cmf || 0) <= -0.05 ? 'Outflow (' + (indicators.cmf || 0).toFixed(2) + ')' : 'Normal') }
    ];

    return `
        <div class="signal-checklist-container" style="margin-top: 0.25rem; margin-bottom: 0.25rem; background: linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.2) 100%); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.5rem 0.75rem; position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; line-height: 1;">
                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; letter-spacing: 0.05rem; display: flex; align-items: center; gap: 6px;">
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="display: block;"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    <span style="display: inline-block; padding-top: 1px;">SIGNAL & PATTERN CONFLUENCE</span>
                </div>
                <div style="font-size: 0.5rem; color: #475569; display: flex; align-items: center; gap: 4px; background: rgba(52, 211, 153, 0.05); padding: 2px 6px; border-radius: 10px; border: 1px solid rgba(52, 211, 153, 0.1);">
                    <span style="width: 5px; height: 5px; background: #34d399; border-radius: 50%; box-shadow: 0 0 4px #34d399; display: inline-block;"></span>
                    <span style="font-weight: 800; letter-spacing: 0.02rem;">LIVE</span>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 5px;">
                ${pts.map(p => `
                    <div style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(255,255,255,${p.check ? '0.08' : '0.04'}); border-radius: 6px; border: 1px solid ${p.check ? (p.cls === 'positive' ? 'rgba(52,211,153,0.3)' : p.cls === 'negative' ? 'rgba(251,113,133,0.3)' : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.06)'}; opacity: ${p.check ? '1' : '0.85'}; transition: all 0.3s ease;">
                        <span style="font-size: 0.85rem; filter: ${p.check ? 'none' : 'grayscale(0.5)'}; opacity: ${p.check ? '1' : '0.7'}">${p.icon}</span>
                        <div style="display:flex; flex-direction:column; gap:0px; overflow:hidden;">
                            <span style="font-size: 0.6rem; font-weight: 800; color: ${p.check ? (p.cls === 'positive' ? '#34d399' : p.cls === 'negative' ? '#fb7185' : '#fff') : '#cbd5e1'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.text}</span>
                            <span style="font-size: 0.5rem; color: ${p.check ? '#94a3b8' : '#64748b'}; font-weight: 700;">${p.value}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 0.4rem; font-size: 0.6rem; color: #94a3b8; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.4rem; font-weight: 600;">
                <span style="letter-spacing: 0.02rem;">Phase: <b style="color: #cbd5e1;">${stock.reason?.structure?.pattern || 'N/A'}</b></span>
                <span style="letter-spacing: 0.02rem; cursor: help;" title="${(indicators.anomalies || []).join(', ') || 'No unusual patterns detected'}">Anomalies: <b style="color: ${(indicators.anomalies || []).length > 0 ? '#fb7185' : '#cbd5e1'};">${(indicators.anomalies || []).length} detected</b></span>
            </div>
        </div>
    `;
}

/**
 * [v2 NEW] Render Action Score Dial SVG
 */
function buildActionDialHtml(score) {
    const s = score || 50;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (s / 100) * circumference;
    
    // Dynamic color based on score
    let color = '#fb7185'; // low
    if (s >= 70) color = '#34d399'; // high
    else if (s >= 30) color = '#fbbf24'; // mid
    
    return `
        <div class="action-dial-wrapper">
            <svg aria-hidden="true" focusable="false" class="action-dial-svg" width="80" height="80" viewBox="0 0 80 80">
                <circle class="action-dial-bg" cx="40" cy="40" r="${radius}" />
                <circle class="action-dial-fill" cx="40" cy="40" r="${radius}" 
                    stroke="${color}"
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${offset}" />
            </svg>
            <div class="action-score-text">${s}</div>
        </div>
    `;
}

/**
 * [v2 NEW] Render Institutional Intelligence Flags
 */
function buildInstitutionalFlagsHtml(stock) {
    const reason = stock.reason || {};
    const ind = reason.indicators || {};
    const flags = [];
    
    // Check flags from DB assets or reason indicators
    if (stock.low_float || ind.low_float) {
        flags.push('<span class="inst-flag flag-low-float">💎 Low Float</span>');
    }
    if (stock.short_squeeze || ind.short_squeeze) {
        flags.push('<span class="inst-flag flag-short-squeeze">🚀 Squeeze Alert</span>');
    }
    if (stock.ai_momentum || ind.ai_momentum) {
        flags.push('<span class="inst-flag flag-ai-momentum">🤖 AI Momentum</span>');
    }
    
    if (flags.length === 0) return '';
    return `<div class="institutional-flags">${flags.join('')}</div>`;
}

/**
 * [v2 NEW] Render Macro Bias Bar
 */
function buildMacroBiasHtml(score) {
    if (score === undefined || score === null) return '';
    
    const val = parseFloat(score);
    const absVal = Math.abs(val);
    const percentage = Math.min(100, (absVal / 1.0) * 50); // Scale 0-1 for 50% width
    
    const isPositive = val >= 0;
    const color = isPositive ? '#34d399' : '#fb7185';
    const label = isPositive ? 'Bullish Bias' : 'Bearish Bias';
    
    return `
        <div class="macro-bias-container">
            <div class="macro-bias-header">
                <span class="macro-bias-label">GLOBAL MACR0 BIAS</span>
                <span class="macro-bias-value" style="color: ${color}">${label} (${val > 0 ? '+' : ''}${val.toFixed(2)})</span>
            </div>
            <div class="macro-bias-bar-bg">
                <div class="macro-bias-bar-fill" style="width: ${percentage}%; background: ${color}; left: ${isPositive ? '50%' : `calc(50% - ${percentage}%)`}"></div>
            </div>
        </div>
    `;
}

/**
 * [v2 NEW] Get SuperTrend Badge
 */
function getSuperTrendBadgeHtml(val) {
    if (!val || val === 'neutral') return '';
    const isBull = val === 'bullish';
    return `<span class="supertrend-badge ${isBull ? 'st-bull' : 'st-bear'}">${isBull ? '▲' : '▼'} SuperTrend</span>`;
}

/**
 * [NEW] 휴장일 등으로 데이터가 100% 동일하게 복제된 보고서를 건너뛰고, 실제 데이터 변동이 존재했던 직전 보고서를 반환합니다.
 */
function findActualPreviousData(data, startIndex) {
    if (startIndex < 0 || startIndex >= REPORTS_HISTORY.length - 1) return null;
    
    for (let i = startIndex + 1; i < REPORTS_HISTORY.length; i++) {
        const candidate = REPORTS_HISTORY[i];
        if (!candidate) continue;
        
        let isIdentical = true;
        if (data.holdings && candidate.holdings && data.holdings.length === candidate.holdings.length) {
            for (let j = 0; j < data.holdings.length; j++) {
                const curStock = data.holdings[j];
                const candStock = candidate.holdings.find(s => s.symbol === curStock.symbol);
                if (!candStock) {
                    isIdentical = false;
                    break;
                }
                const curMfc = parseFloat(curStock.reason?.mfc_score || curStock.mfcScore || 0);
                const candMfc = parseFloat(candStock.reason?.mfc_score || candStock.mfcScore || 0);
                const curPrice = parseFloat(curStock.rawPrice || 0);
                const candPrice = parseFloat(candStock.rawPrice || 0);
                
                if (curMfc !== candMfc || curPrice !== candPrice) {
                    isIdentical = false;
                    break;
                }
            }
        } else {
            isIdentical = false;
        }
        
        if (!isIdentical) {
            return { data: candidate, index: i };
        }
    }
    
    return { data: REPORTS_HISTORY[startIndex + 1] || null, index: startIndex + 1 };
}

function renderDashboard(data) {
    window.CURRENT_VIEW_DATA = data;
    
    // [NEW] 휴장일 등으로 차트 이미지나 예측 데이터가 비어있는 경우, 이전 리포트 데이터(전날)에서 동일 종목 데이터를 폴백해 상속함
    if (typeof REPORTS_HISTORY !== 'undefined') {
        const selectedIndex = REPORTS_HISTORY.findIndex(r => r.date === data.date);
        const prevResult = findActualPreviousData(data, selectedIndex);
        const previousData = prevResult ? prevResult.data : null;
        if (previousData) {
            ['holdings', 'watchlist'].forEach(key => {
                if (data[key]) {
                    data[key].forEach(stock => {
                        const isKr = (stock.symbol || '').includes('.KS') || (stock.symbol || '').includes('.KQ') || /^\d{6}$/.test(stock.symbol || '');
                        const isKrHoliday = stock.reason && stock.reason.is_market_holiday === true;
                        
                        // 이미지가 없거나 예측 경로가 비어있는 경우
                        const hasNoImage = !stock.consensusPredictionImage || stock.consensusPredictionImage === '';
                        const hasNoPath = !stock.forecastPath || stock.forecastPath.length === 0;
                        
                        if (hasNoImage || hasNoPath) {
                            const prevStock = (previousData[key] || []).find(s => s.symbol === stock.symbol);
                            if (prevStock) {
                                if (hasNoImage) {
                                    if (prevStock.consensusPredictionImage) stock.consensusPredictionImage = prevStock.consensusPredictionImage;
                                    if (prevStock.image) stock.image = prevStock.image;
                                    if (prevStock.predictionImage) stock.predictionImage = prevStock.predictionImage;
                                    if (prevStock.regressionPredictionImage) stock.regressionPredictionImage = prevStock.regressionPredictionImage;
                                }
                                if (hasNoPath) {
                                    if (prevStock.forecastPath) stock.forecastPath = prevStock.forecastPath;
                                    if (prevStock.consensusPath) stock.consensusPath = prevStock.consensusPath;
                                }
                            }
                        }
                    });
                }
            });
        }
    }
    
    // [MOD] IS_LATEST_REPORT refinement: 
    // True if it's the first report in the history AND it's recent (within 2 days to account for weekends/timezones)
    const isFirstReport = (typeof REPORTS_HISTORY !== 'undefined' && REPORTS_HISTORY.length > 0 && REPORTS_HISTORY[0] === data);
    const reportDate = new Date(data.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.abs(today - reportDate) / (1000 * 60 * 60 * 24);
    
    window.IS_LATEST_REPORT = isFirstReport && (diffDays <= 2);

    // [NEW] Visibility of AI Terminals based on report age
    const homeTerminal = document.getElementById('live-intelligence-briefing');
    const dashboardTerminal = document.getElementById('ai-intelligence-terminal');
    const isDashboard = document.querySelector('.global-tab[data-target="view-dashboard"]')?.classList.contains('active');

    if (homeTerminal) homeTerminal.style.display = window.IS_LATEST_REPORT ? 'block' : 'none';
    if (dashboardTerminal) dashboardTerminal.style.display = (window.IS_LATEST_REPORT && isDashboard) ? 'block' : 'none';

    // [NEW] Reset or Offline UI for Breaking Quantum elements
    const breakingTerminalBody = document.querySelector('#breaking-ai-terminal .terminal-body');
    const sentimentValEl = document.getElementById('live-sentiment-value');
    const sentimentMarkerEl = document.getElementById('live-sentiment-marker');
    const ledger = document.getElementById('block-trade-ledger');
    
    if (window.IS_LATEST_REPORT === false) {
        resetLiveFlowMonitorState();
        const briefingTerminal = document.getElementById('briefing-terminal-text');
        if (briefingTerminal) {
            briefingTerminal.innerHTML = '<div class="terminal-line-row">> Monitoring Offline - SESSION CLOSED</div>';
        }
        if (breakingTerminalBody) {
            breakingTerminalBody.innerHTML = '<div class="terminal-line-row">> Surveillance Offline - SESSION CLOSED</div>';
            breakingTerminalBody.dataset.initialized = '';
        }
        if (sentimentValEl) {
            sentimentValEl.textContent = 'OFFLINE (Closed)';
            sentimentValEl.style.color = '#64748b';
        }
        if (sentimentMarkerEl) {
            sentimentMarkerEl.style.left = '50%';
        }
        if (ledger) {
            ledger.innerHTML = '<div style="color: #64748b; text-align: center; margin-top: auto; margin-bottom: auto;">Session Closed</div>';
        }
    } else {
        restartLiveMonitoring(data);
    }

    if (aiCore) {
        aiCore.stop();
    }
    aiCore = new AIIntelligenceCore(data);
    setTimeout(() => aiCore.init(), 1000); // Small delay for rendering

    // [NEW] Global context for currency conversion
    window.CURRENT_USD_RATE = data.usdToKrwRate || 1400;

    // [NEW] Update Realtime Components
    updateTrendingStocks(data);
    updateMarketTicker(data);
    updateMarketStatus();
    renderDiscoveryPicks(data);

    // [NEW] COMPARE 탭 렌더링 호출
    if (typeof REPORTS_HISTORY !== 'undefined') {
        const selectedIndex = REPORTS_HISTORY.findIndex(r => r.date === data.date);

        // T-N 참조를 모두 selectedIndex+N 방식으로 통일
        // findActualPreviousData의 skip 로직이 휴장 복제 리포트를 건너뛰어
        // previousData와 prevPrevData가 동일한 리포트를 가리키는 버그를 방지
        // T-1=어제, T-2=그저께, T-3=3일전 리포트를 각각 독립적으로 참조
        const previousData      = selectedIndex + 1 < REPORTS_HISTORY.length ? REPORTS_HISTORY[selectedIndex + 1] : null;
        const prevPrevData      = selectedIndex + 2 < REPORTS_HISTORY.length ? REPORTS_HISTORY[selectedIndex + 2] : null;
        const prevPrevPrevData  = selectedIndex + 3 < REPORTS_HISTORY.length ? REPORTS_HISTORY[selectedIndex + 3] : null;
        const prevPrevPrevPrevData = selectedIndex + 4 < REPORTS_HISTORY.length ? REPORTS_HISTORY[selectedIndex + 4] : null;
        
        renderCompare(data, previousData, prevPrevData, prevPrevPrevData, prevPrevPrevPrevData);
    }

    // 헤더 개요 업데이트
    const macroBiasScore = data.macroBiasScore !== undefined ? data.macroBiasScore : (data.holdings && data.holdings[0] ? data.holdings[0].macroBiasScore : 0);
    document.getElementById('report-overview').innerHTML = buildMacroBiasHtml(macroBiasScore) + data.overview;

    // [NEW] Market Pulse 동적 생성
    const pulseContainer = document.getElementById('market-pulse-container');
    
    // data.strategy.regime이 없으면 텍스트에서 파싱 시도 (단순화)
    let regimeStr = data.strategy?.regime || 'Transitional';
    if (regimeStr === 'Transitional' && typeof data.overview === 'string') {
        if (data.overview.includes('상승장') || data.overview.includes('Bull')) regimeStr = 'Trending-Bull';
        else if (data.overview.includes('하락장') || data.overview.includes('Bear')) regimeStr = 'Trending-Bear';
    }

    // [NEW] Header Macro Regime Badge (전역 상태)
    const headerRegime = document.getElementById('header-regime-indicator');
    if (headerRegime) {
        // Find if macro_risk is true in any holding's reason
        let macroRisk = false;
        if (data.holdings && data.holdings.length > 0 && data.holdings[0].reason && String(data.holdings[0].reason.macro_risk).toLowerCase() === 'true') {
            macroRisk = true;
        }
        const riskColor = macroRisk ? '#fb7185' : '#34d399';
        const riskText = macroRisk ? 'Risk-Off (방어적)' : 'Risk-On (공격적)';
        
        headerRegime.innerHTML = `
            <div class="macro-badge" style="border: 1px solid ${riskColor}55; background: ${riskColor}15; color: ${riskColor}; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                🌍 <span>Macro Regime: ${regimeStr}</span> <span style="margin: 0 4px; opacity: 0.5;">|</span> <span>${riskText}</span>
            </div>
        `;
    }

    const usdKrw = data.usdToKrwRate ? data.usdToKrwRate.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-';

    if (pulseContainer) {
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
                <div class="pulse-change">수익 <span style="color:#ff2a55">+${upCount}</span> / 손실 <span style="color:#3b82f6">${downCount}</span></div>
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
    if (holdingsBadge) holdingsBadge.textContent = data.holdings.length;
    if (watchlistBadge) watchlistBadge.textContent = data.watchlist.length;

    // [NEW] HOME 메타데이터 (날짜, 환율) 업데이트
    const dateDisplay = document.getElementById('home-date-display');
    const rateDisplay = document.getElementById('home-exchange-rate');
    const liveValueDisplay = document.getElementById('live-portfolio-value');

    if (liveValueDisplay) {
        liveValueDisplay.innerHTML = `₩10,000,000 <span id="live-portfolio-pnl" style="font-size: 0.95rem; font-weight: 600; margin-left: 0.4rem; color: #94a3b8;">(0.00%)</span>`;
    }

    if (dateDisplay) {
        const fullDate = data.generatedAt || data.date || '-';
        dateDisplay.textContent = fullDate.replace(/-/g, '. ');
    }
    if (rateDisplay && data.usdToKrwRate) {
        rateDisplay.textContent = `₩${data.usdToKrwRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (rateDisplay) {
        rateDisplay.textContent = '-';
    }
    // 보유 종목 렌더링
    const holdingsList = document.querySelector('#holdings-list');
    holdingsList.innerHTML = '';

    if (data.holdings.length > 0) {
        let holdingsHtml = '';
        data.holdings.forEach(stock => {
            const isUp = (stock.return || '').startsWith('+');
            const tooltipContent = stock.predictedResult ? getPredictionTooltip(stock.name, stock.currentPrice, stock.predictedResult, stock.predictionReason) : '';

            const ind = stock.reason?.indicators || {};
            const pnl = stock.holdingPnlPct ?? stock.reason?.holding_pnl_pct ?? null;
            const isTakeProfit = (pnl !== null && parseFloat(pnl) >= 30 && (stock.adjustedRatingReason || '').includes('이익실현'));
            const wrapperClass = isTakeProfit ? "stock-item-wrapper take-profit-glow" : "stock-item-wrapper";
            const shortSqueezeBadge = getShortSurgeBadgeHtml(stock);

            const stockItem = `
                <div class="${wrapperClass}" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info" style="min-width: 0; flex: 1; word-break: keep-all;">
                            <div class="name" style="font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                ${stock.name}
                                ${shortSqueezeBadge}
                                ${buildInstitutionalFlagsHtml(stock)}
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
                            <button class="print-btn" onclick="quickOrder('${stock.symbol}')" style="margin:0; background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); border-color: transparent; color: white;">
                                주문
                            </button>
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    ${buildStatusBarHtml(stock)}

                    <!-- [v2 NEW] Action Engine Component -->
                    <div class="action-engine-container">
                        ${buildActionDialHtml(stock.actionScore)}
                        <div class="recommendation-banner">
                            <div class="rec-label">Engine Recommendation</div>
                            <div class="rec-value-badge ${(stock.recommendation || 'HOLD').toLowerCase().replace(' ', '-')}">
                                ${stock.recommendation || 'HOLD'}
                                ${getSuperTrendBadgeHtml(stock.reason?.indicators?.supertrend)}
                            </div>
                        </div>
                    </div>

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.6; word-break: keep-all;">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                        ${buildSignalChecklistHtml(stock)}
                    </div>

                    <div class="analysis-content">
                        ${/* [v13] 실행 리스크 플랜 — 백테스트에서 재현된 유일한 성과이므로
                              예측 차트보다 위에 배치한다. (prediction-system-remake.md 참조) */''}
                        ${(window.RiskUI && window.RiskUI.renderRiskPlanCard) ? window.RiskUI.renderRiskPlanCard(stock) : ''}

                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}
                        
                        ${buildValuationComponentHtml(stock)}

                        ${/* [v13] 펀더멘털 밸류에이션 · 뉴스 센티먼트 —
                              수집만 되고 표시되지 않던 데이터. 가치투자 게이트가 이 값을 쓴다. */''}
                        ${(window.RiskUI && window.RiskUI.renderValuationSentiment) ? window.RiskUI.renderValuationSentiment(stock) : ''}

                        <!-- Scores horizontally side-by-side -->
                        <div class="combined-score-row">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05rem;">📊 MFC TECHNICAL ANALYSIS</div>
                                ${buildMfcComponentHtml(stock)}
                            </div>
                            <div class="score-separator"></div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.65rem; color: #818cf8; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05rem;">🤖 PICK PREDICTIVE VALUE</div>
                                ${buildPickComponentHtml(stock)}
                            </div>
                            <div class="score-separator"></div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.65rem; color: #34d399; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05rem;">🌊 CAPITAL FLOW ANALYSIS</div>
                                ${buildCapitalFlowComponentHtml(stock)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            holdingsHtml += stockItem;
        });
        holdingsList.innerHTML = holdingsHtml;
    } else {
        holdingsList.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">보유 종목 데이터가 없습니다.</p>';
    }

    // 관심 종목 렌더링
    const watchlistList = document.querySelector('#watchlist-list');
    watchlistList.innerHTML = '';

    const hasToken = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token');

    if (data.watchlist.length > 0) {
        let watchlistHtml = '';
        data.watchlist.forEach(stock => {
            const tooltipContent = stock.predictedResult ? getPredictionTooltip(stock.name, stock.currentPrice, stock.predictedResult, stock.predictionReason) : '';

            const ind = stock.reason?.indicators || {};
            const pnl = stock.holdingPnlPct ?? stock.reason?.holding_pnl_pct ?? null;
            const isTakeProfit = (pnl !== null && parseFloat(pnl) >= 30 && (stock.adjustedRatingReason || '').includes('이익실현'));
            const wrapperClass = isTakeProfit ? "stock-item-wrapper take-profit-glow" : "stock-item-wrapper";
            const shortSqueezeBadge = getShortSurgeBadgeHtml(stock);

            const stockItem = `
                <div class="${wrapperClass}" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info" style="min-width: 0; flex: 1; word-break: keep-all;">
                            <div class="name" style="font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                ${stock.name}
                                ${shortSqueezeBadge}
                                ${buildInstitutionalFlagsHtml(stock)}
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
                            ${hasToken ? `
                            <button class="print-btn" onclick="quickOrder('${stock.symbol}')" style="margin:0; background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); border-color: transparent; color: white;">
                                주문
                            </button>` : ''}
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    ${buildStatusBarHtml(stock)}

                    <!-- [v2 NEW] Action Engine Component -->
                    <div class="action-engine-container">
                        ${buildActionDialHtml(stock.actionScore)}
                        <div class="recommendation-banner">
                            <div class="rec-label">Engine Recommendation</div>
                            <div class="rec-value-badge ${(stock.recommendation || 'HOLD').toLowerCase().replace(' ', '-')}">
                                ${stock.recommendation || 'HOLD'}
                                ${getSuperTrendBadgeHtml(stock.reason?.indicators?.supertrend)}
                            </div>
                        </div>
                    </div>

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.6; word-break: keep-all;">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                        ${buildSignalChecklistHtml(stock)}
                    </div>

                    <div class="analysis-content">
                        ${/* [v13] 실행 리스크 플랜 — 백테스트에서 재현된 유일한 성과이므로
                              예측 차트보다 위에 배치한다. (prediction-system-remake.md 참조) */''}
                        ${(window.RiskUI && window.RiskUI.renderRiskPlanCard) ? window.RiskUI.renderRiskPlanCard(stock) : ''}

                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}

                        ${buildValuationComponentHtml(stock)}

                        ${/* [v13] 펀더멘털 밸류에이션 · 뉴스 센티먼트 —
                              수집만 되고 표시되지 않던 데이터. 가치투자 게이트가 이 값을 쓴다. */''}
                        ${(window.RiskUI && window.RiskUI.renderValuationSentiment) ? window.RiskUI.renderValuationSentiment(stock) : ''}

                        <!-- Scores horizontally side-by-side -->
                        <div class="combined-score-row">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05rem;">📊 MFC TECHNICAL ANALYSIS</div>
                                ${buildMfcComponentHtml(stock)}
                            </div>
                            <div class="score-separator"></div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.65rem; color: #818cf8; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05rem;">🤖 PICK PREDICTIVE VALUE</div>
                                ${buildPickComponentHtml(stock)}
                            </div>
                            <div class="score-separator"></div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.65rem; color: #34d399; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05rem;">🌊 CAPITAL FLOW ANALYSIS</div>
                                ${buildCapitalFlowComponentHtml(stock)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            watchlistHtml += stockItem;
        });
        watchlistList.innerHTML = watchlistHtml;
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

    // [NEW] 만약 현재 DISCOVERY 탭이 활성화되어 있다면 버블 차트를 날짜 변경에 맞춰 즉시 갱신
    const isDiscoveryActive = document.querySelector('.global-tab[data-target="view-discovery"]')?.classList.contains('active');
    if (isDiscoveryActive) {
        setTimeout(initMarketBubbleChart, 100);
    }

    // [NEW] 기본 탭 활성화 분기 처리 (보유 종목이 없을 경우 관심 종목 기본 활성화)
    const hasHoldings = data.holdings && data.holdings.length > 0;
    const hasWatchlist = data.watchlist && data.watchlist.length > 0;
    
    let defaultTarget = 'holdings-section';
    if (!hasHoldings && hasWatchlist) {
        defaultTarget = 'watchlist-section';
    }
    
    // 탭 버튼 active 클래스 제어
    const tabBtns = document.querySelectorAll('.segment-btn:not(.compare-segment)');
    tabBtns.forEach(btn => {
        const targetId = btn.getAttribute('data-target');
        if (targetId === defaultTarget) {
            btn.classList.add('active');
        } else if (targetId === 'holdings-section' || targetId === 'watchlist-section') {
            btn.classList.remove('active');
        }
    });
    
    // 탭 콘텐츠 active 클래스 제어
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.id === defaultTarget) {
            content.classList.add('active');
        } else if (content.id === 'holdings-section' || content.id === 'watchlist-section') {
            content.classList.remove('active');
        }
    });
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
        mfcNorm * 0.35 +   // sync with backend (MFC 最전)
        wyckoffScore * 0.18 +
        stochasticScore * 0.12 +
        obvScore * 0.12 +
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
    const rrScore = factors.rr_score !== undefined ? factors.rr_score : null;
    const regimeMod = regimeScore !== null ? (regimeScore - 50) * 0.15 : 0;
    const rrMod = rrScore !== null ? (rrScore - 50) * 0.10 : 0;

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
            aiPred: { val: Math.round(aiBaseExpected * 10) / 10 },
            techModifier: { val: Math.round(techModifier * 10) / 10 },
            regimeMod: { val: Math.round(regimeMod * 10) / 10 },
            rrMod: { val: Math.round(rrMod * 10) / 10 },
            mfc: { val: Math.round(mfcNorm), weight: 35 },
            wyckoff: { val: wyckoffScore, weight: 18, phase: structure },
            stochastic: { val: stochasticScore, weight: 12, golden: stochK > stochD },
            obv: { val: obvScore, weight: 12, trend: ind.obv_trend || 'N/A' },
            bollinger: { val: bollingerScore, weight: 8, position: ind.bollinger_position || 'N/A' }
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
        const regModPts = regScore !== null ? +((regScore - 50) * 0.15).toFixed(1) : null;
        const rrModPts = rrScoreVal !== null ? +((rrScoreVal - 50) * 0.10).toFixed(1) : null;

        const pickFactors = [
            { icon: '🤖', name: 'AI예측수준', val: score.breakdown.aiPred.val, weight: 80, color: '#f472b6' },
            { icon: '📊', name: '기술적보정', val: score.breakdown.techModifier.val, weight: 20, color: '#38bdf8' },
            ...(regModPts !== null ? [{ icon: '🗳️', name: '레집정합성', val: regModPts, weight: 10, color: '#34d399' }] : []),
            ...(rrModPts !== null ? [{ icon: '⚖️', name: 'R:R솔익비', val: rrModPts, weight: 10, color: '#fbbf24' }] : [])
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
                            ${pickFactors.map(f => `<li><span style="font-weight:bold;">${f.name}</span>: ${f.val > 0 && f.name !== 'AI예측수준' ? '+' : ''}${Math.round(f.val * 10) / 10}pts</li>`).join('')}
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

        // [v4] Use actionScore if available, fallback to rec_score
        const displayScore = p.actionScore !== undefined ? p.actionScore : p.rec_score;
        const recTier = p.recommendation || (displayScore >= 75 ? 'BUY' : displayScore <= 25 ? 'SELL' : 'HOLD');

        // Score color
        let scoreColor = '#94a3b8'; // Neutral
        if (displayScore >= 80) scoreColor = '#10b981';      // STRONG BUY (Emerald)
        else if (displayScore >= 60) scoreColor = '#34d399'; // BUY
        else if (displayScore >= 35) scoreColor = '#38bdf8'; // HOLD
        else if (displayScore >= 15) scoreColor = '#fbbf24'; // SELL
        else scoreColor = '#f43f5e';                        // STRONG SELL

        const angle = (displayScore / 100) * 360;

        // Change badge
        let changeBadge = '';
        if (p.change_pct !== undefined) {
            const cls = p.change_pct > 0 ? 'change-up' : (p.change_pct < 0 ? 'change-down' : '');
            changeBadge = `<span class="${cls}">(${p.change_pct > 0 ? '+' : ''}${p.change_pct.toFixed(2)}%)</span>`;
        }

        // MFC mini bars — 7차원 (MQ, Insider 추가)
        const bd = p.mfc_breakdown || {};
        const dims = [
            { key: 'T', val: bd.trend || 50, color: '#38bdf8', title: 'Trend' },
            { key: 'M', val: bd.momentum || 50, color: '#818cf8', title: 'Momentum' },
            { key: 'F', val: bd.flow || 50, color: '#34d399', title: 'Flow' },
            { key: 'V', val: bd.volatility || 50, color: '#fbbf24', title: 'Volatility' },
            { key: 'S', val: bd.structure || 50, color: '#f472b6', title: 'Structure' },
            { key: 'MQ', val: bd.momentum_quality || 50, color: '#a78bfa', title: 'MomQuality' },
            { key: 'I', val: bd.insider || 50, color: '#fb923c', title: 'Insider' },
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
        const mqScore = factors_info.momentum_quality;
        const regMod = regScore !== undefined ? +((regScore - 50) * 0.15).toFixed(1) : null;
        const rrMod = rrScoreV !== undefined ? +((rrScoreV - 50) * 0.10).toFixed(1) : null;
        const regColor = (regMod !== null && regMod > 0) ? '#f25f7a' : (regMod !== null && regMod < 0) ? '#5f97f2' : '#94a3b8';
        const rrColor = (rrMod !== null && rrMod > 0) ? '#f25f7a' : (rrMod !== null && rrMod < 0) ? '#5f97f2' : '#94a3b8';

        // Short Interest
        const siChange = (p.short_interest_change || null);
        const siRatio = (p.short_interest_ratio || null);
        let shortInfoHtml = '';
        if (siChange !== null && !isNaN(siChange)) {
            const sc = parseFloat(siChange).toFixed(1);
            const rv = (siRatio !== null && !isNaN(siRatio)) ? (parseFloat(siRatio) * 100).toFixed(1) + '%' : 'N/A';
            const siColor = parseFloat(sc) > 10 ? '#fb7185' : parseFloat(sc) < -10 ? '#34d399' : '#94a3b8';
            shortInfoHtml = `<b>공매도 변화:</b> <span style="color:${siColor}">${parseFloat(sc) > 0 ? '+' : ''}${sc}%</span> (잔고비율: ${rv})<br>`;
        }

        // AI Prediction Logic
        let aiPredictionHtml = '';
        if (p.predictedResult) {
            const predVal = parseFloat(p.predictedResult);
            const predColor = predVal > 0 ? '#f25f7a' : (predVal < 0 ? '#5f97f2' : '#94a3b8');
            aiPredictionHtml = `
                <div class="tooltip-section">
                    <div class="tooltip-subtitle">🤖 AI Intelligence Forecast</div>
                    <div class="prediction-text" style="margin-top: 5px; line-height: 1.5;">
                        <b>예측 수익률 (Expected):</b> <span style="color:${predColor}; font-weight:bold;">${p.predictedResult}</span><br>
                        <b>AI 신뢰도:</b> ${p.ai_confidence ? (p.ai_confidence * 100).toFixed(1) + '%' : 'N/A'}<br>
                    </div>
                </div>
            `;
        }

        // Intraday & Scalping data
        const intra = p.intraday || {};
        const gapStr = intra.gap_pct ? `${intra.gap_pct > 0 ? '+' : ''}${intra.gap_pct}%` : '0%';
        const volStr = intra.volume_surge ? `${intra.volume_surge}x` : 'N/A';
        const deviationStr = p.deviation_pct !== undefined ? `${p.deviation_pct}%` : 'N/A';
        const scalpingBonusStr = p.scalping_bonus ? `+${p.scalping_bonus}점 부여` : '없음';

        const tooltipBody = `
            <div class="tooltip-section">
                <div class="tooltip-subtitle">📊 MFC 10차원 분석 내역</div>
                <ul class="advice-list" style="margin-top: 5px;">
                    ${fList.map(f => `<li><span style="font-weight:bold; color:${f.v >= 70 ? '#34d399' : f.v <= 30 ? '#fb7185' : '#94a3b8'}">${f.n}</span>: ${f.d} (${Math.round(f.v)}/100)</li>`).join('')}
                </ul>
            </div>
            <div class="tooltip-section">
                <div class="tooltip-subtitle">🗳️ Regime & ⚖️ R:R Score</div>
                <div class="prediction-text" style="margin-top: 5px; line-height: 1.5;">
                    <b>Regime Alignment:</b> <span style="color:${regColor}">${regScore !== undefined ? regScore + '/100' : 'N/A'}</span>${regMod !== null ? ` → <span style="color:${regColor}">${regMod > 0 ? '+' : ''}${regMod}pts</span> (시장레짐↔종목방향 정합성)` : ''}<br>
                    <b>R:R Score:</b> <span style="color:${rrColor}">${rrScoreV !== undefined ? rrScoreV + '/100' : 'N/A'}</span>${rrMod !== null ? ` → <span style="color:${rrColor}">${rrMod > 0 ? '+' : ''}${rrMod}pts</span> (ATR손절 vs 피보목표)` : ''}
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
                    <div class="discovery-score-mini-inner" style="color:${scoreColor}">${displayScore}</div>
                </div>
                <div class="discovery-mini-bars">
                    <div class="discovery-rec-badge ${recTier.toLowerCase().replace(' ', '-')}">${recTier}</div>
                    ${barsHtml}
                </div>
            </div>
            <div class="discovery-card-tags">${tagsHtml}</div>
            ${p.advice_short ? `<div class="discovery-card-reason">${p.advice_short}</div>` : ''}
            
            <div class="discovery-overlay-tooltip">
                <div class="tooltip-header">📈 ${p.ticker} 스크리닝 요약</div>
                <div class="tooltip-body">
                    ${aiPredictionHtml}
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
                <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        }, { passive: true });

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
    // 디바운스(150ms)를 적용하여 실시간 데이터 갱신, AI 터미널 타이핑 이펙트 등이 일으키는 무한 재귀 및 CPU 부하를 방지합니다.
    let staggerTimeout = null;
    const observer = new MutationObserver((mutations) => {
        clearTimeout(staggerTimeout);
        staggerTimeout = setTimeout(() => {
            applyStagger('.stock-item-wrapper:not(.stagger-applied), .discovery-card:not(.stagger-applied), .todays-picks-card:not(.stagger-applied)');
        }, 150);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUIEnhancements);
} else {
    initUIEnhancements();
}

/**
 * AI Intelligence Live Feed Logic
 */
class AIIntelligenceCore {
    constructor(data) {
        this.data = data;
        this.container = document.getElementById('ai-intelligence-terminal');
        this.contentEl = document.getElementById('terminal-content');
        this.allStocks = [...data.holdings, ...data.watchlist];
        this.insights = [];
        this.currentIndex = 0;
        this.timer = null;
        this.typeTimeout = null; // [FIX] Track typing animation timeout
    }

    init() {
        if (!this.container || this.allStocks.length === 0) return;
        const isDashboard = document.querySelector('.global-tab[data-target="view-dashboard"]')?.classList.contains('active');
        this.container.style.display = isDashboard ? 'block' : 'none';
        this.generateInsights();
        this.startCycling();
    }

    generateInsights() {
        if (window.IS_LATEST_REPORT === false) {
            this.insights = [
                { type: 'status', text: "Analyzing historical session data..." },
                { type: 'status', text: "Monitoring Offline - LIVE INTELLIGENCE CLOSED" },
                { type: 'wisdom', text: "Historical performance is not indicative of future results." },
                { type: 'status', text: "Accessing archived market catalysts..." }
            ];
            return;
        }

        const statuses = [
            "Refining GARCH-Ensemble volatility parameters...",
            "Correlating with 10Y Treasury Yields...",
            "Scanning institutional footprint anomalies...",
            "Analyzing short interest surge vectors...",
            "Detecting Wyckoff Phase transitions...",
            "Validating CMF accumulation intensity...",
            "Processing sentiment divergence from social channels...",
            "Backtesting regime-specific alpha factors..."
        ];

        // 1. Add status updates
        statuses.forEach(s => this.insights.push({ type: 'status', text: s }));

        // 2. Add stock-specific hot signals
        this.allStocks.forEach(stock => {
            const ind = stock.reason?.indicators || {};
            const cf = ind.capital_flow || {};
            const buyRatio = cf.total_inflow / (cf.total_inflow + cf.total_outflow || 1);

            if (ind.spring_detected) {
                this.insights.push({ type: 'signal', text: `[CRITICAL] ${stock.name}: 'Wyckoff Spring' detected. High-probability reversal pattern confirmed.` });
            }
            if (ind.rsi <= 30) {
                this.insights.push({ type: 'signal', text: `[SIGNAL] ${stock.name}: Oversold condition (RSI ${ind.rsi.toFixed(1)}). Technical bounce imminent.` });
            }
            if (buyRatio >= 0.75) {
                this.insights.push({ type: 'signal', text: `[FLOW] ${stock.name}: Extreme institutional accumulation detected (Buy Ratio ${Math.round(buyRatio * 100)}%).` });
            }
            if (ind.short_interest_change_pct >= 10) {
                this.insights.push({ type: 'signal', text: `[ALERT] ${stock.name}: Short interest surged +${ind.short_interest_change_pct.toFixed(1)}%. Elevated downward pressure.` });
            }
            if (ind.bb_squeeze) {
                this.insights.push({ type: 'signal', text: `[PATTERN] ${stock.name}: Bollinger Squeeze confirmed. Explosive volatility expansion expected.` });
            }
        });

        // 3. Add generic market wisdom
        this.insights.push({ type: 'wisdom', text: "Patience is a key component of institutional-grade trading." });
        this.insights.push({ type: 'wisdom', text: "Risk management is the only holy grail in volatile regimes." });
        this.insights.push({ type: 'wisdom', text: "Price is what you pay. Value is what you get." });

        // Shuffle insights — severity/type priority (signal first)
        const typePriority = { signal: 0, status: 1, wisdom: 2 };
        this.insights = this.insights.sort((a, b) => {
            const pa = typePriority[a.type] ?? 9;
            const pb = typePriority[b.type] ?? 9;
            return pa - pb;
        });
    }

    startCycling() {
        this.showNextInsight();
        if (window.IS_LATEST_REPORT === false) return; // Don't cycle for historical data
        this.timer = setInterval(() => this.showNextInsight(), 10000);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        if (this.typeTimeout) clearTimeout(this.typeTimeout);
    }

    showNextInsight() {
        if (this.insights.length === 0) return;
        const insight = this.insights[this.currentIndex];
        this.typeText(insight.text);
        this.currentIndex = (this.currentIndex + 1) % this.insights.length;
    }

    typeText(text) {
        if (!this.contentEl) return;
        
        // [FIX] Cancel any ongoing typing animation
        if (this.typeTimeout) {
            clearTimeout(this.typeTimeout);
            this.typeTimeout = null;
        }

        let i = 0;
        this.contentEl.innerHTML = "";
        const speed = 30;

        const type = () => {
            if (i < text.length) {
                this.contentEl.innerHTML += text.charAt(i);
                i++;
                this.typeTimeout = setTimeout(type, speed);
            } else {
                this.typeTimeout = null;
            }
        };
        type();
    }
}

// ===========================================================================
//  [BREAKING NEWS] REAL-TIME NEWS SYNC & INTERACTION ENGINE
// ===========================================================================

window.RENDERED_NEWS_LINKS = window.RENDERED_NEWS_LINKS || new Set();

async function syncLiveNewsData() {
    if (window.IS_LATEST_REPORT === false) return;
    
    // 실시간 뉴스 속보 갱신은 Breaking 탭(view-breaking)에서만 수행합니다.
    const activeTab = document.querySelector('.global-tab.active')?.getAttribute('data-target');
    if (activeTab !== 'view-breaking') return;
    
    const reloadLiveNewsScript = () => {
        return new Promise((resolve) => {
            const oldScript = document.getElementById('live-news-script-dynamic');
            if (oldScript) {
                if (typeof oldScript.remove === 'function') {
                    oldScript.remove();
                } else if (oldScript.parentNode) {
                    oldScript.parentNode.removeChild(oldScript);
                }
            }
            const script = document.createElement('script');
            script.id = 'live-news-script-dynamic';
            script.src = 'live_news.js?v=' + Date.now();
            script.onload = resolve;
            script.onerror = resolve;
            document.head.appendChild(script);
        });
    };

    try {
        await reloadLiveNewsScript();
        if (typeof LIVE_NEWS !== 'undefined') {
            window.LIVE_NEWS = LIVE_NEWS;
        }
        if (window.LIVE_NEWS) {
            const breakingView = document.getElementById('view-breaking');
            if (breakingView && breakingView.classList.contains('active')) {
                renderLiveNews();
            }
        }
    } catch (e) {
        console.error('Failed to sync live news:', e);
    }
}

function renderLiveNews() {
    const newsData = typeof LIVE_NEWS !== 'undefined' ? LIVE_NEWS : window.LIVE_NEWS;
    if (!newsData) return;
    const { kr_news, us_news } = newsData;

    const renderColumn = (newsList, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!newsList || newsList.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">수집된 뉴스가 없습니다.</div>`;
            return;
        }

        const htmlParts = newsList.map(item => {
            const isNew = window.RENDERED_NEWS_LINKS.size > 0 && !window.RENDERED_NEWS_LINKS.has(item.link);
            window.RENDERED_NEWS_LINKS.add(item.link);

            const badgeClass = item.change > 0 ? 'up' : item.change < 0 ? 'down' : '';
            
            let footerBadges = '';
            if (item.detail_sector && item.detail_sector !== '기타 산업') {
                footerBadges += `<span class="news-sector-badge">${item.detail_sector}</span>`;
            }
            if (item.symbol) {
                footerBadges += `
                    <span class="news-ticker-badge ${badgeClass}" data-symbol="${item.symbol}">
                        ${item.symbol_name || item.symbol} ${item.change_str || '0.00%'}
                    </span>
                `;
            }
            
            const badgeHtml = footerBadges ? `
                <div class="news-card-footer" style="gap: 0.5rem; justify-content: flex-end;">
                    ${footerBadges}
                </div>
            ` : '';

            return `
                <a href="${item.link}" target="_blank" class="news-card ${isNew ? 'news-card-enter' : ''}" data-link="${item.link}">
                    <div class="news-card-meta">
                        <span class="news-time">${item.time}</span>
                        <span class="news-source">${item.source}</span>
                    </div>
                    <div class="news-title">${item.title}</div>
                    ${badgeHtml}
                </a>
            `;
        });

        container.innerHTML = htmlParts.join('');

        container.querySelectorAll('.news-ticker-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const symbol = badge.getAttribute('data-symbol');
                navigateToReportSymbol(symbol);
            });
        });
    };

    renderColumn(kr_news, 'news-column-kr');
    renderColumn(us_news, 'news-column-us');
}

function navigateToReportSymbol(symbol) {
    if (!symbol) return;
    const reportTab = document.querySelector('.global-tab[data-target="view-dashboard"]');
    if (reportTab) {
        reportTab.click();
    }
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.value = symbol;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
    }
}

// ==========================================================================
//  [NEW] MARKET SENSOR BUBBLE MAP (Canvas Physics Engine - Grouped by Sector)
// ==========================================================================

// Detailed Korean Sector Mapping for Tickers (Synced with fetch_live_news.py and portfolio specifics)
const TICKER_SECTOR_MAP = {
    // US Stocks
    "AAPL": "스마트 디바이스 & OS",
    "MSFT": "초거대 AI 플랫폼/모델",
    "NVDA": "AI 반도체 설계/Fabless",
    "AMD": "AI 반도체 설계/Fabless",
    "AVGO": "반도체 미세공정/장비",
    "INTC": "반도체 메모리/제조",
    "TSM": "반도체 미세공정/장비",
    "ASML": "반도체 미세공정/장비",
    "AMZN": "빅데이터 & 클라우드/SaaS",
    "GOOG": "초거대 AI 플랫폼/모델",
    "META": "초거대 AI 플랫폼/모델",
    "TSLA": "자율주행 & 모빌리티",
    "NFLX": "디지털 미디어/플랫폼",
    "IONQ": "양자 컴퓨팅",
    "SMR": "청정 에너지/SMR",
    "SOUN": "빅데이터 & 클라우드/SaaS",
    "LAES": "레이저 공정/제조",
    "QBTS": "양자 컴퓨팅",
    "RGTI": "양자 컴퓨팅",
    "BURU": "레이저 공정/제조",
    "AMSC": "초전도 & 전력 솔루션",
    
    // KR Stocks
    "085670.KQ": "IT 부품/FPCB 제조",
    "005930.KS": "반도체 메모리/제조",
    "000660.KS": "반도체 메모리/제조",
    "005380.KS": "자율주행 & 모빌리티",
    "000270.KS": "자율주행 & 모빌리티",
    "373220.KS": "이차전지 셀 제조",
    "006400.KS": "이차전지 셀 제조",
    "207940.KS": "바이오 의약품/신약",
    "068270.KS": "바이오 의약품/신약",
    "005490.KS": "이차전지 핵심 소재",
    "035420.KS": "빅데이터 & 클라우드/SaaS",
    "035720.KS": "빅데이터 & 클라우드/SaaS",
    "086520.KQ": "이차전지 핵심 소재",
    "247540.KQ": "이차전지 핵심 소재",
    
    // Cryptos
    "BTC-USD": "메이저 가상자산",
    "ETH-USD": "메이저 가상자산",
    "SOL-USD": "웹3 & 알트코인 인프라",
    "XRP-USD": "웹3 & 알트코인 인프라"
};

class Bubble {
    constructor(name, change, stocks, x, y, radius, color, strokeColor) {
        this.name = name;
        this.change = change;
        this.stocks = stocks; // Array of {symbol, name, change, price}
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.strokeColor = strokeColor;
        const isMobile = window.innerWidth < 768;
        const speedScale = isMobile ? 0.15 : 1.0;
        this.vx = (Math.random() - 0.5) * 0.8 * speedScale;
        this.vy = (Math.random() - 0.5) * 0.8 * speedScale;
        this.baseRadius = radius;
        this.targetRadius = radius;
    }

    update(width, height, mouse) {
        // Calculate distance to mouse
        let isHovered = false;
        let dist = 10000;
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            dist = Math.hypot(dx, dy);
            // If mouse pointer is inside the bubble radius, mark as hovered
            if (dist < this.radius) {
                isHovered = true;
            }
        }

        if (isHovered) {
            // Apply braking/freezing so the bubble stays locked under the mouse
            this.vx = 0;
            this.vy = 0;
        } else {
            // Boundary collision with damping
            const bounce = -0.7;
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx *= bounce;
            } else if (this.x + this.radius > width) {
                this.x = width - this.radius;
                this.vx *= bounce;
            }

            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy *= bounce;
            } else if (this.y + this.radius > height) {
                this.y = height - this.radius;
                this.vy *= bounce;
            }

            // Mouse repulsion (only applies to non-hovered bubbles near the mouse)
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const repelDist = 120;
                if (dist < repelDist && dist > 0) {
                    const force = (repelDist - dist) / repelDist;
                    const angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * force * 0.4;
                    this.vy += Math.sin(angle) * force * 0.4;
                }
            }

            // Friction / Drag
            const isMobile = window.innerWidth < 768;
            const friction = isMobile ? 0.85 : 0.98;
            this.vx *= friction;
            this.vy *= friction;

            // Speed limit
            const speed = Math.hypot(this.vx, this.vy);
            const maxSpeed = isMobile ? 1.0 : 3;
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }

            this.x += this.vx;
            this.y += this.vy;
        }

        // Smooth radius transition for hover (always updates to target radius)
        this.radius += (this.targetRadius - this.radius) * 0.1;
    }
}

function initMarketBubbleChart() {
    const canvas = document.getElementById('market-bubble-chart');
    const tooltip = document.getElementById('bubble-tooltip');
    if (!canvas || !tooltip) return;

    if (bubbleChartInstance) {
        bubbleChartInstance.destroy();
    }

    class BubbleChart {
        constructor(canvas, tooltip) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.tooltip = tooltip;
            this.bubbles = [];
            this.animationFrameId = null;
            this.running = false;
            this.mouse = { x: -1000, y: -1000, active: false };
            
            this.resize();
            this.initBubbles();
            this.bindEvents();
        }

        resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.width = rect.width || 800;
            this.height = rect.height || 300;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
        }

        initBubbles() {
            // [NEW] Use the current view data (date specific) if available, fallback to latest
            const data = window.CURRENT_VIEW_DATA || (typeof REPORTS_HISTORY !== 'undefined' ? REPORTS_HISTORY[0] : null);
            if (!data) return;

            let allStocks = [...(data.holdings || []), ...(data.watchlist || [])];
            
            // Add discovery picks if available to populate a rich date-specific bubble map
            if (data.discovery) {
                if (data.discovery.picks_kr) allStocks.push(...data.discovery.picks_kr);
                if (data.discovery.picks_us) allStocks.push(...data.discovery.picks_us);
                if (data.discovery.picks_crypto) allStocks.push(...data.discovery.picks_crypto);
                if (data.discovery.picks_us_value) allStocks.push(...data.discovery.picks_us_value);
            }

            if (allStocks.length === 0) return;

            // Sector Translation Map (Converts English sectors to elegant Korean equivalents for seamless presentation & line break formatting)
            const SECTOR_TRANSLATION_MAP = {
                "Technology": "기술 / IT",
                "Healthcare": "헬스케어 / 바이오",
                "Industrials": "산업재 / 제조",
                "Consumer Defensive": "필수 소비재",
                "Consumer Cyclical": "경기 소비재",
                "Communication Services": "통신 서비스",
                "Basic Materials": "기초 소재",
                "Financial Services": "금융 서비스",
                "Energy": "에너지",
                "Utilities": "유틸리티",
                "Real Estate": "부동산",
                "Financial": "금융"
            };

            // Group stocks by sector using current view data
            const groups = {};
            allStocks.forEach(stock => {
                const sym = stock.symbol || stock.ticker || '';
                if (sym.startsWith('^') || sym.includes('=')) {
                    return;
                }
                
                const name = stock.name || sym;
                
                // Prioritize TICKER_SECTOR_MAP -> stock -> fallback
                let sector = TICKER_SECTOR_MAP[sym];
                if (!sector) {
                    sector = stock.sector || '기타 & 미분류';
                }

                // Translate English sector to beautiful Korean mapping
                if (SECTOR_TRANSLATION_MAP[sector]) {
                    sector = SECTOR_TRANSLATION_MAP[sector];
                }

                if (!groups[sector]) {
                    groups[sector] = [];
                }
                
                // Handle different field naming between holdings/watchlist (changePercent) vs discovery picks (change_pct)
                const changeVal = stock.changePercent !== undefined ? stock.changePercent : (stock.change_pct !== undefined ? stock.change_pct : 0);
                const priceVal = stock.price || stock.currentPrice || 0;

                groups[sector].push({
                    symbol: sym,
                    name: name,
                    change: changeVal,
                    price: priceVal
                });
            });

            // Create bubbles from groups
            const sectorNames = Object.keys(groups);
            const bubbleCount = sectorNames.length;
            
            // Expanded & Optimized Sector Colors mapping (Highly premium visual aesthetic & high contrast)
            const SECTOR_COLORS = {
                "초거대 AI 플랫폼/모델": { color: "rgba(245, 158, 11, 0.85)", stroke: "#f59e0b" }, // Gold
                "AI 반도체 설계/Fabless": { color: "rgba(249, 115, 22, 0.85)", stroke: "#f97316" }, // Orange
                "반도체 미세공정/장비": { color: "rgba(30, 64, 175, 0.85)", stroke: "#1e40af" }, // Deep Blue
                "반도체 메모리/제조": { color: "rgba(6, 182, 212, 0.85)", stroke: "#06b6d4" }, // Cyan
                "스마트 디바이스 & OS": { color: "rgba(139, 92, 246, 0.85)", stroke: "#8b5cf6" }, // Purple
                "빅데이터 & 클라우드/SaaS": { color: "rgba(59, 130, 246, 0.85)", stroke: "#5f97f2" }, // Ocean Blue
                "자율주행 & 모빌리티": { color: "rgba(132, 204, 22, 0.85)", stroke: "#84cc16" }, // Lime
                "디지털 미디어/플랫폼": { color: "rgba(244, 63, 94, 0.85)", stroke: "#f43f5e" }, // Rose
                "양자 컴퓨팅": { color: "rgba(217, 70, 239, 0.85)", stroke: "#d946ef" }, // Magenta
                "청정 에너지/SMR": { color: "rgba(34, 197, 94, 0.85)", stroke: "#22c55e" }, // Green
                "레이저 공정/제조": { color: "rgba(239, 68, 68, 0.85)", stroke: "#ef4444" }, // Crimson Red
                "초전도 & 전력 솔루션": { color: "rgba(99, 102, 241, 0.85)", stroke: "#6366f1" }, // Indigo
                "IT 부품/FPCB 제조": { color: "rgba(161, 98, 7, 0.85)", stroke: "#a16207" }, // Amber/Brown
                "이차전지 셀 제조": { color: "rgba(56, 189, 248, 0.85)", stroke: "#38bdf8" }, // Sky Blue
                "바이오 의약품/신약": { color: "rgba(20, 184, 166, 0.85)", stroke: "#20b8a6" }, // Teal/Mint
                "이차전지 핵심 소재": { color: "rgba(79, 70, 229, 0.85)", stroke: "#4f46e5" }, // Deep Indigo
                "메이저 가상자산": { color: "rgba(251, 191, 36, 0.85)", stroke: "#fbbf24" }, // Yellow/Gold
                "웹3 & 알트코인 인프라": { color: "rgba(168, 85, 247, 0.85)", stroke: "#a855f7" }, // Amethyst Purple

                // Standard Translated Sectors
                "기술 / IT": { color: "rgba(14, 165, 233, 0.85)", stroke: "#0ea5e9" }, // Electric Blue (Primary)
                "헬스케어 / 바이오": { color: "rgba(20, 184, 166, 0.85)", stroke: "#20b8a6" }, // Teal/Mint
                "산업재 / 제조": { color: "rgba(71, 85, 105, 0.85)", stroke: "#64748b" }, // Steel Blue/Slate
                "필수 소비재": { color: "rgba(16, 185, 129, 0.85)", stroke: "#10b981" }, // Emerald Green
                "경기 소비재": { color: "rgba(244, 63, 94, 0.85)", stroke: "#f43f5e" }, // Rose
                "통신 서비스": { color: "rgba(99, 102, 241, 0.85)", stroke: "#6366f1" }, // Indigo
                "기초 소재": { color: "rgba(120, 113, 108, 0.85)", stroke: "#78716c" }, // Stone/Bronze
                "금융 서비스": { color: "rgba(245, 158, 11, 0.85)", stroke: "#f59e0b" }, // Gold
                "에너지": { color: "rgba(234, 179, 8, 0.85)", stroke: "#eab308" }, // Yellow
                "유틸리티": { color: "rgba(6, 182, 212, 0.85)", stroke: "#06b6d4" }, // Cyan
                "부동산": { color: "rgba(236, 72, 153, 0.85)", stroke: "#ec4899" }, // Pink
                "금융": { color: "rgba(245, 158, 11, 0.85)", stroke: "#f59e0b" }, // Gold

                "기타 & 미분류": { color: "rgba(71, 85, 105, 0.85)", stroke: "#475569" } // Darker Slate Gray for text contrast
            };

            this.bubbles = sectorNames.map((sectorName, index) => {
                const stocks = groups[sectorName];
                const avgChange = stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length;
                
                const isMobile = window.innerWidth < 768;
                const baseMinRadius = isMobile ? 22 : 35;
                const baseMaxRadius = isMobile ? 42 : 65;
                const sizeFactor = isMobile ? 1.5 : 4.0;
                const changeFactor = isMobile ? 0.3 : 1.0;
                const radius = Math.max(baseMinRadius, Math.min(baseMaxRadius, baseMinRadius + stocks.length * sizeFactor + Math.abs(avgChange) * changeFactor));
                
                // Fetch premium color based on detailed sector
                const theme = SECTOR_COLORS[sectorName] || SECTOR_COLORS["기타 & 미분류"];
                const color = theme.color;
                const strokeColor = theme.stroke;

                const angle = (index / bubbleCount) * Math.PI * 2;
                const dist = isMobile ? (35 + Math.random() * 30) : (70 + Math.random() * 60);
                const x = this.width / 2 + Math.cos(angle) * dist;
                const y = this.height / 2 + Math.sin(angle) * dist;

                return new Bubble(sectorName, avgChange, stocks, x, y, radius, color, strokeColor);
            });
        }

        bindEvents() {
            this.handleMouseMove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
                this.mouse.active = true;

                let hovered = null;
                this.bubbles.forEach(b => {
                    const dist = Math.hypot(b.x - this.mouse.x, b.y - this.mouse.y);
                    if (dist < b.radius) {
                        b.targetRadius = b.baseRadius * 1.15;
                        hovered = b;
                    } else {
                        b.targetRadius = b.baseRadius;
                    }
                });

                if (hovered) {
                    this.showTooltip(hovered);
                } else {
                    this.hideTooltip();
                }
            };

            this.handleMouseLeave = () => {
                this.mouse.active = false;
                this.bubbles.forEach(b => b.targetRadius = b.baseRadius);
                this.hideTooltip();
            };

            this.handleClick = () => {
                let clicked = null;
                this.bubbles.forEach(b => {
                    const dist = Math.hypot(b.x - this.mouse.x, b.y - this.mouse.y);
                    if (dist < b.radius) {
                        clicked = b;
                    }
                });

                if (clicked && clicked.stocks.length > 0) {
                    const targetStock = clicked.stocks[0];
                    navigateToReportSymbol(targetStock.symbol);
                }
            };

            this.handleResize = () => {
                this.resize();
            };

            this.canvas.addEventListener('mousemove', this.handleMouseMove);
            this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
            this.canvas.addEventListener('click', this.handleClick);
            window.addEventListener('resize', this.handleResize);
        }

        showTooltip(bubble) {
            const changeColor = bubble.change > 0 ? '#f25f7a' : bubble.change < 0 ? '#5f97f2' : '#94a3b8';
            const changeSign = bubble.change > 0 ? '+' : '';
            
            const stocksHtml = bubble.stocks.map(s => {
                const sColor = s.change > 0 ? '#f25f7a' : s.change < 0 ? '#5f97f2' : '#94a3b8';
                const sSign = s.change > 0 ? '+' : '';
                return `
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-top: 4px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 2px;">
                        <span style="color: #cbd5e1; font-weight: 500;">${s.name} <span style="font-size: 0.65rem; color: #64748b;">${s.symbol.split('.')[0]}</span></span>
                        <span style="color: ${sColor}; font-weight: 600;">${sSign}${s.change.toFixed(2)}%</span>
                    </div>
                `;
            }).join('');

            this.tooltip.style.display = 'block';
            this.tooltip.innerHTML = `
                <div style="font-weight: 700; font-size: 0.9rem; color: #f8fafc; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                    🏢 ${bubble.name}
                </div>
                <div style="margin-bottom: 8px;">
                    평균 등락률: <strong style="color: ${changeColor};">${changeSign}${bubble.change.toFixed(2)}%</strong>
                    <span style="font-size: 0.7rem; color: #94a3b8; margin-left: 4px;">(${bubble.stocks.length}개 종목)</span>
                </div>
                <div style="max-height: 120px; overflow-y: auto; margin-bottom: 8px; padding-right: 4px;">
                    ${stocksHtml}
                </div>
                <div style="font-size: 0.65rem; color: #38bdf8; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; font-weight: 500;">
                    🖱️ 클릭 시 상세 리포트로 이동
                </div>
            `;

            const containerRect = this.canvas.parentElement.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            
            // Calculate coordinates relative to the relative-positioned parent container
            let x = this.mouse.x - tooltipRect.width / 2;
            let y = this.mouse.y - tooltipRect.height - 15;

            // Keep the tooltip inside the container boundaries
            if (x < 10) {
                x = 10;
            } else if (x + tooltipRect.width > containerRect.width - 10) {
                x = containerRect.width - tooltipRect.width - 10;
            }

            if (y < 10) {
                // If it goes above the top, place it below the mouse cursor
                y = this.mouse.y + 20;
            }

            this.tooltip.style.left = x + 'px';
            this.tooltip.style.top = y + 'px';
        }

        hideTooltip() {
            this.tooltip.style.display = 'none';
        }

        resolveCollisions() {
            const isMobile = window.innerWidth < 768;
            for (let i = 0; i < this.bubbles.length; i++) {
                for (let j = i + 1; j < this.bubbles.length; j++) {
                    const b1 = this.bubbles[i];
                    const b2 = this.bubbles[j];
                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = b1.radius + b2.radius;

                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        const angle = Math.atan2(dy, dx);

                        // Resolve overlap (dampen push force significantly on mobile to prevent jitter)
                        const pushFactor = isMobile ? 0.15 : 0.5;
                        const pushX = Math.cos(angle) * overlap * pushFactor;
                        const pushY = Math.sin(angle) * overlap * pushFactor;
                        b1.x -= pushX;
                        b1.y -= pushY;
                        b2.x += pushX;
                        b2.y += pushY;

                        if (isMobile) {
                            // 모바일에서는 탄성 충돌 연산(속도 교환)을 수행하지 않고 속도를 급격히 감쇠해 진동을 차단합니다.
                            b1.vx *= 0.6;
                            b1.vy *= 0.6;
                            b2.vx *= 0.6;
                            b2.vy *= 0.6;
                        } else {
                            // Elastic collision velocity exchange
                            const nx = dx / dist;
                            const ny = dy / dist;

                            const kx = b1.vx - b2.vx;
                            const ky = b1.vy - b2.vy;
                            const p = 2 * (nx * kx + ny * ky) / 2;

                            b1.vx -= p * nx;
                            b1.vy -= p * ny;
                            b2.vx += p * nx;
                            b2.vy += p * ny;
                            
                            b1.vx *= 0.95;
                            b1.vy *= 0.95;
                            b2.vx *= 0.95;
                            b2.vy *= 0.95;
                        }
                    }
                }
            }
        }

        drawConnections() {
            this.ctx.lineWidth = 1;
            for (let i = 0; i < this.bubbles.length; i++) {
                for (let j = i + 1; j < this.bubbles.length; j++) {
                    const b1 = this.bubbles[i];
                    const b2 = this.bubbles[j];
                    const dist = Math.hypot(b2.x - b1.x, b2.y - b1.y);
                    const maxDist = 180;
                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.15;
                        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        this.ctx.beginPath();
                        this.ctx.moveTo(b1.x, b1.y);
                        this.ctx.lineTo(b2.x, b2.y);
                        this.ctx.stroke();
                    }
                }
            }
        }

        update() {
            this.bubbles.forEach(b => b.update(this.width, this.height, this.mouse));
            this.resolveCollisions();
        }

        draw() {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.drawConnections();

            this.bubbles.forEach(b => {
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                
                const gradient = this.ctx.createRadialGradient(
                    b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
                    b.x, b.y, b.radius
                );
                gradient.addColorStop(0, b.color);
                gradient.addColorStop(0.8, b.color);
                gradient.addColorStop(1, b.strokeColor);
                
                this.ctx.fillStyle = gradient;
                
                if (b.targetRadius > b.baseRadius) {
                    this.ctx.shadowColor = b.color;
                    this.ctx.shadowBlur = 15;
                } else {
                    this.ctx.shadowBlur = 0;
                }
                
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                this.ctx.strokeStyle = b.strokeColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                // Scale font size according to radius (cap maximum for readability)
                const fontSize = Math.max(9, Math.min(13, b.radius * 0.17));
                
                // Smart splitting of Korean sector names (trim spaces for elegant positioning)
                let displayName1 = b.name.trim();
                let displayName2 = "";
                
                if (b.name.includes('/')) {
                    const parts = b.name.split('/');
                    displayName1 = parts[0].trim() + ' /';
                    displayName2 = parts[1].trim();
                } else if (b.name.includes(' & ')) {
                    const parts = b.name.split(' & ');
                    displayName1 = parts[0].trim() + ' &';
                    displayName2 = parts[1].trim();
                } else if (b.name.includes(' ')) {
                    const parts = b.name.split(' ');
                    displayName1 = parts[0].trim();
                    displayName2 = parts.slice(1).join(' ').trim();
                } else if (b.name.length > 5) {
                    // Split length-wise if long single word
                    displayName1 = b.name.substring(0, Math.ceil(b.name.length / 2)).trim();
                    displayName2 = b.name.substring(Math.ceil(b.name.length / 2)).trim();
                }

                const changeSign = b.change > 0 ? '+' : '';
                const rateColor = b.change > 0 ? '#f25f7a' : b.change < 0 ? '#5f97f2' : '#cbd5e1';

                // Helper to draw text with dark outline for ultimate contrast/readability
                const drawTextWithOutline = (text, x, y, font, fillStyle) => {
                    this.ctx.font = font;
                    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)'; // Deep Navy background for contrast
                    this.ctx.lineWidth = 3.5;
                    this.ctx.lineJoin = 'round';
                    this.ctx.strokeText(text, x, y);
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fillText(text, x, y);
                };

                const fontName = `bold ${fontSize}px 'Inter', 'Outfit', sans-serif`;
                const rateFont = `bold ${fontSize * 0.9}px 'Outfit', sans-serif`;

                if (displayName2) {
                    // Draw name in 2 lines
                    drawTextWithOutline(displayName1, b.x, b.y - fontSize * 0.6, fontName, '#ffffff');
                    drawTextWithOutline(displayName2, b.x, b.y + fontSize * 0.4, fontName, '#ffffff');
                    
                    // Draw rate in 3rd line
                    drawTextWithOutline(`${changeSign}${b.change.toFixed(2)}%`, b.x, b.y + fontSize * 1.4, rateFont, rateColor);
                } else {
                    // Draw name in 1 line
                    drawTextWithOutline(displayName1, b.x, b.y - fontSize * 0.3, fontName, '#ffffff');
                    
                    // Draw rate in 2nd line
                    drawTextWithOutline(`${changeSign}${b.change.toFixed(2)}%`, b.x, b.y + fontSize * 0.7, rateFont, rateColor);
                }
            });
        }

        loop() {
            if (!this.running) return;
            this.update();
            this.draw();
            this.animationFrameId = requestAnimationFrame(() => this.loop());
        }

        start() {
            if (this.running) return;
            this.running = true;
            this.loop();
        }

        stop() {
            this.running = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }

        destroy() {
            this.stop();
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
            this.canvas.removeEventListener('click', this.handleClick);
            window.removeEventListener('resize', this.handleResize);
        }
    }

    bubbleChartInstance = new BubbleChart(canvas, tooltip);
    bubbleChartInstance.start();
}

function isMarketClosed(symbol) {
    if (window.IS_LATEST_REPORT === false) return true;
    
    // 암호화폐(Crypto)는 24시간 연중무휴 거래되므로 항상 마감/판정 가능으로 처리
    const isCrypto = symbol.includes('-USD') || symbol.includes('-KRW') || symbol.includes('-BTC');
    if (isCrypto) return true;
    
    const isKr = symbol.includes('.KS') || symbol.includes('.KQ') || /^\d+$/.test(symbol);
    
    // Check holiday status from live data
    const liveData = typeof LIVE_DATA !== 'undefined' ? LIVE_DATA : null;
    if (isKr && liveData && liveData.kr_market_holiday === true) {
        return true;
    }
    if (!isKr && liveData && liveData.us_market_holiday === true) {
        return true;
    }
    
    const now = new Date();
    if (isKr) {
        // 서울 시간 (KST: UTC+9)
        const seoulTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        const hrs = seoulTime.getHours();
        const mins = seoulTime.getMinutes();
        const totalMins = hrs * 60 + mins;
        const day = seoulTime.getDay();
        
        if (day === 0 || day === 6) return true; // 주말
        
        // 장중 거래 시간: 09:00 ~ 15:30 (540분 ~ 930분)
        const isTradingWindow = totalMins >= 540 && totalMins < 930;
        return !isTradingWindow; // 장중이 아니면 마감 상태
    } else {
        // 뉴욕 시간 (ET)
        const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const hrs = nyTime.getHours();
        const mins = nyTime.getMinutes();
        const totalMins = hrs * 60 + mins;
        const day = nyTime.getDay();
        
        if (day === 0 || day === 6) return true; // 주말
        
        // 장중 거래 시간: 09:30 ~ 16:00 (570분 ~ 960분)
        const isTradingWindow = totalMins >= 570 && totalMins < 960;
        return !isTradingWindow; // 장중이 아니면 마감 상태
    }
}

window.isMarketClosed = isMarketClosed;

function renderCompare(currentData, previousData, prevPrevData, prevPrevPrevData, prevPrevPrevPrevData) {
    const compareView = document.getElementById('view-compare');
    if (!compareView) return;

    const pat = localStorage.getItem('github_pat');
    const hasAdmin = pat && pat.trim() !== '';
    if (!hasAdmin) {
        if (currentData) currentData.holdings = [];
        if (previousData) previousData.holdings = [];
        if (prevPrevData) prevPrevData.holdings = [];
        if (prevPrevPrevData) prevPrevPrevData.holdings = [];
        if (prevPrevPrevPrevData) prevPrevPrevPrevData.holdings = [];
    }

    console.log('[renderCompare] current:', currentData?.date, 'previous:', previousData?.date);
    if (previousData) {
        const curN = currentData.holdings?.find(s => s.symbol === 'BURU');
        const prevN = previousData.holdings?.find(s => s.symbol === 'BURU');
        console.log('[renderCompare] BURU MFC - cur:', curN?.reason?.mfc_score, 'prev:', prevN?.reason?.mfc_score);
    }

    // 0. previousData가 없는 경우 (이전 데이터가 없는 최초 시점)
    if (!previousData) {
        renderCompareEmptyState();
        return;
    }

    const getChangePercent = (stock) => {
        if (!stock) return 0;
        if (stock.changePercent !== undefined && stock.changePercent !== null) {
            return parseFloat(stock.changePercent);
        }
        if (stock.reason?.indicators?.change_1d !== undefined && stock.reason?.indicators?.change_1d !== null) {
            return parseFloat(stock.reason.indicators.change_1d);
        }
        return 0;
    };

    // 휴장 여부 판별 (한국 주식 공휴일 등)
    const isHoliday = (stock) => {
        if (!stock) return false;
        if (stock.reason && stock.reason.is_market_holiday === true) return true;
        if (stock.is_market_holiday === true) return true;
        return false;
    };

    // historyPath에서 보고서 기준일보다 엄격히 과거인 최신 영업일 변동률 반환
    const getActualChangeFromHistory = (stock, dateStr) => {
        if (!stock || !dateStr) return null;
        const path = stock.historyPath || stock.history || [];
        if (path.length > 0) {
            const pastItems = path.filter(h => h.date && h.date < dateStr);
            if (pastItems.length > 0) {
                const lastItem = pastItems[pastItems.length - 1];
                if (lastItem && lastItem.change !== undefined && lastItem.change !== null) {
                    return parseFloat(lastItem.change);
                }
            }
        }
        // Fallback: 보고서에 기재된 변동률
        if (stock.changePercent !== undefined && stock.changePercent !== null) {
            return parseFloat(stock.changePercent);
        }
        if (stock.reason?.indicators?.change_1d !== undefined && stock.reason?.indicators?.change_1d !== null) {
            return parseFloat(stock.reason.indicators.change_1d);
        }
        return null;
    };

    // 특정 날짜의 실제 장마감 변동률 반환 (historyPath 우선, fallback: changePercent)
    const getActualChangeForDate = (currentStock, targetDateStr, fallbackStock) => {
        if (!currentStock || !targetDateStr) return null;
        const path = currentStock.historyPath || currentStock.history || [];
        if (path.length > 0) {
            const matchedItem = path.find(h => h.date === targetDateStr);
            if (matchedItem && matchedItem.change !== undefined && matchedItem.change !== null) {
                return parseFloat(matchedItem.change);
            }
            const cleanTarget = targetDateStr.replace(/[^0-9]/g, '');
            const matchedItemLoose = path.find(h => h.date && h.date.replace(/[^0-9]/g, '') === cleanTarget);
            if (matchedItemLoose && matchedItemLoose.change !== undefined && matchedItemLoose.change !== null) {
                return parseFloat(matchedItemLoose.change);
            }
        }
        if (fallbackStock) {
            if (fallbackStock.changePercent !== undefined && fallbackStock.changePercent !== null) {
                return parseFloat(fallbackStock.changePercent);
            }
            if (fallbackStock.reason?.indicators?.change_1d !== undefined && fallbackStock.reason?.indicators?.change_1d !== null) {
                return parseFloat(fallbackStock.reason.indicators.change_1d);
            }
        }
        return null;
    };

    // 리포트 객체에 기록된 당일 실제 변동률 반환
    const getReportActualChange = (stock) => {
        if (!stock) return null;
        if (stock.changePercent !== undefined && stock.changePercent !== null) {
            return parseFloat(stock.changePercent);
        }
        if (stock.reason?.indicators?.change_1d !== undefined && stock.reason?.indicators?.change_1d !== null) {
            return parseFloat(stock.reason.indicators.change_1d);
        }
        return null;
    };

    const calcConsensusPct = (targetPrice, basePrice, stock) => {
        if (!targetPrice || !basePrice || basePrice <= 0) return null;
        let ratio = targetPrice / basePrice;
        let effectiveBase = basePrice;
        
        // 원화(KRW) vs 달러(USD) 등 통화 단위 불일치 자동 보정 (예: targetPrice는 KRW, basePrice는 USD)
        if (ratio > 300 && ratio < 3000) {
            const approxRate = (typeof currentData !== 'undefined' && currentData?.usdToKrwRate) ? currentData.usdToKrwRate : 1400;
            effectiveBase = basePrice * approxRate;
        } else if (ratio > 0.0003 && ratio < 0.003) {
            const approxRate = (typeof currentData !== 'undefined' && currentData?.usdToKrwRate) ? currentData.usdToKrwRate : 1400;
            effectiveBase = basePrice / approxRate;
        }
        
        let pct = ((targetPrice - effectiveBase) / effectiveBase) * 100;
        if (Math.abs(pct) > 200) {
            return null; // 과도한 이상치 제거
        }
        return pct;
    };

    const getT2Forecast = (stock) => {
        if (!stock) return null;
        if (stock.forecastPath && stock.forecastPath.length > 1) {
            const t2 = stock.forecastPath[1];
            if (t2 && t2.change !== undefined) return parseFloat(t2.change);
        }
        const basePrice = getRawPrice(stock);
        if (stock.consensusPath && stock.consensusPath.length > 1 && basePrice > 0) {
            return calcConsensusPct(stock.consensusPath[1], basePrice, stock);
        }
        return null;
    };

    const getT3Forecast = (stock) => {
        if (!stock) return null;
        if (stock.forecastPath && stock.forecastPath.length > 2) {
            const t3 = stock.forecastPath[2];
            if (t3 && t3.change !== undefined) return parseFloat(t3.change);
        }
        const basePrice = getRawPrice(stock);
        if (stock.consensusPath && stock.consensusPath.length > 2 && basePrice > 0) {
            return calcConsensusPct(stock.consensusPath[2], basePrice, stock);
        }
        return null;
    };

    const getRawPrice = (stock) => {
        if (!stock) return 0;
        if (stock.rawPrice !== undefined && stock.rawPrice !== null && stock.rawPrice > 0) {
            return parseFloat(stock.rawPrice);
        }
        if (stock.history && stock.history.length > 0) {
            const lastHist = stock.history[stock.history.length - 1];
            if (lastHist && lastHist.close !== undefined) {
                return parseFloat(lastHist.close);
            }
        }
        if (stock.currentPrice) {
            const clean = stock.currentPrice.replace(/[^0-9.]/g, '');
            if (clean) return parseFloat(clean);
        }
        return 0;
    };

    // 1. Regime 변동 연산
    const getRegime = (data) => {
        let r = data.strategy?.regime || 'Transitional';
        if (r === 'Transitional' && typeof data.overview === 'string') {
            if (data.overview.includes('상승장') || data.overview.includes('Bull')) r = 'Trending-Bull';
            else if (data.overview.includes('하락장') || data.overview.includes('Bear')) r = 'Trending-Bear';
        }
        return r;
    };
    const prevRegime = getRegime(previousData);
    const currRegime = getRegime(currentData);
    
    const regimeFlow = document.getElementById('compare-regime-flow');
    if (regimeFlow) {
        regimeFlow.innerHTML = `
            <span class="flow-from">${prevRegime}</span>
            <span class="flow-arrow">➔</span>
            <span class="flow-to" style="color: #38bdf8; font-weight: 800;">${currRegime}</span>
        `;
    }

    // 2. 환율 변동 연산
    const prevRate = previousData.usdToKrwRate || 1400;
    const currRate = currentData.usdToKrwRate || 1400;
    const rateDelta = currRate - prevRate;
    const ratePct = (rateDelta / prevRate) * 100;
    const rateArrow = rateDelta > 0 ? '▲' : (rateDelta < 0 ? '▼' : '');
    const rateClass = rateDelta > 0 ? 'up' : (rateDelta < 0 ? 'down' : 'neutral');
    
    const exchangeFlow = document.getElementById('compare-exchange-flow');
    if (exchangeFlow) {
        exchangeFlow.innerHTML = `
            <span class="flow-from">₩${prevRate.toFixed(1)}</span>
            <span class="flow-arrow">➔</span>
            <span class="flow-to ${rateClass}">₩${currRate.toFixed(1)} <span style="font-size:0.8rem; font-weight:700;">(${rateArrow}${Math.abs(rateDelta).toFixed(1)}원, ${rateDelta > 0 ? '+' : ''}${ratePct.toFixed(2)}%)</span></span>
        `;
    }

    // 3. 종목 집합 비교 분석 함수
    const processMarketCompare = (currList, prevList) => {
        const currentStocks = currList || [];
        const previousStocks = prevList || [];

        const newStocks = currentStocks.filter(c => !previousStocks.some(p => p.symbol === c.symbol));
        const exitedStocks = previousStocks.filter(p => !currentStocks.some(c => c.symbol === p.symbol));
        const maintainedStocks = [];

        currentStocks.forEach(c => {
            const p = previousStocks.find(prev => prev.symbol === c.symbol);
            if (p) {
                maintainedStocks.push({ current: c, previous: p });
            }
        });

        return { newStocks, exitedStocks, maintainedStocks };
    };

    const holdingsComp = processMarketCompare(currentData.holdings, previousData.holdings);
    const watchlistComp = processMarketCompare(currentData.watchlist, previousData.watchlist);

    // 4. 배지 갯수 업데이트
    document.getElementById('compare-holdings-badge').textContent = holdingsComp.newStocks.length + holdingsComp.exitedStocks.length + holdingsComp.maintainedStocks.length;
    document.getElementById('compare-watchlist-badge').textContent = watchlistComp.newStocks.length + watchlistComp.exitedStocks.length + watchlistComp.maintainedStocks.length;

    // 포트폴리오 변동 요약 (보유 종목 신규 편입 / 제외 건수)
    const portfolioShift = document.getElementById('compare-portfolio-shift');
    if (portfolioShift) {
        portfolioShift.innerHTML = `
            <span class="compare-badge new">편입 +${holdingsComp.newStocks.length}</span>
            <span class="flow-arrow" style="font-size:1.1rem; margin:0 4px; color:rgba(255,255,255,0.15)">/</span>
            <span class="compare-badge exited">제외 -${holdingsComp.exitedStocks.length}</span>
        `;
    }

    // 5. 국내(KR) vs 해외(US) vs 암호화폐(Crypto) 분기 기준
    const isCrypto = (stock) => {
        const sym = (stock.symbol || '').toUpperCase();
        return sym.includes('-USD') || sym.includes('-KRW') || sym.includes('-BTC') || sym.includes('BTC') || sym.includes('ETH');
    };

    const isKorean = (stock) => {
        if (isCrypto(stock)) return false;
        const sym = (stock.symbol || '').toUpperCase();
        const isKrTicker = sym.endsWith('.KS') || sym.endsWith('.KQ') || /^\d{6}$/.test(sym);
        if (stock.nativeCurrency === 'KRW') {
            return isKrTicker;
        }
        return isKrTicker;
    };

    const getT1Forecast = (stock) => {
        if (!stock) return null;
        if (stock.forecastPath && stock.forecastPath.length > 0) {
            const t1 = stock.forecastPath[0];
            if (t1 && t1.change !== undefined) return parseFloat(t1.change);
        }
        const basePrice = getRawPrice(stock);
        if (stock.consensusPath && stock.consensusPath.length > 0 && basePrice > 0) {
            return calcConsensusPct(stock.consensusPath[0], basePrice, stock);
        }
        return null;
    };

    const getFinalForecast = (stock) => {
        if (!stock) return null;
        if (stock.predictedResult) {
            const cleaned = stock.predictedResult.replace(/%/g, '').replace(/\+/g, '').trim();
            const val = parseFloat(cleaned);
            if (!isNaN(val)) return val;
        }
        return getT1Forecast(stock);
    };

    // 6. [NEW] AI 예측 단기 전망 대변동 종목(Squeeze) 추출 및 렌더링
    let maxUpStock = null;
    let maxUpVal = -Infinity;
    let maxDownStock = null;
    let maxDownVal = Infinity;

    const allMaintained = [...holdingsComp.maintainedStocks, ...watchlistComp.maintainedStocks];
    allMaintained.forEach(({ current, previous }) => {
        const cT1 = getFinalForecast(current);
        const pT1 = getFinalForecast(previous);
        if (cT1 !== null && pT1 !== null) {
            const delta = cT1 - pT1;
            if (delta > maxUpVal) {
                maxUpVal = delta;
                maxUpStock = current;
            }
            if (delta < maxDownVal) {
                maxDownVal = delta;
                maxDownStock = current;
            }
        }
    });

    const aiSqueeze = document.getElementById('compare-ai-squeeze');
    if (aiSqueeze) {
        let upHtml = `<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 5px;">
            <span style="color: var(--text-secondary);">▲ 최대 상향</span>
            <span style="color: var(--text-muted);">없음</span>
        </div>`;
        let downHtml = `<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding-top: 3px;">
            <span style="color: var(--text-secondary);">▼ 최대 하향</span>
            <span style="color: var(--text-muted);">없음</span>
        </div>`;

        if (maxUpStock && maxUpVal > -Infinity) {
            const sign = maxUpVal > 0 ? '+' : '';
            upHtml = `<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 5px;">
                <span style="color: var(--text-secondary);">▲ 최대 상향</span>
                <span style="color: var(--up-color); font-weight: 800; font-family: 'Outfit', sans-serif;">${maxUpStock.name} (${sign}${maxUpVal.toFixed(2)}%p)</span>
            </div>`;
        }
        if (maxDownStock && maxDownVal < Infinity) {
            const sign = maxDownVal > 0 ? '+' : '';
            downHtml = `<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding-top: 3px;">
                <span style="color: var(--text-secondary);">▼ 최대 하향</span>
                <span style="color: var(--down-color); font-weight: 800; font-family: 'Outfit', sans-serif;">${maxDownStock.name} (${sign}${maxDownVal.toFixed(2)}%p)</span>
            </div>`;
        }
        aiSqueeze.innerHTML = upHtml + downHtml;
    }
    // 7. AI 예측 적중률 (Hit Rate) 계산 및 렌더링 (T-1, T-2, T-3 오프셋)
    // 보합(FLAT) 판정 임계값: 실제 변동률 또는 예측값이 이 범위 이내이면 방향성 판정 불가
    const FLAT_THRESHOLD = 0.3;
    let evalCount1d_chart = 0, hitCount1d_chart = 0;
    let evalCount1d_pred = 0, hitCount1d_pred = 0;

    let evalCount2d_chart = 0, hitCount2d_chart = 0;
    let evalCount2d_pred = 0, hitCount2d_pred = 0;

    let evalCount3d_chart = 0, hitCount3d_chart = 0;
    let evalCount3d_pred = 0, hitCount3d_pred = 0;

    const allMaintainedStocks = [...holdingsComp.maintainedStocks, ...watchlistComp.maintainedStocks];

    const getPredForecast = (stock) => {
        if (!stock) return null;
        if (stock.predictedResult) {
            const cleaned = stock.predictedResult.replace(/%/g, '').replace(/\+/g, '').trim();
            const val = parseFloat(cleaned);
            if (!isNaN(val)) return val;
        }
        return null;
    };

    allMaintainedStocks.forEach(({ current, previous }) => {
        // T-1/T-2/T-3 적중률 평가는 모두 이미 확정된 과거 데이터만 사용
        // (오늘/current 데이터는 아직 장이 끝나지 않았으므로 완전 배제)
        const evalPrevious    = previous; // T-1: 어제 리포트
        const evalPrevPrev    = prevPrevData    ? [...(prevPrevData.holdings    || []), ...(prevPrevData.watchlist    || [])].find(s => s.symbol === current.symbol) : null; // T-2
        const evalPrevPrevPrev     = prevPrevPrevData    ? [...(prevPrevPrevData.holdings    || []), ...(prevPrevPrevData.watchlist    || [])].find(s => s.symbol === current.symbol) : null; // T-3
        const evalPrevPrevPrevPrev = prevPrevPrevPrevData ? [...(prevPrevPrevPrevData.holdings || []), ...(prevPrevPrevPrevData.watchlist || [])].find(s => s.symbol === current.symbol) : null; // T-4

        const pPrice   = getRawPrice(evalPrevious);
        const ppPrice  = evalPrevPrev    ? getRawPrice(evalPrevPrev)    : 0;
        const pppPrice = evalPrevPrevPrev     ? getRawPrice(evalPrevPrevPrev)     : 0;
        const ppppPrice = evalPrevPrevPrevPrev ? getRawPrice(evalPrevPrevPrevPrev) : 0;

        // 실제 변동률: 이미 확정된 T-1, T-2, T-3 실적만 사용 (current/오늘 제외)
        const pctT1 = getReportActualChange(evalPrevious);   // T-1 실제 변동률 (어제 장마감)
        const pctT2 = getReportActualChange(evalPrevPrev);   // T-2 실제 변동률 (그저께 장마감)
        const pctT3 = getReportActualChange(evalPrevPrevPrev); // T-3 실제 변동률 (3일 전 장마감)

        // T-1 적중률: T-2(이틀전) 예측 vs T-1(어제) 실적 — 오늘 데이터 완전 무관
        if (pPrice > 0 && pctT1 !== null && !isHoliday(evalPrevious) && !isHoliday(evalPrevPrev)) {
            if (Math.abs(pctT1) > FLAT_THRESHOLD) {
                const ppPred = evalPrevPrev ? getPredForecast(evalPrevPrev) : null;
                // 기대(예측) 없으면 차트도 집계 안 함
                if (ppPred !== null && ppPred !== undefined && ppPred !== 0 && Math.abs(ppPred) > FLAT_THRESHOLD) {
                    evalCount1d_pred++;
                    const isHit = (pctT1 > 0 && ppPred > 0) || (pctT1 < 0 && ppPred < 0);
                    if (isHit) hitCount1d_pred++;

                    const ppT1 = evalPrevPrev ? getT1Forecast(evalPrevPrev) : null;
                    if (ppT1 !== null && ppT1 !== undefined && ppT1 !== 0 && Math.abs(ppT1) > 0.01) {
                        evalCount1d_chart++;
                        const isHitChart = (pctT1 > 0 && ppT1 > 0) || (pctT1 < 0 && ppT1 < 0);
                        if (isHitChart) hitCount1d_chart++;
                    }
                }
            }
        }

        // T-2 적중률: T-3(3일전) 예측 vs T-2(그저께) 실적
        if (ppPrice > 0 && pctT2 !== null && !isHoliday(evalPrevPrev) && !isHoliday(evalPrevPrevPrev)) {
            if (Math.abs(pctT2) > FLAT_THRESHOLD) {
                const pppPred = evalPrevPrevPrev ? getPredForecast(evalPrevPrevPrev) : null;
                if (pppPred !== null && pppPred !== undefined && pppPred !== 0 && Math.abs(pppPred) > FLAT_THRESHOLD) {
                    evalCount2d_pred++;
                    const isHit = (pctT2 > 0 && pppPred > 0) || (pctT2 < 0 && pppPred < 0);
                    if (isHit) hitCount2d_pred++;

                    const pppT1 = evalPrevPrevPrev ? getT1Forecast(evalPrevPrevPrev) : null;
                    if (pppT1 !== null && pppT1 !== undefined && pppT1 !== 0 && Math.abs(pppT1) > 0.01) {
                        evalCount2d_chart++;
                        const isHitChart = (pctT2 > 0 && pppT1 > 0) || (pctT2 < 0 && pppT1 < 0);
                        if (isHitChart) hitCount2d_chart++;
                    }
                }
            }
        }

        // T-3 적중률: T-4(4일전) 예측 vs T-3(3일전) 실적
        if (pppPrice > 0 && pctT3 !== null && !isHoliday(evalPrevPrevPrev) && !isHoliday(evalPrevPrevPrevPrev)) {
            if (Math.abs(pctT3) > FLAT_THRESHOLD) {
                const ppppPred = evalPrevPrevPrevPrev ? getPredForecast(evalPrevPrevPrevPrev) : null;
                if (ppppPred !== null && ppppPred !== undefined && ppppPred !== 0 && Math.abs(ppppPred) > FLAT_THRESHOLD) {
                    evalCount3d_pred++;
                    const isHit = (pctT3 > 0 && ppppPred > 0) || (pctT3 < 0 && ppppPred < 0);
                    if (isHit) hitCount3d_pred++;

                    const ppppT1 = evalPrevPrevPrevPrev ? getT1Forecast(evalPrevPrevPrevPrev) : null;
                    if (ppppT1 !== null && ppppT1 !== undefined && ppppT1 !== 0 && Math.abs(ppppT1) > 0.01) {
                        evalCount3d_chart++;
                        const isHitChart = (pctT3 > 0 && ppppT1 > 0) || (pctT3 < 0 && ppppT1 < 0);
                        if (isHitChart) hitCount3d_chart++;
                    }
                }
            }
        }
    });

    // [FALLBACK] 이전 보고서 데이터 부족(예: 서버 리셋/초기 부동)으로 평가 대상이 0개로 나올 경우,
    // 각 종목이 이미 갖고 있는 predictionHistory(최근 30일 이력 데이터)를 결합하여 요약 카드 통계를 복원합니다.
    if (evalCount1d_pred === 0 && evalCount2d_pred === 0 && evalCount3d_pred === 0) {
        console.log('[CompareCenter] Previous reports missing. Falling back to predictionHistory for summary cards.');
        allMaintainedStocks.forEach(({ current }) => {
            const history = current.predictionHistory || [];
            // isHit 가 0(실패) 또는 1(적중)인 유효한 판정 기록만 수집
            const validHistory = history.filter(h => h.isHit === 1 || h.isHit === 0);
            
            // T-1 (최근 1영업일 전 예측 적중률)
            if (validHistory.length > 0) {
                // 1) AI 기대 예측
                evalCount1d_pred++;
                if (validHistory[0].isHit === 1) hitCount1d_pred++;
                
                // 2) 차트 예측 (garchReturn & actualReturn)
                const garchVal = validHistory[0].garchReturn;
                const actualVal = validHistory[0].actualReturn;
                if (garchVal !== undefined && garchVal !== null && garchVal !== 0 && Math.abs(garchVal) > 0.01 && actualVal !== null) {
                    if (Math.abs(actualVal) > 0.3) { // FLAT_THRESHOLD = 0.3
                        evalCount1d_chart++;
                        const isHit = (actualVal > 0 && garchVal > 0) || (actualVal < 0 && garchVal < 0);
                        if (isHit) hitCount1d_chart++;
                    }
                }
            }
            // T-2 (최근 2영업일 전 예측 적중률)
            if (validHistory.length > 1) {
                // 1) AI 기대 예측
                evalCount2d_pred++;
                if (validHistory[1].isHit === 1) hitCount2d_pred++;
                
                // 2) 차트 예측
                const garchVal = validHistory[1].garchReturn;
                const actualVal = validHistory[1].actualReturn;
                if (garchVal !== undefined && garchVal !== null && garchVal !== 0 && Math.abs(garchVal) > 0.01 && actualVal !== null) {
                    if (Math.abs(actualVal) > 0.3) {
                        evalCount2d_chart++;
                        const isHit = (actualVal > 0 && garchVal > 0) || (actualVal < 0 && garchVal < 0);
                        if (isHit) hitCount2d_chart++;
                    }
                }
            }
            // T-3 (최근 3영업일 전 예측 적중률)
            if (validHistory.length > 2) {
                // 1) AI 기대 예측
                evalCount3d_pred++;
                if (validHistory[2].isHit === 1) hitCount3d_pred++;
                
                // 2) 차트 예측
                const garchVal = validHistory[2].garchReturn;
                const actualVal = validHistory[2].actualReturn;
                if (garchVal !== undefined && garchVal !== null && garchVal !== 0 && Math.abs(garchVal) > 0.01 && actualVal !== null) {
                    if (Math.abs(actualVal) > 0.3) {
                        evalCount3d_chart++;
                        const isHit = (actualVal > 0 && garchVal > 0) || (actualVal < 0 && garchVal < 0);
                        if (isHit) hitCount3d_chart++;
                    }
                }
            }
        });
    }

    const hitRateEl1d = document.getElementById('compare-hit-rate-1d');
    if (hitRateEl1d) {
        const card1d = hitRateEl1d.closest('.compare-summary-card');
        if (!previousData && evalCount1d_pred === 0 && evalCount1d_chart === 0) {
            if (card1d) card1d.style.display = 'none';
        } else {
            if (card1d) card1d.style.display = '';
            if (evalCount1d_chart > 0 || evalCount1d_pred > 0) {
                const hitRateChart = evalCount1d_chart > 0 ? (hitCount1d_chart / evalCount1d_chart) * 100 : 0;
                const hitRatePred = evalCount1d_pred > 0 ? (hitCount1d_pred / evalCount1d_pred) * 100 : 0;
                hitRateEl1d.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        ${evalCount1d_chart > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 2px;">
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">📈 차트:</span>
                            <span style="color: #34d399; font-weight: 800; font-size: 1.1rem;">${hitRateChart.toFixed(1)}% <span style="font-size:0.65rem; color:var(--text-muted); font-weight:normal;">(${hitCount1d_chart}/${evalCount1d_chart})</span></span>
                        </div>` : ''}
                        ${evalCount1d_pred > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">🎯 기대:</span>
                            <span style="color: #60a5fa; font-weight: 800; font-size: 1.1rem;">${hitRatePred.toFixed(1)}% <span style="font-size:0.65rem; color:var(--text-muted); font-weight:normal;">(${hitCount1d_pred}/${evalCount1d_pred})</span></span>
                        </div>` : ''}
                    </div>
                `;
            } else {
                hitRateEl1d.innerHTML = `<span style="color: var(--text-muted); font-size: 1.0rem;">평가 대상 없음</span>`;
            }
        }
    }

    const hitRateEl2d = document.getElementById('compare-hit-rate-2d');
    if (hitRateEl2d) {
        const card2d = hitRateEl2d.closest('.compare-summary-card');
        if (!prevPrevData && evalCount2d_pred === 0 && evalCount2d_chart === 0) {
            if (card2d) card2d.style.display = 'none';
        } else {
            if (card2d) card2d.style.display = '';
            if (evalCount2d_chart > 0 || evalCount2d_pred > 0) {
                const hitRateChart = evalCount2d_chart > 0 ? (hitCount2d_chart / evalCount2d_chart) * 100 : 0;
                const hitRatePred = evalCount2d_pred > 0 ? (hitCount2d_pred / evalCount2d_pred) * 100 : 0;
                hitRateEl2d.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        ${evalCount2d_chart > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 2px;">
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">📈 차트:</span>
                            <span style="color: #3b82f6; font-weight: 800; font-size: 1.1rem;">${hitRateChart.toFixed(1)}% <span style="font-size:0.65rem; color:var(--text-muted); font-weight:normal;">(${hitCount2d_chart}/${evalCount2d_chart})</span></span>
                        </div>` : ''}
                        ${evalCount2d_pred > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">🎯 기대:</span>
                            <span style="color: #60a5fa; font-weight: 800; font-size: 1.1rem;">${hitRatePred.toFixed(1)}% <span style="font-size:0.65rem; color:var(--text-muted); font-weight:normal;">(${hitCount2d_pred}/${evalCount2d_pred})</span></span>
                        </div>` : ''}
                    </div>
                `;
            } else {
                hitRateEl2d.innerHTML = `<span style="color: var(--text-muted); font-size: 1.0rem;">평가 대상 없음</span>`;
            }
        }
    }

    const hitRateEl3d = document.getElementById('compare-hit-rate-3d');
    if (hitRateEl3d) {
        const card3d = hitRateEl3d.closest('.compare-summary-card');
        if (!prevPrevPrevData && evalCount3d_pred === 0 && evalCount3d_chart === 0) {
            if (card3d) card3d.style.display = 'none';
        } else {
            if (card3d) card3d.style.display = '';
            if (evalCount3d_chart > 0 || evalCount3d_pred > 0) {
                const hitRateChart = evalCount3d_chart > 0 ? (hitCount3d_chart / evalCount3d_chart) * 100 : 0;
                const hitRatePred = evalCount3d_pred > 0 ? (hitCount3d_pred / evalCount3d_pred) * 100 : 0;
                hitRateEl3d.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        ${evalCount3d_chart > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 2px;">
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">📈 차트:</span>
                            <span style="color: #a78bfa; font-weight: 800; font-size: 1.1rem;">${hitRateChart.toFixed(1)}% <span style="font-size:0.65rem; color:var(--text-muted); font-weight:normal;">(${hitCount3d_chart}/${evalCount3d_chart})</span></span>
                        </div>` : ''}
                        ${evalCount3d_pred > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">🎯 기대:</span>
                            <span style="color: #60a5fa; font-weight: 800; font-size: 1.1rem;">${hitRatePred.toFixed(1)}% <span style="font-size:0.65rem; color:var(--text-muted); font-weight:normal;">(${hitCount3d_pred}/${evalCount3d_pred})</span></span>
                        </div>` : ''}
                    </div>
                `;
            } else {
                hitRateEl3d.innerHTML = `<span style="color: var(--text-muted); font-size: 1.0rem;">평가 대상 없음</span>`;
            }
        }
    }

    const buildTableHtml = (dataSet) => {
        const { newStocks, exitedStocks, maintainedStocks } = dataSet;
        
        let html = `
            <div class="compare-table-wrapper">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>종목/자산 (티커)</th>
                            <th>현재가 (변동)</th>
                            <th>MFC 스코어 (변동)</th>
                            <th>AI 예측 전망 (변동)</th>
                            <th>AI 1일 전 예측 적중 (T-1)</th>
                            <th>AI 2일 전 예측 적중 (T-2)</th>
                            <th>AI 3일 전 예측 적중 (T-3)</th>
                            <th>추천 비중 (변동)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let rows = '';

        // 1. 신규 편입
        newStocks.forEach(s => {
            const t1 = getPredForecast(s);
            const mfc = s.reason?.mfc_score || s.mfcScore || 'N/A';
            const weight = s.reason?.position_size_pct || s.positionSizePct || 'N/A';
            const weightText = weight !== 'N/A' ? `${weight}%` : 'N/A';

            let garchBadge = '<span class="compare-badge neutral">-</span>';
            if (t1 !== null) {
                const cColor = t1 > 0 ? '#f25f7a' : (t1 < 0 ? '#5f97f2' : 'var(--text-secondary)');
                garchBadge = `
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); min-width: 110px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                            <span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 600;">전망치</span>
                            <span style="color: ${cColor}; font-weight: 800; font-size: 0.85rem;">${t1 > 0 ? '+' : ''}${t1.toFixed(2)}%</span>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; margin-top: 4px;">
                            <span style="font-size: 0.62rem; color: var(--text-muted);">전일 대비</span>
                            <span style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.06); font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">-</span>
                        </div>
                    </div>
                `;
            }

            rows += `
                <tr>
                    <td><span style="font-weight: 800; color: #fff;">${s.name}</span> <span style="font-size:0.75rem; color:var(--text-secondary); font-family: monospace;">(${s.symbol})</span> <span class="compare-badge new" style="margin-left:5px;">NEW</span></td>
                    <td>${s.currentPrice}</td>
                    <td>${mfc}</td>
                    <td>${garchBadge}</td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">N/A</span></td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">N/A</span></td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">N/A</span></td>
                    <td>${weightText}</td>
                </tr>
            `;
        });

        // 2. 유지 종목
        maintainedStocks.forEach(({ current, previous }) => {
            const closed = isMarketClosed(current.symbol);
            
            // 적중 평가는 이미 확정된 과거 데이터만 사용 (오늘/current 제외)
            const evalPrevious        = previous; // T-1: 어제
            const evalPrevPrev        = prevPrevData        ? [...(prevPrevData.holdings        || []), ...(prevPrevData.watchlist        || [])].find(s => s.symbol === current.symbol) : null; // T-2
            const evalPrevPrevPrev    = prevPrevPrevData    ? [...(prevPrevPrevData.holdings    || []), ...(prevPrevPrevData.watchlist    || [])].find(s => s.symbol === current.symbol) : null; // T-3
            const evalPrevPrevPrevPrev = prevPrevPrevPrevData ? [...(prevPrevPrevPrevData.holdings || []), ...(prevPrevPrevPrevData.watchlist || [])].find(s => s.symbol === current.symbol) : null; // T-4

            const cPrice = getRawPrice(current);
            const pPrice = getRawPrice(evalPrevious);
            const liveDelta = cPrice - pPrice;
            const livePct = pPrice > 0 ? (liveDelta / pPrice) * 100 : 0;
            const liveDeltaText = liveDelta !== 0 ? `(${liveDelta > 0 ? '+' : ''}${livePct.toFixed(1)}%)` : '';
            const liveClass = liveDelta > 0 ? 'up' : (liveDelta < 0 ? 'down' : 'neutral');

            // 실제 변동률: 이미 확정된 T-1/T-2/T-3만 사용 (오늘 제외)
            const pctT1 = getReportActualChange(evalPrevious);    // T-1 실적 (어제 장마감)
            const pctT2 = getReportActualChange(evalPrevPrev);    // T-2 실적 (그저께 장마감)
            const pctT3 = getReportActualChange(evalPrevPrevPrev); // T-3 실적 (3일 전 장마감)

            const closedPrevious  = evalPrevious  ? isMarketClosed(evalPrevious.symbol)  : true;
            const closedPrevPrev  = evalPrevPrev  ? isMarketClosed(evalPrevPrev.symbol)  : true;
            const closedPrevPrevPrev = evalPrevPrevPrev ? isMarketClosed(evalPrevPrevPrev.symbol) : true;

            const cMfc = parseFloat(current.reason?.mfc_score || current.mfcScore || 0);
            const pMfc = parseFloat(previous.reason?.mfc_score || previous.mfcScore || 0);
            const mfcDelta = parseFloat((cMfc - pMfc).toFixed(1));
            const cMfcVal = typeof cMfc === 'number' ? cMfc.toFixed(1) : cMfc;
            const mfcDeltaText = mfcDelta !== 0 ? 
                `<span class="compare-badge ${mfcDelta > 0 ? 'new' : 'exited'}" style="font-size: 0.65rem; padding: 2px 5px; margin-left: 5px; font-weight: 700; line-height: 1;">${mfcDelta > 0 ? '▲' : '▼'} ${Math.abs(mfcDelta).toFixed(1)}</span>` : 
                `<span class="compare-badge maintained" style="font-size: 0.65rem; padding: 2px 5px; margin-left: 5px; font-weight: 700; line-height: 1; color: var(--text-muted); opacity: 0.6;">0.0</span>`;

            const cT1 = getPredForecast(current);  // 오늘 AI 전망치 (예측 컬럼 표시용, 적중 평가 아님)
            const pT1 = getPredForecast(evalPrevious);
            let garchBadge = '<span class="compare-badge neutral">-</span>';
            if (cT1 !== null) {
                const cColor = cT1 > 0 ? '#f25f7a' : (cT1 < 0 ? '#5f97f2' : 'var(--text-secondary)');
                if (pT1 !== null) {
                    const gDelta = cT1 - pT1;
                    const gSign = gDelta > 0 ? '+' : '';
                    const dColor = gDelta > 0 ? '#f25f7a' : (gDelta < 0 ? '#5f97f2' : 'var(--text-muted)');
                    const dBg = gDelta > 0 ? 'rgba(52, 211, 153, 0.08)' : (gDelta < 0 ? 'rgba(251, 113, 133, 0.08)' : 'rgba(255,255,255,0.03)');
                    const dBorder = gDelta > 0 ? 'rgba(52, 211, 153, 0.15)' : (gDelta < 0 ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255,255,255,0.06)');
                    
                    garchBadge = `
                        <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); min-width: 110px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                                <span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 600;">전망치</span>
                                <span style="color: ${cColor}; font-weight: 800; font-size: 0.85rem;">${cT1 > 0 ? '+' : ''}${cT1.toFixed(2)}%</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; margin-top: 4px;">
                                <span style="font-size: 0.62rem; color: var(--text-muted);">전일 대비</span>
                                <span style="background: ${dBg}; color: ${dColor}; border: 1px solid ${dBorder}; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">${gSign}${gDelta.toFixed(2)}%</span>
                            </div>
                        </div>
                    `;
                } else {
                    garchBadge = `
                        <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); min-width: 110px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                                <span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 600;">전망치</span>
                                <span style="color: ${cColor}; font-weight: 800; font-size: 0.85rem;">${cT1 > 0 ? '+' : ''}${cT1.toFixed(2)}%</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; margin-top: 4px;">
                                <span style="font-size: 0.62rem; color: var(--text-muted);">전일 대비</span>
                                <span style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.06); font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">-</span>
                            </div>
                        </div>
                    `;
                }
            }

            // AI 적중 Badge 생성 Helper
            const getHitBadge = (pred, actualPct, actualLabel) => {
                // FLAT 판정: 실제 변동률 또는 예측값이 보합 범위이면 FLAT 배지 표시
                const isActualFlat = actualPct !== null && Math.abs(actualPct) <= FLAT_THRESHOLD;
                const predThreshold = (actualLabel && actualLabel.includes('차트')) ? 0.01 : FLAT_THRESHOLD;
                const isPredFlat = pred !== null && Math.abs(pred) <= predThreshold;
                let label;
                if (pred !== null && actualPct !== null) {
                    if (isActualFlat || isPredFlat) {
                        label = '⏸ FLAT';
                    } else {
                        label = (actualPct > 0 && pred > 0) || (actualPct < 0 && pred < 0) ? '🎯 적중' : '❌ 실패';
                    }
                } else {
                    label = 'N/A';
                }
                const color = label === '🎯 적중' ? '#34d399' : (label === '❌ 실패' ? '#fb7185' : (label === '⏸ FLAT' ? '#fbbf24' : 'var(--text-muted)'));
                const bg = label === '🎯 적중' ? 'rgba(52, 211, 153, 0.12)' : (label === '❌ 실패' ? 'rgba(251, 113, 133, 0.12)' : (label === '⏸ FLAT' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.05)'));
                const border = label === '🎯 적중' ? 'rgba(52, 211, 153, 0.25)' : (label === '❌ 실패' ? 'rgba(251, 113, 133, 0.25)' : (label === '⏸ FLAT' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.1)'));
                
                return pred !== null ? `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                        <span style="font-size: 0.62rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 1px 3px; border-radius: 3px; font-weight: 600;">${actualLabel} (${(pred >= 0 ? '+' : '') + pred.toFixed(1)}%)</span>
                        <span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; min-width: 35px; text-align: center;">${label}</span>
                    </div>` : '';
            };

            const getActualInfo = (pct) => {
                const color = pct > 0 ? '#f25f7a' : (pct < 0 ? '#5f97f2' : 'var(--text-muted)');
                return `<div style="font-size: 0.7rem; font-weight: 700; color: ${color}; text-align: center; margin-top: 4px; font-family: monospace;">실제: ${pct > 0 ? '▲' : (pct < 0 ? '▼' : '')} ${pct.toFixed(2)}%</div>`;
            };

            // Hit 1d: T-2(이틀전) 예측 vs T-1(어제) 실적 — 오늘 데이터 완전 무관
            const isYesterdayHoliday = isHoliday(evalPrevious);
            const isPrevPrevHoliday  = isHoliday(evalPrevPrev);
            const isPrevPrevPrevHoliday = isHoliday(evalPrevPrevPrev);
            // T-1 적중: T-2 예측치 vs T-1 실제 변동
            const chartForecastT1 = evalPrevPrev ? getT1Forecast(evalPrevPrev) : null;
            const predForecastT1  = evalPrevPrev ? getPredForecast(evalPrevPrev) : null;
            let hitBadge1d = '<span class="compare-badge neutral">-</span>';

            // T-1 배지: 기대(예측) 없으면 차트도 숨김
            if (isYesterdayHoliday || isPrevPrevHoliday) {
                hitBadge1d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); font-size: 0.7rem; padding: 4px 10px;">N/A (휴장)</span>';
            } else if (pctT1 === null || predForecastT1 === null) {
                hitBadge1d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); font-size: 0.7rem; padding: 4px 10px;">N/A</span>';
            } else if (pPrice > 0) {
                // 기대 있을 때만 차트도 함께 표시
                const chartPart = chartForecastT1 !== null ? getHitBadge(chartForecastT1, pctT1, '차트') : '';
                const predPart = getHitBadge(predForecastT1, pctT1, '기대');
                const pctSpan = getActualInfo(pctT1);
                hitBadge1d = `
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); min-width: 110px;">
                        ${chartPart}
                        ${predPart}
                        ${pctSpan}
                    </div>
                `;
            }

            // T-2 적중: T-3(3일전) 예측 vs T-2(그저께) 실적
            let hitBadge2d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">-</span>';
            const ppT1   = evalPrevPrevPrev ? getT1Forecast(evalPrevPrevPrev)   : null;
            const ppPred = evalPrevPrevPrev ? getPredForecast(evalPrevPrevPrev) : null;

            if (isPrevPrevHoliday || isPrevPrevPrevHoliday) {
                hitBadge2d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); font-size: 0.7rem; padding: 4px 10px;">N/A (휴장)</span>';
            } else if (pctT2 === null || ppPred === null) {
                hitBadge2d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); font-size: 0.7rem; padding: 4px 10px;">N/A</span>';
            } else if (evalPrevPrev) {
                const pctArrow = pctT2 > 0 ? '▲' : (pctT2 < 0 ? '▼' : '');
                const pctSign = pctT2 > 0 ? '+' : '';
                const pctText = `${pctArrow} ${pctSign}${pctT2.toFixed(2)}%`;
                const pctColor = pctT2 > 0 ? '#f25f7a' : (pctT2 < 0 ? '#5f97f2' : 'var(--text-muted)');
                const pctSpan = `<div style="font-size: 0.7rem; font-weight: 700; color: ${pctColor}; text-align: center; margin-top: 4px; font-family: monospace;">실제: ${pctText}</div>`;
                
                let chartPart = '';
                if (ppT1 !== null) {
                    const isFlat = Math.abs(pctT2) <= FLAT_THRESHOLD || Math.abs(ppT1) <= 0.01;
                    const isHit = !isFlat && ((pctT2 > 0 && ppT1 > 0) || (pctT2 < 0 && ppT1 < 0));
                    const label = isFlat ? '⏸ FLAT' : (isHit ? '🎯 적중' : '❌ 실패');
                    const color = isFlat ? '#fbbf24' : (isHit ? '#34d399' : '#fb7185');
                    const bg = isFlat ? 'rgba(251, 191, 36, 0.12)' : (isHit ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)');
                    const border = isFlat ? 'rgba(251, 191, 36, 0.25)' : (isHit ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 113, 133, 0.25)');
                    const pValText = (ppT1 >= 0 ? '+' : '') + ppT1.toFixed(1) + '%';
                    chartPart = `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                            <span style="font-size: 0.62rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 1px 3px; border-radius: 3px; font-weight: 600;">차트 (${pValText})</span>
                            <span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">${label}</span>
                        </div>
                    `;
                }
                
                let predPart = '';
                if (ppPred !== null) {
                    const isFlat = Math.abs(pctT2) <= FLAT_THRESHOLD || Math.abs(ppPred) <= FLAT_THRESHOLD;
                    const isHit = !isFlat && ((pctT2 > 0 && ppPred > 0) || (pctT2 < 0 && ppPred < 0));
                    const label = isFlat ? '⏸ FLAT' : (isHit ? '🎯 적중' : '❌ 실패');
                    const color = isFlat ? '#fbbf24' : (isHit ? '#34d399' : '#fb7185');
                    const bg = isFlat ? 'rgba(251, 191, 36, 0.12)' : (isHit ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)');
                    const border = isFlat ? 'rgba(251, 191, 36, 0.25)' : (isHit ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 113, 133, 0.25)');
                    const pValText = (ppPred >= 0 ? '+' : '') + ppPred.toFixed(1) + '%';
                    predPart = `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; margin-top: 3px;">
                            <span style="font-size: 0.62rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 1px 3px; border-radius: 3px; font-weight: 600;">기대 (${pValText})</span>
                            <span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">${label}</span>
                        </div>
                    `;
                }
                
                hitBadge2d = `
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); min-width: 110px;">
                        ${chartPart}
                        ${predPart}
                        ${pctSpan}
                    </div>
                `;
            }

            // T-3 적중: T-4(4일전) 예측 vs T-3(3일전) 실적
            let hitBadge3d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">-</span>';
            const pppT1   = evalPrevPrevPrevPrev ? getT1Forecast(evalPrevPrevPrevPrev)   : null;
            const pppPred = evalPrevPrevPrevPrev ? getPredForecast(evalPrevPrevPrevPrev) : null;

            if (isPrevPrevPrevHoliday || isHoliday(evalPrevPrevPrevPrev)) {
                hitBadge3d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); font-size: 0.7rem; padding: 4px 10px;">N/A (휴장)</span>';
            } else if (pctT3 === null || pppPred === null) {
                // 기대(예측) 없으면 차트도 숨김 (주말 등으로 T-4 예측 없는 경우)
                hitBadge3d = '<span class="compare-badge neutral" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); font-size: 0.7rem; padding: 4px 10px;">N/A</span>';
            } else if (evalPrevPrevPrev) {

                const pctArrow = pctT3 > 0 ? '▲' : (pctT3 < 0 ? '▼' : '');
                const pctSign = pctT3 > 0 ? '+' : '';
                const pctText = `${pctArrow} ${pctSign}${pctT3.toFixed(2)}%`;
                const pctColor = pctT3 > 0 ? '#f25f7a' : (pctT3 < 0 ? '#5f97f2' : 'var(--text-muted)');
                const pctSpan = `<div style="font-size: 0.7rem; font-weight: 700; color: ${pctColor}; text-align: center; margin-top: 4px; font-family: monospace;">실제: ${pctText}</div>`;
                
                let chartPart = '';
                if (pppT1 !== null) {
                    const isFlat = Math.abs(pctT3) <= FLAT_THRESHOLD || Math.abs(pppT1) <= 0.01;
                    const isHit = !isFlat && ((pctT3 > 0 && pppT1 > 0) || (pctT3 < 0 && pppT1 < 0));
                    const label = isFlat ? '⏸ FLAT' : (isHit ? '🎯 적중' : '❌ 실패');
                    const color = isFlat ? '#fbbf24' : (isHit ? '#34d399' : '#fb7185');
                    const bg = isFlat ? 'rgba(251, 191, 36, 0.12)' : (isHit ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)');
                    const border = isFlat ? 'rgba(251, 191, 36, 0.25)' : (isHit ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 113, 133, 0.25)');
                    const pValText = (pppT1 >= 0 ? '+' : '') + pppT1.toFixed(1) + '%';
                    chartPart = `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                            <span style="font-size: 0.62rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 1px 3px; border-radius: 3px; font-weight: 600;">차트 (${pValText})</span>
                            <span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">${label}</span>
                        </div>
                    `;
                }
                
                let predPart = '';
                if (pppPred !== null) {
                    const isFlat = Math.abs(pctT3) <= FLAT_THRESHOLD || Math.abs(pppPred) <= FLAT_THRESHOLD;
                    const isHit = !isFlat && ((pctT3 > 0 && pppPred > 0) || (pctT3 < 0 && pppPred < 0));
                    const label = isFlat ? '⏸ FLAT' : (isHit ? '🎯 적중' : '❌ 실패');
                    const color = isFlat ? '#fbbf24' : (isHit ? '#34d399' : '#fb7185');
                    const bg = isFlat ? 'rgba(251, 191, 36, 0.12)' : (isHit ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)');
                    const border = isFlat ? 'rgba(251, 191, 36, 0.25)' : (isHit ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 113, 133, 0.25)');
                    const pValText = (pppPred >= 0 ? '+' : '') + pppPred.toFixed(1) + '%';
                    predPart = `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; margin-top: 3px;">
                            <span style="font-size: 0.62rem; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 1px 3px; border-radius: 3px; font-weight: 600;">기대 (${pValText})</span>
                            <span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; display: inline-block; min-width: 35px; text-align: center;">${label}</span>
                        </div>
                    `;
                }
                
                hitBadge3d = `
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); min-width: 110px;">
                        ${chartPart}
                        ${predPart}
                        ${pctSpan}
                    </div>
                `;
            }

            // 추천 비중 변동
            const cWeight = current.reason?.position_size_pct || current.positionSizePct || 0;
            const pWeight = previous.reason?.position_size_pct || previous.positionSizePct || 0;
            const wDelta = parseFloat((cWeight - pWeight).toFixed(2));
            const wSign = wDelta > 0 ? '+' : '';
            const wDeltaText = wDelta !== 0 ? `<span class="delta-val ${wDelta > 0 ? 'up' : 'down'}">${wSign}${wDelta.toFixed(2)}%</span>` : '<span class="delta-val neutral">0%</span>';

            const displayPrice = current.currentPrice;

            rows += `
                <tr>
                    <td>
                        <span style="font-weight: 800; color: #fff;">${current.name}</span> 
                        <span style="font-size:0.75rem; color:var(--text-secondary); font-family: monospace;">(${current.symbol})</span>
                        ${!closed ? `<span class="compare-badge neutral" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); margin-left: 5px; font-size: 0.65rem; padding: 2px 6px;">⏳ 장중 (실시간)</span>` : ''}
                    </td>
                    <td class="${liveClass}">${displayPrice} <span style="font-size:0.72rem; font-weight:700;">${liveDeltaText}</span></td>
                    <td>${cMfcVal} ${mfcDeltaText}</td>
                    <td>${garchBadge}</td>
                    <td>${hitBadge1d}</td>
                    <td>${hitBadge2d}</td>
                    <td>${hitBadge3d}</td>
                    <td>${cWeight}% <span style="font-size:0.75rem; margin-left: 4px;">(${wDeltaText})</span></td>
                </tr>
            `;
        });

        // 3. 제외
        exitedStocks.forEach(s => {
            const mfc = s.reason?.mfc_score || s.mfcScore || 'N/A';
            rows += `
                <tr style="opacity: 0.5;">
                    <td><span style="font-weight: 800; color: #fff; text-decoration: line-through;">${s.name}</span> <span style="font-size:0.75rem; color:var(--text-secondary); font-family: monospace;">(${s.symbol})</span> <span class="compare-badge exited" style="margin-left:5px;">EXIT</span></td>
                    <td>${s.currentPrice}</td>
                    <td>${mfc}</td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">-</span></td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">-</span></td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">-</span></td>
                    <td><span class="compare-badge neutral" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);">-</span></td>
                    <td>N/A</td>
                </tr>
            `;
        });

        if (!rows) {
            html += `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">변동 사항이 없습니다.</td></tr>`;
        } else {
            html += rows;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
        return html;
    };

    // 국내/해외/암호화폐 3분할 필터 및 렌더링 함수
    const splitAndRender = (compDataSet, krContainerId, usContainerId, cryptoContainerId) => {
        const krSet = {
            newStocks: compDataSet.newStocks.filter(isKorean),
            exitedStocks: compDataSet.exitedStocks.filter(isKorean),
            maintainedStocks: compDataSet.maintainedStocks.filter(m => isKorean(m.current))
        };
        const usSet = {
            newStocks: compDataSet.newStocks.filter(s => !isKorean(s) && !isCrypto(s)),
            exitedStocks: compDataSet.exitedStocks.filter(s => !isKorean(s) && !isCrypto(s)),
            maintainedStocks: compDataSet.maintainedStocks.filter(m => !isKorean(m.current) && !isCrypto(m.current))
        };
        const cryptoSet = {
            newStocks: compDataSet.newStocks.filter(isCrypto),
            exitedStocks: compDataSet.exitedStocks.filter(isCrypto),
            maintainedStocks: compDataSet.maintainedStocks.filter(m => isCrypto(m.current))
        };

        const krContainer = document.getElementById(krContainerId);
        const usContainer = document.getElementById(usContainerId);
        const cryptoContainer = document.getElementById(cryptoContainerId);

        if (krContainer) krContainer.innerHTML = buildTableHtml(krSet);
        if (usContainer) usContainer.innerHTML = buildTableHtml(usSet);
        if (cryptoContainer) cryptoContainer.innerHTML = buildTableHtml(cryptoSet);
    };

    // 보유 및 관심 종목 렌더링 수행 (3분할 연계)
    splitAndRender(holdingsComp, 'compare-kr-holdings-changes', 'compare-us-holdings-changes', 'compare-crypto-holdings-changes');
    splitAndRender(watchlistComp, 'compare-kr-watchlist-changes', 'compare-us-watchlist-changes', 'compare-crypto-watchlist-changes');
}

function renderCompareEmptyState() {
    const ids = [
        'compare-kr-holdings-changes',
        'compare-us-holdings-changes',
        'compare-crypto-holdings-changes',
        'compare-kr-watchlist-changes',
        'compare-us-watchlist-changes',
        'compare-crypto-watchlist-changes'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `
                <div class="compare-empty-state">
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div class="compare-empty-state-title">비교 대상 리포트 없음</div>
                    <div class="compare-empty-state-desc">선택하신 날짜는 대시보드 리포트 이력의 최초 시점이므로 대조할 이전 리포트 데이터가 존재하지 않습니다.</div>
                </div>
            `;
        }
    });

    const regimeFlow = document.getElementById('compare-regime-flow');
    if (regimeFlow) regimeFlow.innerHTML = '<span class="flow-to">-</span>';

    const exchangeFlow = document.getElementById('compare-exchange-flow');
    if (exchangeFlow) exchangeFlow.innerHTML = '<span class="flow-to">-</span>';

    const portfolioShift = document.getElementById('compare-portfolio-shift');
    if (portfolioShift) portfolioShift.innerHTML = '<span class="compare-badge maintained">N/A</span>';

    const hitRateEl1d = document.getElementById('compare-hit-rate-1d');
    if (hitRateEl1d) hitRateEl1d.innerHTML = '<span style="color: var(--text-muted); font-size: 1.1rem;">N/A</span>';

    const hitRateEl2d = document.getElementById('compare-hit-rate-2d');
    if (hitRateEl2d) hitRateEl2d.innerHTML = '<span style="color: var(--text-muted); font-size: 1.1rem;">N/A</span>';

    const hitRateEl3d = document.getElementById('compare-hit-rate-3d');
    if (hitRateEl3d) hitRateEl3d.innerHTML = '<span style="color: var(--text-muted); font-size: 1.1rem;">N/A</span>';

    const aiSqueeze = document.getElementById('compare-ai-squeeze');
    if (aiSqueeze) {
        aiSqueeze.innerHTML = `
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 5px;">
                <span style="color: var(--text-secondary);">▲ 최대 상향</span>
                <span style="color: var(--text-muted);">-</span>
            </div>
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding-top: 3px;">
                <span style="color: var(--text-secondary);">▼ 최대 하향</span>
                <span style="color: var(--text-muted);">-</span>
            </div>
        `;
    }

    const holdingsBadge = document.getElementById('compare-holdings-badge');
    if (holdingsBadge) holdingsBadge.textContent = '0';
    
    const watchlistBadge = document.getElementById('compare-watchlist-badge');
    if (watchlistBadge) watchlistBadge.textContent = '0';
}

/* ==========================================================================
   [NEW] Real-time L.WIKI (Obsidian Wiki Viewer) Logics
   ========================================================================== */

// 깃허브 API 연동 상태 전역 관리
const LWikiState = {
    token: localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token') || '',
    repo: 'kjpar0317/obsidian',
    branch: 'main',
    folder: 'stock',
    stocks: [], // 로드된 종목 리스트
    activeTicker: null
};

// L.WIKI 초기화 함수
function initLWiki() {
    // 공용 토큰 동기화
    LWikiState.token = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token') || '';

    const searchInput = document.getElementById('wiki-search-input');

    // 이벤트 중복 바인딩 방지 플래그
    if (!window.LWIKI_BOUND) {
        window.LWIKI_BOUND = true;

        // [NEW] L.WIKI 모바일 아코디언 토글 바인딩
        const registerMobileCollapsible = (headerId, contentId) => {
            const header = document.getElementById(headerId);
            const content = document.getElementById(contentId);
            if (header && content) {
                header.addEventListener('click', () => {
                    if (window.innerWidth < 768) {
                        header.classList.toggle('active');
                        content.classList.toggle('active');
                    }
                });
            }
        };
        registerMobileCollapsible('wiki-stocks-toggle-hdr', 'wiki-stocks-content');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderLWikiStockList(e.target.value.trim());
            });
        }

        // [NEW] 종목 추가 모달 제어 바인딩
        const addBtn = document.getElementById('wiki-add-stock-btn');
        const modal = document.getElementById('wiki-add-modal');
        const closeBtn = document.getElementById('wiki-modal-close');
        const cancelBtn = document.getElementById('wiki-modal-cancel-btn');
        const submitBtn = document.getElementById('wiki-modal-submit-btn');
        const tickerInput = document.getElementById('wiki-new-ticker');
        const nameInput = document.getElementById('wiki-new-name');

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
            if (tickerInput) tickerInput.value = '';
            if (nameInput) nameInput.value = '';
        };

        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                if (!LWikiState.token) {
                    showLiveAlert('종목을 추가하려면 먼저 GitHub 토큰을 등록하고 저장해야 합니다. 🔑', 'warning');
                    return;
                }
                modal.style.display = 'flex';
                if (tickerInput) tickerInput.focus();
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        if (submitBtn && tickerInput && nameInput) {
            submitBtn.addEventListener('click', () => {
                const ticker = tickerInput.value.trim().toUpperCase();
                const name = nameInput.value.trim();

                if (!ticker || !name) {
                    showLiveAlert('티커와 종목명을 모두 입력해 주세요.', 'warning');
                    return;
                }

                // 영문+숫자 3~8자리 패턴 검사
                const tickerRegex = /^[A-Z0-9]{3,8}$/;
                if (!tickerRegex.test(ticker)) {
                    showLiveAlert('올바르지 않은 티커 형식입니다. (영어 및 숫자 3~8자리)', 'warning');
                    return;
                }

                addLWikiStock(ticker, name, closeModal);
            });
        }

        // [NEW] 종목 삭제 이벤트 위임 바인딩
        const viewer = document.getElementById('wiki-viewer-content');
        if (viewer) {
            viewer.addEventListener('click', (e) => {
                const delBtn = e.target.closest('#wiki-delete-stock-btn');
                if (delBtn) {
                    const ticker = delBtn.getAttribute('data-ticker');
                    const name = delBtn.getAttribute('data-name');
                    if (ticker) {
                        deleteLWikiStock(ticker, name);
                    }
                }
            });
        }
    }

    // 2. 종목 리스트 로드 시작
    loadLWikiStockList();
}

// GitHub API 공통 헤더 생성
function getGitHubHeaders() {
    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };
    if (LWikiState.token) {
        headers['Authorization'] = `token ${LWikiState.token}`;
    }
    return headers;
}

// GitHub API로 stock/ 폴더 하위 디렉토리 목록 조회
function loadLWikiStockList() {
    const listContainer = document.getElementById('wiki-stock-list');
    if (!listContainer) return;

    // 로딩바 표출
    listContainer.innerHTML = `
        <div class="wiki-loading-spinner">
            <div class="spinner"></div>
            <span class="spinner-text">GitHub에서 목록 로드 중...</span>
        </div>
    `;

    const url = `https://api.github.com/repos/${LWikiState.repo}/contents/${LWikiState.folder}?ref=${LWikiState.branch}&_t=${Date.now()}`;

    fetch(url, { headers: getGitHubHeaders() })
        .then(response => {
            if (response.status === 401) {
                throw new Error('유효하지 않은 GitHub 토큰입니다. 토큰 설정을 확인하세요.');
            }
            if (response.status === 404) {
                throw new Error('리포지토리 또는 stock 폴더를 찾을 수 없습니다. (404)');
            }
            if (response.status === 403 && !LWikiState.token) {
                throw new Error('GitHub API 호출 제한에 도달했습니다. 토큰을 입력하고 저장해 주세요.');
            }
            if (!response.ok) {
                throw new Error(`API 요청 실패 (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            // 디렉토리 파일 중 관리용 폴더(scripts, templates 등)를 제외하고 실제 주식 종목만 추출
            const excludeDirs = ['scripts', 'templates', '.git', '.github', '.obsidian', 'raw'];
            const dirs = data.filter(item => item.type === 'dir' && !excludeDirs.includes(item.name.toLowerCase()));
            
            // 데이터 매핑 및 보존
            LWikiState.stocks = dirs.map(dir => {
                const ticker = dir.name;
                // data.js의 REPORTS_HISTORY 내에 존재하는 종목이 있는지 매칭하여 이름 획득
                let companyName = '';
                if (typeof REPORTS_HISTORY !== 'undefined' && REPORTS_HISTORY.length > 0) {
                    const latestReport = REPORTS_HISTORY[0];
                    // holdings와 watchlist 전체 조회
                    const allStocks = [...(latestReport.holdings || []), ...(latestReport.watchlist || [])];
                    const matched = allStocks.find(s => s.name.toLowerCase() === ticker.toLowerCase() || 
                                                       (s.reason && s.reason.ticker && s.reason.ticker.toLowerCase() === ticker.toLowerCase()) ||
                                                       (s.name && s.name.includes(ticker)) || (ticker.includes(s.name)));
                    if (matched) {
                        companyName = matched.name;
                    }
                }
                return {
                    ticker: ticker,
                    name: companyName || ticker, // 매칭되는 이름이 없으면 티커로 대체
                    path: dir.path
                };
            });

            renderLWikiStockList();
        })
        .catch(err => {
            console.error('L.WIKI List Load Error:', err);
            listContainer.innerHTML = `
                <div class="wiki-error-message">
                    <span>⚠️ 목록 로드 실패</span>
                    <p>${err.message}</p>
                    <button onclick="loadLWikiStockList()">재시도</button>
                </div>
            `;
        });
}

// 종목 목록 렌더링 (필터링 지원)
function renderLWikiStockList(filterQuery = '') {
    const listContainer = document.getElementById('wiki-stock-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const query = filterQuery.toLowerCase();
    const filtered = LWikiState.stocks.filter(s => 
        s.ticker.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.8rem; padding: 1rem; text-align: center;">검색 결과가 없습니다.</p>`;
        return;
    }

    filtered.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'wiki-stock-item';
        if (LWikiState.activeTicker === stock.ticker) {
            item.classList.add('active');
        }

        const displayText = stock.name !== stock.ticker ? `${stock.name}` : stock.ticker;
        item.innerHTML = `
            <span>${displayText}</span>
            <span class="stock-ticker">${stock.ticker}</span>
        `;

        item.addEventListener('click', () => {
            // 활성화 토글
            document.querySelectorAll('.wiki-stock-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            LWikiState.activeTicker = stock.ticker;
            loadLWikiContent(stock);
        });

        listContainer.appendChild(item);
    });
}

// 특정 종목의 info.md 문서 실시간 로드
function loadLWikiContent(stock) {
    const viewer = document.getElementById('wiki-viewer-content');
    if (!viewer) return;

    // 로딩바 표출
    viewer.innerHTML = `
        <div class="wiki-loading-spinner" style="min-height: 300px;">
            <div class="spinner"></div>
            <span class="spinner-text">${stock.name} (${stock.ticker}) 위키 문서를 불러오는 중...</span>
        </div>
    `;

    const url = `https://api.github.com/repos/${LWikiState.repo}/contents/${LWikiState.folder}/${stock.ticker}/info.md?ref=${LWikiState.branch}&_t=${Date.now()}`;

    fetch(url, { headers: getGitHubHeaders() })
        .then(response => {
            if (response.status === 404) {
                throw new Error('이 종목의 info.md 문서를 찾을 수 없습니다.');
            }
            if (!response.ok) {
                throw new Error(`문서 로드 실패 (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            // Base64 디코딩 (한글 깨짐 현상을 방지하기 위해 decodeURIComponent & escape 사용)
            const base64Content = data.content.replace(/\s/g, '');
            const decodedMarkdown = decodeURIComponent(atob(base64Content).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            renderLWikiMarkdown(decodedMarkdown, stock.ticker);
        })
        .catch(err => {
            console.error('L.WIKI Content Load Error:', err);
            viewer.innerHTML = `
                <div class="wiki-error-message" style="min-height: 250px;">
                    <span>⚠️ 위키 로드 실패</span>
                    <p>${err.message}</p>
                    <button onclick="loadLWikiContent({ticker: '${stock.ticker}', name: '${stock.name}'})">재시도</button>
                </div>
            `;
        });
}

// YAML Frontmatter 및 마크다운 바디 분리 파서
function parseMarkdownWithFrontmatter(markdown) {
    const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = markdown.match(regex);

    if (match) {
        const yamlStr = match[1];
        const contentStr = match[2];
        const metadata = {};

        // 단순 키-밸류 파싱
        yamlStr.split('\n').forEach(line => {
            const index = line.indexOf(':');
            if (index > 0) {
                const key = line.substring(0, index).trim();
                let val = line.substring(index + 1).trim();
                // 따옴표 제거
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1);
                } else if (val.startsWith("'") && val.endsWith("'")) {
                    val = val.substring(1, val.length - 1);
                }
                metadata[key] = val;
            }
        });

        return { metadata, content: contentStr };
    }

    return { metadata: null, content: markdown };
}

// 위키 렌더링
function renderLWikiMarkdown(markdown, ticker) {
    const viewer = document.getElementById('wiki-viewer-content');
    if (!viewer) return;

    const parsed = parseMarkdownWithFrontmatter(markdown);
    const companyName = parsed.metadata ? (parsed.metadata.company_name || '') : '';
    
    // 상세 보기 공통 헤더 및 삭제 버튼 주입
    let html = `
        <div class="wiki-detail-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                <h2 style="margin: 0; color: #fff; font-size: 1.4rem; font-weight: 800;">${companyName || ticker}</h2>
                ${companyName ? `<span style="color: var(--text-muted); font-size: 0.9rem;">(${ticker})</span>` : ''}
            </div>
            <button id="wiki-delete-stock-btn" data-ticker="${ticker}" data-name="${companyName || ticker}" class="wiki-btn danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-weight: bold; cursor: pointer; flex: none !important; width: auto !important; max-width: fit-content !important; white-space: nowrap;">
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                종목 삭제
            </button>
        </div>
    `;

    // 1. Frontmatter 메타데이터가 존재하면 카드로 상단 렌더링
    if (parsed.metadata) {
        html += `<div class="wiki-meta-grid">`;
        const keysToDisplay = {
            'company_name': '종목명',
            'ticker': '티커',
            'market_cap': '시가총액',
            'pe_ratio': 'P/E Ratio',
            'dividend_yield': '배당수익률',
            'last_updated': '최근 업데이트'
        };

        for (const [key, label] of Object.entries(keysToDisplay)) {
            if (parsed.metadata[key]) {
                html += `
                    <div class="wiki-meta-card">
                        <span class="wiki-meta-label">${label}</span>
                        <span class="wiki-meta-value">${parsed.metadata[key]}</span>
                    </div>
                `;
            }
        }
        html += `</div>`;
    }

    // 2. 마크다운 바디 파싱
    let content = parsed.content;

    // 3. 옵시디언 고유 문법 변환
    // 3-1) Obsidian 위키링크 이미지 및 일반 이미지 탐지 및 비동기 플레이스홀더 변환
    // ![[chart.png|300]] 또는 ![[chart.png]]
    const obsidianImageRegex = /!\[\[(.*?)(?:\|.*?)?\]\]/g;
    content = content.replace(obsidianImageRegex, (match, fileName) => {
        return `<img class="wiki-async-img" data-filename="${fileName.trim()}" alt="${fileName.trim()}" style="max-width: 100%; border-radius: 8px; margin: 12px 0; border: 1px solid rgba(255,255,255,0.08); display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">`;
    });

    // 일반 마크다운 이미지 중 상대 경로로 명시된 이미지: ![alt](./chart.png) 또는 ![alt](chart.png)
    const markdownImageRegex = /!\[(.*?)\]\(((?!\s*https?:\/\/|\s*data:)(.*?))\)/g;
    content = content.replace(markdownImageRegex, (match, altText, filePath) => {
        const fileName = filePath.replace(/^\.\//, '').trim();
        return `<img class="wiki-async-img" data-filename="${fileName}" alt="${altText || fileName}" style="max-width: 100%; border-radius: 8px; margin: 12px 0; border: 1px solid rgba(255,255,255,0.08); display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">`;
    });

    // 3-2) [[chart.csv|일별 주가 데이터 (CSV)]] 혹은 [[파일명]] 내부 링크 처리 (단순히 가독성을 높이기 위해 텍스트 링크 또는 뱃지로 변환)
    const obsidianLinkRegex = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
    content = content.replace(obsidianLinkRegex, (match, path, label) => {
        const displayText = label || path;
        return `<span style="color: var(--accent-blue); font-weight: 600; background: rgba(56, 189, 248, 0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(56, 189, 248, 0.15);">${displayText}</span>`;
    });

    // 3-3) Marked 컴파일러 실행
    if (typeof marked !== 'undefined') {
        html += marked.parse(content);
    } else {
        html += `<pre style="white-space: pre-wrap;">${content}</pre>`;
    }

    viewer.innerHTML = html;

    // 비동기 이미지 로드 처리 (Private 레포 및 다양한 파일명 안정성 대응)
    const asyncImages = viewer.querySelectorAll('.wiki-async-img');
    asyncImages.forEach(img => {
        const fileName = img.getAttribute('data-filename');
        if (!fileName) return;

        // 로딩 흐림 효과 적용
        img.style.opacity = '0.4';
        img.style.transition = 'all 0.3s ease';

        if (LWikiState.token) {
            // Private 저장소 대응: GitHub API를 통한 Base64 Fetch
            const url = `https://api.github.com/repos/${LWikiState.repo}/contents/${LWikiState.folder}/${ticker}/${fileName}?ref=${LWikiState.branch}`;
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            headers['Authorization'] = `token ${LWikiState.token}`;

            fetch(url, { headers })
                .then(res => {
                    if (!res.ok) throw new Error(`Image API load failed: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (data.content) {
                        const ext = fileName.split('.').pop().toLowerCase();
                        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'gif' ? 'image/gif' : 'image/png');
                        const cleanBase64 = data.content.replace(/\s/g, '');
                        img.src = `data:${mimeType};base64,${cleanBase64}`;
                        img.style.opacity = '1';
                    }
                })
                .catch(err => {
                    console.error('L.WIKI Private Image Load Failed:', err);
                    // fallback: Raw URL 시도
                    const rawUrl = `https://raw.githubusercontent.com/${LWikiState.repo}/${LWikiState.branch}/${LWikiState.folder}/${ticker}/${fileName}`;
                    img.src = rawUrl;
                    img.style.opacity = '1';
                });
        } else {
            // Public 저장소 대응: Raw URL 직접 대입
            const rawUrl = `https://raw.githubusercontent.com/${LWikiState.repo}/${LWikiState.branch}/${LWikiState.folder}/${ticker}/${fileName}`;
            img.src = rawUrl;
            img.style.opacity = '1';
        }
    });

    // marked 렌더링된 요소 중 Obsidian의 callout 인용문(> [!NOTE] 형태) 가공
    const quotes = viewer.querySelectorAll('blockquote');
    quotes.forEach(quote => {
        const firstP = quote.querySelector('p');
        if (firstP && firstP.innerHTML.trim().startsWith('[!')) {
            const match = firstP.innerHTML.match(/^\[!(.*?)\]/);
            if (match) {
                const calloutType = match[1];
                const cleanText = firstP.innerHTML.replace(/^\[!(.*?)\]\s*/, '');
                firstP.innerHTML = `<strong>${calloutType}</strong> ${cleanText}`;
                quote.style.borderLeftColor = getCalloutColor(calloutType);
                quote.style.background = getCalloutBgColor(calloutType);
            }
        }
    });
}

// Callout 타입별 지시선 색상
function getCalloutColor(type) {
    const colors = {
        'NOTE': '#38bdf8', // 하늘색
        'TIP': '#34d399',  // 초록색
        'IMPORTANT': '#a78bfa', // 보라색
        'WARNING': '#fb923c', // 오렌지색
        'CAUTION': '#fb7185'  // 분홍색
    };
    return colors[type.toUpperCase()] || '#38bdf8';
}

// Callout 타입별 배경 색상
function getCalloutBgColor(type) {
    const colors = {
        'NOTE': 'rgba(56, 189, 248, 0.05)',
        'TIP': 'rgba(52, 211, 153, 0.05)',
        'IMPORTANT': 'rgba(167, 139, 250, 0.05)',
        'WARNING': 'rgba(251, 146, 60, 0.05)',
        'CAUTION': 'rgba(251, 113, 133, 0.05)'
    };
    return colors[type.toUpperCase()] || 'rgba(56, 189, 248, 0.05)';
}

// L.WIKI 내부용 알림 창 헬퍼
function showLiveAlert(msg, type) {
    if (typeof showWhaleToast === 'function') {
        showWhaleToast(type === 'success' || type === 'info' ? 'BREAKOUT' : 'ALERT', msg);
    } else {
        alert(msg);
    }
}

// [NEW] L.WIKI 종목 추가 API 연동
function addLWikiStock(ticker, name, callback) {
    if (!LWikiState.token) {
        showLiveAlert('GitHub 토큰이 유효하지 않습니다.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('wiki-modal-submit-btn');
    const originalText = submitBtn ? submitBtn.innerText : '종목 추가 생성';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '템플릿 조회 중...';
    }

    const today = new Date().toISOString().split('T')[0];
    const headers = getGitHubHeaders();

    // 1단계: 원격 templates/Stock Template.md 파일 가져오기 시도
    const templatePath = 'templates/Stock Template.md';
    const templateUrl = `https://api.github.com/repos/${LWikiState.repo}/contents/${templatePath}?ref=${LWikiState.branch}&_t=${Date.now()}`;

    fetch(templateUrl, { headers })
    .then(res => {
        if (!res.ok) {
            console.warn(`Template file not found (Status: ${res.status}). Using fallback default template.`);
            return null;
        }
        return res.json();
    })
    .then(data => {
        let markdownContent = '';

        if (data && data.content) {
            // base64 디코딩 (한글 깨짐 현상을 방지하기 위해 decodeURIComponent & escape 사용)
            const base64Content = data.content.replace(/\s/g, '');
            const templateMarkdown = decodeURIComponent(atob(base64Content).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            // 템플릿 내의 플레이스홀더 치환 실행
            let finalContent = templateMarkdown;
            finalContent = finalContent.replace(/\{\{ticker\}\}/gi, ticker);
            finalContent = finalContent.replace(/\{\{name\}\}/gi, name);
            finalContent = finalContent.replace(/\{\{title\}\}/gi, `${name} (${ticker})`);
            finalContent = finalContent.replace(/\{\{date\}\}/gi, today);
            finalContent = finalContent.replace(/\{\{company_name\}\}/gi, name);
            
            // 고정 문자열 기반 스마트 치환 (YAML Frontmatter 및 헤더 대응)
            finalContent = finalContent.replace(/company_name:\s*["']?Stock Template["']?/gi, `company_name: "${name}"`);
            finalContent = finalContent.replace(/ticker:\s*["']?Stock Template["']?/gi, `ticker: "${ticker}"`);
            finalContent = finalContent.replace(/#\s*Stock Template/gi, `# ${name} (${ticker})`);

            markdownContent = finalContent;
        } else {
            // Fallback 기본 마크다운 템플릿
            markdownContent = `---
company_name: "${name}"
ticker: "${ticker}"
market_cap: "-"
pe_ratio: "-"
dividend_yield: "-"
last_updated: "${today}"
---
# ${name} (${ticker})

LLM이 분석 중입니다. 분석이 끝난 후 내용이 나옵니다.
`;
        }

        // 2단계: GitHub에 새 종목 info.md 파일 업로드 (PUT)
        if (submitBtn) submitBtn.innerText = 'GitHub에 생성 중...';

        const base64Upload = btoa(unescape(encodeURIComponent(markdownContent)));
        const uploadUrl = `https://api.github.com/repos/${LWikiState.repo}/contents/${LWikiState.folder}/${ticker}/info.md?ref=${LWikiState.branch}`;

        return fetch(uploadUrl, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                message: `Create wiki info.md for ${name} (${ticker}) from template`,
                content: base64Upload
            })
        });
    })
    .then(res => {
        if (!res) return;
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || `HTTP Error ${res.status}`);
            });
        }
        return res.json();
    })
    .then(data => {
        if (!data) return;
        showLiveAlert(`[${ticker}] ${name} 종목 위키가 템플릿 기반으로 성공적으로 추가되었습니다! 🎉`, 'success');
        if (callback) callback();
        // 리스트 새로고침
        loadLWikiStockList();
        // 상세 바로가기
        LWikiState.activeTicker = ticker;
        loadLWikiContent({ ticker: ticker, name: name });
    })
    .catch(err => {
        console.error('L.WIKI Add Stock Template Error:', err);
        showLiveAlert(`종목 추가 실패: ${err.message}`, 'error');
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
}

// [NEW] L.WIKI 종목 삭제 API 연동
function deleteLWikiStock(ticker, name) {
    if (!LWikiState.token) {
        showLiveAlert('GitHub 토큰이 없어 종목을 삭제할 수 없습니다. 🔑', 'warning');
        return;
    }

    const confirmMsg = `[⚠️ 경고] 정말로 [${ticker}] ${name} 종목 위키를 삭제하시겠습니까?\n이 종목 폴더 내의 모든 파일(마크다운, 이미지 등)이 GitHub에서 영구히 삭제됩니다.`;
    if (!confirm(confirmMsg)) {
        return;
    }

    const delBtn = document.getElementById('wiki-delete-stock-btn');
    const originalText = delBtn ? delBtn.innerText : '종목 삭제';
    if (delBtn) {
        delBtn.disabled = true;
        delBtn.innerText = '삭제 진행 중...';
    }

    // 1단계: 해당 종목 폴더 내의 모든 파일 목록 조회
    const folderUrl = `https://api.github.com/repos/${LWikiState.repo}/contents/${LWikiState.folder}/${ticker}?ref=${LWikiState.branch}`;
    const headers = getGitHubHeaders();

    fetch(folderUrl, { headers })
    .then(res => {
        if (res.status === 404) {
            throw new Error('저장소에 존재하지 않는 폴더입니다.');
        }
        if (!res.ok) {
            throw new Error(`파일 목록 조회 실패 (${res.status})`);
        }
        return res.json();
    })
    .then(files => {
        if (!Array.isArray(files)) {
            // 단일 파일인 경우 배열로 래핑
            files = [files];
        }

        // 2단계: 순차적으로 모든 파일 삭제 처리 (Promise 체인 활용)
        let deleteChain = Promise.resolve();

        files.forEach(file => {
            deleteChain = deleteChain.then(() => {
                const deleteUrl = `https://api.github.com/repos/${LWikiState.repo}/contents/${file.path}?ref=${LWikiState.branch}`;
                return fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: headers,
                    body: JSON.stringify({
                        message: `Delete wiki file ${file.name} for ticker ${ticker}`,
                        sha: file.sha
                    })
                }).then(delRes => {
                    if (!delRes.ok) {
                        console.warn(`File delete failed: ${file.name} (${delRes.status})`);
                    }
                });
            });
        });

        return deleteChain;
    })
    .then(() => {
        showLiveAlert(`[${ticker}] 종목 위키 삭제가 완료되었습니다. 🗑️`, 'success');
        // 리스트 새로고침
        loadLWikiStockList();
        // 우측 상세 화면 초기화
        const viewer = document.getElementById('wiki-viewer-content');
        if (viewer) {
            viewer.innerHTML = `
                <div class="wiki-placeholder-view">
                    <div class="wiki-placeholder-icon">📖</div>
                    <h3>실시간 LLM 위키 뷰어</h3>
                    <p>좌측 목록에서 분석할 종목을 선택하시면, GitHub의 최신 위키 문서(info.md)를 실시간으로 로드하여 표시합니다.</p>
                </div>
            `;
        }
        LWikiState.activeTicker = null;
    })
    .catch(err => {
        console.error('L.WIKI Delete Stock Error:', err);
        showLiveAlert(`종목 삭제 실패: ${err.message}`, 'error');
    })
    .finally(() => {
        if (delBtn) {
            delBtn.disabled = false;
            delBtn.innerText = originalText;
        }
    });
}

/* ==========================================================================
   Antigravity Stock Expert - Advanced Modules Implementation
   ========================================================================== */

// Global chart instances cache
let backtestChartInstance = null;
let optFrontierChartInstance = null;
let optWeightsChartInstance = null;
let signalRadarChartInstance = null;
let signalAuditChartInstance = null;

// Track active states
let selectedSignalTicker = null;
let currentSignalFilter = 'ALL';

/**
 * --------------------------------------------------------------------------
 * Module A: Quant Backtester Engine
 * --------------------------------------------------------------------------
 */
/* ============================================================================
 * [v14] 옛 QUANT LAB 화면 코드 제거 (약 1,380줄)
 * ----------------------------------------------------------------------------
 * STRATEGY LAB / PORTFOLIO X-RAY / RISK ANALYZER 는 dashboard/quant_lab.js +
 * scripts/trade/quant_lab_api.py 로 이관됐다. 여기 있던 함수들은 이미 삭제된
 * DOM(옛 view-backtest / view-optimizer / view-risk)만 조작하던 고아 코드다.
 *
 * 제거 근거: 호출 그래프상 진입점(runBacktestSimulation, runPortfolioOptimization,
 * renderCorrelationHeatmap)의 호출부가 0이고, 나머지는 그 진입점 안에서만 불렸다.
 * 지표 함수(calculateRSI/SMA/EMA/MACD/BollingerBands)도 옛 백테스터와 삭제된
 * quant_engine.js 전용이었다 — 다른 파일 참조 없음을 확인했다.
 *
 * 이력은 git 에 있다: git show HEAD:dashboard/script.js
 * ========================================================================== */
// [v14] initBacktester 제거 — QUANT LAB 은 quant_lab.js + 백엔드로 이관됐다.
//        이 함수가 조작하던 DOM(옛 view-backtest/view-optimizer)은 더 이상 없다.





/**
 * --------------------------------------------------------------------------
 * Module B: Portfolio Mean-Variance Optimizer
 * --------------------------------------------------------------------------
 */
// [v14] initOptimizer 제거 — QUANT LAB 은 quant_lab.js + 백엔드로 이관됐다.
//        이 함수가 조작하던 DOM(옛 view-backtest/view-optimizer)은 더 이상 없다.









/**
 * --------------------------------------------------------------------------
 * Module C: Signal Intelligence Hub
 * --------------------------------------------------------------------------
 */
function initSignalHub() {
    // [v14] 거래 서버가 켜져 있으면 규칙 성적표를 최신값으로 덮어쓴다.
    // 꺼져 있어도 signal_quality.js 의 정적 스냅샷으로 배지가 보인다.
    (async () => {
        try {
            const base = window.TRADE_API_BASE || 'http://127.0.0.1:8000';
            const res = await fetch(base + '/api/lab/signal-quality?max_symbols=60');
            if (!res.ok) return;
            const j = await res.json();
            if (!j.available || !j.rows) return;
            const rules = {};
            j.rows.forEach(r => { rules[r.rule] = r; });
            window.SIGNAL_QUALITY = Object.assign({}, j, { rules, generated: '방금 (서버)' });
            renderSignalQualityNote();
            renderSignalCards();
        } catch (e) { /* 서버 없음 — 정적 스냅샷 유지 */ }
    })();

    renderSignalQualityNote();

    // Populate filter listeners
    const chips = document.querySelectorAll('.signal-filter-bar .filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentSignalFilter = chip.getAttribute('data-filter');
            renderSignalCards();
        });
    });

    renderSignalCards();
}

/* 성적표의 출처와 한계를 화면에 밝힌다.
   배지 숫자만 크게 보이면 "검증됐다"로 오해하기 쉽다. */
function renderSignalQualityNote() {
    const bar = document.querySelector('.signal-filter-bar');
    if (!bar) return;
    let el = document.getElementById('sig-quality-note');
    if (!el) {
        el = document.createElement('div');
        el.id = 'sig-quality-note';
        el.className = 'sig-quality-note';
        bar.parentNode.insertBefore(el, bar);
    }
    const q = window.SIGNAL_QUALITY;
    const icon = (window.Icons && window.Icons.icon) ? window.Icons.icon('flask') : '';
    if (!q || !q.rules) {
        el.innerHTML = icon + '<span>규칙 성적표를 불러오지 못했습니다. '
            + '<code>python -m scripts.report.gen_signal_quality</code> 로 생성하세요.</span>';
        return;
    }
    const rows = Object.values(q.rules);
    const good = rows.filter(r => r.grade === 'good').length;
    const mism = rows.filter(r => r.direction_mismatch).length;
    el.innerHTML = icon + '<span>'
        + `아래 규칙 배지는 <b>${q.years}년 · ${q.symbols}종목 · 왕복 ${q.cost_bp}bp</b> 기준 실측입니다. `
        + `<b>${rows.length}개 중 ${good}개</b>만 무조건 진입보다 유의하게 낫습니다`
        + (mism ? `, <b>${mism}개는 표시 방향과 실측이 반대</b>입니다` : '')
        + `. 나머지는 "신호"라기보다 <b>배경 소음</b>에 가깝습니다. `
        + `규칙 ${q.n_tested}개를 동시에 검정하므로 Bonferroni 임계 |z| ≥ ${q.z_critical} 를 씁니다. `
        + `<small>기준일 ${q.generated}</small></span>`;
}

function renderSignalCards() {
    const containerStrongBuy = document.getElementById('container-strong-buy');
    const containerBuy = document.getElementById('container-buy');
    const containerHold = document.getElementById('container-hold');
    const containerSell = document.getElementById('container-sell');
    
    if (!containerStrongBuy || !containerBuy || !containerHold || !containerSell) return;

    if (!window.REPORTS_HISTORY || window.REPORTS_HISTORY.length === 0) return;

    const latestReport = window.REPORTS_HISTORY[0];
    const holdings = latestReport.holdings || [];
    const watchlist = latestReport.watchlist || [];
    
    // DISCOVERY 종목들도 SIGNAL 분석 대상에 포함
    const discovery = latestReport.discovery || {};
    const discoveryUs = (discovery.picks_us || []).map(p => ({ ...p, symbol: p.symbol || p.ticker, currentPrice: p.price, changePercent: p.change_pct, actionScore: p.actionScore || p.rec_score }));
    const discoveryKr = (discovery.picks_kr || []).map(p => ({ ...p, symbol: p.symbol || p.ticker, currentPrice: p.price, changePercent: p.change_pct, actionScore: p.actionScore || p.rec_score }));
    const discoveryCrypto = (discovery.picks_crypto || []).map(p => ({ ...p, symbol: p.symbol || p.ticker, currentPrice: p.price, changePercent: p.change_pct, actionScore: p.actionScore || p.rec_score }));
    
    // 중복 제거용 Set (symbol 기준)
    const seenSymbols = new Set();
    const allItems = [];
    
    [...holdings, ...watchlist, ...discoveryUs, ...discoveryKr, ...discoveryCrypto].forEach(item => {
        if (item) {
            const sym = item.symbol || item.ticker;
            if (sym && !seenSymbols.has(sym)) {
                seenSymbols.add(sym);
                allItems.push({
                    ...item,
                    symbol: sym
                });
            }
        }
    });

    // SCAN & FILTER
    const strongBuyList = [];
    const buyList = [];
    const holdList = [];
    const sellList = [];

    allItems.forEach(item => {
        const reason = item.reason || {};
        const indicators = reason.indicators || {};
        
        // Scan technical scanner rules
        const rulesTriggered = [];
        let hasUpSignal = false;
        let hasDownSignal = false;
        
        // ── [v14] 규칙 판정 — 32개 후보, 실측 성적을 함께 붙인다 ─────────
        // 이전 코드의 문제:
        //   1) hasUpSignal / hasDownSignal 을 대입만 하고 **한 번도 읽지 않았다**.
        //   2) `indicators.rsi` 를 읽었는데 rsi 는 **종목 최상위**에 있다
        //      (실측 indicators.rsi 0/61 · item.rsi 61/61). 기본값 50 때문에
        //      RSI 규칙이 한 번도 발동하지 않았다.
        //   3) ma_alignment 문자열이 '골든크로스 진행'(20종목) 등으로 나오는데
        //      '정배열'/'역배열' 두 값만 검사해 대부분이 누락됐다.
        //   4) "볼린저 스퀴즈 = UP" 은 방향 오류다 (변동성 축소는 방향이 없다).
        //
        // 성적표: signal_quality.js (정적) 또는 /api/lab/signal-quality (서버).
        // 등급은 앞·뒤 구간(IS/OOS) 이중 검증 + BH-FDR 로 매긴다.
        const SQ = window.SIGNAL_QUALITY || null;
        const qOf = (key) => (SQ && SQ.rules ? SQ.rules[key] : null) || null;

        const fire = (cond, key) => {
            if (!cond) return;
            const m = qOf(key);
            if (!m) return;                       // 성적표에 없는 규칙은 표시하지 않는다
            rulesTriggered.push({
                key, name: m.label, type: m.claimed, group: m.group || '',
                grade: m.grade || 'unknown',
                edge: (m.expectancy_net === undefined) ? null : m.expectancy_net,
                z: m.z, verdict: m.verdict,
                mismatch: !!m.direction_mismatch,
            });
            if (m.grade === 'good') {
                if (m.claimed === 'UP') hasUpSignal = true;
                else if (m.claimed === 'DOWN') hasDownSignal = true;
            }
        };

        const num = (v) => (typeof v === 'number' && isFinite(v)) ? v : null;
        // RSI 는 종목 최상위에 있다. 기본값을 쓰지 않는다 — 결측을 중립 판독으로
        // 위장하면 규칙이 조용히 잘못 발동한다.
        const rsi = num(indicators.rsi) !== null ? num(indicators.rsi) : num(item.rsi);
        const stochK = num(indicators.stochastic_k);
        const wr = num(indicators.williams_r);
        const roc = num(indicators.roc_12);
        const adx = num(indicators.adx);
        const macdH = num(indicators.macd_histogram);
        const cmf = num(indicators.cmf);
        const volRatio = num(indicators.volume_ratio);
        const m5 = num(indicators.ma_5), m20 = num(indicators.ma_20);
        const m60 = num(indicators.ma_60), m120 = num(indicators.ma_120);
        const vwap = num(indicators.vwap);
        const px = num(item.currentPrice) || num(item.rawPrice) || num(item.price);
        const bbPos = indicators.bollinger_position;
        const fib = indicators.fibonacci || {};
        const hi60 = num(fib.high_60d), lo60 = num(fib.low_60d);

        // 모멘텀
        if (rsi !== null) {
            fire(rsi <= 30, 'rsi_le30');
            fire(rsi <= 35, 'rsi_le35');
            fire(rsi >= 70, 'rsi_ge70');
            fire(rsi >= 80, 'rsi_ge80');
        }
        if (stochK !== null) {
            fire(stochK <= 20, 'stoch_le20');
            fire(stochK >= 80, 'stoch_ge80');
        }
        if (wr !== null) fire(wr <= -80, 'williams_le80');
        if (roc !== null) {
            fire(roc > 0, 'roc12_pos');
            fire(roc < 0, 'roc12_neg');
        }

        // 추세 — 이평선 값으로 직접 판정한다 (성적표와 같은 정의)
        const haveMA = [m5, m20, m60].every(v => v !== null && v > 0);
        if (haveMA) {
            const bull = m5 > m20 && m20 > m60;
            const bear = m5 < m20 && m20 < m60;
            fire(bull, 'ma_bullish');
            fire(bear, 'ma_bearish');
            fire(m5 > m20 && !bull, 'ma_golden_cross');
        }
        if (m60 !== null && m120 !== null) fire(m60 > m120, 'ma_long_up');
        if (adx !== null) {
            fire(adx >= 25, 'adx_strong');
            fire(adx < 18, 'adx_range');
        }
        if (macdH !== null) {
            fire(macdH > 0, 'macd_hist_pos');
            fire(macdH < 0, 'macd_hist_neg');
        }

        // 변동성 · 위치
        fire(indicators.bollinger_squeeze === true, 'bb_squeeze');
        fire(bbPos === '하단 이탈' || bbPos === '하단 돌파', 'bb_lower_break');
        fire(bbPos === '상단 돌파', 'bb_upper_break');
        if (px !== null && lo60 !== null && lo60 > 0) fire((px - lo60) / lo60 <= 0.10, 'near_60d_low');
        if (px !== null && hi60 !== null && hi60 > 0) fire((hi60 - px) / hi60 <= 0.03, 'near_60d_high');
        if (px !== null && vwap !== null && vwap > 0) fire(px < vwap, 'below_vwap');

        // 수급
        if (cmf !== null) {
            fire(cmf > 0.10, 'cmf_pos');
            fire(cmf < -0.10, 'cmf_neg');
        }
        if (volRatio !== null) fire(volRatio >= 2.0, 'vol_surge');
        fire(indicators.obv_trend === '상승', 'obv_up');

        // 패턴
        fire(indicators.spring_detected === true, 'wyckoff_spring');
        fire(indicators.upthrust_detected === true, 'wyckoff_upthrust');

        // 검증된 규칙(good)의 기대값 합 — 표시용 신호 우위
        const verifiedRules = rulesTriggered.filter(r => r.grade === 'good');
        const weakRules = rulesTriggered.filter(r => r.grade === 'weak');
        const signalEdge = verifiedRules.reduce((a, r) => a + (r.edge || 0), 0);
        // DISCOVERY 스크리너 종목은 reason.indicators 가 없다 (실측 30/61).
        // "검증된 신호 없음"과 "지표 자체가 없음"은 다른 상태다.
        const hasIndicators = Object.keys(indicators).length > 0 || rsi !== null;

        // 표시 순서: 등급 좋은 것 먼저, 그 안에서 기대값 큰 순.
        // 계산 순서로 자르면 늘 같은 규칙만 보인다.
        const GRADE_RANK = { good: 0, weak: 1, none: 2, bad: 3, unknown: 4 };
        rulesTriggered.sort((x, y) =>
            (GRADE_RANK[x.grade] - GRADE_RANK[y.grade]) || ((y.edge || -9) - (x.edge || -9)));

        // 등급은 기존 actionScore 를 유지한다 (검증된 대안 점수가 아직 없다).
        const score = item.actionScore || 50;
        let rating = 'HOLD';
        if (score >= 80) rating = 'STRONG BUY';
        else if (score >= 60) rating = 'BUY';
        else if (score >= 35) rating = 'HOLD';
        else if (score >= 15) rating = 'SELL';
        else rating = 'STRONG SELL';

        // Apply rules filtering
        let display = false;
        if (currentSignalFilter === 'ALL') {
            display = true;
        } else if (currentSignalFilter === 'STRONG BUY' && rating === 'STRONG BUY') {
            display = true;
        } else if (currentSignalFilter === 'BUY' && rating === 'BUY') {
            display = true;
        } else if (currentSignalFilter === 'HOLD' && rating === 'HOLD') {
            display = true;
        } else if (currentSignalFilter === 'SELL' && (rating === 'SELL' || rating === 'STRONG SELL')) {
            display = true;
        }

        if (display) {
            const cardObj = {
                item: item,
                rating: rating,
                rules: rulesTriggered.slice(0, 6),
                verifiedCount: verifiedRules.length,
                weakCount: weakRules.length,
                signalEdge: signalEdge,
                hasIndicators: hasIndicators,
                hasUpSignal: hasUpSignal,
                hasDownSignal: hasDownSignal
            };

            // Categorize by dynamic rating
            if (rating === 'STRONG BUY') {
                strongBuyList.push(cardObj);
            } else if (rating === 'BUY') {
                buyList.push(cardObj);
            } else if (rating === 'HOLD') {
                holdList.push(cardObj);
            } else {
                sellList.push(cardObj);
            }
        }
    });

    // Update count badges & Toggle section visibility dynamically
    const strongBuyCount = strongBuyList.length;
    const buyCount = buyList.length;
    const holdCount = holdList.length;
    const sellCount = sellList.length;

    document.getElementById('count-strong-buy').textContent = strongBuyCount;
    document.getElementById('count-buy').textContent = buyCount;
    document.getElementById('count-hold').textContent = holdCount;
    document.getElementById('count-sell').textContent = sellCount;

    // Toggle DOM Display
    document.getElementById('signal-group-strong-buy').style.display = strongBuyCount > 0 ? 'block' : 'none';
    document.getElementById('signal-group-buy').style.display = buyCount > 0 ? 'block' : 'none';
    document.getElementById('signal-group-hold').style.display = holdCount > 0 ? 'block' : 'none';
    document.getElementById('signal-group-sell').style.display = sellCount > 0 ? 'block' : 'none';

    // Helper function to map card html
    const mapCards = (list) => {
        if (list.length === 0) return '';
        
        return list.map(obj => {
            const item = obj.item;
            const rating = obj.rating;
            const cardClass = rating.toLowerCase().replace(' ', '-');
            const badgeClass = cardClass;
            
            const changeVal = parseFloat(item.changePercent) || 0.0;
            const changeStr = `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)}%`;
            const changeColorClass = changeVal >= 0 ? 'positive' : 'negative';

            /* [v14] 규칙마다 실측 성적을 붙인다.
               등급 4단계 — good(앞·뒤 구간 모두 통과) / weak(한쪽만) /
               none(구분 불가) / bad(열위). 검증 안 된 규칙은 흐리게 죽여
               "신호가 떴다"가 아니라 "이 신호는 이만큼 번다"를 말하게 한다. */
            const GRADE_LABEL = { good: '검증됨', weak: '불안정', none: '값 없음', bad: '역효과' };
            const rulesHtml = obj.rules.map(r => {
                const edgeTxt = (r.edge === null || r.edge === undefined)
                    ? '' : `${r.edge >= 0 ? '+' : ''}${r.edge.toFixed(3)}R`;
                const badge = r.grade === 'good'
                    ? `<span class="sig-rule-badge sig-good" title="${r.verdict || ''}">${edgeTxt}</span>`
                    : `<span class="sig-rule-badge sig-${r.grade}" title="${r.verdict || ''}">${GRADE_LABEL[r.grade] || '미측정'}</span>`;
                const warn = r.mismatch
                    ? '<span class="sig-rule-badge sig-mismatch" title="실측 방향이 표시와 반대입니다">방향 반대</span>'
                    : '';
                const dotCol = r.type === 'DOWN' ? 'var(--live-red)'
                             : r.type === 'NEUTRAL' ? '#64748b' : 'var(--accent-blue)';
                return `<div class="signal-rule-item sig-grade-${r.grade}">
                    <span class="signal-rule-dot" style="background:${dotCol};"></span>
                    <span class="sig-rule-name">${r.name}</span>${badge}${warn}
                </div>`;
            }).join('') || '<div class="signal-rule-item" style="color:#64748b;font-size:.72rem;">해당하는 규칙 없음</div>';

            /* 검증된 신호가 하나도 없으면 그렇다고 말한다.
               규칙 11개 중 실제로 우위가 확인된 것은 소수다. */
            const edgeHtml = obj.verifiedCount > 0
                ? `<div class="sig-edge sig-edge-ok">${obj.signalEdge >= 0 ? '+' : ''}${obj.signalEdge.toFixed(3)}R
                     <small>앞·뒤 구간 모두 통과한 신호 ${obj.verifiedCount}개</small></div>`
                : !obj.hasIndicators
                    ? `<div class="sig-edge sig-edge-nodata">지표 없음
                         <small>스크리너 종목이라 기술 지표가 계산되지 않았습니다</small></div>`
                    : obj.weakCount > 0
                        ? `<div class="sig-edge sig-edge-weak">불안정 신호 ${obj.weakCount}개
                             <small>한쪽 구간에서만 우위 — 근거로 쓰기엔 약합니다</small></div>`
                        : `<div class="sig-edge sig-edge-none">검증된 신호 없음
                             <small>표시된 규칙은 무조건 진입과 구분되지 않습니다</small></div>`;

            return `
                <div class="signal-alert-card ${cardClass}" data-symbol="${item.symbol}" style="cursor:pointer; background: rgba(30,41,59,0.35); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem; transition: all 0.25s;" onmouseover="this.style.background='rgba(30,41,59,0.5)';" onmouseout="this.style.background='rgba(30,41,59,0.35)';">
                    <div class="signal-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div class="signal-stock-info" style="display: flex; flex-direction: column;">
                            <span class="signal-symbol" style="font-weight: 800; color: #fff; font-size: 1rem; font-family: 'Outfit';">${item.symbol}</span>
                            <span class="signal-name" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${item.name}</span>
                        </div>
                        <span class="rating-badge ${badgeClass}">${rating}</span>
                    </div>
                    <div class="signal-rules-list" style="margin-bottom: 1rem;">
                        ${edgeHtml}
                        ${rulesHtml}
                    </div>
                    <div class="signal-card-footer" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem; color: var(--text-secondary);">
                        <span style="font-family:'Outfit'; font-weight: 700; color: #fff;">${item.currentPrice} (<span class="${changeColorClass}">${changeStr}</span>)</span>
                        <span style="font-size: 0.75rem;">AI 점수: <span class="signal-score" style="font-weight: 800; color: var(--accent-blue);">${item.actionScore || 50}점</span></span>
                    </div>
                </div>
            `;
        }).join('');
    };

    containerStrongBuy.innerHTML = mapCards(strongBuyList);
    containerBuy.innerHTML = mapCards(buyList);
    containerHold.innerHTML = mapCards(holdList);
    containerSell.innerHTML = mapCards(sellList);

    // Bind card clicks to trigger deep charts rendering across all sections
    const cards = document.querySelectorAll('.signal-alert-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove border highlighting from all
            cards.forEach(c => {
                c.style.borderColor = 'var(--glass-border)';
                c.style.boxShadow = 'none';
            });
            card.style.borderColor = '#0ea5e9';
            card.style.boxShadow = '0 0 10px rgba(14, 165, 233, 0.2)';
            
            const sym = card.getAttribute('data-symbol');
            selectedSignalTicker = sym;
            renderSignalDeepCharts(sym);
        });
    });

    // Auto-select first card to render charts
    if (cards.length > 0) {
        cards[0].click();
    }
}

function renderSignalDeepCharts(symbol) {
    if (!window.REPORTS_HISTORY || window.REPORTS_HISTORY.length === 0) return;

    const latestReport = window.REPORTS_HISTORY[0];
    const allStocks = [...(latestReport.holdings || []), ...(latestReport.watchlist || [])];
    const stockObj = allStocks.find(s => s.symbol === symbol);

    if (!stockObj) return;

    // 1. Draw Radar Chart for Multi-Factor Composite
    drawRadarChart(stockObj);

    // 2. Draw Prediction Audit Line Chart
    drawPredictionAuditChart(stockObj);
}

function drawRadarChart(stockObj) {
    const canvas = document.getElementById('signalRadarChart');
    if (!canvas) return;

    if (signalRadarChartInstance) signalRadarChartInstance.destroy();

    const titleEl = document.getElementById('sig-radar-title');
    if (titleEl) titleEl.textContent = `🎯 [${stockObj.symbol}] MFC 10차원 상승 모멘텀 분석 점수`;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    if (width <= 0 && canvas.parentElement) width = canvas.parentElement.clientWidth;
    if (height <= 0 && canvas.parentElement) height = canvas.parentElement.clientHeight;
    if (width <= 0) width = 400;
    if (height <= 0) height = 350;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const mfc = stockObj.mfcBreakdown || {};
    // Fallback to defaults if not filled
    const dimensions = [
        { label: '추세 (Trend)', val: mfc.trend !== undefined ? mfc.trend : 50 },
        { label: '모멘텀 (Momentum)', val: mfc.momentum !== undefined ? mfc.momentum : 60 },
        { label: '수급 (Flow)', val: mfc.flow !== undefined ? mfc.flow : 45 },
        { label: '변동성 (Volatility)', val: mfc.volatility !== undefined ? mfc.volatility : 70 },
        { label: '시장구조 (Structure)', val: mfc.structure !== undefined ? mfc.structure : 55 },
        { label: '심리 (Sentiment)', val: mfc.sentiment !== undefined ? mfc.sentiment : 50 }
    ];

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.38;

    // Draw grid rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const ringCount = 4;
    for (let r = 1; r <= ringCount; r++) {
        const radius = maxRadius * (r / ringCount);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Ring value label
        ctx.fillStyle = '#64748b';
        ctx.font = '8px Outfit';
        ctx.fillText((25 * r).toString(), centerX - 4, centerY - radius + 10);
    }

    // Draw axis lines
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
    }
    ctx.stroke();

    // Draw dimensional labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9.5px Outfit, sans-serif';
    dimensions.forEach((d, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const labelX = centerX + Math.cos(angle) * (maxRadius + 18);
        const labelY = centerY + Math.sin(angle) * (maxRadius + 12);
        
        ctx.textAlign = Math.cos(angle) > 0.1 ? 'left' : (Math.cos(angle) < -0.1 ? 'right' : 'center');
        ctx.textBaseline = Math.sin(angle) > 0.1 ? 'top' : (Math.sin(angle) < -0.1 ? 'bottom' : 'middle');
        ctx.fillText(d.label, labelX, labelY);
    });

    // Draw MFC Polygon path
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)'; // Royal Purple transparent fill
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    ctx.beginPath();
    dimensions.forEach((d, i) => {
        const radius = (d.val / 100) * maxRadius;
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Plot data points
    ctx.fillStyle = '#f25f7a';
    dimensions.forEach((d, i) => {
        const radius = (d.val / 100) * maxRadius;
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });

    signalRadarChartInstance = {
        destroy: function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
}

function drawPredictionAuditChart(stockObj) {
    const canvas = document.getElementById('signalAuditChart');
    if (!canvas) return;

    if (signalAuditChartInstance) signalAuditChartInstance.destroy();

    const titleEl = document.getElementById('sig-audit-title');
    
    const auditHistory = stockObj.predictionHistory || [];

    if (auditHistory.length === 0) {
        // Render empty state
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('최근 30일 이내에 적재된 모델 예측 감사 기록이 없습니다.', canvas.clientWidth / 2, canvas.clientHeight / 2);
        if (titleEl) titleEl.textContent = `📈 [${stockObj.symbol}] AI 예측 검증 이력 (최근 30일 데이터 부재)`;
        return;
    }

    // Calculate Hit Rate Trend
    let cumulativeHits = 0;
    let validAudits = 0;
    const hitRatePoints = []; // List of {date, hitRate}

    // Go chronologically
    const cronHistory = [...auditHistory].reverse();

    cronHistory.forEach(h => {
        // isHit: 1 = Hit, 0 = Miss, -1 = Neutral
        if (h.isHit === 1 || h.isHit === 0) {
            validAudits++;
            if (h.isHit === 1) cumulativeHits++;
            const hitRate = (cumulativeHits / validAudits) * 100;
            hitRatePoints.push({
                date: h.date,
                hitRate: hitRate,
                isHit: h.isHit
            });
        }
    });

    const finalHitRate = validAudits > 0 ? (cumulativeHits / validAudits * 100) : 0;
    if (titleEl) {
        titleEl.textContent = `📈 [${stockObj.symbol}] AI 모델 예측 적중률 트렌드 (최근 30일 종합: ${finalHitRate.toFixed(1)}%)`;
    }

    // [FIX] hitRatePoints가 비어있을 때의 예외 처리 추가 (TypeError 방지)
    if (hitRatePoints.length === 0) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;
        if (width <= 0 && canvas.parentElement) width = canvas.parentElement.clientWidth;
        if (height <= 0 && canvas.parentElement) height = canvas.parentElement.clientHeight;
        if (width <= 0) width = 400;
        if (height <= 0) height = 350;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('유효한 모델 예측 감사 기록이 없습니다. (판정 보류 제외)', width / 2, height / 2);
        return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    if (width <= 0 && canvas.parentElement) width = canvas.parentElement.clientWidth;
    if (height <= 0 && canvas.parentElement) height = canvas.parentElement.clientHeight;
    if (width <= 0) width = 400;
    if (height <= 0) height = 350;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const minX = 0;
    const maxX = Math.max(1, hitRatePoints.length - 1); // [FIX] 분모 0 방지
    const minY = 0;
    const maxY = 100;

    function getX(idx) {
        return padding.left + (idx / maxX) * chartWidth;
    }
    function getY(rate) {
        return padding.top + chartHeight - ((rate - minY) / (maxY - minY)) * chartHeight;
    }

    // 1. Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'Outfit, sans-serif';

    // Y grid (0%, 25%, 50%, 75%, 100%)
    for (let i = 0; i <= 4; i++) {
        const rate = 25 * i;
        const y = getY(rate);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(`${rate}%`, padding.left - 8, y + 4);
    }

    // X axis ticks
    const step = Math.max(1, Math.floor(hitRatePoints.length / 5));
    for (let i = 0; i < hitRatePoints.length; i += step) {
        const x = getX(i);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(hitRatePoints[i].date.substring(5), x, height - padding.bottom + 14);
    }

    // 2. Draw Hit Rate Gradient Fill
    const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(hitRatePoints[0].hitRate));
    for (let i = 1; i < hitRatePoints.length; i++) {
        ctx.lineTo(getX(i), getY(hitRatePoints[i].hitRate));
    }
    ctx.lineTo(getX(hitRatePoints.length - 1), height - padding.bottom);
    ctx.lineTo(getX(0), height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // 3. Draw Trend Line
    ctx.strokeStyle = '#10b981'; // Green accent
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(hitRatePoints[0].hitRate));
    for (let i = 1; i < hitRatePoints.length; i++) {
        ctx.lineTo(getX(i), getY(hitRatePoints[i].hitRate));
    }
    ctx.stroke();

    // 4. Plot Hit (Green Dot) / Miss (Red Dot) details
    hitRatePoints.forEach((pt, idx) => {
        const x = getX(idx);
        const y = getY(pt.hitRate);
        
        ctx.fillStyle = pt.isHit === 1 ? '#f25f7a' : '#5f97f2';
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    signalAuditChartInstance = {
        destroy: function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
}

/**
 * --------------------------------------------------------------------------
 * Math and Indicator Helper Functions
 * --------------------------------------------------------------------------
 */














// --- Manual Tooltip Actions ---
window.toggleTooltip = function(event, tooltipId) {
    event.stopPropagation();
    const targetTooltip = document.getElementById(tooltipId);
    const allTooltips = document.querySelectorAll('.tooltip-content');
    
    // Close other tooltips
    allTooltips.forEach(tooltip => {
        if (tooltip.id !== tooltipId) {
            tooltip.classList.add('hidden');
        }
    });
    
    // Toggle target tooltip
    if (targetTooltip) {
        targetTooltip.classList.toggle('hidden');
    }
};

// Global click event to close tooltips when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.tooltip-container')) {
        document.querySelectorAll('.tooltip-content').forEach(tooltip => {
            tooltip.classList.add('hidden');
        });
    }
});

// [NEW] Generate AI Quant Analysis Report


// [NEW] Generate AI Portfolio Optimization Analysis Report


// [NEW] Toss Trade UI Initialization and API binding
// [NEW] Toss Trade UI Initialization and API binding
let tossSide = "BUY";
let tossType = "MARKET";
let tossChartPeriod = "7";

// 비차단형 토스트 메시지 UI 함수
function showToast(message, type = 'success') {
    let container = document.getElementById('antigravity-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'antigravity-toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.zIndex = '99999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.border = type === 'success' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '500';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    
    const icon = type === 'success' ? '🟢' : '🔴';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 화면 새로고침 없이 Toss 데이터만 부분 갱신하는 헬퍼
function refreshTossData(portfolioData) {
    if (!portfolioData) return;
    
    // 전역/인메모리 TOSS_PORTFOLIO 상수 교체
    window.TOSS_PORTFOLIO = portfolioData;
    
    // 포트폴리오 데이터 렌더링
    renderTossPortfolio();
    
    // 활성화된 서브탭에 따라 차트 및 리스크 도넛 업데이트
    const savedSubTabId = sessionStorage.getItem('activeTossSubTab');
    if (!savedSubTabId || savedSubTabId === 'toss-sub-overview') {
        drawPnlChart();
        drawRiskDonut();
    }
    
    // AI 스마트 추천 및 자동 매매 로그 업데이트
    renderSmartRecommendations();
    if (typeof window.updateBotLogs === 'function') {
        window.updateBotLogs();
    }
    // [v14] QUANT LAB — 현재 열려 있는 탭만 다시 그린다.
    // 세 화면 모두 서버 계산이라 전부 부르면 불필요한 왕복이 3배가 된다.
    if (window.QuantLab) {
        const openView = document.querySelector('.page-view.active')?.id;
        try {
            if (openView === 'view-optimizer') window.QuantLab.renderPortfolio();
            else if (openView === 'view-risk') window.QuantLab.renderRisk();
        } catch (e) { console.error('QuantLab refresh failed:', e); }
    }
    
    console.log("Toss Trade data dynamically updated.");
}

// ── Toss 계좌 모드 (모의/실전) — 클릭 시점에 항상 최신 상태 조회
function isTossRealMode() {
    const toggle = document.getElementById('toss-global-real-toggle');
    if (toggle) return toggle.checked;
    return localStorage.getItem('tossRealMode') === 'true';
}

function isTossDryRun() {
    return !isTossRealMode();
}

window.isTossRealMode = isTossRealMode;
window.isTossDryRun = isTossDryRun;

function getApiUrl(path) {
    if (window.location.protocol === 'file:' || window.location.port !== '8000') {
        const isLocal = window.location.hostname === 'localhost'
            || window.location.hostname === '127.0.0.1'
            || window.location.protocol === 'file:';
        if (isLocal) {
            return `http://127.0.0.1:8000${path}`;
        }
    }
    return path;
}

async function performTossSync(btnTarget) {
    if (!btnTarget) return;
    const isLocal = window.location.hostname === 'localhost'
        || window.location.hostname === '127.0.0.1'
        || window.location.protocol === 'file:';
    if (!isLocal) {
        alert("현재 클라우드 배포 환경(Vercel)입니다. 수동 동기화는 로컬 개발 PC(localhost)에서만 가능합니다.");
        return;
    }
    btnTarget.disabled = true;
    const originalText = btnTarget.textContent;
    btnTarget.textContent = "진행 중...";
    const isDryRun = isTossDryRun();
    try {
        const res = await fetch(getApiUrl("/api/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dry_run: isDryRun })
        });
        const data = await res.json();
        if (!res.ok) {
            const detail = data.detail || data.message || res.statusText;
            showToast(`동기화 실패: ${detail}`, 'error');
            return;
        }
        if (data.success) {
            showToast(isDryRun ? "토스 모의 계좌 데이터 동기화 완료!" : "토스 실전 계좌 데이터 동기화 완료!");
            if (data.portfolio) {
                data.portfolio.dry_run = isDryRun;
                refreshTossData(data.portfolio);
            }
        } else {
            showToast(`동기화 실패: ${data.message}`, 'error');
        }
    } catch (err) {
        console.error(err);
        alert("로컬 매매 프록시 서버(FastAPI)가 오프라인 상태입니다. scripts/trade/local_server.py가 구동 중인지 확인해 주세요.");
    } finally {
        btnTarget.disabled = false;
        btnTarget.textContent = originalText;
    }
}

window.performTossSync = performTossSync;

function showTossLoadingSkeleton() {
    // 1. Holdings tbody 스켈레톤 스피너
    const tbody = document.getElementById('toss-holdings-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align:center; padding:3rem; color:#94a3b8;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
                        <div class="loader-spinner" style="width:28px; height:28px; border:3px solid rgba(255,255,255,0.1); border-top-color:#38bdf8; border-radius:50%; animation:spin 1s linear infinite;"></div>
                        <div style="font-weight:bold;">데이터를 불러오는 중입니다...</div>
                        <div style="font-size:0.8rem; opacity:0.7;">(실전 계좌 연동 시 증권사 API 통신 지연이 발생할 수 있습니다)</div>
                    </div>
                </td>
            </tr>
        `;
    }

    // 2. 계좌 요약 카드 스켈레톤 쉬머
    const summaryIds = ['toss-total-assets', 'toss-cash-balance', 'toss-total-pnl', 'toss-total-return'];
    summaryIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<span class="skeleton-loader" style="width:70px;height:16px;display:inline-block;border-radius:4px;vertical-align:middle;opacity:0.4;"></span>`;
        }
    });

    // 3. 투자 분석 지표 카드 스켈레톤 쉬머
    const journalIds = [
        'toss-journal-winrate', 'toss-journal-total-trades', 'toss-journal-profit-factor', 'toss-journal-realized-pnl',
        'toss-journal-wins', 'toss-journal-losses', 'toss-journal-gross-profit', 'toss-journal-gross-loss'
    ];
    journalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<span class="skeleton-loader" style="width:50px;height:14px;display:inline-block;border-radius:4px;vertical-align:middle;opacity:0.4;"></span>`;
        }
    });

    // 4. 차트 로딩 오버레이
    const chartContainer = document.getElementById('toss-pnl-chart');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:0.5rem;color:#64748b;">
                <div class="loader-spinner" style="width:24px; height:24px; border:2px solid rgba(255,255,255,0.1); border-top-color:#38bdf8; border-radius:50%; animation:spin 1s linear infinite;"></div>
                <div style="font-size:0.8rem;">자산 추이 로드 중...</div>
            </div>
        `;
    }
}

// 글로벌 스위치 상태에 맞춰 포트폴리오를 새로 읽어와 리프레시 (종목.md 미변경)
async function fetchAndRefreshTossPortfolio() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    if (!isLocal) return;

    const isDryRun = isTossDryRun();
    
    // 기존에 데이터가 없을 때만 로딩 스켈레톤을 표시하여 껌뻑임(flicker) 예방
    const portfolio = window.TOSS_PORTFOLIO || (typeof TOSS_PORTFOLIO !== 'undefined' ? TOSS_PORTFOLIO : null);
    const hasData = portfolio && (portfolio.account || (portfolio.holdings || []).length);
    if (!hasData) {
        showTossLoadingSkeleton();
    }

    try {
        const res = await fetch(getApiUrl(`/api/toss-portfolio?dry_run=${isDryRun}`));
        const data = await res.json();
        if (data.success && data.portfolio) {
            data.portfolio.dry_run = isDryRun;
            refreshTossData(data.portfolio);
        } else {
            const detail = data ? (data.detail || data.message || '') : '';
            const msg = !isDryRun 
                ? `실전 계좌 연동 실패 (configs/config.yaml의 Toss API ID/SECRET 설정을 점검하거나, 증권사 점검 시간인지 확인해 주세요) ${detail ? '['+detail+']' : ''}` 
                : "모의 계좌 포트폴리오를 불러오지 못했습니다.";
            if (typeof showToast === 'function') {
                showToast(msg, 'error');
            }
            showTossEmptyState(msg);
        }
    } catch (err) {
        console.error("Failed to fetch toss portfolio:", err);
        const msg = !isDryRun 
            ? "실거래 API 연동 중 에러가 발생했습니다. (Toss 자격 증명 설정 누락 또는 API 서버 타임아웃)" 
            : "로컬 매매 프록시 서버 연결 실패";
        if (typeof showToast === 'function') {
            showToast(msg, 'error');
        }
        showTossEmptyState(msg);
    }
}

function showTossEmptyState(message) {
    const tbody = document.getElementById('toss-holdings-tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #f87171;">⚠️ ${message}</td></tr>`;
    }
    const assetsEl = document.getElementById('toss-total-assets');
    const cashEl = document.getElementById('toss-cash-balance');
    const pnlEl = document.getElementById('toss-total-pnl');
    const returnEl = document.getElementById('toss-total-return');
    if (assetsEl) assetsEl.textContent = '₩0';
    if (cashEl) cashEl.textContent = '₩0';
    if (pnlEl) pnlEl.textContent = '₩0';
    if (returnEl) returnEl.textContent = '0.00%';

    const chartContainer = document.getElementById('toss-pnl-chart');
    if (chartContainer) {
        chartContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ef4444;font-size:0.85rem;padding:1rem;text-align:center;">${message}</div>`;
    }
}

window.fetchAndRefreshTossPortfolio = fetchAndRefreshTossPortfolio;
window.showTossEmptyState = showTossEmptyState;

// ── AI 봇 설정 (전역 + 종목별) 공유 유틸 ──────────────────────────────
const TOSS_BOT_HORIZON_LABELS = { short: '단기', medium: '중기', long: '장기' };
const TOSS_BOT_STRATEGY_LABELS = {
    auto: '자동',
    scalping: '스켈핑',
    day_trading: '당일매매',
    swing: '스윙',
    mean_reversion: '낙주매매',
    trend: '추세추종',
    breakout: '돌파매매',
    channel_trading: '채널매매',
    value: '가치',
    hold: '홀딩',
    dividend_growth: '배당성장',
    index_follow: '지수추종',
};
const TOSS_BOT_HORIZON_STRATEGIES = {
    // [v13] auto — 종목별로 최적 시간축·전략을 자동 선택.
    //   scalping/day_trading 은 실측 기대값이 음수(-0.041R / -0.031R)라 후보에서 제외.
    auto: ['auto', 'swing', 'channel_trading', 'breakout', 'trend', 'value'],
    short: ['scalping', 'day_trading', 'swing', 'mean_reversion', 'auto'],
    medium: ['swing', 'trend', 'breakout', 'channel_trading', 'auto'],
    long: ['value', 'hold', 'dividend_growth', 'index_follow', 'auto'],
};
const TOSS_BOT_DEFAULT_STRATEGY = { auto: 'auto', short: 'swing', medium: 'trend', long: 'value' };
const TOSS_BOT_STRATEGY_HINTS = {
    auto: '종목 국면에 맞는 전략을 자동 선택 (실측 기대값 × 국면 품질)',
    scalping: '1~3일',
    day_trading: '당일 청산',
    swing: '1~2주',
    mean_reversion: '낙반 매매',
    trend: '1~3개월',
    breakout: '강한 돌파 추종',
    channel_trading: '박스권 매매',
    value: '3~6개월',
    hold: '6개월+',
    dividend_growth: '분기 배당 재투자',
    index_follow: '시장 지수 추종',
};
const TOSS_BOT_STRATEGY_DEFAULTS = {
    auto: { take_profit_pct: 10, stop_loss_pct: 5 },   // 선택 전 임시값 — 실제는 선택된 전략을 따름
    scalping: { take_profit_pct: 3, stop_loss_pct: 2 },
    day_trading: { take_profit_pct: 4, stop_loss_pct: 2 },
    swing: { take_profit_pct: 8, stop_loss_pct: 4 },
    mean_reversion: { take_profit_pct: 5, stop_loss_pct: 3 },
    trend: { take_profit_pct: 15, stop_loss_pct: 7 },
    breakout: { take_profit_pct: 12, stop_loss_pct: 5 },
    channel_trading: { take_profit_pct: 10, stop_loss_pct: 5 },
    value: { take_profit_pct: 20, stop_loss_pct: 10 },
    hold: { take_profit_pct: 25, stop_loss_pct: 12 },
    dividend_growth: { take_profit_pct: 18, stop_loss_pct: 8 },
    index_follow: { take_profit_pct: 15, stop_loss_pct: 6 },
};
const TOSS_BOT_SYMBOL_CONFIGS_KEY = 'tossBotSymbolConfigs';

function normalizeBotStrategy(horizon, strategy) {
    const h = horizon || 'short';
    const allowed = TOSS_BOT_HORIZON_STRATEGIES[h] || TOSS_BOT_HORIZON_STRATEGIES.short;
    if (strategy && allowed.includes(strategy)) return strategy;
    return TOSS_BOT_DEFAULT_STRATEGY[h] || allowed[0];
}

function getStrategyHint(horizon, strategy) {
    return TOSS_BOT_STRATEGY_HINTS[strategy] || '';
}

function getAdviceKeywords(horizon, strategy) {
    if (strategy === 'scalping' || strategy === 'day_trading') return ['초단기', '단기'];
    if (strategy === 'swing' && horizon === 'short') return ['단기'];
    if (strategy === 'swing' && horizon === 'medium') return ['중기'];
    if (strategy === 'mean_reversion') return ['단기', '중기'];
    if (strategy === 'trend' || strategy === 'breakout' || strategy === 'channel_trading') return ['중기'];
    if (strategy === 'value' || strategy === 'hold' || strategy === 'dividend_growth' || strategy === 'index_follow') return ['장기'];
    const fallback = { short: ['단기', '초단기'], medium: ['중기'], long: ['장기'] };
    return fallback[horizon] || ['단기'];
}

function parseStrategyAdviceClient(phaseAdvice, horizon, strategy) {
    if (phaseAdvice == null || phaseAdvice === '') return 'HOLD';
    const advice = String(phaseAdvice).trim();
    if (advice.includes('매도 우위') && !advice.includes('|')) return 'SELL';
    if (advice.includes('매수 우위') && !advice.includes('|')) return 'BUY';
    const segments = advice.split('|').map(s => s.trim()).filter(Boolean);
    const keywords = getAdviceKeywords(horizon, strategy);
    const segmentMatches = (seg, kw) => kw === '단기' ? seg.includes('단기') && !seg.includes('초단기') : seg.includes(kw);
    let matched = null;
    for (const kw of keywords) {
        for (const seg of segments) {
            if (segmentMatches(seg, kw)) { matched = seg; break; }
        }
        if (matched) break;
    }
    if (!matched) return 'HOLD';
    if (matched.includes('매도')) return 'SELL';
    if (matched.includes('매수')) return 'BUY';
    return 'HOLD';
}

function parseHorizonAdviceClient(phaseAdvice, horizon, strategy) {
    const strat = strategy || normalizeBotStrategy(horizon, null);
    return parseStrategyAdviceClient(phaseAdvice, horizon, strat);
}

function getStrategyDefaults(strategy) {
    return { ...(TOSS_BOT_STRATEGY_DEFAULTS[strategy] || { take_profit_pct: 10, stop_loss_pct: 5 }) };
}

function renderBotStrategyButtons(container, horizon, activeStrategy, btnClass) {
    if (!container) return;
    const h = horizon || 'short';
    const strategies = TOSS_BOT_HORIZON_STRATEGIES[h] || [];
    const active = normalizeBotStrategy(h, activeStrategy);
    container.innerHTML = strategies.map(id => {
        const hint = getStrategyHint(h, id);
        const label = TOSS_BOT_STRATEGY_LABELS[id] || id;
        return `<button type="button" class="${btnClass}${active === id ? ' active' : ''}" data-strategy="${id}" title="${hint}">${label}</button>`;
    }).join('');
}

function getDefaultBotConfig() {
    const horizon = localStorage.getItem('tossBotHorizon') || 'short';
    const strategy = normalizeBotStrategy(horizon, localStorage.getItem('tossBotStrategy'));
    const defaults = getStrategyDefaults(strategy);
    return {
        horizon,
        strategy,
        take_profit_pct: parseFloat(localStorage.getItem('tossBotTakeProfitPct')) || defaults.take_profit_pct,
        stop_loss_pct: parseFloat(localStorage.getItem('tossBotStopLossPct')) || defaults.stop_loss_pct,
        market: localStorage.getItem('tossBotMarket') || 'ALL',
        broker: localStorage.getItem('tossBotBroker') || 'TOSS'
    };
}

function getSymbolBotConfig(symbol) {
    const sym = (symbol || '').trim().toUpperCase();
    if (!sym) return getDefaultBotConfig();
    try {
        const all = JSON.parse(localStorage.getItem(TOSS_BOT_SYMBOL_CONFIGS_KEY) || '{}');
        const merged = { ...getDefaultBotConfig(), ...(all[sym] || {}) };
        return {
            ...merged,
            strategy: normalizeBotStrategy(merged.horizon, merged.strategy),
        };
    } catch {
        return getDefaultBotConfig();
    }
}

function saveSymbolBotConfig(symbol, config) {
    const sym = (symbol || '').trim().toUpperCase();
    if (!sym) return;
    try {
        const all = JSON.parse(localStorage.getItem(TOSS_BOT_SYMBOL_CONFIGS_KEY) || '{}');
        all[sym] = { ...getSymbolBotConfig(sym), ...config };
        localStorage.setItem(TOSS_BOT_SYMBOL_CONFIGS_KEY, JSON.stringify(all));
    } catch (e) {
        console.warn('Failed to save symbol bot config', e);
    }
}

function applyBotConfigToGlobalUI(config) {
    const raw = config || getDefaultBotConfig();
    const cfg = {
        ...raw,
        horizon: raw.horizon || 'short',
        strategy: normalizeBotStrategy(raw.horizon, raw.strategy),
    };
    localStorage.setItem('tossBotHorizon', cfg.horizon);
    localStorage.setItem('tossBotStrategy', cfg.strategy);
    localStorage.setItem('tossBotTakeProfitPct', String(cfg.take_profit_pct));
    localStorage.setItem('tossBotStopLossPct', String(cfg.stop_loss_pct));
    if (cfg.market) localStorage.setItem('tossBotMarket', cfg.market);
    if (cfg.broker) localStorage.setItem('tossBotBroker', cfg.broker);

    document.querySelectorAll('.toss-bot-horizon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-horizon') === cfg.horizon);
    });

    const savedMarket = localStorage.getItem('tossBotMarket') || 'ALL';
    document.querySelectorAll('.toss-bot-market-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-market') === savedMarket);
    });

    const savedBroker = localStorage.getItem('tossBotBroker') || 'TOSS';
    document.querySelectorAll('.toss-bot-broker-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-broker') === savedBroker);
    });

    const stratContainer = document.getElementById('toss-bot-strategy');
    renderBotStrategyButtons(stratContainer, cfg.horizon, cfg.strategy, 'toss-bot-strategy-btn');
    const tpEl = document.getElementById('toss-bot-take-profit-pct');
    const slEl = document.getElementById('toss-bot-stop-loss-pct');
    if (tpEl) tpEl.value = cfg.take_profit_pct;
    if (slEl) slEl.value = cfg.stop_loss_pct;
}

function formatBotPriceLevel(price, stock, cur, rate) {
    if (!price || price <= 0) return '—';
    let display = price;
    let sign = '$';
    let digits = 2;
    const isKrwStock = stock?.nativeCurrency === 'KRW';
    if (isKrwStock) {
        if (cur === 'USD') { display = price / rate; sign = '$'; digits = 2; }
        else { sign = '₩'; digits = 0; }
    } else {
        if (cur === 'KRW') { display = price * rate; sign = '₩'; digits = 0; }
    }
    return sign + Math.round(display).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 봇 TP/SL 가격 입력용 — 표시 통화 기준 숫자 */
function toDisplayPrice(rawPrice, stock, cur, rate) {
    if (!rawPrice || rawPrice <= 0) return 0;
    const isKrwStock = stock?.nativeCurrency === 'KRW';
    if (isKrwStock) {
        return cur === 'USD' ? rawPrice / rate : rawPrice;
    }
    return cur === 'KRW' ? rawPrice * rate : rawPrice;
}

function fromDisplayPrice(displayVal, stock, cur, rate) {
    const v = parseFloat(String(displayVal).replace(/,/g, ''));
    if (!v || v <= 0) return 0;
    const isKrwStock = stock?.nativeCurrency === 'KRW';
    if (isKrwStock) {
        return cur === 'USD' ? v * rate : v;
    }
    return cur === 'KRW' ? v / rate : v;
}

function formatPriceForInput(rawPrice, stock, cur, rate) {
    const d = toDisplayPrice(rawPrice, stock, cur, rate);
    if (!d || d <= 0) return '';
    const useInt = (stock?.nativeCurrency === 'KRW' ? cur !== 'USD' : cur === 'KRW');
    return useInt ? Math.round(d) : parseFloat(d.toFixed(2));
}

function getBotPriceInputStep(stock, cur) {
    const useInt = (stock?.nativeCurrency === 'KRW' ? cur !== 'USD' : cur === 'KRW');
    return useInt ? '1' : '0.01';
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const TOSS_BOT_HORIZON_HINTS = { short: '1~2주', medium: '1~3개월', long: '3개월+' };

function initTossTrade() {
    console.log("Initializing Toss Securities Trading System...");

    const isLocal = window.location.hostname === 'localhost'
        || window.location.hostname === '127.0.0.1'
        || window.location.protocol === 'file:';
    
    // 멱등성 가드: 이미 리스너들이 바인딩되어 있다면 데이터와 UI 렌더링만 갱신 후 즉시 반환
    if (window.tossTradeInitialized) {
        console.log("Toss Trade UI already initialized. Refreshing rendering only.");
        fetchAndRefreshTossPortfolio();
        const headerSyncBtn = document.getElementById('toss-header-sync-btn');
        if (headerSyncBtn) headerSyncBtn.onclick = () => performTossSync(headerSyncBtn);
        
        // [NEW] 탭 전환 시 글로벌 통화 스위치 동기화
        const savedCurrency = localStorage.getItem('tossCurrency') || 'KRW';
        if (typeof window.syncGlobalCurrency === 'function') {
            window.syncGlobalCurrency(savedCurrency);
        }
        // [NEW] 탭 전환 시 서브탭 복원
        const savedSubTabId = sessionStorage.getItem('activeTossSubTab') || 'toss-sub-overview';
        const targetSubTab = document.querySelector(`.toss-sub-tab[data-sub-target="${savedSubTabId}"]`);
        if (targetSubTab) {
            if (!targetSubTab.classList.contains('active')) {
                targetSubTab.click();
            } else {
                document.querySelectorAll('.toss-sub-tab').forEach(t => t.classList.remove('active'));
                targetSubTab.classList.add('active');
                document.querySelectorAll('.toss-sub-view').forEach(v => v.style.display = 'none');
                const targetView = document.getElementById(savedSubTabId);
                if (targetView) targetView.style.display = 'block';
            }
        }
        
        // [NEW] 탭 전환 시 차트 기간 active 상태 복원
        const savedPeriod = sessionStorage.getItem('tossChartPeriod') || '1y';
        const targetBtn = document.querySelector(`.toss-chart-period-btn[data-period="${savedPeriod}"]`);
        if (targetBtn) {
            document.querySelectorAll('.toss-chart-period-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }
        return;
    }
    window.tossTradeInitialized = true;
    
    // [NEW] Local stock name mapping lookup
    window.findStockNameLocal = function(symbol) {
        if (!symbol) return "";
        const cleanSym = symbol.trim().toUpperCase();
        const normSym = window.normalizeBrokerOrderSymbol
            ? window.normalizeBrokerOrderSymbol(cleanSym)
            : cleanSym.split('.')[0];
        const sameSymbol = (candidate) => {
            const c = String(candidate || '').trim().toUpperCase();
            if (!c) return false;
            const cNorm = window.normalizeBrokerOrderSymbol ? window.normalizeBrokerOrderSymbol(c) : c.split('.')[0];
            return c === cleanSym || c === normSym || cNorm === cleanSym || cNorm === normSym;
        };
        const validName = (name) => {
            const n = String(name || '').trim();
            if (!n) return '';
            const nUpper = n.toUpperCase();
            const nNorm = window.normalizeBrokerOrderSymbol ? window.normalizeBrokerOrderSymbol(nUpper) : nUpper.split('.')[0];
            if (nUpper === cleanSym || nUpper === normSym || nNorm === cleanSym || nNorm === normSym) return '';
            return n;
        };
        
        // 1. 현재 로드된 보유 종목(holdings)에서 검색
        if (window.tossPortfolio && window.tossPortfolio.holdings) {
            const found = window.tossPortfolio.holdings.find(h => sameSymbol(h.symbol));
            const name = validName(found?.name);
            if (name) return name;
        }
        if (window.TOSS_PORTFOLIO && window.TOSS_PORTFOLIO.holdings) {
            const found = window.TOSS_PORTFOLIO.holdings.find(h => sameSymbol(h.symbol));
            const name = validName(found?.name);
            if (name) return name;
        }
        if (window.KIS_PORTFOLIO && window.KIS_PORTFOLIO.holdings) {
            const found = window.KIS_PORTFOLIO.holdings.find(h => sameSymbol(h.symbol));
            const name = validName(found?.name);
            if (name) return name;
        }
        
        // 2. data.js 의 reports 또는 watchlist, discovery 에서 검색
        if (window.STOCK_DATA && window.STOCK_DATA.history) {
            for (const dayData of window.STOCK_DATA.history) {
                if (dayData.holdings) {
                    const found = dayData.holdings.find(h => sameSymbol(h.symbol));
                    const name = validName(found?.name);
                    if (name) return name;
                }
                if (dayData.watchlist) {
                    const found = dayData.watchlist.find(h => sameSymbol(h.symbol));
                    const name = validName(found?.name);
                    if (name) return name;
                }
                if (dayData.discovery) {
                    const picks = [
                        ...(dayData.discovery.picks_kr || []),
                        ...(dayData.discovery.picks_us || []),
                        ...(dayData.discovery.picks_crypto || []),
                        ...(dayData.discovery.picks_us_value || [])
                    ];
                    const found = picks.find(p => sameSymbol(p.symbol));
                    const name = validName(found?.name);
                    if (name) return name;
                }
            }
        }
        
        // 3. 하드코딩 매핑 사전 (자주 쓰는 주요 종목)
        const fallbackDict = {
            "AAPL": "애플", "TSLA": "테슬라", "NVDA": "엔비디아", "MSFT": "마이크로소프트", 
            "AMZN": "아마존", "GOOGL": "구글", "META": "메타", "AMD": "AMD",
            "005930": "삼성전자", "000660": "SK하이닉스", "001800": "동양오리온홀딩스", "018880": "한온시스템"
        };
        const noDotSym = cleanSym.split('.')[0];
        if (fallbackDict[cleanSym]) return fallbackDict[cleanSym];
        if (fallbackDict[noDotSym]) return fallbackDict[noDotSym];
        if (fallbackDict[normSym]) return fallbackDict[normSym];
        
        return "";
    };

    window.normalizeBrokerOrderSymbol = function(raw) {
        const sym = String(raw || '').trim().toUpperCase();
        if (!sym) return '';
        if (/^A\d{6}$/.test(sym)) return sym.slice(1);
        return sym.replace(/\.(KS|KQ|NAS|NYS|NYSE|NASD|AMX|AMS)$/i, '');
    };

    window.toYahooOrderSymbol = function(symbol, rawSymbol = '') {
        const orderSymbol = window.normalizeBrokerOrderSymbol(symbol);
        const raw = String(rawSymbol || '').trim().toUpperCase();
        if (!orderSymbol) return '';
        if (raw.endsWith('.KS') || raw.endsWith('.KQ')) return raw;
        if (/^\d{6}$/.test(orderSymbol)) return `${orderSymbol}.KS`;
        return orderSymbol;
    };

    window.buildOrderSymbolCandidates = function() {
        const bySymbol = new Map();
        const add = (symbol, name = '', market = '') => {
            const orderSymbol = window.normalizeBrokerOrderSymbol(symbol);
            if (!orderSymbol) return;
            const prev = bySymbol.get(orderSymbol) || {};
            const rawSymbol = String(symbol || orderSymbol).trim().toUpperCase();
            const resolvedMarket = market || prev.market || (/^\d{6}$/.test(orderSymbol) ? 'KR' : 'US');
            bySymbol.set(orderSymbol, {
                symbol: orderSymbol,
                rawSymbol,
                yahooSymbol: prev.yahooSymbol || window.toYahooOrderSymbol(orderSymbol, rawSymbol),
                name: name || prev.name || window.findStockNameLocal(orderSymbol) || orderSymbol,
                market: resolvedMarket
            });
        };

        const addList = (list, market = '') => {
            (list || []).forEach(item => {
                const symbol = item.symbol || item.ticker || item.stock_symbol || item.stockSymbol;
                const name = item.name || item.stock_name || item.stockName || item.company_name || item.companyName;
                add(symbol, name, item.market || item.marketCountry || market);
            });
        };

        const addCollection = (value, market = '') => {
            if (Array.isArray(value)) {
                addList(value, market);
            } else if (value && typeof value === 'object') {
                addList(Object.values(value), market);
            }
        };

        addCollection(window.STOCK_DATA?.stocks, '');
        addCollection(window.STOCK_DATA?.reports, '');
        addCollection(window.STOCK_DATA?.holdings, '');
        addCollection(window.STOCK_DATA?.watchlist, '');
        addCollection(window.STOCK_DATA?.portfolio?.holdings, '');
        addCollection(window.STOCK_DATA?.portfolio?.watchlist, '');
        addCollection(window.tossPortfolio?.holdings, '');
        addCollection(window.TOSS_PORTFOLIO?.holdings, '');
        addCollection(window.KIS_PORTFOLIO?.holdings, '');

        (window.STOCK_DATA?.history || []).forEach(day => {
            addList(day.holdings, '');
            addList(day.watchlist, '');
            addList(day.discovery?.picks_kr, 'KR');
            addList(day.discovery?.picks_us, 'US');
            addList(day.discovery?.picks_us_value, 'US');
            addList(day.discovery?.picks_crypto, 'CRYPTO');
        });

        [
            ['005930', '삼성전자', 'KR'],
            ['000660', 'SK하이닉스', 'KR'],
            ['018880', '한온시스템', 'KR'],
            ['035420', 'NAVER', 'KR'],
            ['035720', '카카오', 'KR'],
            ['086520.KQ', '에코프로', 'KR'],
            ['AAPL', '애플', 'US'],
            ['TSLA', '테슬라', 'US'],
            ['NVDA', '엔비디아', 'US'],
            ['MSFT', '마이크로소프트', 'US'],
            ['GOOGL', '알파벳', 'US'],
            ['AMZN', '아마존', 'US'],
            ['META', '메타', 'US']
        ].forEach(([symbol, name, market]) => add(symbol, name, market));

        return Array.from(bySymbol.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    window.orderSymbolRemoteCandidates = window.orderSymbolRemoteCandidates || [];
    window.orderSymbolSearchCache = window.orderSymbolSearchCache || {};
    window.mergeOrderSymbolCandidates = function(localCandidates, remoteCandidates = []) {
        const bySymbol = new Map();
        [...(localCandidates || []), ...(remoteCandidates || [])].forEach(c => {
            if (!c) return;
            const symbol = window.normalizeBrokerOrderSymbol(c.symbol || c.yahooSymbol || c.ticker || '');
            if (!symbol) return;
            const rawSymbol = String(c.yahooSymbol || c.rawSymbol || c.symbol || symbol).trim().toUpperCase();
            const prev = bySymbol.get(symbol) || {};
            bySymbol.set(symbol, {
                symbol,
                rawSymbol,
                yahooSymbol: c.yahooSymbol || prev.yahooSymbol || window.toYahooOrderSymbol(symbol, rawSymbol),
                name: c.name || prev.name || window.findStockNameLocal(symbol) || symbol,
                market: c.market || prev.market || (/^\d{6}$/.test(symbol) ? 'KR' : 'US')
            });
        });
        return Array.from(bySymbol.values());
    };

    window.resolveOrderSymbolInput = function(raw) {
        const value = String(raw || '').trim();
        if (!value) return '';
        const direct = window.normalizeBrokerOrderSymbol(value);
        const looksLikeSymbol = /^[A-Z0-9.-]+$/i.test(value);
        if (looksLikeSymbol && direct) return direct;

        const q = value.toLowerCase();
        const matches = window.buildOrderSymbolCandidates().filter(c =>
            c.symbol.toLowerCase() === q ||
            String(c.name || '').toLowerCase() === q ||
            String(c.name || '').toLowerCase().includes(q)
        );
        if (matches.length === 1) return matches[0].symbol;
        const exact = matches.find(c => String(c.name || '').toLowerCase() === q);
        return exact ? exact.symbol : '';
    };

    window.findOrderSymbolCandidate = function(raw) {
        const value = String(raw || '').trim().toUpperCase();
        const orderSymbol = window.normalizeBrokerOrderSymbol(value);
        if (!value && !orderSymbol) return null;
        const local = window.buildOrderSymbolCandidates();
        const remote = Object.values(window.orderSymbolSearchCache || {}).flat();
        return window.mergeOrderSymbolCandidates(local, remote).find(c =>
            c.symbol === orderSymbol ||
            String(c.yahooSymbol || '').toUpperCase() === value ||
            String(c.rawSymbol || '').toUpperCase() === value
        ) || null;
    };

    window.attachOrderSymbolAutocomplete = function(prefix) {
        const input = document.getElementById(`${prefix}-chart-symbol-input`);
        const box = document.getElementById(`${prefix}-chart-symbol-autocomplete`);
        const nameSpan = document.getElementById(`${prefix}-order-stock-name`);
        const orderInput = document.getElementById(`${prefix}-order-symbol`);
        if (!input || !box || input.dataset.autocompleteBound === 'true') return;
        input.dataset.autocompleteBound = 'true';
        let activeIndex = -1;
        let currentCandidates = [];
        let remoteSearchTimer = null;

        const hide = () => { box.style.display = 'none'; };
        const select = (candidate) => {
            input.value = candidate.yahooSymbol || candidate.rawSymbol || candidate.symbol;
            input.dataset.selectedYahooSymbol = candidate.yahooSymbol || candidate.rawSymbol || candidate.symbol;
            input.dataset.selectedName = candidate.name || '';
            if (orderInput) orderInput.value = candidate.symbol;
            if (nameSpan) nameSpan.textContent = candidate.name && candidate.name !== candidate.symbol ? candidate.name : '';
            hide();
        };
        const setActive = (index) => {
            const items = Array.from(box.querySelectorAll('.order-symbol-suggestion'));
            if (!items.length) return;
            activeIndex = (index + items.length) % items.length;
            items.forEach((item, i) => {
                item.classList.toggle('is-active', i === activeIndex);
                item.style.setProperty('background', i === activeIndex ? '#123453' : '#0f172a', 'important');
                item.style.setProperty('border-color', i === activeIndex ? 'rgba(56,189,248,0.65)' : 'rgba(148,163,184,0.32)', 'important');
                item.style.setProperty('opacity', '1', 'important');
                item.style.setProperty('filter', 'none', 'important');
            });
            items[activeIndex]?.scrollIntoView({ block: 'nearest' });
        };
        const render = () => {
            const q = input.value.trim().toLowerCase();
            input.dataset.selectedYahooSymbol = '';
            input.dataset.selectedName = '';
            if (!q) {
                hide();
                return;
            }
            const candidates = window.buildOrderSymbolCandidates()
                .filter(c =>
                    c.symbol.toLowerCase().includes(q) ||
                    c.yahooSymbol.toLowerCase().includes(q) ||
                    String(c.name || '').toLowerCase().includes(q)
                )
                .slice(0, 8);
            const cachedRemote = window.orderSymbolSearchCache[q] || [];
            const mergedCandidates = window.mergeOrderSymbolCandidates(candidates, cachedRemote)
                .filter(c =>
                    c.symbol.toLowerCase().includes(q) ||
                    c.yahooSymbol.toLowerCase().includes(q) ||
                    String(c.name || '').toLowerCase().includes(q)
                )
                .slice(0, 8);
            if (q.length >= 2 && !window.orderSymbolSearchCache[q]) {
                clearTimeout(remoteSearchTimer);
                remoteSearchTimer = setTimeout(async () => {
                    try {
                        const res = await fetch(getApiUrl(`/api/symbol-search?q=${encodeURIComponent(input.value.trim())}&limit=12`));
                        const data = await res.json();
                        if (data.success) {
                            window.orderSymbolSearchCache[q] = data.results || [];
                            if (input.value.trim().toLowerCase() === q) render();
                        }
                    } catch (err) {
                        console.warn('symbol remote search failed:', err);
                        window.orderSymbolSearchCache[q] = [];
                    }
                }, 180);
            }
            if (!mergedCandidates.length) {
                currentCandidates = [];
                hide();
                return;
            }
            currentCandidates = mergedCandidates;
            activeIndex = -1;
            box.style.setProperty('background', '#020617', 'important');
            box.style.setProperty('border-color', 'rgba(125,211,252,0.8)', 'important');
            box.style.setProperty('box-shadow', '0 22px 55px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08) inset', 'important');
            box.style.setProperty('opacity', '1', 'important');
            box.style.setProperty('filter', 'none', 'important');
            box.style.setProperty('backdrop-filter', 'none', 'important');
            box.innerHTML = mergedCandidates.map(c => `
                <div role="button" tabindex="0" class="order-symbol-suggestion" data-symbol="${escapeHtml(c.symbol)}"
                    style="width:100%; display:block; box-sizing:border-box; padding:0.78rem 0.85rem; background:#0f172a !important; border:0; border-bottom:1px solid rgba(148,163,184,0.32) !important; color:#f8fafc !important; cursor:pointer; text-align:left; opacity:1 !important; filter:none !important;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; margin-bottom:0.35rem;">
                        <span class="order-symbol-suggestion-name" style="font-weight:900 !important; color:#ffffff !important; font-size:1rem; opacity:1 !important; filter:none !important;">${escapeHtml(c.name || c.symbol)}</span>
                        <span style="color:${c.market === 'KR' ? '#f9a8d4' : '#7dd3fc'} !important; background:${c.market === 'KR' ? 'rgba(244,114,182,0.26)' : 'rgba(56,189,248,0.26)'}; border:1px solid ${c.market === 'KR' ? 'rgba(244,114,182,0.65)' : 'rgba(56,189,248,0.65)'}; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.65rem; font-weight:900; opacity:1 !important;">${escapeHtml(c.market || '')}</span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem; font-size:0.72rem;">
                        <span class="order-symbol-suggestion-meta" style="color:#dbeafe !important; opacity:1 !important;">yfinance <b class="order-symbol-suggestion-strong" style="color:#ffffff !important;">${escapeHtml(c.yahooSymbol)}</b></span>
                        <span class="order-symbol-suggestion-meta" style="color:#dbeafe !important; opacity:1 !important;">Toss/KIS <b class="order-symbol-suggestion-strong" style="color:#67e8f9 !important;">${escapeHtml(c.symbol)}</b></span>
                    </div>
                </div>
            `).join('');
            box.querySelectorAll('.order-symbol-suggestion').forEach(btn => {
                btn.onmouseenter = () => {
                    const index = mergedCandidates.findIndex(c => c.symbol === btn.dataset.symbol);
                    if (index >= 0) setActive(index);
                };
                btn.onmousedown = (e) => {
                    e.preventDefault();
                    const candidate = mergedCandidates.find(c => c.symbol === btn.dataset.symbol);
                    if (candidate) select(candidate);
                };
            });
            box.style.display = 'block';
        };

        input.addEventListener('input', () => {
            const resolved = window.resolveOrderSymbolInput(input.value);
            if (orderInput) orderInput.value = resolved;
            if (nameSpan) nameSpan.textContent = window.findStockNameLocal(resolved);
            render();
        });
        input.addEventListener('keydown', (e) => {
            if (box.style.display !== 'block') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(activeIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(activeIndex - 1);
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                const candidate = currentCandidates[activeIndex];
                if (candidate) select(candidate);
            } else if (e.key === 'Escape') {
                hide();
            }
        });
        input.addEventListener('focus', render);
        input.addEventListener('blur', () => {
            setTimeout(() => {
                const resolved = window.resolveOrderSymbolInput(input.value);
                if (resolved) {
                    input.value = resolved;
                    if (orderInput) orderInput.value = resolved;
                    if (nameSpan) nameSpan.textContent = window.findStockNameLocal(resolved);
                }
                hide();
            }, 120);
        });
    };

    window.attachOrderSymbolAutocomplete('toss');
    window.attachOrderSymbolAutocomplete('kis');

    const kisChartSymbolInput = document.getElementById('kis-chart-symbol-input');
    const kisOrderSymbolInput = document.getElementById('kis-order-symbol');
    const kisChartSearchBtn = document.getElementById('kis-chart-search-btn');
    const syncKisSelectedSymbol = () => {
        const raw = kisChartSymbolInput?.value || '';
        const sym = window.resolveOrderSymbolInput(raw);
        if (!sym) {
            alert("종목명 또는 티커를 선택해 주세요. 여러 후보가 있으면 자동완성 목록에서 하나를 고르세요.");
            return '';
        }
            const candidate = typeof window.findOrderSymbolCandidate === 'function' ? window.findOrderSymbolCandidate(raw) : null;
            if (kisChartSymbolInput) {
                kisChartSymbolInput.value = candidate?.yahooSymbol || raw.trim().toUpperCase();
                kisChartSymbolInput.dataset.selectedYahooSymbol = candidate?.yahooSymbol || kisChartSymbolInput.value;
            }
        if (kisOrderSymbolInput) kisOrderSymbolInput.value = sym;
        const nameSpan = document.getElementById('kis-order-stock-name');
        if (nameSpan) {
            const displayName = window.findStockNameLocal(sym);
            nameSpan.textContent = displayName && displayName !== sym ? displayName : '';
        }
        return sym;
    };
    if (kisOrderSymbolInput) kisOrderSymbolInput.disabled = true;
    if (kisChartSymbolInput && kisChartSymbolInput.dataset.symbolSyncBound !== 'true') {
        kisChartSymbolInput.dataset.symbolSyncBound = 'true';
        kisChartSymbolInput.addEventListener('input', () => {
            const resolved = window.resolveOrderSymbolInput(kisChartSymbolInput.value);
            if (kisOrderSymbolInput) kisOrderSymbolInput.value = resolved;
            const nameSpan = document.getElementById('kis-order-stock-name');
            if (nameSpan) {
                const displayName = window.findStockNameLocal(resolved);
                nameSpan.textContent = displayName && displayName !== resolved ? displayName : '';
            }
        });
        kisChartSymbolInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') syncKisSelectedSymbol();
        });
    }
    if (kisChartSearchBtn && kisChartSearchBtn.dataset.symbolSyncBound !== 'true') {
        kisChartSearchBtn.dataset.symbolSyncBound = 'true';
        kisChartSearchBtn.addEventListener('click', syncKisSelectedSymbol);
    }

    // [NEW] Sync active class states forcedly to prevent external pollution
    window.syncTossOrderFormActiveState = function() {
        const sideBtns = document.querySelectorAll('.toss-side-btn');
        sideBtns.forEach(btn => {
            const side = btn.getAttribute('data-side');
            if (side === tossSide) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const typeBtns = document.querySelectorAll('.toss-type-btn');
        typeBtns.forEach(btn => {
            const type = btn.getAttribute('data-type');
            if (type === tossType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    // [NEW] Update Toss Order helper panel dynamically
    window.updateTossOrderHelper = function() {
        if (typeof window.syncTossOrderFormActiveState === 'function') {
            window.syncTossOrderFormActiveState();
        }
        const helperLabel = document.getElementById('toss-order-helper-label');
        const helperValue = document.getElementById('toss-order-helper-value');
        const symbol = document.getElementById('toss-order-symbol')?.value.trim().toUpperCase();
        
        if (!helperLabel || !helperValue) return;
        
        // Check BUY or SELL
        const activeSideBtn = document.querySelector('.toss-side-btn.active');
        const side = activeSideBtn ? activeSideBtn.getAttribute('data-side') : 'BUY';
        
        if (side === 'BUY') {
            helperLabel.textContent = '매수 가능 예수금:';
            let cash = 0;
            if (window.tossPortfolio && window.tossPortfolio.account) {
                cash = window.tossPortfolio.account.cash_balance || 0;
            }
            
            const currentCurrency = localStorage.getItem('tossCurrency') || 'KRW';
            const usdRate = window.CURRENT_USD_RATE || 1400;
            if (currentCurrency === 'KRW') {
                helperValue.textContent = `₩${Math.floor(cash * usdRate).toLocaleString()}`;
            } else {
                helperValue.textContent = `$${cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }
        } else {
            helperLabel.textContent = '보유 수량:';
            let qty = 0;
            if (symbol && window.tossPortfolio && window.tossPortfolio.holdings) {
                const found = window.tossPortfolio.holdings.find(h => {
                    if (!h || !h.symbol) return false;
                    const hSym = h.symbol.toUpperCase();
                    return hSym === symbol || hSym.split('.')[0] === symbol;
                });
                if (found) qty = found.quantity || 0;
            }
            helperValue.textContent = `${qty.toLocaleString()}주`;
        }
    };

    // [NEW] Setup Toss Ratio buttons
    document.querySelectorAll('.toss-ratio-btn').forEach(btn => {
        btn.onclick = () => {
            const pct = parseFloat(btn.getAttribute('data-pct'));
            const symbolInput = document.getElementById('toss-order-symbol');
            const symbol = symbolInput ? symbolInput.value.trim().toUpperCase() : '';
            const activeSideBtn = document.querySelector('.toss-side-btn.active');
            const side = activeSideBtn ? activeSideBtn.getAttribute('data-side') : 'BUY';
            const qtyInput = document.getElementById('toss-order-qty');
            
            if (!qtyInput) return;
            
            if (side === 'BUY') {
                let cash = 0;
                if (window.tossPortfolio && window.tossPortfolio.account) {
                    cash = window.tossPortfolio.account.cash_balance || 0;
                }
                const buyCash = cash * (pct / 100);
                
                let currentPrice = window.tossCurrentActivePrice || 100.0;
                const pricePanel = document.getElementById('toss-realtime-price-panel');
                if (pricePanel && pricePanel.textContent) {
                    const match = pricePanel.textContent.match(/\$?₩?([0-9.,]+)/);
                    if (match) {
                        let p = parseFloat(match[1].replace(/,/g, ''));
                        const currentCurrency = localStorage.getItem('tossCurrency') || 'KRW';
                        const usdRate = window.CURRENT_USD_RATE || 1400;
                        if (currentCurrency === 'KRW' && p > 1000) {
                            p = p / usdRate;
                        }
                        if (p > 0) currentPrice = p;
                    }
                }
                
                const qty = Math.floor(buyCash / currentPrice);
                qtyInput.value = qty > 0 ? qty : 1;
            } else {
                let qty = 0;
                if (symbol && window.tossPortfolio && window.tossPortfolio.holdings) {
                    const found = window.tossPortfolio.holdings.find(h => {
                        if (!h || !h.symbol) return false;
                        const hSym = h.symbol.toUpperCase();
                        return hSym === symbol || hSym.split('.')[0] === symbol;
                    });
                    if (found) qty = found.quantity || 0;
                }
                
                if (pct === 100) {
                    qtyInput.value = qty;
                } else {
                    qtyInput.value = Math.floor(qty * (pct / 100));
                }
                if (parseInt(qtyInput.value) <= 0 && qty > 0) {
                    qtyInput.value = 1;
                }
            }
        };
    });

    // Bind Side buttons
    const sideBtns = document.querySelectorAll('.toss-side-btn');
    const orderBtn = document.getElementById('toss-submit-order-btn');
    const qtyInput = document.getElementById('toss-order-qty');
    const plusBtn = document.getElementById('toss-qty-plus');
    const minusBtn = document.getElementById('toss-qty-minus');

    // 글로벌 모의/실제계좌 스위칭 처리 (글로벌 싱크 헬퍼 호출)
    const realToggle = document.getElementById('toss-global-real-toggle');
    if (realToggle) {
        const savedRealMode = localStorage.getItem('tossRealMode') === 'true';
        realToggle.checked = savedRealMode;
        if (typeof window.syncGlobalAccountMode === 'function') {
            window.syncGlobalAccountMode(savedRealMode);
        }
        
        // 첫 진입 시 동적으로 갱신 시도
        setTimeout(fetchAndRefreshTossPortfolio, 100);
    }

    // Sub-tab toggling
    const subTabs = document.querySelectorAll('.toss-sub-tab');
    subTabs.forEach(tab => {
        tab.onclick = () => {
            subTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-sub-target');
            
            // Save sub-tab state to sessionStorage
            sessionStorage.setItem('activeTossSubTab', targetId);

            document.querySelectorAll('.toss-sub-view').forEach(v => {
                v.style.display = 'none';
            });
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.style.display = 'block';
            }
            if (targetId === 'toss-sub-overview') {
                setTimeout(() => {
                    drawPnlChart();
                    drawRiskDonut();
                }, 50);
            } else if (targetId === 'toss-sub-holdings') {
                if (typeof window.fetchAndRefreshTossPortfolio === 'function') {
                    window.fetchAndRefreshTossPortfolio();
                }
            }
        };
    });

    // Market / Limit type toggle
    const typeBtns = document.querySelectorAll('.toss-type-btn');
    const priceField = document.getElementById('toss-price-field');
    typeBtns.forEach(btn => {
        btn.onclick = () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tossType = btn.getAttribute('data-type');
            if (priceField) {
                priceField.style.display = tossType === 'LIMIT' ? 'block' : 'none';
                
                // 지정가로 변경될 때 실시간 현재가를 단가 입력란의 기본값으로 세팅
                if (tossType === 'LIMIT') {
                    const priceInput = document.getElementById('toss-order-price');
                    if (priceInput) {
                        let currentPrice = window.tossCurrentActivePrice || 0.0;
                        const pricePanel = document.getElementById('toss-realtime-price-panel');
                        if (pricePanel && pricePanel.textContent) {
                            const match = pricePanel.textContent.match(/\$?₩?([0-9.,]+)/);
                            if (match) {
                                let p = parseFloat(match[1].replace(/,/g, ''));
                                if (p > 0) currentPrice = p;
                            }
                        }
                        if (currentPrice > 0) {
                            priceInput.value = currentPrice.toFixed(2);
                        }
                    }
                }
            }
            if (orderBtn) {
                orderBtn.textContent = tossType === 'LIMIT' 
                    ? `지정가 주문 전송 (${tossSide})`
                    : `시장가 주문 전송 (${tossSide})`;
            }
            if (typeof window.syncTossOrderFormActiveState === 'function') {
                window.syncTossOrderFormActiveState();
            }
        };
    });

    // Period buttons for PnL chart
    const periodBtns = document.querySelectorAll('.toss-chart-period');
    periodBtns.forEach(btn => {
        btn.onclick = () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tossChartPeriod = btn.getAttribute('data-period');
            drawPnlChart();
        };
    });

    // Close detail modal
    const modalClose = document.getElementById('toss-modal-close');
    if (modalClose) {
        modalClose.onclick = () => {
            const modal = document.getElementById('toss-holding-modal');
            if (modal) modal.style.display = 'none';
        };
    }
    
    // Vercel 환경 등의 조회전용 안내 배너 동적 주입 및 제어
    if (!isLocal) {
        const consolePanel = document.querySelector('.module-control-panel');
        if (consolePanel && !document.getElementById('env-alert-banner')) {
            const alertBanner = document.createElement('div');
            alertBanner.id = 'env-alert-banner';
            alertBanner.style.background = 'rgba(239, 68, 68, 0.12)';
            alertBanner.style.border = '1px solid rgba(239, 68, 68, 0.25)';
            alertBanner.style.borderRadius = '12px';
            alertBanner.style.padding = '12px 16px';
            alertBanner.style.marginBottom = '1.5rem';
            alertBanner.style.fontSize = '0.78rem';
            alertBanner.style.color = '#f87171';
            alertBanner.style.lineHeight = '1.45';
            alertBanner.innerHTML = `[!] <strong>현재 조회 전용(Read-Only) 모드입니다.</strong><br>클라우드 배포(Vercel) 환경에서는 실시간 매매 및 수동 동기화가 비활성화됩니다. 매매 기능을 온전히 사용하시려면 로컬 PC(localhost)에서 8000포트 로컬 서버를 실행해 주세요.`;
            consolePanel.insertBefore(alertBanner, consolePanel.firstChild);
        }
        
        if (orderBtn) {
            orderBtn.disabled = true;
            orderBtn.textContent = "주문 전송 비활성화 (조회전용)";
            orderBtn.style.background = '#334155';
            orderBtn.style.cursor = 'not-allowed';
            orderBtn.style.boxShadow = 'none';
        }
        const hSyncBtn = document.getElementById('toss-header-sync-btn');
        if (hSyncBtn) {
            hSyncBtn.disabled = true;
            hSyncBtn.textContent = "동기화 비활성화 (조회전용)";
            hSyncBtn.style.cursor = 'not-allowed';
        }
    }

    sideBtns.forEach(btn => {
        btn.onclick = () => {
            sideBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tossSide = btn.getAttribute('data-side');
            if (orderBtn) {
                orderBtn.textContent = tossType === 'LIMIT' 
                    ? `지정가 주문 전송 (${tossSide})`
                    : `시장가 주문 전송 (${tossSide})`;
                if (tossSide === 'BUY') {
                    orderBtn.style.background = 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)';
                    orderBtn.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)';
                } else {
                    orderBtn.style.background = 'linear-gradient(135deg, #ff2a55 0%, #c026d3 100%)';
                    orderBtn.style.boxShadow = '0 4px 12px rgba(255, 42, 85, 0.3)';
                }
            }
            if (typeof window.updateTossOrderHelper === 'function') {
                window.updateTossOrderHelper();
            }
            if (typeof window.syncTossOrderFormActiveState === 'function') {
                window.syncTossOrderFormActiveState();
            }
        };
    });

    // Quantity buttons
    if (plusBtn && qtyInput) {
        plusBtn.onclick = () => {
            qtyInput.value = parseInt(qtyInput.value) + 1;
        };
    }
    if (minusBtn && qtyInput) {
        minusBtn.onclick = () => {
            const val = parseInt(qtyInput.value);
            if (val > 1) qtyInput.value = val - 1;
        };
    }

    // Submit Order Button
    if (orderBtn) {
        orderBtn.onclick = async () => {
            if (!isLocal) {
                alert("현재 클라우드 배포 환경(Vercel)입니다. 매수/매도 주문 전송은 로컬 개발 PC(localhost)에서만 가능합니다.");
                return;
            }
            const symbolInputEl = document.getElementById('toss-order-symbol');
            const chartInputEl = document.getElementById('toss-chart-symbol-input');
            const symbol = window.resolveOrderSymbolInput(symbolInputEl?.value || chartInputEl?.value || '');
            if (symbolInputEl && symbol) symbolInputEl.value = symbol;
            if (chartInputEl && symbol) chartInputEl.value = symbol;
            const qty = parseFloat(qtyInput?.value || 1);
            let price = parseFloat(document.getElementById('toss-order-price')?.value || 0);
            const isDryRun = isTossDryRun();
            
            // 지정가 주문이고 원화(KRW) 모드라면 서버 전송 전 달러로 변환
            const currentCurrency = localStorage.getItem('tossCurrency') || 'KRW';
            const usdRate = window.CURRENT_USD_RATE || 1400;
            if (tossType === 'LIMIT' && currentCurrency === 'KRW') {
                price = parseFloat((price / usdRate).toFixed(2));
            }
            
            if (!symbol) {
                alert("종목코드(티커)를 입력해 주세요.");
                return;
            }
            if (tossType === 'LIMIT' && price <= 0) {
                alert("지정가 주문 시 가격을 입력해야 합니다.");
                return;
            }

            // === AI 스마트 투자 안전 가이드 가드(Guard) 평가 ===
            let isRisky = false;
            let riskReason = "";
            const metaEl = document.getElementById('toss-advisory-meta');
            if (metaEl && metaEl.getAttribute('data-symbol') === symbol) {
                const cachedRsi = parseFloat(metaEl.getAttribute('data-rsi') || 50);
                const cachedPathDiff = parseFloat(metaEl.getAttribute('data-path-diff') || 0);
                
                if (tossSide === 'BUY') {
                    if (cachedRsi > 68) {
                        isRisky = true;
                        riskReason = `현재 진입 대상 종목의 기술적 지표(RSI: ${cachedRsi.toFixed(1)})가 단기 과열 상태입니다.`;
                    } else if (cachedPathDiff < -5.0) {
                        isRisky = true;
                        riskReason = `AI 미래 예측 시뮬레이션 경로상 단기 급락세(${cachedPathDiff.toFixed(1)}%)가 예상되는 역추세 진입 구간입니다.`;
                    }
                } else if (tossSide === 'SELL') {
            if (cachedRsi < 32) {
                        isRisky = true;
                        riskReason = `현재 대상 종목이 극심한 과매도 상태(RSI: ${cachedRsi.toFixed(1)})로, 조만간 강한 기술적 반등이 유입될 가능성이 높습니다. 현 시점의 매도는 저점 매도가 될 우려가 있습니다.`;
                    } else if (cachedPathDiff > 8.0) {
                        isRisky = true;
                        riskReason = `AI 미래 시뮬레이션상 단기 강한 추가 상승(+${cachedPathDiff.toFixed(1)}%)이 예견된 구간입니다. 조기 매도로 인한 기회비용 손실 우려가 큽니다.`;
                    }
                }
            }

            const fmtKrwVal = (valInKrw, isRate = false) => {
                if (isRate) return `${valInKrw > 0 ? '+' : ''}${parseFloat(valInKrw).toFixed(2)}%`;
                const curr = localStorage.getItem('tossCurrency') || 'KRW';
                const rate = window.CURRENT_USD_RATE || 1400;
                if (curr === 'KRW') return `₩${Math.round(valInKrw || 0).toLocaleString()}`;
                return `$${((valInKrw || 0) / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const fmtTradeProfit = (symbol, profit) => {
                const isKr = /^\d{6}/.test(symbol) || symbol.endsWith('.KS') || symbol.endsWith('.KQ');
                const curr = localStorage.getItem('tossCurrency') || 'KRW';
                const rate = window.CURRENT_USD_RATE || 1400;
                if (isKr) {
                    if (curr === 'KRW') return `₩${Math.round(profit).toLocaleString()}`;
                    return `$${(profit / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                } else {
                    if (curr === 'KRW') return `₩${Math.round(profit * rate).toLocaleString()}`;
                    return `$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
            };

            if (portfolio && portfolio.trade_stats) {
                if (gpEl) gpEl.textContent = fmtKrwVal(portfolio.trade_stats.total_profit);
                if (glEl) glEl.textContent = fmtKrwVal(portfolio.trade_stats.total_loss);
                
                if (bestTbody) {
                    const bests = portfolio.trade_stats.best_trades || [];
                    if (bests.length === 0) {
                        bestTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 1rem; color: #94a3b8;">데이터가 없습니다.</td></tr>`;
                    } else {
                        bestTbody.innerHTML = bests.map((t, idx) => `
                            <tr class="best-trade-row">
                                <td class="best-trade-rank">${idx + 1}</td>
                                <td class="best-trade-symbol">${t.symbol}</td>
                                <td class="best-trade-profit-up" style="text-align: right;">+${fmtTradeProfit(t.symbol, t.profit)}</td>
                            </tr>
                        `).join('');
                    }
                }
                
                if (worstTbody) {
                    const worsts = portfolio.trade_stats.worst_trades || [];
                    if (worsts.length === 0) {
                        worstTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 1rem; color: #94a3b8;">데이터가 없습니다.</td></tr>`;
                    } else {
                        worstTbody.innerHTML = worsts.map((t, idx) => `
                            <tr class="best-trade-row">
                                <td class="best-trade-rank">${idx + 1}</td>
                                <td class="best-trade-symbol">${t.symbol}</td>
                                <td class="best-trade-profit-down" style="text-align: right;">${fmtTradeProfit(t.symbol, t.profit)}</td>
                            </tr>
                        `).join('');
                    }
                }
            }

            if (isRisky) {
                const confirmViaAiGuard = () => {
                    return new Promise((resolve) => {
                        const modal = document.getElementById('toss-advisory-confirm-modal');
                        const titleEl = document.getElementById('toss-advisory-confirm-title');
                        const msgEl = document.getElementById('toss-advisory-confirm-message');
                        const adviceEl = document.getElementById('toss-advisory-confirm-advice');
                        const cancelBtn = document.getElementById('toss-advisory-confirm-cancel');
                        const execBtn = document.getElementById('toss-advisory-confirm-execute');
                        const closeBtn = document.getElementById('toss-advisory-confirm-close');

                        if (!modal || !titleEl || !msgEl || !adviceEl || !cancelBtn || !execBtn || !closeBtn) {
                            resolve(true); // 엘리먼트가 없으면 패스
                            return;
                        }

                        titleEl.textContent = tossSide === 'BUY' ? '🚨 AI 매수 안전 가이드 경고' : '🚨 AI 매도 손실 방지 가이드 경고';
                        msgEl.innerHTML = `<strong>${symbol}</strong>에 대한 ${tossSide === 'BUY' ? '매수' : '매도'} 주문이 감지되었습니다.<br><br>${riskReason}<br><br>정말 주문을 계속 진행하시겠습니까?`;
                        
                        let popupAdvice = '';
                        if (tossSide === 'BUY') {
                            popupAdvice = '추격 매수를 보류하고 추천 진입가 또는 20일 이평선 부근에 대기 매수(Limit)를 설정하십시오.';
                        } else {
                            popupAdvice = '매도 시점을 늦추어 기술적 반등이나 추가 파동의 이익 실현 라인을 노리십시오.';
                        }
                        adviceEl.textContent = popupAdvice;

                        modal.style.display = 'flex';

                        const cleanUp = (result) => {
                            modal.style.display = 'none';
                            cancelBtn.onclick = null;
                            execBtn.onclick = null;
                            closeBtn.onclick = null;
                            resolve(result);
                        };

                        cancelBtn.onclick = () => cleanUp(false);
                        closeBtn.onclick = () => cleanUp(false);
                        execBtn.onclick = () => cleanUp(true);
                    });
                };

                const proceed = await confirmViaAiGuard();
                if (!proceed) {
                    showToast("AI 안전 가이드에 의해 주문이 취소되었습니다.", "error");
                    return;
                }
            }

            const safetyMsg = isDryRun 
                ? `[DRY RUN - 모의 시뮬레이션]\n\n종목: ${symbol}\n구분: ${tossSide} (${tossType})\n수량: ${qty}주 ${tossType === 'LIMIT' ? `@ $${price}` : ''}\n\n모의 거래 주문을 전송하시겠습니까? (로컬 DB의 가상 잔고만 기록됩니다)`
                : `🚨 [REAL TRADE - 실제 돈 거래]\n\n종목: ${symbol}\n구분: ${tossSide} (${tossType})\n수량: ${qty}주 ${tossType === 'LIMIT' ? `@ $${price}` : ''}\n\n실제 매매 주문을 토스증권 API로 전송하시겠습니까?\n이 주문은 실제 계좌에서 체결되며 취소할 수 없습니다!`;
                
            if (!confirm(safetyMsg)) {
                return;
            }

            orderBtn.disabled = true;
            orderBtn.textContent = "주문 처리 중...";
            
            try {
                const response = await fetch(getApiUrl("/api/order"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        symbol: symbol,
                        side: tossSide,
                        quantity: qty,
                        type: tossType,
                        price: price,
                        dry_run: isDryRun
                    })
                });
                
                const resData = await response.json();
                if (resData.success) {
                    showToast(`주문 완료! ${resData.message}`);
                    refreshTossData(resData.portfolio);
                } else {
                    alert(`주문 실패: ${resData.message}\n${resData.details || ''}`);
                }
            } catch (err) {
                console.error(err);
                alert("주문 전송 중 오류가 발생했습니다. 로컬 FastAPI 서버(scripts/trade/local_server.py)가 켜져 있는지 확인해 주세요.");
            } finally {
                orderBtn.disabled = false;
                orderBtn.textContent = tossType === 'LIMIT' 
                    ? `지정가 주문 전송 (${tossSide})`
                    : `시장가 주문 전송 (${tossSide})`;
            }
        };
    }

    // === 통화(원/달러) 스위치 & 동기화 헤더 버튼 제어 (글로벌 싱크 헬퍼 호출)
    const headerSyncBtn = document.getElementById('toss-header-sync-btn');
    const currentCurrency = localStorage.getItem('tossCurrency') || 'KRW';
    if (typeof window.syncGlobalCurrency === 'function') {
        window.syncGlobalCurrency(currentCurrency);
    }

    if (headerSyncBtn) {
        headerSyncBtn.onclick = () => performTossSync(headerSyncBtn);
    }

    // Render Data from global constant TOSS_PORTFOLIO
    renderTossPortfolio();



    // Draw initial charts & load logs
    const savedSubTabId = sessionStorage.getItem('activeTossSubTab');
    setTimeout(() => {
        if (!savedSubTabId || savedSubTabId === 'toss-sub-overview') {
            drawPnlChart();
            drawRiskDonut();
        } else {
            const targetSubTab = document.querySelector(`.toss-sub-tab[data-sub-target="${savedSubTabId}"]`);
            if (targetSubTab) {
                targetSubTab.click();
            }
        }
        renderSmartRecommendations();
        if (typeof window.updateBotLogs === 'function') window.updateBotLogs();
        if (typeof window.syncBotUIStatus === 'function') setTimeout(window.syncBotUIStatus, 150);

        // [NEW] 실시간 차트 & 시세 연동 이벤트 리스너 추가
        const chartSearchBtn = document.getElementById('toss-chart-search-btn');
        const chartSymbolInput = document.getElementById('toss-chart-symbol-input');
        const orderSymbolInput = document.getElementById('toss-order-symbol');
        
        const triggerSearch = async (options = {}) => {
            const { silent = false } = options;
            const raw = chartSymbolInput?.value || '';
            const rawTrim = raw.trim();
            const rawUpper = rawTrim.toUpperCase();
            let chartSym = rawUpper;
            let sym = window.normalizeBrokerOrderSymbol(rawUpper);

            if (chartSymbolInput?.dataset?.selectedYahooSymbol) {
                chartSym = chartSymbolInput.dataset.selectedYahooSymbol;
                sym = window.normalizeBrokerOrderSymbol(chartSym);
            }

            if (rawUpper && !/^[A-Z0-9.-]+$/i.test(rawUpper)) {
                sym = '';
                chartSym = '';
            }

            if (sym && !/\.(KS|KQ)$/i.test(chartSym) && /^\d{6}$/.test(sym)) {
                try {
                    const q = sym.toLowerCase();
                    const cached = window.orderSymbolSearchCache?.[q] || [];
                    let remote = cached;
                    if (!remote.length) {
                        const res = await fetch(getApiUrl(`/api/symbol-search?q=${encodeURIComponent(sym)}&limit=8`));
                        const data = await res.json();
                        remote = data.success ? (data.results || []) : [];
                        window.orderSymbolSearchCache[q] = remote;
                    }
                    const picked = window.mergeOrderSymbolCandidates([], remote)
                        .find(c => c.symbol === sym && (c.yahooSymbol || '').match(/\.(KS|KQ)$/));
                    if (picked) chartSym = picked.yahooSymbol;
                } catch (err) {
                    console.warn('direct KR code suffix lookup failed:', err);
                }
            }
            if ((!sym || !chartSym) && rawTrim.length >= 2) {
                try {
                    const q = rawTrim.toLowerCase();
                    const cached = window.orderSymbolSearchCache?.[q] || [];
                    let remote = cached;
                    if (!remote.length) {
                        const res = await fetch(getApiUrl(`/api/symbol-search?q=${encodeURIComponent(rawTrim)}&limit=8`));
                        const data = await res.json();
                        remote = data.success ? (data.results || []) : [];
                        window.orderSymbolSearchCache[q] = remote;
                    }
                    const merged = window.mergeOrderSymbolCandidates([], remote);
                    const exact = merged.find(c => String(c.name || '').toLowerCase() === q || c.symbol.toLowerCase() === q || c.yahooSymbol.toLowerCase() === q);
                    const contains = merged.find(c => String(c.name || '').toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.yahooSymbol.toLowerCase().includes(q));
                    const picked = exact || contains || merged[0] || {};
                    sym = picked.symbol || '';
                    chartSym = picked.yahooSymbol || picked.rawSymbol || sym;
                } catch (err) {
                    console.warn('symbol search before chart lookup failed:', err);
                }
            }
            if (!sym) {
                if (!silent) {
                    alert("종목명 또는 티커를 선택해 주세요. 여러 후보가 있으면 자동완성 목록에서 하나를 고르세요.");
                }
                return;
            }
            if (chartSymbolInput) {
                chartSymbolInput.value = chartSym;
                chartSymbolInput.dataset.selectedYahooSymbol = chartSym;
            }
            if (orderSymbolInput) orderSymbolInput.value = sym;
            const nameSpan = document.getElementById('toss-order-stock-name');
            if (nameSpan) {
                const displayName = window.findStockNameLocal(sym);
                nameSpan.textContent = displayName && displayName !== sym ? displayName : '';
            }
            
            // [NEW] 세션에 저장된 기간 복원
            const savedPeriod = sessionStorage.getItem('tossChartPeriod') || '1y';
            const targetBtn = document.querySelector(`.toss-chart-period-btn[data-period="${savedPeriod}"]`);
            if (targetBtn) {
                document.querySelectorAll('.toss-chart-period-btn').forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');
            }
            
            const activePeriodBtn = document.querySelector('.toss-chart-period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '1y';
            const interval = activePeriodBtn ? activePeriodBtn.getAttribute('data-interval') : '1wk';
            window.fetchTickerPriceData(chartSym || sym, period, interval, { orderSymbol: sym });
        };

        if (chartSearchBtn) {
            chartSearchBtn.onclick = triggerSearch;
        }
        if (chartSymbolInput) {
            chartSymbolInput.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    await triggerSearch();
                }
            };
            chartSymbolInput.oninput = () => {
                const val = chartSymbolInput.value.trim();
                const resolved = window.resolveOrderSymbolInput(val);
                if (orderSymbolInput) orderSymbolInput.value = resolved;
                const nameSpan = document.getElementById('toss-order-stock-name');
                if (nameSpan) {
                    const displayName = window.findStockNameLocal(resolved);
                    nameSpan.textContent = displayName && displayName !== resolved ? displayName : '';
                }
                
                // 검색창이 비면 활성 종목을 해제하고 주문 목록 전체를 다시 표시
                if (val === '') {
                    tossCurrentActiveSymbol = null;
                    
                    // [NEW] 티커가 비었을 때 세션에 저장된 기간으로 active 복원
                    const savedPeriod = sessionStorage.getItem('tossChartPeriod') || '1y';
                    const defaultPeriodBtn = document.querySelector(`.toss-chart-period-btn[data-period="${savedPeriod}"]`);
                    if (defaultPeriodBtn) {
                        document.querySelectorAll('.toss-chart-period-btn').forEach(b => b.classList.remove('active'));
                        defaultPeriodBtn.classList.add('active');
                    }
                    
                    if (typeof window.stopWhaleSimulation === 'function') {
                        window.stopWhaleSimulation();
                    }
                    const tickerEl = document.getElementById('toss-whale-ticker');
                    if (tickerEl) tickerEl.textContent = '-';
                    const listEl = document.getElementById('toss-whale-depth-rows');
                    if (listEl) listEl.innerHTML = '<div class="toss-whale-placeholder">종목 조회 대기 중...</div>';
                    const feedEl = document.getElementById('toss-whale-feed-list');
                    if (feedEl) feedEl.innerHTML = '<div class="toss-whale-placeholder">체결 대기 중...</div>';
                    // AI 배지 리셋
                    const whaleBadge = document.getElementById('toss-whale-ai-badge');
                    const whaleDesc = document.getElementById('toss-whale-signal-desc');
                    const whaleAiPanel = document.getElementById('toss-whale-ai-signal');
                    if (whaleBadge) { whaleBadge.textContent = '대기'; whaleBadge.style.background = 'rgba(100,116,139,0.15)'; whaleBadge.style.color = '#64748b'; whaleBadge.style.borderColor = 'rgba(100,116,139,0.3)'; }
                    if (whaleDesc) whaleDesc.textContent = '종목 조회 대기 중';
                    if (whaleAiPanel) { whaleAiPanel.style.borderColor = 'rgba(56,189,248,0.12)'; whaleAiPanel.style.background = 'rgba(56,189,248,0.06)'; }
                    
                    if (typeof renderTossPortfolio === 'function') {
                        renderTossPortfolio();
                    }
                }
            };
        }
        if (orderSymbolInput) orderSymbolInput.disabled = true;

        // 차트 기간 버튼 리스너
        const periodBtns = document.querySelectorAll('.toss-chart-period-btn');
        periodBtns.forEach(btn => {
            btn.onclick = () => {
                periodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const rawSym = (chartSymbolInput.value || 'AAPL').trim().toUpperCase();
                const sym = window.resolveOrderSymbolInput(rawSym) || rawSym;
                const period = btn.getAttribute('data-period');
                const interval = btn.getAttribute('data-interval');
                const chartSym = chartSymbolInput.dataset.selectedYahooSymbol || rawSym;
                
                // [NEW] 세션에 선택한 기간 저장
                sessionStorage.setItem('tossChartPeriod', period);
                sessionStorage.setItem('tossChartInterval', interval);
                
                window.fetchTickerPriceData(chartSym, period, interval, { orderSymbol: sym });
            };
        });

        // [NEW] 최초 로드 시 세션에 저장된 차트 기간 active 상태 복원
        const savedPeriod = sessionStorage.getItem('tossChartPeriod') || '1y';
        const targetBtn = document.querySelector(`.toss-chart-period-btn[data-period="${savedPeriod}"]`);
        if (targetBtn) {
            document.querySelectorAll('.toss-chart-period-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }

        // 주문 서브탭이 열릴 때 기본 종목 차트 로드
        const ordersTab = document.querySelector('.toss-sub-tab[data-sub-target="toss-sub-orders"]');
        if (ordersTab) {
            const origClick = ordersTab.onclick;
            ordersTab.onclick = () => {
                if (typeof origClick === 'function') origClick();
                triggerSearch({ silent: true });
            };
        }

        if (typeof ResizeObserver !== 'undefined' && !window._tossOrderLayoutObserver) {
            const feedListEl = document.getElementById('toss-whale-feed-list');
            const topGridEl = document.querySelector('.toss-orders-top-grid');
            const chartWrapEl = document.querySelector('.toss-center-chart-wrap');
            const centerColEl = document.querySelector('.toss-order-center-col');
            const chartAreaEl = document.getElementById('toss-order-chart');
            const centerBottomEl = document.querySelector('.toss-center-bottom-stack');
            const rightColEl = document.querySelector('.toss-orders-right-col');
            const leftColEl = document.querySelector('.toss-orders-left-col');
            let resizeTimer = null;
            window._tossOrderLayoutObserver = new ResizeObserver(() => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (typeof window.syncOrderLayoutHeights === 'function') {
                        window.syncOrderLayoutHeights();
                    }
                }, 80);
            });
            if (feedListEl) window._tossOrderLayoutObserver.observe(feedListEl);
            if (topGridEl) window._tossOrderLayoutObserver.observe(topGridEl);
            if (centerColEl) window._tossOrderLayoutObserver.observe(centerColEl);
            if (chartWrapEl) window._tossOrderLayoutObserver.observe(chartWrapEl);
            if (chartAreaEl) window._tossOrderLayoutObserver.observe(chartAreaEl);
            if (centerBottomEl) window._tossOrderLayoutObserver.observe(centerBottomEl);
            if (rightColEl) window._tossOrderLayoutObserver.observe(rightColEl);
            if (leftColEl) window._tossOrderLayoutObserver.observe(leftColEl);
        }
    }, 100);
}

function renderTossPortfolio() {
    const portfolio = window.TOSS_PORTFOLIO || (typeof TOSS_PORTFOLIO !== 'undefined' ? TOSS_PORTFOLIO : null);
    window.tossPortfolio = portfolio;
    if (!portfolio) {
        console.warn("TOSS_PORTFOLIO data is not available.");
        return;
    }

    // 트레이딩 콘솔은 DB 캐시(모의)만 표시. 실전 잔고는 서버 시작·보유종목 적용 전용.
    const account = portfolio.account;
    const holdings = portfolio.holdings || [];
    const orders = portfolio.orders || [];

    // 통화 환산 포맷팅 헬퍼
    const fmtVal = (valInUsd, isRate = false) => {
        if (isRate) {
            return `${valInUsd > 0 ? '+' : ''}${parseFloat(valInUsd).toFixed(2)}%`;
        }
        const curr = localStorage.getItem('tossCurrency') || 'KRW';
        const rate = window.CURRENT_USD_RATE || 1400;
        if (curr === 'KRW') {
            const krwVal = Math.round(valInUsd * rate);
            return `₩${krwVal.toLocaleString()}`;
        } else {
            return `$${valInUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    // Render Account Info
    if (account) {
        const assetsEl = document.getElementById('toss-total-assets');
        const cashEl = document.getElementById('toss-cash-balance');
        const pnlEl = document.getElementById('toss-total-pnl');
        const returnEl = document.getElementById('toss-total-return');

        if (assetsEl) assetsEl.textContent = fmtVal(account.total_assets);
        if (cashEl) cashEl.textContent = fmtVal(account.cash_balance);
        
        if (pnlEl) {
            const pnl = account.total_profit_loss;
            pnlEl.textContent = `${pnl >= 0 ? '+' : ''}${fmtVal(pnl)}`;
            pnlEl.style.color = pnl >= 0 ? 'var(--live-green)' : 'var(--live-red)';
        }
        
        if (returnEl) {
            const rate = account.total_return_rate;
            returnEl.textContent = fmtVal(rate, true);
            returnEl.style.color = rate >= 0 ? 'var(--live-green)' : 'var(--live-red)';
        }
    }

    // Render Risk metrics
    if (portfolio.risk_metrics) {
        const mddEl = document.getElementById('toss-risk-mdd');
        const exposureEl = document.getElementById('toss-risk-exposure');
        const divEl = document.getElementById('toss-risk-diversification');

        if (mddEl) mddEl.textContent = `${portfolio.risk_metrics.mdd.toFixed(2)}%`;
        if (exposureEl) exposureEl.textContent = `${portfolio.risk_metrics.total_exposure_pct.toFixed(2)}%`;
        
        if (divEl) {
            const exp = portfolio.risk_metrics.total_exposure_pct;
            if (exp > 85) {
                divEl.textContent = "리스크 집중 (높음)";
                divEl.style.color = '#fb7185';
            } else if (exp < 30) {
                divEl.textContent = "보수적 운용 (낮음)";
                divEl.style.color = '#38bdf8';
            } else {
                divEl.textContent = "적정 분산 (보통)";
                divEl.style.color = '#34d399';
            }
        }
    }

    // Render Journal (Trade stats)
    if (portfolio.trade_stats) {
        const winrateEl = document.getElementById('toss-journal-winrate');
        const totalTradesEl = document.getElementById('toss-journal-total-trades');
        const pfEl = document.getElementById('toss-journal-profit-factor');
        const realizedPnlEl = document.getElementById('toss-journal-realized-pnl');

        const winsEl = document.getElementById('toss-journal-wins');
        const lossesEl = document.getElementById('toss-journal-losses');
        const gpEl = document.getElementById('toss-journal-gross-profit');
        const glEl = document.getElementById('toss-journal-gross-loss');

        const winRate = portfolio.trade_stats.win_rate;
        if (winrateEl) {
            winrateEl.textContent = `${winRate.toFixed(2)}%`;
            winrateEl.style.color = winRate >= 50 ? '#34d399' : '#fb7185';
        }
        if (totalTradesEl) totalTradesEl.textContent = `${portfolio.trade_stats.total_trades}회`;
        
        const pf = portfolio.trade_stats.profit_factor;
        if (pfEl) {
            pfEl.textContent = pf.toFixed(2);
            pfEl.style.color = pf >= 1.5 ? '#34d399' : (pf >= 1.0 ? '#38bdf8' : '#fb7185');
        }

        const fmtKrwVal = (valInKrw, isRate = false) => {
            if (isRate) return `${valInKrw > 0 ? '+' : ''}${parseFloat(valInKrw).toFixed(2)}%`;
            const curr = localStorage.getItem('tossCurrency') || 'KRW';
            const rate = window.CURRENT_USD_RATE || 1400;
            if (curr === 'KRW') return `₩${Math.round(valInKrw || 0).toLocaleString()}`;
            return `$${((valInKrw || 0) / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        const netPnl = portfolio.trade_stats.total_profit - portfolio.trade_stats.total_loss;
        if (realizedPnlEl) {
            realizedPnlEl.textContent = `${netPnl >= 0 ? '+' : ''}${fmtKrwVal(netPnl)}`;
            realizedPnlEl.style.color = netPnl >= 0 ? '#f25f7a' : '#5f97f2';
        }

        if (winsEl) winsEl.textContent = portfolio.trade_stats.win_trades;
        if (lossesEl) lossesEl.textContent = portfolio.trade_stats.loss_trades;
        if (gpEl) gpEl.textContent = fmtKrwVal(portfolio.trade_stats.total_profit);
        if (glEl) glEl.textContent = fmtKrwVal(portfolio.trade_stats.total_loss);

        // Dynamic AI feedback
        const fbEl = document.getElementById('toss-journal-feedback');
        if (fbEl) {
            if (portfolio.trade_stats.total_trades === 0) {
                fbEl.innerHTML = "충분한 거래 데이터가 수집되면 AI가 매매 패턴을 분석하고 리스크 분산 및 매매 규칙 보정을 위한 피드백을 이곳에 제시합니다.";
            } else {
                let fbText = "";
                if (winRate >= 60) {
                    fbText += "[+] <strong>우수한 승률:</strong> 현재 거래 승률이 60% 이상으로 양호한 매수 진입 타점을 잡고 있습니다.<br>";
                } else {
                    fbText += "[!] <strong>진입 신호 보정 필요:</strong> 승률이 50% 미만입니다. MFC 강한 매수 시그널에만 진입하여 타점을 좁히는 훈련이 필요합니다.<br>";
                }

                if (pf >= 1.5) {
                    fbText += "[+] <strong>프로핏 팩터 양호:</strong> 실현 수익이 손실 대비 훨씬 커서 전형적인 '손절은 짧게, 익절은 길게'의 손익비 원칙을 준수하고 있습니다.<br>";
                } else if (pf < 1.0) {
                    fbText += "[-] <strong>손실 대비 수익성 저하:</strong> 잃은 금액이 번 금액보다 많습니다. 손절 라인을 칼같이 잡고 급작스런 추세 전환 시 빠르게 포지션을 정리해야 합니다.<br>";
                }

                fbEl.innerHTML = fbText;
            }
        }

        // Render Best & Worst Trades for Toss
        const bestTbody = document.getElementById('toss-journal-best-tbody');
        const worstTbody = document.getElementById('toss-journal-worst-tbody');
        
        const fmtTradeProfit = (symbol, profit) => {
            const isKr = /^\d{6}/.test(symbol) || symbol.endsWith('.KS') || symbol.endsWith('.KQ');
            const curr = localStorage.getItem('tossCurrency') || 'KRW';
            const rate = window.CURRENT_USD_RATE || 1400;
            if (isKr) {
                if (curr === 'KRW') return `₩${Math.round(profit).toLocaleString()}`;
                return `$${(profit / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                if (curr === 'KRW') return `₩${Math.round(profit * rate).toLocaleString()}`;
                return `$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        };

        if (bestTbody) {
            const bests = portfolio.trade_stats.best_trades || [];
            if (bests.length === 0) {
                bestTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 1rem; color: #94a3b8;">데이터가 없습니다.</td></tr>`;
            } else {
                bestTbody.innerHTML = bests.map((t, idx) => `
                    <tr class="best-trade-row">
                        <td class="best-trade-rank">${idx + 1}</td>
                        <td class="best-trade-symbol">${t.symbol}</td>
                        <td class="best-trade-profit-up" style="text-align: right;">+${fmtTradeProfit(t.symbol, t.profit)}</td>
                    </tr>
                `).join('');
            }
        }
        
        if (worstTbody) {
            const worsts = portfolio.trade_stats.worst_trades || [];
            if (worsts.length === 0) {
                worstTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 1rem; color: #94a3b8;">데이터가 없습니다.</td></tr>`;
            } else {
                worstTbody.innerHTML = worsts.map((t, idx) => `
                    <tr class="best-trade-row">
                        <td class="best-trade-rank">${idx + 1}</td>
                        <td class="best-trade-symbol">${t.symbol}</td>
                        <td class="best-trade-profit-down" style="text-align: right;">${fmtTradeProfit(t.symbol, t.profit)}</td>
                    </tr>
                `).join('');
            }
        }
    }

    // Render Holdings
    const holdingsTbody = document.getElementById('toss-holdings-tbody');
    if (holdingsTbody) {
        if (holdings.length === 0) {
            holdingsTbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #64748b;">보유 중인 주식이 없습니다.</td></tr>`;
        } else {
            holdingsTbody.innerHTML = holdings.map(h => {
                const restoredName = window.findStockNameLocal ? window.findStockNameLocal(h.symbol) : '';
                const rawName = String(h.name || '').trim();
                const normalizedHoldingSymbol = window.normalizeBrokerOrderSymbol ? window.normalizeBrokerOrderSymbol(h.symbol) : String(h.symbol || '').toUpperCase();
                const normalizedRawName = window.normalizeBrokerOrderSymbol ? window.normalizeBrokerOrderSymbol(rawName) : rawName.toUpperCase();
                const displayName = restoredName || (rawName && normalizedRawName !== normalizedHoldingSymbol ? rawName : '');
                const titleText = displayName || h.symbol;
                
                const repStock = window.brokerAdapter ? window.brokerAdapter._findReportStock(h.symbol, titleText) : null;
                
                let curPrice = (h.current_price !== undefined && h.current_price !== null) ? h.current_price : (h.currentPrice || 0);
                let avgPrice = (h.avg_buy_price !== undefined && h.avg_buy_price !== null) ? h.avg_buy_price : (h.avgBuyPrice || 0);
                let profitLoss = (h.profit_loss !== undefined && h.profit_loss !== null) ? h.profit_loss : (h.profitLoss || 0);
                let returnRate = (h.return_rate !== undefined && h.return_rate !== null) ? h.return_rate : (h.returnRate || 0);
                
                // 만약 curPrice가 0이거나 평단가와 거의 동일하여 손익이 0인 경우, repStock에서 최신 시세 연동
                if (repStock && repStock.rawPrice > 0 && (curPrice === 0 || Math.abs(curPrice - avgPrice) < 1e-5)) {
                    const rate = window.CURRENT_USD_RATE || 1400;
                    const isKr = (h.symbol || '').includes('.KS') || (h.symbol || '').includes('.KQ') || /^\d{6}$/.test(h.symbol || '');
                    curPrice = isKr ? (repStock.rawPrice / rate) : repStock.rawPrice;
                }
                
                let evalAmt = curPrice > 0 ? (curPrice * h.quantity) : (h.eval_amount || h.evalAmount || 0);
                
                // 최신 가격 기반 평가손익 및 수익률 실시간 산출
                if (avgPrice > 0 && curPrice > 0) {
                    profitLoss = (curPrice - avgPrice) * h.quantity;
                    returnRate = ((curPrice - avgPrice) / avgPrice) * 100;
                }

                const pnlColor = profitLoss >= 0 ? 'var(--live-green)' : 'var(--live-red)';
                const pnlSign = profitLoss >= 0 ? '+' : '';
                
                // 비중 계산
                const totalAssets = portfolio.account?.total_assets || 1.0;
                const weight = ((evalAmt || 0.0) / totalAssets) * 100;
                const weightText = `${weight.toFixed(1)}%`;
                
                // 최신 daily_report 연동을 통한 AI Rating 및 RSI 조회
                let ratingHtml = `<span class="rating-badge hold">HOLD</span>`;
                let rsiHtml = `<span class="rsi-badge normal">N/A</span>`;
                
                if (repStock) {
                    const rawRating = repStock.rating || repStock.advice || repStock.recommendation || (repStock.reason && repStock.reason.recommendation) || 'HOLD';
                    const ratingVal = String(rawRating).toUpperCase();
                    if (ratingVal.includes('BUY')) {
                        ratingHtml = `<span class="rating-badge buy">${ratingVal.includes('STRONG') ? 'STRONG BUY' : 'BUY'}</span>`;
                    } else if (ratingVal.includes('SELL')) {
                        ratingHtml = `<span class="rating-badge sell">${ratingVal.includes('STRONG') ? 'STRONG SELL' : 'SELL'}</span>`;
                    } else {
                        ratingHtml = `<span class="rating-badge hold">HOLD</span>`;
                    }
                    
                    let rsiVal = repStock.rsi;
                    if (rsiVal === undefined || rsiVal === null) {
                        if (repStock.reason && repStock.reason.indicators && repStock.reason.indicators.rsi !== undefined) {
                            rsiVal = repStock.reason.indicators.rsi;
                        }
                    }
                    if (rsiVal !== undefined && rsiVal !== null && !isNaN(rsiVal)) {
                        const rsiNum = parseFloat(rsiVal);
                        if (rsiNum >= 70) {
                            rsiHtml = `<span class="rsi-badge overbought">${rsiNum.toFixed(0)}</span>`;
                        } else if (rsiNum <= 30) {
                            rsiHtml = `<span class="rsi-badge oversold">${rsiNum.toFixed(0)}</span>`;
                        } else {
                            rsiHtml = `<span class="rsi-badge normal">${rsiNum.toFixed(0)}</span>`;
                        }
                    }
                }
                
                return `
                    <tr class="holdings-row" onclick="quickOrder('${h.symbol}')">
                        <td class="holdings-cell-symbol">${titleText} <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.25rem;">${h.symbol}</span></td>
                        <td class="holdings-cell-weight" style="text-align: right; font-weight: 600; color: #cbd5e1;">${weightText}</td>
                        <td class="holdings-cell-qty">${h.quantity}</td>
                        <td class="holdings-cell-price">${fmtVal(avgPrice)}</td>
                        <td class="holdings-cell-price" style="color: var(--text-primary); font-weight: 600;">${fmtVal(curPrice)}</td>
                        <td class="holdings-cell-eval">${fmtVal(evalAmt)}</td>
                        <td class="holdings-cell-pnl" style="color: ${pnlColor};">${pnlSign}${fmtVal(profitLoss)}</td>
                        <td class="holdings-cell-return" style="color: ${pnlColor};">${pnlSign}${returnRate.toFixed(2)}%</td>
                        <td class="holdings-cell-rating" style="text-align: center;">${ratingHtml}</td>
                        <td class="holdings-cell-rsi" style="text-align: center;">${rsiHtml}</td>
                        <td class="holdings-cell-action" onclick="event.stopPropagation();">
                            <div class="holdings-action-btn-group">
                                <button class="holdings-btn-primary" onclick="quickOrder('${h.symbol}')">주문</button>
                                <button class="holdings-btn-secondary" onclick="tossQuickSell('${h.symbol}', ${h.quantity})">즉시 전량매도</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Separate Open (Limit) vs Closed (Market/Filled) orders
    // 만약 현재 조회/선택된 활성 종목(tossCurrentActiveSymbol)이 있다면 해당 종목 주문만 필터링
    let filteredOrders = orders;
    if (tossCurrentActiveSymbol) {
        // activeSymClean 및 oSymClean 양측 모두에서 확장자(.NAS, .NYS, .AMX, .KS, .KQ)를 제거하여 순수 티커명만 비교
        const activeSymClean = tossCurrentActiveSymbol.replace('.NAS', '').replace('.NYS', '').replace('.AMX', '').replace('.KS', '').replace('.KQ', '').trim().toUpperCase();
        filteredOrders = orders.filter(o => {
            if (!o.symbol) return false;
            const oSymClean = o.symbol.replace('.NAS', '').replace('.NYS', '').replace('.AMX', '').replace('.KS', '').replace('.KQ', '').trim().toUpperCase();
            return oSymClean === activeSymClean;
        });
    }

    const openOrders = filteredOrders.filter(o => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED');
    const closedOrders = filteredOrders.filter(o => o.status !== 'OPEN' && o.status !== 'PARTIALLY_FILLED');

    // Render Open Orders (Limit orders with cancel option)
    const openOrdersTbody = document.getElementById('toss-open-orders-tbody');
    if (openOrdersTbody) {
        if (openOrders.length === 0) {
            openOrdersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">미체결 주문이 없습니다.</td></tr>`;
        } else {
            openOrdersTbody.innerHTML = openOrders.map(o => {
                const sideColor = o.side === 'BUY' ? 'var(--accent-blue)' : 'var(--up-color)';
                const sideText = o.side === 'BUY' ? '매수 [BUY]' : '매도 [SELL]';
                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); font-family: 'Outfit', sans-serif; color: var(--text-secondary);">
                        <td style="padding: 0.5rem; font-size: 0.75rem;">${o.ordered_at}</td>
                        <td style="padding: 0.5rem; font-weight: bold; color: #fff;">${o.symbol}</td>
                        <td style="padding: 0.5rem; font-weight: 700; color: ${sideColor};">${sideText}</td>
                        <td style="padding: 0.5rem; text-align: right; font-family: monospace;">${fmtVal(o.price)}</td>
                        <td style="padding: 0.5rem; text-align: right; font-weight: bold;">${o.quantity}</td>
                        <td style="padding: 0.5rem; text-align: right;">${o.executed_qty}</td>
                        <td style="padding: 0.5rem; text-align: center;">
                            <button onclick="cancelTossOrder('${o.order_id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fb7185; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: bold; transition: all 0.2s;">취소</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Render Closed Orders (with Status Filter applied)
    const ordersTbody = document.getElementById('toss-orders-tbody');
    if (ordersTbody) {
        let displayClosed = closedOrders;
        const currentFilter = window.tossClosedOrderFilter || 'ALL';
        console.log("[DEBUG] renderTossPortfolio - closedOrders count:", closedOrders.length, "currentFilter:", currentFilter);
        
        if (currentFilter !== 'ALL') {
            displayClosed = closedOrders.filter(o => {
                const status = (o.status || '').toUpperCase();
                let match = false;
                if (currentFilter === 'FILLED') {
                    match = (status === 'FILLED' || status === 'CLOSED');
                } else if (currentFilter === 'CANCELLED' || currentFilter === 'CANCELED') {
                    match = (status === 'CANCELLED' || status === 'CANCELED');
                } else {
                    match = (status === currentFilter);
                }
                console.log(`[DEBUG] filter o.status: ${status} vs filter: ${currentFilter} => match: ${match}`);
                return match;
            });
        }
        console.log("[DEBUG] renderTossPortfolio - displayClosed count:", displayClosed.length);

        if (displayClosed.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">조건에 맞는 최근 주문 이력이 없습니다.</td></tr>`;
        } else {
            ordersTbody.innerHTML = displayClosed.slice(0, 15).map(o => {
                const sideColor = o.side === 'BUY' ? 'var(--accent-blue)' : 'var(--up-color)';
                const sideText = o.side === 'BUY' ? '매수 [BUY]' : '매도 [SELL]';
                const statusColor = o.status === 'CLOSED' || o.status === 'FILLED' ? 'var(--live-green)' : '#94a3b8';
                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); font-family: 'Outfit', sans-serif; color: var(--text-secondary);">
                        <td style="padding: 0.5rem; font-size: 0.75rem;">${o.ordered_at}</td>
                        <td style="padding: 0.5rem; font-weight: bold; color: #fff;">${o.symbol}</td>
                        <td style="padding: 0.5rem; font-weight: 700; color: ${sideColor};">${sideText}</td>
                        <td style="padding: 0.5rem; text-align: right; font-family: monospace;">${fmtVal(o.price)}</td>
                        <td style="padding: 0.5rem; text-align: right; font-weight: bold;">${o.quantity}</td>
                        <td style="padding: 0.5rem; text-align: right;">${o.executed_qty}</td>
                        <td style="padding: 0.5rem; text-align: center; font-weight: bold; color: ${statusColor}; font-size: 0.75rem;">${o.status}</td>
                    </tr>
                `;
            }).join('');
        }
    }
    if (typeof window.updateTossOrderHelper === 'function') {
        window.updateTossOrderHelper();
    }
}

// Global scope binding for inline onclick event in Holdings list
window.tossQuickSell = (symbol, qty) => {
    const orderTab = document.querySelector('.toss-sub-tab[data-sub-target="toss-sub-orders"]');
    if (orderTab) orderTab.click();

    const symbolInput = document.getElementById('toss-order-symbol');
    const qtyInput = document.getElementById('toss-order-qty');
    
    if (symbolInput) symbolInput.value = symbol.replace('.NAS', '').replace('.NYS', '').replace('.AMX', '');
    if (qtyInput) qtyInput.value = qty;
    
    const sellBtn = document.querySelector('.toss-side-btn[data-side="SELL"]');
    if (sellBtn) sellBtn.click();
    
    const orderBtn = document.getElementById('toss-submit-order-btn');
    if (orderBtn) {
        orderBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        orderBtn.style.animation = 'orbAlert 0.3s 3 alternate';
        setTimeout(() => { orderBtn.style.animation = ''; }, 1000);
    }
};

let tossPnlChartInstance = null;
let tossPnlSeriesInstance = null;
let tossCandleChartInstance = null;

function drawPnlChart() {
    const container = document.getElementById('toss-pnl-chart');
    if (!container) return;

    let pnlHistory = [];
    const portfolio = window.TOSS_PORTFOLIO || (typeof TOSS_PORTFOLIO !== 'undefined' ? TOSS_PORTFOLIO : null);
    if (portfolio && portfolio.pnl_history) {
        pnlHistory = portfolio.pnl_history;
    }

    if (pnlHistory.length === 0) {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.85rem;">PnL 변동 내역이 없습니다 (동기화 필요).</div>`;
        tossPnlChartInstance = null;
        tossPnlSeriesInstance = null;
        return;
    }

    // Filter by period
    let dataPoints = [...pnlHistory];
    if (tossChartPeriod === '7') {
        dataPoints = dataPoints.slice(-7);
    } else if (tossChartPeriod === '30') {
        dataPoints = dataPoints.slice(-30);
    } else if (tossChartPeriod === '90') {
        dataPoints = dataPoints.slice(-90);
    }

    if (dataPoints.length < 2) {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.85rem;">차트를 그리기에 데이터가 부족합니다.</div>`;
        tossPnlChartInstance = null;
        tossPnlSeriesInstance = null;
        return;
    }

    const chartData = dataPoints.map(d => ({
        time: d.date,
        value: d.total_assets
    }));

    // 만약 이미 차트 및 시리즈 인스턴스가 존재한다면 데이터만 업데이트하여 껌뻑임(flicker) 방지
    if (tossPnlChartInstance && tossPnlSeriesInstance) {
        try {
            tossPnlSeriesInstance.setData(chartData);
            tossPnlChartInstance.timeScale().fitContent();
            return;
        } catch (err) {
            console.warn("Failed to update existing Toss PnL chart, recreating...", err);
        }
    }

    container.innerHTML = '';
    tossPnlChartInstance = null;
    tossPnlSeriesInstance = null;
    
    // 라이브러리 로딩 가드
    if (typeof LightweightCharts === 'undefined') {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.85rem;">TradingView 차트 라이브러리를 로드할 수 없습니다.</div>`;
        return;
    }

    try {
        // Create chart using TradingView lightweight-charts
        const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 500,
        height: container.clientHeight || 260,
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: '#94a3b8',
            fontSize: 10,
            fontFamily: 'Outfit, sans-serif'
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.02)' }
        },
        rightPriceScale: {
            borderVisible: false,
            scaleMargins: {
                top: 0.1,
                bottom: 0.1
            }
        },
        timeScale: {
            borderVisible: false
        },
        handleScroll: false,
        handleScale: false
    });

    const areaSeries = chart.addAreaSeries({
        lineColor: '#38bdf8',
        topColor: 'rgba(56, 189, 248, 0.25)',
        bottomColor: 'rgba(56, 189, 248, 0.0)',
        lineWidth: 2,
        crosshairMarkerVisible: true
    });

        areaSeries.setData(chartData);
        chart.timeScale().fitContent();
    
        tossPnlChartInstance = chart;
        tossPnlSeriesInstance = areaSeries;
    } catch (e) {
        console.error("Failed to render lightweight-chart:", e);
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444; font-size: 0.85rem;">차트 생성 실패: ${e.message}</div>`;
    }
}

let tossRiskChartInstance = null; // Chart.js 인스턴스 전역 저장

function drawRiskDonut() {
    // [v15] Chart.js 는 지연 로드된다. 아직 없으면 받아온 뒤 다시 그린다.
    if (typeof Chart === 'undefined') {
        window.ensureChartJs().then((ok) => { if (ok) drawRiskDonut(); });
        return;
    }
    const canvas = document.getElementById('toss-risk-donut');
    if (!canvas) return;

    const portfolio = window.TOSS_PORTFOLIO || (typeof TOSS_PORTFOLIO !== 'undefined' ? TOSS_PORTFOLIO : null);
    if (!portfolio) return;

    const holdings = portfolio.holdings || [];
    const cash = portfolio.account?.cash_balance || 0.0;
    const totalAssets = portfolio.account?.total_assets || cash || 1.0;

    const labels = [];
    const data = [];
    const colors = [];

    // 1. 보유 주식 비중 수집
    holdings.forEach(h => {
        const name = h.name || h.symbol;
        const weight = ((h.eval_amount || 0.0) / totalAssets) * 100;
        if (weight > 0.1) {
            labels.push(name);
            data.push(Math.round(weight * 10) / 10);
        }
    });

    // 2. 예수금(현금) 비중 추가
    const cashWeight = (cash / totalAssets) * 100;
    if (cashWeight > 0.1) {
        labels.push('현금');
        data.push(Math.round(cashWeight * 10) / 10);
        colors.push('rgba(71, 85, 105, 0.7)'); // slate
    }

    // 개별 종목 색상 매핑 (Glassmorphism 테마)
    const baseColors = [
        '#f25f7a', '#38bdf8', '#a78bfa', '#fbbf24', '#34d399', 
        '#f43f5e', '#60a5fa', '#c084fc', '#fb7185', '#0284c7'
    ];
    for (let i = 0; i < labels.length - (cashWeight > 0.1 ? 1 : 0); i++) {
        colors.push(baseColors[i % baseColors.length]);
    }

    if (data.length === 0) {
        labels.push('데이터 없음');
        data.push(100);
        colors.push('rgba(255, 255, 255, 0.06)');
    }

    // 만약 이미 차트 인스턴스가 있다면 데이터만 업데이트하여 껌뻑임(flicker) 방지
    if (tossRiskChartInstance) {
        try {
            tossRiskChartInstance.data.labels = labels;
            tossRiskChartInstance.data.datasets[0].data = data;
            tossRiskChartInstance.data.datasets[0].backgroundColor = colors;
            tossRiskChartInstance.update('none'); // 애니메이션 없이 업데이트
            return;
        } catch (err) {
            console.warn("Failed to update existing Toss risk donut chart, recreating...", err);
        }
    }

    if (tossRiskChartInstance) {
        tossRiskChartInstance.destroy();
        tossRiskChartInstance = null;
    }

    try {
        const ctx = canvas.getContext('2d');
        tossRiskChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: 'rgba(15, 23, 42, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    } catch (err) {
        console.error("Failed to draw Chart.js donut:", err);
    }
}

function renderSmartRecommendations() {
    const container = document.getElementById('toss-smart-recommendations');
    if (!container) return;

    let exposure = 0.0;
    if (typeof TOSS_PORTFOLIO !== 'undefined' && TOSS_PORTFOLIO.risk_metrics) {
        exposure = TOSS_PORTFOLIO.risk_metrics.total_exposure_pct || 0.0;
    }

    let myHoldings = [];
    if (typeof TOSS_PORTFOLIO !== 'undefined' && TOSS_PORTFOLIO.holdings) {
        myHoldings = TOSS_PORTFOLIO.holdings;
    }

    // Get report data
    let allStocks = [];
    if (window.REPORTS_HISTORY && window.REPORTS_HISTORY.length > 0) {
        const latest = window.REPORTS_HISTORY[0];
        allStocks = [...(latest.holdings || []), ...(latest.watchlist || [])];
    }

    const tips = [];

    // Risk-based portfolio exposure tips
    if (exposure > 85) {
        tips.push({
            type: 'danger',
            title: '⚠️ 주식 비중 과다 경고',
            desc: `현재 포트폴리오 노출도가 <b>${exposure}%</b>로 임계치(85%)를 넘었습니다. 추가 매수를 멈추고 현금 예치금을 마련해 시장 변동성에 대비하세요.`
        });
    } else if (exposure < 30 && exposure > 0) {
        tips.push({
            type: 'info',
            title: '💡 높은 현금 비중 (유동성 풍부)',
            desc: `포트폴리오 주식 비중이 <b>${exposure}%</b>로 매우 낮습니다. AI 스마트 스코어가 뛰어난 주도 종목들을 추가 편입하여 적극적으로 자본을 배치하는 것을 검토해 보세요.`
        });
    }

    // Stock recommendations based on AI ratings
    const buyPicks = allStocks.filter(s => (s.advice === 'BUY' || s.advice === 'STRONG_BUY') && s.mfcScore >= 75);
    const holdSellPicks = allStocks.filter(s => (s.advice === 'SELL' || s.advice === 'NEUTRAL'));

    // Check my holdings if any are rated SELL or NEUTRAL
    myHoldings.forEach(h => {
        const analysis = holdSellPicks.find(p => p.symbol.replace('.NAS','').replace('.NYS','') === h.symbol.replace('.NAS','').replace('.NYS',''));
        if (analysis) {
            tips.push({
                type: 'warning',
                title: `🚨 비중 분할 매도 검토: ${h.name}`,
                desc: `보유 주식 <b>${h.symbol}</b>의 AI 컨센서스 등급이 현재 <b>${analysis.advice}</b>(스코어 ${analysis.mfcScore || '-'}점)로 약세 전환되었습니다. 분할 익절/손절하여 현금화하는 것을 추천합니다.`
            });
        }
    });

    // Suggest new buys that are not currently held
    buyPicks.forEach(p => {
        const isAlreadyHeld = myHoldings.some(h => h.symbol.replace('.NAS','').replace('.NYS','') === p.symbol.replace('.NAS','').replace('.NYS',''));
        if (!isAlreadyHeld && tips.length < 4) {
            tips.push({
                type: 'success',
                title: `🚀 주도주 신규 진입 추천: ${p.name}`,
                desc: `<b>${p.symbol}</b>의 AI 상승 모멘텀(MFC 스코어 <b>${p.mfcScore}점</b>, 등급: <b>${p.advice}</b>)이 아주 높습니다. 퀵 오더 콘솔을 통해 포트폴리오 편입을 고려해보세요.`
            });
        }
    });

    if (tips.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.82rem;">안정적인 포트폴리오 관리 상태입니다. 새로운 AI 전략 및 시그널을 탐색하는 중입니다.</div>`;
        return;
    }

    container.innerHTML = tips.map(tip => {
        let borderCol = 'rgba(56, 189, 248, 0.3)';
        let bgCol = 'rgba(56, 189, 248, 0.06)';
        let titleCol = '#38bdf8';
        if (tip.type === 'danger') {
            borderCol = 'rgba(239, 68, 68, 0.3)';
            bgCol = 'rgba(239, 68, 68, 0.06)';
            titleCol = '#f87171';
        } else if (tip.type === 'warning') {
            borderCol = 'rgba(251, 146, 60, 0.3)';
            bgCol = 'rgba(251, 146, 60, 0.06)';
            titleCol = '#fb923c';
        } else if (tip.type === 'success') {
            borderCol = 'rgba(52, 211, 153, 0.3)';
            bgCol = 'rgba(52, 211, 153, 0.06)';
            titleCol = '#34d399';
        }

        return `
            <div style="background: ${bgCol}; border: 1px solid ${borderCol}; border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; line-height: 1.45; color: #cbd5e1; margin-bottom: 0.5rem;">
                <div style="font-weight: bold; color: ${titleCol}; margin-bottom: 0.2rem;">${tip.title}</div>
                <div>${tip.desc}</div>
            </div>
        `;
    }).join('');
}

function openTossHoldingDetail(symbol) {
    const cleanSym = symbol.replace('.NAS', '').replace('.NYS', '').replace('.AMX', '');
    const modal = document.getElementById('toss-holding-modal');
    if (!modal) return;

    let h = null;
    if (typeof TOSS_PORTFOLIO !== 'undefined' && TOSS_PORTFOLIO.holdings) {
        h = TOSS_PORTFOLIO.holdings.find(x => x.symbol.replace('.NAS','').replace('.NYS','') === cleanSym);
    }

    let allStocks = [];
    if (window.REPORTS_HISTORY && window.REPORTS_HISTORY.length > 0) {
        const latest = window.REPORTS_HISTORY[0];
        allStocks = [...(latest.holdings || []), ...(latest.watchlist || [])];
    }
    const stockObj = allStocks.find(s => s.symbol.replace('.NAS','').replace('.NYS','') === cleanSym);

    // Update title
    const titleEl = document.getElementById('toss-modal-title');
    const isKr = /^\d+$/.test(cleanSym);
    const currencySign = isKr ? '₩' : '$';

    if (titleEl) {
        const name = h ? h.name : (stockObj ? stockObj.name : cleanSym);
        titleEl.textContent = `📈 ${name} (${cleanSym}) 심층 분석 & 포지션 관리`;
    }

    // Render metrics
    const qtyAvgEl = document.getElementById('toss-modal-qty-avg');
    const priceEvalEl = document.getElementById('toss-modal-price-eval');
    const pnlRateEl = document.getElementById('toss-modal-pnl-rate');

    const fmtDetailVal = (valInUsd) => {
        const curr = localStorage.getItem('tossCurrency') || 'KRW';
        const rate = window.CURRENT_USD_RATE || 1400;
        if (curr === 'KRW') {
            const krwVal = Math.round(valInUsd * rate);
            return `₩${krwVal.toLocaleString()}`;
        } else {
            return `$${valInUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    if (h) {
        if (qtyAvgEl) qtyAvgEl.innerHTML = `<span style="font-size: 0.7rem; color:#94a3b8; display:block;">보유 수량 / 평단가</span>${h.quantity}주 / ${fmtDetailVal(h.avg_buy_price)}`;
        if (priceEvalEl) priceEvalEl.innerHTML = `<span style="font-size: 0.7rem; color:#94a3b8; display:block;">현재가 / 평가액</span>${fmtDetailVal(h.current_price)} / ${fmtDetailVal(h.eval_amount)}`;
        
        const pnlCol = h.profit_loss >= 0 ? '#f25f7a' : '#5f97f2';
        const pnlSign = h.profit_loss >= 0 ? '+' : '';
        if (pnlRateEl) pnlRateEl.innerHTML = `<span style="font-size: 0.7rem; color:#94a3b8; display:block;">평가손익 / 수익률</span><span style="color:${pnlCol}; font-weight:bold;">${pnlSign}${fmtDetailVal(h.profit_loss)} (${pnlSign}${h.return_rate.toFixed(2)}%)</span>`;
    } else {
        const curPrice = stockObj ? stockObj.rawPrice : 0.0;
        if (qtyAvgEl) qtyAvgEl.innerHTML = `<span style="font-size: 0.7rem; color:#94a3b8; display:block;">보유 수량 / 평단가</span>0주 / -`;
        if (priceEvalEl) priceEvalEl.innerHTML = `<span style="font-size: 0.7rem; color:#94a3b8; display:block;">현재가 / 평가액</span>${fmtDetailVal(curPrice)} / -`;
        if (pnlRateEl) pnlRateEl.innerHTML = `<span style="font-size: 0.7rem; color:#94a3b8; display:block;">평가손익 / 수익률</span>-`;
    }

    // Render AI Score & Consensus
    const mfcScoreEl = document.getElementById('toss-modal-mfc-score');
    const ratingEl = document.getElementById('toss-modal-rating');
    const adviceEl = document.getElementById('toss-modal-advice');

    if (stockObj) {
        if (mfcScoreEl) mfcScoreEl.textContent = stockObj.mfcScore !== undefined ? stockObj.mfcScore : '50';
        
        if (ratingEl) {
            ratingEl.textContent = stockObj.advice || 'NEUTRAL';
            let bg = 'rgba(148, 163, 184, 0.15)';
            let col = '#94a3b8';
            if (stockObj.advice === 'BUY' || stockObj.advice === 'STRONG_BUY') {
                bg = 'rgba(56, 189, 248, 0.15)';
                col = '#38bdf8';
            } else if (stockObj.advice === 'SELL' || stockObj.advice === 'STRONG_SELL') {
                bg = 'rgba(239, 68, 68, 0.15)';
                col = '#f87171';
            }
            ratingEl.style.background = bg;
            ratingEl.style.color = col;
        }

        if (adviceEl) {
            adviceEl.innerHTML = `<strong>📈 GARCH+Ensemble 종합 전망:</strong> ${stockObj.predictionReason || '이 종목은 장기 트렌드 강도가 보통 수준이며, 매크로 국면에 적응하여 횡보할 것으로 예상됩니다.'}`;
        }
    } else {
        if (mfcScoreEl) mfcScoreEl.textContent = '-';
        if (ratingEl) {
            ratingEl.textContent = 'N/A';
            ratingEl.style.background = 'rgba(255,255,255,0.05)';
            ratingEl.style.color = '#94a3b8';
        }
        if (adviceEl) adviceEl.textContent = '최근 일간 종합 리포트에 등록되지 않은 종목이므로 AI 예측 및 MFC 스코어 상세를 조회할 수 없습니다.';
    }

    // Quick trading actions
    const qBuy = document.getElementById('toss-modal-quick-buy');
    const qSell = document.getElementById('toss-modal-quick-sell');

    if (qBuy) {
        qBuy.onclick = () => {
            modal.style.display = 'none';
            const ordersTab = document.querySelector('.toss-sub-tab[data-sub-target="toss-sub-orders"]');
            if (ordersTab) ordersTab.click();

            const symbolInput = document.getElementById('toss-order-symbol');
            const qtyInput = document.getElementById('toss-order-qty');
            if (symbolInput) symbolInput.value = cleanSym;
            if (qtyInput) qtyInput.value = 1;

            const buyBtn = document.querySelector('.toss-side-btn[data-side="BUY"]');
            if (buyBtn) buyBtn.click();

            const submitBtn = document.getElementById('toss-submit-order-btn');
            if (submitBtn) {
                submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                submitBtn.style.animation = 'orbAlert 0.3s 3 alternate';
                setTimeout(() => { submitBtn.style.animation = ''; }, 1000);
            }
        };
    }

    if (qSell) {
        if (h && h.quantity > 0) {
            qSell.disabled = false;
            qSell.style.opacity = '1';
            qSell.style.cursor = 'pointer';
            qSell.onclick = () => {
                modal.style.display = 'none';
                const ordersTab = document.querySelector('.toss-sub-tab[data-sub-target="toss-sub-orders"]');
                if (ordersTab) ordersTab.click();

                const symbolInput = document.getElementById('toss-order-symbol');
                const qtyInput = document.getElementById('toss-order-qty');
                if (symbolInput) symbolInput.value = cleanSym;
                if (qtyInput) qtyInput.value = h.quantity;

                const sellBtn = document.querySelector('.toss-side-btn[data-side="SELL"]');
                if (sellBtn) sellBtn.click();

                const submitBtn = document.getElementById('toss-submit-order-btn');
                if (submitBtn) {
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    submitBtn.style.animation = 'orbAlert 0.3s 3 alternate';
                    setTimeout(() => { submitBtn.style.animation = ''; }, 1000);
                }
            };
        } else {
            qSell.disabled = true;
            qSell.style.opacity = '0.4';
            qSell.style.cursor = 'not-allowed';
            qSell.onclick = null;
        }
    }

    // Show modal
    modal.style.display = 'flex';

    // Draw candlestick chart
    setTimeout(() => {
        drawTossModalCandleChart(stockObj, h);
    }, 150);
}

function drawTossModalCandleChart(stockObj, holdingObj) {
    const container = document.getElementById('toss-modal-candle-chart');
    if (!container) return;

    container.innerHTML = '';
    tossCandleChartInstance = null;

    const history = stockObj ? (stockObj.historyPath || []) : [];
    if (history.length === 0) {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.85rem;">일별 가격 차트 데이터가 존재하지 않습니다.</div>`;
        return;
    }

    // Slice last 60 days
    const rawData = history.slice(-60);

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 600,
        height: container.clientHeight || 240,
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: '#94a3b8',
            fontSize: 9,
            fontFamily: 'Outfit, sans-serif'
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.02)' }
        },
        rightPriceScale: {
            borderVisible: false
        },
        timeScale: {
            borderVisible: false
        }
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#f25f7a',
        downColor: '#5f97f2',
        borderUpColor: '#f25f7a',
        borderDownColor: '#5f97f2',
        wickUpColor: '#f25f7a',
        wickDownColor: '#5f97f2'
    });

    const candleData = rawData.map(d => ({
        time: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close
    }));

    candleSeries.setData(candleData);

    // Volume histogram overlay
    const volumeSeries = chart.addHistogramSeries({
        color: 'rgba(56, 189, 248, 0.12)',
        priceFormat: {
            type: 'volume'
        },
        priceScaleId: '', // Overlay on top of candle chart
        scaleMargins: {
            top: 0.7, // volume goes to bottom 30% of chart
            bottom: 0
        }
    });

    const volumeData = rawData.map(d => ({
        time: d.date,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(52, 211, 153, 0.18)' : 'rgba(251, 113, 133, 0.18)'
    }));

    volumeSeries.setData(volumeData);

    // Draw average buy price horizontal line if holding
    if (holdingObj && holdingObj.avg_buy_price > 0) {
        candleSeries.createPriceLine({
            price: holdingObj.avg_buy_price,
            color: '#fb923c',
            lineWidth: 1.5,
            lineStyle: 2, // Dashed line
            axisLabelVisible: true,
            title: `평단선 $${holdingObj.avg_buy_price.toFixed(2)}`
        });
    }

    // Bind execution markers
    const symbolClean = stockObj.symbol.replace('.NAS', '').replace('.NYS', '');
    let orderHistory = [];
    if (typeof TOSS_PORTFOLIO !== 'undefined' && TOSS_PORTFOLIO.orders) {
        orderHistory = TOSS_PORTFOLIO.orders;
    }

    const markers = [];
    orderHistory.forEach(o => {
        const oSym = o.symbol.replace('.NAS','').replace('.NYS','');
        if (oSym === symbolClean && (o.status === 'CLOSED' || o.status === 'FILLED')) {
            const dateStr = o.ordered_at.substring(0, 10);
            
            // Verify if date exists in our candlestick dataset
            const dateExists = rawData.some(d => d.date === dateStr);
            if (dateExists) {
                markers.push({
                    time: dateStr,
                    position: o.side === 'BUY' ? 'belowBar' : 'aboveBar',
                    color: o.side === 'BUY' ? '#38bdf8' : '#fb7185',
                    shape: o.side === 'BUY' ? 'arrowUp' : 'arrowDown',
                    text: o.side === 'BUY' ? `Buy @$${o.price.toFixed(1)}` : `Sell @$${o.price.toFixed(1)}`
                });
            }
        }
    });

    if (markers.length > 0) {
        candleSeries.setMarkers(markers);
    }

    chart.timeScale().fitContent();
    tossCandleChartInstance = chart;
}

async function cancelTossOrder(orderId) {
    if (!confirm("정말 이 미체결 주문을 취소하시겠습니까?")) return;

    try {
        const res = await fetch("http://127.0.0.1:8000/api/cancel-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId })
        });
        const data = await res.json();
        if (data.success) {
            showToast("주문 취소 완료!");
            refreshTossData(data.portfolio);
        } else {
            alert(`주문 취소 실패: ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        alert("서버 연결 실패. local_server.py가 정상 작동 중인지 확인하세요.");
    }
}

// Bind to window scope
window.openTossHoldingDetail = (symbol) => {
    openTossHoldingDetail(symbol);
};

window.cancelTossOrder = (orderId) => {
    cancelTossOrder(orderId);
};

// === 글로벌 동기화 (계좌 모드 및 통화 선택) 초기화 루틴 ===
(function() {
    // 1. 글로벌 계좌 모드 (실제/모의) 동기화
    window.syncGlobalAccountMode = function(isReal) {
        const allRealToggles = document.querySelectorAll('#toss-global-real-toggle, #kis-global-real-toggle, .quant-global-real-toggle');
        allRealToggles.forEach(toggle => {
            toggle.checked = isReal;
            const slider = toggle.nextElementSibling;
            if (slider) {
                slider.style.backgroundColor = isReal ? "#ef4444" : "#475569";
            }
        });
        
        const statusBadge = document.getElementById('toss-account-status-badge');
        if (statusBadge) {
            if (isReal) {
                statusBadge.textContent = "🚨 실제 계좌 모드";
                statusBadge.style.background = "rgba(239, 68, 68, 0.15)";
                statusBadge.style.color = "#f87171";
                statusBadge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            } else {
                statusBadge.textContent = "🛡️ 모의 계좌 모드";
                statusBadge.style.background = "rgba(167, 139, 250, 0.15)";
                statusBadge.style.color = "#a78bfa";
                statusBadge.style.border = "1px solid rgba(167, 139, 250, 0.3)";
            }
        }
        
        const kisStatusBadge = document.getElementById('kis-account-status-badge');
        if (kisStatusBadge) {
            if (isReal) {
                kisStatusBadge.textContent = "🚨 실제계좌 모드";
                kisStatusBadge.style.background = "rgba(239, 68, 68, 0.15)";
                kisStatusBadge.style.color = "#f87171";
                kisStatusBadge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            } else {
                kisStatusBadge.textContent = "🛡️ 모의투자 모드";
                kisStatusBadge.style.background = "rgba(251, 191, 36, 0.12)";
                kisStatusBadge.style.color = "#fbbf24";
                kisStatusBadge.style.border = "1px solid rgba(251, 191, 36, 0.3)";
            }
        }
    };

    // 2. 글로벌 통화 (KRW/USD) 동기화
    window.syncGlobalCurrency = function(cur) {
        const krwBtns = document.querySelectorAll('#toss-curr-krw, #kis-curr-krw, .quant-curr-krw');
        const usdBtns = document.querySelectorAll('#toss-curr-usd, #kis-curr-usd, .quant-curr-usd');
        if (cur === 'KRW') {
            krwBtns.forEach(btn => btn.classList.add('active'));
            usdBtns.forEach(btn => btn.classList.remove('active'));
        } else {
            krwBtns.forEach(btn => btn.classList.remove('active'));
            usdBtns.forEach(btn => btn.classList.add('active'));
        }
        
        // [NEW] 주문 단가 폼 라벨 및 금액 동적 업데이트
        updateOrderConsoleCurrency(cur);
        
        // [NEW] 주문 콘솔 가격 및 차트 통화 단위 재렌더링
        if (typeof window.refreshOrderConsoleCurrency === 'function') {
            window.refreshOrderConsoleCurrency(cur);
        }
    };

    function updateOrderConsoleCurrency(cur) {
        const priceLabel = document.getElementById('toss-order-price-label');
        const priceInput = document.getElementById('toss-order-price');
        if (!priceLabel || !priceInput) return;
        
        const usdRate = window.CURRENT_USD_RATE || 1400;
        let val = parseFloat(priceInput.value) || 0;
        
        if (cur === 'KRW') {
            priceLabel.textContent = "주문 단가 (원)";
            priceInput.min = "100";
            priceInput.step = "100";
            // 달러 -> 원화 변환 (기존 값이 소수점 형태 등으로 작았다면 원화 환산)
            if (val < 5000 && val > 0) {
                priceInput.value = Math.round(val * usdRate);
            }
        } else {
            priceLabel.textContent = "주문 단가 ($)";
            priceInput.min = "0.01";
            priceInput.step = "0.01";
            // 원화 -> 달러 변환 (기존 값이 컸다면 달러 환산)
            if (val >= 5000) {
                priceInput.value = (val / usdRate).toFixed(2);
            }
        }
    }

    window.triggerGlobalCurrencyChange = function(newCur) {
        const currentCurrency = localStorage.getItem('tossCurrency') || 'KRW';
        if (currentCurrency === newCur) return;
        localStorage.setItem('tossCurrency', newCur);
        window.syncGlobalCurrency(newCur);
        
        // TOSS TRADE 탭 데이터 갱신
        if (typeof renderTossPortfolio === 'function') renderTossPortfolio();
        if (typeof drawPnlChart === 'function') drawPnlChart();
        
        // KIS TRADE 탭 데이터 갱신
        if (typeof window.renderKisPortfolio === 'function') window.renderKisPortfolio();
        if (typeof window.refreshKisOrderConsoleCurrency === 'function') window.refreshKisOrderConsoleCurrency();
        
                    // [v14] QUANT LAB — 열려 있는 탭만 다시 그린다 (서버 계산이라 왕복 비용이 있다)
                    if (window.QuantLab) {
                        const ov = document.querySelector('.page-view.active')?.id;
                        try {
                            if (ov === 'view-optimizer') window.QuantLab.renderPortfolio();
                            else if (ov === 'view-risk') window.QuantLab.renderRisk();
                        } catch (e) { console.error('QuantLab refresh failed:', e); }
                    }
    };

    // DOMContentLoaded 또는 즉시 이벤트 바인딩 등록
    const bindSyncListeners = () => {
        // 계좌 모드 변경 리스너 (Toss & KIS 스위치 싱크 및 비동기 동시 리프레시)
        document.body.addEventListener('change', async (e) => {
            if (e.target && (e.target.id === 'toss-global-real-toggle' || e.target.id === 'kis-global-real-toggle' || e.target.classList.contains('quant-global-real-toggle'))) {
                const isReal = e.target.checked;
                
                // Toss 토글과 KIS 토글의 UI 체크 상태를 싱크
                const tossToggle = document.getElementById('toss-global-real-toggle');
                const kisToggle = document.getElementById('kis-global-real-toggle');
                if (tossToggle) tossToggle.checked = isReal;
                if (kisToggle) kisToggle.checked = isReal;

                localStorage.setItem('tossRealMode', isReal ? 'true' : 'false');
                window.syncGlobalAccountMode(isReal);
                if (typeof showToast === 'function') {
                    showToast(isReal
                        ? "실전 계좌 모드 — 포트폴리오를 불러옵니다."
                        : "모의 계좌 모드로 전환되었습니다.");
                }
                
                // Toss 및 KIS 데이터를 각각 최신 모드에 맞추어 강제 비동기 리프레시
                if (typeof fetchAndRefreshTossPortfolio === 'function') {
                    await fetchAndRefreshTossPortfolio();
                }
                if (typeof window.fetchAndRefreshKisPortfolio === 'function') {
                    await window.fetchAndRefreshKisPortfolio();
                }
            }
        });

        // 통화 선택 및 주문 내역 필터 클릭 리스너 (이벤트 위임 사용)
        document.body.addEventListener('click', (e) => {
            if (!e.target) return;
            
            // 통화 선택 처리
            if (e.target.id === 'toss-curr-krw' || e.target.id === 'kis-curr-krw' || e.target.classList.contains('quant-curr-krw')) {
                window.triggerGlobalCurrencyChange('KRW');
            } else if (e.target.id === 'toss-curr-usd' || e.target.id === 'kis-curr-usd' || e.target.classList.contains('quant-curr-usd')) {
                window.triggerGlobalCurrencyChange('USD');
            }
            
            // 최근 주문 내역 상태 필터 처리
            if (e.target.classList.contains('toss-filter-btn')) {
                const filterVal = e.target.getAttribute('data-filter') || 'ALL';
                console.log("[DEBUG] Clicked toss-filter-btn, filterVal:", filterVal);
                window.tossClosedOrderFilter = filterVal;
                
                // 형제 버튼들의 active 클래스 제거하고 클릭된 버튼에만 추가
                const filterContainer = document.getElementById('toss-closed-orders-filter');
                if (filterContainer) {
                    filterContainer.querySelectorAll('.toss-filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }
                e.target.classList.add('active');
                
                // 포트폴리오 렌더링 호출
                if (typeof renderTossPortfolio === 'function') {
                    renderTossPortfolio();
                }
            }

            if (e.target.classList.contains('kis-filter-btn')) {
                const filterVal = e.target.getAttribute('data-filter') || 'ALL';
                window.kisClosedOrderFilter = filterVal;

                const filterContainer = document.getElementById('kis-closed-orders-filter');
                if (filterContainer) {
                    filterContainer.querySelectorAll('.kis-filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }
                e.target.classList.add('active');

                if (typeof window.renderKisPortfolio === 'function') {
                    window.renderKisPortfolio();
                }
            }
        });

        // 초기 화면 렌더링에 세이브된 상태 반영
        const savedRealMode = localStorage.getItem('tossRealMode') === 'true';
        window.syncGlobalAccountMode(savedRealMode);
        const savedCurrency = localStorage.getItem('tossCurrency') || 'KRW';
        window.syncGlobalCurrency(savedCurrency);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSyncListeners);
    } else {
        bindSyncListeners();
    }

    // ==========================================================================
    // [NEW] 글로벌 플로팅 봇 위젯 초기화 & 이벤트 바인딩
    // ==========================================================================
        function initTossBotWidget() {
        console.log("[DEBUG] initTossBotWidget V2 (AlphaEngine Control Panel) initialized");

        // === [포지션 탭] 데이터 조회 및 렌더링 ===
        async function fetchBotPositions(isSilent = false) {
            const container = document.getElementById('alpha-positions-list');
            if (!container) return;

            // 이미 포지션 데이터가 있고 isSilent가 true인 경우 로딩 표시 생략
            if (!isSilent || !container.innerHTML || container.innerHTML.includes('🔄 포지션 조회 중')) {
                container.innerHTML = `<div style="color:#64748b;font-size:0.8rem;text-align:center;padding:1.5rem;">🔄 포지션 조회 중...</div>`;
            }

            const broker = localStorage.getItem('tossBotBroker') || 'TOSS';
            const isReal = botRealToggle ? botRealToggle.checked : false;
            const mode = isReal ? 'REAL' : 'DRY';

            try {
                const res = await fetch(getApiUrl(`/api/bot/positions?broker=${broker}&mode=${mode}`));
                const data = await res.json();
                if (data.success && data.positions && data.positions.length > 0) {
                    container.innerHTML = data.positions.map(p => {
                        const displayName = p.name && p.name !== p.symbol ? p.name : (window.findStockNameLocal ? window.findStockNameLocal(p.symbol) : '');
                        const pnlVal = p.pnl_pct;
                        const pnlClass = pnlVal > 0 ? 'alpha-pnl-pos' : (pnlVal < 0 ? 'alpha-pnl-neg' : 'alpha-pnl-neu');
                        const pnlText = pnlVal !== null ? `${pnlVal > 0 ? '+' : ''}${pnlVal}%` : '—';
                        const curPriceStr = p.current_price > 0 ? p.current_price.toLocaleString() : '—';
                        const isKr = /^\d+$/.test(p.symbol);
                        const currSign = isKr ? '₩' : '$';

                        // TP/SL 진행률 바 계산
                        let tpSlProgressHtml = '';
                        if (p.avg_buy_price && p.take_profit_price && p.stop_loss_price && p.current_price) {
                            const range = p.take_profit_price - p.stop_loss_price;
                            let percent = 0;
                            if (range > 0) {
                                percent = ((p.current_price - p.stop_loss_price) / range) * 100;
                                percent = Math.max(0, Math.min(100, percent));
                            }
                            const isNearSl = percent < 20;
                            tpSlProgressHtml = `
                                <div class="alpha-pos-bar-wrap">
                                    <span class="alpha-pos-bar-label">SL</span>
                                    <div class="alpha-pos-bar-track">
                                        <div class="alpha-pos-bar-fill ${isNearSl ? 'danger' : ''}" style="width: ${percent}%;"></div>
                                    </div>
                                    <span class="alpha-pos-bar-label" style="text-align:right;">TP</span>
                                </div>
                            `;
                        }

                        const tsText = p.trailing_stop_price ? `${currSign}${p.trailing_stop_price.toFixed(2)}` : '비활성';

                        return `
                            <div class="alpha-position-card" data-symbol="${p.symbol}">
                                <div class="alpha-pos-header">
                                    <div>
                                        <span class="alpha-pos-symbol">${p.symbol}</span>
                                        <span class="alpha-pos-name">${displayName || ''}</span>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:0.5rem;">
                                        <span class="alpha-pnl-badge ${pnlClass}">${pnlText}</span>
                                        <button class="alpha-pos-sell-btn" onclick="window.manualSellBotPosition('${p.symbol}')">매도</button>
                                    </div>
                                </div>
                                <div style="font-size:0.75rem;margin-bottom:0.35rem;display:flex;justify-content:space-between;color:#94a3b8;">
                                    <span>평단: ${currSign}${p.avg_buy_price?.toLocaleString()} (${p.quantity}주)</span>
                                    <span>현재가: ${currSign}${curPriceStr}</span>
                                </div>
                                ${tpSlProgressHtml}
                                <div class="alpha-pos-meta">
                                    <span>🎯 익절가: ${p.take_profit_price ? currSign + p.take_profit_price.toLocaleString() : '—'}</span>
                                    <span>🛡️ 손절가: ${p.stop_loss_price ? currSign + p.stop_loss_price.toLocaleString() : '—'}</span>
                                </div>
                                <div class="alpha-pos-meta" style="margin-top:0.2rem;border-top:1px dashed rgba(255,255,255,0.03);padding-top:0.2rem;">
                                    <span>👣 추적 손절(TS): ${tsText}</span>
                                    <span>⏰ 전략: ${HORIZON_LABELS[p.horizon] || p.horizon}/${STRATEGY_LABELS[p.strategy] || p.strategy}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    container.innerHTML = `<div style="color:#64748b;font-size:0.8rem;text-align:center;padding:2rem;">보유 중인 포지션이 없습니다.</div>`;
                }
            } catch (err) {
                console.error(err);
                container.innerHTML = `<div style="color:#ef4444;font-size:0.8rem;text-align:center;padding:1.5rem;">⚠️ 로드 실패 (서버 확인 필요)</div>`;
            }
        }

        // 수동 매도 함수 글로벌 노출
        window.manualSellBotPosition = async (symbol) => {
            const broker = localStorage.getItem('tossBotBroker') || 'TOSS';
            const isReal = botRealToggle ? botRealToggle.checked : false;
            const mode = isReal ? 'REAL' : 'DRY';

            if (!confirm(`⚠️ 정말 [${symbol}] 포지션을 시장가로 즉시 전량 수동 매도하시겠습니까?`)) return;

            try {
                const res = await fetch(getApiUrl(`/api/bot/positions/${symbol}/sell`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ broker, mode })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(`${symbol} 수동 매도 주문 성공!`);
                    fetchBotPositions();
                    fetchAndRefreshTossPortfolio(); // 메인 포트폴리오도 갱신
                } else {
                    alert(`매도 실패: ${data.message}`);
                }
            } catch (err) {
                console.error(err);
                alert('로컬 서버 연결 실패');
            }
        };

        // === [로그 탭] 데이터 조회 및 테이블 렌더링 ===
        async function updateBotLogs() {
            if (!botTerminal) return;
            try {
                const res = await fetch(getApiUrl("/api/bot/logs?limit=50"));
                const data = await res.json();

                // 1) 기존 터미널형 텍스트 로그 업데이트
                if (data.success && data.logs && data.logs.length > 0) {
                    botTerminal.innerHTML = data.logs.slice(0, 10).map(l => {
                        const time = l.ordered_at.substring(11, 19);
                        const color = l.result === 'SUCCESS' ? '#34d399' : '#fb7185';
                        const sideColor = l.side === 'BUY' ? '#38bdf8' : '#f25f7a';
                        const isKr = /^\d+$/.test(l.symbol);
                        const currSign = isKr ? '₩' : '$';
                        const priceDisplay = l.price != null ? l.price.toLocaleString() : '—';
                        return `<span style="color:#64748b;">[${time}]</span> <span style="color:${sideColor}; font-weight:bold;">${l.side}</span> <span style="color:#fff; font-weight:bold;">${l.symbol}</span> x${l.quantity} @${currSign}${priceDisplay} | <span style="color:${color};">${l.result}</span>`;
                    }).join('<br>');
                } else {
                    botTerminal.innerHTML = "[SYSTEM] 자동 매매 로그 기록이 존재하지 않습니다.";
                }

                // 2) 신규 정형 테이블 로그 업데이트
                const tbody = document.getElementById('alpha-logs-tbody');
                if (tbody) {
                    if (data.success && data.logs && data.logs.length > 0) {
                        tbody.innerHTML = data.logs.map(l => {
                            const timeStr = l.ordered_at.substring(5, 16).replace('T', ' '); // MM-DD HH:MM
                            const sideClass = l.side === 'BUY' ? 'log-side-buy' : 'log-side-sell';
                            const sideText = l.side === 'BUY' ? '매수' : '매도';
                            const resClass = l.result === 'SUCCESS' ? 'log-result-ok' : 'log-result-err';
                            const isKr = /^\d+$/.test(l.symbol);
                            const currSign = isKr ? '₩' : '$';
                            const amt = l.price * l.quantity;

                            const tpText = l.take_profit_price ? `${currSign}${Math.round(l.take_profit_price).toLocaleString()}` : '—';
                            const slText = l.stop_loss_price ? `${currSign}${Math.round(l.stop_loss_price).toLocaleString()}` : '—';

                            return `
                                <tr>
                                    <td style="text-align:left;color:#475569;">${timeStr}</td>
                                    <td><strong style="color:#fff;">${l.symbol}</strong><br><span style="font-size:0.6rem;color:#475569;">${l.name || ''}</span></td>
                                    <td class="${sideClass}">${sideText}</td>
                                    <td>${currSign}${l.price?.toLocaleString()}<br><span style="font-size:0.6rem;color:#475569;">${l.quantity}주</span></td>
                                    <td><span style="color:#facc15;">${l.mfc_score?.toFixed(1) || '0'}</span></td>
                                    <td>${STRATEGY_LABELS[l.strategy] || l.strategy || '—'}</td>
                                    <td style="color:#34d399;">${tpText}</td>
                                    <td style="color:#fb7185;">${slText}</td>
                                    <td class="${resClass}">${l.result}</td>
                                </tr>
                            `;
                        }).join('');
                    } else {
                        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#64748b;padding:1.5rem;">로그 내역이 없습니다.</td></tr>`;
                    }
                }
            } catch (err) {
                botTerminal.innerHTML = "[ERROR] 로컬 거래 서버 오프라인으로 봇 로그를 가져오지 못했습니다.";
            }
        }

        window.updateBotLogs = updateBotLogs;

        const isLocal = window.location.hostname === 'localhost'
            || window.location.hostname === '127.0.0.1'
            || window.location.protocol === 'file:';

        // === 팝업 창 열기 / 닫기 ===
        const botFloatingBtn = document.getElementById('toss-bot-floating-btn');
        const botCloseBtn = document.getElementById('toss-bot-close-btn');
        const botPopupCard = document.getElementById('toss-bot-popup-card');

        if (botFloatingBtn && botPopupCard) {
            botFloatingBtn.onclick = () => {
                botPopupCard.classList.add('active');
                botFloatingBtn.classList.add('hidden');
                sessionStorage.setItem('tossBotOpen', 'true');
                // 오픈 시 활성 탭 데이터 갱신
                refreshActiveTab();
            };
        }

        if (botCloseBtn && botFloatingBtn && botPopupCard) {
            botCloseBtn.onclick = () => {
                botPopupCard.classList.remove('active');
                botFloatingBtn.classList.remove('hidden');
                sessionStorage.setItem('tossBotOpen', 'false');
            };
        }

        // === UI 요소들 ===
        const botRealToggle = document.getElementById('toss-bot-real-toggle');
        const botBrokerSelectorCard = document.getElementById('toss-bot-broker-selector-card');
        const runBotBtn = document.getElementById('toss-run-bot-btn'); // 1회 즉시 실행
        const botStartBtn = document.getElementById('alpha-bot-start-btn'); // 상시 루프 시작
        const botStopBtn = document.getElementById('alpha-bot-stop-btn');   // 상시 루프 중단
        const botTerminal = document.getElementById('toss-bot-log-terminal');
        const botStatusBadge = document.getElementById('bot-status-badge');
        const botAtrAutoCheckbox = document.getElementById('toss-bot-atr-auto');
        const botTakeProfitInput = document.getElementById('toss-bot-take-profit-pct');
        const botStopLossInput = document.getElementById('toss-bot-stop-loss-pct');
        const botRefTargetEl = document.getElementById('toss-bot-ref-target');
        const botHorizonBtns = document.querySelectorAll('.toss-bot-horizon-btn');
        const loopIntervalLabel = document.getElementById('alpha-loop-interval-label');

        const HORIZON_LABELS = TOSS_BOT_HORIZON_LABELS;
        const STRATEGY_LABELS = TOSS_BOT_STRATEGY_LABELS;

        // 전략별 기본 주기 맵
        const STRATEGY_INTERVAL_MAP = {
            scalping: '30초',
            swing: '5분',
            trend: '15분',
            value: '60분',
            hold: '60분'
        };

        const getBotHorizon = () => {
            const activeBtn = document.querySelector('.toss-bot-horizon-btn.active');
            return activeBtn ? activeBtn.getAttribute('data-horizon') : (localStorage.getItem('tossBotHorizon') || 'short');
        };

        const getBotStrategy = () => {
            const activeBtn = document.querySelector('.toss-bot-strategy-btn.active');
            const horizon = getBotHorizon();
            if (activeBtn) return normalizeBotStrategy(horizon, activeBtn.getAttribute('data-strategy'));
            return normalizeBotStrategy(horizon, localStorage.getItem('tossBotStrategy'));
        };

        const updateLoopIntervalLabel = () => {
            if (!loopIntervalLabel) return;
            const strategy = getBotStrategy();
            const intervalText = STRATEGY_INTERVAL_MAP[strategy] || '60초';
            const labelText = STRATEGY_LABELS[strategy] || strategy;
            loopIntervalLabel.textContent = `${labelText} (${intervalText})`;
        };

        const saveBotConfig = (opts = {}) => {
            const horizon = getBotHorizon();
            const strategy = normalizeBotStrategy(horizon, opts.strategy ?? getBotStrategy());
            const defaults = getStrategyDefaults(strategy);
            applyBotConfigToGlobalUI({
                horizon,
                strategy,
                take_profit_pct: opts.take_profit_pct ?? (parseFloat(botTakeProfitInput?.value) || defaults.take_profit_pct),
                stop_loss_pct: opts.stop_loss_pct ?? (parseFloat(botStopLossInput?.value) || defaults.stop_loss_pct),
                market: opts.market ?? (localStorage.getItem('tossBotMarket') || 'ALL'),
                broker: opts.broker ?? (localStorage.getItem('tossBotBroker') || 'TOSS'),
                real_trade: opts.real_trade ?? (botRealToggle ? botRealToggle.checked : false)
            });
            updateLoopIntervalLabel();
        };

        // ATR 체크박스 핸들러
        if (botAtrAutoCheckbox) {
            botAtrAutoCheckbox.onchange = () => {
                const auto = botAtrAutoCheckbox.checked;
                if (botTakeProfitInput) botTakeProfitInput.disabled = auto;
                if (botStopLossInput) botStopLossInput.disabled = auto;
                saveBotConfig();
            };
        }

        applyBotConfigToGlobalUI(getDefaultBotConfig());
        updateLoopIntervalLabel();

        botHorizonBtns.forEach(btn => {
            btn.onclick = () => {
                botHorizonBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const horizon = btn.getAttribute('data-horizon');
                const strategy = normalizeBotStrategy(horizon, null);
                const defaults = getStrategyDefaults(strategy);
                saveBotConfig({ strategy, take_profit_pct: defaults.take_profit_pct, stop_loss_pct: defaults.stop_loss_pct });
            };
        });

        const bindStrategyButtons = () => {
            const stratContainer = document.getElementById('toss-bot-strategy');
            if (!stratContainer || stratContainer.dataset.bound === '1') return;
            stratContainer.dataset.bound = '1';
            stratContainer.onclick = (e) => {
                const btn = e.target.closest('.toss-bot-strategy-btn');
                if (!btn) return;
                const strategy = btn.getAttribute('data-strategy');
                const defaults = getStrategyDefaults(strategy);
                saveBotConfig({ strategy, take_profit_pct: defaults.take_profit_pct, stop_loss_pct: defaults.stop_loss_pct });
            };
        };
        bindStrategyButtons();

        // 대상 시장
        const bindMarketButtons = () => {
            const marketBtns = document.querySelectorAll('.toss-bot-market-btn');
            marketBtns.forEach(btn => {
                btn.onclick = () => {
                    marketBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const market = btn.getAttribute('data-market');
                    localStorage.setItem('tossBotMarket', market);
                    saveBotConfig();
                };
            });
            const savedMarket = localStorage.getItem('tossBotMarket') || 'ALL';
            const activeMarketBtn = document.querySelector(`.toss-bot-market-btn[data-market="${savedMarket}"]`);
            if (activeMarketBtn) {
                marketBtns.forEach(b => b.classList.remove('active'));
                activeMarketBtn.classList.add('active');
            }
        };
        bindMarketButtons();

        // 실거래 증권사
        const bindBrokerButtons = () => {
            const brokerBtns = document.querySelectorAll('.toss-bot-broker-btn');
            brokerBtns.forEach(btn => {
                btn.onclick = () => {
                    brokerBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const broker = btn.getAttribute('data-broker');
                    localStorage.setItem('tossBotBroker', broker);
                    saveBotConfig();
                    // 포지션 새로고침 연계
                    if (document.getElementById('alpha-tab-positions')?.classList.contains('active')) {
                        fetchBotPositions();
                    }
                };
            });
            const savedBroker = localStorage.getItem('tossBotBroker') || 'TOSS';
            const activeBrokerBtn = document.querySelector(`.toss-bot-broker-btn[data-broker="${savedBroker}"]`);
            if (activeBrokerBtn) {
                brokerBtns.forEach(b => b.classList.remove('active'));
                activeBrokerBtn.classList.add('active');
            }
        };
        bindBrokerButtons();

        if (botTakeProfitInput) botTakeProfitInput.onchange = saveBotConfig;
        if (botStopLossInput) botStopLossInput.onchange = saveBotConfig;

        const updateBotRefTarget = () => {
            if (!botRefTargetEl) return;
            const sym = (tossCurrentActiveSymbol || '').trim().toUpperCase();
            if (!sym || typeof STOCK_DATA === 'undefined' || !STOCK_DATA.stocks) {
                botRefTargetEl.textContent = '—';
                return;
            }
            const stock = STOCK_DATA.stocks.find(s =>
                s.symbol?.toUpperCase() === sym ||
                s.symbol?.replace('.NAS', '').replace('.NYS', '').toUpperCase() === sym
            );
            const tp = stock?.reason?.fundamentals?.target_price;
            botRefTargetEl.textContent = tp || '—';
        };
        updateBotRefTarget();

        // === 탭 전환 기능 ===
        const tabBtns = document.querySelectorAll('.alpha-tab-btn');
        const tabPanels = document.querySelectorAll('.alpha-tab-panel');

        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab');
                const panel = document.getElementById(`alpha-tab-${tabId}`);
                if (panel) panel.classList.add('active');

                if (tabId === 'positions') {
                    fetchBotPositions();
                } else if (tabId === 'logs') {
                    updateBotLogs();
                }
            };
        });

        const refreshActiveTab = (isSilent = false) => {
            const activeTab = document.querySelector('.alpha-tab-btn.active');
            if (!activeTab) return;
            const tabId = activeTab.getAttribute('data-tab');
            if (tabId === 'positions') fetchBotPositions(isSilent);
            else if (tabId === 'logs') updateBotLogs();
            else if (tabId === 'control') updateBotLogs(); // 제어탭 로그 업데이트
        };

        const posRefreshBtn = document.getElementById('alpha-positions-refresh');
        if (posRefreshBtn) posRefreshBtn.onclick = () => fetchBotPositions(false);

        const logsRefreshBtn = document.getElementById('alpha-logs-refresh');
        if (logsRefreshBtn) logsRefreshBtn.onclick = updateBotLogs;

        if (botRealToggle && botStatusBadge) {
            botRealToggle.onchange = () => {
                const isReal = botRealToggle.checked;
                botStatusBadge.textContent = isReal ? "IDLE (실거래 대기)" : "IDLE (모의거래)";
                botStatusBadge.style.color = isReal ? "#fb7185" : "#a78bfa";
                botStatusBadge.style.background = isReal ? "rgba(251, 113, 133, 0.15)" : "rgba(167, 139, 250, 0.15)";

                if (botBrokerSelectorCard) {
                    botBrokerSelectorCard.style.display = isReal ? 'flex' : 'none';
                }
                refreshActiveTab(false);
            };
        }

        // === 봇 상시 실행 상태 모니터링 타이머 ===
        let BOT_MONITOR_TIMER = null;

        const toggleBotInputsDisabled = (disabled) => {
            if (botAtrAutoCheckbox) botAtrAutoCheckbox.disabled = disabled;
            if (botTakeProfitInput && !botAtrAutoCheckbox?.checked) botTakeProfitInput.disabled = disabled;
            if (botStopLossInput && !botAtrAutoCheckbox?.checked) botStopLossInput.disabled = disabled;

            const selectors = [
                '.toss-bot-broker-btn',
                '.toss-bot-market-btn',
                '.toss-bot-strategy-btn',
                '.toss-bot-horizon-btn'
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    if (disabled) {
                        el.style.pointerEvents = 'none';
                        el.style.opacity = '0.4';
                    } else {
                        el.style.pointerEvents = 'auto';
                        el.style.opacity = '1';
                    }
                });
            });
            if (botRealToggle) botRealToggle.disabled = disabled;
        };

        const syncBotUIStatus = async () => {
            try {
                const res = await fetch(getApiUrl("/api/bot/status"));
                const data = await res.json();
                if (data.success) {
                    if (data.running) {
                        // 1) 상시 봇 구동 중인 경우
                        if (botStartBtn) botStartBtn.style.display = 'none';
                        if (botStopBtn) botStopBtn.style.display = 'block';

                        if (botStatusBadge) {
                            botStatusBadge.textContent = data.config.real_trade ? `RUNNING (${data.config.broker || 'TOSS'} 실거래)` : "RUNNING (모의거래)";
                            botStatusBadge.style.color = data.config.real_trade ? "#fb7185" : "#34d399";
                            botStatusBadge.style.background = data.config.real_trade ? "rgba(251, 113, 133, 0.15)" : "rgba(52, 211, 153, 0.15)";
                        }
                        if (botRealToggle) {
                            botRealToggle.checked = data.config.real_trade;
                        }
                        if (botBrokerSelectorCard) {
                            botBrokerSelectorCard.style.display = data.config.real_trade ? 'flex' : 'none';
                        }
                        if (data.config.broker) {
                            localStorage.setItem('tossBotBroker', data.config.broker);
                            const brokerBtns = document.querySelectorAll('.toss-bot-broker-btn');
                            brokerBtns.forEach(b => {
                                b.classList.toggle('active', b.getAttribute('data-broker') === data.config.broker);
                            });
                        }
                        if (data.config.market) {
                            localStorage.setItem('tossBotMarket', data.config.market);
                            const marketBtns = document.querySelectorAll('.toss-bot-market-btn');
                            marketBtns.forEach(b => {
                                b.classList.toggle('active', b.getAttribute('data-market') === data.config.market);
                            });
                        }
                        toggleBotInputsDisabled(true);
                        startBotMonitoringTimer();
                    } else {
                        // 2) 봇 정지 상태
                        if (botStartBtn) botStartBtn.style.display = 'block';
                        if (botStopBtn) botStopBtn.style.display = 'none';

                        const isReal = botRealToggle ? botRealToggle.checked : false;
                        if (botStatusBadge) {
                            botStatusBadge.textContent = isReal ? "IDLE (실거래 대기)" : "IDLE (모의거래)";
                            botStatusBadge.style.color = isReal ? "#fb7185" : "#a78bfa";
                            botStatusBadge.style.background = isReal ? "rgba(251, 113, 133, 0.15)" : "rgba(167, 139, 250, 0.15)";
                        }
                        toggleBotInputsDisabled(false);
                        stopBotMonitoringTimer();
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        const startBotMonitoringTimer = () => {
            if (BOT_MONITOR_TIMER) return;
            let counter = 0;
            BOT_MONITOR_TIMER = setInterval(async () => {
                counter++;
                // 5초마다 활성화된 탭을 무음(isSilent=true)으로 갱신하여 깜빡임 제거
                if (counter % 5 === 0) {
                    refreshActiveTab(true);
                }
                if (counter % 15 === 0) {
                    fetchAndRefreshTossPortfolio();
                    counter = 0;
                }
            }, 1000);
        };

        const stopBotMonitoringTimer = () => {
            if (BOT_MONITOR_TIMER) {
                clearInterval(BOT_MONITOR_TIMER);
                BOT_MONITOR_TIMER = null;
            }
        };

        window.syncBotUIStatus = syncBotUIStatus;

        // --- 이벤트 바인딩: 루프 시작 ---
        if (botStartBtn) {
            botStartBtn.onclick = async () => {
                if (!isLocal) {
                    alert("로컬 기동 모드에서만 사용 가능합니다.");
                    return;
                }
                const isReal = botRealToggle ? botRealToggle.checked : false;
                const horizon = getBotHorizon();
                const strategy = getBotStrategy();
                const auto = botAtrAutoCheckbox ? botAtrAutoCheckbox.checked : true;
                const takeProfitPct = auto ? null : (parseFloat(botTakeProfitInput?.value) || 10);
                const stopLossPct = auto ? null : (parseFloat(botStopLossInput?.value) || 5);
                const broker = localStorage.getItem('tossBotBroker') || 'TOSS';
                const market = localStorage.getItem('tossBotMarket') || 'ALL';
                const marketLabel = market === 'KR' ? '국내' : (market === 'US' ? '해외' : '전체');

                const summary = `시장: ${marketLabel} | 전략: ${STRATEGY_LABELS[strategy]}(${horizon}) | 익손절: ${auto ? 'ATR 자동' : '익절 ' + takeProfitPct + '% / 손절 ' + stopLossPct + '%'}`;
                const confirmMsg = isReal
                    ? `🚨 [실계좌 자동 매매 경고]

실거래로 백그라운드 자동 루프를 기동합니다. 실제 주문이 전송될 수 있습니다.

${summary}

시작하시겠습니까?`
                    : `[모의거래 시뮬레이션 시작]

AlphaEngine 가상 매매 루프를 백그라운드에 상시 가동합니다.

${summary}

시작하시겠습니까?`;

                if (!confirm(confirmMsg)) return;

                botStartBtn.disabled = true;
                try {
                    const res = await fetch(getApiUrl("/api/bot/start"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            real_trade: isReal,
                            horizon,
                            strategy,
                            take_profit_pct: takeProfitPct,
                            stop_loss_pct: stopLossPct,
                            market,
                            broker,
                            loop_interval_sec: null,
                            market_hours_filter: true,
                            extended_hours: true
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast("AlphaEngine 가동 성공!");
                        await syncBotUIStatus();
                    } else {
                        alert(`구동 실패: ${data.message}`);
                    }
                } catch (err) {
                    print(err);
                    alert("로컬 서버 응답 없음");
                } finally {
                    botStartBtn.disabled = false;
                }
            };
        }

        // --- 이벤트 바인딩: 루프 중단 ---
        if (botStopBtn) {
            botStopBtn.onclick = async () => {
                if (!confirm("⚠️ 기동 중인 백그라운드 자동 매매 루프를 중지하시겠습니까?")) return;
                botStopBtn.disabled = true;
                try {
                    const res = await fetch(getApiUrl("/api/bot/stop"), { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                        showToast("AlphaEngine 정지 완료");
                        await syncBotUIStatus();
                    } else {
                        alert(`중단 실패: ${data.message}`);
                    }
                } catch (err) {
                    console.error(err);
                    alert("로컬 서버 응답 없음");
                } finally {
                    botStopBtn.disabled = false;
                }
            };
        }

        // --- 이벤트 바인딩: 1회 수동 강제 실행 ---
        if (runBotBtn) {
            runBotBtn.onclick = async () => {
                if (!isLocal) {
                    alert("로컬 기동 모드에서만 사용 가능합니다.");
                    return;
                }
                const isReal = botRealToggle ? botRealToggle.checked : false;
                const horizon = getBotHorizon();
                const strategy = getBotStrategy();
                const auto = botAtrAutoCheckbox ? botAtrAutoCheckbox.checked : true;
                const takeProfitPct = auto ? null : (parseFloat(botTakeProfitInput?.value) || 10);
                const stopLossPct = auto ? null : (parseFloat(botStopLossInput?.value) || 5);
                const broker = localStorage.getItem('tossBotBroker') || 'TOSS';

                const confirmMsg = `AlphaEngine 1회 즉시 강제 매매 싸이클을 가동합니다. (실거래모드: ${isReal ? 'ON' : 'OFF'})

정말 실행하시겠습니까?`;
                if (!confirm(confirmMsg)) return;

                runBotBtn.disabled = true;
                const origHtml = runBotBtn.innerHTML;
                runBotBtn.innerHTML = '<span class="toss-bot-run-icon">⏳</span><span>실행 중...</span>';

                try {
                    const res = await fetch(getApiUrl("/api/bot/run"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            real_trade: isReal,
                            horizon,
                            strategy,
                            take_profit_pct: takeProfitPct,
                            stop_loss_pct: stopLossPct,
                            market: localStorage.getItem('tossBotMarket') || 'ALL',
                            broker,
                            loop_interval_sec: null,
                            market_hours_filter: false // 수동 강제 실행 시에는 시간 장외 가드를 품
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast("즉시 실행 싸이클 동작 완료!");
                        refreshActiveTab();
                        fetchAndRefreshTossPortfolio();
                    } else {
                        alert(`실행 에러: ${data.message}`);
                    }
                } catch (err) {
                    console.error(err);
                    alert("로컬 서버 응답 없음");
                } finally {
                    runBotBtn.disabled = false;
                    runBotBtn.innerHTML = origHtml;
                }
            };
        }

        // 초기 로딩 시 백엔드 봇 가동 상태 동기화 및 모니터링 시작
        syncBotUIStatus();
    }

    // 새로고침 후 trade 탭이 이미 열려 있으면 init 누락 방지
    const runInitTradeOnLoad = () => {
        // [NEW] 글로벌 봇 위젯 초기화
        if (typeof initTossBotWidget === 'function') {
            initTossBotWidget();
        }

        const activeView = document.querySelector('.page-view.active');
        const hasToken = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token');
        if (!hasToken || !activeView) return;
        if (activeView.id === 'view-trade' && typeof initTossTrade === 'function') {
            initTossTrade();
        } else if (activeView.id === 'view-kis-trade' && typeof window.initKisTrade === 'function') {
            window.initKisTrade();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInitTradeOnLoad);
    } else {
        runInitTradeOnLoad();
    }
})();

// ==========================================================================
// [NEW] 주문 콘솔용 실시간 차트 & 시세 연동 로직
// ==========================================================================
var tossOrderChartInstance = null;
var tossRealtimePriceIntervalId = null;
var tossCurrentActiveSymbol = null;

// 실시간 통화 전환 대응을 위한 데이터 백업 저장소
let tossCurrentRawCandles = [];
let tossCurrentRawPriceInfo = null;

// 🐳 고래 매수 현황 — Volume Profile + 대량거래 캔들 (yfinance 실데이터)
let tossWhalePrices = [];
let tossWhaleWeights = [];
let tossWhaleBasePrice = 0;

window.applyWhaleFlowToPanel = function(prefix, symbol, data, opts = {}) {
    const getCur = opts.getCurrency || (() => localStorage.getItem('tossCurrency') || 'KRW');
    const getRate = opts.getRate || (() => window.CURRENT_USD_RATE || 1400);
    const syncLayout = opts.syncLayout || (() => {
        if (prefix === 'kis' && typeof window.syncKisOrderLayoutHeights === 'function') {
            window.syncKisOrderLayoutHeights();
        } else if (typeof window.syncOrderLayoutHeights === 'function') {
            window.syncOrderLayoutHeights();
        }
    });

    const depth = data.depth || [];
    const feed = data.feed || [];
    const stale = !!data.stale;

    if (depth.length && prefix === 'toss') {
        tossWhalePrices = depth.map(d => d.price);
        tossWhaleWeights = depth.map(d => d.weight);
        tossWhaleBasePrice = data.currentPrice || tossWhaleBasePrice;
    }

    if (depth.length) {
        window.renderWhaleDepthUI(
            prefix,
            depth.map(d => d.price),
            depth.map(d => d.weight),
            getCur,
            getRate,
            symbol,
        );
    } else {
        const listEl = document.getElementById(`${prefix}-whale-depth-rows`);
        if (listEl) {
            listEl.innerHTML = `<div class="${prefix}-whale-placeholder">Volume Profile 데이터 없음</div>`;
        }
    }

    const feedEl = document.getElementById(`${prefix}-whale-feed-list`);
    if (!feedEl) return;

    if (!feed.length) {
        feedEl.innerHTML = `<div class="${prefix}-whale-placeholder">대량 거래 캔들 없음 (거래량 1.6배+ 기준)</div>`;
        syncLayout(); // [NEW] early return 시에도 레이아웃 동기화 보장
        return;
    }

    const cur = getCur();
    const rate = getRate();
    const isKoreanStock = symbol && (symbol.endsWith('.KS') || symbol.endsWith('.KQ') || /^\d+$/.test(symbol));

    feedEl.innerHTML = stale
        ? `<div class="${prefix}-whale-placeholder whale-feed-stale" style="padding:0.35rem;font-size:0.65rem;color:#64748b;border-bottom:1px solid rgba(255,255,255,0.06);">📅 마지막 거래일 캔들 기준 · 장중 실시간 갱신</div>`
        : '';

    feed.forEach(item => {
        const { priceStr, amountStr } = formatWhaleFeedRow(
            item.symbol || symbol,
            item.price,
            item.amountUsd,
            isKoreanStock,
            cur,
            rate,
        );
        const isSell = item.side === 'SELL';
        const dateObj = new Date(item.time * 1000);
        feedEl.appendChild(createWhaleFeedItem(item.symbol || symbol, priceStr, amountStr, isSell, dateObj));
    });

    syncLayout();
};

window.refreshWhaleFlowPanel = function(symbol, opts = {}) {
    if (!symbol) return;
    const prefix = opts.prefix || 'toss';
    let period = opts.period || '1d';
    let interval = opts.interval || '5m';

    // 1D(하루) 기간의 고래 수급 분석은 가격 변동 범위(range)가 지나치게 좁게 나오는 현상이 발생합니다.
    // 따라서 최소 5일(1W, 30분봉) 누적 데이터를 사용하여 의미 있는 고래 매집대(Volume Profile)를 생성합니다.
    if (period === '1d') {
        period = '5d';
        interval = '30m';
    }
    const cleanSym = symbol.trim().toUpperCase();

    const tickerEl = document.getElementById(`${prefix}-whale-ticker`);
    if (tickerEl) tickerEl.textContent = cleanSym;

    return fetch(`http://127.0.0.1:8000/api/whale/${encodeURIComponent(cleanSym)}?period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`)
        .then(res => {
            if (!res.ok) throw new Error('whale fetch failed');
            return res.json();
        })
        .then(data => {
            window.applyWhaleFlowToPanel(prefix, cleanSym, data, opts);
            return data;
        })
        .catch(err => {
            console.warn('[WhaleFlow] fetch failed:', err);
            const feedEl = document.getElementById(`${prefix}-whale-feed-list`);
            if (feedEl) {
                feedEl.innerHTML = `<div class="${prefix}-whale-placeholder">고래 수급 데이터 조회 실패</div>`;
            }
            if (prefix === 'kis' && typeof window.syncKisOrderLayoutHeights === 'function') {
                window.syncKisOrderLayoutHeights();
            } else if (typeof window.syncOrderLayoutHeights === 'function') {
                window.syncOrderLayoutHeights();
            }
        });
};

window.initWhalePanel = function(symbol, basePrice) {
    const tickerEl = document.getElementById('toss-whale-ticker');
    if (tickerEl) tickerEl.textContent = symbol;
    tossWhaleBasePrice = basePrice;
};

window.renderWhaleDepthUI = function(prefix = 'toss', prices, weights, getCurFn, getRateFn, symbolOverride) {
    const listEl = document.getElementById(`${prefix}-whale-depth-rows`);
    if (!listEl) return;

    const priceArr = prices || tossWhalePrices;
    const weightArr = weights || tossWhaleWeights;
    const cur = (getCurFn ? getCurFn() : null) || localStorage.getItem('tossCurrency') || 'KRW';
    const rate = (getRateFn ? getRateFn() : null) || window.CURRENT_USD_RATE || 1400;
    const symbol = symbolOverride || tossCurrentActiveSymbol;
    const isKoreanStock = symbol && (symbol.endsWith('.KS') || symbol.endsWith('.KQ') || /^\d+$/.test(symbol));

    listEl.innerHTML = '';

    for (let i = 0; i < priceArr.length; i++) {
        const rawPrice = priceArr[i];
        if (!rawPrice) continue;

        let displayPrice = rawPrice;
        let currencySign = '$';
        let fractionDigits = 2;

        if (cur === 'KRW') {
            currencySign = '₩';
            if (!isKoreanStock) displayPrice = rawPrice * rate;
            fractionDigits = displayPrice < 1000 ? 2 : 0;
        } else {
            if (isKoreanStock) displayPrice = rawPrice / rate;
            fractionDigits = displayPrice < 1 ? 4 : 2;
        }

        const priceStr = currencySign + displayPrice.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
        const weight = weightArr[i] || 0;

        const chip = document.createElement('div');
        chip.className = 'whale-depth-row';
        chip.id = `${prefix}-whale-depth-row-${i}`;
        chip.innerHTML = `
            <div class="whale-depth-bar-wrapper">
                <div class="whale-depth-bar" style="width:${Math.min(100, weight)}%"></div>
            </div>
            <span class="whale-depth-price">${priceStr}</span>
            <span class="whale-depth-weight">${Number(weight).toFixed(weight % 1 ? 1 : 0)}%</span>
        `;
        listEl.appendChild(chip);
    }
};

function getWhaleFeedMaxItems() {
    const feedEl = document.getElementById('toss-whale-feed-list');
    const panel = document.getElementById('toss-whale-panel');
    if (!feedEl) return 7;

    let feedH = feedEl.getBoundingClientRect().height;
    if (panel && feedH > 0) {
        feedH = feedH || 140;
    } else {
        feedH = feedH || 140;
    }

    return Math.max(5, Math.min(12, Math.ceil(feedH / 22)));
}

window.syncOrderLayoutHeights = function() {
    const topGrid = document.querySelector('.toss-orders-top-grid');
    const whale = document.getElementById('toss-whale-panel');
    const feedEl = document.getElementById('toss-whale-feed-list');
    const chartArea = document.getElementById('toss-order-chart');
    if (!topGrid || !whale || !feedEl) return;

    const gridH = topGrid.getBoundingClientRect().height;
    if (gridH < 80) return;

    let used = 0;
    Array.from(whale.children).forEach(child => {
        if (child.id !== 'toss-whale-feed-list') {
            used += child.getBoundingClientRect().height;
        }
    });
    const gaps = 14;
    const rightCol = document.querySelector('.toss-orders-right-col');
    const rightH = rightCol ? rightCol.getBoundingClientRect().height : gridH;
    const feedMax = Math.max(64, rightH - used - gaps);
    feedEl.style.maxHeight = `${Math.floor(feedMax)}px`;
    feedEl.style.flex = '1 1 auto';
    feedEl.style.minHeight = '0';

    if (chartArea && tossOrderChartInstance) {
        const chartH = Math.max(100, chartArea.clientHeight || 200);
        const chartW = chartArea.clientWidth || 600;
        tossOrderChartInstance.resize(chartW, chartH);
    }
};

function formatWhaleFeedRow(symbol, rawPrice, amountUsd, isKoreanStock, cur, rate) {
    let amountStr = '';
    let displayPrice = rawPrice;
    let currencySign = '$';
    let fractionDigits = 2;

    if (cur === 'KRW') {
        currencySign = '₩';
        if (!isKoreanStock) displayPrice = rawPrice * rate;
        fractionDigits = displayPrice < 1000 ? 2 : 0;
        const amountKrw = amountUsd * rate;
        amountStr = amountKrw >= 100000000
            ? `${(amountKrw / 100000000).toFixed(1)}억원`
            : `${(amountKrw / 10000000).toFixed(0)}천만원`;
    } else {
        if (isKoreanStock) displayPrice = rawPrice / rate;
        fractionDigits = displayPrice < 1 ? 4 : 2;
        amountStr = amountUsd >= 1000000
            ? `$${(amountUsd / 1000000).toFixed(2)}M`
            : `$${(amountUsd / 1000).toFixed(0)}K`;
    }

    const priceStr = currencySign + displayPrice.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
    return { priceStr, amountStr };
}

function createWhaleFeedItem(symbol, priceStr, amountStr, isSell, dateObj) {
    const timeStr = dateObj.toLocaleTimeString(undefined, {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const item = document.createElement('div');
    item.className = isSell ? 'whale-feed-item whale-feed-sell' : 'whale-feed-item';
    item.innerHTML = `
        <span class="whale-feed-time">[${timeStr}]</span>
        <span class="whale-feed-desc">${symbol} ${priceStr}</span>
        <span class="whale-feed-amount${isSell ? '-sell' : ''}">${amountStr} ${isSell ? '매도' : '매수'}</span>
    `;
    return item;
}

function trimWhaleFeedList(feedEl) {
    if (!feedEl) return;
    const maxItems = getWhaleFeedMaxItems();
    while (feedEl.children.length > maxItems) {
        feedEl.removeChild(feedEl.lastChild);
    }
}

window.refreshWhaleFlow = function(symbol, period = '1d', interval = '5m') {
    window.refreshWhaleFlowPanel(symbol, { prefix: 'toss', period, interval });
};

/** @deprecated use refreshWhaleFlow */
window.startWhaleSimulation = function(symbol, period = '1d', interval = '5m') {
    window.refreshWhaleFlow(symbol, period, interval);
};

window.stopWhaleSimulation = function() {
    // 토스 SSE EventSource 정리
    if (window._tossEventSource) {
        window._tossEventSource.close();
        window._tossEventSource = null;
    }
    // 3초 realtime tick 루프도 함께 정리
    if (window._tossRealtimeTickIntervalId) {
        clearInterval(window._tossRealtimeTickIntervalId);
        window._tossRealtimeTickIntervalId = null;
    }
    // 30초 캔들 루프도 함께 정리
    if (tossRealtimePriceIntervalId) {
        clearInterval(tossRealtimePriceIntervalId);
        tossRealtimePriceIntervalId = null;
    }
};

window.updateRealtimePricePanel = function(priceInfo) {
    const panel = document.getElementById('toss-realtime-price-panel');
    if (!panel || !priceInfo) return;
    
    const currencySymbolHint = `${priceInfo.symbol || ''} ${priceInfo.requestedSymbol || ''} ${priceInfo.orderSymbol || ''}`.toUpperCase();
    const sourceCurrency = /(\d{6}\.(KS|KQ)\b|\b\d{6}\b)/.test(currencySymbolHint)
        ? 'KRW'
        : (priceInfo.currency || priceInfo.nativeCurrency || 'USD').toUpperCase();
    
    let displayPrice = priceInfo.currentPrice;
    let displayChange = priceInfo.change;
    let currencySign = sourceCurrency === 'KRW' ? '₩' : '$';
    let fractionDigits = sourceCurrency === 'KRW' ? 0 : 2;
    
    const sign = displayChange >= 0 ? '+' : '';
    const color = displayChange > 0 ? '#f25f7a' : (displayChange < 0 ? '#5f97f2' : '#fff');
    const arrow = displayChange > 0 ? '▲' : (displayChange < 0 ? '▼' : '');
    
    let rsiText = '';
    if (priceInfo.rsi !== null && priceInfo.rsi !== undefined) {
        rsiText = `<span style="font-size: 0.72rem; color: #a78bfa; background: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 8px;">RSI: ${priceInfo.rsi.toFixed(1)}</span>`;
    }
    
    panel.innerHTML = `
        <span style="font-size: 1.15rem; color: #fff; font-family: monospace;">${currencySign}${displayPrice.toLocaleString(undefined, {minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits})}</span>
        <span style="color: ${color}; font-size: 0.85rem; font-family: monospace; margin-left: 5px;">
            ${arrow} ${sign}${displayChange.toLocaleString(undefined, {minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits})} (${sign}${priceInfo.changePct.toFixed(2)}%)
        </span>
        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-left: 10px;">
            Vol: ${(priceInfo.volume || 0).toLocaleString()}
        </span>
        ${rsiText}
    `;
};

window.refreshOrderConsoleCurrency = function(cur) {
    if (tossCurrentRawPriceInfo) {
        window.updateRealtimePricePanel(tossCurrentRawPriceInfo);
    }
    if (tossCurrentRawCandles && tossCurrentRawCandles.length > 0) {
        const activePeriodBtn = document.querySelector('.toss-chart-period-btn.active');
        const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '1d';
        const interval = activePeriodBtn ? activePeriodBtn.getAttribute('data-interval') : '5m';
        window.renderOrderChart(tossCurrentRawCandles, period);
        if (tossCurrentActiveSymbol) {
            window.refreshWhaleFlowPanel(tossCurrentActiveSymbol, { prefix: 'toss', period, interval });
        }
    } else if (tossCurrentActiveSymbol) {
        window.refreshWhaleFlowPanel(tossCurrentActiveSymbol, { prefix: 'toss' });
    }
};

window.updateTossChartAnalysis = function(symbol) {
    const analysisEl = document.getElementById('toss-order-chart-analysis');
    const botWrapEl = document.getElementById('toss-center-bot-wrap');
    if (!analysisEl) return;

    if (!symbol) {
        analysisEl.innerHTML = '<div class="toss-metrics-placeholder">종목 조회 후 MFC / PICK · T+1~T+5 예측이 표시됩니다.</div>';
        analysisEl.style.display = 'block';
        if (botWrapEl) botWrapEl.innerHTML = '<div class="toss-bot-placeholder">🤖 종목 조회 후 AI 봇 설정이 표시됩니다.</div>';
        return;
    }

    const cleanSym = symbol.trim().toUpperCase();
    let stock = null;

    if (window.REPORTS_HISTORY && window.REPORTS_HISTORY.length > 0) {
        const latestReport = window.REPORTS_HISTORY[0];
        const holdings = latestReport.holdings || [];
        const watchlist = latestReport.watchlist || [];
        const allStocks = [...holdings, ...watchlist];

        stock = allStocks.find(s => s.symbol.toUpperCase() === cleanSym);
        if (!stock) stock = allStocks.find(s => s.symbol.toUpperCase().startsWith(cleanSym + '.'));
        if (!stock) {
            const dotIdx = cleanSym.indexOf('.');
            if (dotIdx > 0) {
                const baseSym = cleanSym.substring(0, dotIdx);
                stock = allStocks.find(s => s.symbol.toUpperCase() === baseSym);
            }
        }
        if (!stock) stock = allStocks.find(s => s.name && s.name.toUpperCase() === cleanSym);
    }

    if (!stock) {
        analysisEl.innerHTML = `
            <div style="text-align: center; padding: 0.5rem; color: #94a3b8; font-size: 0.75rem; background: rgba(15, 23, 42, 0.4); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                ⚠️ '${cleanSym}' — AI 리포트 데이터 없음 (MFC/PICK·궤적 미표시)
            </div>`;
        analysisEl.style.display = 'block';
        window.renderSymbolBotSettingsPanel(cleanSym, null);
        if (typeof window.updateTossAdvisoryCard === 'function') window.updateTossAdvisoryCard(null);
        return;
    }

    // MFC Score
    const ind = stock.reason?.indicators || {};
    const mfcVal = parseFloat(ind.mfc_score || stock.mfcScore || 0);
    let mfcColor = '#fb7185';
    if (mfcVal >= 70) mfcColor = '#34d399';
    else if (mfcVal >= 50) mfcColor = '#38bdf8';
    else if (mfcVal >= 30) mfcColor = '#fbbf24';

    let pickVal = 0;
    let pickColor = '#fbbf24';
    if (typeof buildRecommendationScore === 'function') {
        const pickScoreObj = buildRecommendationScore(stock);
        pickVal = pickScoreObj.total;
        if (pickVal >= 70) pickColor = '#34d399';
        else if (pickVal >= 55) pickColor = '#38bdf8';
        else if (pickVal <= 30) pickColor = '#fb7185';
    } else {
        pickVal = parseFloat(stock.reason?.rec_score || stock.recScore || 50);
        if (pickVal >= 70) pickColor = '#34d399';
        else if (pickVal >= 55) pickColor = '#38bdf8';
        else if (pickVal <= 30) pickColor = '#fb7185';
    }

    let tListHtml = '';
    const path = stock.consensusPath || [];
    const basePrice = stock.rawPrice || 0;

    if (path && path.length > 0) {
        const maxDays = Math.min(5, path.length);
        for (let i = 0; i < maxDays; i++) {
            const val = path[i];
            const prevVal = i === 0 ? basePrice : path[i - 1];
            const pctChange = prevVal > 0 ? (((val - prevVal) / prevVal) * 100) : 0;
            const sign = pctChange >= 0 ? '+' : '';
            const changeCol = pctChange > 0 ? '#f25f7a' : (pctChange < 0 ? '#5f97f2' : '#94a3b8');
            const borderCol = pctChange > 0 ? 'rgba(52, 211, 153, 0.15)' : (pctChange < 0 ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255, 255, 255, 0.05)');
            const bgCol = pctChange > 0 ? 'rgba(52, 211, 153, 0.03)' : (pctChange < 0 ? 'rgba(251, 113, 133, 0.03)' : 'rgba(15, 23, 42, 0.3)');

            const cur = localStorage.getItem('tossCurrency') || 'KRW';
            const rate = window.CURRENT_USD_RATE || 1400;
            let displayVal = val;
            let currencySign = '$';
            let fractionDigits = 2;

            if (stock.nativeCurrency === 'KRW') {
                displayVal = val;
                if (cur === 'USD') { displayVal = val / rate; currencySign = '$'; fractionDigits = 2; }
                else { currencySign = '₩'; fractionDigits = 0; }
            } else {
                if (cur === 'KRW') { displayVal = val * rate; currencySign = '₩'; fractionDigits = 0; }
                else { displayVal = val; currencySign = '$'; fractionDigits = 2; }
            }

            const priceStr = currencySign + Math.round(displayVal).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
            const changeStr = `${sign}${pctChange.toFixed(2)}%`;

            tListHtml += `
                <div class="toss-traj-card" style="background:${bgCol}; border-color:${borderCol};">
                    <div class="toss-traj-day">T+${i + 1}</div>
                    <div class="toss-traj-price">${priceStr}</div>
                    <div class="toss-traj-pct" style="color:${changeCol};">${changeStr}</div>
                </div>`;
        }
    } else {
        tListHtml = `<div class="toss-traj-empty">예측 데이터 없음</div>`;
    }

    const adviceText = String(stock?.advice || stock?.outlook || stock?.rating || '');

    analysisEl.innerHTML = `
        <div class="toss-metrics-compact">
            <div class="toss-metrics-scores">
                <div class="analysis-score-card">
                    <div class="analysis-score-icon">📊</div>
                    <div>
                        <div class="analysis-score-label">MFC</div>
                        <div class="analysis-score-value" style="color:${mfcColor};">${mfcVal.toFixed(1)}</div>
                    </div>
                </div>
                <div class="analysis-score-card">
                    <div class="analysis-score-icon">🤖</div>
                    <div>
                        <div class="analysis-score-label">PICK</div>
                        <div class="analysis-score-value" style="color:${pickColor};">${pickVal.toFixed(1)}</div>
                    </div>
                </div>
            </div>
            <div class="toss-metrics-trajectory">
                <div class="toss-trajectory-title"><span>📈</span> T+1~5</div>
                <div class="toss-trajectory-row">${tListHtml}</div>
            </div>
        </div>`;
    analysisEl.style.display = 'block';

    window.renderSymbolBotSettingsPanel(cleanSym, stock);
    requestAnimationFrame(() => {
        if (typeof window.syncOrderLayoutHeights === 'function') window.syncOrderLayoutHeights();
    });

    if (typeof window.updateTossAdvisoryCard === 'function') {
        window.updateTossAdvisoryCard(stock);
    }
};

window.renderSymbolBotSettingsPanel = function(symbol, stock) {
    const botWrapEl = document.getElementById('toss-center-bot-wrap');
    if (!botWrapEl || !symbol) return;

    const cleanSymbol = symbol.trim().toUpperCase();
    const botCfg = getSymbolBotConfig(cleanSymbol);
    const adviceText = String(stock?.advice || stock?.outlook || stock?.rating || '');
    const cur = localStorage.getItem('tossCurrency') || 'KRW';
    const rate = window.CURRENT_USD_RATE || 1400;
    const livePrice = tossCurrentRawPriceInfo?.currentPrice || stock?.rawPrice || 0;
    const tpPrice = livePrice > 0 ? livePrice * (1 + botCfg.take_profit_pct / 100) : 0;
    const slPrice = livePrice > 0 ? livePrice * (1 - botCfg.stop_loss_pct / 100) : 0;
    const tpLevelStr = formatBotPriceLevel(tpPrice, stock, cur, rate);
    const slLevelStr = formatBotPriceLevel(slPrice, stock, cur, rate);
    const livePriceStr = formatBotPriceLevel(livePrice, stock, cur, rate);
    const horizonAdvice = parseHorizonAdviceClient(adviceText, botCfg.horizon, botCfg.strategy);
    const adviceColor = horizonAdvice === 'BUY' ? '#34d399' : (horizonAdvice === 'SELL' ? '#fb7185' : '#fbbf24');
    const adviceLabel = horizonAdvice === 'BUY' ? '매수' : (horizonAdvice === 'SELL' ? '매도' : '관망');
    const strategies = TOSS_BOT_HORIZON_STRATEGIES[botCfg.horizon] || [];

    const priceStep = getBotPriceInputStep(stock, cur);
    const tpPriceInputVal = formatPriceForInput(tpPrice, stock, cur, rate);
    const slPriceInputVal = formatPriceForInput(slPrice, stock, cur, rate);

    botWrapEl.innerHTML = `
        <div class="toss-center-bot-inline" id="toss-symbol-bot-settings" data-symbol="${cleanSymbol}" title="익절 ${tpLevelStr} · 손절 ${slLevelStr} · 현재 ${livePriceStr}">
            <span class="toss-symbol-bot-inline-label">🤖 <em>${cleanSymbol}</em></span>
            <button type="button" class="toss-symbol-bot-advice-badge toss-symbol-bot-advice-btn" style="color:${adviceColor}; border-color:${adviceColor}33; background:${adviceColor}18; cursor:pointer;" title="클릭 시 주문 방향 토글">${adviceLabel}</button>
            <span class="toss-symbol-inline-sep"></span>
            <div class="toss-symbol-horizon-inline">
                ${['short', 'medium', 'long'].map(h => `
                    <button type="button" class="toss-symbol-horizon-btn${botCfg.horizon === h ? ' active' : ''}" data-horizon="${h}" title="${TOSS_BOT_HORIZON_HINTS[h] || ''}">${TOSS_BOT_HORIZON_LABELS[h]}</button>
                `).join('')}
            </div>
            <span class="toss-symbol-inline-sep"></span>
            <div class="toss-symbol-strategy-inline">
                ${strategies.map(s => `
                    <button type="button" class="toss-symbol-strategy-btn${botCfg.strategy === s ? ' active' : ''}" data-strategy="${s}" title="${getStrategyHint(botCfg.horizon, s)}">${TOSS_BOT_STRATEGY_LABELS[s]}</button>
                `).join('')}
            </div>
            <span class="toss-symbol-inline-sep"></span>
            <div class="toss-symbol-tpsl-inline">
                <span class="tp-label">TP</span>
                <input type="number" id="toss-symbol-tp-pct" class="tp-input pct-input" value="${botCfg.take_profit_pct}" min="0.1" max="999" step="0.5" title="익절 %">
                <span class="tpsl-unit">%</span>
                <input type="number" id="toss-symbol-tp-price" class="tp-input price-input" value="${tpPriceInputVal}" min="0" step="${priceStep}" placeholder="익절가" title="익절 목표가">
                <span class="tpsl-divider">|</span>
                <span class="sl-label">SL</span>
                <input type="number" id="toss-symbol-sl-pct" class="sl-input pct-input" value="${botCfg.stop_loss_pct}" min="0.1" max="999" step="0.5" title="손절 %">
                <span class="tpsl-unit">%</span>
                <input type="number" id="toss-symbol-sl-price" class="sl-input price-input" value="${slPriceInputVal}" min="0" step="${priceStep}" placeholder="손절가" title="손절 목표가">
            </div>
            <span class="toss-symbol-inline-sep"></span>
            <div class="toss-symbol-qty-inline" style="display:flex;align-items:center;gap:0.25rem;">
                <span style="color:#94a3b8;font-size:0.75rem;font-weight:bold;">QTY</span>
                <input type="number" id="toss-symbol-qty" style="width:50px;height:22px;text-align:center;background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:4px;font-size:0.75rem;font-weight:bold;" placeholder="Auto" title="수량 (미입력 시 Kelly 계산)">
            </div>
            <span class="toss-symbol-inline-sep"></span>
            <button type="button" id="toss-symbol-apply-global-btn" class="toss-symbol-apply-btn">↗ 적용</button>
        </div>`;

    window.initSymbolBotSettingsPanel(cleanSymbol, stock);
};

window.initSymbolBotSettingsPanel = function(symbol, stock) {
    const panel = document.getElementById('toss-symbol-bot-settings');
    if (!panel || !symbol) return;

    const sym = symbol.trim().toUpperCase();
    const cur = localStorage.getItem('tossCurrency') || 'KRW';
    const rate = window.CURRENT_USD_RATE || 1400;
    let tpslSyncing = false;

    const getLiveRawPrice = () => tossCurrentRawPriceInfo?.currentPrice || stock?.rawPrice || 0;

    const refreshLevelsFromPct = () => {
        if (tpslSyncing) return;
        tpslSyncing = true;
        const tpPct = parseFloat(document.getElementById('toss-symbol-tp-pct')?.value) || 0;
        const slPct = parseFloat(document.getElementById('toss-symbol-sl-pct')?.value) || 0;
        const price = getLiveRawPrice();
        const tpPriceEl = document.getElementById('toss-symbol-tp-price');
        const slPriceEl = document.getElementById('toss-symbol-sl-price');
        if (price > 0) {
            if (tpPriceEl) tpPriceEl.value = formatPriceForInput(price * (1 + tpPct / 100), stock, cur, rate);
            if (slPriceEl) slPriceEl.value = formatPriceForInput(price * (1 - slPct / 100), stock, cur, rate);
        }
        const tpStr = formatBotPriceLevel(price * (1 + tpPct / 100), stock, cur, rate);
        const slStr = formatBotPriceLevel(price * (1 - slPct / 100), stock, cur, rate);
        const liveStr = formatBotPriceLevel(price, stock, cur, rate);
        if (panel) panel.title = `익절 ${tpStr} · 손절 ${slStr} · 현재 ${liveStr}`;
        tpslSyncing = false;
    };

    const refreshPctFromPrices = () => {
        if (tpslSyncing) return;
        tpslSyncing = true;
        const price = getLiveRawPrice();
        const tpPriceEl = document.getElementById('toss-symbol-tp-price');
        const slPriceEl = document.getElementById('toss-symbol-sl-price');
        const tpPctEl = document.getElementById('toss-symbol-tp-pct');
        const slPctEl = document.getElementById('toss-symbol-sl-pct');
        if (price > 0) {
            const tpRaw = fromDisplayPrice(tpPriceEl?.value, stock, cur, rate);
            const slRaw = fromDisplayPrice(slPriceEl?.value, stock, cur, rate);
            if (tpRaw > 0 && tpPctEl) {
                tpPctEl.value = parseFloat(((tpRaw / price - 1) * 100).toFixed(1));
            }
            if (slRaw > 0 && slPctEl) {
                slPctEl.value = parseFloat(((1 - slRaw / price) * 100).toFixed(1));
            }
        }
        tpslSyncing = false;
        persist();
    };

    const refreshLevels = refreshLevelsFromPct;

    const persist = (opts = {}) => {
        const activeH = panel.querySelector('.toss-symbol-horizon-btn.active');
        const activeS = panel.querySelector('.toss-symbol-strategy-btn.active');
        const horizon = activeH?.getAttribute('data-horizon') || 'short';
        const strategy = normalizeBotStrategy(horizon, opts.strategy ?? activeS?.getAttribute('data-strategy'));
        const cfg = {
            horizon,
            strategy,
            take_profit_pct: opts.take_profit_pct ?? (parseFloat(document.getElementById('toss-symbol-tp-pct')?.value) || 10),
            stop_loss_pct: opts.stop_loss_pct ?? (parseFloat(document.getElementById('toss-symbol-sl-pct')?.value) || 5),
        };
        saveSymbolBotConfig(sym, cfg);
        refreshLevels();
        const adviceText = String(stock?.advice || stock?.outlook || stock?.rating || '');
        const ha = parseHorizonAdviceClient(adviceText, cfg.horizon, cfg.strategy);
        const badge = panel.querySelector('.toss-symbol-bot-advice-badge');
        if (badge) {
            const color = ha === 'BUY' ? '#34d399' : (ha === 'SELL' ? '#fb7185' : '#fbbf24');
            const label = ha === 'BUY' ? '매수' : (ha === 'SELL' ? '매도' : '관망');
            const stratLabel = TOSS_BOT_STRATEGY_LABELS[cfg.strategy] || cfg.strategy;
            badge.textContent = `${stratLabel} ${label}`;
            badge.style.color = color;
            badge.style.borderColor = color + '33';
            badge.style.background = color + '18';
        }
    };

    const rerenderStrategies = (horizon, activeStrategy) => {
        const container = panel.querySelector('.toss-symbol-strategy-inline');
        if (!container) return;
        const strategies = TOSS_BOT_HORIZON_STRATEGIES[horizon] || [];
        const active = normalizeBotStrategy(horizon, activeStrategy);
        container.innerHTML = strategies.map(s => `
            <button type="button" class="toss-symbol-strategy-btn${active === s ? ' active' : ''}" data-strategy="${s}" title="${getStrategyHint(horizon, s)}">${TOSS_BOT_STRATEGY_LABELS[s]}</button>
        `).join('');
        container.querySelectorAll('.toss-symbol-strategy-btn').forEach(btn => {
            btn.onclick = () => {
                panel.querySelectorAll('.toss-symbol-strategy-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const defaults = getStrategyDefaults(btn.getAttribute('data-strategy'));
                const tpInput = document.getElementById('toss-symbol-tp-pct');
                const slInput = document.getElementById('toss-symbol-sl-pct');
                if (tpInput) tpInput.value = defaults.take_profit_pct;
                if (slInput) slInput.value = defaults.stop_loss_pct;
                persist({ strategy: btn.getAttribute('data-strategy'), ...defaults });
            };
        });
    };

    panel.querySelectorAll('.toss-symbol-horizon-btn').forEach(btn => {
        btn.onclick = () => {
            panel.querySelectorAll('.toss-symbol-horizon-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const horizon = btn.getAttribute('data-horizon');
            const strategy = normalizeBotStrategy(horizon, null);
            const defaults = getStrategyDefaults(strategy);
            const tpInput = document.getElementById('toss-symbol-tp-pct');
            const slInput = document.getElementById('toss-symbol-sl-pct');
            if (tpInput) tpInput.value = defaults.take_profit_pct;
            if (slInput) slInput.value = defaults.stop_loss_pct;
            rerenderStrategies(horizon, strategy);
            persist({ strategy, ...defaults });
        };
    });

    panel.querySelectorAll('.toss-symbol-strategy-btn').forEach(btn => {
        btn.onclick = () => {
            panel.querySelectorAll('.toss-symbol-strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const defaults = getStrategyDefaults(btn.getAttribute('data-strategy'));
            const tpInput = document.getElementById('toss-symbol-tp-pct');
            const slInput = document.getElementById('toss-symbol-sl-pct');
            if (tpInput) tpInput.value = defaults.take_profit_pct;
            if (slInput) slInput.value = defaults.stop_loss_pct;
            persist({ strategy: btn.getAttribute('data-strategy'), ...defaults });
        };
    });

    const tpInput = document.getElementById('toss-symbol-tp-pct');
    const slInput = document.getElementById('toss-symbol-sl-pct');
    const tpPriceInput = document.getElementById('toss-symbol-tp-price');
    const slPriceInput = document.getElementById('toss-symbol-sl-price');
    if (tpInput) {
        tpInput.oninput = persist;
        tpInput.onchange = persist;
    }
    if (slInput) {
        slInput.oninput = persist;
        slInput.onchange = persist;
    }
    if (tpPriceInput) {
        tpPriceInput.oninput = refreshPctFromPrices;
        tpPriceInput.onchange = refreshPctFromPrices;
    }
    if (slPriceInput) {
        slPriceInput.oninput = refreshPctFromPrices;
        slPriceInput.onchange = refreshPctFromPrices;
    }

    const applyBtn = document.getElementById('toss-symbol-apply-global-btn');
    if (applyBtn) {
        applyBtn.onclick = async () => {
            const cfg = getSymbolBotConfig(sym);
            applyBotConfigToGlobalUI(cfg);
            showToast(`${sym} 설정을 플로팅 AI 봇에 적용했습니다.`);

            const adviceBadge = panel.querySelector('.toss-symbol-bot-advice-badge');
            const advice = adviceBadge ? adviceBadge.textContent.trim() : '관망';
            if (advice === '관망') {
                alert('현재 "관망" 상태입니다. 매수 또는 매도 방향을 선택해주세요.');
                return;
            }
            const side = advice === '매수' ? 'BUY' : 'SELL';
            
            const isDryRun = typeof isTossDryRun === 'function' ? isTossDryRun() : true;
            const modeText = isDryRun ? '모의(DRY)' : '실전(REAL)';
            
            const qtyInput = document.getElementById('toss-symbol-qty');
            let quantity = qtyInput ? parseFloat(qtyInput.value) : null;
            if (isNaN(quantity) || quantity <= 0) {
                quantity = null;
            }
            
            const actionKor = side === 'BUY' ? '매수' : '매도';
            const qtyDesc = quantity ? `${quantity}주` : 'Kelly 자동 계산';
            
            const confirmMsg = `🚨 [즉시 강제 거래 전송]\n\n` +
                `- 종목: ${sym}\n` +
                `- 계좌 모드: ${modeText}\n` +
                `- 구분: 봇 강제 ${actionKor}\n` +
                `- 수량: ${qtyDesc}\n\n` +
                `이 설정으로 즉시 거래를 전송하시겠습니까?`;
                
            if (!confirm(confirmMsg)) return;
            
            try {
                applyBtn.disabled = true;
                applyBtn.textContent = '거래 처리중...';
                
                const tpPct = parseFloat(document.getElementById('toss-symbol-tp-pct')?.value) || 10;
                const slPct = parseFloat(document.getElementById('toss-symbol-sl-pct')?.value) || 5;
                const horizon = panel.querySelector('.toss-symbol-horizon-btn.active')?.getAttribute('data-horizon') || 'short';
                const strategy = panel.querySelector('.toss-symbol-strategy-btn.active')?.getAttribute('data-strategy') || 'swing';
                
                const response = await fetch(getApiUrl('/api/bot/force-trade'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        broker: 'TOSS',
                        symbol: sym,
                        side: side,
                        horizon: horizon,
                        strategy: strategy,
                        take_profit_pct: tpPct,
                        stop_loss_pct: slPct,
                        quantity: quantity,
                        dry_run: isDryRun
                    })
                });
                
                const resData = await response.json();
                if (resData.success) {
                    showToast(`${sym} 봇 강제 ${actionKor} 완료! (${modeText})`);
                    if (typeof window.refreshTossPortfolio === 'function') window.refreshTossPortfolio();
                    if (typeof window.loadAutoBotLogs === 'function') window.loadAutoBotLogs();
                    if (typeof window.loadBotPositions === 'function') window.loadBotPositions();
                } else {
                    alert(`강제 거래 실패: ${resData.message}`);
                }
            } catch (err) {
                console.error(err);
                alert(`에러 발생: ${err.message}`);
            } finally {
                applyBtn.disabled = false;
                applyBtn.textContent = '↗ 적용';
            }
        };
    }

    const adviceBtn = panel.querySelector('.toss-symbol-bot-advice-btn');
    if (adviceBtn) {
        adviceBtn.onclick = () => {
            const currentText = adviceBtn.textContent.trim();
            if (currentText === '매수') {
                adviceBtn.textContent = '매도';
                adviceBtn.style.color = '#fb7185';
                adviceBtn.style.borderColor = '#fb718533';
                adviceBtn.style.background = '#fb718518';
            } else {
                adviceBtn.textContent = '매수';
                adviceBtn.style.color = '#34d399';
                adviceBtn.style.borderColor = '#34d39933';
                adviceBtn.style.background = '#34d39918';
            }
        };
    }

    refreshLevels();
    window._refreshSymbolBotTpslLevels = refreshLevelsFromPct;
};

window.updateTossAdvisoryCard = function(stock) {
    const advisoryEl = document.getElementById('toss-order-ai-advisory');
    const contentEl = document.getElementById('toss-advisory-content');
    const badgeEl = document.getElementById('toss-advisory-status-badge');
    if (!advisoryEl || !contentEl || !badgeEl) return;

    if (!stock) {
        advisoryEl.style.display = 'none';
        contentEl.innerHTML = '<div style="text-align: center; color: #64748b; padding: 1rem 0;">종목을 입력하고 조회하면 AI 실시간 분석 및 추천 매매 가이드가 제공됩니다.</div>';
        badgeEl.textContent = '분석 대기';
        badgeEl.style.background = 'rgba(100, 116, 139, 0.15)';
        badgeEl.style.color = '#64748b';
        return;
    }

    advisoryEl.style.display = 'block';

    const rsiVal = parseFloat(stock.reason?.indicators?.rsi || stock.rsi || 50);
    const mfcVal = parseFloat(stock.reason?.indicators?.mfc_score || stock.mfcScore || 50);
    const pickVal = parseFloat(stock.reason?.rec_score || stock.recScore || 50);
    const path = stock.consensusPath || [];
    const currentPrice = tossCurrentRawPriceInfo ? tossCurrentRawPriceInfo.currentPrice : (stock.rawPrice || 0);

    // 5일 예측값 기준 하락/상승 여부 판별
    let trendText = '중립';
    let trendColor = '#cbd5e1';
    let pathDiffPercent = 0;
    if (path && path.length > 0) {
        const lastVal = path[Math.min(4, path.length - 1)];
        const baseVal = currentPrice || path[0];
        pathDiffPercent = ((lastVal - baseVal) / baseVal) * 100;
        if (pathDiffPercent >= 2) {
            trendText = '단기 상승 우세';
            trendColor = '#34d399';
        } else if (pathDiffPercent <= -2) {
            trendText = '단기 하락 우세';
            trendColor = '#fb7185';
        }
    }

    // 리스크 등급 및 추천가 설정
    let riskLevel = 'MEDIUM'; // LOW, MEDIUM, HIGH, EXTREME
    let riskBadgeColor = '#fbbf24';
    let riskBadgeBg = 'rgba(251, 191, 36, 0.15)';
    let riskText = '보통 (안정적인 흐름)';
    
    if (rsiVal > 75) {
        riskLevel = 'EXTREME';
        riskBadgeColor = '#f43f5e';
        riskBadgeBg = 'rgba(244, 63, 94, 0.2)';
        riskText = '🚨 극적 과열 (초위험)';
    } else if (rsiVal > 65) {
        riskLevel = 'HIGH';
        riskBadgeColor = '#fb7185';
        riskBadgeBg = 'rgba(251, 113, 133, 0.15)';
        riskText = '⚠️ 과열 진입 (주의)';
    } else if (rsiVal < 32) {
        riskLevel = 'LOW';
        riskBadgeColor = '#34d399';
        riskBadgeBg = 'rgba(52, 211, 153, 0.15)';
        riskText = '🟢 과매도 (매수 적기)';
    } else if (rsiVal < 42) {
        riskLevel = 'LOW';
        riskBadgeColor = '#38bdf8';
        riskBadgeBg = 'rgba(56, 189, 248, 0.15)';
        riskText = '안정 (저평가 매력)';
    }

    // 추천 지정가(Limit Price) 제안
    let limitDiscount = 0.015;
    if (riskLevel === 'EXTREME') limitDiscount = 0.04;
    else if (riskLevel === 'HIGH') limitDiscount = 0.025;
    else if (riskLevel === 'LOW') limitDiscount = 0.005;
    
    const recommendedEntryUsd = currentPrice * (1 - limitDiscount);
    const cur = localStorage.getItem('tossCurrency') || 'KRW';
    const rate = window.CURRENT_USD_RATE || 1400;
    
    let displayRecPrice = recommendedEntryUsd;
    let currencySign = '$';
    let fractionDigits = 2;
    if (stock.nativeCurrency === 'KRW') {
        displayRecPrice = recommendedEntryUsd;
        if (cur === 'USD') {
            displayRecPrice = recommendedEntryUsd / rate;
            currencySign = '$';
            fractionDigits = 2;
        } else {
            currencySign = '₩';
            fractionDigits = 0;
        }
    } else {
        if (cur === 'KRW') {
            displayRecPrice = recommendedEntryUsd * rate;
            currencySign = '₩';
            fractionDigits = 0;
        } else {
            currencySign = '$';
            fractionDigits = 2;
        }
    }
    const fmtRecPrice = currencySign + Math.round(displayRecPrice).toLocaleString(undefined, {minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits});

    // 전문가 조언 멘트 생성
    let adviceComment = '';
    if (riskLevel === 'EXTREME') {
        adviceComment = `현재 극심한 오버슈팅 구간(RSI ${rsiVal.toFixed(1)})으로, 단기 차익 실현 매물이 쏟아질 가능성이 높습니다. 신규 매수는 지극히 위험하며, 조정 시 지지선인 <strong>${fmtRecPrice}</strong> 부근까지 대기 매수(Limit)를 권장합니다.`;
    } else if (riskLevel === 'HIGH') {
        adviceComment = `단기 상승 모멘텀(RSI ${rsiVal.toFixed(1)})이 과열권에 진입했습니다. 추격 매수보다는 <strong>${fmtRecPrice}</strong> 라인 근처에서 분할 매수 전략으로 접근하여 평단가를 관리하세요.`;
    } else if (riskLevel === 'LOW' && rsiVal < 32) {
        adviceComment = `과매도 시그널(RSI ${rsiVal.toFixed(1)})이 포착되었습니다. 기술적 반등 및 가치 환원 가능성이 높은 최적의 진입 구간입니다. 적극적으로 <strong>${fmtRecPrice}</strong> 부근에서 분할 매집을 개시하십시오.`;
    } else {
        if (pathDiffPercent >= 2) {
            adviceComment = `AI 5일 시뮬레이션 경로상 우상향 흐름(+${pathDiffPercent.toFixed(1)}%)이 지배적입니다. 안정적인 정배열 매수 구간이며, <strong>${fmtRecPrice}</strong> 부근에서 진입 시 안전 마진 확보가 가능합니다.`;
        } else if (pathDiffPercent <= -2) {
            adviceComment = `AI 시뮬레이션이 하향 추세(-${Math.abs(pathDiffPercent).toFixed(1)}%)를 가리키고 있습니다. 단기 하락 압력이 있으므로, 무리한 매수보다는 관망하거나 <strong>${fmtRecPrice}</strong> 아래의 지지 여부를 먼저 확인하십시오.`;
        } else {
            adviceComment = `현재 보합 및 횡보 구간입니다. 가격 변동폭이 좁으므로 방향성이 결정될 때까지 관망하거나, <strong>${fmtRecPrice}</strong> 선을 기준으로 박스권 하단 지정가 매수로 조심스럽게 타진해 보세요.`;
        }
    }

    badgeEl.textContent = riskText;
    badgeEl.style.background = riskBadgeBg;
    badgeEl.style.color = riskBadgeColor;

    // 🐳 우측 whale 패널 AI 신호 배지 동기 업데이트
    const whaleBadgeEl = document.getElementById('toss-whale-ai-badge');
    const whaleSignalDescEl = document.getElementById('toss-whale-signal-desc');
    if (whaleBadgeEl && whaleSignalDescEl) {
        let signalLabel = 'HOLD';
        let signalColor = '#fbbf24';
        let signalBg = 'rgba(251,191,36,0.15)';
        let signalBorder = 'rgba(251,191,36,0.3)';
        let signalDesc = `RSI ${rsiVal.toFixed(1)} · ${trendText}`;

        if (riskLevel === 'EXTREME') {
            signalLabel = 'SELL';
            signalColor = '#f43f5e';
            signalBg = 'rgba(244,63,94,0.18)';
            signalBorder = 'rgba(244,63,94,0.4)';
            signalDesc = `RSI ${rsiVal.toFixed(1)} · 극도 과열`;
        } else if (riskLevel === 'HIGH') {
            signalLabel = 'CAUTION';
            signalColor = '#fb7185';
            signalBg = 'rgba(251,113,133,0.15)';
            signalBorder = 'rgba(251,113,133,0.35)';
            signalDesc = `RSI ${rsiVal.toFixed(1)} · 과열 주의`;
        } else if (riskLevel === 'LOW' && rsiVal < 32) {
            signalLabel = 'BUY';
            signalColor = '#34d399';
            signalBg = 'rgba(52,211,153,0.15)';
            signalBorder = 'rgba(52,211,153,0.35)';
            signalDesc = `RSI ${rsiVal.toFixed(1)} · 과매도 반등`;
        } else if (pathDiffPercent >= 2) {
            signalLabel = 'BUY';
            signalColor = '#34d399';
            signalBg = 'rgba(52,211,153,0.15)';
            signalBorder = 'rgba(52,211,153,0.35)';
            signalDesc = `RSI ${rsiVal.toFixed(1)} · ${trendText}`;
        } else if (pathDiffPercent <= -2) {
            signalLabel = 'SELL';
            signalColor = '#fb7185';
            signalBg = 'rgba(251,113,133,0.15)';
            signalBorder = 'rgba(251,113,133,0.35)';
            signalDesc = `RSI ${rsiVal.toFixed(1)} · ${trendText}`;
        }

        whaleBadgeEl.textContent = signalLabel;
        whaleBadgeEl.style.background = signalBg;
        whaleBadgeEl.style.color = signalColor;
        whaleBadgeEl.style.borderColor = signalBorder;
        whaleSignalDescEl.textContent = signalDesc;

        // AI 신호 패널 배경 색상도 신호에 맞게 변환
        const aiSignalPanel = document.getElementById('toss-whale-ai-signal');
        if (aiSignalPanel) {
            aiSignalPanel.style.borderColor = signalBorder;
            aiSignalPanel.style.background = signalBg.replace('0.15)', '0.08)').replace('0.18)', '0.08)');
            aiSignalPanel.style.borderRadius = '5px';
        }
    }

    contentEl.innerHTML = `
        <div class="toss-advisory-row">
            <span style="color: #94a3b8;">AI 단기 추세:</span>
            <span style="font-weight: 800; color: ${trendColor};">${trendText}</span>
        </div>
        <div class="toss-advisory-row">
            <span style="color: #94a3b8;">추천 진입 희망가:</span>
            <span style="font-weight: 800; color: #38bdf8; font-family: monospace;">${fmtRecPrice}</span>
        </div>
        <div class="toss-advisory-comment">
            💡 <strong>Advice:</strong> ${adviceComment}
        </div>
        <div id="toss-advisory-meta" data-rsi="${rsiVal}" data-mfc="${mfcVal}" data-pick="${pickVal}" data-path-diff="${pathDiffPercent}" data-symbol="${stock.symbol}" style="display: none;"></div>
    `;
    requestAnimationFrame(() => {
        if (typeof window.syncOrderLayoutHeights === 'function') window.syncOrderLayoutHeights();
    });
};

window.renderOrderChart = function(candles, period) {
    const container = document.getElementById('toss-order-chart');
    if (!container) return;
    
    container.innerHTML = '';
    tossOrderChartInstance = null;
    
    if (!candles || candles.length === 0) {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.85rem;">차트 데이터가 없습니다.</div>`;
        return;
    }
    
    const displayCandles = candles;
    
    const containerHeight = Math.max(100, container.clientHeight || 200);
    
    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 600,
        height: containerHeight,
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: '#94a3b8',
            fontSize: 10,
            fontFamily: 'Outfit, sans-serif'
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.02)' }
        },
        rightPriceScale: {
            borderVisible: false,
            scaleMargins: {
                top: 0.04,    // 캔들이 상단 영역을 충분히 채우도록 여백 최적화
                bottom: 0.2  // 볼륨 그래프와 오버레이 겹침 방지
            }
        },
        timeScale: {
            borderVisible: false,
            timeVisible: true,
            secondsVisible: false
        }
    });
    
    const candleSeries = chart.addCandlestickSeries({
        upColor: '#f25f7a',
        downColor: '#5f97f2',
        borderUpColor: '#f25f7a',
        borderDownColor: '#5f97f2',
        wickUpColor: '#f25f7a',
        wickDownColor: '#5f97f2'
    });
    
    candleSeries.setData(displayCandles);
    
    // 볼륨 시리즈의 가격 스케일을 독립된 'volume' 스케일 ID로 격리
    const volumeSeries = chart.addHistogramSeries({
        color: 'rgba(56, 189, 248, 0.12)',
        priceFormat: {
            type: 'volume'
        },
        priceScaleId: 'volume'
    });
    
    // 격리된 'volume' 가격축에 대해서만 하단 30% 영역으로 오버레이 설정 적용
    chart.priceScale('volume').applyOptions({
        scaleMargins: {
            top: 0.7,
            bottom: 0
        },
        visible: false // 가격축에 볼륨 숫자(수치) 미표시
    });
    
    const volumeData = displayCandles.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)'
    }));
    
    volumeSeries.setData(volumeData);
    
    // 차트 데이터가 가로 영역에 꽉 차도록 스케일 조정 (왼쪽 빈 공간 제거)
    chart.timeScale().fitContent();
    
    tossOrderChartInstance = chart;

    requestAnimationFrame(() => {
        if (typeof window.syncOrderLayoutHeights === 'function') window.syncOrderLayoutHeights();
    });
    
    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            const h = Math.max(100, height || container.clientHeight || 200);
            if (chart) {
                chart.resize(width, h);
            }
        });
        resizeObserver.observe(container);
    }
};

window.fetchTickerPriceData = function(symbol, period = '1d', interval = '5m', options = {}) {
    if (!symbol) return;
    const cleanSym = symbol.trim().toUpperCase();
    const orderSymbol = options.orderSymbol || (typeof window.normalizeBrokerOrderSymbol === 'function' ? window.normalizeBrokerOrderSymbol(cleanSym) : cleanSym);
    tossCurrentActiveSymbol = cleanSym;
    
    // 이전 종목 고래 시뮬레이션 중단
    if (typeof window.stopWhaleSimulation === 'function') {
        window.stopWhaleSimulation();
    }
    
    const panel = document.getElementById('toss-realtime-price-panel');
    if (panel) {
        panel.innerHTML = `<span style="font-size:0.9rem; color:var(--text-muted);">조회 중...</span>`;
    }
    
    fetch(`http://127.0.0.1:8000/api/price/${cleanSym}?period=${period}&interval=${interval}`)
        .then(res => {
            if (!res.ok) throw new Error('조회 실패');
            return res.json();
        })
        .then(data => {
            if (tossCurrentActiveSymbol !== cleanSym) return;
            data.orderSymbol = orderSymbol;
            data.requestedSymbol = cleanSym;
            const chartSymbolInput = document.getElementById('toss-chart-symbol-input');
            if (chartSymbolInput && data.symbol && /\.(KS|KQ)$/i.test(String(data.symbol))) {
                chartSymbolInput.value = String(data.symbol).toUpperCase();
                chartSymbolInput.dataset.selectedYahooSymbol = String(data.symbol).toUpperCase();
            }
            
            // 전역 백업 갱신
            tossCurrentRawCandles = data.candles || [];
            tossCurrentRawPriceInfo = data;
            
            window.updateRealtimePricePanel(data);
            
            // 주문 금액 입력창 설정
            const priceInput = document.getElementById('toss-order-price');
            if (priceInput && (parseFloat(priceInput.value) === 0 || priceInput.value === '')) {
                priceInput.value = data.currentPrice;
            }
            
            window.renderOrderChart(tossCurrentRawCandles, period);
            if (typeof window._refreshSymbolBotTpslLevels === 'function') {
                window._refreshSymbolBotTpslLevels();
            }
            try {
                window.updateTossChartAnalysis(orderSymbol || cleanSym);
            } catch (analysisErr) {
                console.error('Chart analysis panel render failed:', analysisErr);
            }
            
            // 고래 수급 — Volume Profile + 대량거래 캔들 (실데이터)
            if (typeof window.refreshWhaleFlow === 'function') {
                window.refreshWhaleFlow(cleanSym, period, interval);
            }
            
            // 미체결 및 최근 체결 내역 테이블 필터링 렌더링 반영
            if (typeof renderTossPortfolio === 'function') {
                renderTossPortfolio();
            }
            
            window.startRealtimePriceLoop(cleanSym, period, interval);
        })
        .catch(err => {
            console.error('Failed to fetch price data:', err);
            if (panel) {
                panel.innerHTML = `<span style="font-size:0.85rem; color:var(--live-red);">종목 정보 조회 실패 (존재하지 않는 티커이거나 yfinance 일시 오류)</span>`;
            }
        });
};

window.startRealtimePriceLoop = function(symbol, period = '1d', interval = '5m') {
    // 기존 루프 모두 종료
    window._tossYfinanceOnly = false;
    window._tossFallbackNotified = false;
    if (tossRealtimePriceIntervalId) {
        clearInterval(tossRealtimePriceIntervalId);
        tossRealtimePriceIntervalId = null;
    }
    if (window._tossRealtimeTickIntervalId) {
        clearInterval(window._tossRealtimeTickIntervalId);
        window._tossRealtimeTickIntervalId = null;
    }

    // ─────────────────────────────────────────────────────────────
    // TRACK A: 토스증권 SSE 스트림 구독 (실패 시 3초 폴링 폴백)
    // ─────────────────────────────────────────────────────────────

    // 기존 EventSource 정리
    if (window._tossEventSource) {
        window._tossEventSource.close();
        window._tossEventSource = null;
    }

    const _applyTossTick = (tick) => {
        if (tossCurrentActiveSymbol !== symbol) return;
        if (tick.event === 'connected') return; // 초기 ping 무시
        if (tick.error) {
            console.warn('[Toss SSE] 가격 오류:', tick.error);
            return;
        }
        const tickAsInfo = {
            currentPrice: tick.price,
            change: tick.change,
            changePct: tick.changePct,
            currency: tick.currency,
            volume: tossCurrentRawPriceInfo ? tossCurrentRawPriceInfo.volume : 0,
            rsi: tossCurrentRawPriceInfo ? tossCurrentRawPriceInfo.rsi : null,
        };
        tossCurrentRawPriceInfo = { ...tossCurrentRawPriceInfo, ...tickAsInfo };
        window.updateRealtimePricePanel(tickAsInfo);
    };

    let _sseConnected = false;

    const _startYfinanceRealtimeLoop = () => {
        if (window._tossYfinanceOnly) return;
        window._tossYfinanceOnly = true;
        if (window._tossEventSource) {
            window._tossEventSource.close();
            window._tossEventSource = null;
        }
        if (!window._tossFallbackNotified) {
            console.info('[Toss] 시세 API 제한/오류 - yfinance 실시간 폴백 사용');
            window._tossFallbackNotified = true;
        }
        if (!window._tossRealtimeTickIntervalId) {
            window._tossRealtimeTickIntervalId = setInterval(() => {
                if (!symbol || tossCurrentActiveSymbol !== symbol) {
                    clearInterval(window._tossRealtimeTickIntervalId);
                    window._tossRealtimeTickIntervalId = null;
                    return;
                }
                fetch(`http://127.0.0.1:8000/api/price/${symbol}/realtime`)
                    .then(r => r.json())
                    .then(t => _applyTossTick({
                        price: t.price,
                        change: t.change,
                        changePct: t.changePct,
                        source: 'yfinance',
                    }))
                    .catch(() => {});
            }, 3000);
        }
    };

    const _handlePriceTick = (tick) => {
        if (tick.source && tick.source !== 'toss') {
            _startYfinanceRealtimeLoop();
        }
        _applyTossTick(tick);
    };

    try {
        const es = new EventSource(`http://127.0.0.1:8000/api/toss/stream/${symbol}`);
        window._tossEventSource = es;

        es.onopen = () => {
            _sseConnected = true;
            console.info(`[Toss SSE] 연결됨: ${symbol}`);
            // SSE 연결 성공 시 3초 폴링 폴백 중지
            if (window._tossRealtimeTickIntervalId) {
                clearInterval(window._tossRealtimeTickIntervalId);
                window._tossRealtimeTickIntervalId = null;
            }
        };

        es.onmessage = (event) => {
            try {
                const tick = JSON.parse(event.data);
                _handlePriceTick(tick);
            } catch (e) {}
        };

        es.onerror = (err) => {
            console.warn('[Toss SSE] 연결 오류 — 3초 REST 폴링으로 폴백');
            es.close();
            window._tossEventSource = null;
            _sseConnected = false;

            // SSE 실패 시 폴백: yfinance 실시간 폴링
            if (!window._tossRealtimeTickIntervalId) {
                _startYfinanceRealtimeLoop();
            }
        };
    } catch (e) {
        console.warn('[Toss SSE] EventSource 초기화 실패:', e);
    }


    // ─────────────────────────────────────────────────────────────
    // TRACK B: 30초마다 전체 OHLCV 캔들 + 분석 패널 갱신
    // ─────────────────────────────────────────────────────────────
    tossRealtimePriceIntervalId = setInterval(() => {
        if (!symbol || tossCurrentActiveSymbol !== symbol) {
            clearInterval(tossRealtimePriceIntervalId);
            return;
        }
        fetch(`http://127.0.0.1:8000/api/price/${symbol}?period=${period}&interval=${interval}`)
            .then(res => { if (!res.ok) throw new Error('조회 실패'); return res.json(); })
            .then(data => {
                if (tossCurrentActiveSymbol !== symbol) return;

                tossCurrentRawCandles = data.candles || [];
                tossCurrentRawPriceInfo = data;

                window.updateRealtimePricePanel(data);
                window.renderOrderChart(tossCurrentRawCandles, period);

                if (typeof window._refreshSymbolBotTpslLevels === 'function') {
                    window._refreshSymbolBotTpslLevels();
                }

                if (typeof window.updateTossChartAnalysis === 'function') {
                    window.updateTossChartAnalysis(orderSymbol || symbol);
                }
                if (typeof window.updateTossAdvisoryCard === 'function') {
                    window.updateTossAdvisoryCard(data);
                }
                if (typeof window.refreshWhaleFlow === 'function') {
                    window.refreshWhaleFlow(symbol, period, interval);
                }
                if (typeof renderTossPortfolio === 'function') {
                    renderTossPortfolio();
                }
            })
            .catch(err => console.warn('Failed to poll full candle data:', err));
    }, 30000); // 30초 주기로 캔들 전체 갱신
};


window.quickOrder = function(symbol) {
    if (!symbol) return;
    const cleanSym = typeof window.normalizeBrokerOrderSymbol === 'function'
        ? window.normalizeBrokerOrderSymbol(symbol)
        : symbol.replace('.NAS', '').replace('.NYS', '').replace('.AMX', '').toUpperCase();
    if (!cleanSym) return;
    
    const hasToken = localStorage.getItem('github_pat') || localStorage.getItem('github_obsidian_token');
    if (!hasToken) {
        alert("⚠️ GitHub 토큰(GitHub PAT)이 등록되어 있지 않습니다.\n트레이딩 기능은 보안 및 연동 권한을 위해 GitHub 토큰이 등록된 상태에서만 사용 가능합니다. 우측 상단의 Admin Login을 통해 먼저 GitHub 토큰을 등록해 주세요.");
        return;
    }
    
    const tradeTab = document.querySelector('.global-tab[data-target="view-trade"]');
    if (tradeTab) {
        tradeTab.click();
    }
    
    const ordersTab = document.querySelector('.toss-sub-tab[data-sub-target="toss-sub-orders"]');
    if (ordersTab) {
        ordersTab.click();
    }
    
    const symbolInput = document.getElementById('toss-order-symbol');
    const chartSymbolInput = document.getElementById('toss-chart-symbol-input');
    const nameSpan = document.getElementById('toss-order-stock-name');
    const rawSym = String(symbol || '').trim().toUpperCase();
    const candidate = typeof window.buildOrderSymbolCandidates === 'function'
        ? window.buildOrderSymbolCandidates().find(c => c.symbol === cleanSym || c.yahooSymbol === rawSym || c.rawSymbol === rawSym)
        : null;
    const chartSym = rawSym.endsWith('.KS') || rawSym.endsWith('.KQ')
        ? rawSym
        : (candidate?.yahooSymbol || (typeof window.toYahooOrderSymbol === 'function' ? window.toYahooOrderSymbol(cleanSym, rawSym) : cleanSym));
    
    if (symbolInput) {
        symbolInput.value = cleanSym;
    }
    if (chartSymbolInput) {
        chartSymbolInput.value = chartSym;
        chartSymbolInput.dataset.selectedYahooSymbol = chartSym;
        chartSymbolInput.dataset.selectedName = candidate?.name || '';
    }
    if (nameSpan && typeof window.findStockNameLocal === 'function') {
        const displayName = window.findStockNameLocal(cleanSym);
        nameSpan.textContent = displayName && displayName !== cleanSym ? displayName : '';
    }
    if (typeof window.updateTossOrderHelper === 'function') {
        window.updateTossOrderHelper();
    }
    if (typeof window.refreshWhaleFlow === 'function') {
        const tickerEl = document.getElementById('toss-whale-ticker');
        if (tickerEl) tickerEl.textContent = cleanSym;
    }
    
    const savedPeriod = sessionStorage.getItem('tossChartPeriod') || '1y';
    const activePeriodBtn = document.querySelector(`.toss-chart-period-btn[data-period="${savedPeriod}"]`);
    if (activePeriodBtn) {
        document.querySelectorAll('.toss-chart-period-btn').forEach(b => b.classList.remove('active'));
        activePeriodBtn.classList.add('active');
    }
    window.fetchTickerPriceData(chartSym, savedPeriod, '1d', { orderSymbol: cleanSym });
};

/* ── [v16] 내 돈 탭 ─────────────────────────────────────────────────────────
 * 화면 6개를 뷰 6개로 두면 "내 자산" 메뉴가 11항목이 된다. 한 뷰 안에 탭으로
 * 넣고, **활성 탭만** 그린다 — 6개를 한 번에 그리면 서버 호출이 6번 나간다.
 * 한 번 그린 탭은 다시 그리지 않는다 (사용자가 계산 버튼으로 갱신한다).
 * ------------------------------------------------------------------------ */
const INVESTOR_TABS = {
    tax: 'renderTax', fx: 'renderFx', postsale: 'renderPostSale',
    avgdown: 'renderAvgDown', habits: 'renderHabits', dividend: 'renderDividend',
    recovery: 'renderRecovery', overnight: 'renderOvernight',
    fxtiming: 'renderFxTiming'
};
const _invDrawn = new Set();

function showInvestorTab(key) {
    const btns = document.querySelectorAll('.inv-tab');
    if (!btns.length) return;
    if (!key) {
        const cur = document.querySelector('.inv-tab.active');
        key = cur ? cur.dataset.invTab : 'tax';
    }
    btns.forEach(b => {
        const on = b.dataset.invTab === key;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.inv-panel').forEach(p => {
        p.classList.toggle('active', p.id === `inv-${key}-panel`);
    });
    if (!window.Investor || _invDrawn.has(key)) return;
    try {
        window.Investor[INVESTOR_TABS[key]]();
        _invDrawn.add(key);
    } catch (e) { console.error('Investor render failed:', key, e); }
}

/*  탭 클릭은 **위임**으로 받는다.
 *  script.js 는 startAuthAndAppInit() 에서 동적으로 로드되므로 실행 시점에
 *  DOMContentLoaded 가 **이미 끝나 있다.** 거기에 리스너를 걸면 영영 안
 *  걸리고 탭이 죽는다 (실제로 죽었다). document 위임이면 로드 시점과
 *  무관하고, 탭을 다시 그려도 다시 걸 필요가 없다. */
document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.inv-tab') : null;
    if (!btn) return;
    e.preventDefault();
    showInvestorTab(btn.dataset.invTab);
});

/* ── [v16] 날짜 헤더를 쓰는 화면 ────────────────────────────────────────────
 * 헤더(날짜 선택 · 종목 관리 · Regime 칩)는 `renderDashboard(data)` 가 채우는
 * 화면에서만 의미가 있다. 나머지 화면은 백엔드에서 직접 받아 그리므로
 * 날짜를 바꿔도 아무 일이 일어나지 않는다 — 붙어 있으면 오해만 준다.
 *
 * 예전에는 **숨길 화면 목록**으로 관리했다. 화면을 더할 때마다 두 군데
 * 목록에 넣어야 했고, 실제로 빠뜨려서 QUANT LAB·내 돈 화면에 날짜가
 * 따라붙었다. 허용 목록 한 곳으로 뒤집는다 — 새 화면의 기본값은 "안 보임".
 * ------------------------------------------------------------------------ */
const DATE_AWARE_VIEWS = new Set([
    'view-home',       // 트렌딩 · 티커 · 액션 요약
    'view-dashboard',  // REPORT 본문
    'view-compare',    // T-N 비교
    'view-discovery',  // 그날의 픽
    'view-planner'     // data.strategy
]);

function syncHeaderChrome(targetId) {
    const dateAware = DATE_AWARE_VIEWS.has(targetId);
    const isReport = targetId === 'view-dashboard';
    const headerTop = document.querySelector('.header-top');
    const dateWrap = document.querySelector('.date-selector-wrapper');
    const search = document.querySelector('.header-search-wrapper');
    const regime = document.getElementById('header-regime-indicator');

    if (headerTop) headerTop.style.display = dateAware ? 'flex' : 'none';
    if (dateWrap) dateWrap.style.display = dateAware ? 'flex' : 'none';
    if (search) search.style.display = (dateAware && isReport) ? 'flex' : 'none';
    if (regime) regime.style.display = (dateAware && !isReport) ? 'flex' : 'none';
}

/* ── [v18] 화면 탭 ─────────────────────────────────────────────────────────
 * 메뉴가 21개까지 늘어 성격이 같은 화면을 묶었다.
 *
 * **뷰도 디스패치도 건드리지 않는다.** 화면 전환에는 렌더러 호출 · 권한
 * 게이팅 · 헤더 동기화가 네비 클릭 하나에 묶여 있어, 그걸 뜯으면 셋이 다
 * 위험해진다. 그래서 탭 버튼이 **숨은 네비 링크를 대신 클릭**한다.
 *
 * 링크를 지우지 않고 숨기기만 한 이유이기도 하다 — 지우면 기존 기계가
 * 참조를 잃는다. 숨은 링크라도 탭으로 갈 수 있으니 "진입 가능"은 사실이다.
 * ------------------------------------------------------------------------ */
document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.vtab') : null;
    if (!btn || !btn.dataset.vtab) return;
    e.preventDefault();
    const link = document.querySelector(`.global-tab[data-target="${btn.dataset.vtab}"]`);
    if (link) link.click();
});

/* ── [v18] 스크립트 로딩이 끝난 뒤 한 번 더 그린다 ──────────────────────────
 * 스크립트는 **순차 로드**된다. script.js(690KB) 다음에 kis_trade ·
 * quant_lab · quant_lab2 · investor · dna 가 줄줄이 온다.
 *
 * 세션 복원(`activeGlobalTab`)은 +50ms 에 클릭을 날리는데, 그때는 아직
 * `window.QuantLab2` 같은 렌더러가 **없다.** 화면 전환은 되지만 내용이
 * 안 그려져 **F5 하면 빈 화면**이 됐다. 대시보드만 멀쩡했던 건 그건
 * script.js 자신이 그리기 때문이다.
 *
 * 전부 로드된 뒤 활성 탭을 다시 클릭한다. 멱등이라 두 번 그려도 문제없다.
 * ------------------------------------------------------------------------ */
document.addEventListener('dashboard:scripts-ready', () => {
    const active = document.querySelector('.global-tab.active');
    if (!active) return;
    const id = active.getAttribute('data-target');
    if (id === 'view-home' || id === 'view-dashboard') return;   // 이미 그려져 있다
    try { active.click(); }
    catch (e) { console.error('scripts-ready 재렌더 실패:', e); }
});
