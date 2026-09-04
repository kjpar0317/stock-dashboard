/* ============================================================================
 * quant_lab2.js — QUANT LAB 확장 화면
 *   · SURVIVAL   — 파산 확률 / 몬테카를로 / 손실 해부
 *   · ATTRIBUTION— 성과 귀인 (실제 vs 규칙 반사실)
 *   · REGIME     — 매크로 레짐 조건부 성과
 * ----------------------------------------------------------------------------
 * quant_lab.js 와 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/quant_lab_api.py`)가 검증된 엔진 위에서 하고,
 * 여기서는 읽기 쉽게 보여주는 일만 한다.
 *
 * 이 세 화면이 필요한 이유(실측):
 *   · 승률 14~22% 는 **최대 연패 중앙값 11회 · 95% 20회**를 뜻한다.
 *     규칙이 옳아도 연패에서 그만두면 기대값을 받지 못한다.
 *   · 손절된 거래의 64.8% 가 10일 안에 진입가를 회복했다 — 손절이
 *     정상 되돌림에 걸리고 있다는 신호다.
 *   · 레짐 간 기대값 격차(0.62R)가 전략 간 격차(0.12R)의 5배다.
 *     무엇을 살지보다 **언제 살지**가 크다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n, o) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n, o) : '';

    const nz = (v) => (v === null || v === undefined || isNaN(v));
    const sgn = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat');
    const R = (v, d = 3) => nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + 'R';
    const pct = (v, d = 1) => nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';
    const pctA = (v, d = 1) => nz(v) ? '—' : Number(v).toFixed(d) + '%';
    const num = (v, d = 2) => nz(v) ? '—' : Number(v).toFixed(d);
    const cnt = (v) => nz(v) ? '—' : Number(v).toLocaleString();

    function loading(host, msg) {
        // role="status" 로 진행 상황을 스크린리더에 알린다.
        // 이 화면들은 서버 계산이 수 초 걸려, 알림이 없으면 멈춘 것처럼 느껴진다.
        if (host) host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>' + (msg || '계산 중…') + '</div>';
    }
    function offline(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">이 화면은 5년치 가격 이력과 체결 로그를 '
            + '서버에서 계산합니다.<br>아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + e.message + '</div>' : '')
            + '</div>';
    }
    const empty = (m) => '<div class="ql-empty">' + ic('alert') + (m || '데이터 없음') + '</div>';

    /* ── 시장 선택 ────────────────────────────────────────────────
     * 백엔드(`cluster_api`)는 처음부터 `market` 을 받았는데 화면이 `market=US`
     * 로 못 박혀 있었다. 데이터가 있어도 국내를 볼 방법이 없었다.
     *
     * **국내는 표본이 얇습니다** (49종목 대 616종목). 화면이 그 사실을
     * 함께 말해야 하므로 `thin` 플래그를 받아 배너로 띄운다.
     * 유니버스가 늘면 `CLUSTER_DISTANCE_BY_MARKET` 도 다시 재야 한다
     * (cluster-guard.md). */
    const MKT_KEY = 'ql2Market';
    let MARKET = (() => {
        try { return localStorage.getItem(MKT_KEY) || 'US'; } catch (e) { return 'US'; }
    })();
    const market = () => MARKET;
    function marketSel(onChange) {
        return '<div class="ql-mkt" role="group" aria-label="시장 선택">'
            + ['US', 'KR'].map(m => '<button type="button" class="ql-mkt-btn'
                + (MARKET === m ? ' is-on' : '') + '" data-ql-market="' + m
                + '" data-ql-market-cb="' + onChange + '">'
                + (m === 'US' ? '미국' : '국내') + '</button>').join('')
            + '</div>';
    }
    const thinBanner = (j) => (!j || !j.thin) ? ''
        : '<div class="ql-warn">' + ic('alert') + '<span><b>표본이 얇습니다.</b> '
        + '국내는 가격 이력이 ' + cnt(j.n_symbols) + '종목뿐이라 군집이 잘게 흩어집니다. '
        + '유니버스를 넓히면 달라집니다.</span></div>';

    /* 위임으로 받는다 — 화면을 다시 그려도 다시 걸 필요가 없다 */
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ql-market]');
        if (!b) return;
        const m = b.dataset.qlMarket;
        if (m === MARKET) return;
        MARKET = m;
        try { localStorage.setItem(MKT_KEY, m); } catch (err) { /* 무시 */ }
        const cb = b.dataset.qlMarketCb;
        if (cb === 'div') DIV.render();
        else if (cb === 'nextup') NEXTUP.render();
    });

    async function api(path, body) {
        const res = await fetch(API + path, body ? {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        } : {});
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }
    function question(iconName, title, desc) {
        return '<div class="ql-question">' + ic(iconName)
            + '<div><b>' + title + '</b><span>' + desc + '</span></div></div>';
    }
    function card(title, iconName, body, cls) {
        return '<section class="ql-card ' + (cls || '') + '">'
            + '<h3>' + ic(iconName) + title + '</h3>' + body + '</section>';
    }
    function metric(label, value, cls, hint) {
        return '<div class="ql-metric"><span class="ql-metric-label">' + label + '</span>'
            + '<span class="ql-metric-value ' + (cls || '') + '">' + value + '</span>'
            + (hint ? '<span class="ql-metric-hint">' + hint + '</span>' : '') + '</div>';
    }

    /* 계좌 선택 · 보유 수집 — investor.js 와 같은 형태를 쓴다.
     * 평단/현재가 필드명이 경로마다 달라 넷을 전부 받는다
     * (investor-screens-guard.md 참조). */
    const srcSel = (id) => '<label>계좌<select id="' + id + '">'
        + '<option value="virtual">모의계좌</option><option value="toss">토스증권</option>'
        + '<option value="kis">한국투자증권</option></select></label>';
    const pickNum = (o, keys) => {
        for (const k of keys) {
            const v = parseFloat(o[k]);
            if (Number.isFinite(v) && v > 0) return v;
        }
        return 0;
    };
    function clientHoldings() {
        try {
            const h = (global.brokerAdapter && global.brokerAdapter.getHoldings)
                ? global.brokerAdapter.getHoldings()
                : ((global.REPORTS_HISTORY || [])[0] || {}).holdings;
            if (!h || !h.length) return null;
            const rows = h.map(x => ({
                symbol: x.symbol, name: x.name,
                quantity: pickNum(x, ['quantity', 'qty']),
                avg_price: pickNum(x, ['avgBuyPrice', 'avg_buy_price', 'avgPrice', 'avg_price']),
                price: pickNum(x, ['currentPrice', 'current_price', 'rawPrice', 'price']),
                eval_amount: pickNum(x, ['evalAmount', 'eval_amount'])
            })).filter(x => x.symbol);
            //  쓸 수 있는 행이 없으면 보내지 않는다 — 서버가 DB 를 쓰게 둔다
            return rows.some(x => x.eval_amount > 0
                || (x.quantity > 0 && x.price > 0)) ? rows : null;
        } catch (e) { return null; }
    }

    function verdictBox(v) {
        if (!v) return '';
        return '<div class="ql-vbox ql-' + v[0] + '">' + ic(v[0] === 'ok' ? 'check' : 'alert')
            + '<span>' + v[1] + '</span></div>';
    }
    function strategyOptions(cat, sel) {
        return cat.strategies.map(s =>
            `<option value="${s.key}"${s.key === sel ? ' selected' : ''}>${s.label}` +
            `${s.negative ? ' (기대값 음수)' : ''}</option>`).join('');
    }
    let CAT = null;
    async function cat() { if (!CAT) CAT = await api('/api/lab/catalog'); return CAT; }


    /* ══════════════════════════════════════════════════════════
     *  SURVIVAL — "이 규칙을 끝까지 지킬 수 있는가?"
     * ════════════════════════════════════════════════════════ */
    const SV = {
        async render() {
            const host = $('ql-survival-body');
            if (!host) return;
            loading(host, '전략 목록 불러오는 중…');
            let c;
            try { c = await cat(); } catch (e) { host.innerHTML = offline(e); return; }

            host.innerHTML = question('shield', '이 규칙을 끝까지 지킬 수 있는가?',
                  '측정된 승률은 14~22%입니다. 손익비가 커서 기대값은 양수일 수 있지만, '
                + '<em>연패가 길다</em>는 뜻이기도 합니다. 규칙이 옳아도 도중에 그만두면 '
                + '기대값을 받지 못합니다. 실제 R 분포를 부트스트랩해 <em>견뎌야 할 것</em>을 미리 봅니다.')
                + '<div class="ql-controls">'
                +   '<label>전략<select id="ql-sv-strategy">' + strategyOptions(c, 'swing') + '</select></label>'
                +   '<label>거래당 리스크<span class="tp-field">'
                +     '<input type="number" id="ql-sv-risk" value="1" step="0.25" min="0.25" max="5">'
                +     '<span class="tp-unit">%</span></span></label>'
                +   '<label>연간 거래<select id="ql-sv-trades">'
                +     '<option value="24">24회 (월 2)</option><option value="60" selected>60회 (주 1)</option>'
                +     '<option value="120">120회 (주 2~3)</option><option value="250">250회 (매일)</option>'
                +     '</select></label>'
                +   '<label>기간<select id="ql-sv-horizon">'
                +     '<option value="1" selected>1년</option><option value="3">3년</option>'
                +     '<option value="5">5년</option></select></label>'
                +   '<label>왕복 비용<select id="ql-sv-cost">'
                +     '<option value="0">0bp</option><option value="15" selected>15bp</option>'
                +     '<option value="30">30bp</option></select></label>'
                +   '<button id="ql-sv-run" class="tp-btn tp-btn-primary">시뮬레이션</button>'
                + '</div><div id="ql-sv-result"></div><div id="ql-sv-autopsy"></div>';
            $('ql-sv-run').onclick = () => SV.run();
            SV.run();
        },

        async run() {
            const out = $('ql-sv-result');
            const st = $('ql-sv-strategy').value;
            const costBp = parseFloat($('ql-sv-cost').value);
            loading(out, '4,000개 경로 시뮬레이션 중…');
            $('ql-sv-autopsy').innerHTML = '';
            let j;
            try {
                j = await api('/api/lab/montecarlo', {
                    strategy: st, signal: 'all', years: 4.5, cost_bp: costBp,
                    risk_pct: parseFloat($('ql-sv-risk').value),
                    trades_per_year: parseInt($('ql-sv-trades').value, 10),
                    horizon_years: parseFloat($('ql-sv-horizon').value),
                    max_symbols: 40
                });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = SV.draw(j);
            SV.autopsy(st, costBp);
        },

        /* 스파게티 — 개별 경로를 겹쳐 그린다. 평균선 하나보다
         * "내가 저 아래쪽 경로에 있을 수도 있다"가 훨씬 잘 전달된다. */
        spaghetti(paths) {
            if (!paths || !paths.length) return '';
            const W = 1000, H = 200;
            const all = paths.flat();
            const lo = Math.min(...all, 1), hi = Math.max(...all, 1);
            const y = v => H - ((v - lo) / (hi - lo || 1)) * H;
            const lines = paths.map(p => {
                const pts = p.map((v, i) => (i / (p.length - 1) * W).toFixed(1) + ',' + y(v).toFixed(1));
                const end = p[p.length - 1];
                return `<polyline points="${pts.join(' ')}" fill="none" stroke="${end >= 1 ? '#34d399' : '#ff2a55'}" stroke-width="1" stroke-opacity=".35" vector-effect="non-scaling-stroke"/>`;
            }).join('');
            return '<div class="ql-spag"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">'
                + `<line x1="0" y1="${y(1)}" x2="${W}" y2="${y(1)}" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`
                + lines + '</svg>'
                + '<div class="ql-spag-axis"><span>시작</span>'
                + '<span class="ql-spag-mid">점선 = 원금</span><span>종료</span></div></div>';
        },

        /* 백분위 막대 — 5·25·50·75·95를 한 줄에 눕힌다 */
        fan(obj, unit) {
            const v = obj.values, q = obj.q;
            const lo = Math.min(...v, 0), hi = Math.max(...v, 0);
            const x = t => ((t - lo) / (hi - lo || 1)) * 100;
            return '<div class="ql-fan">'
                + '<div class="ql-fan-track">'
                +   `<i class="ql-fan-box" style="left:${x(v[1])}%;width:${x(v[3]) - x(v[1])}%"></i>`
                +   `<i class="ql-fan-wick" style="left:${x(v[0])}%;width:${x(v[4]) - x(v[0])}%"></i>`
                +   `<i class="ql-fan-med" style="left:${x(v[2])}%"></i>`
                +   (lo < 0 && hi > 0 ? `<i class="ql-fan-zero" style="left:${x(0)}%"></i>` : '')
                + '</div>'
                + '<div class="ql-fan-labels">' + q.map((qq, i) =>
                    `<span style="left:${x(v[i])}%" class="${sgn(v[i])}">${v[i]}${unit}<small>${qq}%</small></span>`
                  ).join('') + '</div></div>';
        },

        draw(j) {
            const p = j.prob;
            /* 판정 — 중앙값이 아니라 **하위 25%**를 기준으로 본다.
             * 사람은 평균 경로가 아니라 나쁜 경로에서 그만둔다. */
            const q25 = j.final.values[1], medDD = j.mdd.median;
            let vc, vt, vd;
            if (j.expectancy_net <= 0) {
                vc = 'ng'; vt = '기대값이 음수입니다';
                vd = `비용 ${j.cost_bp || 15}bp 반영 후 거래당 ${R(j.expectancy_net)} 입니다. `
                   + `표본을 아무리 늘려도 계좌는 줄어듭니다 — 이 조합은 실행하면 안 됩니다.`;
            } else if (p.dd30 >= 20) {
                vc = 'warn'; vt = '견디기 어렵습니다';
                vd = `기대값은 양수지만 ${p.dd30}% 확률로 −30% 낙폭을 겪습니다. `
                   + `거래당 리스크를 ${j.risk_pct}% 아래로 낮추면 완만해집니다.`;
            } else {
                vc = 'ok'; vt = '감내 가능한 범위';
                vd = `−30% 낙폭 확률 ${p.dd30}%, 최대 연패 중앙값 ${j.streak.median}회입니다. `
                   + `연패가 와도 규칙을 유지할 수 있어야 이 기대값을 받습니다.`;
            }

            return '<div class="ql-verdict ql-' + vc + '">'
                +   '<div class="ql-verdict-z">' + j.streak.p95 + '<small>연패</small></div>'
                +   '<div><div class="ql-verdict-title">' + vt + '</div>'
                +   '<div class="ql-verdict-desc">' + vd + '</div></div></div>'

                + '<div class="ql-hero">'
                +   '<div class="ql-hero-main">'
                +     '<span class="ql-hero-label">' + j.horizon_years + '년 후 수익률 — 하위 25%</span>'
                +     '<span class="ql-hero-big ' + sgn(q25) + '">' + pct(q25) + '</span>'
                +     '<span class="ql-hero-sub">4번 중 1번은 이보다 나쁩니다. 중앙값은 '
                +       '<b class="' + sgn(j.final.values[2]) + '">' + pct(j.final.values[2]) + '</b>, '
                +       '상위 5%는 <b class="pos">' + pct(j.final.values[4]) + '</b> 입니다.</span>'
                +   '</div>'
                +   '<div class="ql-hero-side">'
                +     metric('손실로 끝날 확률', pctA(p.loss), p.loss > 50 ? 'neg' : '')
                +     metric('중앙 최대낙폭', pct(medDD, 1), 'neg')
                +     metric('원금 2배 확률', pctA(p.double), 'pos')
                +   '</div>'
                + '</div>'

                + card('경로 40개 — 내가 어디에 있을지는 모른다', 'activity',
                    SV.spaghetti(j.paths)
                    + '<div class="ql-note">같은 규칙, 같은 기대값인데도 경로가 이렇게 갈립니다. '
                    + '초록은 원금 위, 빨강은 아래로 끝난 경로입니다. '
                    + '<b>평균만 보면 이 폭이 안 보입니다.</b></div>')

                + '<div class="ql-grid">'
                +   card('최종 수익률 분포', 'barChart', SV.fan(j.final, '%')
                      + '<div class="ql-note">가운데 상자가 25~75%, 얇은 선이 5~95% 구간입니다.</div>')
                +   card('최대 낙폭 분포', 'trending', SV.fan(j.mdd, '%')
                      + '<div class="ql-note">낙폭은 거의 확실히 겪습니다. 문제는 그때 그만두느냐입니다.</div>')
                + '</div>'

                + card('연패 — 심리적으로 가장 중요한 숫자', 'alert', '<div class="ql-metrics">'
                    + metric('중앙값', j.streak.median + '회')
                    + metric('95% 최악', j.streak.p95 + '회', 'neg')
                    + metric('최악', j.streak.max + '회', 'neg')
                    + metric('실측 승률', pctA(j.win_rate))
                    + '</div>'
                    + '<div class="ql-note">' + ic('shield')
                    + `승률 ${j.win_rate}% 에서 <b>${j.streak.p95}연패는 이상 신호가 아니라 정상 범위</b>입니다. `
                    + '연패를 규칙 실패로 오인해 중단하는 것이 가장 흔한 실패 방식입니다.</div>',
                    'ql-alert-card')

                + card('거래당 R 분포 (실측)', 'flask', SV.hist(j.r_histogram)
                    + '<div class="ql-note">왼쪽 −1R 근처에 몰려 있고 오른쪽 꼬리가 깁니다. '
                    + '<b>수익은 소수의 큰 승리에서 나옵니다.</b> 그 꼬리를 자르면 기대값이 사라집니다. '
                    + `표본 ${cnt(j.sample_n)}건 · 부트스트랩 ${cnt(j.n_paths)}경로 × ${j.trades}거래.</div>`);
        },

        hist(h) {
            if (!h || !h.counts.length) return '';
            const max = Math.max(...h.counts) || 1;
            return '<div class="ql-hist">' + h.counts.map((c, i) => {
                const mid = (h.edges[i] + h.edges[i + 1]) / 2;
                return `<i style="height:${(c / max * 100).toFixed(1)}%" class="${mid >= 0 ? 'pos' : 'neg'}" title="${mid.toFixed(2)}R : ${c}건"></i>`;
            }).join('') + '</div>'
            + `<div class="ql-hist-axis"><span>${h.edges[0]}R</span><span>0</span><span>${h.edges[h.edges.length - 1]}R</span></div>`;
        },

        async autopsy(strategy, costBp) {
            const host = $('ql-sv-autopsy');
            loading(host, '청산 이후 경로 추적 중…');
            let j;
            try {
                j = await api(`/api/lab/autopsy?strategy=${strategy}&signal=all`
                            + `&cost_bp=${costBp}&max_symbols=40`);
            } catch (e) { host.innerHTML = ''; return; }
            if (!j.available) { host.innerHTML = ''; return; }

            const rows = j.rows.map(r => `<tr>
                <td><b>${r.label}</b></td><td>${cnt(r.n)}</td>
                <td class="${sgn(r.avg_r)}">${R(r.avg_r)}</td>
                <td class="${r.recovered_pct >= 55 ? 'neg' : ''}"><b>${pctA(r.recovered_pct)}</b></td>
                <td>${pctA(r.reached_target_pct)}</td>
                <td>${pct(r.avg_fwd_high, 2)}</td></tr>`).join('');

            host.innerHTML = card('손실 해부 — 청산한 뒤 무슨 일이 있었나', 'compass',
                j.verdicts.map(verdictBox).join('')
                + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">청산 사유</th><th scope="col">표본</th><th scope="col">평균 R</th>'
                + `<th scope="col">${j.lookahead}일 내 진입가 회복</th><th scope="col">목표 도달</th><th scope="col">이후 최고</th>`
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('alert')
                + '<b>손절 후 회복률이 높다</b>는 것은 손절이 정상 되돌림에 걸린다는 뜻입니다. '
                + '다만 손절을 넓히면 진짜로 틀렸을 때 손실도 커집니다 — '
                + 'STRATEGY LAB 에서 손절폭을 바꿔 기대값을 직접 확인한 뒤 조정하십시오.</div>');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  ATTRIBUTION — "규칙대로 했으면 얼마였나?"
     * ════════════════════════════════════════════════════════ */
    const AT = {
        async render() {
            const host = $('ql-attribution-body');
            if (!host) return;
            host.innerHTML = question('clipboard', '내 성과는 어디에서 왔는가?',
                  '체결 로그로 왕복 거래를 복원하고, <em>같은 날 같은 종목에 진입해 규칙대로 '
                + '끝까지 들고 갔다면</em> 어땠을지를 나란히 놓습니다. 그 차이가 전략 문제인지 '
                + '실행 문제인지 갈라줍니다.')
                + '<div class="ql-controls">'
                +   '<label>계좌<select id="ql-at-broker">'
                +     '<option value="">전체</option><option value="TOSS">토스증권</option>'
                +     '<option value="KIS">한국투자증권</option></select></label>'
                +   '<label>모드<select id="ql-at-mode">'
                +     '<option value="">전체</option><option value="REAL">실거래</option>'
                +     '<option value="DRY">모의</option></select></label>'
                +   '<button id="ql-at-run" class="tp-btn tp-btn-primary">분석</button>'
                + '</div><div id="ql-at-result"></div>';
            $('ql-at-run').onclick = () => AT.run();
            AT.run();
        },

        async run() {
            const out = $('ql-at-result');
            loading(out, '체결 로그 복원 · 반사실 시뮬레이션 중…');
            const b = $('ql-at-broker').value, m = $('ql-at-mode').value;
            let j;
            try {
                j = await api('/api/lab/attribution?counterfactual=true'
                            + (b ? '&broker=' + b : '') + (m ? '&mode=' + m : ''));
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = AT.draw(j);
        },

        equityChart(eq) {
            if (!eq || eq.length < 2) return '';
            const W = 1000, H = 150;
            const vals = eq.map(d => d.value);
            const lo = Math.min(...vals), hi = Math.max(...vals);
            const pts = eq.map((d, i) =>
                (i / (eq.length - 1) * W).toFixed(1) + ',' +
                (H - ((d.value - lo) / (hi - lo || 1)) * H).toFixed(1));
            const up = vals[vals.length - 1] >= vals[0];
            const col = up ? '#34d399' : '#ff2a55';
            return '<div class="ql-uw"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="ql-uw-svg">'
                + `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.8" vector-effect="non-scaling-stroke"/>`
                + '</svg><div class="ql-uw-axis">'
                + `<span>${eq[0].date}</span><span>${cnt(Math.round(lo))} ~ ${cnt(Math.round(hi))}</span>`
                + `<span>${eq[eq.length - 1].date}</span></div></div>`;
        },

        draw(j) {
            const cur = (j.currencies || []).map(c => `<div class="ql-cur">
                <span class="ql-cur-tag">${c.currency}</span>
                <b class="${sgn(c.pnl)}">${c.pnl >= 0 ? '+' : ''}${cnt(Math.round(c.pnl))}</b>
                <small>${c.n}건 · 승률 ${pctA(c.win_rate)}</small></div>`).join('');

            const strat = (j.by_strategy || []).map(r => `<tr>
                <td><b>${r.strategy}</b></td><td>${r.n}</td>
                <td>${pctA(r.win_rate)}</td>
                <td class="${sgn(r.avg_r)}">${R(r.avg_r, 2)}</td>
                <td class="${sgn(r.cf_r)}">${R(r.cf_r, 2)}</td>
                <td class="${sgn(r.gap)}"><b>${R(r.gap, 2)}</b></td>
                <td>${r.pnl === null ? '<small>통화혼합</small>'
                     : `<span class="${sgn(r.pnl)}">${cnt(Math.round(r.pnl))}</span>`}</td></tr>`).join('');
            const unlabeled = j.n_unlabeled
                ? `<div class="ql-note">${ic('alert')}전략이 기록되지 않은 거래 `
                    + `<b>${cnt(j.n_unlabeled)}건</b>은 전략별 집계에서 뺐습니다. `
                    + 'AUTO 실행에서 선택에 실패한 기록이라 어느 전략이었는지 알 수 없습니다 '
                    + '— 지평으로 추정해 채우지 않았습니다.</div>'
                : '';

            const trade = t => `<tr>
                <td><b>${t.symbol}</b><small>${t.name || ''}</small></td>
                <td>${stratLabel(t.strategy)}</td>
                <td class="${sgn(t.return_pct)}"><b>${pct(t.return_pct, 1)}</b></td>
                <td class="${sgn(t.r)}">${R(t.r, 2)}</td>
                <td class="${sgn(t.cf_r)}">${R(t.cf_r, 2)}</td>
                <td><small>${t.entry_at}</small></td></tr>`;

            const tbl = (title, rows) => '<div class="ql-half"><h4>' + title + '</h4>'
                + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">전략</th><th scope="col">수익률</th><th scope="col">실제 R</th><th scope="col">규칙 R</th><th scope="col">진입</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';

            const gapKnown = j.gap !== null && j.gap !== undefined;
            return ''
            + (j.n_suspect ? '<div class="ql-warn">' + ic('alert')
                + `<b>기록이 깨진 거래 ${j.n_suspect}건을 제외했습니다</b> `
                + `(${(j.suspect_symbols || []).join(', ')}). 매수가·손절가가 다른 종목 값으로 `
                + '기록된 건입니다 — AUTO 전략 전파 버그로 생긴 것이며 이미 수정되었습니다.</div>' : '')

            + '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     '<span class="ql-hero-label">실제 vs 규칙 — 거래당 평균 R</span>'
            +     '<span class="ql-hero-flow">'
            +       '<b class="' + sgn(j.avg_r) + '">' + R(j.avg_r, 2) + '</b><i>vs</i>'
            +       '<b class="' + sgn(j.cf_r) + '">' + R(j.cf_r, 2) + '</b></span>'
            +     '<span class="ql-hero-sub">'
            +       (gapKnown
                      ? `차이 <b class="${sgn(j.gap)}">${R(j.gap, 2)}</b> · 표준오차 ${num(j.gap_se)} · `
                        + `t = ${num(j.gap_t, 1)} · ${j.n_paired}쌍 대응표본`
                      : '반사실과 짝지을 수 있는 거래가 부족합니다.')
            +     '</span>'
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('왕복 거래', cnt(j.n_trips) + '건', '', '주문 ' + cnt(j.n_orders) + '건에서 복원')
            +     metric('승률', pctA(j.win_rate), '', `승 ${j.n_wins} / 패 ${j.n_losses}`)
            +   '</div>'
            + '</div>'

            + verdictBox(j.verdict)

            + (cur ? card('통화별 손익', 'scale', '<div class="ql-cur-grid">' + cur + '</div>'
                + '<div class="ql-note">원화와 달러를 더하지 않습니다. '
                + '규모가 달라 합치면 합계가 무의미해집니다.</div>') : '')

            + (j.equity && j.equity.length > 1
                ? card('계좌 자산 추이', 'trending', AT.equityChart(j.equity)
                    + `<div class="ql-note">계좌 스냅샷 ${j.equity.length}일치입니다. `
                    + '위 R 통계는 개별 거래 기준이고, 이 곡선은 미실현 손익까지 포함한 실제 잔고입니다.</div>')
                : '')

            + card('전략별 — 실제와 규칙의 차이', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">전략</th><th scope="col">표본</th><th scope="col">승률</th><th scope="col">실제 R</th><th scope="col">규칙 R</th>'
                + '<th scope="col">차이</th><th scope="col">손익</th></tr></thead><tbody>' + strat + '</tbody></table></div>'
                + unlabeled
                + '<div class="ql-note">차이가 <b>음수</b>면 규칙보다 못한 것 — 조기 청산이나 '
                + '슬리피지를 의심합니다. <b>양수</b>면 재량이 도움이 됐거나 표본이 유리했던 것입니다. '
                + '표본이 30건 미만인 줄은 참고만 하십시오.</div>')

            + '<div class="ql-grid">'
            +   tbl('수익률 상위', (j.top || []).map(trade).join(''))
            +   tbl('수익률 하위', (j.bottom || []).map(trade).join(''))
            + '</div>';
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  REGIME — "무엇을 살지보다 언제 살지"
     * ════════════════════════════════════════════════════════ */
    const RG = {
        async render() {
            const host = $('ql-regime-body');
            if (!host) return;
            host.innerHTML = question('compass', '언제 사느냐가 무엇을 사느냐보다 중요한가?',
                  'VIX 수준과 지수 추세로 시장을 6개 국면으로 나누고, 각 국면에서 전략별 '
                + '기대값을 실측합니다. 현재 AUTO 선택기는 <em>가격 레짐(ADX·RSI)</em>만 보고 '
                + '매크로를 보지 않습니다 — 이 표가 그 판단 근거입니다.')
                + '<div class="ql-controls">'
                +   '<label>진입 신호<select id="ql-rg-signal">'
                +     '<option value="all" selected>무조건 진입</option>'
                +     '<option value="ma_cross">MA 골든크로스</option>'
                +     '<option value="breakout_20">20일 신고가</option>'
                +     '<option value="pullback_ma20">MA20 되돌림</option></select></label>'
                +   '<label>왕복 비용<select id="ql-rg-cost">'
                +     '<option value="0">0bp</option><option value="15" selected>15bp</option>'
                +     '<option value="30">30bp</option></select></label>'
                +   '<button id="ql-rg-run" class="tp-btn tp-btn-primary">분석</button>'
                + '</div><div id="ql-rg-result"></div>';
            $('ql-rg-run').onclick = () => RG.run();
            RG.run();
        },

        async run() {
            const out = $('ql-rg-result');
            loading(out, '전략 × 국면 조건부 기대값 계산 중…');
            let j;
            try {
                j = await api(`/api/lab/regime?signal=${$('ql-rg-signal').value}`
                            + `&cost_bp=${$('ql-rg-cost').value}&max_symbols=25`);
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = RG.draw(j);
        },

        draw(j) {
            const all = j.rows.flatMap(r => r.cells.map(c => c.expectancy)).filter(v => v !== null);
            const lim = Math.max(...all.map(Math.abs)) || 0.1;
            const cell = c => {
                if (c.expectancy === null)
                    return `<td class="ql-hm2 ql-hm2-na" title="표본 ${c.n}건 — 부족">—</td>`;
                const a = Math.min(1, Math.abs(c.expectancy) / lim) * 0.8;
                const col = c.expectancy >= 0 ? '52,211,153' : '255,42,85';
                return `<td class="ql-hm2${c.thin ? ' thin' : ''}" style="background:rgba(${col},${a.toFixed(2)})"
                    title="${c.regime} · 표본 ${c.n}건${c.thin ? ' (얇음)' : ''}">
                    ${R(c.expectancy, 3)}<small>${cnt(c.n)}</small></td>`;
            };
            const rows = j.rows.map(r => `<tr>
                <td class="ql-hm2-name"><b>${r.label}</b></td>
                <td class="${sgn(r.overall)}">${R(r.overall, 3)}</td>
                ${r.cells.map(cell).join('')}</tr>`).join('');

            const best = (j.best || []).map(b => `<div class="ql-best">
                <span class="ql-best-reg">${b.regime}</span>
                <span class="ql-best-win">${ic('check')}${b.strategy} <b class="pos">${R(b.expectancy, 3)}</b></span>
                <span class="ql-best-lose">${ic('x')}${b.worst} <b class="neg">${R(b.worst_expectancy, 3)}</b></span>
            </div>`).join('');

            const sp = j.spread || {};
            const ratio = (sp.regime && sp.strategy) ? (sp.regime / sp.strategy) : null;

            return ''
            + '<div class="ql-verdict ' + (ratio && ratio >= 2 ? 'ql-warn' : 'ql-ok') + '">'
            +   '<div class="ql-verdict-z">' + (ratio ? '×' + num(ratio, 1) : '—')
            +     '<small>격차비</small></div>'
            +   '<div><div class="ql-verdict-title">'
            +     (ratio && ratio >= 2 ? '국면이 전략보다 중요합니다' : '전략 선택이 유효합니다') + '</div>'
            +   '<div class="ql-verdict-desc">'
            +     `국면에 따른 기대값 격차가 <b>${R(sp.regime, 3)}</b>, `
            +     `전략에 따른 격차가 <b>${R(sp.strategy, 3)}</b> 입니다. `
            +     (ratio && ratio >= 2
                    ? '어떤 전략을 고르든 국면이 나쁘면 손실입니다. 진입 여부를 먼저 정하고 전략은 그다음입니다.'
                    : '국면과 전략이 비슷한 비중으로 작용합니다.')
            +   '</div></div></div>'

            + card('전략 × 시장 국면 — 조건부 기대값', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table ql-hm2-table"><thead><tr>'
                + '<th scope="col">전략</th><th scope="col">전체</th>'
                + j.regimes.map(g => `<th scope="col">${g.replace('·', '<br>')}</th>`).join('')
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                + '<div class="ql-legend">'
                +   '<span><i class="lg-pos"></i>기대값 양수</span>'
                +   '<span><i class="lg-neg"></i>음수</span>'
                +   `<span><i class="lg-thin"></i>표본 ${cnt(j.thin_cell)}건 미만 — 얇음</span>`
                + '</div>'
                + '<div class="ql-note">' + ic('alert')
                + `국면 분류는 <b>VIX 수준</b>(저 &lt;15 / 보통 / 고 ≥25) × <b>SPY 20일선 상하</b>입니다. `
                + `셀의 작은 숫자는 표본 수이고, ${cnt(j.min_cell)}건 미만이면 값을 내지 않습니다. `
                + '<b>고변동 구간은 전체의 12%뿐이고 특정 시기에 몰려 있습니다</b> — '
                + '숫자가 커 보여도 몇 번의 반등에 좌우된 값일 수 있습니다.</div>')

            + (best ? card('국면별 최선 · 최악 전략', 'target', best
                + '<div class="ql-note">이 표는 화면용만이 아닙니다. '
                + '<code>trade_rules.REGIME_QUALITY</code> 가 가격 레짐만 보고 있으므로, '
                + '여기서 나온 값이 AUTO 선택기를 매크로까지 확장하는 근거가 됩니다.</div>') : '');
        }
    };



    /* ══════════════════════════════════════════════════════════
     *  DISCOVERY SCORECARD — "발굴한 종목이 실제로 올랐는가?"
     * ════════════════════════════════════════════════════════ */
    const DS = {
        async render() {
            const host = $('ql-discovery-body');
            if (!host) return;
            host.innerHTML = question('flask', '발굴한 종목이 실제로 올랐는가?',
                  '핵심은 <em>수익률</em>이 아니라 <em>유니버스 대비 초과수익</em>입니다. '
                + '453종목 중 10개를 고르는 화면이라면 무작위로 10개 뽑는 것보다 나아야 '
                + '의미가 있습니다. 시장이 오른 날에는 아무거나 사도 오릅니다.')
                + '<div class="ql-controls">'
                +   '<label>기여도 구간<select id="ql-ds-horizon">'
                +     '<option value="1">T+1</option><option value="3" selected>T+3</option>'
                +     '<option value="5">T+5</option></select></label>'
                +   '<button id="ql-ds-run" class="tp-btn tp-btn-primary">불러오기</button>'
                +   '<button id="ql-ds-refresh" class="tp-btn tp-btn-order">가격 적재 후 갱신</button>'
                + '</div><div id="ql-ds-result"></div>';
            $('ql-ds-run').onclick = () => DS.run();
            $('ql-ds-refresh').onclick = () => DS.refresh();
            DS.run();
        },

        async run() {
            const out = $('ql-ds-result');
            loading(out, '픽 성적 불러오는 중…');
            let j;
            try {
                j = await api(`/api/lab/discovery?horizon=${$('ql-ds-horizon').value}`);
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = DS.draw(j);
        },

        async refresh() {
            const out = $('ql-ds-result');
            loading(out, '신규 픽 종목 가격 적재 중… (수십 초 걸릴 수 있습니다)');
            try {
                const r = await api('/api/lab/discovery/refresh?sync_prices=true', {});
                if (!r.available) { out.innerHTML = empty(r.message); return; }
            } catch (e) { out.innerHTML = offline(e); return; }
            DS.run();
        },

        /* 픽 vs 벤치마크 — 두 막대를 나란히. 초과분이 핵심이라 따로 강조한다. */
        pairBar(label, mean, bench, maxAbs) {
            const w = v => Math.min(100, Math.abs(v) / (maxAbs || 1) * 100);
            return `<div class="ds-pair">
                <span class="ds-pair-label">${label}</span>
                <span class="ds-pair-bars">
                    <i class="ds-bar ds-bar-pick ${sgn(mean)}" style="width:${w(mean)}%"></i>
                    <i class="ds-bar ds-bar-bench" style="width:${w(bench)}%"></i>
                </span>
                <span class="ds-pair-val">
                    <b class="${sgn(mean)}">${pct(mean, 2)}</b>
                    <small>기준 ${pct(bench, 2)}</small>
                </span></div>`;
        },

        draw(j) {
            const o = j.overall || {};
            const t3 = o['T+3'] || {};
            const vals = Object.values(o).filter(v => v && v.n >= 5);
            const maxAbs = Math.max(...vals.flatMap(v => [Math.abs(v.mean), Math.abs(v.bench)]), 1);

            const horizons = Object.entries(o).map(([k, v]) => {
                if (!v || (v.n || 0) < 5)
                    return `<div class="ds-pair ds-pair-empty"><span class="ds-pair-label">${k}</span>
                            <span>표본 부족 (${v ? v.n || 0 : 0}건)</span></div>`;
                return DS.pairBar(k, v.mean, v.bench, maxAbs);
            }).join('');

            const exRows = Object.entries(o).filter(([, v]) => v && v.n >= 5).map(([k, v]) => `<tr>
                <td><b>${k}</b></td><td>${cnt(v.n)}</td>
                <td class="${sgn(v.mean)}">${pct(v.mean, 2)}</td>
                <td>${pct(v.bench, 2)}</td>
                <td class="${sgn(v.excess)}"><b>${pct(v.excess, 2)}</b></td>
                <td>${v.t === null || v.t === undefined ? '—' : num(v.t, 1)}</td>
                <td>${pctA(v.win_rate)}</td>
                <td class="${v.beat_rate >= 50 ? 'pos' : 'neg'}">${pctA(v.beat_rate)}</td></tr>`).join('');

            const cats = (j.by_category || []).filter(c => (c.n || 0) >= 5).map(c => `<tr>
                <td><b>${c.category}</b></td><td>${cnt(c.n)}</td>
                <td class="${sgn(c.mean)}">${pct(c.mean, 2)}</td>
                <td class="${sgn(c.excess)}"><b>${pct(c.excess, 2)}</b></td>
                <td>${pctA(c.beat_rate)}</td></tr>`).join('');

            const ranks = (j.by_rank || []).filter(r => (r.n || 0) >= 5).map(r => `<tr>
                <td><b>${r.band}</b></td><td>${cnt(r.n)}</td>
                <td class="${sgn(r.excess)}"><b>${pct(r.excess, 2)}</b></td>
                <td>${pctA(r.beat_rate)}</td></tr>`).join('');

            const icRows = Object.entries(j.ic || {}).map(([k, v]) => `<tr>
                <td><b>${k}</b></td><td>${cnt(v.n)}</td>
                <td class="${Math.abs(v.ic) < 0.05 ? '' : sgn(v.ic)}">${num(v.ic, 3)}</td>
                <td>${num(v.t, 1)}</td></tr>`).join('');

            const at = j.attribution || {};
            const atRows = (at.rows || []).slice(0, 14).map(r => {
                if (r.corr === null || r.corr === undefined)
                    return `<tr class="ds-dim"><td>${r.component}</td><td>${r.n_nonzero}</td>
                            <td colspan="3"><small>${r.note || '판정 불가'}</small></td></tr>`;
                return `<tr class="${r.significant ? '' : 'ds-dim'}">
                    <td>${r.component}</td><td>${r.n_nonzero}</td>
                    <td class="${r.significant ? sgn(r.corr) : ''}">${num(r.corr, 3)}</td>
                    <td>${num(r.t, 1)}</td>
                    <td>${r.significant ? '<span class="sig-rule-badge sig-good">유의</span>' : ''}</td></tr>`;
            }).join('');

            /* 승률과 "이김"의 괴리를 짚는다.
               실측 T+3: 승률 59.5% 인데 유니버스를 이긴 비율은 42.2% —
               올랐지만 시장보다 덜 올랐다는 뜻이다. 벤치마크 없이 보면
               "60% 성공"으로 읽히는 함정이다. */
            const gapNote = (t3.win_rate !== undefined && t3.beat_rate !== undefined
                             && t3.win_rate - t3.beat_rate >= 10)
                ? `<div class="ql-warn">${ic('alert')}<span><b>승률 ${pctA(t3.win_rate)}, `
                  + `그러나 유니버스를 이긴 비율은 ${pctA(t3.beat_rate)}</b>입니다. `
                  + `올랐지만 시장보다는 덜 올랐다는 뜻입니다 — 벤치마크 없이 승률만 보면 `
                  + `성공으로 착각합니다.</span></div>`
                : '';

            return ''
            + verdictBox(j.verdict)
            + gapNote
            + '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     '<span class="ql-hero-label">T+3 유니버스 대비 초과수익</span>'
            +     `<span class="ql-hero-big ${sgn(t3.excess)}">${pct(t3.excess, 2)}</span>`
            +     `<span class="ql-hero-sub">픽 <b>${pct(t3.mean, 2)}</b> vs 유니버스 `
            +       `<b>${pct(t3.bench, 2)}</b> · 표준오차 ${num(t3.se, 2)} · `
            +       `t = ${t3.t === null || t3.t === undefined ? '—' : num(t3.t, 1)} · ${cnt(t3.n)}건</span>`
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('픽 기록', cnt(j.n_picks) + '건', '', (j.dates || []).length + '일치')
            +     metric('유니버스 이긴 비율', pctA(t3.beat_rate),
                      t3.beat_rate >= 50 ? 'pos' : 'neg', '50% 이상이어야 함')
            +   '</div>'
            + '</div>'

            + card('구간별 성적', 'barChart', horizons
                + '<div class="ds-legend"><span><i class="ds-bar-pick"></i>픽 평균</span>'
                + '<span><i class="ds-bar-bench"></i>유니버스 평균</span></div>'
                + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">구간</th><th scope="col">표본</th><th scope="col">픽</th><th scope="col">유니버스</th><th scope="col">초과</th>'
                + '<th scope="col">t</th><th scope="col">승률</th><th scope="col">이긴 비율</th></tr></thead>'
                + '<tbody>' + exRows + '</tbody></table></div>'
                + '<div class="ql-note">벤치마크는 같은 날 <b>가격 이력이 있는 전체 종목의 평균</b> '
                + '수익률입니다. 같은 날 짝을 지어 비교하므로 시장 전체의 등락은 상쇄됩니다.</div>')

            + '<div class="ql-grid">'
            +   card('카테고리별 (T+3)', 'tag', cats
                  ? '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">구분</th><th scope="col">표본</th><th scope="col">수익률</th><th scope="col">초과</th><th scope="col">이긴 비율</th>'
                    + '</tr></thead><tbody>' + cats + '</tbody></table></div>'
                  : '<div class="ql-note">표본이 부족합니다.</div>')
            +   card('순위가 의미 있는가 (T+3)', 'list', ranks
                  ? '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">순위</th><th scope="col">표본</th><th scope="col">초과</th><th scope="col">이긴 비율</th>'
                    + '</tr></thead><tbody>' + ranks + '</tbody></table></div>'
                    + '<div class="ql-note">상위 픽이 하위 픽보다 나아야 순위에 값이 있습니다.</div>'
                  : '<div class="ql-note">표본이 부족합니다.</div>')
            + '</div>'

            + (icRows ? card('rec_score 예측력 (IC)', 'target',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">구간</th><th scope="col">표본</th><th scope="col">IC</th><th scope="col">t</th></tr></thead>'
                + '<tbody>' + icRows + '</tbody></table></div>'
                + '<div class="ql-note">IC 는 점수와 실제 수익률의 상관입니다. '
                + '<b>0.05 미만이면 점수에 예측력이 없다</b>고 봅니다. '
                + '음수면 점수가 높을수록 나빴다는 뜻입니다.</div>') : '')

            + (atRows ? card('점수 구성요소 기여도', 'sliders',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">항목</th><th scope="col">비영 표본</th><th scope="col">순위상관</th><th scope="col">t</th><th scope="col"></th>'
                + '</tr></thead><tbody>' + atRows + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('alert')
                + `<b>${at.method || ''}</b>를 씁니다. 피어슨 상관은 이상치 하나에 끌려갑니다 — `
                + '실측에서 암호화폐 2종목(+95%p, +31%p)이 <code>blowoff_penalty</code> 상관을 '
                + 'r=+0.69 (t=+10.1) 로 만들었는데, 실제 비영 표본은 2건이었습니다. '
                + `지금은 비영 표본 ${cnt(at.min_nonzero)}건 미만이면 판정하지 않습니다. `
                + (at.note || '') + '</div>') : '')

            + '<div class="ql-meta">' + ic('flask')
            + `픽 ${cnt(j.n_picks)}건 · ${(j.dates || []).length}일치`
            + (j.updated_at ? ` · 갱신 ${j.updated_at}` : '')
            + ' · 갱신: <b>python -m scripts.report.discovery_audit --sync</b></div>';
        }
    };

    /* DISCOVERY 화면 상단 배지 — "오늘 픽" 옆에 "지난 픽이 어땠는지"를 붙인다.
       발굴 화면만 보면 늘 성공처럼 보인다. 성적을 같은 자리에 둔다. */
    async function discoveryBadge() {
        const host = document.getElementById('view-discovery');
        if (!host) return;
        let el = document.getElementById('disc-perf-badge');
        if (!el) {
            el = document.createElement('div');
            el.id = 'disc-perf-badge';
            el.className = 'disc-perf';
            const label = host.querySelector('.section-label');
            if (label && label.nextSibling) host.insertBefore(el, label.nextSibling);
            else host.insertBefore(el, host.firstChild);
        }
        let j;
        try { j = await api('/api/lab/discovery?attribution=false'); }
        catch (e) { el.remove(); return; }          // 서버 없으면 배지를 숨긴다
        if (!j.available) { el.remove(); return; }
        const t3 = (j.overall || {})['T+3'] || {};
        if (!t3.n) { el.remove(); return; }
        el.innerHTML = ic('flask')
            + `<div class="disc-perf-item"><b class="${sgn(t3.excess)}">${pct(t3.excess, 2)}</b>`
            +   '<span>유니버스 대비 T+3 초과</span></div>'
            + `<div class="disc-perf-item"><b>${pctA(t3.beat_rate)}</b>`
            +   '<span>유니버스를 이긴 비율</span></div>'
            + `<div class="disc-perf-item"><b>${cnt(t3.n)}</b><span>표본</span></div>`
            + '<span class="disc-perf-link" id="disc-perf-more">자세히 →</span>';
        const more = document.getElementById('disc-perf-more');
        if (more) {
            more.onclick = () => {
                const tab = document.querySelector('[data-target="view-discovery-score"]');
                if (tab) tab.click();
            };
        }
    }


    /* ══════════════════════════════════════════════════════════
     *  DCA LAB — "나눠 넣을까 한 번에 넣을까"
     * ════════════════════════════════════════════════════════ */
    /* 'auto' 는 전략 이름이 아니라 **미기록**이다 (AUTO 실행에서 선택 실패).
     * 그대로 찍으면 "auto 라는 전략"이 있는 것처럼 읽힌다. */
    const esc2 = (t) => String(t == null ? '' : t)
        .replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

    const stratLabel = (v) => (!v || v === 'auto')
        ? '<span class="ql-dim">미기록</span>' : v;

    const DCA = {
        render() {
            const host = $('dca-body');
            if (!host) return;
            host.innerHTML = question('flask', '목돈이 생겼다 — 나눠 넣을까 한 번에 넣을까',
                    '통념은 "적립식이 안전하다"입니다. 절반만 맞습니다. '
                    + '평균만 보면 표본 기간이 상승장이었는지만 말하게 됩니다.')
                + '<div class="ql-controls">'
                + '<label>종목<input id="dca-sym" type="text" value="SPY" '
                +   'placeholder="SPY" style="width:6.5rem"></label>'
                + '<label>분할<select id="dca-months">'
                +   [3, 6, 12, 18, 24].map(m =>
                        `<option value="${m}"${m === 12 ? ' selected' : ''}>${m}개월</option>`).join('')
                + '</select></label>'
                + '<label>평가 지평<select id="dca-hz">'
                +   [6, 12, 24].map(m =>
                        `<option value="${m}"${m === 12 ? ' selected' : ''}>${m}개월</option>`).join('')
                + '</select></label>'
                + '<button id="dca-run" class="tp-btn tp-btn-primary">비교</button></div>'
                + '<div id="dca-result"></div>';
            $('dca-run').onclick = () => DCA.run();
            DCA.run();
        },
        async run() {
            const out = $('dca-result');
            loading(out, '전 구간 시작일에서 비교 중…');
            const sym = ($('dca-sym').value || 'SPY').trim().toUpperCase();
            let j;
            try {
                j = await api(`/api/lab/dca?symbol=${encodeURIComponent(sym)}`
                    + `&months=${$('dca-months').value}&horizon_months=${$('dca-hz').value}`);
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = DCA.view(j);
        },
        /* 두 값을 나란히 놓는 막대 — 어느 쪽이 큰지가 먼저 읽혀야 한다 */
        pair(label, a, b, fmt, better) {
            const f = fmt || ((v) => pct(v, 1));
            const mx = Math.max(Math.abs(a), Math.abs(b), 1e-9);
            const w = (v) => Math.min(100, Math.abs(v) / mx * 100);
            const mark = (who) => better === who ? ' <b class="dca-win">유리</b>' : '';
            return '<div class="dca-pair"><span class="dca-pair-label">' + label + '</span>'
                + '<div class="dca-pair-rows">'
                +   `<div class="dca-bar-row"><span>일시금${mark('lump')}</span>`
                +     `<i class="dca-bar lump" style="width:${w(a)}%"></i>`
                +     `<b class="${sgn(a)}">${f(a)}</b></div>`
                +   `<div class="dca-bar-row"><span>적립식${mark('dca')}</span>`
                +     `<i class="dca-bar dca" style="width:${w(b)}%"></i>`
                +     `<b class="${sgn(b)}">${f(b)}</b></div>`
                + '</div></div>';
        },
        view(j) {
            const o = j.overall, t = j.tails, d = j.drawdown, rg = j.regimes || {};

            const hero = '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   `<span class="ql-hero-label">${j.symbol} · ${j.months}개월 분할 · `
                +     `평가 ${j.horizon_months}개월 · 구간 ${cnt(j.n)}개</span>`
                +   `<span class="ql-hero-big">일시금 승률 ${pctA(o.lump_wins_pct, 0)}</span>`
                +   `<span class="ql-hero-sub">평균 일시금 <b class="${sgn(o.lump_mean)}">`
                +     `${pct(o.lump_mean, 1)}</b> vs 적립식 <b class="${sgn(o.dca_mean)}">`
                +     `${pct(o.dca_mean, 1)}</b> · ${j.period.start} ~ ${j.period.end}</span>`
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('변동성', num(t.lump_std, 1) + ' vs ' + num(t.dca_std, 1),
                           '', '일시금 vs 적립식')
                +   metric('최악 구간', pct(t.lump_worst, 1) + ' vs ' + pct(t.dca_worst, 1))
                + '</div></div>';

            /* 국면 — 이 화면의 본론. 상승장에서 지는 건 당연하다 */
            const order = ['상승', '횡보', '하락'];
            const rgRows = order.map(k => {
                const v = rg[k];
                if (!v) return `<tr><td><b>${k}장</b></td>`
                    + '<td colspan="3"><span class="ql-dim">표본 부족</span></td></tr>';
                const win = v.lump_wins_pct;
                return `<tr><td><b>${k}장</b><small>구간 ${cnt(v.n)}개</small></td>`
                    + `<td class="${sgn(v.lump)}">${pct(v.lump, 1)}</td>`
                    + `<td class="${sgn(v.dca)}">${pct(v.dca, 1)}</td>`
                    + `<td><b class="${win >= 60 ? 'neg' : win <= 40 ? 'pos' : ''}">`
                    +   `${pctA(win, 0)}</b><small>일시금 승률</small></td></tr>`;
            }).join('');

            const regimeCard = card('국면별 — 언제 적립식이 이기는가', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">국면</th><th scope="col">일시금</th>'
                + '<th scope="col">적립식</th><th scope="col">일시금 승률</th>'
                + '</tr></thead><tbody>' + rgRows + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('alert')
                + '<b>상승장에서 적립식이 지는 건 당연합니다</b> — 늦게 사니까요. '
                + '적립식의 값은 하락장 줄에 있습니다. 다만 국면은 <b>사후 판정</b>이라 '
                + '살 때는 어느 줄에 있을지 알 수 없습니다.</div>');

            const tailCard = card('꼬리 — 적립식의 값은 여기에 있다', 'shield',
                DCA.pair('평균 수익', o.lump_mean, o.dca_mean, null,
                         o.lump_mean > o.dca_mean ? 'lump' : 'dca')
                + DCA.pair('최악 구간', t.lump_worst, t.dca_worst, null,
                           t.lump_worst > t.dca_worst ? 'lump' : 'dca')
                + DCA.pair('하위 5%', t.lump_p05, t.dca_p05, null,
                           t.lump_p05 > t.dca_p05 ? 'lump' : 'dca')
                + DCA.pair('수익률 표준편차', t.lump_std, t.dca_std,
                           (v) => num(v, 1) + '%p', t.lump_std < t.dca_std ? 'lump' : 'dca')
                + (!d ? '' : DCA.pair(`최대 평가낙폭 (중앙값 · 표본 ${cnt(d.n)})`,
                           d.lump_median, d.dca_median, null,
                           d.lump_median > d.dca_median ? 'lump' : 'dca')));

            return hero
                + '<div class="ql-verdict">' + ic('flask')
                + '<div><b>판정</b><span>' + j.verdict + '</span></div></div>'
                + regimeCard + tailCard
                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).join('<br>') + '</span></div>';
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  TRUE DIVERSIFICATION — "진짜 분산인가"
     * ----------------------------------------------------------
     *  섹터 라벨이 아니라 **실제 수익률**로 묶는다. 라벨이 달라도
     *  같이 움직이면 그건 한 종목을 여러 개 산 것이다.
     *
     *  닮은 종목은 보여주되 **예측으로 팔지 않는다** — 실측 근거를
     *  화면에 그대로 싣는다 (기준선 대비 +0.22%p, 겹친 표본).
     *  선행 종목·섹터는 내지 않는다 — 재현되지 않았다.
     * ════════════════════════════════════════════════════════ */
    const DIV = {
        _last: null,
        render() {
            const host = $('div-body');
            if (!host) return;
            host.innerHTML = question('shield', '진짜 분산인가',
                    '섹터가 달라도 같이 움직이면 분산이 아닙니다. '
                    + '최근 2년 수익률로 실제 묶음을 찾습니다.')
                + '<div class="ql-controls">' + srcSel('div-src')
                + '<button id="div-run" class="tp-btn tp-btn-primary">진단</button>'
                //  유니버스 지도의 시장. 보유 판정은 금액이 가장 큰 시장을
                //  백엔드가 스스로 고르므로 여기 영향을 받지 않는다.
                + '<span class="ql-mkt-wrap"><label>유니버스</label>'
                + marketSel('div') + '</span></div>'
                + '<div id="div-result"></div>';
            $('div-run').onclick = () => DIV.run();
            DIV.run();
        },
        async run() {
            const out = $('div-result');
            loading(out, '군집 계산 중… (첫 실행은 몇 초 걸립니다)');
            let j;
            try {
                j = await api('/api/lab/clusters',
                    { source: $('div-src').value, holdings: clientHoldings() });
            } catch (e) { out.innerHTML = offline(e); return; }
            DIV._last = j;
            out.innerHTML = j.available ? DIV.view(j)
                : (empty(j.message) + '<div id="div-uni"></div>');
            DIV.bind();
            DIV.loadUniverse();
        },

        /* ── 상호작용 ────────────────────────────────────────────
         * 위임으로 받는다 — 다시 그려도 다시 걸 필요가 없다. */
        bind() {
            const root = $('div-result');
            if (!root || root._divBound) return;
            root._divBound = true;
            root.addEventListener('click', (e) => {
                const head = e.target.closest && e.target.closest('.div-cl-head');
                if (head) {
                    const row = head.closest('.div-cl');
                    const on = row.classList.toggle('open');
                    head.setAttribute('aria-expanded', on ? 'true' : 'false');
                    return;
                }
                const chip = e.target.closest && e.target.closest('.div-chip');
                if (chip && chip.dataset.sym) DIV.similar(chip.dataset.sym);
            });
        },

        /* ── 실질 베팅 수 — 이 화면의 핵심 지표 ──────────────── */
        gauge(j) {
            const n = j.n_names, eff = j.effective_bets, hhi = j.hhi_effective;
            const bar = (label, v, cls, hint) => {
                const w = Math.max(3, Math.min(100, (v / Math.max(n, 1)) * 100));
                return '<div class="div-gauge-row">'
                    + `<span class="div-gauge-label">${label}</span>`
                    + `<span class="div-gauge-track"><i class="div-gauge-fill ${cls}" `
                    +   `style="width:${w}%"></i></span>`
                    + `<b class="div-gauge-val">${num(v, v >= 10 ? 0 : 2)}</b>`
                    + (hint ? `<span class="div-gauge-hint">${hint}</span>` : '')
                    + '</div>';
            };
            return '<div class="div-gauge">'
                + bar('보유 종목 수', n, 'nominal', '명목')
                + bar('금액만 반영', hhi, 'hhi', '비중 쏠림')
                + bar('상관까지 반영', eff, 'eff', '실질 베팅')
                + '</div>';
        },

        clusterRow(g, rank) {
            const heat = g.inner_corr === null ? ''
                : g.inner_corr >= 0.5 ? ' hot' : g.inner_corr >= 0.35 ? ' warm' : '';
            const chips = g.members.map(m =>
                `<button type="button" class="div-chip" data-sym="${m.symbol}" `
                + `title="${m.symbol} — 닮은 종목 보기">`
                + `${m.name || m.symbol}<small>${pctA(m.weight_pct, 1)}</small></button>`).join('');
            const peers = !g.peers.length ? ''
                : '<div class="div-peers"><span>같은 군집의 다른 종목 '
                    + `(전체 ${cnt(g.peers_total)}개 중)</span>`
                    + g.peers.map(p =>
                        `<button type="button" class="div-chip ghost" data-sym="${p}">${p}</button>`
                      ).join('') + '</div>';
            return `<div class="div-cl${rank === 0 ? ' open' : ''}">`
                + `<button type="button" class="div-cl-head" aria-expanded="${rank === 0}">`
                +   `<span class="div-cl-bar${heat}" style="width:${Math.max(4, g.weight_pct)}%"></span>`
                +   `<span class="div-cl-title"><b>${pctA(g.weight_pct, 1)}</b>`
                +     `<span>${g.n}종목`
                +     (g.inner_corr === null ? ''
                        : ` · 내부 상관 <b>${num(g.inner_corr, 2)}</b>`) + '</span></span>'
                +   '<span class="div-cl-arrow" aria-hidden="true">▾</span>'
                + '</button>'
                + `<div class="div-cl-body"><div class="div-chips">${chips}</div>${peers}</div>`
                + '</div>';
        },

        view(j) {
            const v = j.verdict;
            const eff = j.effective_bets, n = j.n_names;
            const shrink = (eff && n) ? (1 - eff / n) * 100 : null;

            const hero = '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   `<span class="ql-hero-label">${j.market} 보유 ${cnt(n)}종목 · `
                +     `${cnt(j.n_clusters)}개 군집</span>`
                +   `<span class="ql-hero-big ${v.level === 'ok' ? 'pos' : v.level === 'bad' ? 'neg' : ''}">`
                +     `실질 베팅 ${num(eff, 2)}개</span>`
                +   `<span class="ql-hero-sub">${v.text}</span>`
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('평균 상관', num(j.avg_corr, 2), '',
                           j.avg_corr >= 0.4 ? '높음 — 같이 움직임' : '')
                +   metric('포트폴리오 변동성', pctA(j.port_vol_pct, 1), '', '연율')
                + '</div></div>';

            const verdictBox = '<div class="ql-verdict ' + v.level + '">'
                + ic(v.level === 'ok' ? 'check' : 'alert')
                + '<div><b>' + (v.level === 'ok' ? '분산돼 있습니다'
                    : v.level === 'bad' ? '분산이 아닙니다' : '일부가 겹칩니다') + '</b>'
                + '<span>' + v.text
                + (shrink !== null && shrink > 5
                    ? ` 상관을 반영하면 종목 수의 <b>${shrink.toFixed(0)}%</b>가 사라집니다.` : '')
                + '</span></div></div>';

            const gauge = card('종목 수는 세 가지로 셀 수 있습니다', 'barChart',
                DIV.gauge(j)
                + '<div class="ql-note">' + ic('flask')
                + '<b>명목</b>은 그냥 개수입니다. <b>금액만 반영</b>은 비중 쏠림만 봅니다. '
                + '<b>실질 베팅</b>은 상관까지 반영한 값(주성분 분산 기여의 엔트로피)으로, '
                + '이게 실제로 서로 다른 베팅이 몇 개인지입니다.</div>');

            const clusters = card('무엇이 같이 움직이나 — 눌러서 펼치기', 'list',
                '<div class="div-cls">'
                + j.clusters.map((g, i) => DIV.clusterRow(g, i)).join('')
                + '</div>'
                + '<div class="ql-note">' + ic('alert')
                + '종목 칩을 누르면 <b>닮은 종목</b>을 봅니다. '
                + '내부 상관이 높은 군집일수록 막대가 붉어집니다.</div>');

            const extra = [];
            if (j.unknown && j.unknown.length)
                extra.push(`가격 이력이 없어 제외: ${j.unknown.join(', ')}`);
            (j.excluded_markets || []).forEach(x =>
                extra.push(`통화를 섞지 않으려고 ${x.market} ${x.n}종목은 따로 봅니다`));

            return hero + verdictBox + gauge + clusters
                + '<div id="div-similar"></div>'
                + (extra.length ? '<div class="ql-note">' + ic('alert')
                    + extra.join('<br>') + '</div>' : '')
                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).join('<br>') + '</span></div>'
                + '<div id="div-uni"></div>';
        },

        /* ── 닮은 종목 ─────────────────────────────────────────── */
        async similar(sym) {
            const host = $('div-similar');
            if (!host) return;
            loading(host, `${sym} 와 닮은 종목 찾는 중…`);
            //  구형 브라우저·테스트 환경에는 없다. 없다고 화면이 죽으면 안 된다.
            if (host.scrollIntoView) {
                try { host.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
                catch (e) { /* 무시 */ }
            }
            let j;
            try { j = await api(`/api/lab/similar?symbol=${encodeURIComponent(sym)}&k=8`); }
            catch (e) { host.innerHTML = offline(e); return; }
            if (!j.available) { host.innerHTML = empty(j.message); return; }

            const list = (rows, valKey, fmt) => !rows.length
                ? '<div class="ql-dim">값 없음</div>'
                : '<div class="div-sim-list">' + rows.map(r =>
                    `<button type="button" class="div-sim-row div-chip" data-sym="${r.symbol}">`
                    + `<b>${r.symbol}</b>`
                    + (r.same_cluster ? '<span class="div-tag">같은 군집</span>' : '')
                    + `<span class="div-sim-val">${fmt(r[valKey])}</span></button>`).join('')
                  + '</div>';

            const ev = j.evidence;
            host.innerHTML = card(`${j.symbol} 와 닮은 종목`, 'trend',
                '<div class="div-sim-grid">'
                + '<div><h4>같이 움직인다 <small>수익률 상관</small></h4>'
                +   list(j.by_corr, 'corr', v => num(v, 3)) + '</div>'
                + `<div><h4>모양이 닮았다 <small>최근 ${j.window}일 경로</small></h4>`
                +   list(j.by_path, 'distance', v => num(v, 3)) + '</div>'
                + '</div>'
                + `<div class="div-sim-meta">같은 군집 <b>${cnt(j.cluster_size)}종목</b>`
                + (j.cluster_members.length
                    ? ' · ' + j.cluster_members.map(m =>
                        `<button type="button" class="div-chip ghost" data-sym="${m}">${m}</button>`
                      ).join('') : '') + '</div>'
                + '<div class="ql-warn">' + ic('alert') + '<span><b>예측이 아닙니다.</b> '
                + `${ev.note}</span></div>`, 'div-sim-card');
        },

        /* ── 유니버스 지도 (보조) ──────────────────────────────── */
        async loadUniverse() {
            const host = $('div-uni');
            if (!host) return;
            //  시장을 바꾸면 다시 그려야 한다. 시장별로 한 번씩만 받는다.
            if (host._loadedMkt === market()) return;
            host._loadedMkt = market();
            let j;
            try { j = await api('/api/lab/clusters/universe?market=' + market() + '&top=12'); }
            catch (e) { host.innerHTML = ''; return; }
            if (!j.available) { host.innerHTML = ''; return; }
            const rows = j.clusters.map(g => {
                const heat = g.inner_corr >= 0.5 ? ' hot' : g.inner_corr >= 0.35 ? ' warm' : '';
                return `<tr><td><b>${g.name}</b><small>${g.members.slice(0, 5).join(', ')}…</small></td>`
                    + `<td>${cnt(g.n)}</td>`
                    + `<td><span class="div-corr${heat}">${num(g.inner_corr, 2)}</span></td>`
                    + `<td>${pctA(g.vol_pct, 0)}</td></tr>`;
            }).join('');
            host.innerHTML = card(
                `${market() === 'KR' ? '국내' : '미국'} 시장은 어떻게 묶이나 — `
                + `${cnt(j.n_symbols)}종목 → ${cnt(j.n_clusters)}군집`,
                'barChart',
                thinBanner(j)
                + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">군집</th><th scope="col">종목</th>'
                + '<th scope="col">내부 상관</th><th scope="col">연변동성</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                + `<div class="ql-note">${ic('flask')}단독 군집 ${cnt(j.n_singles)}개 · `
                + `${j.period.start}~${j.period.end} ${cnt(j.days)}일 · ${j.note}</div>`,
                'div-uni-card');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  FLOW — "누가 사고 누가 파는가" (국내 전용)
     * ----------------------------------------------------------
     *  두 가지를 분명히 나눠 보여준다:
     *    ① **사실** — 오늘 외국인·기관·개인이 얼마나 샀나 (측정값)
     *    ② **해석** — 그게 뭘 뜻하나 (아직 검증 안 됨)
     *
     *  ②를 ①처럼 보이게 만들면 안 된다. 처음 검정에서 4개가 통과한 줄
     *  알았지만 **날짜 효과**였다 — 같은 날 26종목이 동시에 극단이었다.
     *  대응표본으로 다시 재니 FDR 통과 0개다.
     * ════════════════════════════════════════════════════════ */
    const FLOW = {
        render() {
            const host = $('flow-body');
            if (!host) return;
            host.innerHTML = question('trend', '누가 사고 누가 파는가',
                    '외국인·기관·개인의 순매매를 거래량 대비로 재서, 오늘 누가 '
                    + '움직였는지 봅니다. 국내 종목만 가능합니다.')
                + '<div id="flow-result"></div>';
            FLOW.run();
        },
        async run() {
            const out = $('flow-result');
            loading(out, '수급 계산 중…');
            let j;
            try { j = await api('/api/lab/flow?top=30'); }
            catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = FLOW.view(j);
        },

        /* 수급 강도 막대 — 0 을 가운데 두고 좌우로 뻗는다 */
        zbar(v) {
            if (v === null || v === undefined || isNaN(v))
                return '<span class="ql-dim">—</span>';
            const w = Math.min(50, Math.abs(v) / 3 * 50);
            const hot = Math.abs(v) >= 1.5 ? ' hot' : '';
            return '<span class="flow-z">'
                + `<i class="flow-z-fill ${v < 0 ? 'sell' : 'buy'}${hot}" `
                +   `style="${v < 0 ? 'right:50%' : 'left:50%'};width:${w}%"></i>`
                + `<b class="${v < 0 ? 'neg' : v > 0 ? 'pos' : ''}">${num(v, 2)}</b>`
                + '</span>';
        },

        view(j) {
            const heavy = j.rows.filter(r => Math.abs(r.retail_z) >= j.z_threshold);
            const hero = '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   `<span class="ql-hero-label">${j.as_of} 기준 · ${cnt(j.n_total)}종목</span>`
                +   `<span class="ql-hero-big">개인 쏠림 ${cnt(heavy.length)}종목</span>`
                +   `<span class="ql-hero-sub">거래량 대비 순매매가 평소보다 `
                +     `<b>${num(j.z_threshold, 1)}σ</b> 이상 벗어난 종목입니다. `
                +     `이건 <b>측정값</b>입니다 — 해석은 아래에서 따로 봅니다.</span>`
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('검증된 규칙', cnt(j.n_verified) + '개',
                           j.n_verified ? '' : 'neg', `${cnt(j.n_tests)}개 검정 중`)
                +   metric('표본', cnt((j.period || {}).days) + '일', j.thin ? 'neg' : '')
                + '</div></div>';

            /* 규칙이 0개면 그 사실이 가장 중요한 정보다 */
            const verdict = j.n_verified === 0
                ? '<div class="ql-verdict bad">' + ic('alert') + '<div>'
                    + '<b>아직 검증된 규칙이 없습니다</b><span>'
                    + `${cnt(j.n_tests)}개 조합을 검정했지만 다중비교 보정(FDR)을 통과한 것이 `
                    + '없습니다. <b>오늘 누가 샀는지는 사실</b>이지만, '
                    + '그게 앞으로 무엇을 뜻하는지는 이 표본으로 말할 수 없습니다.'
                    + '</span></div></div>'
                : '<div class="ql-verdict ok">' + ic('check') + '<div>'
                    + `<b>검증된 규칙 ${cnt(j.n_verified)}개</b><span>`
                    + j.verified_rules.map(r =>
                        `${r.label} (${pct(r.excess, 2)}p · ${cnt(r.days)}일)`).join(' · ')
                    + '</span></div></div>';

            const rows = j.rows.map(r => {
                const z = r.z || {};
                const fired = r.fired.length
                    ? r.fired.map(f => `<span class="flow-tag">${f}</span>`).join('')
                    : '<span class="ql-dim">—</span>';
                return `<tr><td><b>${r.name}</b><small>${r.symbol}</small></td>`
                    + `<td>${FLOW.zbar(z['외국인'])}</td>`
                    + `<td>${FLOW.zbar(z['기관'])}</td>`
                    + `<td>${FLOW.zbar(z['개인+기타'])}</td>`
                    + `<td class="flow-fired">${fired}</td></tr>`;
            }).join('');

            const table = card(`오늘의 수급 — 개인 쏠림 순 (${j.as_of})`, 'list',
                '<div class="ql-table-scroll"><table class="ql-table flow-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">외국인</th>'
                + '<th scope="col">기관</th><th scope="col">개인+기타</th>'
                + '<th scope="col">발동한 검증 규칙</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('flask')
                + '숫자는 <b>거래량 대비 순매매의 z-score</b>입니다. 절대 주수로 보면 '
                + '대형주만 늘 "대량"이 됩니다. 막대가 붉어지면 '
                + `${num(j.z_threshold, 1)}σ 를 넘은 것입니다.</div>`);

            return hero + verdict + table
                + (j.sample_warning
                    ? '<div class="ql-warn">' + ic('alert') + '<span>'
                        + j.sample_warning.replace(/\*\*/g, '') + '</span></div>' : '')
                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).map(c => c.replace(/\*\*/g, '')).join('<br>')
                + '</span></div>'
                + ((j.photo_credits || []).length
                    ? '<div class="ql-meta">' + ic('flask') + '인물 사진: 위키미디어 커먼즈 · '
                        + j.photo_credits.map(p => `${p[1]} (${p[0]})`).join(' · ')
                        + '</div>'
                    : '');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  NEXT UP — "다음 차례" (워크플로우)
     * ----------------------------------------------------------
     *    ① 오늘의 픽  →  ② 어느 군집인가  →  ③ 누가 먼저 갔나
     *                 →  ④ 아직 안 간 종목
     *
     *  네 단계를 **가로로 이어 붙여** 흐름이 눈에 보이게 한다.
     *  표를 네 개 만들면 사람은 그걸 흐름으로 읽지 않는다.
     *
     *  군집 **간** 선행성은 재현되지 않았다 (OOS 부호 2/8). 되는 것은
     *  같은 군집 **안**이고, 그마저 순 +0.075%p 로 얇다. 화면에 그대로 쓴다.
     * ════════════════════════════════════════════════════════ */
    const NEXTUP = {
        render() {
            const host = $('lag-body');
            if (!host) return;
            host.innerHTML = question('trend', '다음 차례는 누구인가',
                    '오늘 걸러진 종목이 어느 묶음에 속하는지 보고, 그 묶음에서 '
                    + '아직 안 움직인 종목을 찾습니다.')
                + '<div class="ql-controls"><span class="ql-mkt-wrap"><label>시장</label>'
                + marketSel('nextup') + '</span></div>'
                + '<div id="lag-result"></div>';
            NEXTUP.run();
        },
        async run() {
            const out = $('lag-result');
            loading(out, '군집과 픽을 맞추는 중…');
            let j;
            try { j = await api('/api/lab/laggards?market=' + market()); }
            catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = NEXTUP.view(j);
            /* 4단계는 별도 호출 — 그래프 계산이 무거워 본문을 먼저 보여준다 */
            NEXTUP.graph((j.groups || []).flatMap(g => g.picks.map(p => p.symbol)));
        },

        /* 국내 종목은 **회사명이 먼저**다. `329180.KS` 는 사람이 못 읽는다. */
        chip(sym, val, sub, cls, name) {
            const label = (name && name !== sym) ? name : sym;
            return `<span class="lag-chip ${cls || ''}" title="${sym}">`
                + `<b>${label}</b>`
                + (val === null || val === undefined ? ''
                    : `<i class="${sgn(val)}">${pct(val, 1)}</i>`)
                + (sub ? `<small>${sub}</small>` : '')
                + '</span>';
        },

        /* 한 군집 = 워크플로우 한 줄.
         * **현 단계를 하이라이트한다** — 백엔드가 선행/뒤처짐 격차로 정한
         * `stage` 를 쓴다. 눈으로 고르면 근거가 없다. */
        lane(g, j) {
            const step = (n, title, body, cls) => {
                const state = n < g.stage ? 'done' : n === g.stage ? 'now' : 'todo';
                return `<div class="lag-step ${cls || ''} ${state}">`
                    + `<span class="lag-step-no">${state === 'done' ? '✓' : n}</span>`
                    + `<span class="lag-step-title">${title}`
                    + (state === 'now' ? '<em>지금</em>' : '') + '</span>'
                    + `<div class="lag-step-body">${body}</div></div>`;
            };

            const picks = g.picks.map(p =>
                NEXTUP.chip(p.symbol, p.trail_pct, null, 'pick', p.name)).join('');
            const leaders = g.leaders.map(x =>
                NEXTUP.chip(x.symbol, x.trail_pct, `선행 ${pctA(x.lead_freq, 0)}`,
                            'lead', x.name)).join('');
            const cands = g.candidates.length
                ? g.candidates.map(c =>
                    NEXTUP.chip(c.symbol, c.trail_pct,
                        `하위 ${pctA(c.rank_pct, 0)}`, 'next', c.name)).join('')
                : '<span class="ql-dim">뒤처진 종목이 없습니다 — 군집 전체가 움직였습니다</span>';

            return `<section class="lag-lane stage-${g.stage}">`
                + '<header class="lag-lane-head">'
                +   `<b>${g.name}</b>`
                +   `<span>${cnt(g.n_members)}종목 · 최근 ${j.trail_days}일 평균 `
                +     `<b class="${sgn(g.cluster_move_pct)}">${pct(g.cluster_move_pct, 2)}</b>`
                +     (g.spread_pct === null ? ''
                        : ` · 선행-뒤처짐 격차 <b>${pct(g.spread_pct, 1)}p</b>`) + '</span>'
                + `<span class="lag-stage-why">${g.stage_reason}</span>`
                + '</header>'
                + '<div class="lag-flow">'
                +   step(1, '오늘의 픽', picks, 'a')
                +   step(2, '먼저 간 종목', leaders, 'b')
                +   step(3, `아직 안 간 종목 → 다음 ${j.horizon_days}일`, cands, 'c')
                + '</div></section>';
        },


        /* ── 4단계: 연결 구조 ─────────────────────────────────────
         * 묶음 "안"에서 끝나던 흐름을 묶음 "사이"까지 넓힌다.
         * 좌표·중심성은 백엔드(networkx)가 계산하고 여기서는 그리기만 한다.
         *
         * **중심성으로 후보를 고르지 않는다.** 뒤처진 종목 중 중심에
         * 가까운 쪽이 더 잘 따라오는지 4개 조합으로 검정했고 FDR 통과
         * 0개였다. 구조를 보는 층이지 선택 기준이 아니다. */
        async graph(seeds) {
            const host = $('lag-graph');
            if (!host) return;
            loading(host, '연결 구조 계산 중…');
            let j;
            try {
                j = await api('/api/lab/graph?market=' + market() + '&threshold=0.45&hops=1'
                    + (seeds && seeds.length ? `&symbols=${encodeURIComponent(seeds.join(','))}` : ''));
            } catch (e) { host.innerHTML = ''; return; }
            if (!j.available) { host.innerHTML = empty(j.message); return; }
            host.innerHTML = NEXTUP.graphView(j);
        },

        graphView(j) {
            const W = 100, pad = 4;
            const px = (v) => (pad + v / 100 * (W - pad * 2)).toFixed(2);
            /* 간선은 강도 상위만 그린다 — 1,000개를 다 그리면 덩어리가 된다 */
            const top = j.edges.slice(0, 120);
            const minW = Math.min(...top.map(e => e.w));
            const maxW = Math.max(...top.map(e => e.w)) || 1;
            const pos = {};
            j.nodes.forEach(n => { pos[n.symbol] = n; });
            /* 이름이 있으면 이름으로 부른다 */
            const nm = (sym) => (pos[sym] && pos[sym].name) || sym;
            const lines = top.map(e => {
                const a = pos[e.a], b = pos[e.b];
                if (!a || !b) return '';
                const t = (e.w - minW) / ((maxW - minW) || 1);
                return `<line x1="${px(a.x)}" y1="${px(a.y)}" x2="${px(b.x)}" y2="${px(b.y)}"`
                    + ` stroke-width="${(0.15 + t * 0.55).toFixed(2)}"`
                    + ` opacity="${(0.12 + t * 0.5).toFixed(2)}" />`;
            }).join('');
            const maxS = Math.max(...j.nodes.map(n => n.strength)) || 1;
            const dots = j.nodes.map(n => {
                const r = (0.7 + Math.sqrt(n.strength / maxS) * 1.6).toFixed(2);
                return `<circle class="lg-node ${n.seed ? 'seed' : ''}" cx="${px(n.x)}" cy="${px(n.y)}"`
                    + ` r="${r}"><title>${n.name || n.symbol} (${n.symbol}) · 강도 ${num(n.strength, 1)}`
                    + ` · 이웃 ${n.degree}${n.seed ? ' · 오늘의 픽' : ''}</title></circle>`;
            }).join('');
            const labels = j.nodes.filter(n => n.seed).slice(0, 10).map(n =>
                `<text class="lg-label" x="${px(n.x)}" y="${(parseFloat(px(n.y)) - 2.2).toFixed(2)}"`
                + ` text-anchor="middle">${n.name || n.symbol}</text>`).join('');

            const strong = j.edges.slice(0, 6).map(e =>
                `<li><b title="${e.a}">${nm(e.a)}</b> — <b title="${e.b}">${nm(e.b)}</b>`
                + `<span class="lg-w"><i style="width:${(e.w * 100).toFixed(0)}%"></i>`
                + `${num(e.w, 3)}</span></li>`).join('');
            const bridges = (j.bridges || []).slice(0, 5).map(b =>
                `<li><b title="${b.symbol}">${b.name || b.symbol}</b>`
                + `<small>묶음 ${b.cluster}</small>`
                + `<span class="lg-w"><i style="width:${(b.max_w * 100).toFixed(0)}%"></i>`
                + `교차 ${cnt(b.links)}개 · 최대 ${num(b.max_w, 3)}</span></li>`).join('');

            const ev = j.evidence || {};
            return card(`연결 구조 — 씨앗 ${cnt(j.seeds.length)}종목이 닿는 곳`, 'barChart',
                /* 그래프는 정사각형이라 폭을 그대로 두면 넓은 화면에서
                 * 세로로도 그만큼 커진다. 크기를 묶고 목록을 옆에 세운다. */
                '<div class="lg-body"><div class="lg-side">'
                + `<div class="lg-wrap"><svg class="lg-svg" viewBox="0 0 ${W} ${W}"`
                +   ' role="img" aria-label="종목 연결 그래프">'
                +   `<g class="lg-edges">${lines}</g>${dots}${labels}</svg></div>`
                + `<div class="lg-meta">${ic('flask')}노드 <b>${cnt(j.n_nodes)}</b> · `
                +   `간선 <b>${cnt(j.n_edges)}</b> (상관 ${num(j.threshold, 2)} 이상)<br>`
                +   `점 크기 = 연결 강도 · 선 굵기 = 상관 강도</div>`
                + '</div><div class="lg-cols">'
                +   `<div><h4>가장 센 연결</h4><ul class="lg-list">${strong}</ul></div>`
                +   `<div><h4>다리 종목 <small>다른 묶음을 잇는</small></h4>`
                +     `<ul class="lg-list">${bridges || '<li class="ql-dim">없음</li>'}</ul></div>`
                + '</div></div>'
                + '<div class="ql-warn">' + ic('alert') + '<span><b>선택 기준이 아닙니다.</b> '
                + esc2(ev.not_a_selector || '') + '<br>' + esc2(ev.note || '') + '</span></div>'
                + '<div class="ql-note">' + ic('alert')
                + (j.caveats || []).map(c => c.replace(/\*\*/g, '')).join('<br>') + '</div>');
        },

        view(j) {
            const e = j.evidence;
            const hero = '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   `<span class="ql-hero-label">${j.pick_date} 픽 ${cnt(j.n_picks)}개 중 `
                +     `${cnt(j.n_mapped)}개가 군집에 잡힘</span>`
                +   `<span class="ql-hero-big">${cnt((j.stage_counts || {})['2'] || 0)}개 묶음이 `
                +     '<em>다음 차례</em> 단계</span>'
                +   `<span class="ql-hero-sub">각 묶음에서 아직 안 오른 종목이 `
                +     `이후 ${j.horizon_days}일에 앞선 종목보다 `
                +     `<b class="pos">${pct(e.excess_pct, 3)}p</b> 더 올랐습니다 `
                +     `(t=${num(e.t, 2)} · OOS ${pct(e.oos_pct, 3)}p)</span>`
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('비용 반영 후', pct(e.net_pct, 3) + 'p',
                           e.net_pct > 0 ? '' : 'neg', `왕복 ${num(e.cost_bp, 0)}bp`)
                +   metric('검정 통과', `${e.fdr_pass}/${e.fdr_tests}`, '',
                           `부호 유지 ${e.sign_hold}`)
                + '</div></div>';

            /* 비용이 이 화면의 결론이다 — 위에 크게 */
            const verdict = '<div class="ql-verdict ' + (e.net_pct > 0.1 ? 'ok' : 'warn') + '">'
                + ic('alert') + '<div><b>얇습니다</b><span>'
                + `+${e.excess_pct}%p 는 ${e.horizon}일치입니다. 왕복 ${e.cost_bp}bp 를 빼면 `
                + `<b>순 ${pct(e.net_pct, 3)}p</b> 밖에 안 남습니다 — `
                + '매매 근거로 쓰기엔 얇습니다. <b>묶음을 이해하는 도구</b>로 보십시오.'
                + '</span></div></div>';

            const lanes = j.groups.length
                ? j.groups.map(g => NEXTUP.lane(g, j)).join('')
                : empty('오늘 픽이 군집에 잡히지 않았습니다.');

            const legend = '<div class="lag-legend">'
                + '<span><i class="lag-sw pick"></i>오늘의 픽</span>'
                + '<span><i class="lag-sw lead"></i>먼저 간 종목</span>'
                + '<span><i class="lag-sw next"></i>다음 차례 후보</span>'
                + `<span class="lag-legend-note">선행 % = 과거에 그 종목이 `
                +   `묶음 상위 30%에 든 비율 (지속성 rho ${num(e.leader_rho, 2)} · `
                +   `${e.leader_pos} 군집 양수)</span>`
                + '</div>';

            return hero + verdict + legend + lanes
                + '<div id="lag-graph"></div>'
                + (j.unmapped.length
                    ? '<div class="ql-note">' + ic('alert')
                        + `군집에 없는 픽 ${cnt(j.unmapped.length)}개: `
                        + j.unmapped.join(', ') + ' (가격 이력 부족)</div>' : '')
                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).map(c => c.replace(/\*\*/g, '')).join('<br>')
                + '</span></div>'
                + ((j.photo_credits || []).length
                    ? '<div class="ql-meta">' + ic('flask') + '인물 사진: 위키미디어 커먼즈 · '
                        + j.photo_credits.map(p => `${p[1]} (${p[0]})`).join(' · ')
                        + '</div>'
                    : '');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  WHALES — "내 종목을 누가 들고 있나" (SEC 13F)
     * ----------------------------------------------------------
     *  **매매 신호가 아니다.** 13F 는 분기 사진이고 45일 지연 제출이라
     *  오늘 기준 4개월 넘게 지난 상태다. 이미 반영된 정보다.
     *  지연 일수를 hero 에 크게 박는 이유다.
     * ════════════════════════════════════════════════════════ */
    const WHALE = {
        render() {
            const host = $('whale-body');
            if (!host) return;
            host.innerHTML = question('shield', '내 종목을 누가 들고 있나',
                    'SEC 13F 공시로 유명 기관의 보유를 봅니다. '
                    + '분기 단위이고 45일 지연 제출이라 지금이 아니라 몇 달 전입니다.')
                + '<div class="ql-controls">' + srcSel('whale-src')
                + '<button id="whale-run" class="tp-btn tp-btn-primary">조회</button></div>'
                + '<div id="whale-result"></div>';
            $('whale-run').onclick = () => WHALE.run();
            WHALE.run();
        },
        async run() {
            const out = $('whale-result');
            loading(out, '13F 조회 중…');
            let j;
            try {
                j = await api('/api/lab/whales',
                    { source: $('whale-src').value, holdings: clientHoldings() });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = WHALE.view(j);
        },
        /* 인물 사진은 넣지 않는다 — 실사는 저작권이 걸리고 외부에서 받아오면
         * 오프라인에서 깨진다. 이름에서 만든 이니셜 아바타를 쓴다.
         * 색은 이름 해시라 같은 기관은 늘 같은 색이다. */
        /* 사진이 있으면 사진, 없으면 이니셜 아바타.
         * 위키미디어 CC 이미지는 **저작자 표시가 의무**라 출처를 하단에 싣는다. */
        face(f) {
            if (f.photo) {
                return `<img class="wh-photo" src="${f.photo}" alt="" loading="lazy"`
                    + ` title="${f.manager || ''} · ${f.photo_license || ''}`
                    + `${f.photo_artist ? ' · ' + f.photo_artist : ''}">`;
            }
            return WHALE.avatar(f.manager || f.fund);
        },

        avatar(name) {
            const s = String(name || '?');
            let h = 0;
            for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
            const hue = h % 360;
            /* 한글 이름이 들어온다 ("켄 그리핀"). 영문만 남기면 전부 사라져
             * `?` 만 뜬다 — 실제로 그랬다. 한글은 **첫 글자**를 쓴다. */
            const words = s.split(/\s+/).filter(Boolean);
            const ini = /[A-Za-z]/.test(s)
                ? (s.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean)
                    .slice(0, 2).map(w => w[0].toUpperCase()).join('') || s.slice(0, 2))
                : words.slice(0, 2).map(w => w[0]).join('');
            return `<i class="wh-avatar" aria-hidden="true" `
                + `style="background:hsl(${hue} 45% 28%);color:hsl(${hue} 70% 78%)">`
                + `${ini}</i>`;
        },

        view(j) {
            const stale = (j.lag_days || 0) > 100;
            const hero = '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   `<span class="ql-hero-label">${j.report_date} 분기 기준 · `
                +     `제출 ${j.filed_date}</span>`
                +   `<span class="ql-hero-big ${stale ? 'neg' : ''}">${cnt(j.lag_days)}일 전 자료</span>`
                +   '<span class="ql-hero-sub">13F 는 <b>분기 사진 한 장</b>입니다. '
                +     '분기 중에 샀다 판 종목은 흔적조차 없고, 공매도·옵션·채권은 '
                +     '아예 빠집니다.</span>'
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('기관', cnt(j.n_funds) + '개', '', `공시 ${cnt(j.n_rows)}행`)
                +   metric('신규 편입', cnt(j.n_new) + '건', '',
                           j.prev_date ? `${j.prev_date} 대비` : '비교 분기 없음')
                + '</div></div>';

            const verdict = '<div class="ql-verdict warn">' + ic('alert')
                + '<div><b>매매 신호가 아닙니다</b><span>'
                + `공개까지 ${cnt(j.lag_days)}일이 걸린 정보입니다 — 이미 시장에 `
                + '반영됐다고 보는 게 맞습니다. <b>누가 무엇을 들고 있었나</b>를 '
                + '아는 맥락으로만 쓰십시오.</span></div></div>';

            const mine = (j.matched || []).map(g => {
                const fs = g.funds.map(f =>
                    `<span class="wh-fund${f.is_new ? ' is-new' : ''}" title="${f.fund}`
                    + `${f.is_new ? ' — 직전 분기에 없던 종목' : ''}">${f.kr || f.fund}`
                    + `<small>${pctA(f.weight_pct, 2)}</small>`
                    + (f.match === 'fuzzy' ? '<em title="이름 유사도 매칭">추정</em>' : '')
                    + '</span>').join('');
                return `<tr><td><b>${g.ticker}</b><small>${g.issuer || ''}</small></td>`
                    + `<td>${cnt(g.n_funds)}개</td>`
                    + `<td>$${cnt(Math.round(g.total_usd / 1e6))}M</td>`
                    + `<td class="wh-funds">${fs}</td></tr>`;
            }).join('');

            /* `.ql-table td small` 이 display:block 이라 티커마다 줄이 바뀌고
             * 구분자가 다음 줄로 밀렸다. 칩으로 바꾼다. */
            /* 자르지 않는다 — 등록한 기관은 전부 보여야 한다.
             * 8개로 잘라서 절반이 안 보였다. */
            const funds = (j.funds || []).map(f =>
                '<tr><td class="wh-who">' + WHALE.face(f)
                + `<span><b>${f.kr || f.fund}</b>`
                + `<i>${f.manager || f.fund}</i></span></td>`
                + `<td>${cnt(f.n)}<small>${f.report_date || ''}`
                + `${f.stale ? ' · 최신 아님' : ''}</small></td>`
                + `<td>$${cnt(Math.round(f.total_usd / 1e9))}B</td>`
                + `<td class="wh-top">${f.top.map(t =>
                    `<span class="wh-chip${t.is_new ? ' is-new' : ''}"`
                    + `${t.is_new ? ' title="직전 분기에 없던 종목"' : ''}>`
                    + `${t.ticker}<b>${pctA(t.weight_pct, 1)}</b>`
                    + `${t.is_new ? '<em>신규</em>' : ''}</span>`)
                    .join('')}</td></tr>`).join('');

            return hero + verdict
                + (mine ? card('내 종목을 들고 있는 기관', 'list',
                    '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">종목</th><th scope="col">기관 수</th>'
                    + '<th scope="col">합계</th><th scope="col">기관 (포트폴리오 비중)</th>'
                    + '</tr></thead><tbody>' + mine + '</tbody></table></div>')
                    : empty('내 보유 종목을 들고 있는 기관이 없습니다. '
                            + '13F 는 미국 상장 주식만 다룹니다.'))
                + card('기관별 상위 보유', 'barChart',
                    '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">기관</th><th scope="col">종목</th>'
                    + '<th scope="col">신고액</th><th scope="col">상위 5</th>'
                    + '</tr></thead><tbody>' + funds + '</tbody></table></div>')
                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).map(c => c.replace(/\*\*/g, '')).join('<br>')
                + '</span></div>'
                + ((j.photo_credits || []).length
                    ? '<div class="ql-meta">' + ic('flask') + '인물 사진: 위키미디어 커먼즈 · '
                        + j.photo_credits.map(p => `${p[1]} (${p[0]})`).join(' · ')
                        + '</div>'
                    : '');
        }
    };

    global.QuantLab2 = {
        renderDiscoveryBadge: discoveryBadge,
        renderSurvival: () => SV.render(),
        renderAttribution: () => AT.render(),
        renderRegime: () => RG.render(),
        renderDiscovery: () => DS.render(),
        renderDca: () => DCA.render(),
        renderDiversification: () => DIV.render(),
        renderFlow: () => FLOW.render(),
        renderNextUp: () => NEXTUP.render(),
        renderWhales: () => WHALE.render()
    };
})(window);
