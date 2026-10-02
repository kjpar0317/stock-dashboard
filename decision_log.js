/* ============================================================================
 * decision_log.js — DECISION LOG 화면
 * ----------------------------------------------------------------------------
 * "왜 샀는가 / 왜 안 샀는가"를 볼 수 있게 한다.
 *
 * 왜 필요한가:
 *   v13에서 진입 게이트(레짐·기대값·밸류에이션·리스크예산·섹터집중·실적발표)를
 *   도입하면서 차단이 늘어난다. 기록이 없으면 봇이 멈춘 것처럼 보인다.
 *   또한 **차단 사유 집계가 곧 전략 개선의 입력**이 된다 —
 *   어디서 막히는지 보이면 무엇을 고칠지 알 수 있다.
 * ========================================================================== */
(function (global) {
    'use strict';

    const API = (global.TRADE_API_BASE || 'http://127.0.0.1:8000');
    let onlyBlocked = false;
    let days = 30;
    let strategy = '';
    let offset = 0;
    const PAGE = 50;
    let acc = [];          // 누적 표시 항목 (더보기)

    function $(id) { return document.getElementById(id); }

    // 이모지 대신 stroke 아이콘 — 없으면 조용히 생략한다
    function ic(name) {
        return (global.Icons && global.Icons.icon) ? global.Icons.icon(name) : '';
    }


    // 로그인은 되어 있으나 로컬 거래 서버가 꺼진 상태 안내.
    // 이 화면들은 QUANT LAB 드롭다운 안에 있어 로그아웃 시에는 애초에 보이지 않는다.
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

    const BLOCK_COLORS = {
        '레짐': '#8b5cf6', '기대값': '#ff2a55', '밸류에이션': '#f59e0b',
        '리스크예산': '#0ea5e9', '섹터집중': '#22d3ee', '실적발표': '#a78bfa',
        '중복보유': '#64748b', '수량0': '#94a3b8', '데이터부족': '#475569', '기타': '#334155'
    };

    function render() {
        const host = $('dl-body');
        if (!host) return;
        host.innerHTML = ''
            + '<div class="dl-controls">'
            +   '<label>기간<select id="dl-days">'
            +     '<option value="1">오늘</option><option value="7">7일</option>'
            +     '<option value="30" selected>30일</option><option value="90">90일</option>'
            +     '<option value="365">1년</option></select></label>'
            +   '<label>전략<select id="dl-strategy">'
            +     '<option value="">전체</option><option value="swing">스윙</option>'
            +     '<option value="trend">추세추종</option><option value="mean_reversion">낙주매매</option>'
            +     '<option value="breakout">돌파매매</option><option value="value">가치투자</option>'
            +     '<option value="scalping">스켈핑</option></select></label>'
            +   '<label class="dl-toggle"><input type="checkbox" id="dl-only-blocked"> 차단만 보기</label>'
            +   '<button id="dl-refresh" class="tp-btn tp-btn-primary">새로고침</button>'
            + '</div>'
            + '<div id="dl-summary"></div>'
            + '<div id="dl-list"><div class="tp-empty">불러오는 중…</div></div>'
            + '<div id="dl-more"></div>';

        $('dl-refresh').addEventListener('click', function () { reload(); });
        $('dl-only-blocked').addEventListener('change', function (e) {
            onlyBlocked = e.target.checked; reload();
        });
        $('dl-days').addEventListener('change', function (e) {
            days = parseInt(e.target.value, 10) || 30; reload();
        });
        $('dl-strategy').addEventListener('change', function (e) {
            strategy = e.target.value; reload();
        });
        reload();
    }

    function reload() { offset = 0; acc = []; load(); }

    async function load() {
        const list = $('dl-list');
        if (offset === 0) list.innerHTML = '<div class="tp-empty">불러오는 중…</div>';
        try {
            const qs = 'limit=' + PAGE + '&offset=' + offset
                + '&only_blocked=' + onlyBlocked + '&days=' + days
                + (strategy ? '&strategy=' + encodeURIComponent(strategy) : '');
            const res = await fetch(API + '/api/decisions?' + qs);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const j = await res.json();
            renderSummary(j.summary || {}, j.block_breakdown || []);
            acc = acc.concat(j.items || []);
            renderList(acc);
            renderMore(j.paging || {});
        } catch (e) {
            $('dl-summary').innerHTML = '';
            $('dl-more').innerHTML = '';
            list.innerHTML = serverOfflineHtml(e);
        }
    }

    function renderMore(pg) {
        const host = $('dl-more');
        if (!host) return;
        if (!pg.has_more) {
            host.innerHTML = acc.length
                ? '<div class="dl-hint" style="text-align:center;margin-top:.8rem;">'
                  + '전체 ' + (pg.filtered_total || acc.length) + '건을 모두 표시했습니다.</div>'
                : '';
            return;
        }
        host.innerHTML = '<div style="text-align:center;margin-top:1rem;">'
            + '<button id="dl-more-btn" class="tp-btn tp-btn-order">'
            + '더 보기 (' + acc.length + ' / ' + pg.filtered_total + ')</button></div>';
        $('dl-more-btn').addEventListener('click', function () {
            offset += PAGE; load();
        });
    }

    function renderSummary(s, breakdown) {
        const total = s.total_30d || 0;
        const bars = breakdown.map(function (b) {
            const pct = total ? (b.count / (s.blocked_30d || 1) * 100) : 0;
            const c = BLOCK_COLORS[b.reason] || '#334155';
            return '<div class="dl-bar-row">'
                + '<span class="dl-bar-label">' + b.reason + '</span>'
                + '<span class="dl-bar-track"><i style="width:' + pct.toFixed(1) + '%;background:' + c + '"></i></span>'
                + '<span class="dl-bar-num">' + b.count + '건</span></div>';
        }).join('');

        $('dl-summary').innerHTML = ''
            + '<div class="dl-summary">'
            +   '<div class="dl-stats">'
            +     stat('최근 30일 판정', total + '건')
            +     stat('진입 허용', (s.allowed_30d || 0) + '건', '#34d399')
            +     stat('차단', (s.blocked_30d || 0) + '건', '#ff2a55')
            +     stat('허용률', (s.allow_rate !== null && s.allow_rate !== undefined ? s.allow_rate + '%' : '-'))
            +   '</div>'
            +   (bars
                ? '<div class="dl-breakdown"><h4>' + ic('barChart') + '차단 사유 분포 (최근 30일)</h4>' + bars
                  + '<div class="dl-hint">가장 많이 막히는 지점이 곧 개선 대상입니다.</div></div>'
                : '<div class="dl-hint">차단 이력이 없습니다.</div>')
            + '</div>';
    }

    function stat(label, value, color) {
        return '<div class="dl-stat"><span>' + label + '</span>'
            + '<b' + (color ? ' style="color:' + color + '"' : '') + '>' + value + '</b></div>';
    }

    function renderList(items) {
        if (!items.length) {
            $('dl-list').innerHTML = '<div class="tp-empty">판정 이력이 없습니다. '
                + 'TRADE PLANNER에서 판정을 실행하거나 봇을 돌리면 여기에 쌓입니다.</div>';
            return;
        }
        const rows = items.map(function (it) {
            const ok = !!it.allowed;
            const reasons = (it.block_reasons && it.block_reasons.length)
                ? it.block_reasons.join(' · ')
                : ((it.warnings && it.warnings.length) ? it.warnings.join(' · ') : '-');
            return '<tr class="' + (ok ? 'dl-ok' : 'dl-blocked') + '">'
                + '<td>' + (it.decided_at || '').replace('T', ' ').slice(0, 16) + '</td>'
                + '<td><b>' + (it.symbol || '') + '</b><br><small>' + (it.name || '') + '</small></td>'
                + '<td>' + (it.strategy || '-') + '</td>'
                + '<td>' + (it.regime || '-') + '</td>'
                + '<td class="dl-verdict">' + (ok ? ic('check') + '허용' : ic('x') + '차단') + '</td>'
                + '<td class="dl-reason">' + reasons + '</td>'
                + '<td>' + (it.shares ? it.shares + '주' : '-') + '</td>'
                + '</tr>';
        }).join('');

        $('dl-list').innerHTML = ''
            + '<div class="dl-table-wrap"><table class="dl-table">'
            + '<thead><tr><th scope="col">시각</th><th scope="col">종목</th><th scope="col">전략</th><th scope="col">레짐</th>'
            + '<th scope="col">판정</th><th scope="col">사유</th><th scope="col">수량</th></tr></thead>'
            + '<tbody>' + rows + '</tbody></table></div>';
    }

    global.DecisionLog = { render: render };
})(window);
