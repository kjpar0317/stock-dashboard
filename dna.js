/* ============================================================================
 * dna.js — DNA 분석
 *   "지금 이 차트, 역사상 누구와 닮았나"
 * ----------------------------------------------------------------------------
 * 최근 N일 경로를 정규화해 5년 전체 · 전 종목의 같은 길이 구간과 맞춰 보고,
 * 닮은 구간 **다음에 무슨 일이 있었는지**를 보여준다.
 *
 * 재미있게 보되 **예측으로 팔지 않는다.** 실측(48,953구간)에서 매칭군의
 * 이후 10일은 기준선 대비 +0.22%p 였고, 윈도우가 겹쳐 t 가 부풀려져 있다.
 * 그리고 닮은 구간이 **같은 시기에 몰리면** 표본이 아니라 한 사건이다 —
 * 백엔드가 그걸 감지해 경고를 보내고, 이 화면은 그걸 크게 싣는다.
 *
 * 계산은 전부 백엔드(`scripts/trade/cluster_api.py: chart_dna`)가 한다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = () => (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n) : '';
    const nz = (v) => (v === null || v === undefined || isNaN(v));
    const pct = (v, d = 1) => nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';
    const sgn = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat');
    const cnt = (v) => nz(v) ? '—' : Number(v).toLocaleString();
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
        (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

    /* ── 스파크라인 — 현재와 닮은 구간을 겹쳐 그린다 ─────────────────────
     * 라이브러리를 붙이지 않는다. 경로가 20~60개 점이라 SVG 로 충분하고,
     * 겹쳐 그리는 게 이 화면의 전부다. */
    function spark(paths, w, h) {
        const all = paths.flatMap(p => p.data).filter(Number.isFinite);
        if (!all.length) return '';
        const lo = Math.min(...all), hi = Math.max(...all);
        const span = (hi - lo) || 1;
        const line = (d, cls, dash) => {
            const n = d.length;
            const pts = d.map((v, i) =>
                `${(i / Math.max(1, n - 1) * w).toFixed(1)},${(h - (v - lo) / span * h).toFixed(1)}`);
            return `<polyline class="dna-line ${cls}" points="${pts.join(' ')}"`
                + (dash ? ` stroke-dasharray="${dash}"` : '') + ' />';
        };
        const zeroY = (h - (0 - lo) / span * h).toFixed(1);
        return `<svg class="dna-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"`
            + ' role="img" aria-label="현재 경로와 닮은 과거 경로 비교">'
            + `<line class="dna-zero" x1="0" y1="${zeroY}" x2="${w}" y2="${zeroY}" />`
            + paths.map(p => line(p.data, p.cls, p.dash)).join('')
            + '</svg>';
    }

    /* ── 모달 ────────────────────────────────────────────────────────────── */
    function ensureModal() {
        let el = $('dna-modal');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'dna-modal';
        el.className = 'dna-modal';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-labelledby', 'dna-modal-title');
        el.innerHTML =
            '<div class="dna-backdrop" data-dna-close></div>'
            + '<div class="dna-panel">'
            +   '<header class="dna-head">'
            +     '<h2 id="dna-modal-title">DNA 분석</h2>'
            +     '<div class="dna-head-ctl">'
            +       '<label>기간<select id="dna-window">'
            +         '<option value="10">10일</option>'
            +         '<option value="20" selected>20일</option>'
            +         '<option value="40">40일</option>'
            +         '<option value="60">60일</option></select></label>'
            +       '<label>이후<select id="dna-horizon">'
            +         '<option value="5">5일</option>'
            +         '<option value="10" selected>10일</option>'
            +         '<option value="20">20일</option></select></label>'
            +       '<button type="button" class="dna-x" data-dna-close '
            +         'aria-label="닫기">&times;</button>'
            +     '</div>'
            +   '</header>'
            +   '<div class="dna-body" id="dna-body"></div>'
            + '</div>';
        document.body.appendChild(el);
        return el;
    }

    let _sym = null, _lastFocus = null;

    function close() {
        const el = $('dna-modal');
        if (!el) return;
        el.classList.remove('open');
        document.body.classList.remove('dna-locked');
        if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
    }

    function open(symbol) {
        const sym = String(symbol || '').trim().toUpperCase();
        if (!sym) return;
        _sym = sym;
        _lastFocus = document.activeElement;
        const el = ensureModal();
        el.classList.add('open');
        document.body.classList.add('dna-locked');
        $('dna-modal-title').textContent = `DNA 분석 — ${sym}`;
        const x = el.querySelector('.dna-x');
        if (x) x.focus();
        run();
    }

    async function run() {
        const host = $('dna-body');
        if (!host || !_sym) return;
        const w = ($('dna-window') || {}).value || 20;
        const hz = ($('dna-horizon') || {}).value || 10;
        host.innerHTML = '<div class="dna-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>'
            + `역사 속 구간을 훑는 중… (첫 실행은 몇 초 걸립니다)</div>`;
        let j;
        try {
            const res = await fetch(`${API()}/api/lab/dna?symbol=${encodeURIComponent(_sym)}`
                + `&window=${w}&horizon=${hz}&k=6`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            j = await res.json();
        } catch (e) {
            host.innerHTML = '<div class="dna-empty">' + ic('alert')
                + '<b>거래 서버가 꺼져 있습니다</b>'
                + '<span>이 분석은 5년치 가격을 서버에서 훑습니다.<br>'
                + '<code>.\\start_trade_server.ps1</code> 로 켠 뒤 다시 시도하세요.</span>'
                + '</div>';
            return;
        }
        if (!j.available) {
            host.innerHTML = '<div class="dna-empty">' + ic('alert')
                + '<b>분석할 수 없습니다</b><span>' + esc(j.message || '') + '</span></div>';
            return;
        }
        host.innerHTML = view(j);
    }

    function view(j) {
        const o = j.outcome, c = j.current, ev = j.evidence;

        /* 겹친 경로 — 현재는 굵게, 닮은 것들은 얇게 */
        const overlay = spark(
            [{ data: c.path, cls: 'cur' }].concat(
                j.matches.map(m => ({ data: m.path, cls: 'ref', dash: '3 3' }))),
            320, 84);

        const hero = '<div class="dna-hero">'
            + '<div class="dna-hero-chart">' + overlay
            +   `<span class="dna-hero-cap">최근 ${j.window}일 · ${c.start} ~ ${c.end} `
            +   `<b class="${sgn(c.change_pct)}">${pct(c.change_pct)}</b></span>`
            + '</div>'
            + '<div class="dna-hero-stat">'
            +   `<span class="dna-stat-label">닮은 구간 ${o.n}개의 이후 ${j.horizon}일</span>`
            +   `<span class="dna-stat-big ${sgn(o.median)}">${pct(o.median, 2)}</span>`
            +   `<span class="dna-stat-sub">${o.up_ratio}%가 올랐습니다 · `
            +     `기준선 <b>${pct(o.baseline_median, 2)}</b> (상승 ${o.baseline_up_ratio}%) · `
            +     `초과 <b class="${sgn(o.excess)}">${pct(o.excess, 2)}</b>p</span>`
            + '</div></div>';

        /* 표본이 한 사건이면 그게 가장 중요한 정보다 — 맨 위에 올린다 */
        const warn = !o.warning ? '' :
            '<div class="dna-warn strong">' + ic('alert') + '<div>'
            + '<b>표본이 하나입니다</b><span>' + o.warning.replace(/\*\*/g, '') + '</span>'
            + '</div></div>';

        const rows = j.matches.map(m => {
            const after = m.after && m.after.length > 2
                ? spark([{ data: m.after, cls: sgn(m.forward_pct) === 'neg' ? 'down' : 'up' }], 84, 26)
                : '';
            return '<li class="dna-row">'
                + `<span class="dna-rank">${m.rank}</span>`
                + '<span class="dna-row-main">'
                +   `<b title="${esc(m.symbol)}">${esc(m.name || m.symbol)}</b>`
                +   `<span class="dna-when">${esc(m.start)} ~ ${esc(m.end)}</span>`
                + '</span>'
                + `<span class="dna-mini">${spark([{ data: m.path, cls: 'ref' }], 84, 26)}</span>`
                + `<span class="dna-mini">${after}</span>`
                + `<b class="dna-fwd ${sgn(m.forward_pct)}">${pct(m.forward_pct)}</b>`
                + `<span class="dna-pctl">상위 ${m.percentile.toFixed(3)}%</span>`
                + '</li>';
        }).join('');

        const list = '<section class="dna-sect">'
            + `<h3>${ic('list')}역사 속에서 가장 닮은 ${o.n}개</h3>`
            + '<div class="dna-legend">'
            +   '<span><i class="dna-sw cur"></i>현재</span>'
            +   '<span><i class="dna-sw ref"></i>닮은 구간</span>'
            +   `<span class="dna-legend-gap">가운데 두 칸: 그때의 ${j.window}일 · 그 뒤 ${j.horizon}일</span>`
            + '</div>'
            + `<ul class="dna-list">${rows}</ul>`
            + `<div class="dna-meta">${ic('flask')}`
            +   `${cnt(j.bank.windows)}개 구간 · ${cnt(j.bank.symbols)}종목 · `
            +   `${esc(j.bank.period.start)} ~ ${esc(j.bank.period.end)} 에서 찾았습니다. `
            +   `서로 다른 시기 <b>${o.distinct_months}개월</b> · `
            +   `최고 ${pct(o.best)} / 최저 ${pct(o.worst)}</div>`
            + '</section>';

        const honest = '<div class="dna-warn">' + ic('alert') + '<div>'
            + '<b>예측이 아닙니다</b><span>' + esc(ev.note) + '</span></div></div>';

        return warn + hero + list + honest;
    }

    /* ── 배선 — 전부 위임 ──────────────────────────────────────────────────
     * script.js 가 동적 로드라 DOMContentLoaded 는 이미 끝나 있다.
     * (dashboard-nav-guard.md 참조) */
    document.addEventListener('click', (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('[data-dna-close]')) { close(); return; }
        //  종목을 직접 준 버튼(리포트 카드 등)과 입력창에서 읽는 버튼(주문 콘솔)
        //  **둘 다** 받는다. 하나만 보면 다른 쪽이 조용히 죽는다.
        const btn = t.closest('[data-dna-symbol],[data-dna-input]');
        if (btn) {
            e.preventDefault();
            const sym = btn.dataset.dnaSymbol
                || (btn.dataset.dnaInput && ($(btn.dataset.dnaInput) || {}).value);
            if (sym) open(sym);
        }
    });
    document.addEventListener('change', (e) => {
        if (e.target && (e.target.id === 'dna-window' || e.target.id === 'dna-horizon')) run();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const el = $('dna-modal');
        if (el && el.classList.contains('open')) close();
    });

    global.DNA = { open, close, run };
})(window);
