/* ============================================================================
 * icons.js — 인라인 SVG 아이콘 세트
 * ----------------------------------------------------------------------------
 * 이모지 대신 stroke 기반 아이콘을 쓴다.
 *
 * 이모지의 문제:
 *   - OS·브라우저마다 모양과 크기가 달라 정렬이 깨진다
 *   - 색을 제어할 수 없어 다크 테마·상태 색상과 따로 논다
 *   - 굵기·스타일이 제각각이라 화면 전체의 시각적 일관성이 무너진다
 *
 * 설계 원칙 (Feather/Lucide 계열):
 *   - viewBox 24×24, stroke-width 1.75, round cap/join, fill 없음
 *   - stroke="currentColor" — 부모 색상을 그대로 상속하므로
 *     상태(성공/경고/위험)에 따라 CSS만으로 색이 따라온다
 *   - 기본 표시 크기 16px, 텍스트 baseline 에 맞춰 정렬
 * ========================================================================== */
(function (global) {
    'use strict';

    // path 데이터만 보관 — 래퍼는 icon() 이 공통으로 씌운다
    const PATHS = {
        shield:     '<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z"/>',
        trending:   '<polyline points="3 16 9 10 13 14 21 6"/><polyline points="15 6 21 6 21 12"/>',
        activity:   '<polyline points="3 12 7 12 10 4 14 20 17 12 21 12"/>',
        target:     '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
        check:      '<polyline points="4 12.5 9.5 18 20 6.5"/>',
        x:          '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
        alert:      '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.5" r=".9" fill="currentColor" stroke="none"/>',
        sliders:    '<line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2.4"/><circle cx="15" cy="16" r="2.4"/>',
        barChart:   '<line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="19" y1="20" x2="19" y2="15"/>',
        list:       '<line x1="8" y1="7" x2="20" y2="7"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="17" x2="20" y2="17"/><circle cx="4.4" cy="7" r=".9" fill="currentColor" stroke="none"/><circle cx="4.4" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="4.4" cy="17" r=".9" fill="currentColor" stroke="none"/>',
        tag:        '<path d="M11.5 3.5H20V12l-8.5 8.5L3 12l8.5-8.5z"/><circle cx="16" cy="8" r="1.4"/>',
        news:       '<path d="M4 5h13v14H5.5A1.5 1.5 0 014 17.5V5z"/><path d="M17 9h3v8.5a1.5 1.5 0 01-3 0V9z"/><line x1="7" y1="9" x2="14" y2="9"/><line x1="7" y1="13" x2="14" y2="13"/>',
        scale:      '<line x1="12" y1="4" x2="12" y2="20"/><line x1="6" y1="20" x2="18" y2="20"/><path d="M12 7L6 13h5.9"/><path d="M12 7l6 6h-5.9"/>',
        compass:    '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5"/>',
        flask:      '<path d="M10 3v6L5 18a1.6 1.6 0 001.4 2.4h11.2A1.6 1.6 0 0019 18l-5-9V3"/><line x1="9" y1="3" x2="15" y2="3"/>',
        calendar:   '<rect x="4" y="6" width="16" height="14" rx="2"/><line x1="4" y1="10.5" x2="20" y2="10.5"/><line x1="9" y1="3.5" x2="9" y2="7"/><line x1="15" y1="3.5" x2="15" y2="7"/>',
        auto:       '<path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12L13 3z"/>',
        clipboard:  '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9.5 5V4a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0114.5 4v1"/><line x1="9.5" y1="11" x2="14.5" y2="11"/><line x1="9.5" y1="15" x2="14.5" y2="15"/>',
    };

    /**
     * @param {string} name  PATHS 키
     * @param {object} opt   {size, cls, title}
     */
    function icon(name, opt) {
        const o = opt || {};
        const d = PATHS[name];
        if (!d) return '';
        const size = o.size || 16;
        const cls = 'ic' + (o.cls ? ' ' + o.cls : '');
        return '<svg class="' + cls + '" width="' + size + '" height="' + size + '"'
            + ' viewBox="0 0 24 24" fill="none" stroke="currentColor"'
            + ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
            + ' aria-hidden="true" focusable="false">'
            + (o.title ? '<title>' + o.title + '</title>' : '')
            + d + '</svg>';
    }

    /** 제목용 — 아이콘 + 텍스트를 baseline 정렬로 묶는다 */
    function heading(name, text, opt) {
        return '<span class="ic-head">' + icon(name, opt) + '<span>' + text + '</span></span>';
    }

    global.Icons = { icon: icon, heading: heading, PATHS: PATHS };
})(window);
