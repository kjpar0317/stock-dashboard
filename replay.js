/* ============================================================================
 * replay.js — DECISION REPLAY "나의 투자 복기"
 * ----------------------------------------------------------------------------
 *   매수 전 10초 기록  →  청산 후 자동 복기  →  월간 투자자 캐릭터 카드
 *
 * 다른 화면과 같은 원칙: **계산하지 않는다.** 전부 백엔드
 * (`scripts/trade/replay_api.py`)가 한다.
 *
 * ── 결과가 아니라 판단 과정 ──────────────────────────────────────
 * 수익률을 크게 두지 않는다. 크게 두면 사용자는 **운을 실력으로 배운다.**
 * 판정 문구가 먼저 오고 수익률은 그 옆에 작게 붙는다.
 *
 * ── 기록을 강요하지 않는다 ───────────────────────────────────────
 * 기록이 없으면 "아직 없습니다"로 끝낸다. 배지나 연속 기록 카운터를
 * 붙이지 않는다 — 기록 자체가 목적이 되면 내용이 빈다.
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
    const sgn = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat');

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
            + '<div class="sg-offline-desc">기록은 서버 DB 에 저장됩니다.<br>'
            + '아래 명령으로 서버를 켠 뒤 새로고침하세요.</div>'
            + '<code class="sg-offline-cmd">.\\start_trade_server.ps1</code>'
            + (e && e.message ? '<div class="sg-offline-err">' + esc(e.message) + '</div>' : '')
            + '</div>';
    }

    /* ── 매수 전 10초 기록 ─────────────────────────────────────────
     * 다섯 칸뿐이다. 늘리면 아무도 안 쓴다. */
    function form() {
        return '<section class="rp-form">'
            + '<h3>' + ic('edit') + '매수 전 10초 기록</h3>'
            + '<p class="rp-dim">지금 무엇을 기대하는지 적어두면 나중에 <b>결과가 아니라 '
            + '판단</b>을 복기할 수 있습니다. 당시 모델 의견과 시장 국면은 자동으로 함께 저장됩니다.</p>'
            + '<div class="rp-grid">'
            + '<label>종목<input id="rp-sym" placeholder="예: IONQ" autocomplete="off"></label>'
            + '<label>예상 보유<input id="rp-h" type="number" min="1" placeholder="일"></label>'
            + '<label>최대 허용 손실<input id="rp-loss" type="number" step="0.5" placeholder="%"></label>'
            + '<label>기록 시점 가격<input id="rp-px" type="number" step="0.01" placeholder="선택"></label>'
            + '</div>'
            + '<label class="rp-wide">왜 사는가<textarea id="rp-thesis" rows="2" '
            + 'placeholder="한 줄이면 충분합니다"></textarea></label>'
            //  무효화 조건이 없으면 가설을 반증할 수 없다 — 백엔드가 거부한다
            + '<label class="rp-wide">무효화 조건<textarea id="rp-inval" rows="2" '
            + 'placeholder="어떤 일이 생기면 생각을 바꿀 것인가"></textarea></label>'
            + '<div class="rp-actions"><button id="rp-save" class="tp-btn tp-btn-primary">기록</button>'
            + '<span id="rp-msg" class="rp-msg"></span></div>'
            + '</section>';
    }

    function characterCard(ch) {
        if (!ch || !ch.available) {
            return '<section class="rp-card rp-char is-thin"><h3>' + ic('user') + '투자자 캐릭터 카드</h3>'
                + '<p class="rp-dim">' + esc((ch && ch.message) || '기록이 쌓이면 만들어집니다.') + '</p></section>';
        }
        const li = (arr, cls) => (arr || []).map(x =>
            '<li class="' + cls + '">' + esc(x) + '</li>').join('');
        return '<section class="rp-card rp-char"><h3>' + ic('user') + '투자자 캐릭터 카드'
            + '<small>최근 ' + ch.days + '일</small></h3>'
            + '<p class="rp-char-label">' + md(ch.label) + '</p>'
            + '<div class="rp-char-cols">'
            + '<div><h4>강점</h4><ul>' + (li(ch.strengths, 'is-good') || '<li class="rp-dim">아직 없습니다</li>') + '</ul></div>'
            + '<div><h4>고칠 점</h4><ul>' + (li(ch.weaknesses, 'is-bad') || '<li class="rp-dim">아직 없습니다</li>') + '</ul></div>'
            + '</div>'
            + '<p class="rp-dim rp-note">' + md(ch.note || '')
            + (ch.thin ? ' <b>청산된 기록이 적어 참고용입니다.</b>' : '') + '</p></section>';
    }

    function openNote(n) {
        const s = n.snapshot || {};
        const p = s.prediction || {};
        return '<article class="rp-note is-open">'
            + '<div class="rp-note-head"><b>' + esc(n.name || n.symbol) + '</b>'
            + '<span class="rp-when">' + esc(String(n.created_at || '').slice(0, 10)) + '</span>'
            + '<button class="rp-close-btn" data-rp-close="' + n.id + '">청산 기록</button></div>'
            + '<p class="rp-thesis">' + esc(n.thesis || '') + '</p>'
            + '<dl class="rp-meta">'
            + '<dt>무효화 조건</dt><dd>' + esc(n.invalidation || '—') + '</dd>'
            + '<dt>계획</dt><dd>' + (n.horizon_days ? n.horizon_days + '일 보유' : '기간 미정')
            + (nz(n.max_loss_pct) ? '' : ' · 최대 손실 ' + Number(n.max_loss_pct).toFixed(1) + '%') + '</dd>'
            //  **당시** 모델 의견 — 지금 값이 아니다
            + (p.direction ? '<dt>당시 모델</dt><dd>' + esc(p.direction)
                + (nz(p.return) ? '' : ' ' + pct(p.return, 2))
                + (nz(p.confidence) ? '' : ' · 신뢰도 ' + Number(p.confidence).toFixed(2))
                + (s.market_regime ? ' · ' + esc(s.market_regime) : '') + '</dd>' : '')
            + '</dl></article>';
    }

    function closedNote(c) {
        const checks = (c.checks || []).map(k =>
            '<li class="rp-c-' + esc(k[0]) + '">' + esc(k[1]) + '</li>').join('');
        //  **수익률을 머리에 두지 않는다.** 카드 맨 위에 %가 있으면 눈이
        //  거기로 먼저 가고, 그러면 결과로 학습하게 된다. 판정을 먼저 읽고
        //  결과는 맨 아래에 한 줄로 붙인다.
        return '<article class="rp-note is-closed rp-v-' + esc((c.verdict || [])[0] || 'warn') + '">'
            + '<div class="rp-note-head"><b>' + esc(c.name || c.symbol) + '</b>'
            + '<span class="rp-when">' + esc(String(c.created_at || '').slice(0, 10))
            + ' → ' + esc(String(c.closed_at || '').slice(0, 10))
            + (nz(c.held_days) ? '' : ' · ' + c.held_days + '일') + '</span></div>'
            + '<p class="rp-verdict">' + md((c.verdict || [])[1] || '') + '</p>'
            + '<p class="rp-thesis">“' + esc(c.thesis || '') + '”</p>'
            + (checks ? '<ul class="rp-checks">' + checks + '</ul>' : '')
            + (nz(c.return_pct) ? '' : '<p class="rp-outcome">결과 '
                + '<b class="' + sgn(c.return_pct) + '">' + pct(c.return_pct) + '</b>'
                + ' <small>— 판단의 좋고 나쁨과는 별개입니다</small></p>')
            + '</article>';
    }

    function draw(j) {
        const ch = j.character;
        return form()
            + characterCard(ch)
            + '<section class="rp-card"><h3>' + ic('clock') + '진행 중인 기록'
            + '<small>' + j.n_open + '건</small></h3>'
            + (j.open && j.open.length ? j.open.map(openNote).join('')
                : '<p class="rp-dim">아직 없습니다. 위에서 기록하면 여기 쌓입니다.</p>') + '</section>'
            + '<section class="rp-card"><h3>' + ic('check') + '복기'
            + '<small>' + j.n_closed + '건</small></h3>'
            + (j.closed && j.closed.length ? j.closed.map(closedNote).join('')
                : '<p class="rp-dim">청산된 기록이 없습니다.</p>') + '</section>'
            + '<footer class="td-foot"><div>갱신 ' + esc(j.generated_at || '—') + '</div>'
            + '<ul class="td-caveats">' + (j.caveats || []).map(c =>
                '<li>' + md(c) + '</li>').join('') + '</ul></footer>';
    }

    async function renderReplay() {
        const host = $('replay-body');
        if (!host) return;
        host.innerHTML = '<div class="ql-loading" role="status" aria-live="polite">'
            + '<span class="ql-spin" aria-hidden="true"></span>기록을 불러오는 중…</div>';
        let j;
        try { j = await api('/api/replay?days=30'); }
        catch (e) { host.innerHTML = offline(e); return; }
        if (!j.available) {
            host.innerHTML = '<div class="ql-empty">' + ic('alert') + esc(j.message) + '</div>';
            return;
        }
        host.innerHTML = draw(j);
    }

    /* 위임으로 받는다 — script.js 가 동적 로드라 DOMContentLoaded 는 끝나 있다 */
    document.addEventListener('click', async (e) => {
        if (e.target.closest('#rp-save')) {
            const msg = $('rp-msg');
            const val = (id) => (($(id) || {}).value || '').trim();
            const numv = (id) => { const v = val(id); return v === '' ? null : Number(v); };
            if (msg) { msg.textContent = '저장 중…'; msg.className = 'rp-msg'; }
            let r;
            try {
                r = await api('/api/replay/note', {
                    symbol: val('rp-sym'), thesis: val('rp-thesis'),
                    invalidation: val('rp-inval'), horizon_days: numv('rp-h'),
                    max_loss_pct: numv('rp-loss'), entry_price: numv('rp-px'),
                });
            } catch (err) { if (msg) { msg.textContent = '서버에 연결할 수 없습니다.'; msg.className = 'rp-msg is-bad'; } return; }
            if (!r.available) {
                //  거부 사유를 **그대로** 보여준다 — 무엇이 빠졌는지 알아야 채운다
                if (msg) { msg.textContent = r.message || '저장하지 못했습니다.'; msg.className = 'rp-msg is-bad'; }
                return;
            }
            renderReplay();
            return;
        }
        const cb = e.target.closest('[data-rp-close]');
        if (cb) {
            const px = prompt('청산 가격을 입력하세요 (모르면 비워두세요)');
            if (px === null) return;
            try {
                await api('/api/replay/close', {
                    id: Number(cb.dataset.rpClose),
                    exit_price: px.trim() === '' ? null : Number(px)
                });
            } catch (err) { /* 아래에서 다시 그린다 */ }
            renderReplay();
        }
    });

    global.Replay = { renderReplay };
})(window);
