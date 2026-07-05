/* js/profile.js — プロファイル計算（SPEC §9 / §13.5-3,4）。純関数。
 * 依存: window.COG_DOMAINS / COG_GROUPS / COG_ASSESSMENTS / CogUtil（呼び出し時に参照）。
 * judgment=null（未実施）の結果は根拠から除外。
 * 最新セッション選択は (assessmentId, discipline) 単位（同一検査のOT実施とST実施は両方生存）。 */
(function (global) {
  "use strict";

  // subtestId → { assessmentId, subtestName, domains:[{domain, weight}] }
  function subtestMap() {
    var idx = {}, list = global.COG_ASSESSMENTS || [];
    for (var i = 0; i < list.length; i++) {
      var subs = list[i].subtests || [];
      for (var j = 0; j < subs.length; j++) {
        idx[subs[j].id] = {
          assessmentId: list[i].id,
          subtestName: subs[j].name,
          domains: subs[j].domains || [],
          scoring: subs[j].scoring || null   // v4: "reference" は計算除外・根拠のみ（§6/§9）
        };
      }
    }
    return idx;
  }

  // 閾値の一本化（SPEC §13.5-1）: CogUtil.levelOf に委譲。_level は互換のため公開名を残す。
  function levelOf(score) { return global.CogUtil.levelOf(score); }

  // (assessmentId, discipline) ごとに最新セッションを1つ選ぶ（SPEC §13.5-3）。
  // until指定時はその日付以前のみ。日付が同じなら配列後方（後から入力）を採用。
  // 同一検査のOT実施とST実施は別キーなので両方生存する（同一検査間の OT/ST 不一致検出が働く）。
  function latestSessions(caseObj, until) {
    var by = {}, sessions = (caseObj && caseObj.sessions) || [];
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      if (until && s.date > until) continue;
      var disc = s.discipline === "ST" ? "ST" : "OT";
      var key = s.assessmentId + "|" + disc;
      var cur = by[key];
      if (!cur || s.date >= cur.date) by[key] = s;
    }
    var out = [];
    for (var k in by) if (by.hasOwnProperty(k)) out.push(by[k]);
    return out;
  }

  function byWeightDesc(a, b) { return b.weight - a.weight; }

  function compute(caseObj, opts) {
    opts = opts || {};
    var until = opts.until || null;
    var domains = global.COG_DOMAINS || [];
    var groups = global.COG_GROUPS || [];
    var idx = subtestMap();
    var sessions = latestSessions(caseObj, until);

    var ev = {};                       // domainId → evidence[]
    for (var d = 0; d < domains.length; d++) ev[domains[d].id] = [];

    var byDiscipline = { OT: [], ST: [] };
    var seen = { OT: {}, ST: {} };

    for (var i = 0; i < sessions.length; i++) {
      var sess = sessions[i];
      var disc = sess.discipline === "ST" ? "ST" : "OT";
      var hasJudged = false;           // judgment!=null が1件以上あるか（実施内訳の集計条件・SPEC §13.5-3）

      var results = sess.results || {};
      for (var subId in results) {
        if (!results.hasOwnProperty(subId)) continue;
        var r = results[subId];
        if (!r || r.judgment == null) continue;        // 未実施は根拠から除外
        hasJudged = true;                               // マップ有無に関わらず「実施あり」と数える
        var meta = idx[subId];
        if (!meta) continue;                            // マスタに無いid（旧データ等）は無視
        for (var m = 0; m < meta.domains.length; m++) {
          var map = meta.domains[m];
          if (!ev[map.domain]) continue;
          ev[map.domain].push({
            assessmentId: sess.assessmentId,
            subtestId: subId,
            subtestName: meta.subtestName,
            weight: map.weight,
            judgment: r.judgment,
            date: sess.date,
            discipline: disc,
            raw: (r.raw == null ? null : r.raw),
            comment: r.comment || "",
            reasons: (Array.isArray(r.reasons) ? r.reasons.slice() : []),   // v4: 判定根拠チップ
            referenceMark: (meta.scoring === "reference")                    // v4: 計算除外・表示のみ
          });
        }
      }
      // 実施内訳: judgment!=null が1件以上あるセッションだけを数える（SPEC §13.5-3）
      if (hasJudged && !seen[disc][sess.assessmentId]) {
        seen[disc][sess.assessmentId] = true;
        byDiscipline[disc].push(sess.assessmentId);
      }
    }

    var domainOut = {};
    for (var dd = 0; dd < domains.length; dd++) {
      var id = domains[dd].id, list = ev[id];
      list.sort(byWeightDesc);
      if (list.length === 0) { domainOut[id] = { score: null, flagged: false, level: null, worst: null, discordant: false, referenceOnly: false, evidence: [] }; continue; }
      // scoring:"reference" は score/flagged/level/worst/discordant の計算から除外（evidence には残す）
      var sw = 0, swj = 0, flagged = false, worst = null, refCount = 0;
      var has0 = false, hasGe2 = false, otJ = [], stJ = [];
      for (var e = 0; e < list.length; e++) {
        var it = list[e];
        if (it.referenceMark) { refCount++; continue; }       // 参考指標は計算対象外
        sw += it.weight;
        swj += it.judgment * it.weight;
        if (it.weight >= 0.6 && it.judgment >= 2) flagged = true;
        if (worst == null || it.judgment > worst) worst = it.judgment;   // v4: 根拠中の最大judgment
        if (it.judgment === 0) has0 = true;
        if (it.judgment >= 2) hasGe2 = true;
        (it.discipline === "ST" ? stJ : otJ).push(it.judgment);
      }
      // v4 discordant: 同一領域に 0 と >=2 が混在、または OT と ST の判定が2段階以上乖離
      var discordant = (has0 && hasGe2);
      if (!discordant && otJ.length && stJ.length) {
        for (var oi = 0; oi < otJ.length && !discordant; oi++) {
          for (var si = 0; si < stJ.length; si++) {
            if (Math.abs(otJ[oi] - stJ[si]) >= 2) { discordant = true; break; }
          }
        }
      }
      var score = sw > 0 ? swj / sw : null;
      // referenceOnly: 根拠が1件以上あり、かつ全てが参考指標（score は null）（SPEC §13.5-4）
      var referenceOnly = (refCount === list.length);
      domainOut[id] = { score: score, flagged: flagged, level: levelOf(score), worst: worst, discordant: discordant, referenceOnly: referenceOnly, evidence: list };
    }

    var groupOut = {};
    for (var g = 0; g < groups.length; g++) {
      var gname = groups[g], sum = 0, cnt = 0, total = 0;
      for (var dq = 0; dq < domains.length; dq++) {
        if (domains[dq].group !== gname) continue;
        total++;
        var sc = domainOut[domains[dq].id].score;
        if (sc != null) { sum += sc; cnt++; }
      }
      groupOut[gname] = { score: cnt > 0 ? sum / cnt : null, evaluated: cnt, total: total };
    }

    var gaps = [], evaluated = 0;
    for (var dc = 0; dc < domains.length; dc++) {
      if (domainOut[domains[dc].id].score != null) evaluated++;
      else gaps.push(domains[dc].id);
    }

    return {
      domains: domainOut,
      groups: groupOut,
      coverage: { evaluated: evaluated, total: domains.length, gaps: gaps },
      byDiscipline: byDiscipline
    };
  }

  // 評価日ごと（昇順）に、その時点までの累積最新でcomputeした結果を1点として並べる。
  function timeline(caseObj) {
    var sessions = (caseObj && caseObj.sessions) || [], set = {};
    for (var i = 0; i < sessions.length; i++) set[sessions[i].date] = true;
    var dates = Object.keys(set).sort();               // "YYYY-MM-DD" は文字列比較で昇順一致
    var out = [];
    for (var d = 0; d < dates.length; d++) {
      var p = compute(caseObj, { until: dates[d] });
      var dscore = {}, gscore = {};
      for (var k in p.domains) if (p.domains.hasOwnProperty(k)) dscore[k] = p.domains[k].score;
      for (var gk in p.groups) if (p.groups.hasOwnProperty(gk)) gscore[gk] = p.groups[gk].score;
      out.push({ date: dates[d], groups: gscore, domains: dscore });
    }
    return out;
  }

  // _latestSessions: (assessmentId, discipline) 単位の最新セッション配列（app.js マトリクスの契約・SPEC §13.5-3）。
  function latestSessionsPublic(caseObj, until) { return latestSessions(caseObj, until || null); }

  global.Profile = { compute: compute, timeline: timeline, _level: levelOf, _latestSessions: latestSessionsPublic };
})(window);
