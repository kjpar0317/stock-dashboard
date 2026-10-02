/* ============================================================================
 * signal_quality.js — SIGNAL 규칙별 실측 성적 (정적 스냅샷)
 * ----------------------------------------------------------------------------
 * 자동 생성 파일 — 직접 수정하지 마십시오.
 *     python -m scripts.report.gen_signal_quality
 *
 * SIGNAL 화면은 거래 서버 없이도 동작해야 하므로 측정 결과를 여기 굽는다.
 * 서버가 켜져 있으면 `/api/lab/signal-quality` 로 최신값을 덮어쓴다.
 *
 * 읽는 법
 * -------
 *   expectancy_net     : 왕복 비용 반영 후 거래당 R배수
 *   z                  : 무조건 진입 대비 Welch z
 *   grade              : good(우위) / none(구분 불가) / bad(열위)
 *   direction_mismatch : 화면이 주장하는 방향과 실측이 반대
 *
 * 주의: 규칙을 동시에 여러 개 검정하므로 Bonferroni 보정 임계값
 * (`z_critical`)을 쓴다. |z|≥2 하나쯤은 우연히 나온다.
 * ========================================================================== */
window.SIGNAL_QUALITY = {
    "generated": "2026-08-11",
    "strategy": "swing",
    "strategy_label": "스윙",
    "years": 4.5,
    "cost_bp": 15.0,
    "symbols": 60,
    "z_critical": 2.14,
    "n_tested": 32,
    "baseline": {
        "n": 20534,
        "expectancy": 0.0153,
        "expectancy_net": -0.081,
        "oos": 0.0083
    },
    "rules": {
        "cmf_neg": {
            "label": "자금 유출 (CMF<-0.1)",
            "claimed": "DOWN",
            "n": 4081,
            "expectancy": 0.0787,
            "expectancy_net": -0.0105,
            "win_rate": 24.1,
            "z": 3.14,
            "grade": "good",
            "verdict": "앞·뒤 구간 모두 통과",
            "direction_mismatch": true
        },
        "ma_golden_cross": {
            "label": "골든크로스 진행 (5>20)",
            "claimed": "UP",
            "n": 3835,
            "expectancy": 0.0647,
            "expectancy_net": -0.0278,
            "win_rate": 24.6,
            "z": 2.35,
            "grade": "good",
            "verdict": "앞·뒤 구간 모두 통과",
            "direction_mismatch": false
        },
        "rsi_le30": {
            "label": "RSI 과매도 (≤30)",
            "claimed": "UP",
            "n": 764,
            "expectancy": 0.1521,
            "expectancy_net": 0.0722,
            "win_rate": 25.7,
            "z": 3.28,
            "grade": "weak",
            "verdict": "앞 구간에서 유의하지 않음 (뒷 구간만 우위)",
            "direction_mismatch": false
        },
        "drop_3d": {
            "label": "3일 연속 하락",
            "claimed": "UP",
            "n": 2321,
            "expectancy": 0.1077,
            "expectancy_net": 0.0162,
            "win_rate": 25.1,
            "z": 3.55,
            "grade": "weak",
            "verdict": "앞 구간에서 유의하지 않음 (뒷 구간만 우위)",
            "direction_mismatch": false
        },
        "rsi_le35": {
            "label": "RSI 과매도 (≤35)",
            "claimed": "UP",
            "n": 2020,
            "expectancy": 0.0953,
            "expectancy_net": 0.0126,
            "win_rate": 24.5,
            "z": 2.96,
            "grade": "weak",
            "verdict": "앞 구간에서 유의하지 않음 (뒷 구간만 우위)",
            "direction_mismatch": false
        },
        "ma_bearish": {
            "label": "이동평균 역배열",
            "claimed": "DOWN",
            "n": 5503,
            "expectancy": 0.0726,
            "expectancy_net": -0.0129,
            "win_rate": 24.3,
            "z": 3.2,
            "grade": "weak",
            "verdict": "앞 구간에서 유의하지 않음 (뒷 구간만 우위)",
            "direction_mismatch": false
        },
        "stoch_le20": {
            "label": "스토캐스틱 과매도 (≤20)",
            "claimed": "UP",
            "n": 4240,
            "expectancy": 0.0573,
            "expectancy_net": -0.0313,
            "win_rate": 23.4,
            "z": 2.14,
            "grade": "weak",
            "verdict": "앞 구간에서 유의하지 않음 (뒷 구간만 우위)",
            "direction_mismatch": false
        },
        "williams_le80": {
            "label": "윌리엄스 %R 과매도",
            "claimed": "UP",
            "n": 4240,
            "expectancy": 0.0573,
            "expectancy_net": -0.0313,
            "win_rate": 23.4,
            "z": 2.14,
            "grade": "weak",
            "verdict": "앞 구간에서 유의하지 않음 (뒷 구간만 우위)",
            "direction_mismatch": false
        },
        "wyckoff_spring": {
            "label": "와이코프 스프링",
            "claimed": "UP",
            "n": 1037,
            "expectancy": 0.0866,
            "expectancy_net": -0.0029,
            "win_rate": 25.4,
            "z": 1.91,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "bb_lower_break": {
            "label": "볼린저 하단 이탈",
            "claimed": "UP",
            "n": 1010,
            "expectancy": 0.0648,
            "expectancy_net": -0.021,
            "win_rate": 23.8,
            "z": 1.35,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "vol_surge": {
            "label": "거래량 급증 (2배↑)",
            "claimed": "UP",
            "n": 626,
            "expectancy": 0.0589,
            "expectancy_net": -0.0246,
            "win_rate": 25.2,
            "z": 0.92,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "below_ma200": {
            "label": "200일선 아래",
            "claimed": "DOWN",
            "n": 8696,
            "expectancy": 0.0465,
            "expectancy_net": -0.0386,
            "win_rate": 23.5,
            "z": 2.07,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "near_60d_low": {
            "label": "60일 저점 근접 (10%내)",
            "claimed": "UP",
            "n": 7979,
            "expectancy": 0.0356,
            "expectancy_net": -0.0641,
            "win_rate": 23.0,
            "z": 1.32,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "adx_strong": {
            "label": "강추세 (ADX≥25)",
            "claimed": "UP",
            "n": 8255,
            "expectancy": 0.0287,
            "expectancy_net": -0.0686,
            "win_rate": 23.0,
            "z": 0.87,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "macd_hist_pos": {
            "label": "MACD 상승 추세",
            "claimed": "UP",
            "n": 10467,
            "expectancy": 0.0281,
            "expectancy_net": -0.0689,
            "win_rate": 22.8,
            "z": 0.9,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "roc12_neg": {
            "label": "12일 모멘텀 하락",
            "claimed": "DOWN",
            "n": 9462,
            "expectancy": 0.0195,
            "expectancy_net": -0.0715,
            "win_rate": 22.5,
            "z": 0.29,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "below_vwap": {
            "label": "VWAP 아래",
            "claimed": "UP",
            "n": 9450,
            "expectancy": 0.018,
            "expectancy_net": -0.0724,
            "win_rate": 22.3,
            "z": 0.18,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "stoch_ge80": {
            "label": "스토캐스틱 과매수 (≥80)",
            "claimed": "DOWN",
            "n": 5415,
            "expectancy": 0.0159,
            "expectancy_net": -0.0876,
            "win_rate": 22.8,
            "z": 0.03,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "adx_range": {
            "label": "횡보 (ADX<18)",
            "claimed": "UP",
            "n": 6029,
            "expectancy": 0.0083,
            "expectancy_net": -0.0882,
            "win_rate": 22.0,
            "z": -0.41,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "roc12_pos": {
            "label": "12일 모멘텀 상승",
            "claimed": "UP",
            "n": 11059,
            "expectancy": 0.0123,
            "expectancy_net": -0.0886,
            "win_rate": 22.2,
            "z": -0.22,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "wyckoff_upthrust": {
            "label": "와이코프 업스러스트",
            "claimed": "DOWN",
            "n": 1301,
            "expectancy": 0.0137,
            "expectancy_net": -0.0898,
            "win_rate": 22.7,
            "z": -0.05,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "cmf_pos": {
            "label": "자금 유입 (CMF>0.1)",
            "claimed": "UP",
            "n": 6318,
            "expectancy": 0.0099,
            "expectancy_net": -0.0935,
            "win_rate": 22.2,
            "z": -0.33,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "macd_hist_neg": {
            "label": "MACD 하락 추세",
            "claimed": "DOWN",
            "n": 10067,
            "expectancy": 0.0021,
            "expectancy_net": -0.0936,
            "win_rate": 21.8,
            "z": -0.94,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "obv_up": {
            "label": "OBV 상승 추세",
            "claimed": "UP",
            "n": 10824,
            "expectancy": -0.0094,
            "expectancy_net": -0.1103,
            "win_rate": 21.5,
            "z": -1.79,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "above_ma200": {
            "label": "200일선 위",
            "claimed": "UP",
            "n": 11838,
            "expectancy": -0.0075,
            "expectancy_net": -0.1122,
            "win_rate": 21.4,
            "z": -1.71,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "rsi_ge70": {
            "label": "RSI 과매수 (≥70)",
            "claimed": "DOWN",
            "n": 1496,
            "expectancy": -0.0185,
            "expectancy_net": -0.1288,
            "win_rate": 21.6,
            "z": -1.08,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "near_60d_high": {
            "label": "60일 고점 근접 (3%내)",
            "claimed": "DOWN",
            "n": 4372,
            "expectancy": -0.0131,
            "expectancy_net": -0.1316,
            "win_rate": 21.2,
            "z": -1.47,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "bb_upper_break": {
            "label": "볼린저 상단 돌파",
            "claimed": "DOWN",
            "n": 1209,
            "expectancy": -0.0521,
            "expectancy_net": -0.1526,
            "win_rate": 20.5,
            "z": -2.02,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "rsi_ge80": {
            "label": "RSI 극과매수 (≥80)",
            "claimed": "DOWN",
            "n": 147,
            "expectancy": -0.1081,
            "expectancy_net": -0.2148,
            "win_rate": 24.6,
            "z": -1.36,
            "grade": "none",
            "verdict": "무조건 진입과 구분 불가",
            "direction_mismatch": false
        },
        "ma_bullish": {
            "label": "이동평균 정배열",
            "claimed": "UP",
            "n": 7208,
            "expectancy": -0.0184,
            "expectancy_net": -0.1247,
            "win_rate": 20.9,
            "z": -2.14,
            "grade": "bad",
            "verdict": "무조건 진입보다 열위",
            "direction_mismatch": true
        },
        "ma_long_up": {
            "label": "장기 상승 (60>120)",
            "claimed": "UP",
            "n": 11385,
            "expectancy": -0.0265,
            "expectancy_net": -0.1285,
            "win_rate": 21.0,
            "z": -3.09,
            "grade": "bad",
            "verdict": "무조건 진입보다 열위",
            "direction_mismatch": true
        },
        "bb_squeeze": {
            "label": "볼린저 변동성 수축",
            "claimed": "NEUTRAL",
            "n": 4583,
            "expectancy": -0.0351,
            "expectancy_net": -0.1392,
            "win_rate": 20.7,
            "z": -2.66,
            "grade": "bad",
            "verdict": "무조건 진입보다 열위",
            "direction_mismatch": false
        }
    }
};
