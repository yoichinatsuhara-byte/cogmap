/* js/app.js — SPA本体（SPEC §12）。ハッシュルーティング。外部通信ゼロ。
 * 可視化は window.Viz を呼ぶが、未読込みでも落ちずプレースホルダを出す。
 * データ(COG_*)が未定義なら白画面にせず「データファイルが読み込めません」を表示。 */
(function () {
  "use strict";

  /* ---------- 定数 ---------- */
  var TABS = [
    { hash: "case", label: "ケース" },
    { hash: "input", label: "評価入力" },
    { hash: "profile", label: "プロファイル" },
    { hash: "matrix", label: "マトリクス" },
    { hash: "timeline", label: "経過" },
    { hash: "adl", label: "ADLの視点" },
    { hash: "norms", label: "基準" },
    { hash: "print", label: "印刷" }
  ];
  var JUDGMENTS = [
    { v: 0, label: "正常域" },
    { v: 1, label: "境界" },
    { v: 2, label: "低下" },
    { v: 3, label: "顕著な低下" }
  ];
  // 判定アンカー（運用定義・SPEC §12.2）。判定のブレを抑える共通基準。
  var ANCHORS = [
    { v: 0, label: "正常域", def: "基準・年齢/教育歴・観察所見から低下を支持しない。" },
    { v: 1, label: "境界", def: "カットオフ近傍、生活影響が不明、または疲労・失語・麻痺等の交絡で断定できない（結論ではなく再評価・観察の指示）。" },
    { v: 2, label: "低下", def: "基準未満または質的誤反応があり、ADL/訓練場面への影響が臨床的に想定される。" },
    { v: 3, label: "顕著な低下", def: "明確な基準逸脱・課題不能・重度誤反応、または安全・自立度への強い影響。" }
  ];
  // 判定根拠チップ 固定5種（SPEC §8 v4）。正典は Store.REASONS のみ参照（Store不在時は boot が止まる）。
  // 安全・ADLに直結するウォッチリスト（SPEC §12.3 ②③）は data/domains.js の watch:true から導出（下記 watchlist()）。
  var STORE_FAIL_MSG = "保存できませんでした。ブラウザの保存領域（容量・プライベートモード）を確認してください。";
  var CUR_KEY = "cogmap.current";     // 現在ケースid（Store外の軽量キー）
  var lastSessionDate = null, lastSessionDisc = null; // 直近保存した実施日・職種（同一セッション内のみ引き継ぐ）

  var view = document.getElementById("view");
  var navEl = document.getElementById("app-nav");
  var headerEl = document.getElementById("current-case");

  /* ---------- ユーティリティ ---------- */
  // esc / fmt1 は js/util.js（window.CogUtil）に一本化（SPEC §13.5-1）。
  var esc = CogUtil.esc;
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function todayStr() { return (window.Store && Store._nowDate) ? Store._nowDate() : new Date().toISOString().slice(0, 10); }
  function jLabel(v) { return v == null ? "未実施" : (JUDGMENTS[v] ? JUDGMENTS[v].label : String(v)); }
  function jAttr(v) { return v == null ? "none" : String(v); }
  function levelLabel(l) { return l == null ? "未評価" : jLabel(l); }
  function discBadge(d) {
    // 職種は常に OT / ST の単一値（Store が正規化・列は検査×職種）。"OT/ST" 分岐は到達不能のため削除（SPEC §13.5-8）。
    return '<span class="disc-badge ' + (d === "ST" ? "st" : "ot") + '">' + esc(d) + "</span>";
  }
  // スコアの画面表示は小数1桁に統一（SPEC §13.5-1）。null は "—"。
  function fmt(n) { return n == null ? "—" : CogUtil.fmt1(n); }

  // 安全・ADLに直結するウォッチリスト（data/domains.js の watch:true から導出・SPEC §13.5-8）。
  var _watch = null;
  function watchlist() {
    if (!_watch) _watch = domains().filter(function (d) { return d.watch; }).map(function (d) { return d.id; });
    return _watch;
  }

  // 「先にケースを選択」ガードの統一（6画面共通・SPEC §13.5 cleanup）。
  function requireCase(heading) {
    var c = currentCase();
    if (c) return c;
    view.innerHTML = "<h2>" + esc(heading) + "</h2>" + '<div class="empty">先にケースを選択してください。</div>';
    return null;
  }

  /* ---------- 判定アンカー（SPEC §12.2） ---------- */
  function anchorTitle(v) {
    var a = ANCHORS[v];
    return a ? (a.v + " " + a.label + " — " + a.def) : "";
  }
  function anchorPanelHtml() {
    var rows = ANCHORS.map(function (a) {
      return '<div class="anchor-row">' +
        '<span class="anchor-dot" style="background:var(--j' + a.v + ')"></span>' +
        '<b class="anchor-name">' + a.v + " " + esc(a.label) + "</b>" +
        '<span class="anchor-def">' + esc(a.def) + "</span></div>";
    }).join("");
    return '<details class="anchor-panel panel" open>' +
      '<summary>判定アンカー（運用定義・判定のブレを抑える共通基準）</summary>' +
      '<div class="anchor-rows">' + rows + "</div>" +
      '<div class="note-muted">判定は評価者が確定します。上は判定語の運用上の意味づけ（結論を強制するものではありません）。</div>' +
      "</details>";
  }

  /* ---------- マスタ参照（呼び出し時に window から） ---------- */
  function domains() { return window.COG_DOMAINS || []; }
  function groups() { return window.COG_GROUPS || []; }
  function assessments() { return window.COG_ASSESSMENTS || []; }
  function adlMap() { return window.COG_ADL_MAP || {}; }

  var _aIdx = null, _dIdx = null, _sIdx = null;
  function assessmentById(id) {
    if (!_aIdx) { _aIdx = {}; assessments().forEach(function (a) { _aIdx[a.id] = a; }); }
    return _aIdx[id] || null;
  }
  function domainById(id) {
    if (!_dIdx) { _dIdx = {}; domains().forEach(function (d) { _dIdx[d.id] = d; }); }
    return _dIdx[id] || null;
  }
  function subtestById(id) {
    if (!_sIdx) {
      _sIdx = {};
      assessments().forEach(function (a) {
        (a.subtests || []).forEach(function (s) { _sIdx[s.id] = { assessment: a, subtest: s }; });
      });
    }
    return _sIdx[id] || null;
  }
  function domainName(id) { var d = domainById(id); return d ? d.name : id; }

  /* ---------- 状態 ---------- */
  var state = {
    currentCaseId: null,
    selectedAssessmentId: null,   // 評価入力の選択検査
    editingSessionId: null,       // 編集中セッション
    flash: null                   // {type,text} 次描画で1回表示
  };

  function currentCase() { return state.currentCaseId ? Store.getCase(state.currentCaseId) : null; }
  function setCurrentCase(id) {
    state.currentCaseId = id;
    state.editingSessionId = null;
    try { id ? localStorage.setItem(CUR_KEY, id) : localStorage.removeItem(CUR_KEY); } catch (e) {}
    updateHeader();
  }
  function updateHeader() {
    var c = currentCase();
    headerEl.innerHTML = c ? "現在のケース: <strong>" + esc(c.label || "(無題)") + "</strong>" : "ケース未選択";
  }
  function flash(type, text) { state.flash = { type: type, text: text }; }
  function flashHtml() {
    if (!state.flash) return "";
    var f = state.flash; state.flash = null;
    return '<div class="msg ' + (f.type === "err" ? "err" : "ok") + '">' + esc(f.text) + "</div>";
  }

  /* ---------- Viz 呼び出し（未読込み/エラーでも落ちない） ---------- */
  function vizCall(fn, el, arg2, arg3) {
    if (window.Viz && typeof window.Viz[fn] === "function") {
      try { window.Viz[fn](el, arg2, arg3); return true; }
      catch (e) { console.error("Viz." + fn + " 実行エラー", e); }
    }
    el.innerHTML = '<div class="placeholder">可視化モジュール（js/viz.js）が未読込みのため、この図は表示できません。</div>';
    return false;
  }

  /* ---------- ルーティング ---------- */
  function currentHash() {
    var h = (location.hash || "").replace(/^#/, "");
    for (var i = 0; i < TABS.length; i++) if (TABS[i].hash === h) return h;
    return "case";
  }
  function renderNav() {
    var h = currentHash();
    navEl.innerHTML = TABS.map(function (t) {
      return '<a href="#' + t.hash + '" class="' + (t.hash === h ? "active" : "") + '">' + esc(t.label) + "</a>";
    }).join("");
  }
  // 開いている「基準を見る」ポップオーバーを確実に閉じる（keydownリーク＋画面残留の解消・SPEC §13.5-8）。
  function closeAnyPopover() {
    qsa(".pop-overlay").forEach(function (o) {
      if (typeof o._close === "function") o._close();
      else if (o.parentNode) o.parentNode.removeChild(o);
    });
  }
  function route() {
    closeAnyPopover();   // ハッシュ遷移でポップオーバーが残らないように必ず閉じる
    renderNav();
    var h = currentHash();
    var map = {
      case: renderCases, input: renderInput, profile: renderProfile,
      matrix: renderMatrix, timeline: renderTimeline, adl: renderAdl, norms: renderNorms, print: renderPrint
    };
    (map[h] || renderCases)();
    window.scrollTo(0, 0);
  }

  /* ========================================================= */
  /* 1. ケース                                                 */
  /* ========================================================= */
  function renderCases() {
    var cases = Store.listCases();
    var rows = cases.length ? cases.map(function (c) {
      var cur = c.id === state.currentCaseId;
      return '<div class="case-row ' + (cur ? "current" : "") + '">' +
        '<div><div class="label">' + esc(c.label || "(無題)") + "</div>" +
        '<div class="meta">作成 ' + esc(c.createdAt) + " / セッション " + c.sessions.length + " 件" +
        (c.memo ? " / " + esc(c.memo) : "") + "</div></div>" +
        '<div class="spacer"></div>' +
        (cur ? '<span class="chip">選択中</span>' : '<button class="small" data-act="select" data-id="' + c.id + '">選択</button>') +
        '<button class="small danger" data-act="delete" data-id="' + c.id + '">削除</button>' +
        "</div>";
    }).join("") : '<div class="empty">ケースがありません。下のフォームから作成してください。</div>';

    view.innerHTML =
      "<h2>ケース</h2>" +
      '<p class="lead">匿名ラベルで管理します。氏名・患者ID等の個人情報は入力しないでください。</p>' +
      flashHtml() +
      '<div class="panel"><h3>新規ケース</h3>' +
      '<label class="field"><span>匿名ラベル（例: A-01）</span><input type="text" id="new-label" maxlength="40" placeholder="A-01"></label>' +
      '<label class="field"><span>メモ（疾患名・経過など。氏名や患者IDは書かない）</span><textarea id="new-memo" placeholder="例: 右被殻出血 発症2週"></textarea></label>' +
      '<div class="note-caution">氏名・患者ID・生年月日など個人を特定できる情報は入力しないでください。</div>' +
      '<div class="btn-row"><button class="primary" data-act="create">ケースを作成</button></div></div>' +

      '<div class="panel"><h3>ケース一覧</h3>' + rows + "</div>";

    qs("[data-act='create']").addEventListener("click", function () {
      var label = qs("#new-label").value.trim();
      if (!label) { flash("err", "ラベルを入力してください。"); return renderCases(); }
      var c = Store.createCase(label, qs("#new-memo").value);
      if (!c) { flash("err", STORE_FAIL_MSG); return renderCases(); }   // 保存失敗（無言喪失禁止・SPEC §13.5-2）
      setCurrentCase(c.id);
      flash("ok", "ケース「" + c.label + "」を作成しました。");
      renderCases();
    });

    qsa("[data-act]").forEach(function (btn) {
      var act = btn.getAttribute("data-act"), id = btn.getAttribute("data-id");
      if (act === "select") btn.addEventListener("click", function () { setCurrentCase(id); flash("ok", "ケースを選択しました。"); renderCases(); });
      if (act === "delete") btn.addEventListener("click", function () {
        var c = Store.getCase(id);
        if (!confirm("ケース「" + (c ? c.label : "") + "」を削除します。よろしいですか？")) return;
        if (!Store.deleteCase(id)) { flash("err", STORE_FAIL_MSG); return renderCases(); }   // 保存失敗（SPEC §13.5-2）
        if (state.currentCaseId === id) setCurrentCase(null);
        flash("ok", "ケースを削除しました。");
        renderCases();
      });
    });
  }

  /* ========================================================= */
  /* 2. 評価入力                                               */
  /* ========================================================= */
  function assessmentPickerHtml(selectedId, disabled) {
    // カテゴリ別の optgroup。職種バッジは表示しない（実施職種はセッション側のOT/ST選択で入力・SPEC §12-2）
    var byCat = {};
    assessments().forEach(function (a) {
      var cat = a.category || "その他";
      (byCat[cat] = byCat[cat] || []).push(a);
    });
    // 編集中は検査の切り替え不可（文言と実装の一致・SPEC §13.5-6）
    var html = '<select id="pick-assessment"' + (disabled ? " disabled" : "") + ">";
    Object.keys(byCat).forEach(function (cat) {
      html += '<optgroup label="' + esc(cat) + '">';
      byCat[cat].forEach(function (a) {
        html += '<option value="' + a.id + '"' + (a.id === selectedId ? " selected" : "") + ">" +
          esc(a.shortName || a.name) + "（" + esc(a.name) + "）</option>";
      });
      html += "</optgroup>";
    });
    return html + "</select>";
  }

  /* ---------- 判定ガイド（SPEC §6 / §12-2）: 出典つきの目安を表示。自動選択はしない ---------- */
  function confLabel(conf) {
    return conf === "published" ? "公表基準" : (conf === "convention" ? "統計的慣例" : "");
  }
  function confBadge(conf) {
    if (conf === "published") return '<span class="conf pub">公表基準</span>';
    if (conf === "convention") return '<span class="conf conv">統計的慣例</span>';
    return "";
  }
  // 「要人間確認」フラグ（guide.text / guide.source / guide.note / note のいずれかに含まれる場合）
  function needsHumanCheck(sub) {
    var g = (sub && sub.guide) || {};
    var hay = String(g.text || "") + " " + String(g.source || "") + " " +
      String(g.note || "") + " " + String((sub && sub.note) || "");
    return hay.indexOf("要人間確認") >= 0;
  }
  function jbadgeHtml(v) { return '<span class="jbadge" data-j="' + jAttr(v) + '">' + jLabel(v) + "</span>"; }
  function bandRangeText(b) {
    if (b.min == null && b.max == null) return "—";
    if (b.min != null && b.max != null) return esc(b.min) + "〜" + esc(b.max);
    if (b.min != null) return esc(b.min) + " 以上";
    return esc(b.max) + " 以下";
  }
  function bandsTableHtml(bands) {
    if (!bands || !bands.length) return "";
    var rows = bands.map(function (b) {
      return "<tr><td>" + jbadgeHtml(b.judgment) + "</td><td>" + bandRangeText(b) +
        "</td><td>" + esc(b.label || "") + "</td></tr>";
    }).join("");
    return '<table class="mini-bands"><thead><tr><th>判定</th><th>生値の範囲</th><th>ラベル</th></tr></thead><tbody>' +
      rows + "</tbody></table>";
  }
  function guideInfoHtml(sub) {
    var g = sub && sub.guide;
    if (g && g.text) {
      var conv = g.confidence === "convention" ? "・統計的慣例" : "";
      return '<div class="subtest-guide">目安: ' + esc(g.text) + "（出典: " + esc(g.source || "—") + conv + "）</div>";
    }
    return '<div class="subtest-guide muted">基準はマニュアル参照</div>';
  }
  // 生値に該当するバンドを返す。防御として該当が複数なら最も狭い区間を採用（SPEC §13.5-5）。
  function bandForValue(bands, v) {
    var best = null, bestW = Infinity;
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var minOk = b.min == null || v >= b.min;
      var maxOk = b.max == null || v <= b.max;
      if (!(minOk && maxOk)) continue;
      var lo = (b.min == null) ? -Infinity : b.min;
      var hi = (b.max == null) ? Infinity : b.max;
      var w = hi - lo;   // 開区間（min/max=null）は幅 Infinity
      if (w < bestW) { bestW = w; best = b; }
    }
    return best;
  }
  // 提案に使う実効バンドを決める（施設基準bands ＞ guide.bands / SPEC §8 v3）
  function effectiveBands(subId, sub) {
    var norm = Store.getNorm(subId);
    if (norm && norm.bands && norm.bands.length) return { bands: norm.bands, source: "facility" };
    var gb = sub && sub.guide && Array.isArray(sub.guide.bands) ? sub.guide.bands : null;
    if (gb && gb.length) return { bands: gb, source: "guide" };
    return null;
  }
  // 実効バンドにヒットした判定ボタンへハイライト提案を付与（提案のみ・自動選択はしない）
  function applySuggestion(box, subId, sub, rawStr) {
    qsa(".seg-btn", box).forEach(function (b) { b.classList.remove("guide-suggest", "norm-suggest"); });
    if (rawStr === "" || rawStr == null) return;
    var v = Number(rawStr);
    if (isNaN(v)) return;
    var eff = effectiveBands(subId, sub);
    if (!eff) return;
    var band = bandForValue(eff.bands, v);
    if (!band) return;
    var btn = qs('.seg-btn[data-j="' + band.judgment + '"]', box);
    if (btn) btn.classList.add(eff.source === "facility" ? "norm-suggest" : "guide-suggest");
  }
  // 施設基準の有無を示す小チップ（評価入力の行に表示）
  function facilityHintHtml(subId) {
    var n = Store.getNorm(subId);
    if (!n) return "";
    var has = (n.bands && n.bands.length) ? "・バンドあり" : "";
    return '<span class="facility-hint">施設基準あり' + has + "</span>";
  }

  function subtestRowHtml(sub, result) {
    var doms = (sub.domains || []).map(function (m) {
      return esc(domainName(m.domain)) + "×" + m.weight;
    }).join(" / ");
    var jset = (result && (result.judgment !== undefined && result.judgment !== null)) ? String(result.judgment)
      : (result && result.judgment === null ? "none" : "");
    var segs = JUDGMENTS.map(function (j) {
      return '<button type="button" class="seg-btn' + (String(j.v) === jset ? " active" : "") + '" data-j="' + j.v +
        '" title="' + esc(anchorTitle(j.v)) + '">' + j.label + "</button>";
    }).join("") +
      '<button type="button" class="seg-btn' + (jset === "none" ? " active" : "") + '" data-j="none" title="この項目は未実施として扱います（プロファイル計算の対象外）">未実施</button>';

    var rawHtml = "";
    if (sub.raw) {
      var r = sub.raw;
      var rv = result && result.raw != null ? result.raw : "";
      // higherIsWorse は誤入力対策の強調バッジ（SPEC §6・データ側フラグはundefined許容の防御的実装）
      var hiw = (r.higherIsWorse === true) ? '<span class="hiw-badge" title="この生値は高いほど重症です">高得点ほど重い</span>' : "";
      rawHtml = '<span class="raw-wrap">' + esc(r.label || "生値") + hiw +
        '<input type="number" class="raw"' +
        (r.min != null ? ' min="' + r.min + '"' : "") +
        (r.max != null ? ' max="' + r.max + '"' : "") +
        (r.step != null ? ' step="' + r.step + '"' : "") +
        ' value="' + esc(rv) + '">' +
        (r.unit ? "<span>" + esc(r.unit) + "</span>" : "") + "</span>";
    }
    var cmt = result && result.comment ? result.comment : "";

    // 判定根拠チップ（SPEC §8 v4・任意・複数トグル）
    var activeReasons = (result && Array.isArray(result.reasons)) ? result.reasons : [];
    var reasonChips = Store.REASONS.map(function (rs) {
      var on = activeReasons.indexOf(rs) >= 0;
      return '<button type="button" class="reason-chip' + (on ? " active" : "") + '" data-reason="' + esc(rs) + '">' + esc(rs) + "</button>";
    }).join("");
    var reasonRow = '<div class="reason-row"><span class="reason-label">判定根拠（任意）</span>' +
      '<div class="reason-chips">' + reasonChips + "</div></div>";

    return '<div class="subtest" data-subtest="' + esc(sub.id) + '"' + (jset ? ' data-judgment="' + jset + '"' : "") + ">" +
      '<div class="subtest-head"><span class="subtest-name">' + esc(sub.name) + "</span>" +
      (doms ? '<span class="subtest-domains">→ ' + doms + "</span>" : "") + "</div>" +
      guideInfoHtml(sub) +
      '<div class="subtest-guide-actions">' +
      '<a href="#" class="norm-link" data-subtest="' + esc(sub.id) + '">基準を見る</a>' +
      facilityHintHtml(sub.id) + "</div>" +
      '<div class="seg" role="group">' + segs + "</div>" +
      reasonRow +
      '<div class="subtest-extra">' + rawHtml +
      '<input type="text" class="comment" placeholder="コメント（任意）" value="' + esc(cmt) + '"></div>' +
      (sub.note ? '<div class="subtest-note">' + esc(sub.note) + "</div>" : "") +
      "</div>";
  }

  function renderInput() {
    var c = requireCase("評価入力");
    if (!c) return;
    if (!state.selectedAssessmentId && assessments().length) state.selectedAssessmentId = assessments()[0].id;

    var editing = state.editingSessionId ? findSession(c, state.editingSessionId) : null;
    var a = assessmentById(editing ? editing.assessmentId : state.selectedAssessmentId);

    var formHtml = "";
    if (a) {
      var results = editing ? (editing.results || {}) : {};
      // 既定職種: 直近職種が当該検査の想定職種に含まれる場合のみ採用、それ以外は a.discipline[0]（SPEC §13.5-6）
      var aDisc = (a.discipline && a.discipline.length) ? a.discipline : ["OT"];
      var defDisc = editing ? editing.discipline
        : ((lastSessionDisc && aDisc.indexOf(lastSessionDisc) >= 0) ? lastSessionDisc : aDisc[0]);
      var defDate = editing ? editing.date : (lastSessionDate || todayStr());
      formHtml =
        '<div class="panel"><h3>' + esc(a.name) + (editing ? "（編集中）" : "") + "</h3>" +
        (a.note ? '<p class="note-muted">' + esc(a.note) + "</p>" : "") +
        '<div class="row">' +
        '<label class="field"><span>実施日</span><input type="date" id="f-date" max="' + esc(todayStr()) + '" value="' + esc(defDate) + '"></label>' +
        '<label class="field"><span>実施職種</span><select id="f-disc">' +
        '<option value="OT"' + (defDisc === "OT" ? " selected" : "") + ">OT</option>" +
        '<option value="ST"' + (defDisc === "ST" ? " selected" : "") + ">ST</option>" +
        "</select></label>" +
        '<label class="field"><span>実施者（任意・イニシャル等）</span><input type="text" id="f-examiner" maxlength="20" value="' + esc(editing ? editing.examiner : "") + '"></label>' +
        "</div>" +
        '<div class="note-muted">各下位項目の判定は評価者が選択します（マニュアルの基準に基づく）。未実施はグレーの「未実施」を選択。</div>' +
        (a.subtests || []).map(function (s) { return subtestRowHtml(s, results[s.id]); }).join("") +
        '<label class="field"><span>セッション全体のメモ（任意）</span><textarea id="f-note">' + esc(editing ? editing.note : "") + "</textarea></label>" +
        '<div class="btn-row"><button class="primary" data-act="save">' + (editing ? "更新する" : "このセッションを保存") + "</button>" +
        (editing ? '<button data-act="cancel">編集をやめる</button>' : "") + "</div></div>";
    } else if (editing) {
      // 収載外になった検査（旧データ等）を参照するセッション。クラッシュさせず表示のみスキップ
      formHtml = '<div class="panel"><h3>（収載外の検査）</h3>' +
        '<p class="note-muted">このセッションが参照している検査「' + esc(editing.assessmentId) +
        '」は現在の収載にないため、内容の表示・編集はできません。一覧からの削除のみ可能です。</p>' +
        '<div class="btn-row"><button data-act="cancel">編集をやめる</button></div></div>';
    } else {
      formHtml = '<div class="empty">検査マスタが読み込めませんでした。</div>';
    }

    view.innerHTML =
      "<h2>評価入力</h2>" +
      '<p class="lead">検査を選び、下位項目ごとに判定（正常域〜顕著な低下 / 未実施）と生値・コメントを入力します。</p>' +
      flashHtml() +
      anchorPanelHtml() +
      '<div class="panel"><h3>検査を選択</h3>' + assessmentPickerHtml(a ? a.id : null, !!editing) +
      (editing ? '<p class="note-muted">編集中は検査の切り替えはできません。編集をやめると変更できます。</p>' : "") +
      "</div>" +
      formHtml +
      renderSessionListHtml(c);

    var picker = qs("#pick-assessment");
    if (picker) picker.addEventListener("change", function () {
      state.selectedAssessmentId = this.value; state.editingSessionId = null; renderInput();
    });

    // セグメントボタン
    qsa(".seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var box = btn.closest(".subtest");
        qsa(".seg-btn", box).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        box.setAttribute("data-judgment", btn.getAttribute("data-j"));
      });
    });

    // 判定根拠チップ（任意・複数トグル・SPEC §8 v4）
    qsa(".reason-chip").forEach(function (chip) {
      chip.addEventListener("click", function () { chip.classList.toggle("active"); });
    });

    // 判定ガイド: 生値入力で実効バンド（施設基準 ＞ guide）にヒットした判定ボタンをハイライト提案（自動選択はしない）
    if (a) {
      (a.subtests || []).forEach(function (sub) {
        var box = qs('.subtest[data-subtest="' + sub.id + '"]');
        var rawEl = box ? qs(".raw", box) : null;
        if (!box || !rawEl) return;
        rawEl.addEventListener("input", function () { applySuggestion(box, sub.id, sub, rawEl.value); });
        applySuggestion(box, sub.id, sub, rawEl.value);
      });
    }

    // 「基準を見る」ポップオーバー（入力途中の判定・生値は失われない＝入力フォームは再描画しない）
    qsa(".norm-link").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openNormPopover(link.getAttribute("data-subtest"));
      });
    });

    var saveBtn = qs("[data-act='save']");
    if (saveBtn) saveBtn.addEventListener("click", function () { saveSession(c, a, editing); });
    var cancelBtn = qs("[data-act='cancel']");
    if (cancelBtn) cancelBtn.addEventListener("click", function () { state.editingSessionId = null; renderInput(); });

    wireSessionList(c);
  }

  function collectResults() {
    var results = {};
    qsa(".subtest").forEach(function (box) {
      var id = box.getAttribute("data-subtest");
      var j = box.getAttribute("data-judgment");
      var rawEl = qs(".raw", box), cmtEl = qs(".comment", box);
      var rawVal = rawEl && rawEl.value !== "" ? Number(rawEl.value) : null;
      var comment = cmtEl && cmtEl.value ? cmtEl.value.trim() : "";
      var reasons = qsa(".reason-chip.active", box).map(function (ch) { return ch.getAttribute("data-reason"); });
      if (j == null && rawVal == null && !comment) return;   // 未入力の項目は保存しない（根拠のみでは保存しない）
      var judgment = (j == null || j === "none") ? null : Number(j);
      var res = { raw: rawVal, judgment: judgment, comment: comment };
      if (reasons.length) res.reasons = reasons;   // 根拠は任意
      results[id] = res;
    });
    return results;
  }

  function saveSession(c, a, editing) {
    if (!a) return;
    var results = collectResults();
    if (!Object.keys(results).length) { flash("err", "少なくとも1つの下位項目を入力してください。"); return renderInput(); }
    var date = qs("#f-date").value || todayStr();
    // 実施日ガード: 未来日は拒否（新規・編集とも・SPEC §13.5-6）
    if (date > todayStr()) { flash("err", "実施日に未来の日付は指定できません。"); return renderInput(); }
    var payload = {
      assessmentId: a.id,
      date: date,
      discipline: qs("#f-disc").value,
      examiner: qs("#f-examiner").value.trim(),
      results: results,
      note: qs("#f-note").value.trim()
    };
    if (editing) {
      if (!Store.updateSession(c.id, editing.id, payload)) { flash("err", STORE_FAIL_MSG); return renderInput(); }
      state.editingSessionId = null;
      flash("ok", "セッションを更新しました。");
    } else {
      if (!Store.addSession(c.id, payload)) { flash("err", STORE_FAIL_MSG); return renderInput(); }
      // 直近の実施日・職種は「新規保存時のみ」引き継ぐ（編集保存では更新しない・SPEC §13.5-6）
      lastSessionDate = payload.date;
      lastSessionDisc = payload.discipline;
      flash("ok", "セッションを保存しました。");
    }
    renderInput();
  }

  function findSession(c, sid) {
    for (var i = 0; i < c.sessions.length; i++) if (c.sessions[i].id === sid) return c.sessions[i];
    return null;
  }
  function countJudged(sess) {
    var n = 0, r = sess.results || {};
    for (var k in r) if (r.hasOwnProperty(k) && r[k].judgment != null) n++;
    return n;
  }
  // セッション内で使われた判定根拠を重複なし・入力順で集約（一覧表示用）
  function sessionReasons(sess) {
    var seen = {}, order = [], r = sess.results || {};
    for (var k in r) {
      if (!r.hasOwnProperty(k)) continue;
      var rs = r[k].reasons;
      if (Array.isArray(rs)) rs.forEach(function (x) { if (!seen[x]) { seen[x] = true; order.push(x); } });
    }
    return order;
  }

  function renderSessionListHtml(c) {
    if (!c.sessions.length) return '<div class="panel"><h3>入力済みセッション</h3><div class="empty">まだありません。</div></div>';
    // 日付降順・同日は登録順（index tie-break）で安定化（SPEC §13.5-8）
    var rows = c.sessions.map(function (s, i) { return { s: s, i: i }; }).sort(function (x, y) {
      if (x.s.date !== y.s.date) return x.s.date < y.s.date ? 1 : -1;
      return x.i - y.i;
    }).map(function (rec) {
      var s = rec.s;
      var a = assessmentById(s.assessmentId);
      var rzHtml = reasonsInlineHtml(sessionReasons(s));   // 理由チップ描画は reasonsInlineHtml に統一（SPEC §13.5-16）
      return "<tr>" +
        "<td>" + esc(s.date) + "</td>" +
        "<td>" + (a ? esc(a.shortName || a.name) : "（収載外の検査）") + "</td>" +
        "<td>" + discBadge(s.discipline) + "</td>" +
        "<td>" + esc(s.examiner || "—") + "</td>" +
        "<td>" + countJudged(s) + " 項目" + rzHtml + "</td>" +
        '<td class="no-print"><button class="small" data-sact="edit" data-id="' + s.id + '">編集</button> ' +
        '<button class="small danger" data-sact="del" data-id="' + s.id + '">削除</button></td>' +
        "</tr>";
    }).join("");
    return '<div class="panel"><h3>入力済みセッション</h3><div class="table-scroll"><table>' +
      "<thead><tr><th>実施日</th><th>検査</th><th>職種</th><th>実施者</th><th>判定済・根拠</th><th>操作</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div></div>";
  }
  function wireSessionList(c) {
    qsa("[data-sact]").forEach(function (btn) {
      var act = btn.getAttribute("data-sact"), id = btn.getAttribute("data-id");
      if (act === "edit") btn.addEventListener("click", function () {
        state.editingSessionId = id; renderInput();
        // 編集フォームは画面上部に再描画される。一覧（画面下部）の「編集」から入ると
        // フォームが画面外のままになり「開かない＝編集できない」ように見えるため、
        // route() と同様にフォームを見える位置へスクロールする。
        var anchor = qs("[data-act='save']") || qs("[data-act='cancel']");
        var panel = (anchor && anchor.closest) ? anchor.closest(".panel") : null;
        if (panel && panel.scrollIntoView) panel.scrollIntoView({ block: "start" });
        else window.scrollTo(0, 0);
      });
      if (act === "del") btn.addEventListener("click", function () {
        if (!confirm("このセッションを削除します。よろしいですか？")) return;
        if (!Store.deleteSession(c.id, id)) { flash("err", STORE_FAIL_MSG); return renderInput(); }   // 保存失敗（SPEC §13.5-2）
        if (state.editingSessionId === id) state.editingSessionId = null;
        flash("ok", "セッションを削除しました。");
        renderInput();
      });
    });
  }

  /* ========================================================= */
  /* 3. プロファイル                                           */
  /* ========================================================= */
  // 根拠件数は「参考（reference）」を除いた実根拠のみを数える（SPEC §9）
  function nonRefEvCount(dd) {
    var n = 0, ev = (dd && dd.evidence) || [];
    for (var i = 0; i < ev.length; i++) if (!ev[i].referenceMark) n++;
    return n;
  }
  // 参考（scoring:"reference"）根拠の件数（referenceOnly 矛盾表示の解消・SPEC §13.5-4/10）
  function refEvCount(dd) {
    var n = 0, ev = (dd && dd.evidence) || [];
    for (var i = 0; i < ev.length; i++) if (ev[i].referenceMark) n++;
    return n;
  }
  // 領域に weight>=0.6 でマップされる収載検査の逆引き（reference項目は対象外・SPEC §12.3 ③）。
  // マスタは静的なので domain→検査名 のインデックスを一度だけ構築してメモ化（SPEC §13.5-15）。
  var _revIdx = null;
  function reverseLookupIndex() {
    if (_revIdx) return _revIdx;
    var idx = {};
    assessments().forEach(function (a) {
      var name = a.shortName || a.name, hit = {};
      (a.subtests || []).forEach(function (s) {
        if (s.scoring === "reference") return;
        (s.domains || []).forEach(function (m) { if (m.weight >= 0.6) hit[m.domain] = true; });
      });
      Object.keys(hit).forEach(function (dId) { (idx[dId] = idx[dId] || []).push(name); });
    });
    return (_revIdx = idx);
  }
  function reverseLookupTests(domainId) { return reverseLookupIndex()[domainId] || []; }

  /* ---------- 臨床サマリー5行（SPEC §12.3・忙しい現場で最初に読む場所） ---------- */
  function clinicalSummaryHtml(p) {
    // ① 主要な低下: level>=2 を level降順・flagged優先で上位5、各「領域名（最悪: X・根拠n件）」
    var lowered = domains().filter(function (d) { var dd = p.domains[d.id]; return dd.level != null && dd.level >= 2; });
    lowered.sort(function (x, y) {
      var a = p.domains[x.id], b = p.domains[y.id];
      if (b.level !== a.level) return b.level - a.level;
      var af = a.flagged ? 1 : 0, bf = b.flagged ? 1 : 0;
      if (bf !== af) return bf - af;
      var aw = a.worst || 0, bw = b.worst || 0;
      if (bw !== aw) return bw - aw;
      return (b.score || 0) - (a.score || 0);
    });
    var top = lowered.slice(0, 5);
    var row1 = top.length
      ? top.map(function (d) {
          var dd = p.domains[d.id];
          return '<span class="sum-item">' + esc(domainName(d.id)) +
            "（最悪: " + esc(levelLabel(dd.worst)) + "・根拠" + nonRefEvCount(dd) + "件）" +
            (dd.flagged ? ' <span class="flag">要注目</span>' : "") + "</span>";
        }).join("、")
      : '<span class="muted">「低下」以上と入力された領域はまだありません。</span>';

    // ② 安全・ADLに直結: ウォッチリストのうち低下／未評価
    var wLow = [], wUneval = [];
    watchlist().forEach(function (id) {
      var dd = p.domains[id];
      if (!dd) return;
      if (dd.level == null) wUneval.push(id);
      else if (dd.level >= 2) wLow.push(id);
    });
    var r2 = [];
    if (wLow.length) r2.push("低下: " + wLow.map(function (id) {
      return esc(domainName(id)) + "（" + esc(levelLabel(p.domains[id].level)) + "）";
    }).join("、"));
    if (wUneval.length) r2.push('<span class="muted">未評価: ' + wUneval.map(function (id) { return esc(domainName(id)); }).join("、") + "</span>");
    var row2 = r2.length ? r2.join("　／　") : '<span class="muted">ウォッチリスト領域に低下・未評価はありません。</span>';

    // ③ 未評価の重要領域→推奨検査（ウォッチリスト優先・weight>=0.6の逆引き）
    var gapWatch = watchlist().filter(function (id) { var dd = p.domains[id]; return dd && dd.level == null; });
    var row3;
    if (!gapWatch.length) {
      row3 = '<span class="muted">重要領域（安全・ADL系）はすべて評価済みです。</span>';
    } else {
      row3 = gapWatch.map(function (id) {
        var tests = reverseLookupTests(id);
        return '<div class="sum-rec">' + esc(domainName(id)) + " → " +
          (tests.length ? esc(tests.join("・")) + "で評価可" : '<span class="muted">収載検査に該当なし</span>') + "</div>";
      }).join("");
    }

    // ④ 判定不一致: discordant領域の列挙
    var disc = domains().filter(function (d) { return p.domains[d.id].discordant; });
    var row4 = disc.length
      ? disc.map(function (d) { return '<span class="sum-item">' + esc(domainName(d.id)) + '</span>'; }).join("、")
      : '<span class="muted">なし</span>';

    // ⑤ 次の確認: 低下領域のADLマップ observe から最大3件
    var map = adlMap(), obs = [], seen = {};
    lowered.forEach(function (d) {
      var m = map[d.id];
      if (m && Array.isArray(m.observe)) m.observe.forEach(function (x) {
        if (!seen[x] && obs.length < 3) { seen[x] = true; obs.push(x); }
      });
    });
    var row5 = obs.length
      ? '<ul class="sum-obs">' + obs.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"
      : '<span class="muted">低下領域がないため、特筆する観察項目はありません。</span>';

    return '<div class="panel clin-summary"><h3>臨床サマリー（判定のブレ対策・自動整理）</h3>' +
      '<table class="clin-table"><tbody>' +
      "<tr><th>主要な低下</th><td>" + row1 + "</td></tr>" +
      "<tr><th>安全・ADLに直結</th><td>" + row2 + "</td></tr>" +
      "<tr><th>未評価の重要領域と推奨検査</th><td>" + row3 + "</td></tr>" +
      "<tr><th>判定不一致</th><td>" + row4 + "</td></tr>" +
      "<tr><th>次の確認（観察）</th><td>" + row5 + "</td></tr>" +
      "</tbody></table>" +
      '<div class="note-muted">入力済み判定の自動整理です。診断・重症度の自動判定ではありません。</div></div>';
  }

  function renderProfile() {
    var c = requireCase("プロファイル");
    if (!c) return;
    var p = Profile.compute(c, {});

    // 未評価ギャップ: 参考のみで score が付かない領域は「（参考あり）」を付記（SPEC §13.5-4/10）
    var gapChips = p.coverage.gaps.map(function (id) {
      var refOnly = p.domains[id] && p.domains[id].referenceOnly;
      return '<span class="chip gap">' + esc(domainName(id)) + (refOnly ? "（参考あり）" : "") + "</span>";
    }).join("");
    var disc = "OT: " + (p.byDiscipline.OT.length ? p.byDiscipline.OT.map(shortName).join("・") : "なし") +
      " ／ ST: " + (p.byDiscipline.ST.length ? p.byDiscipline.ST.map(shortName).join("・") : "なし");

    view.innerHTML =
      "<h2>プロファイル</h2>" +
      '<p class="lead">評価者が入力した判定を、検査項目→認知領域のマッピングで統合したものです。診断ではありません。</p>' +
      clinicalSummaryHtml(p) +
      '<div class="panel"><div class="coverage">評価済み <strong>' + p.coverage.evaluated + "</strong> / " + p.coverage.total +
      " 領域（未評価 " + p.coverage.gaps.length + "）</div>" +
      '<div class="note-muted">未評価（まだ誰も見ていない機能）: </div><div class="chips">' + (gapChips || '<span class="chip">なし</span>') + "</div>" +
      '<div class="note-muted" style="margin-top:10px">実施内訳 — ' + esc(disc) + "</div></div>" +

      '<div class="panel-split">' +
      '<div class="panel"><h3>大分類レーダー（外側=正常・中心=顕著な低下）</h3><div id="viz-radar"></div>' + legendHtml() + "</div>" +
      '<div class="panel"><h3>領域別プロファイル（' + domains().length + '領域）</h3><div id="viz-bars"></div></div>' +
      "</div>" +

      '<div class="panel evidence"><h3>根拠（領域をクリックで展開）</h3>' + evidenceHtml(p) + "</div>";

    // レーダー: 6大分類
    var radarItems = groups().map(function (g) { return { label: g, value: p.groups[g] ? p.groups[g].score : null, max: 3 }; });
    vizCall("radar", qs("#viz-radar"), radarItems, { size: 300 });

    // 領域バー（v4: 言葉主表示のため scoreLabel/worst/discordant を後方互換フィールドで渡す）
    var barRows = domains().map(function (d) {
      var dd = p.domains[d.id];
      return {
        label: d.name, group: d.group, score: dd.score, level: dd.level, flagged: dd.flagged,
        evidenceCount: nonRefEvCount(dd),
        scoreLabel: (dd.level == null ? null : levelLabel(dd.level)),
        worst: dd.worst, discordant: dd.discordant
      };
    });
    vizCall("domainBars", qs("#viz-bars"), barRows);
  }

  function shortName(id) { var a = assessmentById(id); return a ? (a.shortName || a.name) : "（収載外の検査）"; }

  function legendHtml() {
    return '<div class="legend">' + JUDGMENTS.map(function (j) {
      return '<span><i style="background:var(--j' + j.v + ')"></i>' + j.v + " " + j.label + "</span>";
    }).join("") + '<span><i style="background:var(--j-none)"></i>未評価</span></div>';
  }

  function reasonsInlineHtml(reasons) {
    if (!Array.isArray(reasons) || !reasons.length) return "";
    return '<span class="ev-reasons">' + reasons.map(function (x) {
      return '<span class="reason-chip mini">' + esc(x) + "</span>";
    }).join("") + "</span>";
  }
  // 不一致の内訳（どの検査／職種が割れているか・SPEC §12.3 task5）。reference は除外。
  function discordBreakdownHtml(dd) {
    var parts = dd.evidence.filter(function (e) { return !e.referenceMark; }).map(function (e) {
      return esc(e.discipline) + "〈" + esc(shortName(e.assessmentId)) + "/" + esc(e.subtestName) + "＝" + jLabel(e.judgment) + "〉";
    });
    return '<div class="ev-discord">不一致の内訳: ' + parts.join(" ／ ") + "</div>";
  }

  function evidenceHtml(p) {
    var blocks = domains().map(function (d) {
      var dd = p.domains[d.id];
      if (!dd.evidence.length) return "";
      var items = dd.evidence.map(function (e) {
        var st = subtestById(e.subtestId);
        var unit = st && st.subtest.raw && st.subtest.raw.unit ? st.subtest.raw.unit : "";
        var rawTxt = e.raw != null ? "　生値 " + e.raw + (unit ? unit : "") : "";
        var refBadge = e.referenceMark ? '<span class="ref-badge" title="総合指標の二重カウント回避のため計算対象外">参考</span>' : "";
        return '<div class="ev-item">' + discBadge(e.discipline) +
          '<span class="jbadge" data-j="' + jAttr(e.judgment) + '">' + jLabel(e.judgment) + "</span>" + refBadge +
          "<span>" + esc(shortName(e.assessmentId)) + " / " + esc(e.subtestName) + "</span>" +
          reasonsInlineHtml(e.reasons) +
          '<span class="ev-meta">重み ' + e.weight + "　" + esc(e.date) + rawTxt +
          (e.comment ? "　「" + esc(e.comment) + "」" : "") + "</span></div>";
      }).join("");
      var worstNote = (dd.worst != null && dd.level != null && dd.worst > dd.level)
        ? ' <span class="worst-note">最悪: ' + esc(levelLabel(dd.worst)) + "</span>" : "";
      var discBadgeSum = dd.discordant ? ' <span class="discord-badge">不一致</span>' : "";
      var refN = refEvCount(dd);
      var refTxt = refN ? " ・参考 " + refN + "件" : "";   // 「まだ誰も見ていない」との矛盾解消（SPEC §13.5-10）
      return "<details><summary>" + esc(d.name) +
        (dd.flagged ? ' <span class="flag">要注目</span>' : "") + worstNote + discBadgeSum +
        '<span class="dscore">スコア ' + fmt(dd.score) + " / " + levelLabel(dd.level) + " ・根拠 " + nonRefEvCount(dd) + "件" + refTxt + "</span></summary>" +
        '<div class="ev-list">' + items + (dd.discordant ? discordBreakdownHtml(dd) : "") + "</div></details>";
    }).join("");
    return blocks || '<div class="empty">まだ根拠となる判定入力がありません。</div>';
  }

  /* ========================================================= */
  /* 4. マトリクス                                             */
  /* ========================================================= */
  // (assessment, session) → domainId → {value, weight, subName}。
  // scoring:"reference" の下位項目はプロファイル計算と同様に除外（二重カウント回避・SPEC §13.5-3/4）。
  function cellsForAssessment(a, session) {
    var out = {};
    (a.subtests || []).forEach(function (sub) {
      if (sub.scoring === "reference") return;   // 参考指標は列生成から除外
      var res = (session.results || {})[sub.id];
      var judg = res && res.judgment != null ? res.judgment : null;
      (sub.domains || []).forEach(function (m) {
        var cur = out[m.domain];
        if (!cur) { out[m.domain] = { value: judg, weight: m.weight, subName: sub.name }; return; }
        var curHas = cur.value != null, newHas = judg != null;
        if (newHas && !curHas) out[m.domain] = { value: judg, weight: m.weight, subName: sub.name };
        else if (curHas === newHas && m.weight > cur.weight) out[m.domain] = { value: judg, weight: m.weight, subName: sub.name };
      });
    });
    return out;
  }

  function buildMatrix(c) {
    // 列は「検査 × 職種」。最新セッションは Profile._latestSessions（assessmentId×discipline別）を使う。
    // 同一検査で OT と ST の両方があれば別列（列ヘッダに検査名＋職種バッジ・SPEC §13.5-3/4）。
    var latest = (Profile._latestSessions ? Profile._latestSessions(c) : []).slice();
    // 列順を安定化: 検査マスタ順 → 同一検査内は OT を先
    var order = {};
    assessments().forEach(function (a, i) { order[a.id] = i; });
    latest.sort(function (x, y) {
      var ox = order[x.assessmentId], oy = order[y.assessmentId];
      if (ox == null) ox = 1e9;
      if (oy == null) oy = 1e9;
      if (ox !== oy) return ox - oy;
      return (x.discipline === "ST" ? 1 : 0) - (y.discipline === "ST" ? 1 : 0);
    });
    var cols = [], perCol = [], usedDomains = {};
    latest.forEach(function (sess) {
      var a = assessmentById(sess.assessmentId);
      if (!a) return;
      var cellMap = cellsForAssessment(a, sess);
      // 非referenceの判定が1件も無い検査×職種は列を出さない（SPEC §13.5-4）
      var hasJudged = Object.keys(cellMap).some(function (d) { return cellMap[d].value != null; });
      if (!hasJudged) return;
      cols.push({ id: a.id + "_" + sess.discipline, name: a.shortName || a.name, discipline: sess.discipline });
      perCol.push(cellMap);
      Object.keys(cellMap).forEach(function (d) { usedDomains[d] = true; });
    });
    var rows = domains().filter(function (d) { return usedDomains[d.id]; }).map(function (d) { return { id: d.id, name: d.name }; });
    var cells = rows.map(function (r) {
      return cols.map(function (col, ci) {
        var cell = perCol[ci][r.id];
        if (!cell) return null;
        var tip = col.name + "〔" + col.discipline + "〕/ " + cell.subName + " ・重み" + cell.weight + " ・" + jLabel(cell.value);
        return { value: cell.value, weight: cell.weight, tooltip: tip };
      });
    });
    return { rows: rows, cols: cols, cells: cells };
  }

  function renderMatrix() {
    var c = requireCase("マトリクス（検査 × 認知領域）");
    if (!c) return;
    var data = buildMatrix(c);
    view.innerHTML =
      "<h2>マトリクス（検査 × 認知領域）</h2>" +
      '<p class="lead">どの検査がどの認知機能を反映しているかを一望します。セルの色は最新セッションの判定、大きさは関与の強さ（重み）です。</p>' +
      '<div class="panel"><div id="viz-matrix" class="table-scroll"></div>' + legendHtml() + "</div>";
    if (!data.cols.length) { qs("#viz-matrix").innerHTML = '<div class="empty">実施済みの検査がありません。</div>'; return; }
    vizCall("matrix", qs("#viz-matrix"), data);
  }

  /* ========================================================= */
  /* 5. 経過                                                   */
  /* ========================================================= */
  function renderTimeline() {
    var c = requireCase("経過");
    if (!c) return;
    var tl = Profile.timeline(c);
    view.innerHTML =
      "<h2>経過</h2>" +
      '<p class="lead">評価日ごとの大分類スコア（上=正常・改善で上がる）。同一検査は各時点の最新を採用します。</p>' +
      '<div class="panel"><div id="viz-timeline"></div></div>';
    if (tl.length < 2) { qs("#viz-timeline").innerHTML = '<div class="empty">経過表示には評価日が2日以上必要です（現在 ' + tl.length + " 日）。</div>"; return; }
    var series = groups().map(function (g) {
      var pts = tl.filter(function (t) { return t.groups[g] != null; }).map(function (t) { return { date: t.date, value: t.groups[g] }; });
      return { label: g, points: pts };
    });
    vizCall("timeline", qs("#viz-timeline"), series, { max: 3 });
  }

  /* ========================================================= */
  /* 6. ADLの視点                                              */
  /* ========================================================= */
  function renderAdl() {
    var c = requireCase("ADLの視点");
    if (!c) return;
    var p = Profile.compute(c, {});
    var map = adlMap();
    var flagged = domains().filter(function (d) { var dd = p.domains[d.id]; return dd.level != null && dd.level >= 2; });
    flagged = flagged.slice().sort(function (x, y) {
      var dx = p.domains[x.id], dy = p.domains[y.id];
      if (dy.level !== dx.level) return dy.level - dx.level;
      return (dy.score || 0) - (dx.score || 0);
    });

    var cards = flagged.map(function (d) {
      var dd = p.domains[d.id];
      var badge = '<span class="jbadge" data-j="' + dd.level + '">' + levelLabel(dd.level) + "</span>";
      var m = map[d.id];
      if (!m) return '<div class="adl-card"><h3>' + esc(d.name) + " " + badge + "</h3>" +
        '<div class="placeholder">ADLマップ（data/adl-map.js）にこの領域の記載がまだありません。</div></div>';
      function block(title, arr) {
        if (!arr || !arr.length) return "";
        return '<div class="adl-block"><h4>' + esc(title) + "</h4><ul>" +
          arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
      }
      return '<div class="adl-card"><h3>' + esc(d.name) + " " + badge + "</h3>" +
        block("起きやすいこと（ADL/IADL）", m.adl) +
        block("観察のポイント", m.observe) +
        block("工夫の候補", m.hints) + "</div>";
    }).join("");

    view.innerHTML =
      "<h2>ADLの視点</h2>" +
      '<p class="lead">「低下」以上と入力された領域について、生活場面で起きやすいこと・観察の視点・工夫の候補を示します。</p>' +
      '<div class="note-caution">これらは候補の提示であり、断定ではありません。個別の状態像に応じてセラピストが判断してください。</div>' +
      (flagged.length ? cards : '<div class="empty">「低下」以上と入力された領域はまだありません。</div>');
  }

  /* ========================================================= */
  /* 7. 基準（マイ基準リファレンス・SPEC §12-7）               */
  /* ========================================================= */
  // 共有: 施設基準の編集フォーム（基準タブ・ポップオーバーの両方で使う）
  function normBandRowHtml(b) {
    b = b || {};
    var jopts = ['<option value="">判定…</option>'];
    JUDGMENTS.forEach(function (j) {
      jopts.push('<option value="' + j.v + '"' + (String(j.v) === String(b.judgment) ? " selected" : "") +
        ">" + j.v + " " + esc(j.label) + "</option>");
    });
    return '<div class="norm-band-row">' +
      '<select class="nb-judgment">' + jopts.join("") + "</select>" +
      '<input type="number" class="nb-min" placeholder="最小" value="' + (b.min == null ? "" : esc(b.min)) + '">' +
      '<input type="number" class="nb-max" placeholder="最大" value="' + (b.max == null ? "" : esc(b.max)) + '">' +
      '<input type="text" class="nb-label" placeholder="ラベル（任意）" maxlength="60" value="' + esc(b.label || "") + '">' +
      '<button type="button" class="small nb-rm" data-nact="rm-band" aria-label="この行を削除" title="この行を削除">×</button>' +
      "</div>";
  }
  function normEditFormHtml(subId) {
    var norm = Store.getNorm(subId) || {};
    var bands = (norm.bands && norm.bands.length) ? norm.bands : [];
    var rowsHtml = bands.map(function (b) { return normBandRowHtml(b); }).join("");
    var canAdd = bands.length < 4;
    return '<div class="norm-editor" data-subtest="' + esc(subId) + '">' +
      '<label class="field"><span>施設基準メモ（1行）</span>' +
      '<input type="text" class="norm-memo" maxlength="120" placeholder="例: 60代 28±3（施設マニュアルp.45）" value="' + esc(norm.memo || "") + '"></label>' +
      '<div class="norm-bands-label">数値バンド（任意・生値からの提案に使う・最大4行）</div>' +
      '<div class="norm-bands">' + rowsHtml + "</div>" +
      '<div class="btn-row"><button type="button" class="small" data-nact="add-band"' + (canAdd ? "" : " disabled") + ">＋バンドを追加</button></div>" +
      '<div class="norm-err msg err" style="display:none"></div>' +
      '<div class="btn-row"><button type="button" class="primary small" data-nact="save">保存</button>' +
      '<button type="button" class="small" data-nact="cancel">キャンセル</button>' +
      (norm.updatedAt ? '<button type="button" class="small danger" data-nact="delete">この施設基準を削除</button>' : "") +
      "</div>" +
      (norm.updatedAt ? '<div class="note-muted">最終更新 ' + esc(norm.updatedAt) + "</div>" : "") +
      "</div>";
  }
  function updateAddBandBtn(editor) {
    var addBtn = qs('[data-nact="add-band"]', editor);
    if (addBtn) addBtn.disabled = qsa(".norm-band-row", editor).length >= 4;
  }
  function collectNormForm(editor) {
    var memo = qs(".norm-memo", editor).value.trim();
    var bands = [], error = null;
    qsa(".norm-band-row", editor).forEach(function (row) {
      var jv = qs(".nb-judgment", row).value;
      var minV = qs(".nb-min", row).value.trim();
      var maxV = qs(".nb-max", row).value.trim();
      var lbl = qs(".nb-label", row).value.trim();
      if (jv === "" && minV === "" && maxV === "" && lbl === "") return;   // 空行は無視
      if (jv === "") { error = error || "判定を選んでいないバンド行があります。"; return; }
      var mn = minV === "" ? null : Number(minV);
      var mx = maxV === "" ? null : Number(maxV);
      if (minV !== "" && isNaN(mn)) { error = error || "最小値は数値で入力してください。"; return; }
      if (maxV !== "" && isNaN(mx)) { error = error || "最大値は数値で入力してください。"; return; }
      if (mn != null && mx != null && mn > mx) { error = error || "最小値は最大値以下にしてください。"; return; }
      bands.push({ judgment: Number(jv), min: mn, max: mx, label: lbl });
    });
    // 範囲重複を検出して拒否（min/max null は開区間として判定・SPEC §13.5-5）
    if (!error) {
      for (var i = 0; i < bands.length && !error; i++) {
        for (var j = i + 1; j < bands.length; j++) {
          var A = bands[i], B = bands[j];
          var aLo = A.min == null ? -Infinity : A.min, aHi = A.max == null ? Infinity : A.max;
          var bLo = B.min == null ? -Infinity : B.min, bHi = B.max == null ? Infinity : B.max;
          if (aLo <= bHi && bLo <= aHi) {
            error = "数値バンドの範囲が重複しています（同じ生値が複数の判定に該当します）。重複しないよう調整してください。";
            break;
          }
        }
      }
    }
    return { memo: memo, bands: bands.length ? bands : null, error: error };
  }
  // 施設基準エディタの配線（onDone(saved:boolean) を保存/削除/キャンセルで呼ぶ）
  function wireNormEditor(editor, subId, onDone) {
    var addBtn = qs('[data-nact="add-band"]', editor);
    if (addBtn) addBtn.addEventListener("click", function () {
      if (qsa(".norm-band-row", editor).length >= 4) return;
      qs(".norm-bands", editor).insertAdjacentHTML("beforeend", normBandRowHtml());
      updateAddBandBtn(editor);
    });
    editor.addEventListener("click", function (e) {
      var rm = e.target.closest ? e.target.closest('[data-nact="rm-band"]') : null;
      if (rm && editor.contains(rm)) { var row = rm.closest(".norm-band-row"); if (row) row.remove(); updateAddBandBtn(editor); }
    });
    function showNormErr(msg) {
      var el = qs(".norm-err", editor);
      if (el) { el.textContent = msg; el.style.display = "block"; }
    }
    qs('[data-nact="save"]', editor).addEventListener("click", function () {
      var res = collectNormForm(editor);
      if (res.error) { showNormErr(res.error); return; }
      // setNorm は memo/bands が空だと正常に null を返す（クリア）ため、失敗は Store.lastError で判定（SPEC §13.5-2）
      Store.lastError = null;
      Store.setNorm(subId, { memo: res.memo, bands: res.bands });
      if (Store.lastError) { showNormErr(STORE_FAIL_MSG); return; }   // 永続化失敗（無言喪失禁止）
      onDone(true);
    });
    var cancelBtn = qs('[data-nact="cancel"]', editor);
    if (cancelBtn) cancelBtn.addEventListener("click", function () { onDone(false); });
    var delBtn = qs('[data-nact="delete"]', editor);
    if (delBtn) delBtn.addEventListener("click", function () {
      if (!confirm("この施設基準を削除します。よろしいですか？")) return;
      Store.lastError = null;
      Store.deleteNorm(subId);
      if (Store.lastError) { showNormErr(STORE_FAIL_MSG); return; }   // 永続化失敗（SPEC §13.5-2）
      onDone(true);
    });
  }
  // 施設基準の表示（未編集時）
  function facilityDisplayHtml(subId) {
    var norm = Store.getNorm(subId);
    if (!norm || (!norm.memo && !(norm.bands && norm.bands.length))) {
      return '<div class="facility-view"><span class="muted">未設定</span> ' +
        '<button type="button" class="small" data-fact="edit">施設基準を追加</button></div>';
    }
    return '<div class="facility-view">' +
      (norm.memo ? '<div class="facility-memo">' + esc(norm.memo) + "</div>" : "") +
      (norm.bands && norm.bands.length ? bandsTableHtml(norm.bands) : "") +
      '<div class="facility-meta"><span class="note-muted">更新 ' + esc(norm.updatedAt || "") + "</span>" +
      '<button type="button" class="small" data-fact="edit">編集</button></div></div>';
  }
  // 施設基準セルの配線（表示⇄編集の切替）。onSaved は保存/削除確定時に呼ぶ（提案の再適用など）
  function wireFacilityCell(cell, subId, onSaved) {
    var editBtn = qs('[data-fact="edit"]', cell);
    if (!editBtn) return;
    editBtn.addEventListener("click", function () {
      cell.innerHTML = normEditFormHtml(subId);
      var editor = qs(".norm-editor", cell);
      wireNormEditor(editor, subId, function (saved) {
        cell.innerHTML = facilityDisplayHtml(subId);
        wireFacilityCell(cell, subId, onSaved);
        if (saved && typeof onSaved === "function") onSaved();
      });
    });
  }

  function normGuideCellHtml(sub) {
    var g = sub.guide;
    var human = needsHumanCheck(sub) ? '<span class="human-check">要人間確認</span>' : "";
    if (!g || !g.text) {
      return '<span class="muted">基準情報なし（マニュアル参照）</span>' + (human ? " " + human : "");
    }
    return (human ? '<div class="hc-line">' + human + "</div>" : "") +
      '<div class="guide-text">' + esc(g.text) + "</div>" +
      bandsTableHtml(g.bands) +
      '<div class="guide-src">出典: ' + esc(g.source || "—") + " " + confBadge(g.confidence) + "</div>";
  }
  function normRowHtml(sub) {
    return '<tr class="norm-row" data-subtest="' + esc(sub.id) + '">' +
      '<td class="nr-name">' + esc(sub.name) + "</td>" +
      '<td class="nr-guide">' + normGuideCellHtml(sub) + "</td>" +
      '<td class="nr-facility">' + facilityDisplayHtml(sub.id) + "</td>" +
      "</tr>";
  }
  function renderNorms() {
    var blocks = assessments().map(function (a) {
      var subs = a.subtests || [];
      var anyHuman = subs.some(function (s) { return needsHumanCheck(s); });
      var subrows = subs.map(function (s) { return normRowHtml(s); }).join("");
      return '<details class="norm-acc"><summary>' +
        '<span class="acc-name">' + esc(a.shortName || a.name) + "</span>" +
        '<span class="acc-sub">' + esc(a.name) + "</span>" +
        (anyHuman ? '<span class="acc-human">要人間確認あり</span>' : "") +
        '<span class="acc-count">' + subs.length + " 項目</span></summary>" +
        '<div class="table-scroll"><table class="norm-table"><thead><tr>' +
        "<th>下位項目</th><th>判定目安（アプリ内蔵）</th><th>施設基準（あなたの施設）</th></tr></thead>" +
        "<tbody>" + subrows + "</tbody></table></div></details>";
    }).join("");

    view.innerHTML =
      "<h2>基準（マイ基準）</h2>" +
      '<p class="lead">収載検査の判定目安を一覧で確認し、施設のマニュアル値を「施設基準」として登録できます（検査名をクリックで開閉）。</p>' +
      flashHtml() +
      '<div class="note-caution">施設基準は自施設のマニュアル等で確認した値を各自の責任で入力・管理してください。本アプリは基準の既定値を提供しません。</div>' +
      '<div class="legend"><span><i class="conf pub" style="background:none"></i>公表基準=出典のある公表カットオフ</span>' +
      '<span><i class="conf conv" style="background:none"></i>統計的慣例=±1SD等の慣例</span>' +
      '<span><span class="human-check">要人間確認</span> 出典に一次確認が必要な項目</span></div>' +
      '<div id="norms-root">' + blocks + "</div>";

    qsa(".norm-row").forEach(function (row) {
      var subId = row.getAttribute("data-subtest");
      wireFacilityCell(qs(".nr-facility", row), subId, null);
    });
  }

  /* ---------- 「基準を見る」ポップオーバー（評価入力から呼ぶ・SPEC §12） ---------- */
  function popoverBodyHtml(a, sub) {
    var g = sub.guide;
    var human = needsHumanCheck(sub)
      ? '<div class="human-check block">この項目の目安・出典は要人間確認です（一次資料での確認が必要）。</div>' : "";
    var guideBlock;
    if (g && g.text) {
      guideBlock = '<div class="pop-section"><h4>内蔵の目安' +
        (g.confidence ? "（" + esc(confLabel(g.confidence)) + "）" : "") + "</h4>" +
        '<div class="guide-text">' + esc(g.text) + "</div>" +
        bandsTableHtml(g.bands) +
        '<div class="guide-src">出典: ' + esc(g.source || "—") + " " + confBadge(g.confidence) + "</div></div>";
    } else {
      guideBlock = '<div class="pop-section"><h4>内蔵の目安</h4><div class="muted">基準情報なし（マニュアル参照）</div></div>';
    }
    return '<div class="pop-card" role="dialog" aria-modal="true" aria-label="基準を見る">' +
      '<div class="pop-head"><strong>基準 — ' + esc(a.shortName || a.name) + " / " + esc(sub.name) + "</strong>" +
      '<button type="button" class="pop-close" aria-label="閉じる">×</button></div>' +
      '<div class="pop-body">' + human + guideBlock +
      '<div class="pop-section"><h4>施設基準（あなたの施設）</h4><div class="pop-facility"></div></div>' +
      '<div class="note-muted">施設基準は自施設のマニュアル等で確認した値を各自の責任で入力してください。</div>' +
      "</div></div>";
  }
  // 入力フォーム側の該当行に提案を再適用（施設基準の追加・削除を即時反映）
  function reapplySuggestionFor(subId) {
    var box = qs('.subtest[data-subtest="' + subId + '"]');
    if (!box) return;
    var rawEl = qs(".raw", box);
    var info = subtestById(subId);
    if (!info) return;
    applySuggestion(box, subId, info.subtest, rawEl ? rawEl.value : "");
    // 施設基準ヒントの更新
    var actions = qs(".subtest-guide-actions", box);
    if (actions) {
      var link = qs(".norm-link", actions);
      actions.innerHTML = "";
      if (link) actions.appendChild(link);
      actions.insertAdjacentHTML("beforeend", facilityHintHtml(subId));
    }
  }
  function openNormPopover(subId) {
    var info = subtestById(subId);
    if (!info) return;
    // 既存ポップオーバーは _close で確実に閉じる（keydownリーク＋画面残留の防止・SPEC §13.5-8）
    closeAnyPopover();

    var overlay = document.createElement("div");
    overlay.className = "pop-overlay";
    overlay.innerHTML = popoverBodyHtml(info.assessment, info.subtest);
    document.body.appendChild(overlay);

    function close() {
      document.removeEventListener("keydown", onKey);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    overlay._close = close;   // route()（ハッシュ遷移）や多重オープン時に呼ばれる閉じ関数
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    qs(".pop-close", overlay).addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });

    // ポップオーバー内の施設基準（その場編集）
    var facCell = qs(".pop-facility", overlay);
    (function renderFac() {
      facCell.innerHTML = facilityDisplayHtml(subId);
      wireFacilityCell(facCell, subId, function () { reapplySuggestionFor(subId); });
    })();
  }

  /* ========================================================= */
  /* 8. 印刷                                                   */
  /* ========================================================= */
  function renderPrint() {
    var c = requireCase("印刷");
    if (!c) return;
    var p = Profile.compute(c, {});

    // 領域テーブル（21行・簡約）
    var trows = domains().map(function (d) {
      var dd = p.domains[d.id];
      var jb = dd.level == null ? '<span class="jbadge" data-j="none">未評価</span>'
        : '<span class="jbadge" data-j="' + dd.level + '">' + levelLabel(dd.level) + "</span>";
      // 画面と同じ「最悪: X」注記（平均で重度が薄まる問題への併記・SPEC §13.5-7）
      var worstNote = (dd.worst != null && dd.level != null && dd.worst > dd.level)
        ? ' <span class="worst-note">最悪: ' + esc(levelLabel(dd.worst)) + "</span>" : "";
      return "<tr><td>" + esc(d.group) + "</td><td>" + esc(d.name) + "</td><td>" + jb +
        (dd.flagged ? ' <span class="flag">要注目</span>' : "") + worstNote +
        (dd.discordant ? ' <span class="discord-badge">不一致</span>' : "") + "</td><td>" + nonRefEvCount(dd) + "</td></tr>";
    }).join("");

    // 大分類×検査の簡約マトリクス（worst判定）
    var mtx = buildMatrix(c);
    var groupMtx = groupSummaryMatrix(mtx);

    view.innerHTML =
      '<div class="btn-row no-print"><button class="primary" data-act="print">この内容を印刷する</button>' +
      '<span class="note-muted">（ブラウザの印刷ダイアログでA4縦・余白標準を推奨）</span></div>' +
      '<div class="print-view">' +
      '<div class="print-head"><h2>CogMap 統合プロファイル要約</h2>' +
      '<div class="p-meta">ラベル: ' + esc(c.label || "(無題)") + "　出力日: " + todayStr() + "</div></div>" +
      '<div class="print-disclaimer">本要約は評価者が入力した判定の整理であり、診断・重症度の自動判定ではありません。判定は各検査マニュアルの基準に基づきます。</div>' +
      '<div class="coverage">評価済み <strong>' + p.coverage.evaluated + "</strong> / " + p.coverage.total + " 領域（未評価 " + p.coverage.gaps.length + "）</div>" +
      '<div class="print-grid">' +
      '<div><div id="p-radar"></div>' + legendHtml() + "</div>" +
      '<div class="table-scroll"><table class="p-table"><thead><tr><th>大分類</th><th>領域</th><th>判定</th><th>根拠</th></tr></thead><tbody>' + trows + "</tbody></table></div>" +
      "</div>" +
      '<h3 style="margin-top:14px;font-size:13px">検査 × 大分類（簡約・各セルは最も強い低下）</h3>' +
      '<div class="table-scroll">' + groupMtx + "</div>" +
      "</div>";

    var radarItems = groups().map(function (g) { return { label: g, value: p.groups[g] ? p.groups[g].score : null, max: 3 }; });
    vizCall("radar", qs("#p-radar"), radarItems, { size: 260 });

    qs("[data-act='print']").addEventListener("click", function () { window.print(); });
  }

  // マトリクスを「大分類 × 検査」に畳む（各グループの領域中で最悪の判定を採用）。
  // 印刷のA4右端クリップ回避のため 8列ごとに分割して縦に積む（SPEC §13.5-7）。
  function groupSummaryMatrix(mtx) {
    if (!mtx.cols.length) return '<div class="empty">実施済みの検査がありません。</div>';
    var rowGroupOf = {};
    domains().forEach(function (d) { rowGroupOf[d.id] = d.group; });
    var CHUNK = 8, tables = [];
    for (var start = 0; start < mtx.cols.length; start += CHUNK) {
      var idxs = [];
      for (var ci = start; ci < Math.min(start + CHUNK, mtx.cols.length); ci++) idxs.push(ci);
      var head = "<tr><th>大分類</th>" + idxs.map(function (ci) {
        var col = mtx.cols[ci];
        return "<th>" + esc(col.name) + " " + discBadge(col.discipline) + "</th>";
      }).join("") + "</tr>";
      var body = groups().map(function (g) {
        var tds = idxs.map(function (ci) {
          var worst = null;
          mtx.rows.forEach(function (r, ri) {
            if (rowGroupOf[r.id] !== g) return;
            var cell = mtx.cells[ri][ci];
            if (cell && cell.value != null && (worst == null || cell.value > worst)) worst = cell.value;
          });
          return "<td>" + (worst == null ? "" : '<span class="jbadge" data-j="' + worst + '">' + jLabel(worst) + "</span>") + "</td>";
        }).join("");
        return "<tr><td>" + esc(g) + "</td>" + tds + "</tr>";
      }).join("");
      tables.push('<table class="p-groupmtx">' + head + body + "</table>");
    }
    return tables.join("");
  }

  /* ========================================================= */
  /* 起動                                                      */
  /* ========================================================= */
  function dataReady() {
    return Array.isArray(window.COG_DOMAINS) && window.COG_DOMAINS.length &&
      Array.isArray(window.COG_GROUPS) && window.COG_GROUPS.length &&
      Array.isArray(window.COG_ASSESSMENTS) && window.COG_ASSESSMENTS.length &&
      window.COG_ADL_MAP && typeof window.COG_ADL_MAP === "object";
  }

  function bootError() {
    console.error("CogMap: 臨床データ（COG_DOMAINS / COG_GROUPS / COG_ASSESSMENTS / COG_ADL_MAP）が読み込めませんでした。data/ の配置を確認してください。");
    navEl.innerHTML = "";
    view.innerHTML = '<div class="boot-error"><h2>データファイルが読み込めません</h2>' +
      "<p>臨床データ（data/domains.js・data/assessments.js・data/adl-map.js）が読み込めませんでした。" +
      "ファイルが配置されているか、起動.command で正しく配信されているかを確認してください。</p></div>";
  }

  function boot() {
    if (!window.Store) { bootError(); return; }
    if (!dataReady()) { bootError(); return; }
    Store.init();
    // 前回の現在ケースを復元（存在しなければクリア）
    var saved = null;
    try { saved = localStorage.getItem(CUR_KEY); } catch (e) {}
    if (saved && Store.getCase(saved)) state.currentCaseId = saved;
    updateHeader();
    window.addEventListener("hashchange", route);
    // 二重レンダリング防止（SPEC §13.5-8）: ハッシュ未設定なら replace で hashchange 経由の route を1回だけ走らせ、
    // 既にハッシュがある場合のみ直接 route() を呼ぶ（いずれも描画は1回）。タブクリック遷移は hashchange で従来どおり。
    if (!location.hash) location.replace("#case");
    else route();
  }

  boot();
})();
