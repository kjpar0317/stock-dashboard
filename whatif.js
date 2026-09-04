/* ============================================================================
 * whatif.js — WHAT-IF PLAYGROUND "주문 전 시뮬레이션"
 * ----------------------------------------------------------------------------
 * 슬라이더를 움직이면 즉시 바뀐다. 다만 **계산은 하지 않는다** —
 * 백엔드(`scripts/trade/whatif_api.py`)가 비중별 응답면을 한 번에
 * 내려보내고, 여기서는 배열을 찾아 금액으로 환산만 한다.
 *
 * 금액 환산은 곱하기 하나다 (비중 × 총자산 × 이동률). 이건 "계산"이 아니라
 * 표시 단위 변환이라 브라우저에 둔다 — 이걸 서버로 보내면 슬라이더가 끊긴다.
 *
 * ── 주문 버튼을 여기 두지 않는다 ─────────────────────────────────
 * 이 화면은 샌드박스다. 시뮬레이션 끝에 주문 버튼을 붙이면 놀이가 주문
 * 유도가 된다. 나가는 길은 TRADE PLANNER 뿐이고, **체크리스트를 확인해야**
 * 그 버튼이 열린다. 거기서 진입 게이트를 다시 통과해야 한다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n, o) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n, o) : '';
    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const nz = (v) => (v === null || v === undefined || isNaN(v));
    const pct = (v, d = 1) => nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';
    const amt = (v) => nz(v) ? '—' : (v > 0 ? '+' : '') + Math.round(v).toLocaleString();
    const sgn = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat');

    let WI = null, IDX = 0;

    async function api(path, body) {
        const res = await fetch(API + path, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    function holdings() {
        if (global.Investor && typeof global.Investor.clientHoldings === 'function') {
            try { return global.Investor.clientHoldings(); } catch (e) { /* 아래로 */ }
        }
        return null;
    }

    function offline(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">시뮬레이션은 보유·상관·리스크를 서버에서 계산합니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + esc(e.message) + '</div>' : '')
            + '</div>';
    }

    /* ── 지표 하나 ──────────────────────────────────────────────── */
    function metric(label, val, sub, cls) {
        return '<div class="wi-metric"><span class="wi-m-label">' + esc(label) + '</span>'
            + '<span class="wi-m-val ' + (cls || '') + '">' + val + '</span>'
            + (sub ? '<span class="wi-m-sub">' + sub + '</span>' : '') + '</div>';
    }

    function panel() {
        const j = WI, cur = j.surface[IDX], base = j.base;
        const w = cur.weight;
        const notional = j.total_assets * w / 100;

        //  집중도 — **좋아지는지 나빠지는지**를 화살표로. 숫자만 두면 안 읽힌다.
        const dEb = (nz(cur.effective_bets) || nz(base.effective_bets))
            ? null : cur.effective_bets - base.effective_bets;
        const ebCls = dEb === null ? '' : (dEb >= 0.01 ? 'pos' : dEb <= -0.01 ? 'neg' : 'flat');

        const sc = (key) => (j.scenarios || []).find(s => s.key === key);
        const money = (s) => (!s || !notional) ? null : notional * s.move_pct / 100;

        const stop = sc('stop'), tgt = sc('target'), be = sc('breakeven');

        return '<div class="wi-metrics">'
            + metric('투입 금액', Math.round(notional).toLocaleString(),
                '총자산의 ' + w + '%')
            + metric('실질 베팅 수',
                nz(cur.effective_bets) ? '—' : cur.effective_bets.toFixed(2),
                dEb === null ? '' : '지금 ' + base.effective_bets.toFixed(2)
                + ' → ' + (dEb >= 0 ? '↑' : '↓') + ' ' + Math.abs(dEb).toFixed(2), ebCls)
            + metric('시장 급락 시',
                nz(cur.stress_amount) ? '—' : Math.round(cur.stress_amount).toLocaleString(),
                cur.stress_label ? esc(cur.stress_label) + ' ' + pct(cur.stress_return) : '', 'neg')
            + metric('환율 ' + j.fx_shock_pct + '% 변동',
                '±' + Math.round(cur.fx_shock_amount).toLocaleString(),
                '해외 비중 ' + cur.fx_share + '%')
            + (stop ? metric('손절가 도달 시', amt(money(stop)),
                stop.price.toLocaleString() + ' (' + pct(stop.move_pct, 2) + ')', 'neg') : '')
            + (tgt ? metric('목표가 도달 시', amt(money(tgt)),
                tgt.price.toLocaleString() + ' (' + pct(tgt.move_pct, 2) + ')', 'pos') : '')
            //  ⑦ 비용 — 이걸 빼면 모든 시나리오가 실제보다 좋아 보인다
            + (be ? metric('수수료 손익분기', pct(be.move_pct, 2),
                '왕복 ' + j.cost_bp + 'bp · ' + Math.abs(Math.round(money(be) || 0)).toLocaleString()
                + ' 이상 올라야 본전') : '')
            + '</div>';
    }

    function overlapCard(o) {
        if (!o || !o.available) {
            return '<section class="wi-card"><h3>' + ic('shield') + '중복 위험</h3>'
                + '<p class="wi-dim">' + esc((o && o.message) || '판정할 수 없습니다.') + '</p></section>';
        }
        const chips = (o.duplicates || []).map(d =>
            '<span class="wi-chip"><b>' + esc(d.name) + '</b><small>r ' + d.corr + '</small></span>').join('');
        return '<section class="wi-card wi-ov-' + esc(o.verdict[0]) + '">'
            + '<h3>' + ic('shield') + '중복 위험</h3>'
            + '<p class="wi-verdict">' + md(o.verdict[1]) + '</p>'
            + (chips ? '<div class="wi-chips">' + chips + '</div>' : '')
            + (o.note ? '<p class="wi-dim wi-note">' + esc(o.note) + '</p>' : '')
            + '</section>';
    }

    function slider() {
        const j = WI;
        return '<section class="wi-slider">'
            + '<div class="wi-sl-head"><b>' + esc(j.name) + '</b>'
            + '<span>' + esc(j.symbol) + ' · ' + Number(j.price).toLocaleString()
            + (nz(j.mfc) ? '' : ' · MFC ' + j.mfc) + '</span>'
            + '<b class="wi-sl-w">' + j.surface[IDX].weight + '%</b></div>'
            + '<input type="range" id="wi-range" min="0" max="' + (j.surface.length - 1)
            + '" step="1" value="' + IDX + '" aria-label="비중">'
            + '<div class="wi-ticks">' + j.steps.map((s, i) =>
                '<button class="wi-tick' + (i === IDX ? ' is-on' : '') + '" data-wi-step="' + i + '">'
                + s + '%</button>').join('') + '</div></section>';
    }

    /* 체크리스트를 확인해야 계획 버튼이 열린다 — 시뮬레이션에서 바로
     * 주문으로 가는 길을 만들지 않는다. */
    function checklist() {
        const items = [
            '이 종목이 기존 보유와 중복되는지 확인했습니다',
            '손절가 도달 시 손실 금액을 감당할 수 있습니다',
            '수수료 손익분기를 넘길 근거가 있습니다',
        ];
        return '<section class="wi-card wi-check"><h3>' + ic('check') + '계획으로 넘어가기 전에</h3>'
            + items.map((t, i) => '<label class="wi-cb"><input type="checkbox" data-wi-cb="' + i + '">'
                + esc(t) + '</label>').join('')
            + '<button id="wi-plan" class="tp-btn tp-btn-primary" disabled>TRADE PLANNER 로 보내기</button>'
            + '<p class="wi-dim">여기에는 주문 버튼이 없습니다. 진입 게이트는 PLANNER 에서 '
            + '다시 판정합니다.</p></section>';
    }

    function draw() {
        const j = WI;
        return slider()
            + panel()
            + overlapCard(j.overlap)
            + checklist()
            + '<footer class="td-foot"><div>갱신 ' + esc(j.generated_at || '—') + '</div>'
            + '<div class="td-src"><span><b>가정</b> ' + esc(j.note || '') + '</span></div>'
            + '<ul class="td-caveats">' + (j.caveats || []).map(c =>
                '<li>' + md(c) + '</li>').join('') + '</ul></footer>';
    }

    function repaint() {
        const host = $('whatif-result');
        if (host && WI) host.innerHTML = draw();
    }

    async function run(symbol) {
        const host = $('whatif-result');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>비중별로 다시 계산하는 중…</div>';
        let j;
        try { j = await api('/api/whatif', { symbol, source: 'virtual', holdings: holdings() }); }
        catch (e) { host.innerHTML = offline(e); return; }
        if (!j.available) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert') + esc(j.message) + '</div>';
            WI = null; return;
        }
        WI = j;
        //  기본 지점은 5% — 0% 는 아무것도 안 바뀌어 화면이 비어 보인다
        IDX = Math.max(0, j.steps.indexOf(5));
        repaint();
    }

    function renderWhatIf() {
        const host = $('whatif-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-question">' + ic('flask')
            + '<div><b>이만큼 담으면 어떻게 되나?</b>'
            + '<span>주문하기 전에 집중도·급락 손실·환율·손익분기를 먼저 봅니다. '
            + '실제 주문은 일어나지 않습니다.</span></div></div>'
            + '<div class="ql-controls"><label>종목<input id="wi-sym" placeholder="예: IONQ" '
            + 'autocomplete="off"></label>'
            + '<button id="wi-run" class="tp-btn tp-btn-primary">시뮬레이션</button></div>'
            + '<div id="whatif-result"></div>';
    }

    /* 위임으로 받는다 — script.js 가 동적 로드라 DOMContentLoaded 는 끝나 있다 */
    document.addEventListener('click', (e) => {
        if (e.target.closest('#wi-run')) {
            const v = (($('wi-sym') || {}).value || '').trim();
            if (v) run(v);
            return;
        }
        const t = e.target.closest('[data-wi-step]');
        if (t && WI) { IDX = Number(t.dataset.wiStep) || 0; repaint(); return; }

        if (e.target.closest('[data-wi-cb]')) {
            const boxes = document.querySelectorAll('[data-wi-cb]');
            const all = Array.from(boxes).every(b => b.checked);
            const btn = $('wi-plan');
            if (btn) btn.disabled = !all;
            return;
        }
        if (e.target.closest('#wi-plan')) {
            //  뷰 전환은 숨은 네비 링크를 대신 클릭한다 (dashboard-nav-guard.md)
            const link = document.querySelector('.global-tab[data-target="view-planner"]');
            if (link) link.click();
        }
    });

    //  슬라이더는 input 이벤트로 — 즉시 반응해야 한다
    document.addEventListener('input', (e) => {
        if (!e.target.closest || !e.target.matches || !e.target.matches('#wi-range')) return;
        if (!WI) return;
        IDX = Number(e.target.value) || 0;
        repaint();
        const r = $('wi-range');
        if (r) { r.value = IDX; r.focus(); }
    });

    global.WhatIf = { renderWhatIf };
})(window);
