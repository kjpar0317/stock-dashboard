/* ============================================================================
 * stories.js — SIGNAL STORIES "예측을 이야기로"
 * ----------------------------------------------------------------------------
 * 카드 한 장에 담는 것:
 *   결론 · 무엇이 바뀌었나 · 반대 근거 · 모델 신뢰도(실측 적중률과 함께)
 *   · 과거 유사 신호 · 무효화 조건 · 출처와 갱신 시각
 *
 * 다른 화면과 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/stories_api.py`)가 한다.
 *
 * ── 넘기기가 주문으로 이어지지 않는다 ────────────────────────────
 * 카드를 좌우로 넘기되 **스와이프 끝에 주문 버튼을 두지 않는다.**
 * 넘기다가 손가락이 미끄러져 주문이 나가는 구조를 만들지 않는다.
 * 카드에서 나가는 길은 "이유 보기(REPORT)"와 "계획 만들기(PLANNER)"뿐이다.
 *
 * ── "AI 가 추천했습니다" 라고 쓰지 않는다 ────────────────────────
 * 컨센서스를 신뢰도 근거로 팔지 않는다. 방향 일치/불일치의 **실측
 * 적중률**을 화면 맨 위에 항상 싣는다 (prediction-system-guard.md).
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
    const pct = (v, d = 2) => nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';

    let ST = { cards: [], idx: 0, meta: null };

    async function api(path) {
        const res = await fetch(API + path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    function offline(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">카드는 예측 감사 기록을 서버에서 계산합니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + esc(e.message) + '</div>' : '')
            + '</div>';
    }

    function card(c, i, n) {
        const up = c.direction === 'UP';
        const p = c.prediction || {};
        const tr = c.track_record;
        const iv = c.invalidation;

        const changed = (c.changed || []).map(x =>
            '<li><span class="st-axis">' + esc(x.axis) + '</span>'
            + '<b class="' + (x.delta > 0 ? 'pos' : 'neg') + '">' + (x.delta > 0 ? '+' : '') + x.delta + '</b>'
            + '<small>' + x.from + ' → ' + x.to + '</small></li>').join('');

        const counter = (c.counter || []).length
            ? '<ul class="st-counter">' + c.counter.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'
            //  반대 근거가 없으면 **없다고 쓴다.** 빈칸으로 두면 광고가 된다.
            : '<p class="st-counter-none">' + esc(c.counter_note || '') + '</p>';

        return '<article class="st-card" data-st-card="' + i + '">'
            + '<div class="st-step">' + (i + 1) + ' / ' + n + '</div>'
            + '<div class="st-dir st-' + (up ? 'up' : 'down') + '">'
            + (up ? '상승 쪽' : '하락 쪽') + ' 근거'
            + '<small>' + esc(c.direction_source === '모델' ? '모델 예측 기준' : '지표 기준') + '</small></div>'

            + '<p class="st-head">' + md(c.headline) + '</p>'

            + '<section class="st-sec"><h4>무엇이 바뀌었나</h4>'
            + (changed ? '<ul class="st-changed">' + changed + '</ul>'
                : '<p class="st-dim">어제 대비 8점 이상 움직인 축이 없습니다.</p>') + '</section>'

            //  반대 근거를 **결론 바로 다음**에 둔다. 아래로 밀면 안 읽힌다.
            + '<section class="st-sec st-sec-counter"><h4>반대 근거</h4>' + counter + '</section>'

            + '<section class="st-sec"><h4>모델 신뢰도</h4>'
            + (p.confidence != null
                ? '<div class="st-conf"><b>' + Number(p.confidence).toFixed(2) + '</b>'
                + '<span>구간 ' + esc(p.bin || '—') + (p.difficulty ? ' · 난이도 ' + esc(p.difficulty) : '') + '</span></div>'
                : '<p class="st-dim">이 종목의 예측 기록이 없습니다.</p>')
            + (tr ? '<p class="st-track' + (tr.thin ? ' is-thin' : '') + '">' + md(tr.text) + '</p>' : '')
            + (p.garch != null && p.stack != null
                ? '<p class="st-models">GARCH <b class="' + (p.garch > 0 ? 'pos' : 'neg') + '">' + pct(p.garch) + '</b>'
                + ' · Stack <b class="' + (p.stack > 0 ? 'pos' : 'neg') + '">' + pct(p.stack) + '</b>'
                + ' · ' + (p.agree ? '같은 방향' : '<b>서로 반대</b>') + '</p>' : '')
            + '</section>'

            + (iv ? '<section class="st-sec st-sec-inval"><h4>무효화 조건</h4>'
                + '<p>손절가 <b>' + Number(iv.stop_loss).toLocaleString() + '</b>'
                + (nz(iv.gap_pct) ? '' : ' <small>(현재가 대비 ' + pct(iv.gap_pct, 1) + ')</small>')
                + (iv.max_days ? ' · 최대 보유 ' + iv.max_days + '일' : '') + '</p>'
                + '<p class="st-dim">여기를 벗어나면 이 이야기는 끝난 것으로 봅니다.</p></section>' : '')

            //  나가는 길은 둘뿐 — 주문 버튼을 두지 않는다
            + '<div class="st-actions">'
            + '<button class="st-act is-primary" data-st-act="why" data-sym="' + esc(c.symbol) + '">이유 보기</button>'
            + '<button class="st-act" data-st-act="plan" data-sym="' + esc(c.symbol) + '">계획 만들기</button>'
            + '</div></article>';
    }

    function render() {
        const host = $('stories-body');
        if (!host) return;
        const { cards, meta } = ST;
        if (!cards.length) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert') + '카드가 없습니다.</div>';
            return;
        }
        const i = Math.max(0, Math.min(ST.idx, cards.length - 1));
        ST.idx = i;

        host.innerHTML =
            //  컨센서스를 신뢰도로 팔지 않기 위한 실측 — **맨 위에 항상**
            (meta && meta.agreement_note
                ? '<div class="ql-warn st-agree">' + ic('alert') + '<span>' + md(meta.agreement_note) + '</span></div>' : '')
            + '<div class="st-progress">'
            + cards.map((c, k) => '<button class="st-dot' + (k === i ? ' is-on' : '')
                + '" data-st-jump="' + k + '" aria-label="' + (k + 1) + '번째"></button>').join('')
            + '</div>'
            + '<div class="st-stage">'
            + '<button class="wr-nav is-prev" data-st-move="-1" aria-label="이전"' + (i === 0 ? ' disabled' : '') + '>‹</button>'
            + card(cards[i], i, cards.length)
            + '<button class="wr-nav is-next" data-st-move="1" aria-label="다음"' + (i === cards.length - 1 ? ' disabled' : '') + '>›</button>'
            + '</div>'
            + '<footer class="td-foot"><div>갱신 ' + esc((meta && meta.generated_at) || '—')
            + (meta && meta.date ? ' · 리포트 ' + esc(meta.date) : '') + '</div>'
            + '<div class="td-src">' + ((meta && meta.sources) || []).map(s =>
                '<span><b>' + esc(s.name) + '</b> ' + esc(s.detail) + '</span>').join('') + '</div>'
            + '<ul class="td-caveats">' + ((meta && meta.caveats) || []).map(c =>
                '<li>' + md(c) + '</li>').join('') + '</ul></footer>';
    }

    function move(d) {
        ST.idx = Math.max(0, Math.min(ST.idx + d, ST.cards.length - 1));
        render();
    }

    async function renderStories() {
        const host = $('stories-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>예측을 이야기로 바꾸는 중…</div>';
        let j;
        try { j = await api('/api/stories?limit=12'); }
        catch (e) { host.innerHTML = offline(e); return; }
        if (!j.available) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert') + esc(j.message) + '</div>';
            return;
        }
        ST = { cards: j.cards || [], idx: 0, meta: j };
        render();
    }

    /* 위임으로 받는다 — script.js 가 동적 로드라 DOMContentLoaded 는 끝나 있다 */
    document.addEventListener('click', (e) => {
        const j = e.target.closest('[data-st-jump]');
        if (j) { ST.idx = Number(j.dataset.stJump) || 0; render(); return; }
        const m = e.target.closest('[data-st-move]');
        if (m) { move(Number(m.dataset.stMove) || 0); return; }

        const a = e.target.closest('[data-st-act]');
        if (!a) return;
        //  뷰 전환은 숨은 네비 링크를 대신 클릭한다 (dashboard-nav-guard.md)
        const go = (t) => {
            const link = document.querySelector('.global-tab[data-target="' + t + '"]');
            if (link) link.click();
        };
        if (a.dataset.stAct === 'why') {
            go('view-dashboard');
            setTimeout(() => {
                const el = document.querySelector('[data-symbol="' + a.dataset.sym + '"]');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        } else if (a.dataset.stAct === 'plan') {
            go('view-planner');
        }
    });

    document.addEventListener('keydown', (e) => {
        const v = document.getElementById('view-stories');
        if (!v || !v.classList.contains('active') || !ST.cards.length) return;
        if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
        if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
    });

    global.Stories = { renderStories };
})(window);
