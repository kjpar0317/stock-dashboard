/* ============================================================================
 * trade_planner.js — TRADE PLANNER 화면
 * ----------------------------------------------------------------------------
 * "지금 이걸 살까?"를 한 화면에서 끝낸다.
 *   진입 게이트 판정 → 주문 설계(리스크 기반 수량) → 시나리오 → 주문
 *
 * 설계 근거: .claude/plans/dashboard-ui-upgrade.md
 *   백테스트에서 재현된 성과는 방향 예측이 아니라 위험 관리였다.
 *   따라서 이 화면의 중심은 "얼마를, 어디서 자를 것인가"이다.
 *
 * 안전 수칙 (CLAUDE.md 거래 안전 수칙):
 *   1. 기본값은 모의(dry_run) — 실거래는 명시적 토글 필요
 *   2. 확인 모달에서 계좌·종목·수량·시장·예상체결·최대손실 표시 후 전송
 *   3. 게이트 차단 시 주문 버튼 비활성화 (우회 경로를 만들지 않는다)
 *   4. 주문은 기존 /api/order 를 그대로 사용 (신규 주문 로직 없음)
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    let lastPlan = null;

    function $(id) { return document.getElementById(id); }

    // 이모지 대신 stroke 아이콘 — 없으면 조용히 생략한다
    function ic(name) {
        return (global.Icons && global.Icons.icon) ? global.Icons.icon(name) : '';
    }


    function serverOfflineHtml(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">이 화면은 로컬 거래 서버의 API가 필요합니다.<br>'
            +   '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\start_trade_server.ps1</code>'
            + '<div class="sg-offline-hint">REPORT 탭의 리스크 플랜·팬 차트·밸류에이션 패널은 '
            +   '서버 없이도 정상 표시됩니다.</div>'
            + (e && e.message ? '<div class="sg-offline-err">' + e.message + '</div>' : '')
            + '</div>';
    }

    function fmtMoney(v, cur) {
        if (v === null || v === undefined || isNaN(v)) return 'N/A';
        return cur === 'KRW'
            ? Math.round(v).toLocaleString('ko-KR') + '원'
            : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    /* ---------------------------------------------------------------- */
    function symbolOptions() {
        const data = (global.REPORTS_HISTORY && global.REPORTS_HISTORY[0]) || {};
        const all = [].concat(data.holdings || [], data.watchlist || []);
        const seen = {};
        return all.filter(function (s) {
            const k = s.symbol || s.name;
            if (!k || seen[k]) return false;
            seen[k] = 1; return true;
        }).map(function (s) {
            return '<option value="' + (s.symbol || s.name) + '">'
                + (s.name || s.symbol) + ' (' + (s.symbol || '-') + ')</option>';
        }).join('');
    }

    function render() {
        const host = $('tp-body');
        if (!host) return;
        host.innerHTML = ''
            + '<div class="tp-controls">'
            +   '<label>종목<select id="tp-symbol">' + symbolOptions() + '</select></label>'
            +   '<label>전략<select id="tp-strategy">'
            +     '<option value="auto">자동 선택 (추천)</option>'
            +     '<option value="swing">스윙 (검증)</option>'
            +     '<option value="trend">추세추종 (검증)</option>'
            +     '<option value="mean_reversion">낙주매매</option>'
            +     '<option value="breakout">돌파매매</option>'
            +     '<option value="value">가치투자</option>'
            +     '<option value="channel_trading">채널매매</option>'
            +   '</select></label>'
            +   '<label>계좌 자산<input id="tp-assets" type="number" value="100000" step="1000"></label>'
            +   '<label>종목당 리스크'
            +     '<span class="tp-field">'
            +       '<input id="tp-risk" type="number" value="1" step="0.25" min="0.1" max="3">'
            +       '<span class="tp-unit">%</span>'
            +     '</span>'
            +   '</label>'
            +   '<button id="tp-run" class="tp-btn tp-btn-primary">판정 실행</button>'
            + '</div>'
            + '<div id="tp-result" class="tp-result"><div class="tp-empty">종목과 전략을 고른 뒤 <b>판정 실행</b>을 누르세요.</div></div>';

        $('tp-run').addEventListener('click', runPlan);
    }

    /* ---------------------------------------------------------------- */
    async function runPlan() {
        const box = $('tp-result');
        box.innerHTML = '<div class="tp-empty">판정 중…</div>';
        const payload = {
            symbol: $('tp-symbol').value,
            strategy: $('tp-strategy').value,
            total_assets: parseFloat($('tp-assets').value) || 100000,
            risk_pct: parseFloat($('tp-risk').value) || 1.0
        };
        try {
            const res = await fetch(API + '/api/plan', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const t = await res.text();
                box.innerHTML = '<div class="tp-error">판정 실패: ' + t + '</div>';
                return;
            }
            lastPlan = await res.json();
            lastPlan._assets = payload.total_assets;
            renderResult(lastPlan);
        } catch (e) {
            box.innerHTML = serverOfflineHtml(e);
        }
    }

    function renderResult(p) {
        const cur = p.currency;
        const plan = p.exit_plan || {};
        const sz = p.sizing || {};
        const sc = p.scenario || {};
        const allowed = !!p.allowed;

        const gate = allowed
            ? '<div class="tp-gate tp-gate-ok">' + ic('check') + '진입 가능</div>'
            : '<div class="tp-gate tp-gate-block">' + ic('x') + '진입 차단</div>';

        const blocks = (p.blocks || []).map(function (b) {
            return '<li class="tp-block">' + b + '</li>';
        }).join('');
        const warns = (p.warnings || []).map(function (w) {
            return '<li class="tp-warn">' + w + '</li>';
        }).join('');

        // 게이트 차단 시 주문 버튼을 아예 렌더링하지 않는다 (우회 경로 차단)
        const orderUi = allowed && sz.shares > 0 ? ''
            + '<div class="tp-order">'
            +   '<label class="tp-live"><input type="checkbox" id="tp-live"> <b>실거래</b> (해제 시 모의주문)</label>'
            +   '<button id="tp-buy" class="tp-btn tp-btn-order">모의 매수 주문</button>'
            + '</div>'
            : (allowed ? '<div class="tp-note-sm">계산된 수량이 0주라 주문할 수 없습니다.</div>'
                       : '<div class="tp-note-sm">게이트 차단 상태에서는 주문 버튼이 제공되지 않습니다.</div>');

        $('tp-result').innerHTML = ''
            + '<div class="tp-head">' + gate
            +   '<span class="tp-sym">' + p.symbol + '</span>'
            +   '<span class="tp-meta">' + fmtMoney(p.price, cur) + ' · ATR ' + p.atr
            +     ' · ' + (p.regime || '-') + '</span>'
            + '</div>'
            + (blocks || warns ? '<ul class="tp-list">' + blocks + warns + '</ul>' : '')
            + '<div class="tp-cols">'
            +   '<div class="tp-card"><h4>' + ic('sliders') + '주문 설계</h4>'
            +     row('수량', (sz.shares || 0) + '주')
            +     row('투입 금액', fmtMoney(sz.notional, cur))
            +     row('최대 손실', fmtMoney(sz.risk_amount, cur)
                      + ' <small>(계좌 ' + (sz.risk_pct_of_account || 0) + '%)</small>')
            +     (sz.capped_by ? row('제한 사유', sz.capped_by === 'liquidity' ? '유동성' : '집중도') : '')
            +   '</div>'
            +   '<div class="tp-card"><h4>' + ic('shield') + '청산 계획</h4>'
            +     row('손절가', '<b class="tp-stop">' + fmtMoney(plan.stop_loss, cur) + '</b> (−' + plan.risk_pct + '%)')
            +     row('익절가', '<b class="tp-target">' + fmtMoney(plan.take_profit, cur) + '</b> (+' + plan.reward_pct + '%)')
            +     row('손익비', '1 : ' + plan.rr_ratio)
            +     row('보유 상한', (plan.max_days || '-') + '영업일')
            +   '</div>'
            +   '<div class="tp-card"><h4>' + ic('target') + '시나리오</h4>'
            +     row('익절 도달', '<b class="tp-target">+' + fmtMoney(sc.win_amount, cur) + '</b>')
            +     row('손절 도달', '<b class="tp-stop">−' + fmtMoney(Math.abs(sc.loss_amount || 0), cur) + '</b>')
            +     row('손익분기 승률', (sc.breakeven_win_rate || '-') + '%')
            +     row('가정 승률', (sc.assumed_win_rate || '-') + '%'
                      + (sc.assumed_win_rate < sc.breakeven_win_rate ? ' ' + ic('alert') : ''))
            +   '</div>'
            + '</div>'
            + orderUi;

        const live = $('tp-live');
        const buy = $('tp-buy');
        if (live && buy) {
            live.addEventListener('change', function () {
                buy.textContent = live.checked ? '실거래 매수 주문' : '모의 매수 주문';
                buy.classList.toggle('tp-btn-live', live.checked);
            });
            buy.addEventListener('click', confirmOrder);
        }
    }

    function row(k, v) {
        return '<div class="tp-row"><span>' + k + '</span><span>' + v + '</span></div>';
    }

    /* ----------------------------------------------------------------
     * 주문 확인 — 되돌릴 수 없는 작업이므로 상세를 보여주고 확인받는다.
     * ---------------------------------------------------------------- */
    function confirmOrder() {
        if (!lastPlan || !lastPlan.allowed) return;
        const live = $('tp-live').checked;
        const sz = lastPlan.sizing || {};
        const plan = lastPlan.exit_plan || {};
        const cur = lastPlan.currency;

        const msg = (live ? '[실거래] 실제 계좌에서 체결됩니다. 되돌릴 수 없습니다.\n\n' : '[모의] 실제 주문이 아닙니다.\n\n')
            + '종목    : ' + lastPlan.symbol + '\n'
            + '시장    : ' + (cur === 'KRW' ? '국내' : '해외(US)') + '\n'
            + '방향    : 매수 (시장가)\n'
            + '수량    : ' + sz.shares + '주\n'
            + '예상체결: ' + fmtMoney(lastPlan.price, cur) + '\n'
            + '투입금액: ' + fmtMoney(sz.notional, cur) + '\n'
            + '최대손실: ' + fmtMoney(sz.risk_amount, cur) + ' (계좌 ' + sz.risk_pct_of_account + '%)\n'
            + '손절가  : ' + fmtMoney(plan.stop_loss, cur) + '\n'
            + '익절가  : ' + fmtMoney(plan.take_profit, cur) + '\n\n'
            + '진행하시겠습니까?';

        if (!global.confirm(msg)) return;
        if (live && !global.confirm('실거래 최종 확인 — 실제 계좌에서 체결됩니다. 계속할까요?')) return;
        sendOrder(live);
    }

    async function sendOrder(live) {
        const sz = lastPlan.sizing || {};
        const btn = $('tp-buy');
        btn.disabled = true; btn.textContent = '주문 전송 중…';
        try {
            const res = await fetch(API + '/api/order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: lastPlan.symbol, side: 'BUY',
                    quantity: sz.shares, type: 'MARKET', dry_run: !live
                })
            });
            const j = await res.json();
            alert(j.success === false
                ? '주문 실패: ' + (j.message || '알 수 없는 오류')
                : (live ? '실거래 주문 전송 완료' : '모의 주문 완료') + '\n' + JSON.stringify(j).slice(0, 300));
        } catch (e) {
            alert('주문 전송 실패: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = live ? '실거래 매수 주문' : '모의 매수 주문';
        }
    }

    global.TradePlanner = { render: render };
})(window);
