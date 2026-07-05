/* js/util.js — 共通ユーティリティ（SPEC §13.5-1）。
 * esc / 判定ラベル / レベル閾値 / 表示桁 を全ファイルでこれ一本に集約する。
 * IIFE・依存ゼロ。store/profile/viz/app より先にロードされる（script順: data/*.js → js/util.js → …）。
 *
 * 契約（他ファイルはこの定義のみに依存する）:
 *   CogUtil.esc(s)          → HTMLエスケープ済み文字列（null/undefined は ""）
 *   CogUtil.LEVEL_LABELS    → ["正常域","境界","低下","顕著な低下"]（index = level 0..3）
 *   CogUtil.levelOf(score)  → null|0|1|2|3。null→null、<0.5→0、<1.25→1、<2.25→2、それ以上→3
 *                             （閾値は profile.js の現行実装と同一。判定の自動確定ではなく表示用の階級）
 *   CogUtil.fmt1(n)         → 小数1桁の文字列。null/非数（NaN/±Infinity/""）は "—"
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var LEVEL_LABELS = ["正常域", "境界", "低下", "顕著な低下"];

  // score→階級。閾値は profile.js と厳密一致（0.5 / 1.25 / 2.25）。
  function levelOf(score) {
    if (score == null) return null;
    if (score < 0.5) return 0;
    if (score < 1.25) return 1;
    if (score < 2.25) return 2;
    return 3;
  }

  // 表示用に小数1桁へ。null/空文字/非有限数は "—"。
  function fmt1(n) {
    if (n == null || n === "") return "—";
    var x = Number(n);
    if (!isFinite(x)) return "—";
    return x.toFixed(1);
  }

  global.CogUtil = {
    esc: esc,
    LEVEL_LABELS: LEVEL_LABELS,
    levelOf: levelOf,
    fmt1: fmt1
  };
})(window);
