/* ============================================================================
 * today.js — TODAY "오늘의 투자 브리핑"
 * ----------------------------------------------------------------------------
 *   오늘의 시장 날씨 → 내 계좌 상태 → 확인할 변화 3개
 *   → 관찰·계획·보류 → 예정된 이벤트
 *
 * 다른 화면과 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/today_api.py`)가 하고 여기서는 보여주기만 한다.
 *
 * ── 서버가 꺼져 있어도 빈 화면이 되면 안 된다 ─────────────────────
 * TODAY 는 **기본 화면**이다. 다른 화면처럼 "거래 서버를 켜세요"로 끝내면
 * 서버 없이 쓰는 사용자에게는 앱이 고장 난 것으로 보인다.
 * `data.js`(정적)만으로 만들 수 있는 것 — 시장 날씨·확인할 종목·이벤트 —
 * 은 폴백으로 그린다. 계좌 상태만 서버를 요구한다.
 *
 * ── 행동 유도를 넣지 않는다 ──────────────────────────────────────
 * FINRA·SEC 가 거래 앱의 배지·연속 출석·알림이 과도한 거래를 유도한다고
 * 경고했다. 그래서 카드 버튼은 다음 넷뿐이다:
 *     이유 보기 · 계획 만들기 · 알림 설정 · 관심 없음
 * **매수 버튼은 없다.** 주문은 PLAN 에서 계획을 거친 뒤에만 한다.
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

    const WEATHER_ICON = { sunny: '☀️', cloudy: '🌥️', storm: '⛈️', unknown: '❓' };

    /* 관심 없음 — 그날 하루만 숨긴다. 영구 차단은 하지 않는다.
     * 영구로 두면 사용자가 왜 안 뜨는지 알 수 없게 된다. */
    const DISMISS_KEY = 'todayDismissed';
    function dismissed() {
        try {
            const raw = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
            const d = new Date().toISOString().slice(0, 10);
            return raw.date === d ? (raw.syms || []) : [];
        } catch (e) { return []; }
    }
    function dismiss(sym) {
        try {
            const d = new Date().toISOString().slice(0, 10);
            const cur = dismissed();
            localStorage.setItem(DISMISS_KEY, JSON.stringify({
                date: d, syms: cur.includes(sym) ? cur : cur.concat(sym)
            }));
        } catch (e) { /* 무시 */ }
    }

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

    /* ── 폴백: data.js 만으로 만드는 브리핑 ────────────────────────
     * 서버가 없을 때도 "오늘 무엇을 볼까"는 답할 수 있어야 한다.
     * 계좌 상태는 서버가 필요하므로 그 카드만 안내로 대체한다. */
    function fallback() {
        const hist = global.REPORTS_HISTORY || [];
        if (!hist.length) return null;
        const cur = hist[0], prev = hist[1];
        const all = (cur.holdings || []).concat(cur.watchlist || []);
        const prevBy = {};
        ((prev && prev.holdings) || []).concat((prev && prev.watchlist) || [])
            .forEach(s => { prevBy[s.symbol] = s; });

        const focus = [];
        all.forEach(s => {
            const p = prevBy[s.symbol];
            if (!p || nz(s.mfcScore) || nz(p.mfcScore)) return;
            const d = s.mfcScore - p.mfcScore;
            if (Math.abs(d) < 10) return;
            const up = d > 0;
            focus.push({
                symbol: s.symbol, name: s.name, held: (cur.holdings || []).includes(s),
                weight: Math.abs(d), mfc: s.mfcScore, mfc_prev: p.mfcScore,
                changes: [`MFC 점수가 ${p.mfcScore.toFixed(0)} → ${s.mfcScore.toFixed(0)} 로 ${up ? '올랐' : '내렸'}습니다`],
                headline: `${s.name} — MFC 점수가 ${p.mfcScore.toFixed(0)} → ${s.mfcScore.toFixed(0)} 로 `
                    + `${up ? '올랐' : '내렸'}습니다. 지금은 **${up ? '관찰' : '보류'}**이 적절합니다.`
            });
        });
        focus.sort((a, b) => b.weight - a.weight);

        //  날씨는 strategy.macro 문자열에서 국면만 꺼낸다.
        //  **여기서 VIX 기준을 새로 정하지 않는다** — 백엔드와 어긋난다.
        const macro = (cur.strategy && cur.strategy.macro) || '';
        const bull = /Trending-Bull|Risk-On/.test(macro);
        const bear = /Bear|Risk-Off/.test(macro);
        return {
            available: true, offline: true, date: cur.date,
            weather: bull ? { key: 'sunny', label: '맑음', desc: '리포트 기준 Risk-On 국면입니다.' }
                : bear ? { key: 'storm', label: '폭풍', desc: '리포트 기준 Risk-Off 국면입니다.' }
                    : { key: 'cloudy', label: '흐림', desc: '리포트 기준 중립 국면입니다.' },
            account: null,
            focus: focus.slice(0, 3), focus_more: Math.max(0, focus.length - 3),
            events: [], quiet: !focus.length,
            verdict: focus.length
                ? `오늘 확인할 것이 ${Math.min(3, focus.length)}개 있습니다.`
                : '오늘은 거래하지 않아도 됩니다.',
            generated_at: cur.generatedAt,
            sources: [{ name: '일별 리포트', detail: `data.js · ${cur.date}` }],
            caveats: ['거래 서버가 꺼져 있어 **계좌 상태는 판정하지 않았습니다.**']
        };
    }

    /* ── 그리기 ─────────────────────────────────────────────────── */
    function weatherCard(w) {
        if (!w) return '';
        return '<section class="td-weather td-' + esc(w.key) + '">'
            + '<div class="td-weather-icon" aria-hidden="true">' + (WEATHER_ICON[w.key] || '') + '</div>'
            + '<div><div class="td-weather-label">오늘의 시장 · <b>' + esc(w.label) + '</b></div>'
            + '<div class="td-weather-desc">' + esc(w.desc || '') + '</div>'
            + (w.regime ? '<div class="td-weather-meta">국면 ' + esc(w.regime)
                + (nz(w.vix) ? '' : ' · VIX ' + Number(w.vix).toFixed(1)) + '</div>' : '')
            + '</div></section>';
    }

    function accountCard(a) {
        if (!a) {
            return '<section class="td-card td-acct td-none"><h3>' + ic('shield') + '내 계좌 상태</h3>'
                + '<p class="td-dim">거래 서버가 꺼져 있어 판정하지 않았습니다. '
                + '<code>.\\start_trade_server.ps1</code> 로 켜면 집중도·손실 상태를 봅니다.</p></section>';
        }
        const rows = (a.reasons || []).map(r =>
            '<li class="td-r-' + esc(r[0]) + '">' + md(r[1]) + '</li>').join('');
        const ex = (a.excluded_markets || []).map(m => m.market + ' ' + m.n + '종목').join(' · ');
        return '<section class="td-card td-acct td-' + esc(a.level) + '">'
            + '<h3>' + ic('shield') + '내 계좌 상태 <b class="td-badge">' + esc(a.label) + '</b></h3>'
            + (rows ? '<ul class="td-reasons">' + rows + '</ul>' : '')
            + '<p class="td-dim">' + md(a.desc || '')
            + (a.judged && a.judged !== a.n_names
                ? ` · 총 ${a.n_names}종목 중 ${a.judged}종목으로 판정했습니다`
                + (ex ? ` (통화가 달라 제외: ${esc(ex)})` : '') : '')
            + '</p></section>';
    }

    function focusCard(f, i) {
        const sym = esc(f.symbol);
        return '<article class="td-focus" data-td-sym="' + sym + '">'
            + '<div class="td-focus-rank">' + (i + 1) + '</div>'
            + '<div class="td-focus-body">'
            + '<p class="td-focus-head">' + md(f.headline) + '</p>'
            + (f.changes && f.changes.length > 1
                ? '<ul class="td-focus-more">'
                + f.changes.slice(1).map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' : '')
            + '<div class="td-actions">'
            //  매수 버튼을 두지 않는다. 기본 행동은 "이유 보기"다.
            + '<button class="td-act is-primary" data-td-act="why" data-sym="' + sym + '">이유 보기</button>'
            + '<button class="td-act" data-td-act="plan" data-sym="' + sym + '">계획 만들기</button>'
            + '<button class="td-act" data-td-act="alert" data-sym="' + sym + '">알림함 열기</button>'
            + '<button class="td-act is-ghost" data-td-act="mute" data-sym="' + sym + '">관심 없음</button>'
            + '</div></div>'
            + (f.held ? '<span class="td-held">보유</span>' : '') + '</article>';
    }

    function eventsCard(ev) {
        if (!ev || !ev.length) return '';
        return '<section class="td-card"><h3>' + ic('calendar') + '예정된 이벤트</h3>'
            + '<ul class="td-events">'
            + ev.slice(0, 8).map(e => '<li><span class="td-ev-kind">' + esc(e.label) + '</span>'
                + '<b>' + esc(e.name) + '</b>'
                + (e.held ? '<span class="td-held sm">보유</span>' : '')
                + '<span class="td-ev-when">' + esc(e.date) + ' · D-' + e.in_days + '</span></li>').join('')
            + '</ul></section>';
    }

    function draw(j) {
        const muted = dismissed();
        const focus = (j.focus || []).filter(f => !muted.includes(f.symbol));
        const quiet = !focus.length;

        return weatherCard(j.weather)
            + accountCard(j.account)
            //  확인할 것이 없으면 그게 결론이다 — 억지로 채우지 않는다.
            + '<section class="td-verdict ' + (quiet ? 'is-quiet' : '') + '">'
            + ic(quiet ? 'check' : 'alert')
            + '<span>' + md(quiet
                ? '오늘은 거래하지 않아도 됩니다. 확인이 필요한 변화가 잡히지 않았습니다.'
                : j.verdict) + '</span></section>'
            + (focus.length
                ? '<div class="td-focus-list">' + focus.map(focusCard).join('') + '</div>' : '')
            + (j.focus_more || muted.length
                ? '<p class="td-dim td-more">그 외 ' + ((j.focus_more || 0) + muted.length)
                + '개는 오늘 표시하지 않았습니다.</p>' : '')
            + eventsCard(j.events)
            + '<footer class="td-foot">'
            + '<div>갱신 ' + esc(j.generated_at || '—') + (j.date ? ' · 리포트 ' + esc(j.date) : '') + '</div>'
            + '<div class="td-src">' + (j.sources || []).map(s =>
                '<span><b>' + esc(s.name) + '</b> ' + esc(s.detail) + '</span>').join('') + '</div>'
            + '<ul class="td-caveats">' + (j.caveats || []).map(c => '<li>' + md(c) + '</li>').join('') + '</ul>'
            + '</footer>';
    }

    async function renderToday() {
        const host = $('today-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>오늘의 브리핑을 만드는 중…</div>';
        let j = null;
        try {
            j = await api('/api/today', { source: 'virtual', holdings: holdings() });
            if (!j || !j.available) j = null;
        } catch (e) { j = null; }
        //  서버가 없으면 data.js 로 만든다. 빈 화면으로 끝내지 않는다.
        if (!j) j = fallback();
        if (!j) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert')
                + '리포트 데이터가 없습니다. 파이프라인을 한 번 실행하세요.</div>';
            return;
        }
        host.innerHTML = draw(j);
    }

    /* 위임으로 받는다 — script.js 가 동적 로드라 DOMContentLoaded 는 끝나 있다 */
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-td-act]');
        if (!b) return;
        const sym = b.dataset.sym;
        const act = b.dataset.tdAct;

        if (act === 'mute') { dismiss(sym); renderToday(); return; }

        //  뷰 전환은 숨은 네비 링크를 대신 클릭한다 — 렌더러 호출·권한
        //  게이팅·헤더 동기화가 거기 묶여 있다 (dashboard-nav-guard.md).
        const go = (target) => {
            const link = document.querySelector('.global-tab[data-target="' + target + '"]');
            if (link) link.click();
        };
        if (act === 'why') {
            go('view-dashboard');
            //  REPORT 로 간 뒤 해당 종목으로 스크롤 — 없으면 조용히 지나간다.
            setTimeout(() => {
                const card = document.querySelector('[data-symbol="' + sym + '"]');
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        } else if (act === 'plan') {
            go('view-planner');
        } else if (act === 'alert') {
            //  알림은 **종목별로 켜고 끄지 않는다.** 규칙 기반이라
            //  같은 원인이면 종목이 묶여 나온다 (alerts-guard.md).
            go('view-alerts');
        }
    });

    /* 모바일 하단 4개 — 숨은 네비 링크를 대신 클릭한다.
     * 여기서 직접 뷰를 전환하면 렌더러 호출·권한 게이팅·헤더 동기화가
     * 전부 빠진다 (dashboard-nav-guard.md). */
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mb-target]');
        if (!b) return;
        const link = document.querySelector('.global-tab[data-target="' + b.dataset.mbTarget + '"]');
        if (link) link.click();
    });

    /* 활성 표시는 네비의 active 를 따라간다 — 두 곳에서 각자 상태를 들면
     * 어긋난다. 네비 클릭이 곧 하단 바 갱신이 되게 위임으로 받는다. */
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.global-tab, [data-mb-target]')) return;
        setTimeout(() => {
            const cur = document.querySelector('.global-tab.active');
            const id = cur && cur.getAttribute('data-target');
            document.querySelectorAll('[data-mb-target]').forEach(el =>
                el.classList.toggle('is-on', el.dataset.mbTarget === id));
        }, 0);
    });

    global.Today = { renderToday };
})(window);
