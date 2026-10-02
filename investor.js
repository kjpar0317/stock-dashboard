/* ============================================================================
 * investor.js — 증권사가 안 해주는 것들
 *   MY TAX      세후 손익 · 절세 매도 플래너
 *   FX SPLIT    환율 · 주가 손익 분해
 *   POST-SALE   매도 후 추적
 *   AVG DOWN    평단가 시뮬레이터
 *   HABITS      매매 습관 진단
 *   DIVIDEND    배당 캘린더
 * ----------------------------------------------------------------------------
 * quant_lab.js 와 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/investor_api.py`)가 하고 여기서는 보여주기만 한다.
 *
 * 증권사가 이미 잘하는 것(호가·체결·차트)은 만들지 않는다. 여기 있는 것은
 * 증권사가 **구조적으로 안 하는** 것들이다 — 세금·환율처럼 계좌 밖 맥락이
 * 필요하거나, 매매 습관처럼 사용자에게 불리한 사실이거나.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    const $ = (id) => document.getElementById(id);
    const ic = (n, o) => (global.Icons && global.Icons.icon) ? global.Icons.icon(n, o) : '';

    const nz = (v) => (v === null || v === undefined || isNaN(v));
    const sgn = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat');
    const pct = (v, d = 2) => nz(v) ? '—' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';
    const pctA = (v, d = 1) => nz(v) ? '—' : Number(v).toFixed(d) + '%';
    const num = (v, d = 2) => nz(v) ? '—' : Number(v).toFixed(d);
    const cnt = (v) => nz(v) ? '—' : Number(v).toLocaleString();
    const won = (v) => nz(v) ? '—' : (v > 0 ? '+' : '') + Math.round(v).toLocaleString() + '원';
    const wonA = (v) => nz(v) ? '—' : Math.round(v).toLocaleString() + '원';

    function loading(host, msg) {
        if (host) host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>' + (msg || '계산 중…') + '</div>';
    }
    function offline(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">이 화면은 보유·체결 기록을 서버에서 계산합니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + e.message + '</div>' : '')
            + '</div>';
    }
    const empty = (m) => '<div class="ql-empty">' + ic('alert') + (m || '데이터 없음') + '</div>';

    async function api(path, body) {
        const res = await fetch(API + path, body ? {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        } : {});
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }
    const question = (i, t, d) => '<div class="ql-question">' + ic(i)
        + '<div><b>' + t + '</b><span>' + d + '</span></div></div>';
    const card = (t, i, b, c) => '<section class="ql-card ' + (c || '') + '">'
        + '<h3>' + ic(i) + t + '</h3>' + b + '</section>';
    const metric = (l, v, c, h) => '<div class="ql-metric"><span class="ql-metric-label">' + l
        + '</span><span class="ql-metric-value ' + (c || '') + '">' + v + '</span>'
        + (h ? '<span class="ql-metric-hint">' + h + '</span>' : '') + '</div>';
    const vbox = (v) => !v ? '' : '<div class="ql-vbox ql-' + v[0] + '">'
        + ic(v[0] === 'ok' ? 'check' : 'alert') + '<span>' + v[1] + '</span></div>';
    const srcSel = (id) => '<label>계좌<select id="' + id + '">'
        + '<option value="virtual">모의계좌</option><option value="toss">토스증권</option>'
        + '<option value="kis">한국투자증권</option></select></label>';

    /* 보유 종목을 브라우저가 알고 있으면 같이 보낸다 (평단·수량 포함)
     *
     * 평단 필드명이 경로마다 다르다 — 네 가지를 전부 받는다:
     *   avgBuyPrice    broker_adapter.getHoldings()
     *   avg_buy_price  브로커 API 원본
     *   avgPrice       data.js 리포트 종목
     *   avg_price      서버 정규화 형태
     * `avgPrice` 만 보다가 실계좌 보유가 전부 평단 0 으로 넘어가 백엔드에서
     * 걸러졌고, 화면이 "해외 보유 종목이 없습니다"로 나왔다.
     */
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
            /* 쓸 수 있는 행이 하나도 없으면 **보내지 않는다.**
             * 보내면 서버가 이걸 신뢰해 빈 결과를 내고, 화면은 "보유 없음"으로
             * 끝난다. null 이면 서버가 자기 DB 의 보유를 쓴다. */
            const usable = rows.filter(x => x.quantity > 0 && x.avg_price > 0 && x.price > 0);
            return usable.length ? rows : null;
        } catch (e) { return null; }
    }


    /* ══════════════════════════════════════════════════════════
     *  A. MY TAX — 세후 손익 · 절세 매도
     * ════════════════════════════════════════════════════════ */
    const TAX = {
        async render() {
            const host = $('inv-tax-body');
            if (!host) return;
            host.innerHTML = question('scale', '지금 팔면 세금이 얼마인가?',
                  '증권사는 손익을 <em>세전</em>으로만 보여줍니다. 해외주식 양도세는 다음 해 '
                + '5월에 직접 신고하는데, 앱은 "지금 팔면 얼마"를 알려주지 않습니다. '
                + '손실 종목을 팔아 과세표준을 줄이는 <em>절세 매도</em>도 계산합니다.')
                + '<div class="ql-controls">' + srcSel('inv-tax-src')
                + '<button id="inv-tax-run" class="tp-btn tp-btn-primary">계산</button></div>'
                + '<div id="inv-tax-result"></div>';
            $('inv-tax-run').onclick = () => TAX.run();
            TAX.run();
        },
        async run() {
            const out = $('inv-tax-result');
            loading(out, '실현손익 집계 중…');
            let j;
            try {
                j = await api('/api/investor/tax',
                    { source: $('inv-tax-src').value, holdings: clientHoldings() });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = TAX.draw(j);
        },
        draw(j) {
            const t = j.tax_basis;
            const harvest = (j.harvest_candidates || []).map(c => `<tr>
                <td><b>${c.symbol}</b><small>${c.name || ''}</small></td>
                <td>${cnt(c.quantity)}주</td>
                <td class="neg">${won(c.loss_krw)}</td>
                <td>${wonA(c.new_taxable)}</td>
                <td class="pos"><b>−${cnt(c.tax_saved)}원</b></td></tr>`).join('');

            const realized = (j.rows || []).slice(0, 10).map(r => `<tr>
                <td><b>${r.symbol}</b><small>${r.name || ''}</small></td>
                <td>${r.exit_at}</td>
                <td>${r.domestic ? '국내' : '해외'}</td>
                <td class="${sgn(r.pnl_krw)}">${won(r.pnl_krw)}</td></tr>`).join('');

            return vbox(j.verdict)
            + '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     `<span class="ql-hero-label">${j.year}년 예상 양도소득세 (해외)</span>`
            +     `<span class="ql-hero-big ${j.tax > 0 ? 'neg' : 'pos'}">${wonA(j.tax)}</span>`
            +     `<span class="ql-hero-sub">실현이익 <b>${won(j.realized_overseas_krw)}</b> `
            +       `− 기본공제 ${wonA(j.deduction)} = 과세표준 <b>${wonA(j.taxable)}</b> `
            +       `× ${(t.overseas_capital_gains_rate * 100).toFixed(0)}%</span>`
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('청산 거래', cnt(j.n_realized) + '건')
            +     metric('절세 후보', cnt((j.harvest_candidates || []).length) + '개')
            +   '</div>'
            + '</div>'

            + (harvest ? card('절세 매도 시나리오', 'sliders',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">수량</th><th scope="col">평가손실</th>'
                + '<th scope="col">잔여 과세표준</th><th scope="col">절감 세액</th>'
                + '</tr></thead><tbody>' + harvest + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('alert')
                + '<b>한국 양도세에는 미국식 wash sale 규정이 없습니다.</b> 팔고 바로 다시 사면 '
                + '평단만 낮아지고 세금은 줄어듭니다. 다만 매매 비용과 재매수 시 가격 변동은 '
                + '별도로 감안해야 합니다.</div>') : '')

            + (realized ? card(`${j.year}년 청산 내역`, 'list',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">청산일</th><th scope="col">구분</th>'
                + '<th scope="col">손익(원)</th></tr></thead><tbody>' + realized
                + '</tbody></table></div>') : '')

            + '<div class="ql-warn">' + ic('alert') + '<span>' + j.disclaimer + '</span></div>'
            + '<div class="ql-meta">' + ic('flask')
            + `적용 세율 (${t.year}년): 해외 양도 ${(t.overseas_capital_gains_rate * 100).toFixed(0)}% · `
            + `기본공제 ${cnt(t.overseas_basic_deduction)}원 · 배당 원천징수 `
            + `${(t.dividend_withholding * 100).toFixed(1)}% · 국내 거래세 `
            + `${(t.domestic_transaction_tax * 100).toFixed(2)}%</div>`;
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  B. FX SPLIT — 환율 · 주가 손익 분해
     * ════════════════════════════════════════════════════════ */
    const FX = {
        async render() {
            const host = $('inv-fx-body');
            if (!host) return;
            host.innerHTML = question('activity', '주가 때문인가, 환율 때문인가?',
                  '증권사는 해외주식 손익을 <em>원화 환산 결과</em>로만 보여줍니다. '
                + '주가가 올랐는데 환율이 빠져서 손실인 경우, 무엇 때문에 잃었는지 알 수 없습니다.')
                + '<div class="ql-controls">' + srcSel('inv-fx-src')
                + '<button id="inv-fx-run" class="tp-btn tp-btn-primary">분해</button></div>'
                + '<div id="inv-fx-result"></div>';
            $('inv-fx-run').onclick = () => FX.run();
            FX.run();
        },
        async run() {
            const out = $('inv-fx-result');
            loading(out, '환율 이력 조회 중…');
            let j;
            try {
                j = await api('/api/investor/fx',
                    { source: $('inv-fx-src').value, holdings: clientHoldings() });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = FX.draw(j);
        },
        /* 주가·환율 기여를 0 기준 양방향 막대로 나란히 */
        bar(price, fx, maxAbs) {
            const w = v => Math.min(50, Math.abs(v || 0) / (maxAbs || 1) * 50);
            const seg = (v, cls) => `<i class="ql-sbar-fill ${v < 0 ? 'neg' : 'pos'} ${cls}" style="${v < 0 ? 'right:50%;' : 'left:50%;'}width:${w(v)}%"></i>`;
            return '<span class="ql-sbar-track"><i class="ql-sbar-zero"></i>'
                + seg(price, 'fx-price') + seg(fx, 'fx-rate') + '</span>';
        },
        draw(j) {
            const T = j.total;
            const maxAbs = Math.max(...j.rows.flatMap(r => [Math.abs(r.price_part), Math.abs(r.fx_part)]), 1);
            const rows = j.rows.map(r => `<tr>
                <td><b>${r.symbol}</b><small>${r.name || ''}</small></td>
                <td class="ql-bar-cell">${FX.bar(r.price_part, r.fx_part, maxAbs)}</td>
                <td class="${sgn(r.price_part)}">${won(r.price_part)}<small>${pct(r.price_pct)}</small></td>
                <td class="${sgn(r.fx_part)}">${won(r.fx_part)}<small>${pct(r.fx_pct)}</small></td>
                <td class="${sgn(r.total)}"><b>${won(r.total)}</b></td>
                <td><small>${num(r.fx_buy, 0)}${r.fx_estimated ? ' <em>추정</em>' : ''}</small></td></tr>`).join('');

            const dominant = Math.abs(T.fx_part) > Math.abs(T.price_part);
            return '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     '<span class="ql-hero-label">해외 보유 손익 분해</span>'
            +     '<span class="ql-hero-flow">'
            +       `<b class="${sgn(T.price_part)}">${pct(T.price_pct)}</b><i>주가</i>`
            +       `<b class="${sgn(T.fx_part)}">${pct(T.fx_pct)}</b><i>환율</i>`
            +       `<b class="${sgn(T.total_pct)}">${pct(T.total_pct)}</b></span>`
            +     `<span class="ql-hero-sub">${won(T.price_part)} (주가) ${won(T.fx_part)} (환율) `
            +       `= <b>${won(T.total)}</b> · 원금 ${wonA(T.cost)}</span>`
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('현재 환율', num(j.fx_now, 2) + '원',
                      j.fx_1y_ago ? (j.fx_now > j.fx_1y_ago ? 'pos' : 'neg') : '',
                      j.fx_1y_ago ? '1년전 ' + num(j.fx_1y_ago, 0) + '원' : '')
            +     metric('환율 기여도', pctA(j.fx_share), j.fx_share >= 50 ? 'neg' : '',
                      '손익 변동의 설명력')
            +   '</div>'
            + '</div>'

            + (dominant ? '<div class="ql-warn">' + ic('alert')
                + `<span><b>손익의 ${pctA(j.fx_share)}를 환율이 만들었습니다.</b> `
                + '종목 선택보다 환율이 결과를 더 좌우하고 있습니다 — '
                + '환헤지나 원화 자산 비중을 검토할 구간입니다.</span></div>' : '')

            + card('종목별 분해', 'barChart',
                '<div class="ql-legend"><span><i class="lg-fx-price"></i>주가 기여</span>'
                + '<span><i class="lg-fx-rate"></i>환율 기여</span></div>'
                + '<div class="ql-table-scroll"><table class="ql-table ql-table-bars"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">기여</th><th scope="col">주가</th>'
                + '<th scope="col">환율</th><th scope="col">합계</th><th scope="col">매수 환율</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                + '<div class="ql-note">분해식: 주가 기여 = (P₁−P₀)×수량×FX₀ · '
                + '환율 기여 = (FX₁−FX₀)×P₁×수량<br>' + j.note + '</div>');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  C. POST-SALE — 매도 후 추적
     * ════════════════════════════════════════════════════════ */
    const PS = {
        async render() {
            const host = $('inv-postsale-body');
            if (!host) return;
            host.innerHTML = question('compass', '팔고 나서 어떻게 됐나?',
                  '증권사는 거래내역을 나열할 뿐 <em>판 종목의 이후 경로</em>를 보여주지 않습니다. '
                + '그래서 매매 습관을 교정할 근거가 생기지 않습니다.')
                + '<div class="ql-controls">'
                + '<label>추적 기간<select id="inv-ps-days">'
                + '<option value="5">5일</option><option value="10">10일</option>'
                + '<option value="20" selected>20일</option><option value="60">60일</option>'
                + '</select></label>'
                + '<button id="inv-ps-run" class="tp-btn tp-btn-primary">추적</button></div>'
                + '<div id="inv-ps-result"></div>';
            $('inv-ps-run').onclick = () => PS.run();
            PS.run();
        },
        async run() {
            const out = $('inv-ps-result');
            loading(out, '매도 이후 경로 추적 중…');
            let j;
            try { j = await api(`/api/investor/post-sale?days=${$('inv-ps-days').value}`); }
            catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = PS.draw(j);
        },
        draw(j) {
            const w = j.profit_exits, l = j.loss_exits;
            const side = (t, a, hint) => card(t, 'target', '<div class="ql-metrics">'
                + metric('표본', cnt(a.n) + '건')
                + metric(`${j.days}일 후`, pct(a.avg_move), sgn(a.avg_move))
                + metric('오른 비율', pctA(a.rose_pct), a.rose_pct >= 60 ? 'neg' : '')
                + metric('최고 도달', pct(a.avg_peak), 'pos')
                + metric('평균 보유', a.avg_hold ? a.avg_hold + '일' : '—')
                + '</div><div class="ql-note">' + hint + '</div>');

            const tbl = (title, rows) => '<div class="ql-half"><h4>' + title + '</h4>'
                + '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">매도일</th><th scope="col">이후</th>'
                + '<th scope="col">최고</th></tr></thead><tbody>'
                + rows.map(r => `<tr>
                    <td><b>${r.symbol}</b><small>${r.was_profit ? '익절' : '손절'}</small></td>
                    <td>${r.exit_at}</td>
                    <td class="${sgn(r.move_pct)}"><b>${pct(r.move_pct)}</b></td>
                    <td class="pos">${pct(r.peak_pct)}</td></tr>`).join('')
                + '</tbody></table></div></div>';

            return vbox(j.verdict) + vbox(j.disposition)
            + '<div class="ql-grid">'
            +   side('익절한 종목의 이후', w,
                    '오른 비율이 높으면 <b>너무 빨리 팔고 있다</b>는 뜻입니다.')
            +   side('손절한 종목의 이후', l,
                    '오른 비율이 높으면 손절이 <b>정상 되돌림</b>에 걸리고 있을 수 있습니다.')
            + '</div>'
            + '<div class="ql-grid">'
            +   tbl('매도 후 가장 많이 오른', j.best)
            +   tbl('매도 후 가장 많이 내린', j.worst)
            + '</div>'
            + '<div class="ql-meta">' + ic('flask')
            + `왕복 거래 ${cnt(j.n)}건 · ${j.days}일 추적`
            + (j.missing ? ` · 가격 이력 없어 제외 ${j.missing}건` : '')
            + ' · SURVIVAL 화면이 백테스트에 쓴 방식을 <b>실거래에 적용</b>한 것입니다.</div>';
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  D. AVG DOWN — 평단가 시뮬레이터
     * ════════════════════════════════════════════════════════ */
    const AD = {
        async render() {
            const host = $('inv-avgdown-body');
            if (!host) return;
            host.innerHTML = question('sliders', '얼마를 더 사면 평단이 얼마가 되나?',
                  '증권사 앱에는 이 계산기가 없어 손으로 계산합니다. 여기서는 '
                + '<em>얼마까지 사도 되는지</em> 계좌 리스크 한도까지 함께 냅니다.')
                + '<div class="ql-controls ql-controls-inline">'
                +   '<label>종목<input type="text" id="inv-ad-sym" value="" placeholder="심볼"></label>'
                +   '<label>보유 수량<input type="number" id="inv-ad-qty" value="100" step="1"></label>'
                +   '<label>평단가<input type="number" id="inv-ad-avg" value="50000" step="1"></label>'
                +   '<label>현재가<input type="number" id="inv-ad-px" value="42000" step="1"></label>'
                +   '<label>총자산<input type="number" id="inv-ad-assets" value="10000000" step="100000"></label>'
                +   '<label>ATR<input type="number" id="inv-ad-atr" value="1500" step="1"></label>'
                +   '<button id="inv-ad-run" class="tp-btn tp-btn-primary">계산</button>'
                + '</div>'
                + '<div id="inv-ad-picker"></div><div id="inv-ad-result"></div>';
            $('inv-ad-run').onclick = () => AD.run();
            AD.picker();
            AD.run();
        },
        /* 보유 종목을 클릭하면 입력이 채워진다 */
        picker() {
            const h = clientHoldings();
            const host = $('inv-ad-picker');
            if (!h || !h.length || !host) return;
            host.innerHTML = '<div class="inv-picker">' + ic('list')
                + h.filter(x => x.avg_price > 0).slice(0, 12).map(x =>
                    `<button type="button" class="inv-chip" data-sym="${x.symbol}"
                        data-qty="${x.quantity}" data-avg="${x.avg_price}" data-px="${x.price}">
                        ${x.symbol}<small>${pct((x.price / x.avg_price - 1) * 100)}</small></button>`).join('')
                + '</div>';
            host.querySelectorAll('.inv-chip').forEach(b => {
                b.onclick = () => {
                    $('inv-ad-sym').value = b.dataset.sym;
                    $('inv-ad-qty').value = b.dataset.qty;
                    $('inv-ad-avg').value = b.dataset.avg;
                    $('inv-ad-px').value = b.dataset.px;
                    AD.run();
                };
            });
        },
        async run() {
            const out = $('inv-ad-result');
            let j;
            try {
                j = await api('/api/investor/average-down', {
                    symbol: $('inv-ad-sym').value,
                    quantity: parseFloat($('inv-ad-qty').value),
                    avg_price: parseFloat($('inv-ad-avg').value),
                    price: parseFloat($('inv-ad-px').value),
                    total_assets: parseFloat($('inv-ad-assets').value),
                    atr: parseFloat($('inv-ad-atr').value)
                });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = AD.draw(j);
        },
        draw(j) {
            const c = j.current, lim = j.limit;
            const rows = j.rows.map(r => {
                const over = lim && lim.max_add_qty && r.add_qty > lim.max_add_qty;
                return `<tr class="${over ? 'inv-over' : ''}">
                    <td>+${cnt(r.add_qty)}주</td>
                    <td>${cnt(r.new_avg)}</td>
                    <td class="${r.breakeven_pct > 20 ? 'neg' : ''}"><b>${pct(r.breakeven_pct)}</b></td>
                    <td>${cnt(r.add_notional)}</td>
                    <td>${r.weight_pct === null ? '—' : pctA(r.weight_pct)}</td>
                    <td>${over ? '<span class="sig-rule-badge sig-bad">한도 초과</span>' : ''}</td></tr>`;
            }).join('');

            return '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     `<span class="ql-hero-label">${j.symbol || '현재 포지션'}</span>`
            +     `<span class="ql-hero-big ${sgn(c.pnl_pct)}">${pct(c.pnl_pct)}</span>`
            +     `<span class="ql-hero-sub">${cnt(c.quantity)}주 · 평단 ${cnt(c.avg_price)} · `
            +       `현재 ${cnt(c.price)}</span>`
            +   '</div>'
            +   (lim ? '<div class="ql-hero-side">'
                    + metric('추가 매수 한도', cnt(lim.max_add_qty) + '주', '',
                        '계좌 리스크 1% 기준')
                    + metric('손절가', cnt(lim.stop), 'neg',
                        '실제 위험 ' + cnt(lim.risk_amount))
                    + '</div>' : '')
            + '</div>'

            + (j.warning ? '<div class="ql-warn">' + ic('alert') + '<span>' + j.warning + '</span></div>' : '')

            + card('추가 매수 시나리오', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">추가</th><th scope="col">새 평단</th>'
                + '<th scope="col">손익분기 필요 상승률</th><th scope="col">투입금</th>'
                + '<th scope="col">비중</th><th scope="col"></th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                + '<div class="ql-note">' + ic('alert') + j.note + '</div>')

            + (j.measured ? card('이 전략의 실측 성적', 'flask', '<div class="ql-metrics">'
                + metric('기대값', (j.measured.expectancy > 0 ? '+' : '') + num(j.measured.expectancy, 3) + 'R',
                    sgn(j.measured.expectancy))
                + metric('승률', pctA(j.measured.win_rate * 100))
                + metric('손익비', num(j.measured.payoff))
                + metric('평균 보유', j.measured.hold_days + '일')
                + '</div>'
                + '<div class="ql-note">평단을 낮춰도 <b>기대값은 변하지 않습니다.</b> '
                + '물타기는 손실 확정을 미루는 것이지 우위를 만드는 행위가 아닙니다.</div>') : '');
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  E. HABITS — 매매 습관 진단
     * ════════════════════════════════════════════════════════ */
    const HB = {
        async render() {
            const host = $('inv-habits-body');
            if (!host) return;
            host.innerHTML = question('clipboard', '내 매매 습관에 새는 곳이 있는가?',
                  '증권사는 거래가 늘어야 이익이라 <em>"당신은 과매매하고 있습니다"</em>를 '
                + '보여줄 유인이 없습니다. 그게 이 화면이 있는 이유입니다.')
                + '<div id="inv-hb-result"></div>';
            HB.run();
        },
        async run() {
            const out = $('inv-hb-result');
            loading(out, '체결 기록 분석 중…');
            let j;
            try { j = await api('/api/investor/habits'); }
            catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = HB.draw(j);
        },
        draw(j) {
            const maxAbs = Math.max(...(j.by_dow || []).map(d => Math.abs(d.avg_return)), 1);
            const dow = (j.by_dow || []).map(d => {
                const w = Math.min(50, Math.abs(d.avg_return) / maxAbs * 50);
                return `<div class="ql-sbar">
                    <span class="ql-sbar-label">${d.dow}요일</span>
                    <span class="ql-sbar-track"><i class="ql-sbar-zero"></i>
                        <i class="ql-sbar-fill ${d.avg_return < 0 ? 'neg' : 'pos'}"
                           style="${d.avg_return < 0 ? 'right:50%;' : 'left:50%;'}width:${w}%"></i></span>
                    <span class="ql-sbar-val ${sgn(d.avg_return)}">${pct(d.avg_return)}</span>
                    <span class="ql-sbar-extra">${d.n}건 · 승률 ${pctA(d.win_rate)}</span></div>`;
            }).join('');

            const strat = (j.by_strategy || []).map(s => `<tr>
                <td><b>${s.strategy}</b></td><td>${s.n}건</td>
                <td>${num(s.actual_hold, 1)}일</td>
                <td>${s.intended_hold ? s.intended_hold + '일' : '—'}</td>
                <td class="${s.gap === null ? '' : (Math.abs(s.gap) > 3 ? 'neg' : '')}">
                    ${s.gap === null ? '—' : (s.gap > 0 ? '+' : '') + num(s.gap, 1) + '일'}</td></tr>`).join('');
            const unlabeled = j.n_unlabeled
                ? '<div class="ql-note">' + ic('alert') + '전략이 기록되지 않은 거래 '
                    + `<b>${cnt(j.n_unlabeled)}건</b>은 전략별 집계에서 뺐습니다.</div>`
                : '';

            const rep = (j.repeat || []).map(r => `<tr>
                <td><b>${r.symbol}</b></td><td>${r.n}회</td>
                <td class="${sgn(r.total_return)}"><b>${pct(r.total_return)}</b></td>
                <td>${pctA(r.win_rate)}</td></tr>`).join('');

            return (j.thin ? '<div class="ql-warn">' + ic('alert')
                    + `<span><b>표본이 ${cnt(j.n)}건뿐입니다.</b> 습관은 시간이 지나야 드러납니다 — `
                    + '아래 숫자는 참고용입니다.</span></div>' : '')
            + vbox(j.revenge)
            + '<div class="ql-grid">'
            +   card('요일별 성과', 'calendar', dow || '<div class="ql-note">표본 부족</div>')
            +   card('보유 기간', 'trending', '<div class="ql-metrics">'
                  + metric('평균', j.hold_days.mean + '일')
                  + metric('중앙값', j.hold_days.median + '일')
                  + metric('최장', j.hold_days.max + '일')
                  + '</div>'
                  + (strat ? '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                      + '<th scope="col">전략</th><th scope="col">표본</th><th scope="col">실제</th>'
                      + '<th scope="col">의도</th><th scope="col">차이</th></tr></thead><tbody>'
                      + strat + '</tbody></table></div>'
                      + unlabeled
                      + '<div class="ql-note">의도한 기간보다 <b>짧으면</b> 조기 청산, '
                      + '<b>길면</b> 손절 지연입니다.</div>' : ''))
            + '</div>'
            + (rep ? card('같은 종목 반복 매매', 'list',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">횟수</th>'
                + '<th scope="col">누적 수익률</th><th scope="col">승률</th>'
                + '</tr></thead><tbody>' + rep + '</tbody></table></div>'
                + '<div class="ql-note">같은 종목을 반복해 잃고 있다면, 그 종목이 아니라 '
                + '<b>그 종목에 대한 판단</b>을 점검해야 합니다.</div>') : '')
            + '<div class="ql-meta">' + ic('flask') + `왕복 거래 ${cnt(j.n)}건 기준</div>`;
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  F. DIVIDEND — 배당 캘린더
     * ════════════════════════════════════════════════════════ */
    const DV = {
        async render() {
            const host = $('inv-dividend-body');
            if (!host) return;
            host.innerHTML = question('calendar', '배당은 언제 얼마나 들어오나?',
                  '한국 증권사는 특히 <em>해외주식 배당 일정</em>이 빈약합니다. '
                + '월별 예상 수령액을 보여주는 곳이 거의 없어 엑셀로 관리하게 됩니다.')
                + '<div class="ql-controls">' + srcSel('inv-dv-src')
                + '<label>기간<select id="inv-dv-months">'
                + '<option value="6">6개월</option><option value="12" selected>12개월</option>'
                + '<option value="24">24개월</option></select></label>'
                + '<button id="inv-dv-run" class="tp-btn tp-btn-primary">조회</button></div>'
                + '<div id="inv-dv-result"></div>';
            $('inv-dv-run').onclick = () => DV.run();
            DV.run();
        },
        async run() {
            const out = $('inv-dv-result');
            loading(out, '배당 일정 추정 중…');
            let j;
            try {
                j = await api('/api/investor/dividends', {
                    source: $('inv-dv-src').value,
                    months: parseInt($('inv-dv-months').value, 10),
                    holdings: clientHoldings()
                });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = DV.draw(j);
        },
        draw(j) {
            const cal = j.calendar || [];
            const max = Math.max(...cal.map(c => c.amount_krw), 1);
            const bars = cal.map(c => `<div class="inv-cal-row">
                <span class="inv-cal-month">${c.month}</span>
                <span class="ql-pbar"><i class="cur" style="width:${(c.amount_krw / max * 100).toFixed(1)}%"></i></span>
                <b>${wonA(c.amount_krw)}</b></div>`).join('');

            const rows = (j.rows || []).map(r => `<tr>
                <td><b>${r.symbol}</b><small>${r.name || ''}</small></td>
                <td>${r.frequency}</td>
                <td>${num(r.last_amount, 4)} ${r.currency}</td>
                <td>${r.last_ex_date}</td>
                <td>${r.yield_pct === null ? '—' : pctA(r.yield_pct, 2)}</td>
                <td>${cnt(r.ttm_total)} ${r.currency}</td></tr>`).join('');

            return '<div class="ql-hero">'
            +   '<div class="ql-hero-main">'
            +     '<span class="ql-hero-label">최근 1년 배당 (세전)</span>'
            +     `<span class="ql-hero-big pos">${wonA(j.ttm_total_krw)}</span>`
            +     `<span class="ql-hero-sub">원천징수 ${(j.withholding_rate * 100).toFixed(1)}% 차감 후 `
            +       `<b>${wonA(j.after_tax_krw)}</b> · 환율 ${num(j.fx, 2)}원 적용</span>`
            +   '</div>'
            +   '<div class="ql-hero-side">'
            +     metric('배당 종목', cnt((j.rows || []).length) + '개', '',
                      j.no_dividend.length ? '무배당 ' + j.no_dividend.length + '개' : '')
            +     metric('예정 개월', cnt(cal.length) + '개월')
            +   '</div>'
            + '</div>'

            + (bars ? card(`향후 ${j.months}개월 예상 현금흐름`, 'barChart', bars
                + '<div class="ql-note">' + ic('alert') + j.note + '</div>') : '')

            + (rows ? card('종목별 배당', 'list',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">종목</th><th scope="col">주기</th><th scope="col">최근 배당</th>'
                + '<th scope="col">최근 배당락</th><th scope="col">수익률</th><th scope="col">1년 수령</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>') : '')

            + '<div class="ql-meta">' + ic('flask')
            + '배당 이력 적재: <b>python -m scripts.report.dividend_store</b></div>';
        }
    };


    /* ══════════════════════════════════════════════════════════
     *  G. RECOVERY — "이거 언제 본전 오나"
     * ════════════════════════════════════════════════════════ */
    const RC = {
        render() {
            const host = $('inv-recovery-body');
            if (!host) return;
            host.innerHTML = question('trend', '이거 언제 본전 오나',
                    '손실률과 회복률은 대칭이 아닙니다. 유니버스 전체에서 같은 낙폭이 '
                    + '실제로 어떻게 됐는지 봅니다.')
                + '<div class="ql-controls">' + srcSel('inv-rc-src')
                + '<button id="inv-rc-run" class="tp-btn tp-btn-primary">계산</button></div>'
                + '<div id="inv-rc-result"></div>';
            $('inv-rc-run').onclick = () => RC.run();
            RC.run();
        },
        async run() {
            const out = $('inv-rc-result');
            loading(out, '회복 통계 계산 중… (첫 실행은 몇 초 걸립니다)');
            let j;
            try {
                j = await api('/api/investor/recovery',
                    { source: $('inv-rc-src').value, holdings: clientHoldings() });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = RC.view(j);
        },
        view(j) {
            const s = j.summary;
            const uni = j.universe_table || {};

            /* 유니버스 표 — 깊은 순으로 */
            const order = Object.keys(uni).sort(
                (a, b) => (uni[a].bin[1] - uni[b].bin[1]));
            const uniRows = order.map(k => {
                const v = uni[k], r = v.recovery;
                const heat = (x) => `<td class="${x >= 60 ? 'pos' : x >= 30 ? '' : 'neg'}">`
                    + pctA(x, 1) + '</td>';
                return `<tr><td><b>${k}%</b><small>표본 ${cnt(v.n)}건</small></td>`
                    + heat(r.d60) + heat(r.d120) + heat(r.d250)
                    + `<td>${v.median_days ? cnt(v.median_days) + '일' : '—'}</td>`
                    + `<td class="neg">${pctA(v.further_p10, 0)}</td></tr>`;
            }).join('');

            /* 보유 종목 */
            const rows = (j.rows || []).map(r => {
                const u = r.universe.recovery;
                const own = r.own ? r.own.recovery : null;
                const odds = u.d250;
                const cls = odds >= 60 ? 'pos' : odds >= 30 ? '' : 'neg';
                return `<tr><td><b>${r.name}</b><small>${r.symbol} · ${r.bin}%</small></td>`
                    + `<td class="neg">${pct(r.loss_pct)}</td>`
                    + `<td><b class="pos">${pct(r.required_gain_pct)}</b>`
                    + `<small>필요 상승률</small></td>`
                    + `<td class="${cls}"><b>${pctA(odds, 1)}</b>`
                    + `<small>1년 내 · 표본 ${cnt(r.universe.n)}</small></td>`
                    + `<td>${r.median_days ? cnt(r.median_days) + '일' : '—'}`
                    + (r.benchmark_pct === null || r.benchmark_pct === undefined ? ''
                        : `<small>같은 기간 SPY ${pct(r.benchmark_pct, 1)}</small>`) + '</td>'
                    + `<td>${own ? pctA(own.d250, 1) + '<small>이 종목 자체</small>'
                        : '<span class="ql-dim">표본 부족</span>'}</td></tr>`;
            }).join('');

            const hero = !s ? ''
                : '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   '<span class="ql-hero-label">가장 깊이 물린 종목</span>'
                +   `<span class="ql-hero-big neg">${s.worst_symbol} ${pct(s.worst_loss)}</span>`
                +   `<span class="ql-hero-sub">본전까지 <b class="pos">${pct(s.worst_need)}</b> 필요 · `
                +     `같은 낙폭이 1년 안에 회복한 비율 <b>${pctA(s.worst_odds, 1)}</b></span>`
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('물린 종목', cnt(s.n_underwater) + '개')
                +   metric('평가손실 합', wonA(s.total_loss), 'neg')
                + '</div></div>';

            return hero
                + (rows ? card('보유 종목별 회복 전망', 'list',
                    '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">종목</th><th scope="col">현재 손실</th>'
                    + '<th scope="col">필요 상승률</th><th scope="col">1년 내 회복</th>'
                    + '<th scope="col">회복 중앙값</th><th scope="col">자체 이력</th>'
                    + '</tr></thead><tbody>' + rows + '</tbody></table></div>')
                    : empty('물린 종목이 없습니다. 손실 2% 이내는 표시하지 않습니다.'))

                + card(`유니버스 회복 통계 — ${cnt(j.n_symbols)}종목 · 표본 ${cnt(j.n_samples)}건`,
                    'barChart',
                    '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">고점 대비 낙폭</th><th scope="col">60일 내</th>'
                    + '<th scope="col">120일 내</th><th scope="col">250일(1년) 내</th>'
                    + '<th scope="col">회복 중앙값</th><th scope="col">10%+ 추가하락</th>'
                    + '</tr></thead><tbody>' + uniRows + '</tbody></table></div>'
                    + '<div class="ql-note">' + ic('alert')
                    + '깊이 물릴수록 회복 확률이 급격히 떨어집니다. '
                    + '−30% 구간은 1년 내 회복이 4번 중 1번입니다.</div>')

                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).join('<br>') + '</span></div>';
        }
    };

    /* ══════════════════════════════════════════════════════════
     *  H. OVERNIGHT — "밤새워 보는 게 의미가 있나"
     * ════════════════════════════════════════════════════════ */
    const ON = {
        render() {
            const host = $('inv-overnight-body');
            if (!host) return;
            host.innerHTML = question('clock', '수익은 언제 생기나',
                    '장이 닫혀 있는 동안(야간 갭)과 열려 있는 동안(장중)으로 갈라 봅니다. '
                    + '한국에서 미국장은 자는 시간에 열립니다.')
                + '<div class="ql-controls">' + srcSel('inv-on-src')
                + '<button id="inv-on-run" class="tp-btn tp-btn-primary">계산</button></div>'
                + '<div id="inv-on-result"></div>';
            $('inv-on-run').onclick = () => ON.run();
            ON.run();
        },
        async run() {
            const out = $('inv-on-result');
            loading(out, '야간·장중 분해 중…');
            let j;
            try {
                j = await api('/api/investor/overnight',
                    { source: $('inv-on-src').value, holdings: clientHoldings() });
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = ON.view(j);
        },
        mkt(v, label) {
            if (!v) return '';
            return `<tr><td><b>${label}</b><small>${cnt(v.n_symbols)}종목</small></td>`
                + `<td class="${sgn(v.night_median)}"><b>${pct(v.night_median, 1)}</b>`
                + `<small>일평균 ${num(v.night_mean_bp, 2)}bp</small></td>`
                + `<td class="${sgn(v.day_median)}"><b>${pct(v.day_median, 1)}</b>`
                + `<small>일평균 ${num(v.day_mean_bp, 2)}bp</small></td>`
                + `<td><b>${cnt(v.night_wins)}/${cnt(v.n_symbols)}</b>`
                + `<small>${pctA(v.night_wins_pct, 0)}</small></td></tr>`;
        },
        view(j) {
            const b = j.breakeven;
            const us = j.us;

            const hero = !us ? '' : '<div class="ql-hero">'
                + '<div class="ql-hero-main">'
                +   '<span class="ql-hero-label">미국 종목 · 5년 누적 (중앙값)</span>'
                +   `<span class="ql-hero-big ${sgn(us.night_median)}">야간 ${pct(us.night_median, 1)}</span>`
                +   `<span class="ql-hero-sub">장중은 <b class="${sgn(us.day_median)}">`
                +     `${pct(us.day_median, 1)}</b> · `
                +     `${cnt(us.n_symbols)}종목 중 <b>${cnt(us.night_wins)}개</b>`
                +     `(${pctA(us.night_wins_pct, 0)})에서 야간이 더 벌었습니다</span>`
                + '</div>'
                + '<div class="ql-hero-side">'
                +   metric('야간 일평균', num(us.night_mean_bp, 2) + 'bp')
                +   metric('장중 일평균', num(us.day_mean_bp, 2) + 'bp')
                + '</div></div>';

            /* 손익분기 — 이 화면의 핵심. 없으면 지는 전략을 권하게 된다 */
            const be = !b ? '' : card('그럼 야간만 먹으면 되는가', 'flask',
                '<div class="ql-verdict ' + (b.viable ? 'ok' : 'bad') + '">'
                + ic(b.viable ? 'check' : 'alert')
                + '<div><b>' + (b.viable
                    ? '비용을 넘습니다 — 검토할 값이 있습니다'
                    : '비용을 못 넘습니다 — 매매 근거가 되지 않습니다')
                + '</b><span>야간 수익을 먹으려면 <b>매일 종가 매수·시가 매도</b>가 '
                + '필요하고 왕복 비용이 매일 붙습니다.</span></div></div>'
                + '<div class="ql-metrics">'
                + metric('야간 일평균', num(b.night_mean_bp, 2) + 'bp', 'pos')
                + metric('왕복 비용', '−' + num(b.cost_bp, 1) + 'bp', 'neg')
                + metric('순 기대값', num(b.net_bp, 2) + 'bp', b.net_bp > 0 ? 'pos' : 'neg',
                         '하루당')
                + '</div>');

            const mkts = card('시장별', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">시장</th><th scope="col">야간 갭</th>'
                + '<th scope="col">장중</th><th scope="col">야간 우세</th>'
                + '</tr></thead><tbody>' + ON.mkt(j.us, '미국') + ON.mkt(j.kr, '한국')
                + '</tbody></table></div>');

            const rows = (j.rows || []).map(r => {
                const share = (r.night_share !== null && r.night_share >= 0
                               && r.night_share <= 100)
                    ? pctA(r.night_share, 0)
                    : '<span class="ql-dim">—</span>';
                return `<tr><td><b>${r.name}</b><small>${r.symbol} · ${r.market} · `
                    + `${cnt(r.bars)}봉</small></td>`
                    + `<td class="${sgn(r.night_pct)}"><b>${pct(r.night_pct, 1)}</b>`
                    + `<small>승률 ${pctA(r.night_win, 1)}</small></td>`
                    + `<td class="${sgn(r.day_pct)}"><b>${pct(r.day_pct, 1)}</b>`
                    + `<small>승률 ${pctA(r.day_win, 1)}</small></td>`
                    + `<td>${share}</td></tr>`;
            }).join('');

            const o = j.orders;
            const ord = !o ? '' : '<div class="ql-note">' + ic('clock')
                + `내 미국 종목 주문 <b>${cnt(o.n)}건</b> 중 <b>${pctA(o.pct, 1)}</b>가 `
                + '미국장이 닫힌 동안 났습니다 — 체결은 야간 갭이 <b>이미 끝난 뒤</b>입니다.'
                + '</div>';

            return hero + be + mkts
                + (rows ? card('보유 종목', 'list',
                    '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                    + '<th scope="col">종목</th><th scope="col">야간 갭</th>'
                    + '<th scope="col">장중</th><th scope="col">야간 비중</th>'
                    + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                    + '<div class="ql-note">' + ic('alert')
                    + '장중이 마이너스면 야간 비중이 100%를 넘어 의미가 없어집니다. '
                    + '그럴 때는 비중 대신 —로 둡니다.</div>' + ord) : ord)

                + '<div class="ql-warn">' + ic('alert') + '<span>'
                + (j.caveats || []).join('<br>') + '</span></div>'
                + '<div class="ql-meta">' + ic('flask') + j.note + '</div>';
        }
    };

    /* ══════════════════════════════════════════════════════════
     *  I. FX TIMING — "환율 1,400원인데 지금 사도 되나"
     * ----------------------------------------------------------
     *  FX SPLIT 은 **사후 분해**만 한다. 진입 시점 판단은 여기서 본다.
     *  국내 투자자에게만 있는 질문이라 어디에도 답이 없다.
     * ════════════════════════════════════════════════════════ */
    const FXT = {
        async render() {
            const host = $('inv-fxtiming-body');
            if (!host) return;
            host.innerHTML = question('scale', '환율이 높은데 지금 사도 되나?',
                  '원화 투자자의 미국주식 수익은 <em>주가</em>와 <em>환율</em> 두 조각입니다. '
                + '환율이 높을 때 산 경우 그 뒤 환율 조각이 실제로 불리했는지만 봅니다. '
                + '증권사 앱은 원화 환산 손익만 보여줘 이 구분이 안 됩니다.')
                + '<div class="ql-controls"><label>기준<select id="inv-fxt-bench">'
                + '<option value="SPY">SPY (S&amp;P 500)</option>'
                + '<option value="QQQ">QQQ (나스닥 100)</option></select></label>'
                + '<button id="inv-fxt-run" class="tp-btn tp-btn-primary">계산</button></div>'
                + '<div id="inv-fxt-result"></div>';
            $('inv-fxt-run').onclick = () => FXT.run();
            FXT.run();
        },
        async run() {
            const out = $('inv-fxt-result');
            loading(out, '환율 구간별로 나누는 중…');
            let j;
            try {
                j = await api('/api/investor/fx-timing?bench='
                    + encodeURIComponent($('inv-fxt-bench').value));
            } catch (e) { out.innerHTML = offline(e); return; }
            if (!j.available) { out.innerHTML = empty(j.message); return; }
            out.innerHTML = FXT.draw(j);
        },
        /* 온도계 — 지금이 최근 1년 중 어디인가. 숫자만으로는 체감이 안 된다. */
        gauge(n) {
            const p = Math.max(0, Math.min(100, n.pctile));
            return '<div class="fxt-gauge">'
                + '<div class="fxt-gauge-head"><b>' + wonA(n.fx) + '</b>'
                + '<span>최근 1년 중 <b class="' + (p >= 80 ? 'neg' : p <= 20 ? 'pos' : '') + '">'
                + pctA(p, 0) + '</b> 지점 · ' + n.date + '</span></div>'
                + '<div class="fxt-track"><i style="left:' + p.toFixed(1) + '%"></i></div>'
                + '<div class="fxt-scale"><span>5년 저 ' + wonA(n.low) + '</span>'
                + '<span>중앙 ' + wonA(n.median) + '</span>'
                + '<span>고 ' + wonA(n.high) + '</span></div></div>';
        },
        table(h, curBin) {
            const rows = h.bins.map(b => {
                const here = curBin && curBin.lo === b.lo;
                /* 표본이 없는 칸이 **지금 내가 있는 칸**일 수 있다. 그때가
                 * 가장 중요한 정보다 — "이 환율대는 판정할 표본이 없습니다".
                 * 강조를 빼면 사용자는 자기 칸을 못 찾는다. */
                if (b.krw_median === undefined) {
                    return '<tr class="ql-dim ' + (here ? 'fxt-here' : '') + '">'
                        + '<td><b>' + b.lo + '~' + b.hi + '%</b>'
                        + (here ? '<small>지금 여기</small>' : '') + '</td>'
                        + '<td colspan="7">표본 ' + cnt(b.n) + '건 — 판정하지 않습니다'
                        + (here ? ' <b>(지금 환율대가 여기입니다)</b>' : '') + '</td></tr>';
                }
                return '<tr class="' + (here ? 'fxt-here' : '') + (b.thin ? ' ql-dim' : '') + '">'
                    + '<td><b>' + b.lo + '~' + b.hi + '%</b>'
                    + (here ? '<small>지금 여기</small>' : '') + '</td>'
                    + '<td>' + cnt(b.n) + (b.thin ? '<small>얇음</small>' : '') + '</td>'
                    + '<td>' + wonA(b.fx_level) + '</td>'
                    + '<td class="' + sgn(b.usd_median) + '">' + pct(b.usd_median) + '</td>'
                    + '<td class="' + sgn(b.fx_median) + '"><b>' + pct(b.fx_median) + '</b></td>'
                    + '<td class="' + sgn(b.krw_median) + '">' + pct(b.krw_median) + '</td>'
                    + '<td>' + pctA(b.krw_win, 0) + '</td>'
                    + '<td class="' + sgn(b.krw_worst) + '">' + pct(b.krw_worst, 1) + '</td></tr>';
            }).join('');
            return card('이후 ' + h.label + ' — 구간 ' + cnt(h.n) + '개', 'barChart',
                '<div class="ql-table-scroll"><table class="ql-table"><thead><tr>'
                + '<th scope="col">환율 칸</th><th scope="col">구간</th>'
                + '<th scope="col">그때 환율</th><th scope="col">달러 수익</th>'
                + '<th scope="col">환율 기여</th><th scope="col">원화 수익</th>'
                + '<th scope="col">승률</th><th scope="col">최악</th>'
                + '</tr></thead><tbody>' + rows + '</tbody></table></div>');
        },
        draw(j) {
            const n = j.now;
            return FXT.gauge(n)
                + vbox(j.verdict)
                //  이 표본에 하락장이 없다는 사실을 표보다 **먼저** 알린다.
                //  승률만 보면 "무조건 오른다"로 읽힌다.
                + (j.regime ? '<div class="ql-warn">' + ic('alert')
                    + '<span>' + j.regime.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</span></div>' : '')
                + j.horizons.map(h => FXT.table(h, n.bin)).join('')
                + '<p class="ql-note">' + ic('flask') + j.note
                + ' · ' + j.period.start + '~' + j.period.end + ' ' + cnt(j.period.days) + '일</p>'
                + '<ul class="ql-caveats">'
                + j.caveats.map(c => '<li>' + c.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</li>').join('')
                + '</ul>';
        }
    };


    global.Investor = {
        renderTax: () => TAX.render(),
        renderFx: () => FX.render(),
        renderPostSale: () => PS.render(),
        renderAvgDown: () => AD.render(),
        renderHabits: () => HB.render(),
        renderDividend: () => DV.render(),
        renderRecovery: () => RC.render(),
        renderOvernight: () => ON.render(),
        renderFxTiming: () => FXT.render(),
        /* 보유 수집을 밖으로 낸다 — wrapped.js 가 같은 것을 필요로 한다.
         * 복사본을 만들면 평단 필드명이 또 어긋난다
         * (investor-screens-guard.md: "한쪽만 고치면 다른 경로에서 재발"). */
        clientHoldings
    };
})(window);
