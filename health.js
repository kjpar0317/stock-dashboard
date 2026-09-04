/* ============================================================================
 * health.js — PORTFOLIO HEALTH "자산 건강검진"
 * ----------------------------------------------------------------------------
 * 수익률이 아니라 **관리 상태**로 점수를 낸다. 수익률로 매기면 오른 날은
 * 늘 높은 점수가 나오고, 그건 계좌가 잘 관리되고 있다는 뜻이 아니다.
 *
 * 다른 화면과 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/health_api.py`)가 한다.
 *
 * 점수를 누르면 **"왜 이 점수인지"와 "한 단계 개선하는 방법"만** 편다.
 * 지표를 더 늘어놓으면 원본 화면과 중복되고, 이 화면의 목적이 사라진다.
 *
 * 배지는 위험 관리에만 준다 — 수익률 순위·거래량·매수 연속 기록은 없다.
 * **미획득 배지도 조건과 함께** 보여준다. 못 받은 이유를 모르면 슬롯머신이 된다.
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
    const cnt = (v) => nz(v) ? '—' : Number(v).toLocaleString();

    async function api(path, body) {
        const res = await fetch(API + path, body ? {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        } : {});
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
            + '<div class="sg-offline-desc">건강도는 보유·체결 기록을 서버에서 계산합니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + esc(e.message) + '</div>' : '')
            + '</div>';
    }

    /* 큰 점수 하나. 원 게이지 대신 숫자를 크게 — 원 게이지는 각도를 읽어야
     * 하고, 이 화면에서 중요한 건 "무엇을 고칠까"이지 총점이 아니다. */
    function hero(j) {
        const t = j.total;
        return '<section class="hl-hero hl-' + esc(j.grade) + '">'
            + '<div class="hl-hero-score"><b>' + (nz(t) ? '—' : t) + '</b><span>점</span></div>'
            + '<div class="hl-hero-txt">'
            + '<div class="hl-hero-title">내 포트폴리오 건강도</div>'
            + '<div class="hl-hero-sub">' + md(j.note || '') + '</div>'
            + (j.scored_with !== j.n_parts
                ? '<div class="hl-hero-meta">' + j.n_parts + '개 중 ' + j.scored_with
                + '개 항목으로 계산했습니다 (판정 불가 항목은 뺐습니다)</div>' : '')
            + '</div></section>';
    }

    /* 가장 약한 항목 하나만 크게 — "한 단계 개선하는 방법" */
    function nextStep(w) {
        if (!w) return '';
        return '<section class="hl-next">' + ic('trend')
            + '<div><b>지금 가장 약한 것은 ' + esc(w.label) + ' (' + w.score + '점) 입니다.</b>'
            + '<span>' + md(w.next || '') + '</span></div></section>';
    }

    function bar(p) {
        const s = p.score;
        const open = '<details class="hl-row hl-' + esc(p.grade) + '">';
        return open
            + '<summary>'
            + '<span class="hl-row-label">' + esc(p.label) + '</span>'
            + '<span class="hl-track"><i style="width:' + (nz(s) ? 0 : s) + '%"></i></span>'
            + '<b class="hl-row-score">' + (nz(s) ? '—' : s) + '</b>'
            + '<span class="hl-mark">' + (p.grade === 'good' ? '' : p.grade === 'warn' ? '⚠' : p.grade === 'bad' ? '✕' : '?') + '</span>'
            + '</summary>'
            //  펴면 **왜 / 어떻게** 둘만 보여준다. 지표를 더 늘어놓지 않는다.
            + '<div class="hl-row-body">'
            + '<p class="hl-why"><em>왜 이 점수인가</em>' + md(p.why || '') + '</p>'
            + '<p class="hl-how"><em>한 단계 올리려면</em>' + md(p.next || '') + '</p>'
            + (p.goto ? '<button class="hl-goto" data-hl-goto="' + esc(p.goto.view) + '"'
                + (p.goto.tab ? ' data-hl-tab="' + esc(p.goto.tab) + '"' : '') + '>'
                + esc(p.goto.label) + ' 열기 →</button>' : '')
            + '</div></details>';
    }

    function costCard(c) {
        if (!c || !c.available) {
            return '<section class="hl-card"><h3>' + ic('scale') + '비용 · 현금</h3>'
                + '<p class="hl-dim">' + esc((c && c.message) || '기록이 없습니다.') + '</p></section>';
        }
        //  **통화별로 나눠 낸다. 합계는 내지 않는다** — 더할 수 없는 값이다.
        const rows = (c.by_currency || []).map(r =>
            '<tr><td><b>' + esc(r.currency) + '</b></td><td>' + cnt(r.n) + '건</td>'
            + '<td>' + cnt(r.traded) + '</td>'
            + '<td class="hl-fee">' + cnt(Math.round(r.fees_est)) + '</td></tr>').join('');
        return '<section class="hl-card"><h3>' + ic('scale') + '비용 · 현금'
            + '<b class="hl-cash">현금 ' + (nz(c.cash_pct) ? '—' : c.cash_pct + '%') + '</b></h3>'
            + '<p class="hl-dim">' + md(c.why || '') + '</p>'
            + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
            + '<th scope="col">통화</th><th scope="col">체결</th>'
            + '<th scope="col">거래대금</th><th scope="col">수수료(추정)</th>'
            + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
            + '<p class="hl-dim hl-note">' + md(c.note || '') + '</p></section>';
    }

    function badges(bs) {
        if (!bs || !bs.length) return '';
        return '<section class="hl-card"><h3>' + ic('check') + '위험 관리 배지</h3>'
            + '<p class="hl-dim">거래 횟수·수익률에는 배지를 주지 않습니다. '
            + '분산 · 청산 계획 · 기록 습관에만 줍니다.</p>'
            + '<div class="hl-badges">'
            //  미획득도 조건과 함께 낸다 — 못 받은 이유를 모르면 슬롯머신이 된다
            + bs.map(b => '<div class="hl-badge' + (b.got ? ' is-got' : '') + '">'
                + '<span class="hl-badge-mark">' + (b.got ? '✅' : '⬜') + '</span>'
                + '<div><b>' + esc(b.label) + '</b>'
                + '<small>' + esc(b.cond) + (b.now ? ' · ' + esc(b.now) : '') + '</small></div>'
                + '</div>').join('')
            + '</div></section>';
    }

    function draw(j) {
        return hero(j)
            + nextStep(j.weakest)
            + '<div class="hl-rows">' + (j.parts || []).map(bar).join('') + '</div>'
            + costCard(j.cost_cash)
            + badges(j.badges)
            + '<footer class="td-foot"><div>갱신 ' + esc(j.generated_at || '—') + '</div>'
            + '<ul class="td-caveats">'
            + (j.caveats || []).map(c => '<li>' + md(c) + '</li>').join('')
            + '</ul></footer>';
    }

    async function renderHealth() {
        const host = $('health-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>건강검진 중…</div>';
        let j;
        try {
            j = await api('/api/portfolio-health', { source: 'virtual', holdings: holdings() });
        } catch (e) { host.innerHTML = offline(e); return; }
        if (!j.available) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert') + esc(j.message) + '</div>';
            return;
        }
        host.innerHTML = draw(j);
    }

    /* 위임으로 받는다 — script.js 가 동적 로드라 DOMContentLoaded 는 끝나 있다 */
    document.addEventListener('click', (e) => {
        const g = e.target.closest('[data-hl-goto]');
        if (!g) return;
        //  뷰 전환은 숨은 네비 링크를 대신 클릭한다 (dashboard-nav-guard.md)
        const link = document.querySelector('.global-tab[data-target="' + g.dataset.hlGoto + '"]');
        if (link) link.click();
        const tab = g.dataset.hlTab;
        if (tab) setTimeout(() => {
            const b = document.querySelector('.inv-tab[data-inv-tab="' + tab + '"]');
            if (b) b.click();
        }, 60);
    });

    global.Health = { renderHealth };
})(window);
