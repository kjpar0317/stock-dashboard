/* ============================================================================
 * quant_lab.js — QUANT LAB 3화면 (전략 검증소 / 포트폴리오 X-RAY / 리스크 센터)
 * ----------------------------------------------------------------------------
 * 기존 `quant_engine.js` 를 대체한다. 계산은 **하지 않는다** — 전부 백엔드
 * (`scripts/trade/quant_lab_api.py`)가 검증된 엔진 위에서 수행하고, 여기서는
 * 받은 숫자를 읽기 쉽게 보여주는 일만 한다.
 *
 * 옛 화면을 버린 이유(실측):
 *   - `data.js.historyPath` 는 217건 중 186건이 0봉, 최대 120봉이었다.
 *     DB `price_history` 에는 543종목 · 5년 · 656,920행이 있다.
 *   - 히스토리가 없으면 하루치 등락률을 총수익률·승률 100% 로 날조해
 *     진짜 백테스트와 같은 표에 섞어 정렬했다.
 *   - IS/OOS 를 둘 다 뒤에서 잘라 OOS 가 IS 에 포함돼 있었다.
 *   - "실제 포트폴리오" 라면서 등가중으로 VaR 을 계산했다.
 *
 * 화면 설계: **화면 하나당 질문 하나.** 상단에 질문을 쓰고, 그 아래
 * 판정을 크게 보여준 뒤, 근거를 순서대로 편다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n, o) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n, o) : '';

    let CATALOG = null;

    /* ── 포맷터 ─────────────────────────────────────────────── */
    const nz = (v) => (v === null || v === undefined || isNaN(v));
    const sgn = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat');
    function R(v, d = 4) { return nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + 'R'; }
    function pct(v, d = 1) { return nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%'; }
    function pctAbs(v, d = 1) { return nz(v) ? '—' : Number(v).toFixed(d) + '%'; }
    function num(v, d = 2) { return nz(v) ? '—' : Number(v).toFixed(d); }
    function cnt(v) { return nz(v) ? '—' : Number(v).toLocaleString(); }
    function money(v) {
        if (nz(v)) return '—';
        const cur = localStorage.getItem('tossCurrency') || 'KRW';
        const rate = global.CURRENT_USD_RATE || 1400;
        // 보유 테이블의 평가금액은 원화 기준으로 저장돼 있다
        return cur === 'KRW'
            ? Math.round(v).toLocaleString() + '원'
            : Math.round(v / rate).toLocaleString() + '달러';
    }

    function loading(host, msg) {
        // role="status" 로 진행 상황을 스크린리더에 알린다.
        // 이 화면들은 서버 계산이 수 초 걸려, 알림이 없으면 멈춘 것처럼 느껴진다.
        if (host) host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>' + (msg || '계산 중…') + '</div>';
    }
    function offline(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">QUANT LAB 은 5년치 가격 이력(<code>price_history</code>)을 '
            + '서버에서 계산합니다. 브라우저에는 그 데이터가 없습니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + e.message + '</div>' : '')
            + '</div>';
    }
    function empty(msg) { return '<div class="ql-empty">' + ic('alert') + (msg || '데이터 없음') + '</div>'; }

    async function api(path, body) {
        const opt = body ? {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        } : {};
        const res = await fetch(API + path, opt);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    async function ensureCatalog() {
        if (!CATALOG) CATALOG = await api('/api/lab/catalog');
        return CATALOG;
    }

    /* 부호 있는 값을 0 기준 양방향 막대로. 음수가 흔한 지표라 필수. */
    function signedBar(value, maxAbs, label, extra) {
        const m = maxAbs || 1;
        const w = Math.min(50, Math.abs(value || 0) / m * 50);
        const isNeg = (value || 0) < 0;
        return '<div class="ql-sbar">'
            + '<span class="ql-sbar-label">' + label + '</span>'
            + '<span class="ql-sbar-track">'
            +   '<i class="ql-sbar-zero"></i>'
            +   '<i class="ql-sbar-fill ' + (isNeg ? 'neg' : 'pos') + '" style="'
            +     (isNeg ? 'right:50%;' : 'left:50%;') + 'width:' + w + '%"></i>'
            + '</span>'
            + '<span class="ql-sbar-val ' + sgn(value) + '">' + R(value) + '</span>'
            + '<span class="ql-sbar-extra">' + (extra || '') + '</span>'
            + '</div>';
    }

    /* 0~100% 단순 막대 (비중 비교용) */
    function pctBar(v, max, cls) {
        const w = Math.max(0, Math.min(100, (v / (max || 100)) * 100));
        return '<span class="ql-pbar"><i class="' + (cls || '') + '" style="width:' + w + '%"></i></span>';
    }

    function metric(label, value, cls, hint) {
        return '<div class="ql-metric">'
            + '<span class="ql-metric-label">' + label + '</span>'
            + '<span class="ql-metric-value ' + (cls || '') + '">' + value + '</span>'
            + (hint ? '<span class="ql-metric-hint">' + hint + '</span>' : '')
            + '</div>';
    }

    function card(title, iconName, body, cls) {
        return '<section class="ql-card ' + (cls || '') + '">'
            + '<h3>' + ic(iconName) + title + '</h3>' + body + '</section>';
    }


    /* ══════════════════════════════════════════════════════════
     *  1. 전략 검증소 — "이 진입 신호에 값이 있는가?"
     * ════════════════════════════════════════════════════════ */
    const SL = {
        async render() {
            const host = $('ql-strategy-body');
            if (!host) return;
            loading(host, '전략 목록 불러오는 중…');
            let cat;
            try { cat = await ensureCatalog(); }
            catch (e) { host.innerHTML = offline(e); return; }

            const sigOpts = cat.signals.map(s =>
                `<option value="${s.key}"${s.key === 'ma_cross' ? ' selected' : ''}>${s.label}</option>`).join('');
            const strOpts = cat.strategies.map(s =>
                `<option value="${s.key}"${s.key === 'swing' ? ' selected' : ''}>${s.label}` +
                `${s.negative ? ' (기대값 음수)' : ''}</option>`).join('');

            host.innerHTML = ''
                + '<div class="ql-question">' + ic('compass')
                +   '<div><b>이 진입 신호에 값이 있는가?</b>'
                +   '<span>같은 청산 규칙을 <em>선택한 신호</em>와 <em>무조건 진입</em>에 각각 적용해 '
                +   '기대값을 비교합니다. 무조건 진입을 못 이기면 그 신호에는 값이 없습니다.</span></div>'
                + '</div>'
                + '<div class="ql-controls">'
                +   '<label>진입 신호<select id="ql-sl-signal">' + sigOpts + '</select></label>'
                +   '<label>청산 전략<select id="ql-sl-strategy">' + strOpts + '</select></label>'
                +   '<label>기간<select id="ql-sl-years">'
                +     '<option value="2">2년</option><option value="3">3년</option>'
                +     '<option value="4.5" selected>4.5년</option></select></label>'
                +   '<label>왕복 비용<select id="ql-sl-cost">'
                +     '<option value="0">0bp (비현실)</option><option value="5">5bp</option>'
                +     '<option value="15" selected>15bp (기본)</option><option value="30">30bp</option>'
                +     '</select></label>'
                +   '<label>종목 수<select id="ql-sl-syms">'
                +     '<option value="20">20 (빠름)</option><option value="40" selected>40</option>'
                +     '<option value="80">80 (느림)</option></select></label>'
                +   '<button id="ql-sl-run" class="tp-btn tp-btn-primary">검증</button>'
                + '</div>'
                + '<div id="ql-sl-result"></div>'
                + '<div id="ql-sl-compare"></div>';

            $('ql-sl-run').onclick = () => SL.run();
            SL.run();
        },

        async run() {
            const out = $('ql-sl-result');
            const body = {
                signal: $('ql-sl-signal').value,
                strategy: $('ql-sl-strategy').value,
                years: parseFloat($('ql-sl-years').value),
                cost_bp: parseFloat($('ql-sl-cost').value),
                max_symbols: parseInt($('ql-sl-syms').value, 10),
                entry_every: 5
            };
            loading(out, '5년치 가격으로 경로 시뮬레이션 중… (수 초 걸립니다)');
            $('ql-sl-compare').innerHTML = '';
            let j;
            try { j = await api('/api/lab/backtest', body); }
            catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = SL.draw(j);
            SL.compare(body);
        },

        draw(j) {
            const s = j.signal_stats, b = j.baseline_stats, e = j.edge;
            /* 판정 — |z| < 2 는 표본 우연으로 설명 가능하다.
             * 실측에서 방향 예측 알파는 z=+0.05 로 무작위와 구분되지 않았다. */
            let vc, vt, vd;
            if (!e.significant) {
                vc = 'warn'; vt = '값 없음';
                vd = `무조건 진입과 통계적으로 구분되지 않습니다 (z = ${num(e.z_score)}). ` +
                     `이 신호로 진입 시점을 고르는 것은 아무 날에나 사는 것과 같습니다.`;
            } else if (e.delta_r > 0) {
                vc = 'ok'; vt = '유의미한 우위';
                vd = `무조건 진입보다 ${R(e.delta_r)} 높습니다 (z = ${num(e.z_score)}). ` +
                     `단, 지속성은 아래 워크포워드로 확인하세요.`;
            } else {
                vc = 'ng'; vt = '유의미하게 열위';
                vd = `무조건 진입보다 ${R(e.delta_r)} 낮습니다 (z = ${num(e.z_score)}). ` +
                     `이 신호는 진입 시점을 나쁘게 만듭니다.`;
            }

            const maxAbs = Math.max(Math.abs(s.expectancy || 0), Math.abs(b.expectancy || 0),
                                    Math.abs(s.expectancy_net || 0), Math.abs(b.expectancy_net || 0)) || 0.05;

            const exits = j.exit_mix || {};
            const exTot = Object.values(exits).reduce((a, c) => a + c, 0) || 1;
            const exLabel = { 'STOP/TRAIL': '손절·트레일', 'TARGET': '목표 도달', 'TIME': '시간 만료' };
            const exRows = Object.keys(exits).map(k =>
                '<div class="ql-exit-row"><span>' + (exLabel[k] || k) + '</span>'
                + pctBar(exits[k] / exTot * 100, 100, 'ex-' + k.replace('/', ''))
                + '<b>' + Math.round(exits[k] / exTot * 100) + '%</b></div>').join('');

            const wf = j.walk_forward;
            const wfBody = (wf.is === null || wf.oos === null)
                ? '<div class="ql-note">표본이 부족해 앞뒤 구간을 나눌 수 없습니다 ' +
                  `(학습 ${cnt(wf.n_is)}건 / 검증 ${cnt(wf.n_oos)}건, 각 30건 이상 필요).</div>`
                : signedBar(wf.is, Math.max(Math.abs(wf.is), Math.abs(wf.oos)),
                        `학습 (~${wf.split_date})`, cnt(wf.n_is) + '건')
                  + signedBar(wf.oos, Math.max(Math.abs(wf.is), Math.abs(wf.oos)),
                        `검증 (${wf.split_date}~)`, cnt(wf.n_oos) + '건')
                  + '<div class="ql-note">' + (Math.abs(wf.decay) > 0.05
                        ? `구간에 따라 ${R(wf.decay)} 흔들립니다. 한쪽 구간의 우연일 수 있습니다.`
                        : '두 구간의 결과가 비슷합니다. 최소한 특정 시기에만 통하는 신호는 아닙니다.')
                  + '</div>';

            return ''
            + '<div class="ql-verdict ql-' + vc + '">'
            +   '<div class="ql-verdict-z">' + (e.z_score > 0 ? '+' : '') + num(e.z_score) + '<small>z</small></div>'
            +   '<div><div class="ql-verdict-title">' + vt + '</div>'
            +   '<div class="ql-verdict-desc">' + vd + '</div></div>'
            + '</div>'

            + card('기대값 비교 — 비용 반영 전후', 'scale', ''
                + '<div class="ql-sbar-head"><span>비용 반영 전</span></div>'
                + signedBar(s.expectancy, maxAbs, j.signal_label, cnt(s.n) + '건')
                + signedBar(b.expectancy, maxAbs, '무조건 진입 (기준)', cnt(b.n) + '건')
                + '<div class="ql-sbar-head"><span>왕복 비용 ' + j.cost_bp + 'bp 반영 후</span></div>'
                + signedBar(s.expectancy_net, maxAbs, j.signal_label, cnt(s.n) + '건')
                + signedBar(b.expectancy_net, maxAbs, '무조건 진입 (기준)', cnt(b.n) + '건')
                + '<div class="ql-note">' + ic('alert')
                +   `비용 ${j.cost_bp}bp 가 기대값을 ${R((s.expectancy || 0) - (s.expectancy_net || 0))} 깎습니다. `
                +   `손절폭(ATR×${j.exit_profile.stop_atr})이 좁을수록 같은 수수료가 R 기준으로 더 크게 작용합니다.`
                + (j.breakeven_cost_bp ? ` 이 신호는 왕복 <b>${j.breakeven_cost_bp}bp</b>에서 손익분기입니다.` : '')
                + '</div>')

            + '<div class="ql-grid">'
            +   card('신호 성적', 'target', '<div class="ql-metrics">'
                + metric('표본', cnt(s.n) + '건')
                + metric('기대값', R(s.expectancy), sgn(s.expectancy))
                + metric('비용 반영', R(s.expectancy_net), sgn(s.expectancy_net))
                + metric('승률', pctAbs(s.win_rate_shrunk), '', '실측 ' + pctAbs(s.win_rate) + ' 축소추정')
                + metric('손익비', num(s.payoff))
                + metric('평균 보유', num(s.avg_days, 1) + '일')
                + '</div>')
            +   card('청산 사유 분포', 'sliders', exRows
                + '<div class="ql-note">목표 도달 비율이 낮고 손절·트레일이 대부분이면, '
                + '수익은 소수의 큰 승리에서 나옵니다. 그 꼬리를 자르면 기대값이 사라집니다.</div>')
            + '</div>'

            + card('워크포워드 — 시기를 나눠 다시 본다', 'calendar', wfBody)

            + '<div class="ql-meta">'
            +   ic('flask') + `유니버스 ${cnt(j.symbols_used)}종목 · ${j.years}년 · `
            +   `청산 ATR 손절 ${j.exit_profile.stop_atr} / 목표 ${j.exit_profile.target_atr} / `
            +   `트레일 ${j.exit_profile.trail_atr} / 최대 ${j.exit_profile.max_days}일 · `
            +   `신호는 종가 확정 후 <b>다음 봉</b>에 체결 가정`
            + '</div>';
        },

        async compare(base) {
            const host = $('ql-sl-compare');
            loading(host, '8개 청산 전략 비교 중…');
            let j;
            try {
                j = await api(`/api/lab/compare?signal=${base.signal}&years=${base.years}` +
                              `&cost_bp=${base.cost_bp}&max_symbols=25`);
            } catch (e) { host.innerHTML = ''; return; }
            if (!j.available || !j.rows.length) { host.innerHTML = ''; return; }

            /* 막대는 **0 을 가운데 두고 좌우로** 뻗는다.
             * 예전에는 |비용 반영| 크기로 그려서 **나쁠수록 길었다** —
             * 최악인 스켈핑이 제일 길고 최선인 데이트레이딩이 점이었다.
             * 길이가 곧 성과로 읽히니 정반대로 전달됐다. */
            const maxAbs = Math.max(...j.rows.map(r => Math.abs(r.expectancy_net || 0))) || 0.05;
            const bar = (v) => {
                const w = Math.min(50, Math.abs(v) / maxAbs * 50);
                return '<span class="ql-dbar">'
                    + `<i class="ql-dbar-fill ${v < 0 ? 'neg' : 'pos'}" `
                    +   `style="${v < 0 ? 'right:50%' : 'left:50%'};width:${w}%"></i></span>`;
            };
            /* 손익분기 승률 = 1/(1+손익비). 실제 승률과 나란히 놓지 않으면
             * "승률 22%"가 낮아 보이고 "승률 46%"가 높아 보인다 — 손익비가
             * 다르면 비교가 안 된다. */
            const beWin = (p) => (p && p > 0) ? 100 / (1 + p) : null;
            const rows = j.rows.map(r => {
                const be = beWin(r.payoff);
                const pass = be !== null && r.win_rate > be;
                return `<tr>
                <td><b>${r.label}</b></td>
                <td class="${sgn(r.expectancy)}">${R(r.expectancy)}</td>
                <td class="${sgn(r.expectancy_net)}"><b>${R(r.expectancy_net)}</b></td>
                <td>${pctAbs(r.win_rate)}</td>
                <td class="${pass ? '' : 'neg'}">${be === null ? '—' : pctAbs(be)}
                    <small>${pass ? '넘김' : '미달'}</small></td>
                <td>${num(r.payoff)}</td>
                <td>${num(r.avg_days, 1)}일</td>
                <td>${cnt(r.n)}</td>
                <td class="ql-bar-cell">${bar(r.expectancy_net)}</td></tr>`; }).join('');

            const nGross = j.rows.filter(r => r.expectancy > 0).length;
            const nNet = j.rows.filter(r => r.expectancy_net > 0).length;

            /* 비용이 결론을 뒤집는다는 사실을 표보다 **위에** 둔다.
             * 첫 열(비용 전)만 보면 "된다"로 읽힌다. */
            const verdict = '<div class="ql-verdict ' + (nNet ? 'warn' : 'bad') + '">'
                + ic('alert') + '<div><b>'
                + (nNet ? `비용을 빼면 ${nNet}종만 남습니다`
                        : '비용을 빼면 남는 전략이 없습니다')
                + `</b><span>비용 전에는 <b>${nGross}/${j.rows.length}</b>종이 양수지만, `
                + `왕복 ${num(j.cost_bp ?? 15, 0)}bp 를 반영하면 `
                + `<b>${nNet}/${j.rows.length}</b>종입니다. `
                + '<b>첫 열이 아니라 두 번째 열이 결론</b>입니다.</span></div></div>';

            host.innerHTML = card('청산 전략 8종 비교 — 같은 진입 신호 기준', 'barChart',
                verdict
                + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">전략</th><th scope="col">기대값<small>비용 전</small></th>'
                + '<th scope="col">비용 반영<small>결론</small></th><th scope="col">승률</th>'
                + '<th scope="col">손익분기 승률</th>'
                + '<th scope="col">손익비</th><th scope="col">보유</th><th scope="col">표본</th>'
                + '<th scope="col"></th></tr></thead>'
                + '<tbody>' + rows + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('flask')
                + '<b>손익분기 승률</b>은 1/(1+손익비)입니다. 실제 승률이 이걸 넘어야 '
                + '비용 전 기대값이 양수가 됩니다. 손익비가 다르면 승률만으로는 '
                + '비교할 수 없습니다 — 승률 46%가 승률 16%보다 나쁠 수 있습니다.</div>'
                + '<div class="ql-note">' + ic('shield')
                + '실측 12,476건에서 재현된 것은 <b>방향 예측이 아니라 청산 규칙</b>이었습니다. '
                + '진입 신호를 바꿔도 이 순위는 거의 변하지 않습니다 — 그래서 이 표가 1급 비교 대상입니다.'
                + '</div>');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  2. 포트폴리오 X-RAY — "내 포트폴리오는 어디에 쏠려 있는가?"
     * ════════════════════════════════════════════════════════ */
    const PF = {
        async render() {
            const host = $('ql-portfolio-body');
            if (!host) return;
            host.innerHTML = ''
                + '<div class="ql-question">' + ic('target')
                +   '<div><b>내 포트폴리오는 어디에 쏠려 있는가?</b>'
                +   '<span>비중이 아니라 <em>리스크 기여도</em>로 봅니다. 5% 비중이 전체 변동성의 '
                +   '20%를 만들고 있다면, 그건 5% 포지션이 아닙니다.</span></div>'
                + '</div>'
                + '<div class="ql-controls">'
                +   '<label>계좌<select id="ql-pf-source">'
                +     '<option value="virtual">모의계좌</option><option value="toss">토스증권</option>'
                +     '<option value="kis">한국투자증권</option></select></label>'
                +   '<label>목표 비중<select id="ql-pf-method">'
                +     '<option value="mv" selected>최소분산 (공분산)</option>'
                +     '<option value="rp">리스크 패리티</option>'
                +     '<option value="ew">등가중</option></select></label>'
                +   '<label>추정 기간<select id="ql-pf-years">'
                +     '<option value="1">1년</option><option value="2" selected>2년</option>'
                +     '<option value="3">3년</option></select></label>'
                +   '<button id="ql-pf-run" class="tp-btn tp-btn-primary">분석</button>'
                + '</div>'
                + '<div id="ql-pf-result"></div>';
            $('ql-pf-run').onclick = () => PF.run();
            PF.run();
        },

        async run() {
            const out = $('ql-pf-result');
            loading(out, '공분산 추정 중…');
            let j;
            try {
                j = await api('/api/lab/portfolio', {
                    source: $('ql-pf-source').value, method: $('ql-pf-method').value,
                    years: parseFloat($('ql-pf-years').value),
                    holdings: PF.clientHoldings()
                });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = PF.draw(j);
        },

        /* 브라우저가 섹터를 알고 있으면 같이 보낸다 (DB 보유 테이블에는 섹터가 없다) */
        clientHoldings() {
            try {
                const h = (global.brokerAdapter && global.brokerAdapter.getHoldings)
                    ? global.brokerAdapter.getHoldings()
                    : ((global.REPORTS_HISTORY || [])[0] || {}).holdings;
                if (!h || !h.length) return null;
                return h.map(x => ({
                    symbol: x.symbol, name: x.name, sector: x.sector,
                    eval_amount: x.evalAmount || x.eval_amount || 0,
                    price: x.currentPrice || x.rawPrice || 0
                })).filter(x => x.symbol);
            } catch (e) { return null; }
        },

        draw(j) {
            const est = j.estimation;
            const maxW = Math.max(...j.rows.map(r => Math.max(r.current, r.target, r.risk_contrib))) || 100;

            /* 비중보다 리스크 기여가 큰 종목 = 숨은 집중 */
            const hidden = j.rows.filter(r => r.risk_contrib > r.current * 1.5 && r.risk_contrib > 5)
                                 .sort((a, b) => b.risk_contrib - a.risk_contrib);

            const rows = j.rows.slice().sort((a, b) => b.current - a.current).map(r => `<tr>
                <td><b>${r.symbol}</b><small>${r.name || ''}</small></td>
                <td class="ql-bar-cell">${pctBar(r.current, maxW, 'cur')}<span>${pctAbs(r.current)}</span></td>
                <td class="ql-bar-cell">${pctBar(r.target, maxW, 'tgt')}<span>${pctAbs(r.target)}</span></td>
                <td class="ql-bar-cell">${pctBar(r.risk_contrib, maxW, r.risk_contrib > r.current * 1.5 ? 'risk-hot' : 'risk')}
                    <span class="${r.risk_contrib > r.current * 1.5 ? 'neg' : ''}">${pctAbs(r.risk_contrib)}</span></td>
                <td>${pctAbs(r.vol)}</td></tr>`).join('');

            const acts = (j.actions || []).map(a => `<div class="ql-action ${a.action === 'BUY' ? 'buy' : 'sell'}">
                <span class="ql-action-tag">${a.action === 'BUY' ? '매수' : '매도'}</span>
                <b>${a.symbol}</b><span class="ql-action-name">${a.name || ''}</span>
                <span class="ql-action-delta">${pctAbs(a.current)} → ${pctAbs(a.target)}
                    <em class="${sgn(a.delta)}">${pct(a.delta)}</em></span>
                <span class="ql-action-qty">${cnt(a.qty)}주</span></div>`).join('')
                || '<div class="ql-note">현재 비중이 목표에 근접합니다. 조정할 것이 없습니다.</div>';

            const sectors = (j.sectors || []).map(s =>
                `<div class="ql-sector ${s.over_limit ? 'over' : ''}">
                    <span>${s.sector}</span>${pctBar(s.weight, 100, s.over_limit ? 'neg' : 'cur')}
                    <b>${pctAbs(s.weight)}</b><small>${s.n}종목</small></div>`).join('');

            return ''
            + '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     '<span class="ql-hero-label">연 변동성</span>'
            +     '<span class="ql-hero-flow"><b class="neg">' + pctAbs(j.vol_current) + '</b>'
            +       '<i>→</i><b class="pos">' + pctAbs(j.vol_target) + '</b></span>'
            +     '<span class="ql-hero-sub">목표 비중으로 옮기면 <b>' + pctAbs(j.vol_reduction)
            +       '</b> 낮아집니다</span>'
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('유효 종목 수', num(j.effective_n, 2), '',
                      j.n_assets + '종목 보유 · 1/HHI')
            +     metric('평균 상관', num(j.avg_correlation, 3), '',
                      j.avg_correlation > 0.5 ? '높음 — 분산 효과 제한' : '분산 여지 있음')
            +     metric('회전율', pctAbs(j.turnover), '',
                      '비용 ' + money(j.rebalance_cost))
            +   '</div>'
            + '</div>'

            + (est.reliable ? '' : '<div class="ql-warn">' + ic('alert')
                + '<b>추정 신뢰도 낮음</b> — ' + est.note + '</div>')
            + ((j.dropped && j.dropped.length) ? '<div class="ql-warn soft">' + ic('alert')
                + '가격 이력이 없어 <b>' + j.dropped.join(', ') + '</b> 을(를) 제외했습니다. '
                + '<code>python -m scripts.report.price_store</code> 로 적재하면 포함됩니다.</div>' : '')
            + (j.weight_note ? '<div class="ql-warn soft">' + ic('alert') + j.weight_note + '</div>' : '')

            + (hidden.length ? card('숨은 집중 — 비중보다 리스크가 큰 종목', 'alert',
                hidden.map(r => `<div class="ql-hidden-row"><b>${r.symbol}</b>
                    <span>비중 ${pctAbs(r.current)}</span><i>→</i>
                    <span class="neg">리스크 기여 ${pctAbs(r.risk_contrib)}</span>
                    <small>변동성 ${pctAbs(r.vol)}</small></div>`).join('')
                + '<div class="ql-note">이 종목들은 비중이 작아 보이지만 포트폴리오 변동성의 '
                + '상당 부분을 만들고 있습니다. 비중만 보면 놓칩니다.</div>', 'ql-alert-card') : '')

            + card('비중 · 리스크 기여도', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table ql-table-bars"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">현재 비중</th><th scope="col">목표 비중</th><th scope="col">리스크 기여</th><th scope="col">변동성</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>')

            + '<div class="ql-grid">'
            +   card('리밸런싱', 'sliders', acts)
            +   card('섹터 집중', 'tag', sectors || '<div class="ql-note">섹터 정보가 없습니다.</div>')
            + '</div>'

            + '<div class="ql-meta">' + ic('flask')
            +   `${j.n_assets}종목 · 관측 ${cnt(j.n_obs)}일 · 자산당 ${est.obs_per_asset}관측 · `
            +   `공분산은 Ledoit-Wolf 20% 축소 후 역행렬, 공매도 금지`
            + '</div>';
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  3. 리스크 센터 — "최악의 경우 얼마를 잃는가?"
     * ════════════════════════════════════════════════════════ */
    const RK = {
        async render() {
            const host = $('ql-risk-body');
            if (!host) return;
            host.innerHTML = ''
                + '<div class="ql-question">' + ic('shield')
                +   '<div><b>최악의 경우 얼마를 잃는가?</b>'
                +   '<span>가상의 “-20% 충격” 대신 <em>실제로 일어났던 구간</em>의 수익률을 '
                +   '현재 보유 비중에 그대로 재생합니다.</span></div>'
                + '</div>'
                + '<div class="ql-controls">'
                +   '<label>계좌<select id="ql-rk-source">'
                +     '<option value="virtual">모의계좌</option><option value="toss">토스증권</option>'
                +     '<option value="kis">한국투자증권</option></select></label>'
                +   '<label>기간<select id="ql-rk-years">'
                +     '<option value="3" selected>3년</option><option value="5">5년</option></select></label>'
                +   '<label>손실 기간<select id="ql-rk-horizon">'
                +     '<option value="1" selected>1일</option><option value="5">1주</option>'
                +     '<option value="20">1개월</option></select></label>'
                +   '<button id="ql-rk-run" class="tp-btn tp-btn-primary">분석</button>'
                + '</div>'
                + '<div id="ql-rk-result"></div>'
                + '<div id="ql-rk-sizer"></div>';
            $('ql-rk-run').onclick = () => RK.run();
            RK.run();
            RK.sizer();
        },

        async run() {
            const out = $('ql-rk-result');
            loading(out, '5년 이력으로 손실 분포 계산 중…');
            let j;
            try {
                j = await api('/api/lab/risk', {
                    source: $('ql-rk-source').value,
                    years: parseFloat($('ql-rk-years').value),
                    horizon_days: parseInt($('ql-rk-horizon').value, 10),
                    holdings: PF.clientHoldings()
                });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = RK.draw(j) + '<div id="ql-rk-corr"></div>';
            RK.corr();
        },

        /* 상관 붕괴 — 평균 상관 하나로는 안 보이는 것.
         * 분산은 평상시가 아니라 위기 때 필요하다. 그때 상관이 1로 수렴하면
         * 종목 수가 많아도 한 방향에 걸고 있는 것이다. */
        async corr() {
            const host = $('ql-rk-corr');
            if (!host) return;
            loading(host, '롤링 상관 계산 중…');
            let j;
            try {
                j = await api('/api/lab/correlation', {
                    source: $('ql-rk-source').value,
                    years: parseFloat($('ql-rk-years').value),
                    holdings: PF.clientHoldings()
                });
            } catch (e) { host.innerHTML = ''; return; }
            if (!j.available) { host.innerHTML = ''; return; }

            const W = 1000, H = 140;
            const vals = j.series.map(d => d.corr);
            const lo = Math.min(...vals, 0), hi = Math.max(...vals, 1);
            const y = v => H - ((v - lo) / (hi - lo || 1)) * H;
            const pts = j.series.map((d, i) =>
                (i / (j.series.length - 1) * W).toFixed(1) + ',' + y(d.corr).toFixed(1));
            const mean = j.mean;

            const stress = (j.stress || []).map(s => `<div class="ql-stress">
                <div class="ql-stress-head"><b>${s.label}</b><small>${s.period}</small></div>
                <div class="ql-stress-val ${s.delta >= 0.15 ? 'neg' : ''}">${num(s.corr, 2)}</div>
                <div class="ql-stress-worst">평상시 대비 ${s.delta >= 0 ? '+' : ''}${num(s.delta, 2)}</div>
            </div>`).join('');

            host.innerHTML = card('상관 붕괴 — 분산은 위기에 배신하는가', 'activity',
                (j.verdict ? '<div class="ql-vbox ql-' + j.verdict[0] + '">'
                    + ic(j.verdict[0] === 'ok' ? 'check' : 'alert')
                    + '<span>' + j.verdict[1] + '</span></div>' : '')
                + '<div class="ql-uw"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="ql-uw-svg">'
                +   `<line x1="0" y1="${y(mean)}" x2="${W}" y2="${y(mean)}" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`
                +   `<polyline points="${pts.join(' ')}" fill="none" stroke="#f59e0b" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`
                + '</svg><div class="ql-uw-axis">'
                +   `<span>${j.series[0].date}</span>`
                +   `<span>점선 = 평균 ${num(mean, 2)} · 최고 ${num(j.max, 2)} (${j.peak_date})</span>`
                +   `<span>${j.series[j.series.length - 1].date}</span></div></div>`
                + '<div class="ql-metrics ql-metrics-inline">'
                +   metric('현재', num(j.current, 2), j.current > mean ? 'neg' : '')
                +   metric('평상시 평균', num(mean, 2))
                +   metric('최고', num(j.max, 2), 'neg', j.peak_date)
                +   metric('창', j.window + '일', '', j.n_assets + '종목')
                + '</div>'
                + (stress ? '<div class="ql-stress-grid" style="margin-top:1rem">' + stress + '</div>' : '')
                + '<div class="ql-note">' + ic('alert')
                + '평균 상관 하나로는 <b>언제</b> 분산이 무너지는지 알 수 없습니다. '
                + '위기 구간에서 선이 치솟으면, 종목을 더 늘려도 같은 방향에 거는 것입니다 — '
                + '필요한 것은 종목 수가 아니라 <b>성격이 다른 자산</b>입니다.</div>');
        },

        /* 언더워터 — 캔버스 대신 SVG. 리사이즈·다크테마·선명도 모두 유리하다. */
        underwater(series) {
            if (!series || series.length < 2) return '';
            const W = 1000, H = 160;
            const min = Math.min(...series.map(d => d.dd), -1);
            const pts = series.map((d, i) => {
                const x = i / (series.length - 1) * W;
                const y = (d.dd / min) * H;
                return x.toFixed(1) + ',' + y.toFixed(1);
            });
            return '<div class="ql-uw">'
                + '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="ql-uw-svg">'
                +   '<defs><linearGradient id="uwg" x1="0" y1="0" x2="0" y2="1">'
                +     '<stop offset="0%" stop-color="#ff2a55" stop-opacity=".05"/>'
                +     '<stop offset="100%" stop-color="#ff2a55" stop-opacity=".45"/></linearGradient></defs>'
                +   '<polygon points="0,0 ' + pts.join(' ') + ' ' + W + ',0" fill="url(#uwg)"/>'
                +   '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#ff2a55" '
                +     'stroke-width="1.5" vector-effect="non-scaling-stroke"/>'
                + '</svg>'
                + '<div class="ql-uw-axis"><span>' + series[0].date + '</span>'
                +   '<span>' + pctAbs(min) + ' 최저</span>'
                +   '<span>' + series[series.length - 1].date + '</span></div>'
                + '</div>';
        },

        heatmap(c) {
            if (!c || !c.symbols || c.symbols.length < 2) return '';
            const n = c.symbols.length;
            const head = '<div class="ql-hm-cell ql-hm-corner"></div>' +
                c.symbols.map(s => '<div class="ql-hm-cell ql-hm-head">' + s + '</div>').join('');
            const body = c.matrix.map((row, i) =>
                '<div class="ql-hm-cell ql-hm-head">' + c.symbols[i] + '</div>' +
                row.map((v, k) => {
                    // 상관 0 = 투명, +1 = 붉게. 대각선은 무의미하므로 죽인다.
                    const a = i === k ? 0 : Math.min(1, Math.abs(v)) * 0.75;
                    const col = v >= 0 ? '255,42,85' : '59,130,246';
                    return '<div class="ql-hm-cell' + (i === k ? ' diag' : '') + '" style="background:rgba('
                        + col + ',' + a.toFixed(2) + ')" title="' + c.symbols[i] + ' ↔ '
                        + c.symbols[k] + ' : ' + v + '">' + (i === k ? '' : v.toFixed(2)) + '</div>';
                }).join('')).join('');
            return '<div class="ql-hm" style="grid-template-columns:repeat(' + (n + 1) + ',minmax(46px,1fr))">'
                + head + body + '</div>'
                + '<div class="ql-note">붉을수록 함께 움직입니다. 붉은 칸이 많으면 종목 수가 많아도 '
                + '한 방향에 걸고 있는 것이라 분산이 되지 않습니다.</div>';
        },

        draw(j) {
            const v = j.var;
            const hz = { 1: '하루', 5: '한 주', 20: '한 달' }[j.horizon_days] || (j.horizon_days + '일');

            const stress = (j.stress || []).map(s => `<div class="ql-stress">
                <div class="ql-stress-head"><b>${s.label}</b><small>${s.period}</small></div>
                <div class="ql-stress-val ${sgn(s.return)}">${pct(s.return, 1)}</div>
                ${s.amount !== null && s.amount !== undefined
                    ? `<div class="ql-stress-amt">${money(s.amount)}</div>` : ''}
                <div class="ql-stress-worst">최악의 하루 ${pct(s.worst_day, 1)}</div></div>`).join('')
                || '<div class="ql-note">해당 구간에 겹치는 거래일이 없습니다.</div>';

            const dds = (j.top_drawdowns || []).map((d, i) => `<tr>
                <td>${i + 1}</td><td>${d.start}</td><td>${d.end}</td>
                <td class="neg"><b>${pct(d.depth, 1)}</b></td><td>${d.days}일</td>
                <td>${d.recovered ? '회복' : '<span class="neg">미회복</span>'}</td></tr>`).join('');

            return ''
            + '<div class="ql-hero ql-hero-risk">'
            +   '<div class="ql-hero-main">'
            +     '<span class="ql-hero-label">' + hz + ' 최대 손실 (95% 신뢰)</span>'
            +     '<span class="ql-hero-big neg">' + pct(v.var95, 2) + '</span>'
            +     (v.var95_amount !== null && v.var95_amount !== undefined
                    ? '<span class="ql-hero-money">' + money(v.var95_amount) + '</span>' : '')
            +     '<span class="ql-hero-sub">' + hz + ' 중 20번에 1번은 이보다 더 잃습니다. '
            +       '그때의 평균 손실은 <b class="neg">' + pct(v.cvar95, 2) + '</b>'
            +       (v.cvar95_amount !== null && v.cvar95_amount !== undefined
                        ? ' (' + money(v.cvar95_amount) + ')' : '') + ' 입니다.</span>'
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('최대 낙폭', pct(j.mdd, 1), 'neg', j.years + '년 기준')
            +     metric('현재 낙폭', pct(j.current_dd, 1), j.current_dd < -5 ? 'neg' : '')
            +     metric('연 변동성', pctAbs(j.ann_vol), '', '샤프 ' + num(j.sharpe))
            +   '</div>'
            + '</div>'

            + '<div class="ql-basis">' + ic('shield') + '계산 기준: <b>' + j.basis + '</b> · '
            +   j.n_assets + '종목 · 관측 ' + cnt(j.n_obs) + '일'
            +   (j.total_value ? ' · 평가액 ' + money(j.total_value) : '') + '</div>'

            + (v.reliable ? '' : '<div class="ql-warn">' + ic('alert')
                + '<b>꼬리 표본 ' + v.tail_n + '건</b> — 20건 미만이면 CVaR 은 사실상 최악 며칠의 '
                + '평균일 뿐입니다. 이 수치를 정밀한 추정으로 받아들이지 마십시오.</div>')

            + card('실제 위기 구간 재생', 'flask', '<div class="ql-stress-grid">' + stress + '</div>'
                + '<div class="ql-note">현재 보유 비중을 그 시기에 그대로 들고 있었다면 겪었을 손익입니다. '
                + '당시 실제로 보유하지 않았더라도, 이 조합이 그런 국면에 어떻게 반응하는지를 보여줍니다.</div>')

            + card('낙폭 추이 (Underwater)', 'activity', RK.underwater(j.underwater)
                + (dds ? '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">#</th><th scope="col">시작</th><th scope="col">종료</th><th scope="col">깊이</th><th scope="col">기간</th><th scope="col">회복</th>'
                    + '</tr></thead><tbody>' + dds + '</tbody></table></div>' : ''))

            + card('종목 간 상관', 'compass', RK.heatmap(j.correlation)
                + '<div class="ql-metrics ql-metrics-inline">'
                + metric('평균 상관', num(j.avg_correlation, 3))
                + metric('분산 점수', j.diversification + '/100')
                + '</div>');
        },

        /* 포지션 사이저 — 봇과 같은 함수를 호출한다.
         * 예전에는 같은 계산을 JS로 따로 둬서 봇 결과와 최대 69% 어긋났다. */
        async sizer() {
            const host = $('ql-rk-sizer');
            let cat;
            try { cat = await ensureCatalog(); } catch (e) { return; }
            const opts = cat.strategies.map(s =>
                `<option value="${s.key}"${s.key === 'swing' ? ' selected' : ''}>${s.label}</option>`).join('');
            host.innerHTML = card('포지션 사이저 — 봇과 같은 계산', 'sliders', ''
                + '<div class="ql-controls ql-controls-inline">'
                +   '<label>총자산<input type="number" id="ql-sz-assets" value="100000" step="1000"></label>'
                +   '<label>진입가<input type="number" id="ql-sz-entry" value="150" step="0.01"></label>'
                +   '<label>ATR<input type="number" id="ql-sz-atr" value="4.2" step="0.01"></label>'
                +   '<label>전략<select id="ql-sz-strategy">' + opts + '</select></label>'
                +   '<label>계좌 리스크<span class="tp-field">'
                +     '<input type="number" id="ql-sz-risk" value="1" step="0.1" min="0.1" max="5">'
                +     '<span class="tp-unit">%</span></span></label>'
                +   '<button id="ql-sz-run" class="tp-btn tp-btn-primary">계산</button>'
                + '</div><div id="ql-sz-out"></div>'
                + '<div class="ql-note">' + ic('shield')
                + '<b>손실 금액을 먼저 정하고 수량을 역산</b>합니다. 손절이 넓은 종목은 자동으로 적게 삽니다. '
                + '고정 비중(항상 10% 등)은 변동성 큰 종목에서 과도한 리스크를 집니다.</div>');
            $('ql-sz-run').onclick = () => RK.calcSize();
            RK.calcSize();
        },

        async calcSize() {
            const out = $('ql-sz-out');
            let j;
            try {
                j = await api('/api/lab/size', {
                    total_assets: parseFloat($('ql-sz-assets').value),
                    entry: parseFloat($('ql-sz-entry').value),
                    atr: parseFloat($('ql-sz-atr').value),
                    strategy: $('ql-sz-strategy').value,
                    risk_pct: parseFloat($('ql-sz-risk').value)
                });
            } catch (e) { out.innerHTML = empty('서버 응답 없음'); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }

            const m = j.measured || {};
            out.innerHTML = '<div class="ql-size-result">'
                + '<div class="ql-size-qty"><b>' + cnt(j.qty) + '</b><span>주</span>'
                +   '<small>' + money(j.amount) + ' · 비중 ' + pctAbs(j.weight_pct) + '</small></div>'
                + '<div class="ql-metrics">'
                +   metric('손절', num(j.stop, 2), 'neg')
                +   metric('목표', num(j.target, 2), 'pos')
                +   metric('본전 이동', num(j.breakeven_trigger, 2))
                +   metric('R:R', num(j.rr))
                +   metric('최대 보유', j.max_days + '일')
                +   metric('실제 리스크', money(j.risk_amount), '',
                        pctAbs(j.risk_pct_of_account) + ' of 계좌')
                + '</div>'
                + (j.capped_by ? '<div class="ql-warn soft">' + ic('alert')
                    + (j.capped_by === 'concentration' ? '단일 종목 25% 상한' : '유동성 상한')
                    + '에 걸려 수량이 줄었습니다.</div>' : '')
                + (j.scale_out && j.scale_out.length ? '<div class="ql-note">부분 익절: '
                    + j.scale_out.map(s => num(s[0], 2) + ' 에서 ' + Math.round(s[1] * 100) + '%').join(', ')
                    + '</div>' : '')
                + (m.expectancy !== undefined ? '<div class="ql-note">' + ic('barChart')
                    + `${j.strategy_label} 실측: 기대값 ${R(m.expectancy, 3)} · `
                    + `승률 ${pctAbs(m.win_rate * 100)} · 손익비 ${m.payoff} · 평균 ${m.hold_days}일`
                    + (m.expectancy <= 0 ? ' <b class="neg">— 기대값이 음수인 전략입니다.</b>' : '')
                    + '</div>' : '')
                + '</div>';
        }
    };

    /* ── 공용 차트 툴팁 ────────────────────────────────────────
     * 옛 quant_engine.js 가 전역으로 제공하던 것으로, SIGNAL HUB 의
     * 캔버스 차트가 아직 쓴다. 모듈을 걷어내면서 같이 사라지면 안 되므로
     * 여기로 옮겼다. (`typeof` 가드로 호출되므로 이름을 유지한다) */
    let _tip = null;
    global._showChartTooltip = function (e, content) {
        if (!_tip) {
            _tip = document.createElement('div');
            _tip.id = 'quant-common-tooltip';
            _tip.className = 'ql-tooltip';
            document.body.appendChild(_tip);
        }
        _tip.innerHTML = content;
        _tip.style.display = 'block';
        let x = e.pageX + 15, y = e.pageY + 15;
        if (x + _tip.offsetWidth > window.innerWidth + window.scrollX) x = e.pageX - _tip.offsetWidth - 15;
        if (y + _tip.offsetHeight > window.innerHeight + window.scrollY) y = e.pageY - _tip.offsetHeight - 15;
        _tip.style.left = x + 'px';
        _tip.style.top = y + 'px';
        _tip.style.opacity = '1';
    };
    global._hideChartTooltip = function () {
        if (_tip) { _tip.style.opacity = '0'; _tip.style.display = 'none'; }
    };

    global.QuantLab = {
        renderStrategy: () => SL.render(),
        renderPortfolio: () => PF.render(),
        renderRisk: () => RK.render()
    };
})(window);
