/* ============================================================================
 * wrapped.js — MY WRAPPED "내 계좌에 대해 몰랐던 것"
 * ----------------------------------------------------------------------------
 * 25개 화면이 각자 정확한 답을 내지만 사용자는 그 앞에서 어디부터 볼지
 * 모른다. 이 화면은 **이미 계산된 것 중 놀라운 것만** 한 장씩 보여준다.
 *
 * 다른 화면과 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/wrapped_api.py`)가 하고 여기서는 넘기기만 한다.
 * 여기서 다시 계산하면 같은 값이 두 화면에서 달라진다.
 *
 * 넣지 않은 것
 *   - 축하 연출 · 성취 배지 · 연승 카운터. 재미를 매매 유도로 쓰지 않는다.
 *   - 자동 재생. 사용자가 읽는 속도는 사용자가 정한다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n, o) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n, o) : '';
    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /* **굵게** 만 허용한다. 백엔드 문구가 마크다운 강조를 쓴다. */
    const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

    let STATE = { cards: [], skipped: [], idx: 0, note: '', caveats: [] };

    async function api(path, body) {
        const res = await fetch(API + path, body ? {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        } : {});
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    function offline(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">이 화면은 보유·체결 기록을 서버에서 계산합니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + esc(e.message) + '</div>' : '')
            + '</div>';
    }

    /* 보유는 investor.js 와 **같은 방식**으로 모은다.
     * 평단·현재가 필드명이 경로마다 다르므로 하나만 보면 조용히 0 이 된다
     * (investor-screens-guard.md). 그쪽 헬퍼가 있으면 그대로 빌려 쓴다. */
    function holdings() {
        if (global.Investor && typeof global.Investor.clientHoldings === 'function') {
            try { return global.Investor.clientHoldings(); } catch (e) { /* 아래로 */ }
        }
        return null;   // null 이면 서버가 자기 DB 를 쓴다. []를 보내면 "보유 없음"이 된다.
    }

    /* ── 카드 한 장 ─────────────────────────────────────────────── */
    function bar(cmp, tone) {
        if (!cmp || !cmp.a || !cmp.b) return '';
        const a = Number(cmp.a.value), b = Number(cmp.b.value);
        const max = Math.max(Math.abs(a), Math.abs(b)) || 1;
        const row = (o, cls) => '<div class="wr-bar-row">'
            + '<span class="wr-bar-label">' + esc(o.label) + '</span>'
            + '<span class="wr-bar-track"><i class="' + cls + '" style="width:'
            + (Math.abs(Number(o.value)) / max * 100).toFixed(1) + '%"></i></span>'
            + '<b class="wr-bar-val">' + esc(o.value) + '</b></div>';
        return '<div class="wr-bars">' + row(cmp.a, 'is-a') + row(cmp.b, 'is-b ' + (tone || '')) + '</div>';
    }

    function cardHtml(c, i, n) {
        return '<article class="wr-card wr-' + esc(c.tone || 'flat') + '" data-wr-card="' + i + '">'
            + '<div class="wr-step">' + (i + 1) + ' / ' + n + '</div>'
            + '<div class="wr-eyebrow">' + md(c.eyebrow) + '</div>'
            + '<div class="wr-hero"><span class="wr-value">' + esc(c.value) + '</span>'
            + (c.unit ? '<span class="wr-unit">' + esc(c.unit) + '</span>' : '') + '</div>'
            + '<div class="wr-headline">' + md(c.headline) + '</div>'
            + bar(c.compare, c.tone)
            + (c.detail ? '<p class="wr-detail">' + md(c.detail) + '</p>' : '')
            + (c.goto ? '<button class="wr-goto" data-wr-goto="' + esc(c.goto.view) + '"'
                + (c.goto.tab ? ' data-wr-tab="' + esc(c.goto.tab) + '"' : '') + '>'
                + esc(c.goto.label) + ' →</button>' : '')
            + '</article>';
    }

    function render() {
        const host = $('wrapped-body');
        if (!host) return;
        const { cards, skipped } = STATE;

        if (!cards.length) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert')
                + '카드를 만들 표본이 아직 없습니다. 체결 기록과 보유가 쌓이면 채워집니다.</div>'
                + skippedHtml(skipped);
            return;
        }

        const i = Math.max(0, Math.min(STATE.idx, cards.length - 1));
        STATE.idx = i;

        host.innerHTML =
            '<div class="wr-progress">'
            + cards.map((c, k) => '<button class="wr-dot' + (k === i ? ' is-on' : '')
                + '" data-wr-jump="' + k + '" aria-label="' + (k + 1) + '번째 카드"></button>').join('')
            + '</div>'
            + '<div class="wr-stage">'
            + '<button class="wr-nav is-prev" data-wr-move="-1" aria-label="이전"'
            + (i === 0 ? ' disabled' : '') + '>‹</button>'
            + cardHtml(cards[i], i, cards.length)
            + '<button class="wr-nav is-next" data-wr-move="1" aria-label="다음"'
            + (i === cards.length - 1 ? ' disabled' : '') + '>›</button>'
            + '</div>'
            + skippedHtml(skipped)
            + (STATE.note ? '<p class="ql-note">' + md(STATE.note) + '</p>' : '')
            + (STATE.caveats.length ? '<ul class="ql-caveats">'
                + STATE.caveats.map(c => '<li>' + md(c) + '</li>').join('') + '</ul>' : '');
    }

    /* 못 만든 카드를 숨기지 않는다 — 숨기면 "계산이 안 됐나"로 읽힌다. */
    function skippedHtml(sk) {
        if (!sk || !sk.length) return '';
        return '<details class="wr-skipped"><summary>'
            + '아직 못 만든 카드 ' + sk.length + '장 — 이유 보기</summary><ul>'
            + sk.map(s => '<li><b>' + esc(s.title) + '</b> · ' + md(s.reason || '표본 부족')
                + '</li>').join('')
            + '</ul></details>';
    }

    function move(d) {
        STATE.idx = Math.max(0, Math.min(STATE.idx + d, STATE.cards.length - 1));
        render();
    }

    async function renderWrapped() {
        const host = $('wrapped-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>내 계좌를 읽는 중…</div>';
        try {
            const j = await api('/api/wrapped', { source: 'virtual', holdings: holdings() });
            STATE = {
                cards: j.cards || [], skipped: j.skipped || [], idx: 0,
                note: j.note || '', caveats: j.caveats || []
            };
            render();
        } catch (e) {
            host.innerHTML = offline(e);
        }
    }

    /* ── 위임으로 받는다 ────────────────────────────────────────────
     * script.js 가 동적으로 로드되므로 DOMContentLoaded 는 이미 끝나 있다.
     * 거기 리스너를 걸면 영영 안 걸린다 (dashboard-nav-guard.md). */
    document.addEventListener('click', (e) => {
        const jump = e.target.closest('[data-wr-jump]');
        if (jump) { STATE.idx = Number(jump.dataset.wrJump) || 0; render(); return; }

        const mv = e.target.closest('[data-wr-move]');
        if (mv) { move(Number(mv.dataset.wrMove) || 0); return; }

        const go = e.target.closest('[data-wr-goto]');
        if (go) {
            //  뷰 전환은 숨은 네비 링크를 대신 클릭한다 — 렌더러 호출·권한
            //  게이팅·헤더 동기화가 거기 묶여 있다 (dashboard-nav-guard.md).
            const link = document.querySelector('.global-tab[data-target="' + go.dataset.wrGoto + '"]');
            if (link) link.click();
            const tab = go.dataset.wrTab;
            if (tab) setTimeout(() => {
                const b = document.querySelector('.inv-tab[data-inv-tab="' + tab + '"]');
                if (b) b.click();
            }, 60);
        }
    });

    document.addEventListener('keydown', (e) => {
        const view = document.getElementById('view-wrapped');
        if (!view || !view.classList.contains('active') || !STATE.cards.length) return;
        if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
        if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
    });

    global.Wrapped = { renderWrapped };
})(window);
