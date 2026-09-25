/* ============================================================================
 * model_scorecard.js — MODEL SCORECARD 화면
 * ----------------------------------------------------------------------------
 * 예측 신뢰도를 **있는 그대로** 공개한다.
 *
 * 설계 원칙: 나쁜 숫자를 숨기지 않는다.
 *   기존 "AI 예측 정확도 트렌드"는 벤치마크·편향 정보가 없어
 *   좋은지 나쁜지 판단할 수 없었다. 모델을 신뢰할지는 사용자가 정해야 하고,
 *   그러려면 판단 근거가 필요하다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');

    function $(id) { return document.getElementById(id); }

    // 이모지 대신 stroke 아이콘 — 없으면 조용히 생략한다
    function ic(name) {
        return (global.Icons && global.Icons.icon) ? global.Icons.icon(name) : '';
    }


    function serverOfflineHtml(e) {
        return '<div class="sg-offline">'
            + '<div class="sg-offline-title">' + ic('alert') + '거래 서버가 꺼져 있습니다</div>'
            + '<div class="sg-offline-desc">이 화면은 로컬 거래 서버의 API가 필요합니다.<br>'
            +   '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\start_trade_server.ps1</code>'
            + '<div class="sg-offline-hint">REPORT 탭의 리스크 플랜·팬 차트·밸류에이션 패널은 '
            +   '서버 없이도 정상 표시됩니다.</div>'
            + (e && e.message ? '<div class="sg-offline-err">' + e.message + '</div>' : '')
            + '</div>';
    }

    function render() {
        const host = $('ms-body');
        if (!host) return;
        host.innerHTML = '<div class="tp-empty">불러오는 중…</div>';
        load();
    }

    async function load() {
        try {
            const res = await fetch(API + '/api/scorecard?days=180');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const j = await res.json();
            if (!j.available) {
                $('ms-body').innerHTML = '<div class="tp-empty">' + (j.message || '데이터 없음') + '</div>';
                return;
            }
            draw(j);
        } catch (e) {
            $('ms-body').innerHTML = serverOfflineHtml(e);
        }
    }

    function verdict(j) {
        const best = Math.max.apply(null, j.benchmarks.map(function (b) { return b.value; }));
        const beatsBench = j.hit_rate >= best - 0.05;
        const randomLike = j.hit_rate_ci[0] <= 50 && j.hit_rate_ci[1] >= 50;
        if (!beatsBench) {
            return ['ng', '벤치마크 미달',
                '단순 규칙(항상 한 방향)보다 낮습니다. 예측 수치를 의사결정 근거로 쓰지 마십시오.'];
        }
        if (randomLike) {
            return ['warn', '무작위와 구분 불가',
                '95% 신뢰구간이 50%를 포함합니다. 표본이 더 쌓여야 판단할 수 있습니다.'];
        }
        return ['ok', '벤치마크 상회', '단, 지속성은 별도로 확인해야 합니다.'];
    }

    function draw(j) {
        const v = verdict(j);
        const bestBench = j.benchmarks.reduce(function (a, b) { return b.value > a.value ? b : a; });
        const maxV = Math.max.apply(null, j.benchmarks.map(function (b) { return b.value; })) || 100;

        const bars = j.benchmarks.map(function (b) {
            const isModel = b.name === '모델';
            const w = (b.value / maxV * 100).toFixed(1);
            return '<div class="ms-bar-row">'
                + '<span class="ms-bar-label">' + b.name + '</span>'
                + '<span class="ms-bar-track"><i style="width:' + w + '%;background:'
                +   (isModel ? 'linear-gradient(90deg,#0ea5e9,#8b5cf6)' : '#334155') + '"></i></span>'
                + '<span class="ms-bar-num">' + b.value + '%</span></div>';
        }).join('');

        const periods = (j.periods || []).map(function (p) {
            const bad = p.hit_rate < 50;
            return '<tr><td>' + p.period + '</td><td>' + p.n + '건</td>'
                + '<td class="' + (bad ? 'ms-neg' : 'ms-pos') + '">' + p.hit_rate + '%</td></tr>';
        }).join('');

        const md = j.model_dir_acc || {};
        const bt = j.backtest || {};

        $('ms-body').innerHTML = ''
            + '<div class="ms-verdict ms-' + v[0] + '">'
            +   '<div class="ms-verdict-title">' + v[1] + '</div>'
            +   '<div class="ms-verdict-desc">' + v[2] + '</div>'
            + '</div>'

            + '<div class="ms-grid">'
            +   card(ic('clipboard') + '성적표', ''
            +     row('적중률', '<b class="' + (j.hit_rate < 50 ? 'ms-neg' : 'ms-pos') + '">' + j.hit_rate + '%</b>'
                     + ' <small>95%CI ' + j.hit_rate_ci[0] + '~' + j.hit_rate_ci[1] + '%</small>')
            +     row('표본 수', j.n + '건 (최근 ' + j.days + '일)')
            +     row('예측-실제 상관', '<b class="' + (Math.abs(j.correlation) < 0.1 ? 'ms-neg' : '') + '">r = '
                     + j.correlation + '</b> <small>R² ' + j.r_squared + '%</small>')
            +     row('MAE', j.mae + '%p'))

            +   card(ic('scale') + '벤치마크 대비', bars
            +     '<div class="ms-note">최강 벤치마크는 <b>' + bestBench.name + ' ' + bestBench.value + '%</b>입니다. '
            +     '모델이 이를 유의하게 넘지 못하면 예측에 가치가 없습니다.</div>')

            +   card(ic('compass') + '방향 편향', ''
            +     row('예측 DOWN 비율', j.pred_down_ratio + '%')
            +     row('실제 DOWN 비율', j.actual_down_ratio + '%')
            +     row('격차', '<b class="' + (j.bias_gap > 10 ? 'ms-neg' : 'ms-pos') + '">'
                     + j.bias_gap + '%p</b> <small>목표 &lt;10%p</small>'))

            +   card(ic('activity') + '모델별 방향 적중', ''
            +     row('GARCH-AR', (md.garch !== null && md.garch !== undefined ? md.garch + '%' : 'N/A'))
            +     row('Stacked Ensemble', (md.stack !== null && md.stack !== undefined ? md.stack + '%' : 'N/A'))
            +     row('Consensus', (md.consensus !== null && md.consensus !== undefined ? md.consensus + '%' : 'N/A')))
            + '</div>'

            + calibrationHtml(j)

            + (periods ? '<div class="ms-card ms-full"><h4>' + ic('calendar') + '기간별 성과 (불안정성)</h4>'
                + '<table class="ms-table"><thead><tr><th scope="col">기간</th><th scope="col">표본</th><th scope="col">적중률</th></tr></thead>'
                + '<tbody>' + periods + '</tbody></table>'
                + '<div class="ms-note">기간에 따라 성과가 크게 흔들린다면 우연일 가능성이 큽니다.</div></div>' : '')

            + '<div class="ms-card ms-full ms-backtest">'
            +   '<h4>' + ic('flask') + '시점정합 백테스트 (4.5년 · 약세장 포함)</h4>'
            +   '<div class="ms-bt-row">'
            +     '<div><span>모델 선별 샤프</span><b>' + bt.sharpe_model + '</b></div>'
            +     '<div><span>무작위 선별 샤프</span><b>' + bt.sharpe_random + '</b></div>'
            +     '<div><span>유의성</span><b class="ms-neg">z = +' + bt.z_score + '</b></div>'
            +   '</div>'
            +   '<div class="ms-note">' + (bt.note || '') + '</div>'
            + '</div>';
    }

    /* 캘리브레이션 — "확신도 70%인 예측이 실제로 70% 맞는가"
     * 확신도가 실제 정확도보다 높으면(음수 격차) 모델이 자기를 과대평가하는 것이다.
     * 이 경우 확신도 배지를 근거로 포지션을 키우면 안 된다. */
    function calibrationHtml(j) {
        const cal = j.calibration || [];
        if (!cal.length) return '';

        const rows = cal.map(function (c) {
            const over = c.gap < 0;                       // 실제 < 확신 = 과대평가
            const w1 = Math.max(0, Math.min(100, c.avg_confidence));
            const w2 = Math.max(0, Math.min(100, c.actual_accuracy));
            return '<div class="ms-cal-row">'
                + '<span class="ms-cal-bin">' + c.bin + '<small>n=' + c.n + '</small></span>'
                + '<span class="ms-cal-bars">'
                +   '<i class="ms-cal-conf" style="width:' + w1 + '%"><b>확신 ' + c.avg_confidence + '%</b></i>'
                +   '<i class="ms-cal-acc" style="width:' + w2 + '%"><b>실제 ' + c.actual_accuracy + '%</b></i>'
                + '</span>'
                + '<span class="ms-cal-gap ' + (over ? 'ms-neg' : 'ms-pos') + '">'
                +   (c.gap > 0 ? '+' : '') + c.gap + '%p</span>'
                + '</div>';
        }).join('');

        const ece = j.ece;
        const bad = ece !== null && ece !== undefined && ece >= 5;
        const verdictTxt = bad
            ? '확신도가 실제 정확도와 <b>' + ece + '%p</b> 어긋납니다. '
              + '대부분 구간에서 <b>모델이 자기를 과대평가</b>하고 있으므로, '
              + '확신도가 높다는 이유로 포지션을 키우지 마십시오.'
            : '확신도와 실제 정확도가 대체로 일치합니다 (ECE ' + ece + '%p).';

        return '<div class="ms-card ms-full">'
            + '<h4>' + ic('target') + '캘리브레이션 — 확신도가 믿을 만한가</h4>'
            + '<div class="ms-cal-legend">'
            +   '<span><i class="sw sw-conf"></i>모델이 주장한 확신도</span>'
            +   '<span><i class="sw sw-acc"></i>실제 적중률</span>'
            + '</div>'
            + rows
            + '<div class="ms-note ' + (bad ? 'ms-note-bad' : '') + '">' + verdictTxt + '</div>'
            + '</div>';
    }

    function card(title, body) {
        return '<div class="ms-card"><h4>' + title + '</h4>' + body + '</div>';
    }
    function row(k, v) {
        return '<div class="ms-row"><span>' + k + '</span><span>' + v + '</span></div>';
    }

    global.ModelScorecard = { render: render };
})(window);
