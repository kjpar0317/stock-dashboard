/**
 * KIS (한국투자증권) Trade Console — Toss Trade Console과 동일 API 패턴
 */
(function () {
    const BROKER = 'kis';
    const API = {
        portfolio: '/api/kis-portfolio',
        sync: '/api/kis/sync',
        order: '/api/kis/order',
        price: (sym) => `/api/kis/price/${sym}`,
        stream: (sym) => `/api/kis/stream/${sym}`,
    };
    const PORTFOLIO_KEY = 'KIS_PORTFOLIO';
    const STORAGE = { realMode: 'kisRealMode', currency: 'kisCurrency', subTab: 'activeKisSubTab', marketFilter: 'kisMarketFilter' };

    let kisSide = 'BUY';
    let kisType = 'MARKET';
    let kisChartPeriod = '7';
    let kisPnlChartInstance = null;
    let kisPnlSeriesInstance = null;
    let kisMarketFilter = 'ALL';
    let kisCurrentActiveSymbol = null;

    function el(id) { return document.getElementById(`kis-${id}`); }
    function qs(sel) { return document.querySelector(`#view-kis-trade ${sel}`); }
    function qsa(sel) { return document.querySelectorAll(`#view-kis-trade ${sel}`); }
    function isLocal() {
        return window.location.hostname === 'localhost'
            || window.location.hostname === '127.0.0.1'
            || window.location.protocol === 'file:';
    }
    function getPortfolio() {
        return window[PORTFOLIO_KEY] || (typeof KIS_PORTFOLIO !== 'undefined' ? KIS_PORTFOLIO : null);
    }

    function getKisCurrency() {
        return localStorage.getItem('tossCurrency') || 'KRW';
    }

    function getUsdRate() {
        return window.CURRENT_USD_RATE || 1400;
    }

    /** 국내(KRW)+해외(USD) 혼합 포트폴리오 원화/달러 합산 */
    function summarizePortfolio(portfolio) {
        const rate = getUsdRate();
        const acc = portfolio?.account || {};
        const holdings = portfolio?.holdings || [];
        let cashKrw = acc.cash_balance_krw || 0;
        let cashUsd = acc.cash_balance_usd || 0;
        if (!cashKrw && !cashUsd && acc.cash_balance) {
            cashUsd = acc.cash_balance;
        }
        let stockKrw = 0;
        let stockUsd = 0;
        let pnlKrw = 0;
        let pnlUsd = 0;
        for (const h of holdings) {
            const native = h.native_currency || (h.market === 'KR' ? 'KRW' : 'USD');
            const ev = Number(h.eval_amount) || 0;
            const pl = Number(h.profit_loss) || 0;
            if (native === 'KRW') {
                stockKrw += ev;
                pnlKrw += pl;
            } else {
                stockUsd += ev;
                pnlUsd += pl;
            }
        }
        const assetsKrw = cashKrw + stockKrw + (cashUsd + stockUsd) * rate;
        const assetsUsd = cashUsd + stockUsd + (cashKrw + stockKrw) / rate;
        const cashTotalKrw = cashKrw + cashUsd * rate;
        const cashTotalUsd = cashUsd + cashKrw / rate;
        const pnlTotalKrw = pnlKrw + pnlUsd * rate;
        const pnlTotalUsd = pnlUsd + pnlKrw / rate;
        return { assetsKrw, assetsUsd, cashTotalKrw, cashTotalUsd, pnlTotalKrw, pnlTotalUsd, cashKrw, cashUsd };
    }

    function fmtVal(valInUsd, isRate = false) {
        if (isRate) return `${valInUsd > 0 ? '+' : ''}${parseFloat(valInUsd).toFixed(2)}%`;
        const curr = getKisCurrency();
        const rate = getUsdRate();
        if (curr === 'KRW') return `₩${Math.round((valInUsd || 0) * rate).toLocaleString()}`;
        return `$${(valInUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function fmtFromSummary(summary, fieldKrw, fieldUsd, isRate = false) {
        if (isRate) return fmtVal(fieldKrw, true);
        const curr = getKisCurrency();
        if (curr === 'KRW') return `₩${Math.round(summary[fieldKrw] || 0).toLocaleString()}`;
        return `$${(summary[fieldUsd] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function showKisLoadingState() {
        ['total-assets', 'cash-balance'].forEach(id => {
            const node = el(id);
            if (node) node.textContent = '조회 중...';
        });
        const pnlEl = el('total-pnl');
        const returnEl = el('total-return');
        if (pnlEl) pnlEl.textContent = '-';
        if (returnEl) returnEl.textContent = '-';
        const tbody = el('holdings-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#64748b;">데이터 동기화 중...</td></tr>';
        }
    }

    function showKisEmptyState(message) {
        const msg = message || '동기화 버튼을 눌러 잔고를 불러오세요.';
        const isKrw = getKisCurrency() === 'KRW';
        const zeroMoney = isKrw ? '₩0' : '$0.00';
        ['total-assets', 'cash-balance'].forEach(id => {
            const node = el(id);
            if (node) node.textContent = zeroMoney;
        });
        const pnlEl = el('total-pnl');
        const returnEl = el('total-return');
        if (pnlEl) pnlEl.textContent = isKrw ? '+₩0' : '+$0.00';
        if (returnEl) returnEl.textContent = '+0.00%';
        const detailEl = el('cash-detail');
        if (detailEl) detailEl.textContent = msg;
        const tbody = el('holdings-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#64748b;">${msg}</td></tr>`;
        }
        const countEl = el('holdings-count');
        if (countEl) countEl.textContent = '전체 0 · 국내 0 · 해외 0';
    }

    function fmtNative(val, nativeCurrency) {
        const displayCurr = getKisCurrency();
        const rate = getUsdRate();
        const native = nativeCurrency || 'USD';
        if (native === 'KRW') {
            if (displayCurr === 'KRW') return `₩${Math.round(val).toLocaleString()}`;
            return `$${(val / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (displayCurr === 'USD') return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return `₩${Math.round(val * rate).toLocaleString()}`;
    }

    function marketBadge(market) {
        if (market === 'KR') return '<span class="kis-market-badge kr">국내</span>';
        return '<span class="kis-market-badge us">해외</span>';
    }

    function cleanKisSymbol(symbol) {
        return String(symbol || '').replace(/\.(KS|KQ|NAS|NYS|AMS|NYSE|AMEX)$/i, '').toUpperCase();
    }

    function getReportStocks() {
        const history = window.REPORTS_HISTORY || (typeof REPORTS_HISTORY !== 'undefined' ? REPORTS_HISTORY : []);
        const latest = Array.isArray(history) ? history[0] : null;
        if (!latest) return [];
        return [...(latest.holdings || []), ...(latest.watchlist || [])];
    }

    function resolveKisDisplayName(holding) {
        const symbol = cleanKisSymbol(holding?.symbol);
        const rawName = String(holding?.name || '').trim();
        if (rawName && cleanKisSymbol(rawName) !== symbol) return rawName;

        const match = getReportStocks().find(stock => {
            const stockSymbol = cleanKisSymbol(stock.symbol || stock.id);
            return stockSymbol === symbol || stockSymbol.startsWith(`${symbol}.`);
        });
        return match?.name || rawName || symbol;
    }

    function renderKisHoldingCell(holding, market) {
        const symbol = cleanKisSymbol(holding?.symbol);
        const name = resolveKisDisplayName(holding);
        return `
            <div class="kis-holding-identity">
                ${marketBadge(market)}
                <div class="kis-holding-name-wrap">
                    <strong class="kis-holding-name">${name}</strong>
                    <span class="kis-holding-symbol">${symbol}</span>
                </div>
            </div>
        `;
    }

    function syncKisAccountBadge(isReal) {
        const badge = el('account-status-badge');
        if (!badge) return;
        if (isReal) {
            badge.textContent = '🚨 실전계좌 모드';
            badge.style.background = 'rgba(239, 68, 68, 0.15)';
            badge.style.color = '#f87171';
            badge.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        } else {
            badge.textContent = '🛡️ 모의투자 모드';
            badge.style.background = 'rgba(251, 191, 36, 0.12)';
            badge.style.color = '#fbbf24';
            badge.style.border = '1px solid rgba(251, 191, 36, 0.3)';
        }
    }

    let kisRiskChartInstance = null; // KIS Chart.js 인스턴스 전역 저장

    function drawKisAssetAllocationDonut() {
        // [v15] Chart.js 지연 로드 — 없으면 받아온 뒤 다시 그린다
        if (typeof Chart === 'undefined') {
            window.ensureChartJs().then((ok) => { if (ok) drawKisAssetAllocationDonut(); });
            return;
        }
        const canvas = document.getElementById('kis-risk-donut');
        if (!canvas) return;

        const portfolio = getPortfolio();
        if (!portfolio) return;

        const holdings = portfolio.holdings || [];
        const summary = summarizePortfolio(portfolio);
        
        const rate = getUsdRate();
        const cashUsd = (portfolio.account?.cash_balance_usd ?? summary.cashUsd) + (portfolio.account?.cash_balance_krw ?? summary.cashKrw) / rate;
        const totalAssetsUsd = summary.assetsUsd || cashUsd || 1.0;

        const labels = [];
        const data = [];
        const colors = [];

        // 1. 보유 주식 비중
        holdings.forEach(h => {
            const name = resolveKisDisplayName(h);
            const native = h.native_currency || (h.market === 'KR' ? 'KRW' : 'USD');
            const evalUsd = native === 'USD' ? h.eval_amount : (h.eval_amount / rate);
            const weight = (evalUsd / totalAssetsUsd) * 100;
            if (weight > 0.1) {
                labels.push(name);
                data.push(Math.round(weight * 10) / 10);
            }
        });

        // 2. 현금 비중
        const cashWeight = (cashUsd / totalAssetsUsd) * 100;
        if (cashWeight > 0.1) {
            labels.push('현금');
            data.push(Math.round(cashWeight * 10) / 10);
            colors.push('rgba(71, 85, 105, 0.7)'); // slate
        }

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
        if (kisRiskChartInstance) {
            try {
                kisRiskChartInstance.data.labels = labels;
                kisRiskChartInstance.data.datasets[0].data = data;
                kisRiskChartInstance.data.datasets[0].backgroundColor = colors;
                kisRiskChartInstance.update('none'); // 애니메이션 없이 업데이트
                return;
            } catch (err) {
                console.warn("Failed to update existing KIS risk donut chart, recreating...", err);
            }
        }

        if (kisRiskChartInstance) {
            kisRiskChartInstance.destroy();
            kisRiskChartInstance = null;
        }

        try {
            const ctx = canvas.getContext('2d');
            kisRiskChartInstance = new Chart(ctx, {
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
            console.error("Failed to draw KIS Chart.js donut:", err);
        }
    }

    function cleanKisOrderSymbol(sym) {
        return (sym || '').replace('.NAS', '').replace('.NYS', '').replace('.AMX', '').replace('.KS', '').replace('.KQ', '').trim().toUpperCase();
    }

    function renderKisOrderRowStyle() {
        return "border-bottom: 1px solid rgba(255,255,255,0.04); font-family: 'Outfit', sans-serif; color: var(--text-secondary);";
    }

    function renderKisOrderTables(orders) {
        let filteredOrders = orders || [];
        if (kisCurrentActiveSymbol) {
            const activeSymClean = cleanKisOrderSymbol(kisCurrentActiveSymbol);
            filteredOrders = filteredOrders.filter(o => {
                if (!o.symbol) return false;
                return cleanKisOrderSymbol(o.symbol) === activeSymClean;
            });
        }

        const openOrders = filteredOrders.filter(o => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED');
        const closedOrders = filteredOrders.filter(o => o.status !== 'OPEN' && o.status !== 'PARTIALLY_FILLED');
        const rowStyle = renderKisOrderRowStyle();

        const openOrdersTbody = document.getElementById('kis-open-orders-tbody');
        if (openOrdersTbody) {
            if (!openOrders.length) {
                openOrdersTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:#64748b;">미체결 주문이 없습니다.</td></tr>';
            } else {
                openOrdersTbody.innerHTML = openOrders.map(o => {
                    const sideColor = o.side === 'BUY' ? 'var(--accent-blue)' : 'var(--up-color)';
                    const sideText = o.side === 'BUY' ? '매수 [BUY]' : '매도 [SELL]';
                    return `<tr style="${rowStyle}">
                        <td style="padding:0.5rem;font-size:0.75rem;">${o.ordered_at || '—'}</td>
                        <td style="padding:0.5rem;font-weight:bold;color:#fff;">${o.symbol}</td>
                        <td style="padding:0.5rem;font-weight:700;color:${sideColor};">${sideText}</td>
                        <td style="padding:0.5rem;text-align:right;font-family:monospace;">${fmtVal(o.price)}</td>
                        <td style="padding:0.5rem;text-align:right;font-weight:bold;">${o.quantity}</td>
                        <td style="padding:0.5rem;text-align:right;">${o.executed_qty ?? 0}</td>
                        <td style="padding:0.5rem;text-align:center;color:#64748b;font-size:0.75rem;">—</td>
                    </tr>`;
                }).join('');
            }
        }

        const ordersTbody = document.getElementById('kis-orders-tbody');
        if (ordersTbody) {
            const currentFilter = window.kisClosedOrderFilter || 'ALL';
            let displayClosed = closedOrders;
            if (currentFilter !== 'ALL') {
                displayClosed = closedOrders.filter(o => {
                    const status = (o.status || '').toUpperCase();
                    if (currentFilter === 'FILLED') {
                        return status === 'FILLED' || status === 'CLOSED';
                    }
                    if (currentFilter === 'CANCELLED' || currentFilter === 'CANCELED') {
                        return status === 'CANCELLED' || status === 'CANCELED';
                    }
                    return status === currentFilter;
                });
            }

            if (!displayClosed.length) {
                ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:#64748b;">조건에 맞는 최근 주문 이력이 없습니다.</td></tr>';
            } else {
                ordersTbody.innerHTML = displayClosed.slice(0, 15).map(o => {
                    const sideColor = o.side === 'BUY' ? 'var(--accent-blue)' : 'var(--up-color)';
                    const sideText = o.side === 'BUY' ? '매수 [BUY]' : '매도 [SELL]';
                    const statusColor = o.status === 'CLOSED' || o.status === 'FILLED' ? 'var(--live-green)' : '#94a3b8';
                    return `<tr style="${rowStyle}">
                        <td style="padding:0.5rem;font-size:0.75rem;">${o.ordered_at || '—'}</td>
                        <td style="padding:0.5rem;font-weight:bold;color:#fff;">${o.symbol}</td>
                        <td style="padding:0.5rem;font-weight:700;color:${sideColor};">${sideText}</td>
                        <td style="padding:0.5rem;text-align:right;font-family:monospace;">${fmtVal(o.price)}</td>
                        <td style="padding:0.5rem;text-align:right;font-weight:bold;">${o.quantity}</td>
                        <td style="padding:0.5rem;text-align:right;">${o.executed_qty ?? 0}</td>
                        <td style="padding:0.5rem;text-align:center;font-weight:bold;color:${statusColor};font-size:0.75rem;">${o.status}</td>
                    </tr>`;
                }).join('');
            }
        }
    }

    window.renderKisPortfolio = function () {
        const portfolio = getPortfolio();

        if (!portfolio) {
            showKisEmptyState(isLocal() ? '서버 연결 중… 잠시 후 동기화해 주세요.' : '로컬 서버에서만 잔고 조회가 가능합니다.');
            return;
        }

        const account = portfolio.account;
        const holdings = portfolio.holdings || [];
        const orders = portfolio.orders || [];
        const summary = summarizePortfolio(portfolio);

        if (!account && !holdings.length) {
            showKisEmptyState('모의 계좌 데이터 없음 — 🔄 동기화를 눌러 주세요.');
            return;
        }

        if (account) {
            const assetsEl = el('total-assets');
            const cashEl = el('cash-balance');
            const pnlEl = el('total-pnl');
            const returnEl = el('total-return');
            const assetsDisplay = holdings.length
                ? fmtFromSummary(summary, 'assetsKrw', 'assetsUsd')
                : fmtVal(account.total_assets);
            const cashDisplay = (account.cash_balance_krw != null || account.cash_balance_usd != null)
                ? fmtFromSummary(summary, 'cashTotalKrw', 'cashTotalUsd')
                : fmtVal(account.cash_balance);
            const pnlDisplay = holdings.length
                ? fmtFromSummary(summary, 'pnlTotalKrw', 'pnlTotalUsd')
                : fmtVal(account.total_profit_loss);

            if (assetsEl) assetsEl.textContent = assetsDisplay;
            if (cashEl) {
                cashEl.textContent = cashDisplay;
                const krw = account.cash_balance_krw ?? summary.cashKrw;
                const usd = account.cash_balance_usd ?? summary.cashUsd;
                const detailEl = el('cash-detail');
                if (detailEl) {
                    const parts = [];
                    if (krw > 0) parts.push(`국내 ₩${Math.round(krw).toLocaleString()}`);
                    if (usd > 0) parts.push(`해외 $${Number(usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                    detailEl.textContent = parts.length ? parts.join(' · ') : '국내·해외 예수금 합산';
                }
            }
            if (pnlEl) {
                const pnl = account.total_profit_loss;
                const pnlText = holdings.length ? pnlDisplay : fmtVal(pnl);
                const pnlNum = holdings.length ? summary.pnlTotalKrw : pnl;
                pnlEl.textContent = `${pnlNum >= 0 ? '+' : ''}${pnlText}`;
                pnlEl.style.color = pnlNum >= 0 ? 'var(--live-green)' : 'var(--live-red)';
            }
            if (returnEl) {
                const rate = account.total_return_rate;
                returnEl.textContent = fmtVal(rate, true);
                returnEl.style.color = rate >= 0 ? 'var(--live-green)' : 'var(--live-red)';
            }
        }

        if (portfolio.risk_metrics) {
            const mddEl = el('risk-mdd');
            const exposureEl = el('risk-exposure');
            const divEl = el('risk-diversification');
            if (mddEl) mddEl.textContent = `${portfolio.risk_metrics.mdd.toFixed(2)}%`;
            if (exposureEl) exposureEl.textContent = `${portfolio.risk_metrics.total_exposure_pct.toFixed(2)}%`;
            if (divEl) {
                const exp = portfolio.risk_metrics.total_exposure_pct;
                divEl.textContent = exp > 85 ? '집중' : exp > 60 ? '보통' : '양호';
                divEl.style.color = exp > 85 ? '#f87171' : exp > 60 ? '#fbbf24' : '#34d399';
            }
            drawKisAssetAllocationDonut();
        }

        const holdingsTbody = el('holdings-tbody');
        if (holdingsTbody) {
            const filtered = holdings.filter(h => {
                if (kisMarketFilter === 'ALL') return true;
                return (h.market || (h.native_currency === 'KRW' ? 'KR' : 'US')) === kisMarketFilter;
            });
            const krCount = holdings.filter(h => (h.market || (h.native_currency === 'KRW' ? 'KR' : 'US')) === 'KR').length;
            const usCount = holdings.filter(h => (h.market || (h.native_currency === 'KRW' ? 'KR' : 'US')) === 'US').length;
            const countEl = el('holdings-count');
            if (countEl) countEl.textContent = `전체 ${holdings.length} · 국내 ${krCount} · 해외 ${usCount}`;

            if (!filtered.length) {
                holdingsTbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:2rem;color:#64748b;">보유 종목 없음 — 동기화를 실행하세요.</td></tr>';
            } else {
                holdingsTbody.innerHTML = filtered.map(h => {
                    const ret = h.return_rate || 0;
                    const retColor = ret >= 0 ? 'var(--live-green)' : 'var(--live-red)';
                    const mkt = h.market || (h.native_currency === 'KRW' ? 'KR' : 'US');
                    const native = h.native_currency || (mkt === 'KR' ? 'KRW' : 'USD');
                    const symbol = cleanKisSymbol(h.symbol);
                    
                    // 비중 계산
                    const totalAssets = summary.assetsUsd || 1.0;
                    const rate = getUsdRate();
                    const evalUsd = native === 'USD' ? h.eval_amount : (h.eval_amount / rate);
                    const weight = (evalUsd / totalAssets) * 100;
                    const weightText = `${weight.toFixed(1)}%`;
                    
                    const repStock = window.brokerAdapter ? window.brokerAdapter._findReportStock(h.symbol, h.name || symbol) : null;
                    
                    let curPrice = (h.current_price !== undefined && h.current_price !== null) ? h.current_price : (h.currentPrice || 0);
                    let avgPrice = (h.avg_buy_price !== undefined && h.avg_buy_price !== null) ? h.avg_buy_price : (h.avgBuyPrice || 0);
                    let profitLoss = (h.profit_loss !== undefined && h.profit_loss !== null) ? h.profit_loss : (h.profitLoss || 0);
                    let returnRate = (h.return_rate !== undefined && h.return_rate !== null) ? h.return_rate : (h.returnRate || ret || 0);
                    
                    if (repStock && repStock.rawPrice > 0 && (curPrice === 0 || Math.abs(curPrice - avgPrice) < 1e-5)) {
                        const isKr = (h.symbol || '').includes('.KS') || (h.symbol || '').includes('.KQ') || /^\d{6}$/.test(h.symbol || '');
                        curPrice = isKr ? (repStock.rawPrice / rate) : repStock.rawPrice;
                    }
                    
                    let evalAmt = curPrice > 0 ? (curPrice * h.quantity) : (h.eval_amount || h.evalAmount || 0);
                    
                    if (avgPrice > 0 && curPrice > 0) {
                        profitLoss = (curPrice - avgPrice) * h.quantity;
                        returnRate = ((curPrice - avgPrice) / avgPrice) * 100;
                    }

                    const retColorFinal = profitLoss >= 0 ? 'var(--live-green)' : 'var(--live-red)';
                    const retSignFinal = profitLoss >= 0 ? '+' : '';
                    
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

                    return `<tr class="holdings-row" onclick="kisQuickOrder('${symbol}')">
                        <td class="holdings-cell-symbol">${renderKisHoldingCell(h, mkt)}</td>
                        <td class="holdings-cell-weight" style="text-align: right; font-weight: 600; color: #cbd5e1;">${weightText}</td>
                        <td class="holdings-cell-qty">${h.quantity}</td>
                        <td class="holdings-cell-price">${fmtNative(avgPrice, native)}</td>
                        <td class="holdings-cell-price" style="color: var(--text-primary); font-weight: 600;">${fmtNative(curPrice, native)}</td>
                        <td class="holdings-cell-eval">${fmtNative(evalAmt, native)}</td>
                        <td class="holdings-cell-pnl" style="color:${retColorFinal};">${retSignFinal}${fmtNative(profitLoss, native)}</td>
                        <td class="holdings-cell-return" style="color:${retColorFinal};">${retSignFinal}${returnRate.toFixed(2)}%</td>
                        <td class="holdings-cell-rating" style="text-align: center;">${ratingHtml}</td>
                        <td class="holdings-cell-rsi" style="text-align: center;">${rsiHtml}</td>
                        <td class="holdings-cell-action" onclick="event.stopPropagation();">
                            <div class="holdings-action-btn-group">
                                <button class="holdings-btn-primary" onclick="kisQuickOrder('${symbol}')">주문</button>
                                <button class="holdings-btn-secondary" onclick="kisQuickSell('${symbol}', ${h.quantity})">즉시 전량매도</button>
                            </div>
                        </td>
                    </tr>`;
                }).join('');
            }
        }

        renderKisOrderTables(orders);

        const recEl = el('smart-recommendations');
        if (recEl && holdings.length) {
            recEl.innerHTML = holdings.slice(0, 3).map(h => {
                const ret = h.return_rate || 0;
                const hint = ret > 5 ? '일부 차익실현 검토' : ret < -8 ? '손절·비중 점검' : '보유 유지';
                const name = resolveKisDisplayName(h);
                const symbol = cleanKisSymbol(h.symbol);
                return `<div class="kis-advisory-row" style="display:flex;justify-content:space-between;font-size:0.75rem;padding:4px 8px;background:rgba(255,255,255,0.02);border-radius:6px;">
                    <span><strong>${name}</strong> <em style="color:#64748b;font-style:normal;">${symbol}</em> ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%</span>
                    <span style="color:#94a3b8;">${hint}</span>
                </div>`;
            }).join('');
        }

        // Render Journal (Trade stats) for KIS
        if (portfolio.trade_stats) {
            const winrateEl = document.getElementById('kis-journal-winrate');
            const totalTradesEl = document.getElementById('kis-journal-total-trades');
            const pfEl = document.getElementById('kis-journal-profit-factor');
            const realizedPnlEl = document.getElementById('kis-journal-realized-pnl');

            const winsEl = document.getElementById('kis-journal-wins');
            const lossesEl = document.getElementById('kis-journal-losses');
            const gpEl = document.getElementById('kis-journal-gross-profit');
            const glEl = document.getElementById('kis-journal-gross-loss');

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
                const curr = getKisCurrency();
                const rate = getUsdRate();
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

            // Dynamic AI feedback for KIS
            const fbEl = document.getElementById('kis-journal-feedback');
            if (fbEl) {
                if (portfolio.trade_stats.total_trades === 0) {
                    fbEl.innerHTML = "충분한 거래 데이터가 수집되면 AI가 매매 패턴을 분석하고 리스크 분산 및 매매 규칙 보정을 위한 피드백을 이곳에 제시합니다.";
                } else {
                    let fbText = "";
                    if (winRate >= 60) {
                        fbText += "[+] <strong>우수한 승률:</strong> KIS 모의/실거래 승률이 60% 이상으로 시장 상황에 부합하는 타점을 잡고 있습니다.<br>";
                    } else {
                        fbText += "[!] <strong>진입 보정 필요:</strong> KIS 승률이 50% 미만입니다. 고신뢰성 지표 및 AI 컨센서스가 일치할 때 진입하는 것이 좋습니다.<br>";
                    }

                    if (pf >= 1.5) {
                        fbText += "[+] <strong>손익비 우수:</strong> 프로핏 팩터가 1.5 이상으로 양호한 손익비 원칙을 가져가고 있습니다.<br>";
                    } else if (pf < 1.0) {
                        fbText += "[-] <strong>수익성 개선 필요:</strong> 실현 손실이 수익보다 큽니다. 리스크 모델의 손절 한도를 낮추어 불필요한 누적 손실을 제어하십시오.<br>";
                    }

                    fbEl.innerHTML = fbText;
                }
            }

            // Render Best & Worst Trades for KIS
            const bestTbody = document.getElementById('kis-journal-best-tbody');
            const worstTbody = document.getElementById('kis-journal-worst-tbody');
            
            const fmtKisTradeProfit = (symbol, profit) => {
                const isKr = /^\d{6}/.test(symbol) || symbol.endsWith('.KS') || symbol.endsWith('.KQ');
                const curr = getKisCurrency();
                const rate = getUsdRate();
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
                            <td class="best-trade-profit-up" style="text-align: right;">+${fmtKisTradeProfit(t.symbol, t.profit)}</td>
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
                            <td class="best-trade-profit-down" style="text-align: right;">${fmtKisTradeProfit(t.symbol, t.profit)}</td>
                        </tr>
                    `).join('');
                }
            }
        }
        if (typeof window.updateKisOrderHelper === 'function') {
            window.updateKisOrderHelper();
        }
    };

    function drawKisPnlChart() {
        const container = el('pnl-chart');
        if (!container) return;

        const portfolio = getPortfolio();
        let pnlHistory = portfolio?.pnl_history || [];
        if (!pnlHistory.length) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;">PnL 이력 없음 (동기화 필요)</div>';
            kisPnlChartInstance = null;
            kisPnlSeriesInstance = null;
            return;
        }
        let dataPoints = [...pnlHistory];
        if (kisChartPeriod === '7') dataPoints = dataPoints.slice(-7);
        else if (kisChartPeriod === '30') dataPoints = dataPoints.slice(-30);
        else if (kisChartPeriod === '90') dataPoints = dataPoints.slice(-90);
        if (dataPoints.length < 2) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;">차트 데이터 부족</div>';
            kisPnlChartInstance = null;
            kisPnlSeriesInstance = null;
            return;
        }

        const chartData = dataPoints.map(d => ({ time: d.date, value: d.total_assets }));

        // 만약 이미 차트 및 시리즈 인스턴스가 존재한다면 데이터만 업데이트하여 껌뻑임(flicker) 방지
        if (kisPnlChartInstance && kisPnlSeriesInstance) {
            try {
                kisPnlSeriesInstance.setData(chartData);
                kisPnlChartInstance.timeScale().fitContent();
                return;
            } catch (err) {
                console.warn("Failed to update existing KIS PnL chart, recreating...", err);
            }
        }

        container.innerHTML = '';
        kisPnlChartInstance = null;
        kisPnlSeriesInstance = null;
        if (typeof LightweightCharts === 'undefined') {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;">차트 라이브러리 로드 중...</div>';
            return;
        }

        const chart = LightweightCharts.createChart(container, {
            width: container.clientWidth || 500,
            height: container.clientHeight || 260,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#94a3b8', fontSize: 10 },
            grid: { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.02)' } },
            rightPriceScale: { borderVisible: false },
            timeScale: { borderVisible: false },
            handleScroll: false,
            handleScale: false,
        });
        const areaSeries = chart.addAreaSeries({
            lineColor: '#fbbf24',
            topColor: 'rgba(251, 191, 36, 0.25)',
            bottomColor: 'rgba(251, 191, 36, 0.0)',
            lineWidth: 2,
        });
        areaSeries.setData(chartData);
        chart.timeScale().fitContent();
        kisPnlChartInstance = chart;
        kisPnlSeriesInstance = areaSeries;
    }

    window.refreshKisData = function (portfolioData) {
        if (!portfolioData) return;
        window[PORTFOLIO_KEY] = portfolioData;
        window.KIS_PORTFOLIO = portfolioData;
        window.renderKisPortfolio();
        const sub = sessionStorage.getItem(STORAGE.subTab);
        if (!sub || sub === 'kis-sub-overview') {
            drawKisPnlChart();
            drawKisAssetAllocationDonut();
        }
        if (window.brokerAdapter) window.brokerAdapter.currentBroker = 'KIS';
    };

    function isKisRealMode() {
        const toggle = el('global-real-toggle');
        if (toggle) return toggle.checked;
        return localStorage.getItem(STORAGE.realMode) === 'true';
    }

    function isKisDryRun() {
        return !isKisRealMode();
    }

    function showKisLoadingSkeleton() {
        // 1. Holdings tbody 스켈레톤 스피너
        const tbody = document.getElementById('kis-holdings-tbody');
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

        // 2. 계좌 요약 카드 스켈레톤 (kis- 접두사 대응)
        const summaryIds = ['total-assets', 'cash-balance', 'total-pnl', 'total-return'];
        summaryIds.forEach(id => {
            const element = el(id);
            if (element) {
                element.innerHTML = `<span class="skeleton-loader" style="width:70px;height:16px;display:inline-block;border-radius:4px;vertical-align:middle;opacity:0.4;"></span>`;
            }
        });

        // 3. 투자 분석 지표 카드 스켈레톤 (kis- 접두사 대응)
        const journalIds = [
            'journal-winrate', 'journal-total-trades', 'journal-profit-factor', 'journal-realized-pnl',
            'journal-wins', 'journal-losses', 'journal-gross-profit', 'journal-gross-loss'
        ];
        journalIds.forEach(id => {
            const element = el(id);
            if (element) {
                element.innerHTML = `<span class="skeleton-loader" style="width:50px;height:14px;display:inline-block;border-radius:4px;vertical-align:middle;opacity:0.4;"></span>`;
            }
        });

        // 4. 차트 로딩 오버레이
        const chartContainer = el('pnl-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:0.5rem;color:#64748b;">
                    <div class="loader-spinner" style="width:24px; height:24px; border:2px solid rgba(255,255,255,0.1); border-top-color:#38bdf8; border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <div style="font-size:0.8rem;">자산 추이 로드 중...</div>
                </div>
            `;
        }
    }

    window.fetchAndRefreshKisPortfolio = async function (autoSyncIfEmpty = false) {
        if (!isLocal()) {
            showKisEmptyState('로컬 서버(localhost:8000)에서만 잔고 조회가 가능합니다.');
            return;
        }
        const isDryRun = isKisDryRun();

        // 기존 데이터가 없을 때만 로딩 스켈레톤을 노출하여 껌뻑임(flicker) 예방
        const portfolio = getPortfolio();
        const hasData = portfolio && (portfolio.account || (portfolio.holdings || []).length);
        if (!hasData) {
            showKisLoadingSkeleton();
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000${API.portfolio}?dry_run=${isDryRun}`);
            if (!res.ok) {
                let errMsg = `KIS 실거래 조회 실패 (HTTP ${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData && errData.detail) {
                        errMsg += `: ${errData.detail}`;
                    }
                } catch(e) {}
                
                if (errMsg.includes("token") || errMsg.includes("EGW00121") || errMsg.includes("403") || errMsg.includes("Forbidden")) {
                    errMsg = "⚠️ 한투 실거래 OpenAPI 자격 증명 오류 (.env의 KIS_APP_KEY/SECRET 정보가 잘못 입력되었거나 KIS 점검 시간입니다)";
                }
                showKisEmptyState(errMsg);
                return;
            }

            const data = await res.json();
            if (data.success && data.portfolio) {
                data.portfolio.dry_run = isDryRun;
                window.refreshKisData(data.portfolio);
                const hasData = data.portfolio.account || (data.portfolio.holdings || []).length;
                if (autoSyncIfEmpty && !hasData) {
                    await performKisSync(el('header-sync-btn'));
                }
            } else {
                showKisEmptyState('포트폴리오 조회 실패 — 🔄 동기화를 시도해 주세요.');
            }
        } catch (err) {
            console.error('KIS portfolio fetch failed:', err);
            showKisEmptyState('로컬 매매 프록시 서버 연결 실패 (FastAPI 가동 유무 확인 필요)');
        }
    };

    async function performKisSync(btnTarget) {
        if (!isLocal()) {
            alert('로컬 서버(localhost:8000)에서만 동기화할 수 있습니다.');
            return;
        }
        btnTarget.disabled = true;
        const originalText = btnTarget.textContent;
        btnTarget.textContent = '진행 중...';
        const isDryRun = isKisDryRun();
        try {
            const res = await fetch(`http://127.0.0.1:8000${API.sync}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dry_run: isDryRun }),
            });
            const data = await res.json();
            if (!res.ok) {
                const detail = data.detail || data.message || res.statusText;
                if (typeof showToast === 'function') showToast(`동기화 실패: ${detail}`, 'error');
                else alert(`동기화 실패: ${detail}`);
                return;
            }
            if (data.success) {
                if (typeof showToast === 'function') {
                    showToast(isDryRun ? 'KIS 모의투자 데이터 동기화 완료!' : 'KIS 실전 계좌 동기화 완료!');
                }
                if (data.portfolio) data.portfolio.dry_run = isDryRun;
                window.refreshKisData(data.portfolio);
            } else if (typeof showToast === 'function') {
                showToast(`동기화 실패: ${data.message || data.detail}`, 'error');
            }
        } catch (err) {
            alert('KIS 동기화 실패 — local_server.py 실행 및 .env KIS 키·계좌번호를 확인하세요.');
        } finally {
            btnTarget.disabled = false;
            btnTarget.textContent = originalText;
        }
    }

    window.initKisTrade = function () {
        console.log('Initializing KIS Trade Console...');
        if (window.brokerAdapter) window.brokerAdapter.currentBroker = 'KIS';
        if (window.kisTradeInitialized) {
            window.fetchAndRefreshKisPortfolio();
            
            // [NEW] 탭 전환 시 글로벌 통화 스위치 동기화
            const savedCurrency = localStorage.getItem('tossCurrency') || 'KRW';
            if (typeof window.syncGlobalCurrency === 'function') {
                window.syncGlobalCurrency(savedCurrency);
            }
            // [NEW] 탭 전환 시 서브탭 복원
            const savedSubTabId = sessionStorage.getItem(STORAGE.subTab) || 'kis-sub-overview';
            const targetSubTab = document.querySelector(`.kis-sub-tab[data-sub-target="${savedSubTabId}"]`);
            if (targetSubTab) {
                if (!targetSubTab.classList.contains('active')) {
                    targetSubTab.click();
                } else {
                    qsa('.kis-sub-tab').forEach(t => t.classList.remove('active'));
                    targetSubTab.classList.add('active');
                    qsa('.kis-sub-view').forEach(v => { v.style.display = 'none'; });
                    const targetView = document.getElementById(savedSubTabId);
                    if (targetView) targetView.style.display = 'block';
                }
            }
            
            // [NEW] 탭 전환 시 KIS 차트 기간 active 상태 복원
            const savedPeriod = sessionStorage.getItem('kisChartPeriod') || '1y';
            const targetBtn = document.querySelector(`#view-kis-trade .kis-chart-period-btn[data-period="${savedPeriod}"]`);
            if (targetBtn) {
                qsa('.kis-chart-period-btn').forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');
            }
            return;
        }
        window.kisTradeInitialized = true;

        // [NEW] Sync active class states forcedly to prevent external pollution
        window.syncKisOrderFormActiveState = function() {
            const sideBtns = document.querySelectorAll('.kis-side-btn');
            sideBtns.forEach(btn => {
                const side = btn.getAttribute('data-side');
                if (side === kisSide) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            const typeBtns = document.querySelectorAll('.kis-type-btn');
            typeBtns.forEach(btn => {
                const type = btn.getAttribute('data-type');
                if (type === kisType) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        // [NEW] KIS Order helper panel dynamically
        window.updateKisOrderHelper = function() {
            if (typeof window.syncKisOrderFormActiveState === 'function') {
                window.syncKisOrderFormActiveState();
            }
            const helperLabel = document.getElementById('kis-order-helper-label');
            const helperValue = document.getElementById('kis-order-helper-value');
            const symbol = document.getElementById('kis-order-symbol')?.value.trim().toUpperCase();
            
            if (!helperLabel || !helperValue) return;
            
            const side = kisSide || 'BUY';
            const portfolio = getPortfolio();
            
            if (side === 'BUY') {
                helperLabel.textContent = '매수 가능 예수금:';
                let cash = 0;
                if (portfolio && portfolio.account) {
                    const summary = summarizePortfolio(portfolio);
                    const curr = getKisCurrency();
                    if (curr === 'KRW') {
                        cash = summary.cashTotalKrw || 0;
                        helperValue.textContent = `₩${Math.floor(cash).toLocaleString()}`;
                    } else {
                        cash = summary.cashTotalUsd || 0;
                        helperValue.textContent = `$${cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                    }
                } else {
                    helperValue.textContent = '$0.00';
                }
            } else {
                helperLabel.textContent = '보유 수량:';
                let qty = 0;
                if (symbol && portfolio && portfolio.holdings) {
                    const found = portfolio.holdings.find(h => {
                        if (!h || !h.symbol) return false;
                        const hSym = h.symbol.toUpperCase();
                        return hSym === symbol || hSym.split('.')[0] === symbol;
                    });
                    if (found) qty = found.quantity || 0;
                }
                helperValue.textContent = `${qty.toLocaleString()}주`;
            }
        };

        // [NEW] KIS 비율 버튼 바인딩
        function initKisRatioButtons() {
            document.querySelectorAll('.kis-ratio-btn').forEach(btn => {
                btn.onclick = () => {
                    const pct = parseFloat(btn.getAttribute('data-pct'));
                    const symbolInput = document.getElementById('kis-order-symbol');
                    const symbol = symbolInput ? symbolInput.value.trim().toUpperCase() : '';
                    const side = kisSide || 'BUY';
                    const qtyInput = document.getElementById('kis-order-qty');
                    const portfolio = getPortfolio();
                    
                    if (!qtyInput) return;
                    
                    if (side === 'BUY') {
                        let cash = 0;
                        if (portfolio && portfolio.account) {
                            const summary = summarizePortfolio(portfolio);
                            const curr = getKisCurrency();
                            cash = (curr === 'KRW') ? (summary.cashTotalKrw || 0) : (summary.cashTotalUsd || 0);
                        }
                        const buyCash = cash * (pct / 100);
                        
                        let currentPrice = 100.0;
                        const pricePanel = document.getElementById('kis-realtime-price-panel') || document.getElementById('toss-realtime-price-panel');
                        if (pricePanel && pricePanel.textContent) {
                            const match = pricePanel.textContent.match(/\$?₩?([0-9.,]+)/);
                            if (match) {
                                let p = parseFloat(match[1].replace(/,/g, ''));
                                if (p > 0) currentPrice = p;
                            }
                        }
                        
                        const qty = Math.floor(buyCash / currentPrice);
                        qtyInput.value = qty > 0 ? qty : 1;
                    } else {
                        let qty = 0;
                        if (symbol && portfolio && portfolio.holdings) {
                            const found = portfolio.holdings.find(h => {
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
        }
        
        initKisRatioButtons();

        const realToggle = el('global-real-toggle');
        if (realToggle) {
            const savedReal = localStorage.getItem(STORAGE.realMode) === 'true';
            realToggle.checked = savedReal;
            syncKisAccountBadge(savedReal);
            realToggle.onchange = () => {
                localStorage.setItem(STORAGE.realMode, realToggle.checked ? 'true' : 'false');
                syncKisAccountBadge(realToggle.checked);
                window.fetchAndRefreshKisPortfolio(false);
            };
            setTimeout(() => window.fetchAndRefreshKisPortfolio(false), 100);
        }

        qsa('.kis-sub-tab').forEach(tab => {
            tab.onclick = () => {
                qsa('.kis-sub-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-sub-target');
                sessionStorage.setItem(STORAGE.subTab, targetId);
                qsa('.kis-sub-view').forEach(v => { v.style.display = 'none'; });
                const view = document.getElementById(targetId);
                if (view) view.style.display = 'block';
                if (targetId === 'kis-sub-overview') {
                    setTimeout(() => {
                        drawKisPnlChart();
                        drawKisAssetAllocationDonut();
                    }, 50);
                } else if (targetId === 'kis-sub-holdings') {
                    if (typeof window.fetchAndRefreshKisPortfolio === 'function') {
                        window.fetchAndRefreshKisPortfolio();
                    }
                }
            };
        });

        qsa('.kis-side-btn').forEach(btn => {
            btn.onclick = () => {
                qsa('.kis-side-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                kisSide = btn.getAttribute('data-side');
                updateKisOrderBtn();
                if (typeof window.updateKisOrderHelper === 'function') {
                    window.updateKisOrderHelper();
                }
                if (typeof window.syncKisOrderFormActiveState === 'function') {
                    window.syncKisOrderFormActiveState();
                }
            };
        });

        qsa('.kis-type-btn').forEach(btn => {
            btn.onclick = () => {
                qsa('.kis-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                kisType = btn.getAttribute('data-type');
                const priceField = el('price-field');
                if (priceField) {
                    priceField.style.display = kisType === 'LIMIT' ? 'block' : 'none';
                    
                    // 지정가로 변경될 때 실시간 현재가를 단가 입력란의 기본값으로 세팅
                    if (kisType === 'LIMIT') {
                        const priceInput = el('order-price');
                        if (priceInput) {
                            let currentPrice = 0.0;
                            const pricePanel = el('kis-realtime-price-panel') || el('toss-realtime-price-panel');
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
                if (kisType === 'LIMIT' && typeof showToast === 'function') {
                    showToast('KIS 지정가 주문은 준비 중입니다.', 'error');
                }
                updateKisOrderBtn();
                if (typeof window.syncKisOrderFormActiveState === 'function') {
                    window.syncKisOrderFormActiveState();
                }
            };
        });

        qsa('.kis-chart-period').forEach(btn => {
            btn.onclick = () => {
                qsa('.kis-chart-period').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                kisChartPeriod = btn.getAttribute('data-period');
                drawKisPnlChart();
            };
        });

        const plusBtn = el('qty-plus');
        const minusBtn = el('qty-minus');
        const qtyInput = el('order-qty');
        if (plusBtn && qtyInput) plusBtn.onclick = () => { qtyInput.value = parseInt(qtyInput.value, 10) + 1; };
        if (minusBtn && qtyInput) minusBtn.onclick = () => {
            const v = parseInt(qtyInput.value, 10);
            if (v > 1) qtyInput.value = v - 1;
        };

        qsa('.kis-market-filter').forEach(btn => {
            btn.onclick = () => {
                qsa('.kis-market-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                kisMarketFilter = btn.getAttribute('data-market') || 'ALL';
                localStorage.setItem(STORAGE.marketFilter, kisMarketFilter);
                window.renderKisPortfolio();
            };
        });
        kisMarketFilter = localStorage.getItem(STORAGE.marketFilter) || 'ALL';
        const activeFilter = document.querySelector(`#view-kis-trade .kis-market-filter[data-market="${kisMarketFilter}"]`);
        if (activeFilter) {
            qsa('.kis-market-filter').forEach(b => b.classList.remove('active'));
            activeFilter.classList.add('active');
        }

        const syncBtn = el('header-sync-btn');
        if (syncBtn) syncBtn.onclick = () => performKisSync(syncBtn);

        const orderBtn = el('submit-order-btn');
        if (orderBtn) {
            if (!isLocal()) {
                orderBtn.disabled = true;
                orderBtn.textContent = '주문 비활성화 (조회전용)';
            } else {
                orderBtn.onclick = submitKisOrder;
            }
        }

        const currKrw = el('curr-krw');
        const currUsd = el('curr-usd');
        if (currKrw) currKrw.onclick = () => {
            window.triggerGlobalCurrencyChange('KRW');
        };
        if (currUsd) currUsd.onclick = () => {
            window.triggerGlobalCurrencyChange('USD');
        };
        const savedCur = localStorage.getItem('tossCurrency') || 'KRW';
        if (savedCur === 'USD') {
            currUsd?.classList.add('active');
            currKrw?.classList.remove('active');
        } else {
            currKrw?.classList.add('active');
            currUsd?.classList.remove('active');
        }

        initKisOrderConsoleEvents();

        window.renderKisPortfolio();
        const savedSub = sessionStorage.getItem(STORAGE.subTab);
        if (savedSub) {
            const tab = document.querySelector(`#view-kis-trade [data-sub-target="${savedSub}"]`);
            if (tab) tab.click();
        }
    };

    function updateKisOrderBtn() {
        const orderBtn = el('submit-order-btn');
        if (!orderBtn) return;
        orderBtn.textContent = kisType === 'LIMIT'
            ? `지정가 주문 (${kisSide}) — 준비중`
            : `시장가 주문 전송 (${kisSide})`;
        orderBtn.style.background = kisSide === 'BUY'
            ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #ff2a55 0%, #c026d3 100%)';
    }

    async function submitKisOrder() {
        const orderBtn = el('submit-order-btn');
        const symbol = el('order-symbol')?.value.trim().toUpperCase();
        const qty = parseFloat(el('order-qty')?.value || 1);
        const isDryRun = isKisDryRun();

        if (!symbol) { alert('종목코드를 입력하세요.'); return; }
        if (kisType === 'LIMIT') {
            alert('KIS 지정가 주문은 준비 중입니다. 시장가를 이용해 주세요.');
            return;
        }
        const msg = isDryRun
            ? `[KIS 모의] ${kisSide} ${symbol} x ${qty}주 — 진행할까요?`
            : `[KIS 실전] ${symbol} ${kisSide} x ${qty}주 — 실제 주문입니다. 계속할까요?`;
        if (!confirm(msg)) return;

        orderBtn.disabled = true;
        orderBtn.textContent = '주문 처리 중...';
        try {
            const res = await fetch(`http://127.0.0.1:8000${API.order}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, side: kisSide, quantity: qty, type: kisType, price: 0, dry_run: isDryRun }),
            });
            const data = await res.json();
            if (data.success) {
                if (typeof showToast === 'function') showToast(data.message);
                window.refreshKisData(data.portfolio);
            } else {
                alert(`주문 실패: ${data.message}`);
            }
        } catch (err) {
            alert('KIS 주문 API 오류 — local_server.py 실행 여부를 확인하세요.');
        } finally {
            orderBtn.disabled = false;
            updateKisOrderBtn();
        }
    }

    // ── KIS Order Console: chart / whale / analysis state ──
    let kisCurrentRawCandles = [];
    let kisCurrentRawPriceInfo = null;
    let kisOrderChartInstance = null;
    let kisChartOrderPeriod = '1d';
    let kisChartOrderInterval = '5m';
    let kisRealtimePriceIntervalId = null;
    let kisRealtimeTickIntervalId = null;

    function getKisDisplayCurrency() {
        return localStorage.getItem(STORAGE.currency) || 'KRW';
    }

    function resetKisWhalePanelUi() {
        const tickerEl = document.getElementById('kis-whale-ticker');
        if (tickerEl) tickerEl.textContent = '-';
        const listEl = document.getElementById('kis-whale-depth-rows');
        if (listEl) listEl.innerHTML = '<div class="kis-whale-placeholder">종목 조회 대기 중...</div>';
        const feedEl = document.getElementById('kis-whale-feed-list');
        if (feedEl) feedEl.innerHTML = '<div class="kis-whale-placeholder">체결 대기 중...</div>';
        const whaleBadge = document.getElementById('kis-whale-ai-badge');
        const whaleDesc = document.getElementById('kis-whale-signal-desc');
        const whaleAiPanel = document.getElementById('kis-whale-ai-signal');
        if (whaleBadge) {
            whaleBadge.textContent = '대기';
            whaleBadge.style.background = 'rgba(100,116,139,0.15)';
            whaleBadge.style.color = '#64748b';
            whaleBadge.style.borderColor = 'rgba(100,116,139,0.3)';
        }
        if (whaleDesc) whaleDesc.textContent = '종목 조회 대기 중';
        if (whaleAiPanel) {
            whaleAiPanel.style.borderColor = 'rgba(56,189,248,0.12)';
            whaleAiPanel.style.background = 'rgba(56,189,248,0.06)';
        }
    }

    function stopKisRealtimeLoops() {
        if (kisRealtimeTickIntervalId) {
            clearInterval(kisRealtimeTickIntervalId);
            kisRealtimeTickIntervalId = null;
        }
        if (kisRealtimePriceIntervalId) {
            clearInterval(kisRealtimePriceIntervalId);
            kisRealtimePriceIntervalId = null;
        }
    }

    function stopKisWhaleSimulation() {
        stopKisRealtimeLoops();
    }

    function refreshKisWhaleFlow(symbol, period, interval) {
        if (!symbol || typeof window.refreshWhaleFlowPanel !== 'function') return Promise.resolve();
        return window.refreshWhaleFlowPanel(symbol, {
            prefix: 'kis',
            period: period || kisChartOrderPeriod,
            interval: interval || kisChartOrderInterval,
            getCurrency: getKisDisplayCurrency,
            getRate: getUsdRate,
            syncLayout: () => syncKisOrderLayoutHeights(),
        });
    }

    function syncKisOrderLayoutHeights() {
        const topGrid = document.querySelector('.kis-orders-top-grid');
        const whale = document.getElementById('kis-whale-panel');
        const feedEl = document.getElementById('kis-whale-feed-list');
        const chartArea = document.getElementById('kis-order-chart');
        if (!topGrid || !whale || !feedEl) return;

        let used = 0;
        Array.from(whale.children).forEach(child => {
            if (child.id !== 'kis-whale-feed-list') {
                used += child.getBoundingClientRect().height;
            }
        });
        const gaps = 14;
        const rightCol = document.querySelector('.kis-orders-right-col');
        const rightH = rightCol ? rightCol.getBoundingClientRect().height : topGrid.getBoundingClientRect().height;
        const feedMax = Math.max(64, rightH - used - gaps);
        feedEl.style.maxHeight = `${Math.floor(feedMax)}px`;
        feedEl.style.flex = '1 1 auto';
        feedEl.style.minHeight = '0';

        if (chartArea && kisOrderChartInstance) {
            const chartH = Math.max(100, chartArea.clientHeight || 200);
            const chartW = chartArea.clientWidth || 600;
            kisOrderChartInstance.resize(chartW, chartH);
        }
    }
    window.syncKisOrderLayoutHeights = syncKisOrderLayoutHeights;

    function updateKisRealtimePricePanel(priceInfo) {
        const panel = document.getElementById('kis-realtime-price-panel');
        if (!panel || !priceInfo) return;

        const cur = getKisDisplayCurrency();
        const rate = getUsdRate();
        let displayPrice = priceInfo.currentPrice ?? priceInfo.price ?? 0;
        let displayChange = priceInfo.change ?? 0;
        let changePct = priceInfo.changePct ?? 0;
        let currencySign = '$';
        let fractionDigits = 2;

        if (cur === 'KRW') {
            displayPrice = displayPrice * rate;
            displayChange = displayChange * rate;
            currencySign = '₩';
            fractionDigits = 0;
        }

        const sign = displayChange >= 0 ? '+' : '';
        const color = displayChange > 0 ? '#f25f7a' : (displayChange < 0 ? '#5f97f2' : '#fff');
        const arrow = displayChange > 0 ? '▲' : (displayChange < 0 ? '▼' : '');

        let rsiText = '';
        if (priceInfo.rsi !== null && priceInfo.rsi !== undefined) {
            rsiText = `<span style="font-size: 0.72rem; color: #a78bfa; background: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 8px;">RSI: ${Number(priceInfo.rsi).toFixed(1)}</span>`;
        }

        panel.innerHTML = `
            <span style="font-size: 1.15rem; color: #fff; font-family: monospace;">${currencySign}${displayPrice.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}</span>
            <span style="color: ${color}; font-size: 0.85rem; font-family: monospace; margin-left: 5px;">
                ${arrow} ${sign}${displayChange.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} (${sign}${Number(changePct).toFixed(2)}%)
            </span>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-left: 10px;">
                Vol: ${(priceInfo.volume || 0).toLocaleString()}
            </span>
            ${rsiText}
        `;
    }

    function renderKisOrderChart(candles) {
        const container = document.getElementById('kis-order-chart');
        if (!container) return;

        container.innerHTML = '';
        kisOrderChartInstance = null;

        if (!candles || candles.length === 0) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;">차트 데이터가 없습니다.</div>';
            return;
        }

        if (typeof LightweightCharts === 'undefined') {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;">차트 라이브러리 로드 중...</div>';
            return;
        }

        const cur = getKisDisplayCurrency();
        const rate = getUsdRate();
        const displayCandles = candles.map(c => {
            if (cur === 'KRW') {
                return {
                    time: c.time,
                    open: c.open * rate,
                    high: c.high * rate,
                    low: c.low * rate,
                    close: c.close * rate,
                    volume: c.volume,
                };
            }
            return c;
        });

        const containerHeight = Math.max(100, container.clientHeight || 200);
        const chart = LightweightCharts.createChart(container, {
            width: container.clientWidth || 600,
            height: containerHeight,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#94a3b8',
                fontSize: 10,
                fontFamily: 'Outfit, sans-serif',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.04, bottom: 0.2 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#f25f7a',   // 한국식: 상승 빨강
            downColor: '#5f97f2', // 한국식: 하락 파랑
            borderUpColor: '#f25f7a',
            borderDownColor: '#5f97f2',
            wickUpColor: '#f25f7a',
            wickDownColor: '#5f97f2',
        });
        candleSeries.setData(displayCandles);

        const volumeSeries = chart.addHistogramSeries({
            color: 'rgba(56, 189, 248, 0.12)',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.7, bottom: 0 },
            visible: false,
        });
        volumeSeries.setData(displayCandles.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)',
        })));

        chart.timeScale().fitContent();
        kisOrderChartInstance = chart;

        requestAnimationFrame(() => syncKisOrderLayoutHeights());

        if (typeof ResizeObserver !== 'undefined') {
            let lastWidth = 0;
            let lastHeight = 0;
            const resizeObserver = new ResizeObserver(entries => {
                if (entries.length === 0) return;
                const { width, height } = entries[0].contentRect;
                const h = Math.max(100, height || container.clientHeight || 200);
                if (Math.abs(width - lastWidth) > 1 || Math.abs(h - lastHeight) > 1) {
                    lastWidth = width;
                    lastHeight = h;
                    chart.resize(width, h);
                }
            });
            resizeObserver.observe(container);
        }
    }

    function findKisReportStock(cleanSym) {
        if (!window.REPORTS_HISTORY || !window.REPORTS_HISTORY.length) return null;
        const latestReport = window.REPORTS_HISTORY[0];
        const allStocks = [...(latestReport.holdings || []), ...(latestReport.watchlist || [])];
        let stock = allStocks.find(s => s.symbol.toUpperCase() === cleanSym);
        if (!stock) stock = allStocks.find(s => s.symbol.toUpperCase().startsWith(cleanSym + '.'));
        if (!stock) {
            const dotIdx = cleanSym.indexOf('.');
            if (dotIdx > 0) {
                stock = allStocks.find(s => s.symbol.toUpperCase() === cleanSym.substring(0, dotIdx));
            }
        }
        if (!stock) stock = allStocks.find(s => s.name && s.name.toUpperCase() === cleanSym);
        return stock || null;
    }

    function updateKisWhaleAiSignalFromStock(stock, rsiVal, pathDiffPercent, trendText) {
        const whaleBadgeEl = document.getElementById('kis-whale-ai-badge');
        const whaleSignalDescEl = document.getElementById('kis-whale-signal-desc');
        if (!whaleBadgeEl || !whaleSignalDescEl || !stock) return;

        let riskLevel = 'MEDIUM';
        if (rsiVal > 75) riskLevel = 'EXTREME';
        else if (rsiVal > 65) riskLevel = 'HIGH';
        else if (rsiVal < 32) riskLevel = 'LOW';

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
        } else if (pathDiffPercent <= -2) {
            signalLabel = 'SELL';
            signalColor = '#fb7185';
            signalBg = 'rgba(251,113,133,0.15)';
            signalBorder = 'rgba(251,113,133,0.35)';
        }

        whaleBadgeEl.textContent = signalLabel;
        whaleBadgeEl.style.background = signalBg;
        whaleBadgeEl.style.color = signalColor;
        whaleBadgeEl.style.borderColor = signalBorder;
        whaleSignalDescEl.textContent = signalDesc;

        const aiSignalPanel = document.getElementById('kis-whale-ai-signal');
        if (aiSignalPanel) {
            aiSignalPanel.style.borderColor = signalBorder;
            aiSignalPanel.style.background = signalBg.replace('0.15)', '0.08)').replace('0.18)', '0.08)');
        }
    }

    function updateKisAdvisoryCard(stock) {
        const advisoryEl = document.getElementById('kis-order-ai-advisory');
        const contentEl = document.getElementById('kis-advisory-content');
        const badgeEl = document.getElementById('kis-advisory-status-badge');
        if (!advisoryEl || !contentEl || !badgeEl) return;

        if (!stock) {
            advisoryEl.style.display = 'none';
            contentEl.innerHTML = '<div class="kis-advisory-empty">종목을 입력하고 조회하면 AI 실시간 분석 및 추천 매매 가이드가 제공됩니다.</div>';
            badgeEl.textContent = '분석 대기';
            badgeEl.style.background = 'rgba(100, 116, 139, 0.15)';
            badgeEl.style.color = '#64748b';
            return;
        }

        advisoryEl.style.display = 'block';

        const rsiVal = parseFloat(stock.reason?.indicators?.rsi || stock.rsi || 50);
        const path = stock.consensusPath || [];
        const currentPrice = kisCurrentRawPriceInfo ? (kisCurrentRawPriceInfo.currentPrice ?? kisCurrentRawPriceInfo.price) : (stock.rawPrice || 0);

        let trendText = '중립';
        let trendColor = '#cbd5e1';
        let pathDiffPercent = 0;
        if (path.length > 0) {
            const lastVal = path[Math.min(4, path.length - 1)];
            const baseVal = currentPrice || path[0];
            pathDiffPercent = baseVal > 0 ? ((lastVal - baseVal) / baseVal) * 100 : 0;
            if (pathDiffPercent >= 2) {
                trendText = '단기 상승 우세';
                trendColor = '#34d399';
            } else if (pathDiffPercent <= -2) {
                trendText = '단기 하락 우세';
                trendColor = '#fb7185';
            }
        }

        let riskBadgeColor = '#fbbf24';
        let riskBadgeBg = 'rgba(251, 191, 36, 0.15)';
        let riskText = '보통 (안정적인 흐름)';
        if (rsiVal > 75) {
            riskBadgeColor = '#f43f5e';
            riskBadgeBg = 'rgba(244, 63, 94, 0.2)';
            riskText = '🚨 극적 과열 (초위험)';
        } else if (rsiVal > 65) {
            riskBadgeColor = '#fb7185';
            riskBadgeBg = 'rgba(251, 113, 133, 0.15)';
            riskText = '⚠️ 과열 진입 (주의)';
        } else if (rsiVal < 32) {
            riskBadgeColor = '#34d399';
            riskBadgeBg = 'rgba(52, 211, 153, 0.15)';
            riskText = '🟢 과매도 (매수 적기)';
        } else if (rsiVal < 42) {
            riskBadgeColor = '#38bdf8';
            riskBadgeBg = 'rgba(56, 189, 248, 0.15)';
            riskText = '안정 (저평가 매력)';
        }

        let limitDiscount = 0.015;
        if (rsiVal > 75) limitDiscount = 0.04;
        else if (rsiVal > 65) limitDiscount = 0.025;
        else if (rsiVal < 32) limitDiscount = 0.005;

        const recommendedEntryUsd = currentPrice * (1 - limitDiscount);
        const cur = getKisDisplayCurrency();
        const rate = getUsdRate();
        let displayRecPrice = recommendedEntryUsd;
        let currencySign = '$';
        let fractionDigits = 2;

        if (stock.nativeCurrency === 'KRW') {
            if (cur === 'USD') {
                displayRecPrice = recommendedEntryUsd / rate;
            } else {
                currencySign = '₩';
                fractionDigits = 0;
            }
        } else if (cur === 'KRW') {
            displayRecPrice = recommendedEntryUsd * rate;
            currencySign = '₩';
            fractionDigits = 0;
        }

        const fmtRecPrice = currencySign + Math.round(displayRecPrice).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

        let adviceComment = '';
        if (rsiVal > 75) {
            adviceComment = `현재 극심한 오버슈팅 구간(RSI ${rsiVal.toFixed(1)})으로, 단기 차익 실현 매물이 쏟아질 가능성이 높습니다. 신규 매수는 지극히 위험하며, 조정 시 지지선인 <strong>${fmtRecPrice}</strong> 부근까지 대기 매수(Limit)를 권장합니다.`;
        } else if (rsiVal > 65) {
            adviceComment = `단기 상승 모멘텀(RSI ${rsiVal.toFixed(1)})이 과열권에 진입했습니다. 추격 매수보다는 <strong>${fmtRecPrice}</strong> 라인 근처에서 분할 매수 전략으로 접근하여 평단가를 관리하세요.`;
        } else if (rsiVal < 32) {
            adviceComment = `과매도 시그널(RSI ${rsiVal.toFixed(1)})이 포착되었습니다. 기술적 반등 및 가치 환원 가능성이 높은 최적의 진입 구간입니다. 적극적으로 <strong>${fmtRecPrice}</strong> 부근에서 분할 매집을 개시하십시오.`;
        } else if (pathDiffPercent >= 2) {
            adviceComment = `AI 5일 시뮬레이션 경로상 우상향 흐름(+${pathDiffPercent.toFixed(1)}%)이 지배적입니다. 안정적인 정배열 매수 구간이며, <strong>${fmtRecPrice}</strong> 부근에서 진입 시 안전 마진 확보가 가능합니다.`;
        } else if (pathDiffPercent <= -2) {
            adviceComment = `AI 시뮬레이션이 하향 추세(-${Math.abs(pathDiffPercent).toFixed(1)}%)를 가리키고 있습니다. 단기 하락 압력이 있으므로, 무리한 매수보다는 관망하거나 <strong>${fmtRecPrice}</strong> 아래의 지지 여부를 먼저 확인하십시오.`;
        } else {
            adviceComment = `현재 보합 및 횡보 구간입니다. 가격 변동폭이 좁으므로 방향성이 결정될 때까지 관망하거나, <strong>${fmtRecPrice}</strong> 선을 기준으로 박스권 하단 지정가 매수로 조심스럽게 타진해 보세요.`;
        }

        badgeEl.textContent = riskText;
        badgeEl.style.background = riskBadgeBg;
        badgeEl.style.color = riskBadgeColor;

        updateKisWhaleAiSignalFromStock(stock, rsiVal, pathDiffPercent, trendText);

        contentEl.innerHTML = `
            <div class="kis-advisory-row" style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                <span style="color:#94a3b8;">AI 단기 추세:</span>
                <span style="font-weight:800;color:${trendColor};">${trendText}</span>
            </div>
            <div class="kis-advisory-row" style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                <span style="color:#94a3b8;">추천 진입 희망가:</span>
                <span style="font-weight:800;color:#38bdf8;font-family:monospace;">${fmtRecPrice}</span>
            </div>
            <div style="font-size:0.72rem;color:#cbd5e1;line-height:1.45;">💡 <strong>Advice:</strong> ${adviceComment}</div>
        `;
        requestAnimationFrame(() => syncKisOrderLayoutHeights());
    }

    function renderKisSymbolBotSettingsPanel(symbol, stock) {
        const botWrapEl = document.getElementById('kis-center-bot-wrap');
        if (!botWrapEl || !symbol) return;
        if (typeof getSymbolBotConfig !== 'function') {
            botWrapEl.innerHTML = '<div class="kis-bot-placeholder">🤖 종목 조회 후 AI 봇 설정이 표시됩니다.</div>';
            return;
        }

        const cleanSymbol = symbol.trim().toUpperCase();
        const botCfg = getSymbolBotConfig(cleanSymbol);
        const adviceText = String(stock?.advice || stock?.outlook || stock?.rating || '');
        const cur = getKisDisplayCurrency();
        const rate = getUsdRate();
        const livePrice = kisCurrentRawPriceInfo?.currentPrice ?? kisCurrentRawPriceInfo?.price ?? stock?.rawPrice ?? 0;
        const tpPrice = livePrice > 0 ? livePrice * (1 + botCfg.take_profit_pct / 100) : 0;
        const slPrice = livePrice > 0 ? livePrice * (1 - botCfg.stop_loss_pct / 100) : 0;
        const tpLevelStr = formatBotPriceLevel(tpPrice, stock, cur, rate);
        const slLevelStr = formatBotPriceLevel(slPrice, stock, cur, rate);
        const horizonAdvice = parseHorizonAdviceClient(adviceText, botCfg.horizon, botCfg.strategy);
        const adviceColor = horizonAdvice === 'BUY' ? '#34d399' : (horizonAdvice === 'SELL' ? '#fb7185' : '#fbbf24');
        const adviceLabel = horizonAdvice === 'BUY' ? '매수' : (horizonAdvice === 'SELL' ? '매도' : '관망');
        const strategies = TOSS_BOT_HORIZON_STRATEGIES[botCfg.horizon] || [];
        const priceStep = getBotPriceInputStep(stock, cur);
        const tpPriceInputVal = formatPriceForInput(tpPrice, stock, cur, rate);
        const slPriceInputVal = formatPriceForInput(slPrice, stock, cur, rate);

        botWrapEl.innerHTML = `
            <div class="kis-center-bot-inline" id="kis-symbol-bot-settings" data-symbol="${cleanSymbol}" title="익절 ${tpLevelStr} · 손절 ${slLevelStr}">
                <span class="kis-symbol-bot-inline-label">🤖 <em>${cleanSymbol}</em></span>
                <button type="button" class="kis-symbol-bot-advice-badge kis-symbol-bot-advice-btn" style="color:${adviceColor};border-color:${adviceColor}33;background:${adviceColor}18;cursor:pointer;" title="클릭 시 이 시그널로 즉시 봇 강제 거래 실행">${adviceLabel}</button>
                <span class="kis-symbol-inline-sep"></span>
                <div class="kis-symbol-horizon-inline">
                    ${['short', 'medium', 'long'].map(h => `
                        <button type="button" class="kis-symbol-horizon-btn${botCfg.horizon === h ? ' active' : ''}" data-horizon="${h}" title="${TOSS_BOT_HORIZON_HINTS[h] || ''}">${TOSS_BOT_HORIZON_LABELS[h]}</button>
                    `).join('')}
                </div>
                <span class="kis-symbol-inline-sep"></span>
                <div class="kis-symbol-strategy-inline">
                    ${strategies.map(s => `
                        <button type="button" class="kis-symbol-strategy-btn${botCfg.strategy === s ? ' active' : ''}" data-strategy="${s}" title="${getStrategyHint(botCfg.horizon, s)}">${TOSS_BOT_STRATEGY_LABELS[s]}</button>
                    `).join('')}
                </div>
                <span class="kis-symbol-inline-sep"></span>
                <div class="kis-symbol-tpsl-inline">
                    <span class="tp-label">TP</span>
                    <input type="number" id="kis-symbol-tp-pct" class="tp-input pct-input" value="${botCfg.take_profit_pct}" min="0.1" max="999" step="0.5" title="익절 %">
                    <span class="tpsl-unit">%</span>
                    <input type="number" id="kis-symbol-tp-price" class="tp-input price-input" value="${tpPriceInputVal}" min="0" step="${priceStep}" placeholder="익절가" title="익절 목표가">
                    <span class="tpsl-divider">|</span>
                    <span class="sl-label">SL</span>
                    <input type="number" id="kis-symbol-sl-pct" class="sl-input pct-input" value="${botCfg.stop_loss_pct}" min="0.1" max="999" step="0.5" title="손절 %">
                    <span class="tpsl-unit">%</span>
                    <input type="number" id="kis-symbol-sl-price" class="sl-input price-input" value="${slPriceInputVal}" min="0" step="${priceStep}" placeholder="손절가" title="손절 목표가">
                </div>
                <span class="kis-symbol-inline-sep"></span>
                <div class="kis-symbol-qty-inline" style="display:flex;align-items:center;gap:0.25rem;">
                    <span style="color:#94a3b8;font-size:0.75rem;font-weight:bold;">QTY</span>
                    <input type="number" id="kis-symbol-qty" style="width:50px;height:22px;text-align:center;background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:4px;font-size:0.75rem;font-weight:bold;" placeholder="Auto" title="수량 (미입력 시 Kelly 계산)">
                </div>
                <span class="kis-symbol-inline-sep"></span>
                <button type="button" id="kis-symbol-apply-global-btn" class="kis-symbol-apply-btn">↗ 적용</button>
            </div>`;

        initKisSymbolBotSettingsPanel(cleanSymbol, stock);
    }

    function initKisSymbolBotSettingsPanel(symbol, stock) {
        const panel = document.getElementById('kis-symbol-bot-settings');
        if (!panel || !symbol) return;

        const sym = symbol.trim().toUpperCase();
        const cur = getKisDisplayCurrency();
        const rate = getUsdRate();
        let tpslSyncing = false;

        const getLiveRawPrice = () => kisCurrentRawPriceInfo?.currentPrice ?? kisCurrentRawPriceInfo?.price ?? stock?.rawPrice ?? 0;

        const persist = (opts = {}) => {
            const activeH = panel.querySelector('.kis-symbol-horizon-btn.active');
            const activeS = panel.querySelector('.kis-symbol-strategy-btn.active');
            const horizon = activeH?.getAttribute('data-horizon') || 'short';
            const strategy = normalizeBotStrategy(horizon, opts.strategy ?? activeS?.getAttribute('data-strategy'));
            const cfg = {
                horizon,
                strategy,
                take_profit_pct: opts.take_profit_pct ?? (parseFloat(document.getElementById('kis-symbol-tp-pct')?.value) || 10),
                stop_loss_pct: opts.stop_loss_pct ?? (parseFloat(document.getElementById('kis-symbol-sl-pct')?.value) || 5),
            };
            saveSymbolBotConfig(sym, cfg);
            const price = getLiveRawPrice();
            const tpPct = cfg.take_profit_pct;
            const slPct = cfg.stop_loss_pct;
            const tpPriceEl = document.getElementById('kis-symbol-tp-price');
            const slPriceEl = document.getElementById('kis-symbol-sl-price');
            if (price > 0) {
                if (tpPriceEl) tpPriceEl.value = formatPriceForInput(price * (1 + tpPct / 100), stock, cur, rate);
                if (slPriceEl) slPriceEl.value = formatPriceForInput(price * (1 - slPct / 100), stock, cur, rate);
            }
            const badge = panel.querySelector('.kis-symbol-bot-advice-badge');
            if (badge) {
                const adviceText = String(stock?.advice || stock?.outlook || stock?.rating || '');
                const ha = parseHorizonAdviceClient(adviceText, cfg.horizon, cfg.strategy);
                const color = ha === 'BUY' ? '#34d399' : (ha === 'SELL' ? '#fb7185' : '#fbbf24');
                const label = ha === 'BUY' ? '매수' : (ha === 'SELL' ? '매도' : '관망');
                badge.textContent = label;
                badge.style.color = color;
                badge.style.borderColor = color + '33';
                badge.style.background = color + '18';
            }
        };

        panel.querySelectorAll('.kis-symbol-horizon-btn').forEach(btn => {
            btn.onclick = () => {
                panel.querySelectorAll('.kis-symbol-horizon-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const defaults = getStrategyDefaults(normalizeBotStrategy(btn.getAttribute('data-horizon'), null));
                document.getElementById('kis-symbol-tp-pct').value = defaults.take_profit_pct;
                document.getElementById('kis-symbol-sl-pct').value = defaults.stop_loss_pct;
                persist({ strategy: normalizeBotStrategy(btn.getAttribute('data-horizon'), null), ...defaults });
            };
        });

        panel.querySelectorAll('.kis-symbol-strategy-btn').forEach(btn => {
            btn.onclick = () => {
                panel.querySelectorAll('.kis-symbol-strategy-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const defaults = getStrategyDefaults(btn.getAttribute('data-strategy'));
                document.getElementById('kis-symbol-tp-pct').value = defaults.take_profit_pct;
                document.getElementById('kis-symbol-sl-pct').value = defaults.stop_loss_pct;
                persist({ strategy: btn.getAttribute('data-strategy'), ...defaults });
            };
        });

        ['kis-symbol-tp-pct', 'kis-symbol-sl-pct'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.oninput = () => persist();
                input.onchange = () => persist();
            }
        });

        const applyBtn = document.getElementById('kis-symbol-apply-global-btn');
        if (applyBtn) {
            applyBtn.onclick = async () => {
                applyBotConfigToGlobalUI(getSymbolBotConfig(sym));
                if (typeof showToast === 'function') showToast(`${sym} 설정을 플로팅 AI 봇에 적용했습니다.`);

                const adviceBadge = panel.querySelector('.kis-symbol-bot-advice-badge');
                const advice = adviceBadge ? adviceBadge.textContent.trim() : '관망';
                if (advice === '관망') {
                    alert('현재 "관망" 상태입니다. 매수 또는 매도 방향을 선택해주세요.');
                    return;
                }
                const side = advice === '매수' ? 'BUY' : 'SELL';
                
                const isDryRun = typeof isKisDryRun === 'function' ? isKisDryRun() : true;
                const modeText = isDryRun ? '모의(DRY)' : '실전(REAL)';
                
                const qtyInput = document.getElementById('kis-symbol-qty');
                let quantity = qtyInput ? parseFloat(qtyInput.value) : null;
                if (isNaN(quantity) || quantity <= 0) {
                    quantity = null;
                }
                
                const actionKor = side === 'BUY' ? '매수' : '매도';
                const qtyDesc = quantity ? `${quantity}주` : 'Kelly 자동 계산';
                
                const confirmMsg = `🚨 [즉시 강제 거래 전송 - KIS]\n\n` +
                    `- 종목: ${sym}\n` +
                    `- 계좌 모드: ${modeText}\n` +
                    `- 구분: 봇 강제 ${actionKor}\n` +
                    `- 수량: ${qtyDesc}\n\n` +
                    `이 설정으로 즉시 거래를 전송하시겠습니까?`;
                    
                if (!confirm(confirmMsg)) return;
                
                try {
                    applyBtn.disabled = true;
                    applyBtn.textContent = '거래 처리중...';
                    
                    const tpPct = parseFloat(document.getElementById('kis-symbol-tp-pct')?.value) || 10;
                    const slPct = parseFloat(document.getElementById('kis-symbol-sl-pct')?.value) || 5;
                    const horizon = panel.querySelector('.kis-symbol-horizon-btn.active')?.getAttribute('data-horizon') || 'short';
                    const strategy = panel.querySelector('.kis-symbol-strategy-btn.active')?.getAttribute('data-strategy') || 'swing';
                    
                    const response = await fetch(`http://127.0.0.1:8000/api/bot/force-trade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            broker: 'KIS',
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
                        if (typeof window.refreshKisPortfolio === 'function') window.refreshKisPortfolio();
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

        const adviceBtn = panel.querySelector('.kis-symbol-bot-advice-btn');
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

        window._refreshKisSymbolBotTpslLevels = () => {
            if (tpslSyncing) return;
            tpslSyncing = true;
            const price = getLiveRawPrice();
            const tpPct = parseFloat(document.getElementById('kis-symbol-tp-pct')?.value) || 0;
            const slPct = parseFloat(document.getElementById('kis-symbol-sl-pct')?.value) || 0;
            if (price > 0) {
                const tpPriceEl = document.getElementById('kis-symbol-tp-price');
                const slPriceEl = document.getElementById('kis-symbol-sl-price');
                if (tpPriceEl) tpPriceEl.value = formatPriceForInput(price * (1 + tpPct / 100), stock, cur, rate);
                if (slPriceEl) slPriceEl.value = formatPriceForInput(price * (1 - slPct / 100), stock, cur, rate);
            }
            tpslSyncing = false;
        };
    }

    function updateKisChartAnalysis(symbol) {
        const analysisEl = document.getElementById('kis-order-chart-analysis');
        const botWrapEl = document.getElementById('kis-center-bot-wrap');
        if (!analysisEl) return;

        if (!symbol) {
            analysisEl.innerHTML = '<div class="kis-metrics-placeholder">종목 조회 후 MFC / PICK · T+1~T+5 예측이 표시됩니다.</div>';
            if (botWrapEl) botWrapEl.innerHTML = '<div class="kis-bot-placeholder">🤖 종목 조회 후 AI 봇 설정이 표시됩니다.</div>';
            updateKisAdvisoryCard(null);
            return;
        }

        const cleanSym = symbol.trim().toUpperCase();
        const stock = findKisReportStock(cleanSym);

        if (!stock) {
            analysisEl.innerHTML = `
                <div style="text-align:center;padding:0.5rem;color:#94a3b8;font-size:0.75rem;background:rgba(15,23,42,0.4);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    ⚠️ '${cleanSym}' — AI 리포트 데이터 없음 (MFC/PICK·궤적 미표시)
                </div>`;
            renderKisSymbolBotSettingsPanel(cleanSym, null);
            updateKisAdvisoryCard(null);
            return;
        }

        const ind = stock.reason?.indicators || {};
        const mfcVal = parseFloat(ind.mfc_score || stock.mfcScore || 0);
        let mfcColor = '#fb7185';
        if (mfcVal >= 70) mfcColor = '#34d399';
        else if (mfcVal >= 50) mfcColor = '#38bdf8';
        else if (mfcVal >= 30) mfcColor = '#fbbf24';

        let pickVal = 0;
        let pickColor = '#fbbf24';
        if (typeof buildRecommendationScore === 'function') {
            pickVal = buildRecommendationScore(stock).total;
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
        const cur = getKisDisplayCurrency();
        const rate = getUsdRate();

        if (path.length > 0) {
            const maxDays = Math.min(5, path.length);
            for (let i = 0; i < maxDays; i++) {
                const val = path[i];
                const prevVal = i === 0 ? basePrice : path[i - 1];
                const pctChange = prevVal > 0 ? (((val - prevVal) / prevVal) * 100) : 0;
                const sign = pctChange >= 0 ? '+' : '';
                const changeCol = pctChange > 0 ? '#f25f7a' : (pctChange < 0 ? '#5f97f2' : '#94a3b8');
                const borderCol = pctChange > 0 ? 'rgba(52, 211, 153, 0.15)' : (pctChange < 0 ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255, 255, 255, 0.05)');
                const bgCol = pctChange > 0 ? 'rgba(52, 211, 153, 0.03)' : (pctChange < 0 ? 'rgba(251, 113, 133, 0.03)' : 'rgba(15, 23, 42, 0.3)');

                let displayVal = val;
                let currencySign = '$';
                let fractionDigits = 2;
                if (stock.nativeCurrency === 'KRW') {
                    if (cur === 'USD') displayVal = val / rate;
                    else { currencySign = '₩'; fractionDigits = 0; }
                } else if (cur === 'KRW') {
                    displayVal = val * rate;
                    currencySign = '₩';
                    fractionDigits = 0;
                }

                const priceStr = currencySign + Math.round(displayVal).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
                tListHtml += `
                    <div class="kis-traj-card" style="background:${bgCol};border:1px solid ${borderCol};">
                        <div class="kis-traj-day">T+${i + 1}</div>
                        <div class="kis-traj-price">${priceStr}</div>
                        <div class="kis-traj-pct" style="color:${changeCol};">${sign}${pctChange.toFixed(2)}%</div>
                    </div>`;
            }
        } else {
            tListHtml = '<div class="kis-traj-empty">예측 데이터 없음</div>';
        }

        analysisEl.innerHTML = `
            <div class="kis-metrics-compact">
                <div class="kis-metrics-scores">
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
                <div class="kis-metrics-trajectory">
                    <div class="kis-trajectory-title"><span>📈</span> T+1~5</div>
                    <div class="kis-trajectory-row">${tListHtml}</div>
                </div>
            </div>`;

        renderKisSymbolBotSettingsPanel(cleanSym, stock);
        updateKisAdvisoryCard(stock);
        requestAnimationFrame(() => syncKisOrderLayoutHeights());
    }

    function refreshKisOrderConsoleCurrency() {
        if (kisCurrentRawPriceInfo) updateKisRealtimePricePanel(kisCurrentRawPriceInfo);
        if (kisCurrentRawCandles.length > 0) renderKisOrderChart(kisCurrentRawCandles);
        if (kisCurrentActiveSymbol) {
            updateKisChartAnalysis(kisCurrentActiveSymbol);
            refreshKisWhaleFlow(kisCurrentActiveSymbol, kisChartOrderPeriod, kisChartOrderInterval);
        }
    }

    function startKisRealtimePriceLoop(symbol, period = '1d', interval = '5m') {
        stopKisRealtimeLoops();

        const applyKisTick = (tick) => {
            if (kisCurrentActiveSymbol !== symbol) return;
            const tickAsInfo = {
                currentPrice: tick.price,
                change: tick.change,
                changePct: tick.changePct,
                volume: kisCurrentRawPriceInfo?.volume || 0,
                rsi: kisCurrentRawPriceInfo?.rsi ?? null,
            };
            kisCurrentRawPriceInfo = { ...kisCurrentRawPriceInfo, ...tickAsInfo };
            updateKisRealtimePricePanel(tickAsInfo);
        };

        kisRealtimeTickIntervalId = setInterval(() => {
            if (!symbol || kisCurrentActiveSymbol !== symbol) {
                clearInterval(kisRealtimeTickIntervalId);
                kisRealtimeTickIntervalId = null;
                return;
            }
            fetch(`http://127.0.0.1:8000/api/price/${symbol}/realtime`)
                .then(r => r.json())
                .then(t => applyKisTick({
                    price: t.price ?? t.currentPrice,
                    change: t.change ?? 0,
                    changePct: t.changePct ?? 0,
                }))
                .catch(() => {});
        }, 3000);

        kisRealtimePriceIntervalId = setInterval(() => {
            if (!symbol || kisCurrentActiveSymbol !== symbol) {
                clearInterval(kisRealtimePriceIntervalId);
                kisRealtimePriceIntervalId = null;
                return;
            }
            fetch(`http://127.0.0.1:8000/api/price/${symbol}?period=${period}&interval=${interval}`)
                .then(res => { if (!res.ok) throw new Error('조회 실패'); return res.json(); })
                .then(data => {
                    if (kisCurrentActiveSymbol !== symbol) return;
                    kisCurrentRawCandles = data.candles || [];
                    kisCurrentRawPriceInfo = data;
                    updateKisRealtimePricePanel(data);
                    renderKisOrderChart(kisCurrentRawCandles);
                    if (typeof window._refreshKisSymbolBotTpslLevels === 'function') {
                        window._refreshKisSymbolBotTpslLevels();
                    }
                    updateKisChartAnalysis(symbol);
                    refreshKisWhaleFlow(symbol, period, interval);
                })
                .catch(() => {});
        }, 30000);
    }

    window.fetchKisTickerPriceData = function (symbol, period = '1d', interval = '5m') {
        if (!symbol) return;
        const cleanSym = symbol.trim().toUpperCase();
        kisCurrentActiveSymbol = cleanSym;
        kisChartOrderPeriod = period;
        kisChartOrderInterval = interval;

        stopKisWhaleSimulation();

        const panel = document.getElementById('kis-realtime-price-panel');
        if (panel) panel.innerHTML = '<span style="font-size:0.9rem;color:var(--text-muted);">조회 중...</span>';

        fetch(`http://127.0.0.1:8000/api/price/${cleanSym}?period=${period}&interval=${interval}`)
            .then(res => {
                if (!res.ok) throw new Error('조회 실패');
                return res.json();
            })
            .then(data => {
                if (kisCurrentActiveSymbol !== cleanSym) return;

                kisCurrentRawCandles = data.candles || [];
                kisCurrentRawPriceInfo = data;

                updateKisRealtimePricePanel(data);

                const orderSymbolInput = el('order-symbol');
                const chartSymbolInput = el('chart-symbol-input');
                if (orderSymbolInput) orderSymbolInput.value = cleanSym;
                if (chartSymbolInput) chartSymbolInput.value = cleanSym;

                const priceInput = el('order-price');
                const cur = getKisDisplayCurrency();
                const rate = getUsdRate();
                const currentPrice = data.currentPrice ?? data.price ?? 0;
                if (priceInput && (parseFloat(priceInput.value) === 0 || priceInput.value === '')) {
                    priceInput.value = cur === 'KRW' ? Math.round(currentPrice * rate) : currentPrice;
                }

                renderKisOrderChart(kisCurrentRawCandles);
                try {
                    updateKisChartAnalysis(cleanSym);
                } catch (err) {
                    console.error('KIS chart analysis render failed:', err);
                }

                refreshKisWhaleFlow(cleanSym, period, interval);
                startKisRealtimePriceLoop(cleanSym, period, interval);

                if (typeof window.renderKisPortfolio === 'function') {
                    window.renderKisPortfolio();
                }
            })
            .catch(err => {
                console.error('KIS price fetch failed:', err);
                if (panel) {
                    panel.innerHTML = '<span style="font-size:0.85rem;color:var(--live-red);">종목 정보 조회 실패 (존재하지 않는 티커이거나 yfinance 일시 오류)</span>';
                }
            });
    };

    function triggerKisChartSearch() {
        const chartInput = el('chart-symbol-input');
        const orderInput = el('order-symbol');
        const sym = ((chartInput?.value || orderInput?.value || 'AAPL')).trim().toUpperCase();
        if (!sym) return;
        if (chartInput) chartInput.value = sym;
        if (orderInput) orderInput.value = sym;
        
        // [NEW] 세션에 저장된 기간 복원
        const savedPeriod = sessionStorage.getItem('kisChartPeriod') || '1y';
        const targetBtn = document.querySelector(`#view-kis-trade .kis-chart-period-btn[data-period="${savedPeriod}"]`);
        if (targetBtn) {
            qsa('.kis-chart-period-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }
        
        const activePeriodBtn = document.querySelector('#view-kis-trade .kis-chart-period-btn.active');
        const period = activePeriodBtn?.getAttribute('data-period') || '1y';
        const interval = activePeriodBtn?.getAttribute('data-interval') || '1wk';
        window.fetchKisTickerPriceData(sym, period, interval);
    }

    function initKisOrderConsoleEvents() {
        const chartSearchBtn = el('chart-search-btn');
        const chartInput = el('chart-symbol-input');
        const orderInput = el('order-symbol');

        if (chartSearchBtn) chartSearchBtn.onclick = triggerKisChartSearch;
        if (chartInput) {
            chartInput.onkeydown = (e) => { if (e.key === 'Enter') triggerKisChartSearch(); };
            chartInput.oninput = () => {
                const val = chartInput.value.trim().toUpperCase();
                if (orderInput) orderInput.value = val;
                if (val === '') {
                    kisCurrentActiveSymbol = null;
                    
                    // [NEW] 티커가 비었을 때 세션에 저장된 기간으로 active 복원
                    const savedPeriod = sessionStorage.getItem('kisChartPeriod') || '1y';
                    const defaultPeriodBtn = document.querySelector(`#view-kis-trade .kis-chart-period-btn[data-period="${savedPeriod}"]`);
                    if (defaultPeriodBtn) {
                        qsa('.kis-chart-period-btn').forEach(b => b.classList.remove('active'));
                        defaultPeriodBtn.classList.add('active');
                    }
                    
                    stopKisWhaleSimulation();
                    resetKisWhalePanelUi();
                    updateKisChartAnalysis(null);
                }
            };
        }
        if (orderInput) {
            orderInput.oninput = () => {
                const val = orderInput.value.trim().toUpperCase();
                if (chartInput) chartInput.value = val;
                
                // 종목 한글명 표시
                const nameSpan = document.getElementById('kis-order-stock-name');
                if (nameSpan) {
                    const name = typeof window.findStockNameLocal === 'function' ? window.findStockNameLocal(val) : '';
                    nameSpan.textContent = name ? `(${name})` : '';
                }
                
                // 도우미 패널 업데이트
                if (typeof window.updateKisOrderHelper === 'function') {
                    window.updateKisOrderHelper();
                }
                
                if (val === '') {
                    kisCurrentActiveSymbol = null;
                    
                    // [NEW] 티커가 비었을 때 세션에 저장된 기간으로 active 복원
                    const savedPeriod = sessionStorage.getItem('kisChartPeriod') || '1y';
                    const defaultPeriodBtn = document.querySelector(`#view-kis-trade .kis-chart-period-btn[data-period="${savedPeriod}"]`);
                    if (defaultPeriodBtn) {
                        qsa('.kis-chart-period-btn').forEach(b => b.classList.remove('active'));
                        defaultPeriodBtn.classList.add('active');
                    }
                    
                    stopKisWhaleSimulation();
                    resetKisWhalePanelUi();
                    updateKisChartAnalysis(null);
                }
            };
        }

        qsa('.kis-chart-period-btn').forEach(btn => {
            btn.onclick = () => {
                qsa('.kis-chart-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sym = (chartInput.value || 'AAPL').trim().toUpperCase();
                const period = btn.getAttribute('data-period') || '1d';
                const interval = btn.getAttribute('data-interval') || '5m';
                
                // [NEW] 세션에 선택한 기간 저장
                sessionStorage.setItem('kisChartPeriod', period);
                sessionStorage.setItem('kisChartInterval', interval);
                
                if (kisCurrentActiveSymbol) {
                    window.fetchKisTickerPriceData(kisCurrentActiveSymbol, period, interval);
                }
            };
        });

        // [NEW] 최초 로드 시 세션에 저장된 차트 기간 active 상태 복원
        const savedPeriod = sessionStorage.getItem('kisChartPeriod') || '1y';
        const targetBtn = document.querySelector(`#view-kis-trade .kis-chart-period-btn[data-period="${savedPeriod}"]`);
        if (targetBtn) {
            qsa('.kis-chart-period-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }

        window.addEventListener('resize', () => {
            if (document.getElementById('view-kis-trade')?.offsetParent !== null) {
                syncKisOrderLayoutHeights();
            }
        });
    }

    function loadKisChartSymbol(symbol) {
        if (!symbol) return;
        const chartInput = el('chart-symbol-input');
        const orderInput = el('order-symbol');
        if (chartInput) chartInput.value = symbol;
        if (orderInput) orderInput.value = symbol;
        triggerKisChartSearch();
    }

    window.kisQuickOrder = (symbol) => {
        const orderTab = document.querySelector('.segment-btn.kis-sub-tab[data-sub-target="kis-sub-orders"]');
        if (orderTab) orderTab.click();

        const symbolInput = document.getElementById('kis-order-symbol');
        if (symbolInput) {
            symbolInput.value = cleanKisSymbol(symbol);
            symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        const chartInput = document.getElementById('kis-chart-symbol-input');
        if (chartInput) chartInput.value = cleanKisSymbol(symbol);
    };

    window.kisQuickSell = (symbol, qty) => {
        const orderTab = document.querySelector('.segment-btn.kis-sub-tab[data-sub-target="kis-sub-orders"]');
        if (orderTab) orderTab.click();

        const symbolInput = document.getElementById('kis-order-symbol');
        const qtyInput = document.getElementById('kis-order-qty');
        
        if (symbolInput) symbolInput.value = cleanKisSymbol(symbol);
        if (qtyInput) qtyInput.value = qty;
        
        const sellBtn = document.querySelector('.kis-side-btn[data-side="SELL"]');
        if (sellBtn) sellBtn.click();
        
        const orderBtn = document.getElementById('kis-submit-order-btn');
        if (orderBtn) {
            orderBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            orderBtn.style.animation = 'orbAlert 0.3s 3 alternate';
            setTimeout(() => { orderBtn.style.animation = ''; }, 1000);
        }
    };
})();
