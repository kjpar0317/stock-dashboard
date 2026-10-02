/**
 * [UPGRADED] broker_adapter.js
 * 통합 Broker Data Adapter 패턴 구현
 * 실제 증권사(TOSS/KIS 등) API 데이터와 리포트 히스토리(REPORTS_HISTORY) 메타데이터를 결합하여
 * 퀀트 엔진(quant_engine.js)에 공급하는 표준 인터페이스를 제공합니다.
 *
 * [변경 이력]
 * - _findReportStock(): 심볼 매핑 다중 전략 강화 (suffix 제거, 한국 6자리 코드, 대소문자 통합)
 * - getHoldings(): rawPrice(단가) → evalAmount(평가금액) 기반 비중 계산 지원
 * - getConnectionStatus(): 데이터 소스 상태 공개 API 추가
 * - getStocks(): historyPath 없는 종목 hasHistory 플래그 추가
 */

class BrokerDataAdapter {
    constructor() {
        this.currentBroker = 'TOSS';
    }

    getBrokerName() {
        if (this.currentBroker === 'KIS') return '한국투자증권';
        if (this.currentBroker === 'TOSS') return '토스증권';
        return '알 수 없는 증권사';
    }

    // ── 연결 상태 확인 ─────────────────────────────────────────────────────
    isConnected() {
        const active = this._activePortfolio();
        return !!(active && active.holdings && active.holdings.length > 0);
    }

    /**
     * 데이터 소스 상태 반환
     * @returns {{ source: 'broker'|'report'|'none', broker: string, count: number }}
     */
    getConnectionStatus() {
        const active = this._activePortfolio();
        if (active && active.holdings && active.holdings.length > 0) {
            return {
                source: 'broker',
                broker: this.getBrokerName(),
                count: active.holdings.length
            };
        }
        if (window.REPORTS_HISTORY && window.REPORTS_HISTORY.length > 0) {
            const r = window.REPORTS_HISTORY[0];
            const count = (r.holdings || []).length + (r.watchlist || []).length;
            return { source: 'report', broker: '리포트 데이터', count };
        }
        return { source: 'none', broker: '없음', count: 0 };
    }

    _activePortfolio() {
        if (this.currentBroker === 'KIS') {
            return window.KIS_PORTFOLIO || (typeof KIS_PORTFOLIO !== 'undefined' ? KIS_PORTFOLIO : null);
        }
        return window.TOSS_PORTFOLIO || (typeof TOSS_PORTFOLIO !== 'undefined' ? TOSS_PORTFOLIO : null);
    }

    // ── 보유 종목 반환 ──────────────────────────────────────────────────────
    getHoldings() {
        const portfolio = this._activePortfolio();

        if (portfolio && portfolio.holdings && portfolio.holdings.length > 0) {
            return portfolio.holdings.map(th => {
                const reportStock = this._findReportStock(th.symbol);
                const currentPrice = parseFloat(th.current_price) || 0;
                const quantity = parseFloat(th.quantity) || 0;
                // [FIX] evalAmount: API 제공값 우선, 없으면 현재가 × 수량으로 계산
                const evalAmount = parseFloat(th.eval_amount) || (currentPrice * quantity) || currentPrice;
                return {
                    symbol: th.symbol,
                    name: th.name || (reportStock ? reportStock.name : th.symbol),
                    quantity,
                    avgBuyPrice: parseFloat(th.avg_buy_price) || 0,
                    currentPrice,
                    evalAmount,                         // ← [FIX] 평가금액 (비중 계산 기준)
                    rawPrice: currentPrice,             // ← 하위 호환
                    profitLoss: parseFloat(th.profit_loss) || 0,
                    returnRate: parseFloat(th.return_rate) || 0,
                    nativeCurrency: th.nativeCurrency || (reportStock ? reportStock.nativeCurrency : 'USD'),
                    changePercent: reportStock ? reportStock.changePercent : (parseFloat(th.return_rate) || 0),
                    historyPath: reportStock ? (reportStock.historyPath || []) : [],
                    hasHistory: reportStock ? ((reportStock.historyPath || []).length >= 10) : false,
                    reason: reportStock ? reportStock.reason : { sector: '실계좌 미지정', indicators: {} }
                };
            });
        }

        return this.getFallbackHoldings();
    }

    /**
     * 백테스트 등에서 종목 리스트를 선택할 수 있도록 보유 및 관심 종목 통합 반환
     * historyPath가 없는 종목은 hasHistory: false 플래그로 표시
     */
    getStocks() {
        const holdings = this.getHoldings();
        const seen = new Set();
        const list = [];

        // 1. 보유 종목 추가
        holdings.forEach(h => {
            if (h.symbol && !seen.has(h.symbol)) {
                seen.add(h.symbol);
                list.push({
                    symbol: h.symbol,
                    name: h.name,
                    rawPrice: h.currentPrice,
                    nativeCurrency: h.nativeCurrency,
                    historyPath: h.historyPath || [],
                    hasHistory: h.hasHistory || false,
                    reason: h.reason
                });
            }
        });

        // 2. 관심 종목 추가 (fallback 리포트의 watchlist)
        const reportStocks = this.getFallbackStocks();
        reportStocks.forEach(s => {
            if (s.symbol && !seen.has(s.symbol)) {
                seen.add(s.symbol);
                list.push({
                    ...s,
                    hasHistory: (s.historyPath || []).length >= 10
                });
            }
        });

        return list;
    }

    /**
     * Fallback: REPORTS_HISTORY[0].holdings 데이터를 표준 포맷으로 가공
     */
    getFallbackHoldings() {
        if (!window.REPORTS_HISTORY || window.REPORTS_HISTORY.length === 0) return [];
        const r = window.REPORTS_HISTORY[0];
        const holdings = r.holdings || [];
        return holdings.map(h => {
            const qty = h.quantity || 1;
            const price = h.rawPrice || 0;
            const evalAmt = h.evalAmount || (qty * price) || price;
            return {
                symbol: h.symbol,
                name: h.name,
                quantity: qty,
                avgBuyPrice: h.avgBuyPrice || price,
                currentPrice: price,
                evalAmount: evalAmt,                    // ← [FIX]
                rawPrice: price,
                profitLoss: h.profitLoss || 0,
                returnRate: h.changePercent || 0,
                nativeCurrency: h.nativeCurrency || 'KRW',
                changePercent: h.changePercent || 0,
                historyPath: h.historyPath || [],
                hasHistory: (h.historyPath || []).length >= 10,
                reason: h.reason || { sector: '기타', indicators: {} }
            };
        });
    }

    /**
     * Fallback: REPORTS_HISTORY[0]의 전체 유니크 종목 반환
     */
    getFallbackStocks() {
        if (!window.REPORTS_HISTORY || window.REPORTS_HISTORY.length === 0) return [];
        const r = window.REPORTS_HISTORY[0];
        const all = [...(r.holdings || []), ...(r.watchlist || [])];
        const seen = new Set();
        return all.filter(s => {
            if (s.symbol && !seen.has(s.symbol)) {
                seen.add(s.symbol);
                return true;
            }
            return false;
        });
    }

    /**
     * [UPGRADED] 심볼 매핑 다중 전략
     * 전략 순서:
     *   1) 정확한 일치
     *   2) 마켓 suffix 제거 후 일치 (AAPL.NAS → AAPL)
     *   3) 한국 종목코드 일치 (A005930 → 005930)
     *   4) 대소문자 무시 일치
     *   5) 부분 포함 일치
     */
    _findReportStock(symbol, name) {
        const history = window.REPORTS_HISTORY || (typeof REPORTS_HISTORY !== 'undefined' ? REPORTS_HISTORY : []);
        if (!history || history.length === 0) return null;

        // 정규화 유틸
        const removeSuffix = (s) => (s || '').split('.')[0].toUpperCase();
        const removePrefix = (s) => removeSuffix(s).replace(/^[AK]/, '').replace(/^KR:/, '');
        const normStr = (s) => (s || '').replace(/\s+/g, '').toUpperCase();

        const sym = (symbol || '').toUpperCase();
        const symNoSuffix = removeSuffix(symbol);
        const symNoPrefix = removePrefix(symbol);
        const symNumOnly = sym.replace(/^[A-Z]+/, '');
        const targetName = normStr(name);

        for (const r of history) {
            const all = [...(r.holdings || []), ...(r.watchlist || [])];

            // 전략 1: 정확 일치
            let found = all.find(s => (s.symbol || '').toUpperCase() === sym);
            if (found) return found;

            // 전략 2: suffix 제거 일치 (AAPL.NAS → AAPL, 018880.KS → 018880)
            found = all.find(s => removeSuffix(s.symbol) === symNoSuffix);
            if (found) return found;

            // 전략 3: prefix 제거 일치 (A005930 → 005930)
            found = all.find(s => removePrefix(s.symbol) === symNoPrefix);
            if (found) return found;

            // 전략 4: 숫자 코드만 비교
            if (symNumOnly.length >= 5) {
                found = all.find(s => {
                    const sNum = (s.symbol || '').replace(/^[A-Za-z]+/, '').replace(/\..*/, '');
                    return sNum === symNumOnly;
                });
                if (found) return found;
            }

            // 전략 5: 종목명 일치 (예: 한온시스템)
            if (targetName && targetName.length >= 2) {
                found = all.find(s => normStr(s.name) === targetName || normStr(s.symbol) === targetName);
                if (found) return found;
            }

            // 전략 6: 부분 포함 (최소 4자)
            if (symNoSuffix.length >= 4) {
                found = all.find(s => {
                    const sc = removeSuffix(s.symbol);
                    return sc.includes(symNoSuffix) || symNoSuffix.includes(sc);
                });
                if (found) return found;
            }
        }

        return null;
    }
}

// 전역 바인딩
window.brokerAdapter = new BrokerDataAdapter();
