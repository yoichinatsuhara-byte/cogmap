/*
 * CogMap — js/viz.js（ワーカーC所有・可視化専用モジュール）
 * SPEC.md §10 が正。依存ゼロ・Vanilla JS・DOM/SVG生成のみ（canvas禁止＝印刷品質のため）。
 * 色はハードコードせず、CSSカスタムプロパティ（--j0〜--j3 / --j-none / --ink / --sub / --line /
 * --accent / --ot / --st / --panel）を getComputedStyle で解決する。値が空ならSPEC §11の
 * フォールバック値を使う（このファイル冒頭 FALLBACK 参照）。
 *
 * window.Viz = {
 *   radar(el, items, opts)
 *     items: [{ label:string, value:number|null, max:number }]  3〜8軸のレーダーチャート（SVG）
 *     opts:  { size?:number }
 *     value=null の軸は点を打たず、軸ラベルをグレー(--sub)にする。目盛りリング0/1/2/3に
 *     「正常域/境界/低下/顕著な低下」を表示。v2: 外側=0正常域・中心=3顕著な低下に反転
 *     （半径=(3−値)/3）。値の意味は不変（大きい＝低下が強い）。塗りは半透明の--accent。
 *     リングラベルは白ハロー＋最終描画で軸線・データ多角形に埋もれないようにする。実寸で半径が
 *     小さいときは隣接ラベル間14px未満になるため0/3の両端のみ表示し、1/2は省略する（判読性優先）。
 *
 *   domainBars(el, rows)
 *     rows: [{ label, group, score:number|null, level:0-3|null, flagged:bool, evidenceCount:int,
 *              scoreLabel?:string, worst?:0-3|null, discordant?:bool }]  // v4任意フィールド（後方互換）
 *     v2: 正常=最長バーに反転（バー長=(3−score)/3）。数値ルーラーは持たず、1行キャプション
 *     「長いほど正常（右端=0 正常域）」で向きを示す（狭幅でのラベル衝突回避のため）。
 *     level色（--j0〜--j3）は従来どおり。score=nullは「未評価」バッジ（--j-none、バー外＝メタ欄に表示）。
 *     group見出し行で区切る。flagged=trueの行に▲（title="主指標で低下"）。
 *     各行に evidenceCount を「根拠n件」と小さく表示。SVGではなくHTML/CSSバー（印刷可・非canvas）。
 *
 *   matrix(el, data)
 *     data: { rows:[{id,name}], cols:[{id,name,discipline:"OT"|"ST"|"OT/ST"}],
 *             cells:[[{value:0-3|null, weight:0.3|0.6|1.0|null, tooltip:""}]] }
 *     HTMLテーブル。列ヘッダに検査名+職種バッジ。セルはjudgment色の●（weightでサイズ変化）。
 *     value=nullのセルは空。tooltipはtitle属性。
 *
 *   timeline(el, series, opts)
 *     series: [{ label, points:[{date:"YYYY-MM-DD", value:number|null}] }]
 *     opts:   { width?:number, height?:number }
 *     SVG折れ線。x=日付（等間隔・ラベル表示）、y=0〜3。v2: 上=0正常域・下=3顕著な低下に反転
 *     （「上がる=改善」に統一、レーダー/バーと整合）。系列ごとに色を変え、凡例を下に表示。
 *     点はtitleで値を表示。
 *
 * 各関数は el.innerHTML を置き換える冪等レンダリング。数値は小数1桁表示。
 * SVGテキストは font-family:inherit とし、日本語がはみ出さないよう余白を確保する。
 */
(function () {
  'use strict';

  // js/util.js（viz.jsより先にロード）が提供する共通ヘルパ。esc/LEVEL_LABELS/levelOf/fmt1を一本化。
  var U = window.CogUtil;

  // ---- SPEC §11 フォールバック値（CSSトークンが空のとき用） ----
  var FALLBACK = {
    bg: '#fafaf8',
    panel: '#ffffff',
    ink: '#1a2433',
    sub: '#5c6b7f',
    line: '#d9dee6',
    accent: '#1e3a5f',
    j0: '#7fb597',
    j1: '#d9b23e',
    j2: '#d97b4a',
    j3: '#b04a3c',
    jNone: '#c9cfd8',
    ot: '#2e6e8e',
    st: '#7a5c8e'
  };

  // ---- 汎用ヘルパ ----

  function token(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = (v || '').trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function clamp(v, min, max) {
    v = Number(v);
    if (isNaN(v)) return min;
    return Math.max(min, Math.min(max, v));
  }

  function formatDateLabel(d) {
    if (typeof d !== 'string') return String(d);
    var m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return d;
    return parseInt(m[2], 10) + '/' + parseInt(m[3], 10);
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    hex = String(hex).trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (hex.length !== 6) return null;
    var num = parseInt(hex, 16);
    if (isNaN(num)) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    function h(x) {
      x = Math.max(0, Math.min(255, Math.round(x)));
      var s = x.toString(16);
      return s.length < 2 ? '0' + s : s;
    }
    return '#' + h(r) + h(g) + h(b);
  }

  // amt>0: 白側へブレンド（明るく） / amt<0: 黒側へブレンド（暗く）
  function shade(hex, amt) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex;
    var t = amt > 0 ? 255 : 0;
    var p = Math.min(1, Math.abs(amt));
    return rgbToHex(
      rgb.r + (t - rgb.r) * p,
      rgb.g + (t - rgb.g) * p,
      rgb.b + (t - rgb.b) * p
    );
  }

  function emptyMsg(text) {
    return '<div class="cogmap-viz-empty">' + U.esc(text) + '</div>';
  }

  function judgmentLegendHtml(jColors, jNoneColor) {
    var items = jColors.map(function (c, i) {
      return '<span class="cogmap-viz-legend-item"><i style="background:' + c + '"></i>' +
        i + ' ' + U.LEVEL_LABELS[i] + '</span>';
    }).join('');
    items += '<span class="cogmap-viz-legend-item"><i style="background:' + jNoneColor + '"></i>未評価</span>';
    return '<div class="cogmap-viz-legend">' + items + '</div>';
  }

  // 系列カラーパレット: accent/ot/st/subを基本とし、必要数を超えたら明度違いの派生色を追加
  // （色相を無限サイクルさせない＝固定順で派生させる）
  function buildSeriesPalette(n, tk) {
    var base = [tk.accent, tk.ot, tk.st, tk.sub];
    var palette = base.slice(0, Math.min(n, base.length));
    var i = 0;
    while (palette.length < n) {
      var b = base[i % base.length];
      var round = Math.floor(i / base.length) + 1;
      var amt = (round % 2 === 1) ? 0.30 * round : -0.28 * round;
      palette.push(shade(b, amt));
      i++;
    }
    return palette;
  }

  // ---- 構造用スタイル（1回だけ注入。色は var(--token, フォールバック) を使用） ----

  var STYLE_ID = 'cogmap-viz-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.cogmap-viz-empty{color:var(--sub,' + FALLBACK.sub + ');font-size:.9em;padding:1em 0;}',
      '.cogmap-viz-legend{display:flex;flex-wrap:wrap;gap:.9em;margin:0 0 .75em;font-size:.8em;color:var(--sub,' + FALLBACK.sub + ');}',
      '.cogmap-viz-legend-item{display:inline-flex;align-items:center;gap:.4em;}',
      '.cogmap-viz-legend-item i{display:inline-block;width:10px;height:10px;border-radius:2px;flex:none;}',
      '.cogmap-viz-legend-item i.round{border-radius:50%;}',

      /* domainBars */
      '.cogmap-viz-bars{font-size:1em;}',
      '.cogmap-viz-scale-row{display:grid;grid-template-columns:minmax(110px,160px) 1fr minmax(150px,215px);gap:.6em;margin-bottom:.4em;}',
      '.cogmap-viz-scale-track{position:relative;height:14px;font-size:.72em;color:var(--sub,' + FALLBACK.sub + ');}',
      '.cogmap-viz-scale-track span{position:absolute;top:0;white-space:nowrap;transform:translateX(-50%);}',
      '.cogmap-viz-group-title{font-weight:600;color:var(--accent,' + FALLBACK.accent + ');margin:1em 0 .4em;padding-bottom:.25em;border-bottom:1px solid var(--line,' + FALLBACK.line + ');}',
      '.cogmap-viz-group:first-child .cogmap-viz-group-title{margin-top:0;}',
      '.cogmap-viz-row{display:grid;grid-template-columns:minmax(110px,160px) 1fr minmax(150px,215px);gap:.6em;align-items:center;padding:.3em 0;}',
      '.cogmap-viz-row-label{color:var(--ink,' + FALLBACK.ink + ');word-break:break-word;}',
      '.cogmap-viz-bar-track{position:relative;height:14px;background:var(--line,' + FALLBACK.line + ');border-radius:3px;overflow:hidden;}',
      '.cogmap-viz-bar-fill{position:absolute;top:0;left:0;bottom:0;border-radius:3px;}',
      '.cogmap-viz-badge-none{display:inline-block;font-size:.72em;padding:.1em .6em;border-radius:2px;color:var(--ink,' + FALLBACK.ink + ');}',
      '.cogmap-viz-row-meta{font-size:.8em;color:var(--sub,' + FALLBACK.sub + ');line-height:1.45;}',
      /* v4: 言葉主表示（levelラベル先頭・score数値はサブ）＋最悪併記＋不一致バッジ */
      '.cogmap-viz-level-label{font-weight:600;color:var(--ink,' + FALLBACK.ink + ');}',
      '.cogmap-viz-score-sub{font-size:.85em;color:var(--sub,' + FALLBACK.sub + ');}',
      '.cogmap-viz-worst{font-weight:600;}',
      '.cogmap-viz-discord{font-size:.85em;font-weight:600;color:var(--accent,' + FALLBACK.accent + ');border:1px solid var(--accent,' + FALLBACK.accent + ');border-radius:2px;padding:0 .35em;white-space:nowrap;}',
      '.cogmap-viz-flag{color:var(--j3,' + FALLBACK.j3 + ');margin-left:.35em;cursor:default;}',

      /* matrix */
      '.cogmap-viz-matrix-wrap{overflow:auto;max-height:72vh;border:1px solid var(--line,' + FALLBACK.line + ');}',
      '.cogmap-viz-matrix{border-collapse:collapse;font-size:.85em;min-width:100%;}',
      '.cogmap-viz-matrix thead th{position:sticky;top:0;background:var(--panel,' + FALLBACK.panel + ');z-index:2;border-bottom:1px solid var(--line,' + FALLBACK.line + ');padding:.45em .55em;vertical-align:bottom;text-align:center;}',
      '.cogmap-viz-matrix th.cogmap-viz-row-head{position:sticky;left:0;background:var(--panel,' + FALLBACK.panel + ');z-index:1;text-align:left;border-right:1px solid var(--line,' + FALLBACK.line + ');padding:.35em .6em;white-space:nowrap;font-weight:400;color:var(--ink,' + FALLBACK.ink + ');}',
      '.cogmap-viz-matrix th.cogmap-viz-corner{position:sticky;left:0;top:0;z-index:3;background:var(--panel,' + FALLBACK.panel + ');}',
      '.cogmap-viz-matrix td.cogmap-viz-cell{text-align:center;padding:.3em;border-bottom:1px solid var(--line,' + FALLBACK.line + ');}',
      '.cogmap-viz-matrix tbody tr:nth-child(even) td,.cogmap-viz-matrix tbody tr:nth-child(even) th.cogmap-viz-row-head{background:rgba(0,0,0,.025);}',
      '.cogmap-viz-col-name{font-weight:600;color:var(--ink,' + FALLBACK.ink + ');}',
      '.cogmap-viz-col-badges{margin-top:.2em;display:flex;gap:.2em;justify-content:center;}',
      '.cogmap-viz-badge{display:inline-block;font-size:.7em;color:#fff;padding:.05em .4em;border-radius:2px;}',
      '.cogmap-viz-dot{display:inline-block;border-radius:50%;}',

      /* timeline */
      '.cogmap-viz-timeline svg{max-width:100%;}',

      ''
    ].join('\n');
    document.head.appendChild(style);
  }

  // ---- Viz.radar ----

  function radar(el, items, opts) {
    if (!el) return;
    ensureStyle();
    opts = opts || {};
    items = Array.isArray(items) ? items : [];

    if (items.length < 3) {
      el.innerHTML = emptyMsg('レーダー表示には3軸以上のデータが必要です。');
      return;
    }

    var n = items.length;
    var size = opts.size || 520;
    var cx = size / 2;
    var cy = size / 2;
    // 日本語ラベルがはみ出さないよう広めの余白を確保
    var margin = Math.max(96, size * 0.26);
    var radius = size / 2 - margin;
    var maxScale = 3; // 判定スケールは常に0〜3固定

    var ink = token('--ink', FALLBACK.ink);
    var sub = token('--sub', FALLBACK.sub);
    var line = token('--line', FALLBACK.line);
    var accent = token('--accent', FALLBACK.accent);
    var panel = token('--panel', FALLBACK.panel);

    var angleStep = (2 * Math.PI) / n;
    function angleFor(i) { return -Math.PI / 2 + i * angleStep; }
    // v2反転: 外側=0正常域・中心=3顕著な低下（半径=(3−値)/3）。
    function radiusForValue(value) {
      var v = clamp(value, 0, maxScale);
      return radius * ((maxScale - v) / maxScale);
    }
    function pointFor(i, value) {
      var r = radiusForValue(value);
      var a = angleFor(i);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }

    // 目盛りリング（0〜3、反転済み: level0が外周・level3が中心）＋スポーク
    var ringLevels = [0, 1, 2, 3];
    var ringsSvg = '';
    var ringLabelSvg = '';
    // リングラベルはどの軸のスポーク上にも乗せず、隣接スポークの隙間（軸ラベルと重ならない位置）に
    // まとめて配置する。n=3〜8のとき常にこの角度は上寄り・cos>0側に収まる。
    var ringAngle = angleFor(0) + angleStep / 2;
    ringLevels.forEach(function (level) {
      var r = radiusForValue(level);
      if (r > 0.01) { // level3は中心点なので多角形は描かない（ラベルは描く）
        var pts = [];
        for (var i = 0; i < n; i++) {
          var a = angleFor(i);
          pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
        }
        ringsSvg += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="' + line + '" stroke-width="1"/>';
      }
    });

    // ラベルは全描画の最後（データ多角形・軸ラベルより手前）に重ねるため、文字列を積むだけにする。
    // 実寸（size=260〜300程度）だとradiusが小さく、0〜3の4本を等間隔配置すると団子状に重なる。
    // 隣接ラベル間に最低14pxを確保できない場合は、両端（0 正常域／3 顕著な低下）のみ表示する。
    var RING_LABEL_GAP = 14;
    var RING_LABEL_FLOOR = 16; // 中心(r=0)に潰れないよう、最内周ラベルの最小半径
    var outerR = radiusForValue(0);
    var fitsAllRingLabels = (outerR - RING_LABEL_FLOOR) >= RING_LABEL_GAP * (ringLevels.length - 1);
    var activeRingLevels = fitsAllRingLabels ? ringLevels : [0, 3];
    var prevLabelR = null;
    activeRingLevels.forEach(function (level) {
      var raw = radiusForValue(level);
      var labelR = (prevLabelR === null) ? raw : Math.min(raw, prevLabelR - RING_LABEL_GAP);
      labelR = Math.max(labelR, RING_LABEL_FLOOR);
      prevLabelR = labelR;
      var lx = cx + labelR * Math.cos(ringAngle);
      var ly = cy + labelR * Math.sin(ringAngle);
      var text = level + ' ' + U.LEVEL_LABELS[level];
      var w = text.length * 6.6 + 10;
      ringLabelSvg += '<g>' +
        '<rect x="' + (lx - w / 2).toFixed(2) + '" y="' + (ly - 9).toFixed(2) + '" width="' + w.toFixed(1) + '" height="14" rx="2" fill="' + panel + '"/>' +
        '<text x="' + lx.toFixed(2) + '" y="' + (ly + 2).toFixed(2) + '" font-size="10" font-weight="600" text-anchor="middle" fill="' + sub + '" ' +
        'paint-order="stroke" stroke="' + panel + '" stroke-width="3">' + U.esc(text) + '</text>' +
        '</g>';
    });

    var spokesSvg = '';
    for (var i = 0; i < n; i++) {
      var a = angleFor(i);
      var x2 = cx + radius * Math.cos(a);
      var y2 = cy + radius * Math.sin(a);
      spokesSvg += '<line x1="' + cx.toFixed(2) + '" y1="' + cy.toFixed(2) + '" x2="' + x2.toFixed(2) + '" y2="' + y2.toFixed(2) + '" stroke="' + line + '" stroke-width="1"/>';
    }

    // データ多角形（value=nullの軸は頂点として使わず、隣接する既知点同士を直結する）
    var knownIdx = [];
    for (var k = 0; k < n; k++) {
      var v = items[k] ? items[k].value : null;
      if (v !== null && v !== undefined && !isNaN(Number(v))) knownIdx.push(k);
    }

    var polySvg = '';
    var dotsSvg = '';
    if (knownIdx.length >= 3) {
      var pts3 = knownIdx.map(function (idx) {
        var p = pointFor(idx, items[idx].value);
        return p[0].toFixed(2) + ',' + p[1].toFixed(2);
      });
      polySvg = '<polygon points="' + pts3.join(' ') + '" fill="' + accent + '" fill-opacity="0.22" stroke="' + accent + '" stroke-width="2" stroke-linejoin="round"/>';
    } else if (knownIdx.length === 2) {
      var pts2 = knownIdx.map(function (idx) {
        var p = pointFor(idx, items[idx].value);
        return p[0].toFixed(2) + ',' + p[1].toFixed(2);
      });
      polySvg = '<polyline points="' + pts2.join(' ') + '" fill="none" stroke="' + accent + '" stroke-width="2"/>';
    }
    dotsSvg = knownIdx.map(function (idx) {
      var p = pointFor(idx, items[idx].value);
      var label = items[idx] && items[idx].label ? items[idx].label : '';
      return '<circle cx="' + p[0].toFixed(2) + '" cy="' + p[1].toFixed(2) + '" r="4.5" fill="' + accent + '" stroke="' + panel + '" stroke-width="1.5">' +
        '<title>' + U.esc(label) + ': ' + U.fmt1(items[idx].value) + '</title></circle>';
    }).join('');

    // 軸ラベル（象限に応じてtext-anchorとdyを調整し、はみ出しと重なりを避ける）
    var labelsSvg = items.map(function (it, idx) {
      var ang = angleFor(idx);
      var lx = cx + (radius + 16) * Math.cos(ang);
      var ly = cy + (radius + 16) * Math.sin(ang);
      var cos = Math.cos(ang);
      var sin = Math.sin(ang);
      var anchor = Math.abs(cos) < 0.2 ? 'middle' : (cos > 0 ? 'start' : 'end');
      var dy = sin > 0.4 ? 12 : (sin < -0.4 ? -3 : 4);
      var isNull = !it || it.value === null || it.value === undefined;
      var color = isNull ? sub : ink;
      var label = it && it.label ? it.label : '';
      return '<text x="' + lx.toFixed(2) + '" y="' + (ly + dy).toFixed(2) + '" font-size="12" text-anchor="' + anchor + '" fill="' + color + '">' + U.esc(label) + '</text>';
    }).join('');

    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" preserveAspectRatio="xMidYMid meet" role="img" ' +
      'aria-label="認知領域レーダーチャート" style="width:100%;height:auto;display:block;font-family:inherit">' +
      ringsSvg + spokesSvg + polySvg + dotsSvg + labelsSvg + ringLabelSvg +
      '</svg>';

    el.innerHTML = svg;
  }

  // ---- Viz.domainBars ----

  function domainBars(el, rows) {
    if (!el) return;
    ensureStyle();
    rows = Array.isArray(rows) ? rows : [];

    if (!rows.length) {
      el.innerHTML = emptyMsg('表示する領域データがありません。');
      return;
    }

    var j = [
      token('--j0', FALLBACK.j0),
      token('--j1', FALLBACK.j1),
      token('--j2', FALLBACK.j2),
      token('--j3', FALLBACK.j3)
    ];
    var jNone = token('--j-none', FALLBACK.jNone);

    var legend = judgmentLegendHtml(j, jNone);

    // v2反転: バー長=(3−score)/3。目盛りラベルは狭い幅で相互に重なるため、
    // 数値ルーラーはやめて向きだけを示す1行キャプションにする（数値は各行に表示済み）。
    var scaleRow = '<div class="cogmap-viz-scale-row" aria-hidden="true">' +
      '<span></span>' +
      '<div class="cogmap-viz-scale-track" style="text-align:right">' +
      '<span style="position:static;transform:none;white-space:nowrap">長いほど正常（右端=0 正常域）</span>' +
      '</div>' +
      '<span></span>' +
      '</div>';

    var groups = [];
    var groupIndex = {};
    rows.forEach(function (r) {
      var g = (r && r.group) || '';
      if (!(g in groupIndex)) {
        groupIndex[g] = groups.length;
        groups.push({ name: g, rows: [] });
      }
      groups[groupIndex[g]].rows.push(r);
    });

    var body = groups.map(function (grp) {
      var rowsHtml = grp.rows.map(function (r) {
        var hasScore = r.score !== null && r.score !== undefined && !isNaN(Number(r.score));
        var level = (r.level !== null && r.level !== undefined && !isNaN(Number(r.level)))
          ? clamp(Math.round(r.level), 0, 3)
          : (hasScore ? U.levelOf(r.score) : null);
        var evidenceCount = r.evidenceCount || 0;
        var scoreText = hasScore ? U.fmt1(r.score) : '—';
        var rowTitle = U.esc(r.label) + '：' + (hasScore ? scoreText + '（0〜3、大きいほど低下）' : '未評価') + '・根拠' + evidenceCount + '件';

        // v2反転: 正常=最長バー（バー長=(3−score)/3）。score=0はフル長の--j0バーになる。
        var barInner;
        if (hasScore) {
          var pct = (3 - clamp(r.score, 0, 3)) / 3 * 100;
          var color = level !== null ? j[level] : jNone;
          // score=3（顕著な低下）でもバー長0%は「未評価」の空トラックと見分けがつかないため、
          // 評価済みである限り最小幅(6px程度、level色)を保証する。
          barInner = '<div class="cogmap-viz-bar-fill" style="width:' + pct.toFixed(1) + '%;min-width:6px;background:' + color + '"></div>';
        } else {
          barInner = ''; // 未評価はトラックを空のまま（グレー地）にし、バッジはバー外＝メタ欄に置く
        }

        var flaggedMark = r.flagged ? '<span class="cogmap-viz-flag" title="主指標で低下">▲</span>' : '';

        // v4: メタ欄は「言葉」を主表示（levelラベル先頭）、score数値は小さくサブ表示。
        // worst>level のとき「最悪: 〜」を worst の判定色で併記。discordant は「不一致」バッジ。
        var discordBadge = r.discordant ? ' <span class="cogmap-viz-discord" title="同一領域で判定が割れています">不一致</span>' : '';
        var metaHtml;
        if (hasScore) {
          var lbl = (r.scoreLabel != null && r.scoreLabel !== '') ? r.scoreLabel
            : (level !== null ? U.LEVEL_LABELS[level] : '');
          var worstHtml = '';
          var wv = r.worst;
          if (wv !== null && wv !== undefined && !isNaN(Number(wv)) && level !== null && Number(wv) > level) {
            var wj = clamp(Math.round(wv), 0, 3);
            worstHtml = ' ・ <span class="cogmap-viz-worst" style="color:' + j[wj] + '">最悪: ' + U.LEVEL_LABELS[wj] + '</span>';
          }
          metaHtml = '<span class="cogmap-viz-level-label">' + U.esc(lbl) + '</span>' +
            ' ・ <span>根拠' + evidenceCount + '件</span>' +
            ' <span class="cogmap-viz-score-sub">(' + scoreText + ')</span>' +
            worstHtml + discordBadge;
        } else {
          metaHtml = '<span class="cogmap-viz-badge-none" style="background:' + jNone + '">未評価</span>' +
            ' ・ <span>根拠' + evidenceCount + '件</span>' + discordBadge;
        }

        return '<div class="cogmap-viz-row">' +
          '<div class="cogmap-viz-row-label">' + U.esc(r.label) + flaggedMark + '</div>' +
          '<div class="cogmap-viz-bar-track" title="' + rowTitle + '">' + barInner + '</div>' +
          '<div class="cogmap-viz-row-meta">' + metaHtml + '</div>' +
          '</div>';
      }).join('');

      return '<div class="cogmap-viz-group">' +
        '<div class="cogmap-viz-group-title">' + U.esc(grp.name) + '</div>' +
        rowsHtml +
        '</div>';
    }).join('');

    el.innerHTML = '<div class="cogmap-viz-bars">' + legend + scaleRow + body + '</div>';
  }

  // ---- Viz.matrix ----

  function matrix(el, data) {
    if (!el) return;
    ensureStyle();
    data = data || {};
    var rows = Array.isArray(data.rows) ? data.rows : [];
    var cols = Array.isArray(data.cols) ? data.cols : [];
    var cells = Array.isArray(data.cells) ? data.cells : [];

    if (!rows.length || !cols.length) {
      el.innerHTML = emptyMsg('表示する検査データがありません。評価入力を行うとここに反映マップが表示されます。');
      return;
    }

    var j = [
      token('--j0', FALLBACK.j0),
      token('--j1', FALLBACK.j1),
      token('--j2', FALLBACK.j2),
      token('--j3', FALLBACK.j3)
    ];
    var jNone = token('--j-none', FALLBACK.jNone);
    var ot = token('--ot', FALLBACK.ot);
    var st = token('--st', FALLBACK.st);
    var sub = token('--sub', FALLBACK.sub);
    var ink = token('--ink', FALLBACK.ink);

    function badge(text, color) {
      return '<span class="cogmap-viz-badge" style="background:' + color + '">' + U.esc(text) + '</span>';
    }

    function disciplineBadges(d) {
      if (d === 'OT/ST') return badge('OT', ot) + badge('ST', st);
      if (d === 'OT') return badge('OT', ot);
      if (d === 'ST') return badge('ST', st);
      return d ? badge(String(d), sub) : '';
    }

    function dotSize(w) {
      if (w === null || w === undefined || isNaN(Number(w))) return 0;
      if (Math.abs(w - 1) < 0.05) return 14;
      if (Math.abs(w - 0.6) < 0.05) return 10;
      if (Math.abs(w - 0.3) < 0.05) return 6;
      return 8; // 想定外の重み値への保険
    }

    var sizeLegend = '<div class="cogmap-viz-legend">' +
      '<span class="cogmap-viz-legend-item"><i class="round" style="width:14px;height:14px;background:' + ink + '"></i>主指標（重み1.0）</span>' +
      '<span class="cogmap-viz-legend-item"><i class="round" style="width:10px;height:10px;background:' + ink + '"></i>強く関与（重み0.6）</span>' +
      '<span class="cogmap-viz-legend-item"><i class="round" style="width:6px;height:6px;background:' + ink + '"></i>部分的に関与（重み0.3）</span>' +
      '<span class="cogmap-viz-legend-item"><i class="round" style="width:10px;height:10px;box-sizing:border-box;border:1.5px solid ' + jNone + '"></i>○ 未実施</span>' +
      '</div>';
    var colorLegend = judgmentLegendHtml(j, jNone);

    var theadCols = cols.map(function (c) {
      var name = (c && (c.shortName || c.name || c.id)) || '';
      return '<th class="cogmap-viz-col-head">' +
        '<div class="cogmap-viz-col-name">' + U.esc(name) + '</div>' +
        '<div class="cogmap-viz-col-badges">' + disciplineBadges(c && c.discipline) + '</div>' +
        '</th>';
    }).join('');

    var tbodyRows = rows.map(function (r, ri) {
      var rowCells = cols.map(function (c, ci) {
        var cell = (cells[ri] && cells[ri][ci]) || {};
        var val = cell.value;
        var w = cell.weight;
        var tip = cell.tooltip || '';
        if (w === null || w === undefined) {
          return '<td class="cogmap-viz-cell"></td>';
        }
        var size = dotSize(w);
        if (val === null || val === undefined) {
          var noneTitle = '未実施（検査項目はこの領域に関与）';
          var ring = '<span class="cogmap-viz-dot" style="width:' + size + 'px;height:' + size + 'px;box-sizing:border-box;border:1.5px solid ' + jNone + '"></span>';
          return '<td class="cogmap-viz-cell" title="' + U.esc(noneTitle) + '">' + ring + '</td>';
        }
        var lvl = clamp(Math.round(val), 0, 3);
        var dot = '<span class="cogmap-viz-dot" style="width:' + size + 'px;height:' + size + 'px;background:' + j[lvl] + '"></span>';
        return '<td class="cogmap-viz-cell" title="' + U.esc(tip) + '">' + dot + '</td>';
      }).join('');
      var rowName = (r && r.name) || (r && r.id) || '';
      return '<tr><th class="cogmap-viz-row-head" scope="row">' + U.esc(rowName) + '</th>' + rowCells + '</tr>';
    }).join('');

    var html = colorLegend + sizeLegend +
      '<div class="cogmap-viz-matrix-wrap">' +
      '<table class="cogmap-viz-matrix">' +
      '<thead><tr><th class="cogmap-viz-corner"></th>' + theadCols + '</tr></thead>' +
      '<tbody>' + tbodyRows + '</tbody>' +
      '</table>' +
      '</div>';

    el.innerHTML = html;
  }

  // ---- Viz.timeline ----

  function timeline(el, series, opts) {
    if (!el) return;
    ensureStyle();
    opts = opts || {};
    series = Array.isArray(series) ? series : [];

    var dateSet = {};
    series.forEach(function (s) {
      (s && Array.isArray(s.points) ? s.points : []).forEach(function (p) {
        if (p && p.date) dateSet[p.date] = true;
      });
    });
    var dates = Object.keys(dateSet).sort();

    if (!series.length || !dates.length) {
      el.innerHTML = emptyMsg('経過を表示するにはデータが2件以上必要です。');
      return;
    }

    var dateIndex = {};
    dates.forEach(function (d, i) { dateIndex[d] = i; });

    var W = opts.width || 720;
    var H = opts.height || 340;
    var marginL = 40;
    var marginR = 24;
    var marginT = 22;
    var manyDates = dates.length > 6;
    var marginB = manyDates ? 58 : 40;
    var plotW = W - marginL - marginR;
    var plotH = H - marginT - marginB;

    var sub = token('--sub', FALLBACK.sub);
    var line = token('--line', FALLBACK.line);
    var accent = token('--accent', FALLBACK.accent);
    var ot = token('--ot', FALLBACK.ot);
    var st = token('--st', FALLBACK.st);
    var panel = token('--panel', FALLBACK.panel);

    var palette = buildSeriesPalette(series.length, { accent: accent, ot: ot, st: st, sub: sub });

    function xFor(i) {
      return dates.length <= 1 ? marginL + plotW / 2 : marginL + plotW * (i / (dates.length - 1));
    }
    // v2反転: 上=0正常域・下=3顕著な低下（「上がる=改善」に統一）。
    function yFor(v) {
      var vv = clamp(v, 0, 3);
      return marginT + plotH * (vv / 3);
    }

    var gridSvg = '';
    var tickSvg = '';
    [0, 1, 2, 3].forEach(function (v) {
      var y = yFor(v);
      gridSvg += '<line x1="' + marginL + '" y1="' + y.toFixed(2) + '" x2="' + (marginL + plotW).toFixed(2) + '" y2="' + y.toFixed(2) + '" stroke="' + line + '" stroke-width="1"/>';
      tickSvg += '<text x="' + (marginL - 8) + '" y="' + (y + 4).toFixed(2) + '" font-size="11" text-anchor="end" fill="' + sub + '">' + v + '</text>';
    });

    var axisTitle = '<text x="4" y="14" font-size="11" fill="' + sub + '">低下度（上=正常）</text>';

    var axisLineSvg = '<line x1="' + marginL + '" y1="' + marginT + '" x2="' + marginL + '" y2="' + (marginT + plotH).toFixed(2) + '" stroke="' + line + '" stroke-width="1"/>' +
      '<line x1="' + marginL + '" y1="' + (marginT + plotH).toFixed(2) + '" x2="' + (marginL + plotW).toFixed(2) + '" y2="' + (marginT + plotH).toFixed(2) + '" stroke="' + line + '" stroke-width="1"/>';

    var xLabelsSvg = dates.map(function (d, i) {
      var x = xFor(i);
      var y = marginT + plotH + 16;
      var label = formatDateLabel(d);
      if (manyDates) {
        return '<text x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" font-size="10" fill="' + sub + '" text-anchor="end" transform="rotate(-40 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')">' + U.esc(label) + '</text>';
      }
      return '<text x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" font-size="10" fill="' + sub + '" text-anchor="middle">' + U.esc(label) + '</text>';
    }).join('');

    var seriesSvg = series.map(function (s, si) {
      var color = palette[si % palette.length];
      var label = (s && s.label) || '';
      var pts = ((s && s.points) || [])
        .filter(function (p) { return p && (p.date in dateIndex) && p.value !== null && p.value !== undefined && !isNaN(Number(p.value)); })
        .slice()
        .sort(function (a, b) { return dateIndex[a.date] - dateIndex[b.date]; });
      if (!pts.length) return '';

      var pathPts = pts.map(function (p) {
        return xFor(dateIndex[p.date]).toFixed(2) + ',' + yFor(p.value).toFixed(2);
      });
      var lineSvg = pts.length > 1
        ? '<polyline points="' + pathPts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
        : '';
      var dotsSvg = pts.map(function (p) {
        var x = xFor(dateIndex[p.date]);
        var y = yFor(p.value);
        return '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="4" fill="' + color + '" stroke="' + panel + '" stroke-width="1.2">' +
          '<title>' + U.esc(label) + ' ' + U.esc(formatDateLabel(p.date)) + ': ' + U.fmt1(p.value) + '</title></circle>';
      }).join('');
      return lineSvg + dotsSvg;
    }).join('');

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" ' +
      'aria-label="認知領域の経過グラフ" style="width:100%;height:auto;display:block;font-family:inherit">' +
      gridSvg + axisLineSvg + tickSvg + axisTitle + xLabelsSvg + seriesSvg +
      '</svg>';

    var legendHtml = '';
    if (series.length >= 2) {
      legendHtml = '<div class="cogmap-viz-legend">' + series.map(function (s, si) {
        return '<span class="cogmap-viz-legend-item"><i style="background:' + palette[si % palette.length] + '"></i>' + U.esc((s && s.label) || '') + '</span>';
      }).join('') + '</div>';
    }

    el.innerHTML = '<div class="cogmap-viz-timeline">' + svg + legendHtml + '</div>';
  }

  window.Viz = {
    radar: radar,
    domainBars: domainBars,
    matrix: matrix,
    timeline: timeline
  };
})();
