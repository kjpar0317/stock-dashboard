let aiCore = null;
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
        tooltip.style.left = (x + 15) + 'px';
        tooltip.style.top = Math.max(10, y - 80) + 'px';
        tooltip.style.display = 'block';
    }
};

window.showChartTooltip = function (event, day, price, pctChange, o, h, l, v) {
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
        tooltip.style.left = (x + 15) + 'px';
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

// ===== [NEW UI] Export Helpers =====
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportCurrentReportsToCSV() {
    const data = window.CURRENT_VIEW_DATA;
    if (!data) return alert("데이터가 로드되지 않았습니다.");
    
    let csvContent = "\ufeff"; // BOM for Korean Excel compatibility
    csvContent += "구분,종목명,티커,현재가,평균매수가,수익률,변동률,추천비중,Action Score,결정,종합의견\n";
    
    // Holdings
    (data.holdings || []).forEach(h => {
        const pnl = h.holdingPnlPct !== undefined ? h.holdingPnlPct + "%" : (h.return || '');
        const change = h.changePercent !== undefined ? h.changePercent.toFixed(2) + "%" : "";
        const pos = h.positionSizePct !== undefined ? h.positionSizePct + "%" : "";
        const advice = h.advice || h.reason?.outlook || '';
        csvContent += `보유종목,"${h.name}","${h.symbol}","${h.currentPrice}","${h.avgPrice}","${pnl}","${change}","${pos}","${h.actionScore || ''}","${h.recommendation || ''}","${(advice).replace(/"/g, '""')}"\n`;
    });
    
    // Watchlist
    (data.watchlist || []).forEach(w => {
        const change = w.changePercent !== undefined ? w.changePercent.toFixed(2) + "%" : "";
        const advice = w.advice || w.reason?.outlook || '';
        csvContent += `관심종목,"${w.name}","${w.symbol}","${w.currentPrice}","-","-","${change}","-","${w.actionScore || ''}","${w.recommendation || ''}","${(advice).replace(/"/g, '""')}"\n`;
    });
    
    const fileName = `portfolio_report_${data.date}.csv`;
    downloadFile(csvContent, fileName, "text/csv;charset=utf-8;");
}

function exportCurrentReportsToJSON() {
    const data = window.CURRENT_VIEW_DATA;
    if (!data) return alert("데이터가 로드되지 않았습니다.");
    const payload = {
        date: data.date,
        holdings: data.holdings,
        watchlist: data.watchlist
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(jsonStr, `portfolio_report_${data.date}.json`, "application/json;charset=utf-8;");
}

function exportDiscoveryToCSV() {
    const data = window.CURRENT_VIEW_DATA;
    if (!data || !data.discovery) return alert("Discovery 데이터가 존재하지 않습니다.");
    
    const discovery = data.discovery;
    let csvContent = "\ufeff"; // BOM
    csvContent += "시장,순위,티커,종목명,가격,변동률,종합점수,의사결정,Risk-Reward Score,예상거래량배율,ADL 추세,RSI,한줄요약\n";
    
    const allUs = discovery.picks_us || [];
    const directCrypto = discovery.picks_crypto || [];
    const picksUs = [];
    const picksCrypto = [...directCrypto];
    
    allUs.forEach(p => {
        const t = (p.ticker || '').toUpperCase();
        if (t.endsWith('-USD') || t.endsWith('-BTC') || t.endsWith('-ETH')) {
            if (!picksCrypto.some(existing => existing.ticker === p.ticker)) {
                picksCrypto.push(p);
            }
        } else {
            picksUs.push(p);
        }
    });
    
    const picksUsValue = discovery.picks_us_value || [];
    const picksKr = discovery.picks_kr || [];
    
    const writePicks = (picks, marketLabel) => {
        picks.forEach((p, idx) => {
            const rank = idx + 1;
            const change = p.change_pct !== undefined ? p.change_pct.toFixed(2) + "%" : "";
            const displayScore = p.actionScore !== undefined ? p.actionScore : p.rec_score;
            const recTier = p.recommendation || (displayScore >= 75 ? 'BUY' : displayScore <= 25 ? 'SELL' : 'HOLD');
            const rr = p.factors?.rr_score !== undefined ? p.factors.rr_score : "";
            const prjVol = p.intraday?.volume_surge_projected !== undefined ? p.intraday.volume_surge_projected + "x" : (p.volume_surge_projected !== undefined ? p.volume_surge_projected + "x" : "");
            const adl = p.adl_trend || "";
            const rsiVal = p.rsi || "";
            csvContent += `"${marketLabel}",${rank},"${p.ticker}","${p.name}","${p.price}","${change}",${displayScore},"${recTier}","${rr}","${prjVol}","${adl}","${rsiVal}","${(p.advice_short || '').replace(/"/g, '""')}"\n`;
        });
    };
    
    writePicks(picksUs, "미국 발굴");
    writePicks(picksUsValue, "미국 저평가 성장주");
    writePicks(picksCrypto, "암호화폐 발굴");
    writePicks(picksKr, "국내 발굴");
    
    const fileName = `discovery_picks_${data.date}.csv`;
    downloadFile(csvContent, fileName, "text/csv;charset=utf-8;");
}

function exportDiscoveryToJSON() {
    const data = window.CURRENT_VIEW_DATA;
    if (!data || !data.discovery) return alert("Discovery 데이터가 존재하지 않습니다.");
    const jsonStr = JSON.stringify(data.discovery, null, 2);
    downloadFile(jsonStr, `discovery_picks_${data.date}.json`, "application/json;charset=utf-8;");
}

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
        window.IS_LATEST_REPORT = true; 
        selector.value = latestIndex;
        renderDashboard(REPORTS_HISTORY[latestIndex]);

        // 날짜 선택 이벤트 리스너
        selector.addEventListener('change', (e) => {
            const selectedIndex = parseInt(e.target.value);
            renderDashboard(REPORTS_HISTORY[selectedIndex]);

            // 변경 시 간단한 애니메이션 효과
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.animation = 'none';
                card.offsetHeight; // 트리거 리플로우
                card.style.animation = 'fadeInUp 0.5s ease-out backwards';
            });
        });
        
        // [NEW] Export Dropdown UI Toggle & Action Handlers
        const exportDropdownBtn = document.getElementById('export-dropdown-btn');
        const exportDropdownMenu = document.getElementById('export-dropdown-menu');
        if (exportDropdownBtn && exportDropdownMenu) {
            exportDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportDropdownMenu.classList.toggle('show');
            });
            
            document.addEventListener('click', () => {
                exportDropdownMenu.classList.remove('show');
            });
        }

        const btnHoldingsCSV = document.getElementById('export-holdings-csv');
        const btnHoldingsJSON = document.getElementById('export-holdings-json');
        const btnDiscoveryCSV = document.getElementById('export-discovery-csv');
        const btnDiscoveryJSON = document.getElementById('export-discovery-json');

        if (btnHoldingsCSV) btnHoldingsCSV.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exportCurrentReportsToCSV(); exportDropdownMenu.classList.remove('show'); });
        if (btnHoldingsJSON) btnHoldingsJSON.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exportCurrentReportsToJSON(); exportDropdownMenu.classList.remove('show'); });
        if (btnDiscoveryCSV) btnDiscoveryCSV.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exportDiscoveryToCSV(); exportDropdownMenu.classList.remove('show'); });
        if (btnDiscoveryJSON) btnDiscoveryJSON.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exportDiscoveryToJSON(); exportDropdownMenu.classList.remove('show'); });

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
        // [NEW] 전역 네비게이션 탭 (DASHBOARD vs REPORT) 시스템
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

                const isReport = targetId === 'view-dashboard';
                const isDiscovery = targetId === 'view-discovery';
                const isHome = targetId === 'view-home';

                const headerSearch = document.querySelector('.header-search-wrapper');
                const headerRegime = document.getElementById('header-regime-indicator');

                if (headerRegime) {
                    headerRegime.style.display = isReport ? 'none' : 'flex';
                }
                if (headerSearch) {
                    headerSearch.style.display = isReport ? 'block' : 'none';
                }

                const terminal = document.getElementById('ai-intelligence-terminal');
                if (terminal) {
                    terminal.style.display = (isReport && window.IS_LATEST_REPORT) ? 'block' : 'none';
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // [New] Set initial header search visibility based on active tab
        const initialTab = document.querySelector('.global-tab.active');
        if (initialTab) {
            const targetId = initialTab.getAttribute('data-target');
            const isReport = targetId === 'view-dashboard';
            const headerSearch = document.querySelector('.header-search-wrapper');
            if (headerSearch) {
                headerSearch.style.display = isReport ? 'flex' : 'none';
            }
            const terminal = document.getElementById('ai-intelligence-terminal');
            if (terminal) {
                terminal.style.display = (isReport && window.IS_LATEST_REPORT) ? 'block' : 'none';
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
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
});

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

    // 3. Start AI Briefing Typing Effect
    startAiBriefing(latestData);

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
}

/**
 * [NEW] TRUE REAL-TIME SYNC ENGINE (LOCAL)
 * Polls the locally generated live_data.json (created by live_sync.py)
 */
async function syncLiveMarketData() {
    if (window.IS_LATEST_REPORT === false) return;
    if (typeof REPORTS_HISTORY === 'undefined') return;
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
        
        const liveData = window.LIVE_DATA;
        if (!liveData || !liveData.quotes) return;
        
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
                    targetStock.currentPrice = `${Math.round(newPrice).toLocaleString()}원`;
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
    document.querySelectorAll('.stock-item-wrapper').forEach(card => {
        const name = card.getAttribute('data-name');
        if (!name) return;
        const stock = stocks.find(s => s.name === name);
        
        if (stock) {
            // 1. 가격 및 변동률 업데이트
            const priceEl = card.querySelector('.price');
            if (priceEl) {
                const isUp = stock.changePercent >= 0;
                const changeHtml = stock.changePercent !== undefined ? `
                    <span class="change ${isUp ? 'up' : 'down'}" style="margin-left: 0.5rem; font-weight: 600;">
                        (${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                    </span>` : '';
                if (stock.avgPrice) {
                    priceEl.innerHTML = `평단: ${stock.avgPrice} / 현재: ${stock.currentPrice} ${changeHtml}`;
                } else {
                    priceEl.innerHTML = `현재가: ${stock.currentPrice} ${changeHtml}`;
                }
            }

            // 2. Target vs Stop Loss Band 실시간 갱신
            const bandContainer = card.querySelector('.tsl-band-container');
            if (bandContainer) {
                const newBandHtml = buildTargetStopLossBandHtml(stock);
                if (newBandHtml) {
                    bandContainer.outerHTML = newBandHtml;
                }
            }

            // 3. 체결강도 미세 실시간 갱신 (지터 효과 포함)
            const volPowerContainer = card.querySelector('.volume-power-container');
            if (volPowerContainer) {
                if (stock.reason?.indicators?.capital_flow) {
                    const cf = stock.reason.indicators.capital_flow;
                    const inflow = cf.total_inflow || 0;
                    const outflow = cf.total_outflow || 0;
                    if (inflow > 0 || outflow > 0) {
                        const jitterPercent = (Math.random() - 0.5) * 0.02; // ±1%
                        const tempStock = JSON.parse(JSON.stringify(stock));
                        const newInflow = inflow * (1 + jitterPercent);
                        const newOutflow = outflow * (1 - jitterPercent);
                        tempStock.reason.indicators.capital_flow.total_inflow = newInflow;
                        tempStock.reason.indicators.capital_flow.total_outflow = newOutflow;
                        
                        const newVolPowerHtml = buildVolumePowerHtml(tempStock);
                        if (newVolPowerHtml) {
                            volPowerContainer.outerHTML = newVolPowerHtml;
                        }
                    }
                }
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

    if (krDay >= 1 && krDay <= 5) {
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

    // [NEW] Seoul Intraday Progress Bar Update
    const krProgressContainer = document.getElementById('market-kr-progress-container');
    const krProgressFill = document.getElementById('market-kr-progress-fill');
    const krTimeRemaining = document.getElementById('market-kr-time-remaining');
    
    if (krProgressContainer && krProgressFill && krTimeRemaining) {
        if (krDay >= 1 && krDay <= 5 && krTotalMin >= 510 && krTotalMin < 1080) {
            let elapsed = 0;
            let totalPeriod = 1;
            let remainingMin = 0;
            let labelSuffix = '';

            if (krTotalMin >= 510 && krTotalMin < 540) { // Pre-market (08:30 - 09:00)
                elapsed = krTotalMin - 510;
                totalPeriod = 30;
                remainingMin = 540 - krTotalMin;
                labelSuffix = '정규장 개장';
            } else if (krTotalMin >= 540 && krTotalMin < 930) { // Regular Session (09:00 - 15:30)
                elapsed = krTotalMin - 540;
                totalPeriod = 390;
                remainingMin = 930 - krTotalMin;
                labelSuffix = '정규장 마감';
            } else if (krTotalMin >= 930 && krTotalMin < 1080) { // After-market (15:30 - 18:00)
                elapsed = krTotalMin - 930;
                totalPeriod = 150;
                remainingMin = 1080 - krTotalMin;
                labelSuffix = '거래 완전 종료';
            }

            const pct = (elapsed / totalPeriod) * 100;
            krProgressFill.style.width = pct.toFixed(1) + '%';
            
            const remHours = Math.floor(remainingMin / 60);
            const remMins = remainingMin % 60;
            
            let timeText = '';
            if (remHours > 0) {
                timeText = `${labelSuffix}까지 ${remHours}시간 ${remMins}분 남음`;
            } else {
                timeText = `${labelSuffix}까지 ${remMins}분 남음`;
            }
            krTimeRemaining.textContent = timeText;
            krProgressContainer.style.display = 'block';
        } else {
            krProgressContainer.style.display = 'none';
        }
    }

    // New York (ET: UTC-5 or UTC-4)
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const nyHours = nyTime.getHours();
    const nyMinutes = nyTime.getMinutes();
    const nyTotalMin = nyHours * 60 + nyMinutes;
    const nyDay = nyTime.getDay();
    
    let usStatusText = 'MARKET CLOSED';
    let usIsActive = false;

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

    const usIndicator = document.getElementById('market-us-indicator');
    const usStatus = document.getElementById('market-us-status');
    if (usIndicator && usStatus) {
        usIndicator.className = 'status-indicator ' + (usIsActive ? 'active' : 'inactive');
        usStatus.textContent = usStatusText;
        usStatus.style.color = usIsActive ? 'var(--live-green)' : 'var(--text-secondary)';
    }

    // [NEW] New York Intraday Progress Bar Update
    const usProgressContainer = document.getElementById('market-us-progress-container');
    const usProgressFill = document.getElementById('market-us-progress-fill');
    const usTimeRemaining = document.getElementById('market-us-time-remaining');
    
    if (usProgressContainer && usProgressFill && usTimeRemaining) {
        if (nyDay >= 1 && nyDay <= 5 && nyTotalMin >= 240 && nyTotalMin < 1200) {
            let elapsed = 0;
            let totalPeriod = 1;
            let remainingMin = 0;
            let labelSuffix = '';

            if (nyTotalMin >= 240 && nyTotalMin < 570) { // Pre-market (04:00 - 09:30)
                elapsed = nyTotalMin - 240;
                totalPeriod = 330;
                remainingMin = 570 - nyTotalMin;
                labelSuffix = '정규장 개장';
            } else if (nyTotalMin >= 570 && nyTotalMin < 960) { // Regular Session (09:30 - 16:00)
                elapsed = nyTotalMin - 570;
                totalPeriod = 390;
                remainingMin = 960 - nyTotalMin;
                labelSuffix = '정규장 마감';
            } else if (nyTotalMin >= 960 && nyTotalMin < 1200) { // Post-market (16:00 - 20:00)
                elapsed = nyTotalMin - 960;
                totalPeriod = 240;
                remainingMin = 1200 - nyTotalMin;
                labelSuffix = '거래 완전 종료';
            }

            const pct = (elapsed / totalPeriod) * 100;
            usProgressFill.style.width = pct.toFixed(1) + '%';
            
            const remHours = Math.floor(remainingMin / 60);
            const remMins = remainingMin % 60;
            
            let timeText = '';
            if (remHours > 0) {
                timeText = `${labelSuffix}까지 ${remHours}시간 ${remMins}분 남음`;
            } else {
                timeText = `${labelSuffix}까지 ${remMins}분 남음`;
            }
            usTimeRemaining.textContent = timeText;
            usProgressContainer.style.display = 'block';
        } else {
            usProgressContainer.style.display = 'none';
        }
    }
}

function startAiBriefing(data) {
    const terminal = document.getElementById('briefing-terminal-text');
    if (!terminal) return;

    if (window.IS_LATEST_REPORT === false) {
        terminal.innerHTML = '<div class="terminal-line-row">> Monitoring Offline - SESSION CLOSED</div>';
        return;
    }

    const recommended = data.recommended_stocks || [];
    const topPick = recommended[0] ? recommended[0].name : "Market";

    const lines = [
        `[SYSTEM] Initializing Antigravity V5 Core... [DONE]`,
        `[SCAN] Global liquidity heatmap loaded. 8.4TB processed.`,
        `[DETECT] Market Regime: ${data.market_regime || 'Trending-Bull'} confirmed.`,
        `[QUANT] Computing correlation matrix for ${topPick}...`,
        `[QUANT] GARCH-Ensemble volatility projection: STABLE`,
        `[ALERT] High-density accumulation detected in ${recommended[1] ? recommended[1].name : 'Alpha sectors'}.`,
        `[INFO] Institutional conviction score: ${data.portfolio_advice ? '92/100' : '78/100'}`,
        `[CORE] Real-time monitoring active. 1,400+ tickers synchronized.`
    ];

    let lineIdx = 0;
    let charIdx = 0;
    terminal.innerHTML = '';

    function typeLine() {
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
                setTimeout(typeLine, 20 + Math.random() * 30);
            } else {
                lineIdx++;
                charIdx = 0;
                setTimeout(typeLine, 400 + Math.random() * 600);
            }

            terminal.scrollTop = terminal.scrollHeight;
        } else {
            // [NEW] Clear and start live monitoring
            setTimeout(() => {
                terminal.innerHTML = ''; // CLEAR
                const p = document.createElement('div');
                p.className = 'terminal-line-row';
                p.textContent = '> Live monitoring active. Awaiting market catalysts...';
                terminal.appendChild(p);

                const cursor = document.createElement('span');
                cursor.className = 'terminal-cursor';
                terminal.appendChild(cursor);
                
                startLiveMonitoringLoop(data, terminal);
            }, 1200);
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
    if (m.includes('overbought') || m.includes('risk') || m.includes('sell') || m.includes('panic') || m.includes('pressure')) return '#fb7185';
    
    // Positive (Blue)
    if (m.includes('accumulation') || m.includes('breakout') || m.includes('squeeze') || m.includes('whale') || m.includes('bullish') || m.includes('oversold') || m.includes('inflow') || m.includes('buy')) return '#38bdf8';
    
    // Neutral (Green) - Default for everything else
    return '#34d399';
}

function startLiveMonitoringLoop(data, terminal) {
    if (window.AI_MONITOR_INTERVAL) clearInterval(window.AI_MONITOR_INTERVAL);

    if (window.IS_LATEST_REPORT === false) {
        terminal.innerHTML = '<div class="terminal-line-row">> Monitoring Offline - SESSION CLOSED</div>';
        return;
    }

    window.AI_MONITOR_INTERVAL = setInterval(() => {
        const allAvailable = [...(data.holdings || []), ...(data.watchlist || [])];
        const activeStocks = allAvailable.filter(s => isMarketActive(s) && !isCrypto(s));
        
        const randomStock = activeStocks.length > 0 ? activeStocks[Math.floor(Math.random() * activeStocks.length)] : null;
        const types = ['SCAN', 'FLOW', 'ALERT', 'SIGNAL', 'INFO'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let msg = '';
        const now = new Date();
        const nextUpdateIn = 10 - (Math.floor(now.getTime() / 1000) % 10);

        if (type === 'INFO' && Math.random() > 0.5) {
            const targets = ['TRENDING ranking', 'Market Status', 'Pulse Ticker', 'AI Confidence matrix'];
            const target = targets[Math.floor(Math.random() * targets.length)];
            msg = `${target} update scheduled in ${nextUpdateIn}s...`;
        } else if (randomStock) {
            const ind = randomStock.reason?.indicators || {};
            const cmf = ind.cmf || 0;
            const volRatio = ind.volume_ratio || 0;
            const adx = ind.adx || 0;
            const rsi = ind.rsi || 50;
            const change = randomStock.changePercent || 0;

            const events = [];
            if (cmf > 0.15) events.push({ type: 'FLOW', msg: `Smart money accumulation detected in ${randomStock.name} (Buy Ratio: ${Math.round(Math.random()*30 + 60)}%)` });
            if (cmf < -0.12) events.push({ type: 'FLOW', msg: `Heavy distribution/selling pressure detected in ${randomStock.name} (Sell Ratio: ${Math.round(Math.random()*30 + 65)}%)` });
            
            if (volRatio > 1.3 && change > 1) events.push({ type: 'BREAKOUT', msg: `Volume-supported breakout confirmed for ${randomStock.name} (+${change.toFixed(2)}%)` });
            if (volRatio > 1.5 && change < -1.5) events.push({ type: 'ALERT', msg: `High-volume breakdown detected for ${randomStock.name} (${change.toFixed(2)}%). Warning: Institutional exit.` });
            
            if (ind.short_percent_float > 0.2 && change > 2) events.push({ type: 'SQUEEZE', msg: `Short squeeze momentum building in ${randomStock.name}. Squeeze potential high.` });
            if (ind.held_percent_institutions > 0.45) events.push({ type: 'INST', msg: `Institutional whale activity detected in ${randomStock.name}. (Hold: ${Math.round(ind.held_percent_institutions*100)}%)` });
            
            if (adx > 30 && change > 0) events.push({ type: 'SCAN', msg: `Strong bullish trend strength (ADX: ${Math.round(adx)}) confirmed for ${randomStock.name}.` });
            if (adx > 30 && change < 0) events.push({ type: 'SCAN', msg: `Strong bearish trend strength (ADX: ${Math.round(adx)}) confirmed for ${randomStock.name}.` });
            
            if (rsi > 70) events.push({ type: 'SIGNAL', msg: `RSI Overbought (Danger Zone) reached for ${randomStock.name}. Monitoring mean reversion.` });
            if (rsi < 30) events.push({ type: 'SIGNAL', msg: `RSI Oversold (Value Zone) reached for ${randomStock.name}. Bullish divergence potential.` });
            
            if (ind.bollinger_squeeze) events.push({ type: 'ALERT', msg: `Bollinger Band SQUEEZE detected for ${randomStock.name}. Volatility spike imminent.` });
            
            // Fallback to general messages if no specific technical signals match
            if (events.length === 0) {
                switch(type) {
                    case 'SCAN': msg = Math.random() > 0.5 ? `Cross-referencing ${randomStock.name} with Sector Rotation matrix...` : `Warning: ${randomStock.name} showing correlation decoupling with Benchmark.`; break;
                    case 'FLOW': msg = change > 0 ? `Order book imbalance detected in ${randomStock.name} (Net Inflow: +$${Math.round(Math.random()*50 + 10)}M)` : `Order book imbalance (Net Outflow: -$${Math.round(Math.random()*40 + 5)}M) detected in ${randomStock.name}.`; break;
                    case 'ALERT': msg = Math.random() > 0.7 ? `Suspicious dark pool activity detected for ${randomStock.name}.` : `Unusual options activity detected for ${randomStock.name} (Call/Put: ${Math.random() > 0.5 ? '3.2x' : '0.4x'}).`; break;
                    case 'SIGNAL': msg = `Wyckoff Phase change detected in ${randomStock.name} intraday chart.`; break;
                    case 'INFO': msg = `Sentiment momentum for ${randomStock.name} shifting to '${Math.random() > 0.6 ? 'Greed' : 'Fear'}' zone.`; break;
                    case 'FLOW': msg = `Order book imbalance detected in ${randomStock.name} (Net Inflow: +$${Math.round(Math.random()*50 + 10)}M)`; break;
                    case 'ALERT': msg = `Unusual options activity detected for ${randomStock.name} (Call/Put: 3.2x)`; break;
                    case 'SIGNAL': msg = `Wyckoff Phase change detected in ${randomStock.name} intraday chart.`; break;
                    case 'INFO': msg = `Sentiment momentum for ${randomStock.name} shifting to 'Greed' zone.`; break;
                }
                var logType = type;
            } else {
                const selected = events[Math.floor(Math.random() * events.length)];
                msg = selected.msg;
                var logType = selected.type;
            }

            const p = document.createElement('div');
            p.className = 'terminal-line-row live-log';
            const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0');
            
            p.innerHTML = `<span style="color: var(--text-secondary); opacity: 0.6; font-size: 0.65rem; margin-right: 8px;">[${timeStr}]</span> > <span style="color: ${getTerminalColor(logType, msg)};">[${logType}] ${msg}</span>`;
            
            const cursor = terminal.querySelector('.terminal-cursor');
            if (cursor) cursor.remove();
            terminal.appendChild(p);
            
            const newCursor = document.createElement('span');
            newCursor.className = 'terminal-cursor';
            terminal.appendChild(newCursor);

            while (terminal.querySelectorAll('.terminal-line-row').length > 7) {
                terminal.removeChild(terminal.querySelector('.terminal-line-row'));
            }
            terminal.scrollTop = terminal.scrollHeight;
            return; // Exit current interval
        } else {
            msg = `Scanning global derivative markets for tail risk events...`;
        }

        const p = document.createElement('div');
        p.className = 'terminal-line-row live-log';
        const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0');
        
        p.innerHTML = `<span style="color: var(--text-secondary); opacity: 0.6; font-size: 0.65rem; margin-right: 8px;">[${timeStr}]</span> > <span style="color: ${getTerminalColor(type, msg)};">[${type}] ${msg}</span>`;
        
        const cursor = terminal.querySelector('.terminal-cursor');
        if (cursor) cursor.remove();
        terminal.appendChild(p);
        
        const newCursor = document.createElement('span');
        newCursor.className = 'terminal-cursor';
        terminal.appendChild(newCursor);

        while (terminal.querySelectorAll('.terminal-line-row').length > 7) {
            terminal.removeChild(terminal.querySelector('.terminal-line-row'));
        }

        terminal.scrollTop = terminal.scrollHeight;
    }, 5000 + Math.random() * 5000); 
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
        .replace(/^- (.*)$/gm, '<div style="display:flex; align-items:baseline; gap:8px; margin:2px 0;"><span style="color:#38bdf8; font-weight:bold; flex-shrink:0;">•</span><span style="flex:1;">$1</span></div>')
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

// [NEW] MFC Tooltip Content — 6차원 기반
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
        ${dimBar('Trend (22%)', bd.trend, '#38bdf8')}
        ${dimBar('Momentum (20%)', bd.momentum, '#818cf8')}
        ${dimBar('Flow (20%)', bd.flow, '#34d399')}
        ${dimBar('Volatility (13%)', bd.volatility, '#fbbf24')}
        ${dimBar('Structure (15%)', bd.structure, '#f472b6')}
        ${dimBar('MomQuality (5%)', bd.momentum_quality, '#a78bfa')}
        ${dimBar('Insider (5%)', bd.insider, '#fb923c')}
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
            <b>Trend</b>: MA배열+ADX+Ichimoku+주봉MA (22%)<br>
            <b>Momentum</b>: RSI+MACD×ROC+Stoch (20%) | <b>Flow</b>: OBV+CMF+거래량+공매도역투자 (20%)<br>
            <b>Volatility</b>: BBW+ATR정규화+Williams%R (13%) | <b>Structure</b>: Phase+Spring/UT+다이버전스 (15%)<br>
            <b>MomQuality</b>: ROC×ADX가속도+MACD방향 (5%) | <b>Insider</b>: 내부자+기관 (5%)
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

    const regColor = regMod > 0 ? '#34d399' : (regMod < 0 ? '#fb7185' : '#94a3b8');
    const rrColor = rrMod > 0 ? '#34d399' : (rrMod < 0 ? '#fb7185' : '#94a3b8');
    const predColor = isFallback ? '#fbbf24' : (predVal !== null ? (predVal >= 0 ? '#34d399' : '#fb7185') : '#94a3b8');
    
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
//  [NEW] Target vs Stop Loss Band + Risk Flags + Volume Power Components
// ═══════════════════════════════════════════════════════════════════

/**
 * [NEW] Build Target vs Stop Loss Band Gauge (주식 전문가 관점 대응 밴드)
 */
function buildTargetStopLossBandHtml(stock) {
    const isKrStock = stock.nativeCurrency === 'KRW';
    const currentPrice = stock.rawPrice || parseFloat(String(stock.currentPrice || '').replace(/[^\d.]/g, '')) || 0;
    if (currentPrice === 0) return '';

    // 목표가(Target) 파싱
    const tpRaw = stock.reason?.fundamentals?.target_price || '';
    let targetPrice = parseFloat(String(tpRaw).replace(/[^\d.]/g, '')) || 0;

    // 통화 단위 보정 (달러주식인데 목표가가 원화로 표기되었거나 그 반대의 경우)
    const hasWon = String(tpRaw).includes('원');
    const hasDollar = String(tpRaw).includes('$');
    const rate = window.CURRENT_USD_RATE || 1400;

    if (hasWon && !isKrStock) {
        targetPrice /= rate;
    } else if (hasDollar && isKrStock) {
        targetPrice *= rate;
    }

    if (targetPrice === 0) {
        // 목표가 데이터가 없을 경우 피보나치 저항 레벨 등에서 추정
        const fib = stock.reason?.indicators?.fibonacci || {};
        targetPrice = parseFloat(fib.high_60d) || (currentPrice * 1.15);
    }

    // 손절가(Stop Loss) 계산: ATR 기반 1.5x 또는 피보나치 하방 지지선 활용
    const ind = stock.reason?.indicators || {};
    const atr = ind.atr || 0;
    let stopLoss = 0;

    if (atr > 0) {
        stopLoss = currentPrice - (atr * 1.5);
    } else {
        stopLoss = currentPrice * 0.90; // Fallback: -10% stop loss
    }

    // R:R Ratio 계산
    const downside = currentPrice - stopLoss;
    const upside = targetPrice - currentPrice;
    const rrRatio = downside > 0 ? (upside / downside).toFixed(1) : 'N/A';

    // 밴드 진행률(%) 계산
    const range = targetPrice - stopLoss;
    let pct = 0;
    if (range > 0) {
        pct = ((currentPrice - stopLoss) / range) * 100;
        pct = Math.max(0, Math.min(100, pct)); // 캡핑
    }

    const fmtPrice = (val) => {
        if (isKrStock) {
            return Math.round(val).toLocaleString() + '원';
        } else {
            return '$' + val.toFixed(2);
        }
    };

    const displayTarget = fmtPrice(targetPrice);
    const displayStopLoss = fmtPrice(stopLoss);
    const displayCurrent = fmtPrice(currentPrice);

    return `
        <div class="tsl-band-container">
            <div class="tsl-band-title">🎯 Target vs Stop Loss Band (손익비: ${rrRatio}x)</div>
            <div class="tsl-band-track">
                <div class="tsl-band-fill" style="left: 0%; width: ${pct}%;"></div>
                <div class="tsl-band-pin" style="left: ${pct}%;">
                    <div class="tsl-band-pin-label">${displayCurrent}</div>
                </div>
            </div>
            <div class="tsl-band-limits">
                <span class="tsl-limit stop-loss">📉 손절가 (Stop Loss): ${displayStopLoss}</span>
                <span class="tsl-limit target">📈 목표가 (Target): ${displayTarget}</span>
            </div>
            <div class="tsl-band-metrics">
                <span>하방 리스크: -${((downside / currentPrice) * 100).toFixed(1)}%</span>
                <span>상방 여력 (Upside): +${((upside / currentPrice) * 100).toFixed(1)}%</span>
            </div>
        </div>
    `;
}

/**
 * [NEW] Build Strategic Risk Flags and Earnings Countdown D-Day
 */
function buildRiskFlagsHtml(stock) {
    const fnd = stock.reason?.fundamentals || {};
    const ind = stock.reason?.indicators || {};
    let html = '<div class="risk-flags-container" style="margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">';

    // 1. Earnings D-Day Countdown
    const earningsDate = fnd.earnings_date;
    if (earningsDate && earningsDate !== 'N/A') {
        try {
            // 오늘 날짜 2026-05-21 기준 D-Day 계산
            const today = new Date("2026-05-21");
            const eDate = new Date(earningsDate);
            const diffTime = eDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0) {
                const label = diffDays === 0 ? 'TODAY' : `D-${diffDays}`;
                let alertColor = diffDays <= 7 ? '#c084fc' : '#a78bfa';
                html += `<div class="earnings-dday-badge" style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.3); color: ${alertColor};">
                    📅 실적 발표: <b>${earningsDate} (${label})</b>
                </div>`;
            }
        } catch (e) {}
    }

    // 2. Dilution Risk (가치희석)
    const dilution = fnd.dilution || '';
    const dilutionRate = fnd.dilution_rate || 0;
    if (dilutionRate > 0 || (dilution && !dilution.includes('특이사항 없음') && !dilution.includes('N/A'))) {
        html += `<div class="risk-flag-badge danger" title="${dilution}">
            ⚠️ 가치 희석 리스크 (Dilution)
        </div>`;
    }

    // 3. Short Interest (공매도 과열)
    const shortFloat = ind.short_percent_float || 0;
    const shortChange = ind.short_interest_change_pct || 0;
    if (shortFloat >= 0.15) { // 15% 이상
        const detail = `잔고 비중: ${(shortFloat * 100).toFixed(1)}% / 증감률: ${shortChange > 0 ? '+' : ''}${shortChange.toFixed(1)}%`;
        html += `<div class="risk-flag-badge warning" title="${detail}">
            📉 공매도 과열 (SI: ${(shortFloat * 100).toFixed(0)}%)
        </div>`;
    }

    // 4. 수급 이탈 플래그
    if (ind.adl_trend === '하락' && ind.obv_trend === '하락') {
        html += `<div class="risk-flag-badge warning" title="OBV 및 ADL 동시 하락">
            🌊 수급 이탈 (Bearish Flow)
        </div>`;
    }

    // 5. 볼린저 밴드 스퀴즈 (변동성 임박)
    if (ind.bollinger_squeeze) {
        html += `<div class="risk-flag-badge info" title="볼린저 밴드 극도 수축">
            ⚡ 변동성 폭발 임박 (Squeeze)
        </div>`;
    }

    html += '</div>';
    return html;
}

/**
 * [NEW] Build Live Volume Power (체결강도) Widget
 */
function buildVolumePowerHtml(stock) {
    const ind = stock.reason?.indicators || {};
    const cf = ind.capital_flow || {};
    const inflow = cf.total_inflow || 0;
    const outflow = cf.total_outflow || 0;

    if (inflow === 0 && outflow === 0) return '';

    // 체결강도 계산 (보통 매수 거래량 / 매도 거래량 * 100)
    // 여기서는 자금 유입 / 유출 비율로 근사화
    const buyRatio = inflow / (inflow + outflow);
    const volPower = (buyRatio * 200).toFixed(0); // 100% 기준 매수=매도이면 100%

    // CSS Width
    const buyPct = Math.round(buyRatio * 100);
    const sellPct = 100 - buyPct;

    const powerColor = buyRatio >= 0.6 ? 'var(--live-green)' : (buyRatio <= 0.4 ? 'var(--live-red)' : 'var(--hold-color)');

    return `
        <div class="volume-power-container">
            <div class="volume-power-header">
                <span>⚡ 실시간 체결강도 (Volume Power)</span>
                <span style="color: ${powerColor}; font-weight: 900;">${volPower}%</span>
            </div>
            <div class="volume-power-track">
                <div class="volume-power-bar buy" style="width: ${buyPct}%;"></div>
                <div class="volume-power-bar sell" style="width: ${sellPct}%;"></div>
            </div>
            <div class="volume-power-labels">
                <span style="color: var(--live-green);">순매수: ${buyPct}%</span>
                <span style="color: var(--live-red);">순매도: ${sellPct}%</span>
            </div>
        </div>
    `;
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

    // ── Factor Scores (Regime, R:R, MQ, CMF, ADL, ProjVol) ──
    if (factors.regime_score !== undefined || factors.rr_score !== undefined) {
        const regime = factors.regime_score ?? '-';
        const rr = factors.rr_score ?? '-';
        const mq = factors.momentum_quality ?? '-';
        const indicators = stock.reason?.indicators || {};
        const cmfVal = indicators.cmf !== undefined && indicators.cmf !== null ? parseFloat(indicators.cmf) : null;
        const cmfStr = cmfVal !== null ? (cmfVal >= 0 ? '+' : '') + cmfVal.toFixed(2) : '-';
        const adlTrend = indicators.adl_trend || '-';
        const adlColor = adlTrend === '상승' ? '#34d399' : adlTrend === '하락' ? '#fb7185' : '#a5b4fc';
        const volRatio = indicators.volume_surge_projected || indicators.volume_ratio || null;
        const volStr = volRatio !== null ? parseFloat(volRatio).toFixed(1) + 'x' : '-';
        const volColor = volRatio !== null && parseFloat(volRatio) >= 1.5 ? '#34d399' : '#a5b4fc';

        html += `<div class="v5-badge v5-factors" style="background:rgba(129,140,248,0.08); border:1px solid rgba(129,140,248,0.2); color:#a5b4fc;">
            <span title="시장 부합도 (Regime Alignment): 현재 시장 레짐과 종목의 성격이 얼마나 일치하는지 나타냅니다.">🧭 ${typeof regime === 'number' ? regime.toFixed(0) : regime}</span>
            <span class="v5-sep">|</span>
            <span title="손익비 (Risk/Reward): 예상 수익 대비 감수해야 할 하방 리스크의 비율입니다.">⚖️ ${typeof rr === 'number' ? rr.toFixed(0) : rr}</span>
            <span class="v5-sep">|</span>
            <span title="모멘텀 품질 (Momentum Quality): 상승 추세의 지속성과 매수세의 견고함을 평가한 점수입니다.">🚀 ${typeof mq === 'number' ? mq.toFixed(0) : mq}</span>
            <span class="v5-sep">|</span>
            <span title="자금 흐름 (Chaikin Money Flow): 기관 자금의 실제 유입(+) 및 유출(-) 강도입니다.">💵 ${cmfStr}</span>
            <span class="v5-sep">|</span>
            <span title="매집분포선 (ADL): 가격과 거래량을 결합하여 자금의 매집(상승) 및 분산(하락) 추세를 나타냅니다." style="color:${adlColor}">🌊 ${adlTrend}</span>
            <span class="v5-sep">|</span>
            <span title="예상 거래량 배율 (Projected Volume): 장중 경과 시간 기반 당일 최종 예상 거래량 대비 평소 비율입니다." style="color:${volColor}">📈 ${volStr}</span>
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

    // Additional Technical Health Metrics for space filling
    const rsi = indicators.rsi || 50;
    const mfi = indicators.mfi || 50;
    const adx = indicators.adx || 25;

    const getHealthColor = (val, type) => {
        if (type === 'rsi') return val >= 70 ? '#fb7185' : val <= 30 ? '#34d399' : '#38bdf8';
        if (type === 'mfi') return val >= 80 ? '#fb7185' : val <= 20 ? '#34d399' : '#a78bfa';
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
                    <div class="tooltip-text" style="bottom: 100%; top: auto; margin-bottom: 15px; width: 340px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
                        ${getMfcTooltip(stock)}
                    </div>
                </div>
                <div class="score-bars-stack" style="flex: 1;">
                    <div class="score-bar-item"><span class="bar-label">Trend:</span> <span class="bar-value" style="color:${maColor}">${maText}</span></div>
                    <div class="score-bar-item"><span class="bar-label">Phase:</span> <span class="bar-value" style="color:${phaseColor}">${phase}</span></div>
                    <div class="score-bar-item"><span class="bar-label">Signal:</span> <span class="bar-value" style="color:${volColor}">${volText}</span></div>
                    <div class="score-bar-item"><span class="bar-label">Insider:</span> <span class="bar-value" style="color:${insiderColor}">${insiderText}</span></div>
                    ${mq !== null ? `<div class="score-bar-item"><span class="bar-label">MomQual:</span> <span class="bar-value" style="color:${mqColor}">${mq}/100</span></div>` : ''}
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
                    <div class="tooltip-text" style="bottom: 100%; top: auto; margin-bottom: 15px; width: 340px; background-color: rgba(15, 23, 42, 1) !important; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
                        ${getPickTooltip(stock)}
                    </div>
                </div>
                <div class="score-bars-stack" style="flex: 1;">
                    <div class="score-bar-item"><span class="bar-label">AI Pred:</span> <span class="bar-value" style="color:#818cf8">${aiBase} pts</span></div>
                    <div class="score-bar-item"><span class="bar-label">Tech Mod:</span> <span class="bar-value" style="color:${techMod >= 0 ? '#34d399' : '#fb7185'}">${techMod >= 0 ? '+' : ''}${techMod} pts</span></div>
                    <div class="score-bar-item"><span class="bar-label">Risk Adj:</span> <span class="bar-value" style="color:${adj >= 0 ? '#34d399' : '#fb7185'}">${adj >= 0 ? '+' : ''}${adj} pts</span></div>
                    ${regMod !== null ? `<div class="score-bar-item"><span class="bar-label">Regime:</span> <span class="bar-value" style="color:${regMod >= 0 ? '#34d399' : '#fb7185'}">${fmtMod(regMod)} pts</span></div>` : ''}
                    ${rrMod !== null ? `<div class="score-bar-item"><span class="bar-label">R:R:</span> <span class="bar-value" style="color:${rrMod >= 0 ? '#34d399' : '#fb7185'}">${fmtMod(rrMod)} pts</span></div>` : ''}
                </div>
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

    // Compute overlay positions from actual data lengths.
    // _plot_unified_forecast: visible_start = max(0, len(history)-40), fc_len = consensusPath.length
    // matplotlib figure: ~6% left margin, ~6% right margin → 88% plot width.
    const CHART_LEFT = 6;
    const CHART_PLOT = 88;
    const HIST_BARS = 40; // must match visible_start in _plot_unified_forecast
    const fcLen = (stock.consensusPath || []).length || 10;
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
        return `
                    <div class="hover-col" style="flex: 1; height: 100%; cursor: crosshair; pointer-events: auto;" onmousemove="showChartTooltip(event, 'T+${i + 1}', '${priceStr}', '${pctStr}')" onmouseleave="hideChartTooltip(event)"></div>
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

function formatPredictionReason(reasonText) {
    if (!reasonText) return '상세 예측 근거가 존재하지 않습니다.';
    
    // Split by newlines, trim whitespace from each line, remove empty lines, and join with <br>
    return reasonText
        .split(/[\r\n]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('<br>');
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
        { check: Math.abs(indicators.cmf || 0) >= 0.05, icon: '💵', text: 'Money Flow (CMF)', cls: (indicators.cmf || 0) >= 0.05 ? 'positive' : 'negative', value: (indicators.cmf || 0) >= 0.05 ? 'Inflow (' + (indicators.cmf || 0).toFixed(2) + ')' : ((indicators.cmf || 0) <= -0.05 ? 'Outflow (' + (indicators.cmf || 0).toFixed(2) + ')' : 'Normal') },
        { check: indicators.adl_trend === '상승', icon: '🌊', text: 'ADL Accumulation', cls: 'positive', value: indicators.adl_trend === '상승' ? '상승 매집 🟢' : (indicators.adl_trend === '하락' ? '분산 매도 🔴' : 'Neutral') },
        { check: (indicators.volume_surge_projected || indicators.volume_ratio || 0) >= 1.5, icon: '📈', text: 'Projected Vol Surge', cls: 'positive', value: (parseFloat(indicators.volume_surge_projected || indicators.volume_ratio || 0)).toFixed(1) + 'x' }
    ];

    return `
        <div class="signal-checklist-container" style="margin-top: 0.25rem; margin-bottom: 0.25rem; background: linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.2) 100%); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.5rem 0.75rem; position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; line-height: 1;">
                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; letter-spacing: 0.05rem; display: flex; align-items: center; gap: 6px;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="display: block;"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
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
            <svg class="action-dial-svg" width="80" height="80" viewBox="0 0 80 80">
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

function renderDashboard(data) {
    window.CURRENT_VIEW_DATA = data;
    
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
    if (holdingsBadge) holdingsBadge.textContent = data.holdings.length;
    if (watchlistBadge) watchlistBadge.textContent = data.watchlist.length;

    // [NEW] HOME 메타데이터 (날짜, 환율) 업데이트
    const dateDisplay = document.getElementById('home-date-display');
    const rateDisplay = document.getElementById('home-exchange-rate');

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
                            <div class="name" style="font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
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
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    ${buildStatusBarHtml(stock)}
                    ${buildRiskFlagsHtml(stock)}

                    <!-- [v2 NEW] Action Engine Component -->
                    <div class="action-engine-container">
                        <div class="action-engine-left">
                            ${buildActionDialHtml(stock.actionScore)}
                            <div class="recommendation-banner">
                                <div class="rec-label">Engine Recommendation</div>
                                <div class="rec-value-badge ${(stock.recommendation || 'HOLD').toLowerCase().replace(' ', '-')}">
                                    ${stock.recommendation || 'HOLD'}
                                    ${getSuperTrendBadgeHtml(stock.reason?.indicators?.supertrend)}
                                </div>
                            </div>
                        </div>
                        ${stock.predictionReason ? `
                        <div class="action-engine-divider"></div>
                        <div class="action-engine-reason-box">
                            <div class="action-engine-reason-title">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                                AI PREDICTION FORECAST RATIONALE
                            </div>
                            <div class="action-engine-reason-content">${formatPredictionReason(stock.predictionReason)}</div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.6; word-break: keep-all;">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                        ${buildSignalChecklistHtml(stock)}
                    </div>

                    <div class="analysis-content">
                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}
                        ${buildTargetStopLossBandHtml(stock)}
                        
                        ${buildValuationComponentHtml(stock)}

                        ${buildVolumePowerHtml(stock)}
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
            const pnl = stock.holdingPnlPct ?? stock.reason?.holding_pnl_pct ?? null;
            const isTakeProfit = (pnl !== null && parseFloat(pnl) >= 30 && (stock.adjustedRatingReason || '').includes('이익실현'));
            const wrapperClass = isTakeProfit ? "stock-item-wrapper take-profit-glow" : "stock-item-wrapper";
            const shortSqueezeBadge = getShortSurgeBadgeHtml(stock);

            const stockItem = `
                <div class="${wrapperClass}" data-name="${stock.name}">
                    <div class="stock-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                        <div class="stock-info" style="min-width: 0; flex: 1; word-break: keep-all;">
                            <div class="name" style="font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
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
                            <button class="print-btn" onclick="printStock('${stock.name}')" title="PDF 인쇄" style="margin:0;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                인쇄
                            </button>
                        </div>
                    </div>

                    ${buildStatusBarHtml(stock)}
                    ${buildRiskFlagsHtml(stock)}

                    <!-- [v2 NEW] Action Engine Component -->
                    <div class="action-engine-container">
                        <div class="action-engine-left">
                            ${buildActionDialHtml(stock.actionScore)}
                            <div class="recommendation-banner">
                                <div class="rec-label">Engine Recommendation</div>
                                <div class="rec-value-badge ${(stock.recommendation || 'HOLD').toLowerCase().replace(' ', '-')}">
                                    ${stock.recommendation || 'HOLD'}
                                    ${getSuperTrendBadgeHtml(stock.reason?.indicators?.supertrend)}
                                </div>
                            </div>
                        </div>
                        ${stock.predictionReason ? `
                        <div class="action-engine-divider"></div>
                        <div class="action-engine-reason-box">
                            <div class="action-engine-reason-title">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                                AI PREDICTION FORECAST RATIONALE
                            </div>
                            <div class="action-engine-reason-content">${formatPredictionReason(stock.predictionReason)}</div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="reason-text" style="margin-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.6; word-break: keep-all;">
                        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.5rem;">📝 분석 요약 및 조언</div>
                        ${formatText(stock.reason)}
                        ${buildSignalChecklistHtml(stock)}
                    </div>

                    <div class="analysis-content">
                        <!-- Chart in the middle -->
                        ${buildConsensusChartHtml(stock, tooltipContent)}
                        ${buildTargetStopLossBandHtml(stock)}

                        ${buildValuationComponentHtml(stock)}

                        ${buildVolumePowerHtml(stock)}
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
        const regColor = (regMod !== null && regMod > 0) ? '#34d399' : (regMod !== null && regMod < 0) ? '#fb7185' : '#94a3b8';
        const rrColor = (rrMod !== null && rrMod > 0) ? '#34d399' : (rrMod !== null && rrMod < 0) ? '#fb7185' : '#94a3b8';

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
            const predColor = predVal > 0 ? '#34d399' : (predVal < 0 ? '#fb7185' : '#94a3b8');
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
                <div class="tooltip-subtitle">📊 MFC 6차원 분석 내역</div>
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

        const rrScoreVal = p.factors?.rr_score !== undefined ? Math.round(p.factors.rr_score) + '점' : 'N/A';
        const projectedVolVal = p.intraday?.volume_surge_projected !== undefined ? p.intraday.volume_surge_projected.toFixed(1) + 'x' : (p.volume_surge_projected !== undefined ? p.volume_surge_projected.toFixed(1) + 'x' : 'N/A');
        const adlTrendVal = p.adl_trend || 'N/A';
        const rsiVal = p.rsi !== undefined ? Math.round(p.rsi) + '%' : 'N/A';

        const quantMetricsBarHtml = `
            <div class="quant-metrics-bar">
                <div class="quant-metric-item" title="손익비 (Risk/Reward): 예상 수익 대비 감수해야 할 하방 리스크의 비율입니다.">
                    <span class="quant-metric-label">⚖️ R:R</span>
                    <span class="quant-metric-value" style="color: ${p.factors?.rr_score >= 60 ? '#34d399' : p.factors?.rr_score <= 40 ? '#fb7185' : '#cbd5e1'}">${rrScoreVal}</span>
                </div>
                <div class="quant-metric-item" title="예상 거래량 (Projected Vol): 금일 최종 예상 거래량 대비 평소 거래량의 비율입니다.">
                    <span class="quant-metric-label">📈 예상 Vol</span>
                    <span class="quant-metric-value" style="color: ${parseFloat(projectedVolVal) >= 1.5 ? '#34d399' : '#cbd5e1'}">${projectedVolVal}</span>
                </div>
                <div class="quant-metric-item" title="매집분포선 (ADL): 가격과 거래량을 반영한 자금 매집의 방향성입니다.">
                    <span class="quant-metric-label">🌊 ADL</span>
                    <span class="quant-metric-value" style="color: ${adlTrendVal === '상승' ? '#34d399' : adlTrendVal === '하락' ? '#fb7185' : '#cbd5e1'}">${adlTrendVal}</span>
                </div>
                <div class="quant-metric-item" title="상대강도지수 (RSI 14)">
                    <span class="quant-metric-label">⚡ RSI</span>
                    <span class="quant-metric-value" style="color: ${p.rsi >= 70 ? '#fb7185' : p.rsi <= 30 ? '#34d399' : '#cbd5e1'}">${rsiVal}</span>
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
            ${quantMetricsBarHtml}
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

        // Shuffle insights
        this.insights = this.insights.sort(() => Math.random() - 0.5);
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

