/* ============================================================================
 * alerts.js — SMART ALERTS "의미 있는 변화만"
 * ----------------------------------------------------------------------------
 * 알림 하나에 반드시 네 가지:
 *   무엇이 바뀌었나 → 왜 중요한가 → 지금 가능한 행동 → 무시해도 되는 조건
 *
 * **마지막 항목이 핵심이다.** 무시해도 되는 조건이 없으면 모든 알림이
 * 행동을 요구하는 것처럼 읽히고, 그게 알림 피로의 원인이다.
 *
 * 다른 화면과 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/alerts_api.py`)가 한다.
 *
 * ── 알림 0개는 정상 상태다 ───────────────────────────────────────
 * 빈 화면으로 끝내지 않고 "확인이 필요한 변화가 없습니다"를 초록으로
 * 크게 낸다. 알림함이 비어 있으면 사용자는 고장으로 읽는다.
 *
 * ── 스누즈는 그날 하루만 ─────────────────────────────────────────
 * 영구 차단을 만들지 않는다. 영구로 두면 왜 안 뜨는지 알 수 없게 되고,
 * 정작 중요할 때 조용해진다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n, o) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n, o) : '';
    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

    const SNOOZE_KEY = 'alertSnoozed';
    function snoozed() {
        try {
            const raw = JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}');
            return raw.date === new Date().toISOString().slice(0, 10) ? (raw.keys || []) : [];
        } catch (e) { return []; }
    }
    function snooze(key) {
        try {
            const cur = snoozed();
            localStorage.setItem(SNOOZE_KEY, JSON.stringify({
                date: new Date().toISOString().slice(0, 10),
                keys: cur.includes(key) ? cur : cur.concat(key)
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

    /* ── 폴백: data.js 만으로 만드는 알림 ──────────────────────────
     * ALERTS 는 최상단 메뉴다. DASHBOARD·BREAKING·REPORT·DISCOVERY 가
     * 백엔드 없이 도는데 여기만 "서버를 켜세요"로 끝나면 **같은 높이의
     * 메뉴가 서로 다른 규칙으로 동작**해 고장으로 읽힌다.
     *
     * 정적으로 낼 수 있는 규칙만 낸다:
     *   실적 임박 · 거래량 급증 · 리포트 오래됨
     * 나머지(손절선·계획 없는 보유·집중도·방향 전환·모델 충돌·가격 이력)는
     * 보유·예측 대조가 필요하므로 **무엇을 못 봤는지 명시**한다.
     * 조용히 빼면 "알림 없음"으로 읽혀 오히려 위험하다. */
    const SERVER_ONLY = ['손절선 접근', '청산 계획 없는 보유', '포트폴리오 집중도',
        '모델 방향 전환', '모델 의견 충돌', '가격 이력 누락'];

    function fallback() {
        const hist = global.REPORTS_HISTORY || [];
        if (!hist.length) return null;
        const cur = hist[0];
        const items = (cur.holdings || []).concat(cur.watchlist || []);
        const heldSet = new Set((cur.holdings || []).map(x => x.symbol));
        const items4 = [];

        const days = (d) => {
            if (!d || ['N/A', 'None', ''].includes(String(d))) return null;
            const t = new Date(String(d).slice(0, 10));
            if (isNaN(t)) return null;
            return Math.round((t - new Date(new Date().toDateString())) / 86400000);
        };

        //  실적 임박
        const soon = [];
        items.forEach(s => {
            const ed = ((s.reason || {}).fundamentals || {}).earnings_date;
            const n = days(ed);
            if (n !== null && n >= 0 && n <= 7) {
                soon.push({ symbol: s.symbol, name: s.name, detail: 'D-' + n + ' (' + String(ed).slice(0, 10) + ')',
                    held: heldSet.has(s.symbol) });
            }
        });
        if (soon.length) {
            soon.sort((a, b) => (b.held - a.held));
            items4.push({
                key: 'earnings', level: 'today', title: '실적발표가 임박한 종목',
                what: soon.length + '종목의 실적발표가 7일 이내입니다.',
                why: '실적 전후에는 갭이 크게 벌어져 손절가가 무의미해질 수 있습니다.',
                action: '발표 전까지는 **보류**가 기본입니다. 들고 갈지 줄일지만 미리 정해두십시오.',
                ignore_if: '장기 보유 중이고 실적 하나로 판단을 바꾸지 않을 종목이라면 해당하지 않습니다.',
                symbols: soon.slice(0, 10), n: soon.length,
                goto: { view: 'view-today', label: 'TODAY' }
            });
        }

        //  거래량 급증
        const surge = [];
        items.forEach(s => {
            const v = ((s.reason || {}).indicators || {}).volume_ratio;
            if (typeof v === 'number' && v >= 2) {
                surge.push({ symbol: s.symbol, name: s.name, detail: '평소의 ' + v.toFixed(1) + '배' });
            }
        });
        if (surge.length) {
            surge.sort((a, b) => parseFloat(b.detail.match(/[\d.]+/)) - parseFloat(a.detail.match(/[\d.]+/)));
            items4.push({
                key: 'volume', level: 'today', title: '거래량이 크게 늘어난 종목',
                what: surge.length + '종목의 거래량이 평소의 2배를 넘었습니다.',
                why: '거래량 급증은 **무언가 일어났다는 사실**만 알려줍니다. 무엇인지는 알려주지 않습니다.',
                action: '뉴스나 공시를 먼저 확인하십시오. 지표보다 사건이 먼저입니다.',
                ignore_if: '**세력·함정으로 해석하지 마십시오.** 이 데이터에는 수급 주체 정보가 없습니다.',
                symbols: surge.slice(0, 10), n: surge.length,
                goto: { view: 'view-dashboard', label: 'REPORT' }
            });
        }

        //  리포트 오래됨
        const age = days(cur.date) === null ? null : -days(cur.date);
        if (age !== null && age > 2) {
            items4.push({
                key: 'stale', level: 'urgent', title: '리포트가 오래됐습니다',
                what: '최신 리포트가 ' + age + '일 전(' + cur.date + ') 것입니다.',
                why: '화면의 모든 판단이 그날 데이터 기준입니다.',
                action: '`./generate_report.sh` 로 파이프라인을 다시 돌리십시오.',
                ignore_if: '장기 휴장 기간이라면 정상입니다.',
                symbols: [], n: 0
            });
        }

        const groups = [];
        ['urgent', 'today', 'weekly'].forEach(lv => {
            const got = items4.filter(a => a.level === lv);
            if (got.length) groups.push({
                level: lv, label: { urgent: '긴급', today: '오늘 확인', weekly: '주간 요약' }[lv],
                n: got.length, items: got
            });
        });

        return {
            available: true, offline: true, date: cur.date,
            groups, total: items4.length, quiet: !items4.length,
            quiet_text: '리포트 기준으로 확인이 필요한 변화가 없습니다.',
            generated_at: cur.generatedAt,
            sources: [{ name: '일별 리포트', detail: 'data.js · ' + cur.date }],
            caveats: ['거래 서버가 꺼져 있어 **' + SERVER_ONLY.length + '종류의 알림은 확인하지 못했습니다** '
                + '(' + SERVER_ONLY.join(' · ') + '). 보유·예측 대조가 필요합니다.']
        };
    }

    function offlineBanner() {
        return '<div class="al-offline-note">' + ic('alert')
            + '<span><b>거래 서버가 꺼져 있습니다.</b> 리포트로 볼 수 있는 알림만 표시했습니다. '
            + '<code>.\\start_trade_server.ps1</code> 로 켜면 '
            + SERVER_ONLY.length + '종류를 더 봅니다.</span></div>';
    }

    function item(a) {
        const chips = (a.symbols || []).slice(0, 12).map(s =>
            '<span class="al-chip"><b>' + esc(s.name || s.symbol) + '</b>'
            + '<small>' + esc(s.detail || '') + '</small></span>').join('');
        return '<article class="al-item al-' + esc(a.level) + '" data-al-key="' + esc(a.key) + '">'
            + '<div class="al-head"><b>' + esc(a.title) + '</b>'
            + (a.n ? '<span class="al-count">' + a.n + '종목</span>' : '')
            + '<button class="al-snooze" data-al-snooze="' + esc(a.key) + '" '
            + 'title="오늘 하루만 숨깁니다">오늘 그만</button></div>'

            //  네 항목을 **항상 같은 순서로**. 하나라도 빠지면 안 된다.
            + '<dl class="al-four">'
            + '<dt>무엇이 바뀌었나</dt><dd>' + md(a.what) + '</dd>'
            + '<dt>왜 중요한가</dt><dd>' + md(a.why) + '</dd>'
            + '<dt>지금 가능한 행동</dt><dd>' + md(a.action) + '</dd>'
            + '<dt class="al-ignore-t">무시해도 되는 조건</dt>'
            + '<dd class="al-ignore">' + md(a.ignore_if) + '</dd>'
            + '</dl>'
            + (chips ? '<div class="al-chips">' + chips
                + ((a.symbols || []).length > 12
                    ? '<span class="al-chip is-more">외 ' + ((a.symbols).length - 12) + '개</span>' : '')
                + '</div>' : '')
            + (a.goto ? '<button class="al-goto" data-al-goto="' + esc(a.goto.view) + '">'
                + esc(a.goto.label) + ' 열기 →</button>' : '')
            + '</article>';
    }

    function draw(j) {
        const mute = snoozed();
        const groups = (j.groups || [])
            .map(g => ({ ...g, items: g.items.filter(a => !mute.includes(a.key)) }))
            .filter(g => g.items.length);
        const total = groups.reduce((s, g) => s + g.items.length, 0);

        //  **알림 0개는 정상 상태다.** 초록으로 크게 낸다.
        const head = total
            ? '<div class="al-summary">' + ic('alert') + '<span>확인할 알림 <b>' + total + '건</b>입니다. '
            + '모든 제안은 <b>관찰 · 계획 · 확인</b>이며 매매 지시가 아닙니다.</span></div>'
            : '<div class="al-summary is-quiet">' + ic('check') + '<span>'
            + esc(j.quiet_text || '확인이 필요한 변화가 없습니다.') + '</span></div>';

        return (j.offline ? offlineBanner() : '')
            + head
            + groups.map(g => '<section class="al-group">'
                + '<h3 class="al-gh al-gh-' + esc(g.level) + '">' + esc(g.label)
                + '<span>' + g.items.length + '</span></h3>'
                + g.items.map(item).join('') + '</section>').join('')
            + (mute.length ? '<p class="td-dim td-more">오늘 숨긴 알림 ' + mute.length + '건이 있습니다. '
                + '<button class="al-unsnooze" data-al-unsnooze="1">다시 보기</button></p>' : '')
            + '<footer class="td-foot"><div>갱신 ' + esc(j.generated_at || '—')
            + (j.date ? ' · 리포트 ' + esc(j.date) : '') + '</div>'
            + '<div class="td-src">' + (j.sources || []).map(s =>
                '<span><b>' + esc(s.name) + '</b> ' + esc(s.detail) + '</span>').join('') + '</div>'
            + '<ul class="td-caveats">' + (j.caveats || []).map(c =>
                '<li>' + md(c) + '</li>').join('') + '</ul></footer>';
    }

    async function renderAlerts() {
        const host = $('alerts-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>변화를 대조하는 중…</div>';
        let j = null;
        try {
            j = await api('/api/alerts', { source: 'virtual', holdings: holdings() });
            if (!j || !j.available) j = null;
        } catch (e) { j = null; }
        //  서버가 없으면 data.js 로 만든다. 최상단 메뉴가 빈 화면이면 안 된다.
        if (!j) j = fallback();
        if (!j) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert')
                + '리포트 데이터가 없습니다. 파이프라인을 한 번 실행하세요.</div>';
            return;
        }
        host._last = j;
        host.innerHTML = draw(j);
    }

    /* 배지용 — TODAY 등 다른 화면에서 건수만 물을 수 있다 */
    async function count() {
        let j = null;
        try {
            j = await api('/api/alerts', { source: 'virtual', holdings: holdings() });
            if (!j || !j.available) j = null;
        } catch (e) { j = null; }
        if (!j) j = fallback();
        if (!j) return null;
        const mute = snoozed();
        return (j.groups || []).reduce((s, g) =>
            s + g.items.filter(a => !mute.includes(a.key)).length, 0);
    }

    /* 위임으로 받는다 — script.js 가 동적 로드라 DOMContentLoaded 는 끝나 있다 */
    document.addEventListener('click', (e) => {
        const s = e.target.closest('[data-al-snooze]');
        if (s) { snooze(s.dataset.alSnooze); redraw(); return; }
        const u = e.target.closest('[data-al-unsnooze]');
        if (u) { try { localStorage.removeItem(SNOOZE_KEY); } catch (err) {} redraw(); return; }
        const g = e.target.closest('[data-al-goto]');
        if (g) {
            //  뷰 전환은 숨은 네비 링크를 대신 클릭한다 (dashboard-nav-guard.md)
            const link = document.querySelector('.global-tab[data-target="' + g.dataset.alGoto + '"]');
            if (link) link.click();
        }
    });

    function redraw() {
        const host = $('alerts-body');
        if (host && host._last) host.innerHTML = draw(host._last);
    }

    global.Alerts = { renderAlerts, count };
})(window);
