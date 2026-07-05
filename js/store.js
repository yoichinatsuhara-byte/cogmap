/* js/store.js — 永続化（localStorage `cogmap.v1`）。SPEC §8 / §13.5-2。外部通信ゼロ。
 * すべて同期API。id は crypto.randomUUID() の先頭8桁を利用。CogUtil には依存しない（独立）。
 *
 * メモリキャッシュ: db / norms をモジュール変数にキャッシュし、read/readNorms はキャッシュ優先
 *   （初回のみ JSON.parse）。write 成功時にキャッシュ（＝書き込んだオブジェクト）を確定する。
 *   ※2タブ同時使用時の lost update は許容（別タブの書き込みはこのタブのキャッシュに反映されない）。
 * 返り値の扱い: listCases/getCase/getNorm 等は現行同様キャッシュ内の参照を返す。呼び出し元は
 *   これを read-only スナップショットとして扱い、直接改変せずミューテータ経由で更新する規約。
 * 書き込み失敗契約（SPEC §13.5-2）: write/writeNorms は setItem を try/catch。失敗時は
 *   Store.lastError="storage_write_failed" を立てて false。全ミューテータは永続化失敗時に
 *   メモリ状態を巻き戻して null/false を返す（失敗分をキャッシュに残さない）。init() は投げない。 */
(function (global) {
  "use strict";

  var KEY = "cogmap.v1";
  var NORMS_KEY = "cogmap.norms.v1";   // 施設基準（マイ基準）ストア。ケース非依存・全ケース共通（SPEC §8 v3）
  // 判定根拠チップの固定5種（SPEC §8 v4）。この5語以外は保存時に除外する。
  var REASONS = ["数値基準", "質的誤反応", "ADL・生活場面", "他職種情報", "検査条件（疲労・失語等）"];

  var _db = null;      // ケースDBのメモリキャッシュ（初回 read で parse）
  var _norms = null;   // 施設基準のメモリキャッシュ（初回 readNorms で parse）

  function nowDate() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function uid(prefix) {
    var rand;
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      rand = global.crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    } else {
      rand = Math.random().toString(16).slice(2, 10);
    }
    return prefix + rand;
  }

  function emptyDb() { return { version: 1, cases: [] }; }

  // 読み込んだケースを正規化: id（無ければ生成）・label（無ければ"(無題)"）・sessions（配列でなければ[]）。
  function normalizeCase(c) {
    c = (c && typeof c === "object") ? c : {};
    if (!c.id) c.id = uid("c_");
    if (c.label == null) c.label = "(無題)";
    if (c.memo == null) c.memo = "";
    if (!Array.isArray(c.sessions)) c.sessions = [];
    return c;
  }

  function parseDb() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return emptyDb();
      var db = JSON.parse(raw);
      if (!db || typeof db !== "object" || !Array.isArray(db.cases)) return emptyDb();
      if (db.version == null) db.version = 1;
      for (var i = 0; i < db.cases.length; i++) db.cases[i] = normalizeCase(db.cases[i]);
      return db;
    } catch (e) {
      console.error("Store: localStorage 読み込みに失敗", e);
      return emptyDb();
    }
  }

  function read() {
    if (!_db) _db = parseDb();
    return _db;
  }

  function write(db) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      _db = db;                 // 成功時のみキャッシュ確定
      Store.lastError = null;
      return true;
    } catch (e) {
      Store.lastError = "storage_write_failed";
      console.error("Store: localStorage 書き込みに失敗", e);
      return false;
    }
  }

  /* ---------- 施設基準（マイ基準）ストア（SPEC §8 v3） ---------- */
  function emptyNorms() { return { version: 1, norms: {} }; }

  function parseNorms() {
    try {
      var raw = localStorage.getItem(NORMS_KEY);
      if (!raw) return emptyNorms();
      var db = JSON.parse(raw);
      if (!db || typeof db !== "object" || !db.norms || typeof db.norms !== "object") return emptyNorms();
      if (db.version == null) db.version = 1;
      return db;
    } catch (e) {
      console.error("Store: 施設基準の読み込みに失敗", e);
      return emptyNorms();
    }
  }

  function readNorms() {
    if (!_norms) _norms = parseNorms();
    return _norms;
  }

  function writeNorms(db) {
    try {
      localStorage.setItem(NORMS_KEY, JSON.stringify(db));
      _norms = db;              // 成功時のみキャッシュ確定
      Store.lastError = null;
      return true;
    } catch (e) {
      Store.lastError = "storage_write_failed";
      console.error("Store: 施設基準の書き込みに失敗", e);
      return false;
    }
  }

  // bands の簡易検証: judgment 0-3・数値・min<=max。不正な行は除外して返す（なければ null）
  function sanitizeBands(bands) {
    if (!Array.isArray(bands) || !bands.length) return null;
    var out = [];
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i] || {};
      var j = Number(b.judgment);
      if (!isFinite(j) || j < 0 || j > 3 || Math.floor(j) !== j) continue;   // judgment 0-3
      var mn = (b.min === "" || b.min == null) ? null : Number(b.min);
      var mx = (b.max === "" || b.max == null) ? null : Number(b.max);
      if (mn != null && !isFinite(mn)) continue;                              // 数値
      if (mx != null && !isFinite(mx)) continue;
      if (mn != null && mx != null && mn > mx) continue;                      // min<=max
      out.push({ judgment: j, min: mn, max: mx, label: String(b.label == null ? "" : b.label).trim() });
    }
    return out.length ? out : null;
  }

  function findCase(db, id) {
    for (var i = 0; i < db.cases.length; i++) if (db.cases[i].id === id) return db.cases[i];
    return null;
  }

  // 判定根拠チップ（SPEC §8 v4）: 固定5種のみを重複なしで残す。それ以外・空は null。
  function sanitizeReasons(arr) {
    if (!Array.isArray(arr)) return null;
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (REASONS.indexOf(v) >= 0 && out.indexOf(v) < 0) out.push(v);
    }
    return out.length ? out : null;
  }

  // 結果オブジェクトを正規化（raw/judgment/comment/reasons のみを保持）。
  // judgment は整数0〜3以外を null、raw は有限数値以外を null（null は保持）。
  function sanitizeResults(results) {
    if (!results || typeof results !== "object") return {};
    var out = {};
    for (var k in results) {
      if (!results.hasOwnProperty(k)) continue;
      var r = results[k] || {};

      var judgment = null;
      if (r.judgment != null && r.judgment !== "") {
        var jn = Number(r.judgment);
        if (isFinite(jn) && Math.floor(jn) === jn && jn >= 0 && jn <= 3) judgment = jn;
      }

      var raw = null;
      if (r.raw != null && r.raw !== "") {
        var rn = Number(r.raw);
        if (isFinite(rn)) raw = rn;
      }

      var o = { raw: raw, judgment: judgment, comment: r.comment || "" };
      var rs = sanitizeReasons(r.reasons);
      if (rs) o.reasons = rs;   // 根拠は任意（無ければキーごと持たせない）
      out[k] = o;
    }
    return out;
  }

  function normSession(src) {
    return {
      id: uid("s_"),
      assessmentId: src.assessmentId,
      date: src.date || nowDate(),
      discipline: src.discipline === "ST" ? "ST" : "OT",
      examiner: src.examiner || "",
      results: sanitizeResults(src.results),
      note: src.note || ""
    };
  }

  var Store = {
    lastError: null,   // 直近の失敗理由（成功時 null）。app 側が flash 表示に使う

    init: function () {
      // 書けなくても続行（例外を投げない）。getItem 自体が throw する環境も許容する。
      try {
        if (!localStorage.getItem(KEY)) write(emptyDb());
      } catch (e) {
        console.error("Store: init 中に localStorage へアクセスできません", e);
      }
      return true;
    },

    listCases: function () { return read().cases; },

    getCase: function (id) { return findCase(read(), id); },

    createCase: function (label, memo) {
      var db = read();
      var c = {
        id: uid("c_"),
        label: String(label == null ? "" : label).trim(),
        memo: String(memo == null ? "" : memo),
        createdAt: nowDate(),
        sessions: []
      };
      db.cases.push(c);
      if (!write(db)) { db.cases.pop(); return null; }   // 失敗時は巻き戻し
      return c;
    },

    deleteCase: function (id) {
      var db = read(), old = db.cases;
      var next = old.filter(function (c) { return c.id !== id; });
      if (next.length === old.length) return false;      // 対象なし（書き込みしない）
      db.cases = next;
      if (!write(db)) { db.cases = old; return false; }  // 失敗時は巻き戻し
      return true;
    },

    addSession: function (caseId, session) {
      var db = read(), c = findCase(db, caseId);
      if (!c) return null;
      var s = normSession(session);
      c.sessions.push(s);
      if (!write(db)) { c.sessions.pop(); return null; } // 失敗時は巻き戻し
      return s;
    },

    updateSession: function (caseId, sessionId, patch) {
      var db = read(), c = findCase(db, caseId);
      if (!c) return null;
      for (var i = 0; i < c.sessions.length; i++) {
        if (c.sessions[i].id !== sessionId) continue;
        var old = c.sessions[i];
        // マージ済みの新セッションを組み立ててから差し替える（巻き戻しを容易にするため）
        var s = {
          id: old.id,
          assessmentId: patch.assessmentId != null ? patch.assessmentId : old.assessmentId,
          date: patch.date != null ? patch.date : old.date,
          discipline: patch.discipline != null ? (patch.discipline === "ST" ? "ST" : "OT") : old.discipline,
          examiner: patch.examiner != null ? patch.examiner : old.examiner,
          results: patch.results != null ? sanitizeResults(patch.results) : old.results,
          note: patch.note != null ? patch.note : old.note
        };
        c.sessions[i] = s;
        if (!write(db)) { c.sessions[i] = old; return null; }  // 失敗時は巻き戻し
        return s;
      }
      return null;
    },

    deleteSession: function (caseId, sessionId) {
      var db = read(), c = findCase(db, caseId);
      if (!c) return false;
      var old = c.sessions;
      var next = old.filter(function (s) { return s.id !== sessionId; });
      if (next.length === old.length) return false;      // 対象なし
      c.sessions = next;
      if (!write(db)) { c.sessions = old; return false; }// 失敗時は巻き戻し
      return true;
    },

    // JSONエクスポート/インポートはv2で廃止（SPEC §2-5 / §14）。共有は同一端末閲覧＋印刷ビューで行う。

    /* ---------- 施設基準（マイ基準）API（SPEC §8 v3・ケース非依存） ---------- */
    getNorm: function (subtestId) {
      if (!subtestId) return null;
      var n = readNorms().norms[subtestId];
      return n ? { memo: n.memo || "", bands: n.bands || null, updatedAt: n.updatedAt || null } : null;
    },

    setNorm: function (subtestId, data) {
      if (!subtestId) return null;
      data = data || {};
      var memo = String(data.memo == null ? "" : data.memo).trim();
      var bands = sanitizeBands(data.bands);
      var db = readNorms();
      var had = db.norms.hasOwnProperty(subtestId);
      var prev = had ? db.norms[subtestId] : undefined;
      // memo も bands も空なら登録エントリを消す（ストアを汚さない）
      if (!memo && !bands) {
        if (had) {
          delete db.norms[subtestId];
          if (!writeNorms(db)) { db.norms[subtestId] = prev; return null; }  // 巻き戻し
        }
        return null;
      }
      var rec = { memo: memo, bands: bands, updatedAt: nowDate() };
      db.norms[subtestId] = rec;
      if (!writeNorms(db)) {                              // 失敗時は巻き戻し
        if (had) db.norms[subtestId] = prev; else delete db.norms[subtestId];
        return null;
      }
      return { memo: rec.memo, bands: rec.bands, updatedAt: rec.updatedAt };
    },

    deleteNorm: function (subtestId) {
      var db = readNorms();
      if (!db.norms.hasOwnProperty(subtestId)) return false;
      var prev = db.norms[subtestId];
      delete db.norms[subtestId];
      if (!writeNorms(db)) { db.norms[subtestId] = prev; return false; }     // 巻き戻し
      return true;
    },

    listNorms: function () { return readNorms().norms; },

    REASONS: REASONS,          // 判定根拠チップの固定5種（SPEC §8 v4）
    _uid: uid,
    _nowDate: nowDate,
    _normsKey: NORMS_KEY
  };

  global.Store = Store;
})(window);
