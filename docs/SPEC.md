# CogMap — 高次脳機能 統合プロファイル（MVP設計書）

最終更新: 2026-07-04（v1 / Fable設計）

## 1. 目的・背景

- 高次脳機能障害の評価は多数（CAT・BADS・TMT-J・RBMT・SLTA…）あり、各検査の下位項目が
  **どの認知機能（注意・記憶・遂行機能など）を反映しているか**が職種間で共有されにくい。
- 特に **STが実施した評価（SLTA・WAB・S-PA等）の結果がOTに伝わりにくい**、逆も然り。
- 本ツールは、各評価の結果を入力すると **検査項目→認知領域のマッピングに基づく統合プロファイル**
  を可視化し、OT/ST間で共有できるようにするローカルWebアプリ（MVP）。
- 副次価値: **未評価領域（誰もまだ見ていない機能）の見える化**、ADL/IADLへの示唆の提示。

## 2. 安全原則（絶対制約）

1. **非PII**: 患者氏名・ID・生年月日は入力させない。ケースは匿名ラベル（例「A-01」）のみ。
   入力欄付近に「氏名・患者ID等の個人情報は入力しないでください」と明記。
2. **診断しない**: プロファイルは「セラピストが入力した判定の整理・可視化」であり、
   自動診断・重症度判定ツールではない。フッターと印刷ビューに免責を明記。
3. **判定の主体はセラピスト・カットオフの捏造禁止**（v2改訂）: 判定（正常域〜顕著な低下）の
   確定は必ずセラピストが行う（自動確定しない）。ただし検査間の判定バイアスを抑えるため、
   **出典が確認できた公表カットオフ・基準は「目安」として提示**し、生値入力時に該当する判定
   バンドをハイライト提案してよい（§6 guide）。出典を確認できない数値をデータに書くことは
   禁止。IQ・指数系は統計的慣例（±1SD/2SD）を confidence:"convention" と明示して使ってよい。
   マニュアルの年齢別正規表を丸ごと転記しない（著作権・分量。単一カットオフ＋出典は可）。
4. **完全ローカル**: 外部通信ゼロ。CDN・Webフォント・外部API禁止。127.0.0.1のみで配信。
5. データはブラウザの localStorage に保存。共有は印刷ビューと同一端末での閲覧で行う
   （JSONエクスポート/インポートはv2で廃止）。

## 3. 技術方針

- **Vanilla JS + 静的HTML/CSS**。ビルドなし・依存ゼロ・フレームワークなし。ES2020可。
- 対象ブラウザ: 院内Mac/WindowsのChrome/Edge最新。スマホ対応は不要（タブレット横は考慮）。
- 配信: `起動.command`（shaping-qomの方式を踏襲、**ポート8418** / 127.0.0.1のみ）。
- 文字コードUTF-8、UIは日本語。フォントはシステムフォント（Noto Sans JP依存禁止、
  `font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif`）。
- `<script>` は defer で `data/domains.js → data/assessments.js → data/adl-map.js →
  js/store.js → js/profile.js → js/viz.js → js/app.js` の順に読み込む。

## 4. ファイル所有権（並行作業の衝突防止）

| ファイル | 所有 | 内容 |
|---|---|---|
| `data/domains.js` `data/assessments.js` `data/adl-map.js` | ワーカーA（臨床データ） | 領域・検査マスタ・ADLマップ |
| `index.html` `css/style.css` `js/app.js` `js/store.js` `js/profile.js` `README.md` `起動.command` | ワーカーB（アプリ本体） | UI・状態管理・計算 |
| `js/viz.js` | ワーカーC（可視化） | レーダー・ヒートマップ・経過グラフ |
| `docs/SPEC.md` | Fable | 本書 |

他人のファイルは**読んでよいが書かない**。契約は本書のスキーマのみ。

## 5. 認知領域マスタ（`data/domains.js`）

```js
// window.COG_DOMAINS: 順序 = 表示順
window.COG_DOMAINS = [
  // group: 大分類（レーダーの6軸）。id/nameは変更禁止（他ファイルが参照）
  { id: "attention_sustained",  name: "持続性注意",        group: "注意・処理速度" },
  { id: "attention_selective",  name: "選択性注意",        group: "注意・処理速度" },
  { id: "attention_shift",      name: "転換性注意",        group: "注意・処理速度" },
  { id: "attention_divided",    name: "配分性注意",        group: "注意・処理速度" },
  { id: "working_memory",       name: "ワーキングメモリ",  group: "注意・処理速度" },
  { id: "processing_speed",     name: "処理速度",          group: "注意・処理速度" },
  { id: "memory_verbal",        name: "言語性記憶",        group: "記憶" },
  { id: "memory_visual",        name: "視覚性記憶",        group: "記憶" },
  { id: "memory_prospective",   name: "展望記憶",          group: "記憶" },
  { id: "exec_planning",        name: "計画・段取り",      group: "遂行機能" },
  { id: "exec_shift",           name: "概念形成・セット転換", group: "遂行機能" },
  { id: "exec_inhibition",      name: "抑制",              group: "遂行機能" },
  { id: "exec_fluency",         name: "流暢性・発散的思考", group: "遂行機能" },
  { id: "lang_comprehension",   name: "言語理解",          group: "言語" },
  { id: "lang_expression",      name: "言語表出",          group: "言語" },
  { id: "lang_literacy",        name: "読み書き・計算",    group: "言語" },
  { id: "visuospatial",         name: "視空間認知",        group: "視空間・行為" },
  { id: "construction",         name: "構成",              group: "視空間・行為" },
  { id: "neglect",              name: "半側空間無視",      group: "視空間・行為" },
  { id: "praxis",               name: "行為（失行）",      group: "視空間・行為" },   // v2追加
  { id: "intellect",            name: "全般的知的機能",    group: "全般・意欲" },
  { id: "drive",                name: "意欲・発動性",      group: "全般・意欲" },
];
window.COG_GROUPS = ["注意・処理速度","記憶","遂行機能","言語","視空間・行為","全般・意欲"];
```

## 6. 検査マスタ（`data/assessments.js`）

```js
// window.COG_ASSESSMENTS
[
  {
    id: "cat",                       // 英小文字スネーク。変更禁止
    name: "標準注意検査法（CAT）",
    shortName: "CAT",
    discipline: ["OT","ST"],         // 主に実施する職種（両方可）
    category: "注意",                // 一覧のグルーピング用
    note: "基準はCATマニュアルの年齢帯データを参照",   // 任意
    subtests: [
      {
        id: "cat_sdmt",              // 検査id + "_" + 下位id
        name: "SDMT（符号）",
        raw: { label: "達成率", unit: "%", min: 0, max: 100, step: 0.1 }, // 任意・null可
        domains: [                   // 認知領域への重み 0.3〜1.0
          { domain: "processing_speed", weight: 1.0 },
          { domain: "attention_selective", weight: 0.6 }
        ],
        note: "",                    // 任意（判定の参考。カットオフ断定は書かない）
        guide: {                     // v2: 判定ガイド。出典が確認できた場合のみ。なければ null
          text: "23/24がカットオフとされる（参考）",  // 入力画面に「目安」として表示
          source: "検査原著/マニュアル名等の短縮表記",  // 詳細は docs/cutoff-sources.md
          confidence: "published",   // "published"=公表基準 | "convention"=±1SD等の統計的慣例
          bands: [                   // 生値→提案判定。部分的でもよい（bandsなし=textのみ）
            { judgment: 0, min: 24, max: 30, label: "24〜30" },
            { judgment: 2, min: 0,  max: 23, label: "23以下（重症度は臨床判断で上書き）" }
          ]
        }
      },
      // ...
    ]
  },
]
```

- `raw` は「生値のメモ」用。null なら数値欄を出さない。`raw.higherIsWorse: true`（任意）を
  持つ検査（CBS・やる気スコア等）は入力欄に「高得点ほど重い」を強調表示する（誤入力対策・v4）。
- `scoring: "reference"`（任意・v4）: 総合指標が下位項目と同じ領域を二重に押し上げる検査
  （例: BADS総プロフィール点）に付ける。**プロファイル計算から除外**し、根拠には「参考」と
  して表示のみ。総合指標×下位指標の二重カウントは全検査で点検すること。
- `guide.bands` があり生値が入力されたとき、該当する判定ボタンを**ハイライト提案**する
  （自動選択はしない。最終確定は常にセラピスト）。guide=null の検査は「基準はマニュアル参照」
  と表示し、目安がある検査とない検査が混在しても入力体験が破綻しないようにする。
- `weight`: 1.0=その領域を直接測る主指標 / 0.6=強く関与 / 0.3=部分的に関与。この3値のみ使う。
  **v2: 全マッピングは文献照合で再検証し、根拠を docs/mapping-rationale.md に残すこと**
  （例: TMT-Aは選択性注意だけでなく処理速度・視覚探索も反映する——「主指標」の妥当性を検証済みにする）。

### 収載する検査（MVP・この順で）

| id | 名称 | 職種 | 下位項目の粒度 |
|---|---|---|---|
| mmse | MMSE-J | OT/ST | 総得点のみ（intellect 1.0） |
| moca | MoCA-J | OT/ST | 総得点のみ（intellect 1.0） |
| cat | 標準注意検査法（CAT） | OT/ST | Span（視覚性/聴覚性）・抹消/検出課題・SDMT・記憶更新・PASAT・上中下検査（Position Stroop）・CPT |
| kanahiroi | かなひろいテスト | OT/ST | 構成は調査ワーカーが確定（1〜2項目、注意カテゴリ） |
| tmt | TMT-J | OT | Part A / Part B |
| bads | BADS 遂行機能障害症候群の行動評価 | OT | 規則変換カード・行為計画・鍵探し・時間判断・動物園地図・修正6要素（＋総プロフィール） |
| fab | FAB | OT/ST | 総得点のみ（exec系 0.6均等 + intellect 0.3） |
| kwcst | 慶應版WCST（KWCST） | OT | 達成カテゴリー数・保続性誤り |
| rbmt | リバーミード行動記憶検査（RBMT） | OT/ST | 標準プロフィール点・展望記憶項目 |
| wmsr | WMS-R | OT/ST | 言語性記憶・視覚性記憶・注意/集中・遅延再生（指数） |
| spa | S-PA 標準言語性対連合学習検査 | ST | 有関係対語・無関係対語 |
| rocft | Rey複雑図形（ROCFT） | OT | 模写・即時再生・遅延再生 |
| kohs | コース立方体組み合わせテスト | OT | IQ換算値 |
| rcpm | RCPM（レーヴン色彩マトリックス） | OT/ST | 総得点 |
| bit | BIT 行動性無視検査 | OT | 通常検査計・行動検査計 |
| cbs | CBS（Catherine Bergego Scale） | OT | 総得点 |
| slta | SLTA 標準失語症検査 | ST | 聴く・話す・読む・書く・計算（大項目5つ） |
| spta | SPTA 標準高次動作性検査 | OT/ST | 大項目を5±2項目に集約（praxis中心。集約は調査ワーカーが実際の検査構成を調べて確定） |
| wab | WAB失語症検査 | ST | AQ・自発話・話し言葉の理解・復唱・呼称 |
| wais | WAIS-IV | OT/ST | FSIQ・VCI・PRI・WMI・PSI |
| cas | 標準意欲評価法（CAS） | OT/ST | 面接評価・質問紙・観察評価（drive 1.0） |
| vitality | Vitality Index（バイタリティインデックス） | OT/ST | 総得点（drive 1.0・病棟観察系・v4追加。得点範囲/カットオフはWeb照合の上で設定） |
| apathy | やる気スコア（Apathy Scale 日本語版） | OT/ST | 総得点（drive 1.0・higherIsWorse・v4追加。カットオフはWeb照合の上で設定） |

マッピングの方針（ワーカーAが臨床的に妥当な重みを設定。迷ったら保守的に0.3）:
- CAT: Span→working_memory / 抹消・検出→attention_selective(+sustained 0.3) / SDMT→processing_speed(+selective 0.6) / 記憶更新→working_memory / PASAT→attention_divided(+working_memory 0.6) / 上中下→exec_inhibition(+selective 0.6) / CPT→attention_sustained
- TMT-A→attention_selective(+processing_speed 0.6)、TMT-B→attention_shift(+working_memory 0.6)
- BADS各下位→exec_planning中心、規則変換→exec_shift、修正6要素→exec_planning(+attention_divided 0.6, memory_prospective 0.3)
- RBMT→memory_verbal 0.6・memory_visual 0.6・展望記憶項目→memory_prospective 1.0
- SLTA: 聴く→lang_comprehension、話す→lang_expression、読む/書く/計算→lang_literacy
- BIT/CBS→neglect 1.0（CBSはADL場面の無視）
- WAIS: VCI→lang系0.3+intellect 0.6、WMI→working_memory 1.0、PSI→processing_speed 1.0、PRI→visuospatial 0.6+construction 0.6、FSIQ→intellect 1.0

## 7. ADLマップ（`data/adl-map.js`）

```js
// window.COG_ADL_MAP: domainId → ADL/IADLへの示唆（低下時に表示する「候補」）
{
  "attention_sustained": {
    adl:   ["食事中に途中で手が止まる", "入浴動作の工程が長いと中断する", "..."],
    observe: ["午前/午後での差", "雑音下での持続時間", "..."],
    hints: ["短い工程に区切る", "環境刺激を減らす", "..."]   // あくまで候補提示
  }, ...
}
```
全22領域ぶん（v2でpraxis追加）。各配列3〜5件。断定調を避け「〜しやすい」「〜が起きることがある」で書く。

## 8. データ保存（`js/store.js`）

localStorage キー: `cogmap.v1`。スキーマ:

```js
{
  version: 1,
  cases: [
    {
      id: "c_xxxxxxxx",            // ランダム英数
      label: "A-01",               // 匿名ラベル（PII禁止の注意書き付き）
      memo: "",                    // 疾患名や経過など自由記載（PII禁止）
      createdAt: "2026-07-04",
      sessions: [
        {
          id: "s_xxxxxxxx",
          assessmentId: "cat",
          date: "2026-07-04",       // 実施日
          discipline: "OT" | "ST",  // 実施職種
          examiner: "",             // 任意（イニシャル等）
          results: {                // subtestId → 結果
            "cat_sdmt": { raw: 62.5, judgment: 2, comment: "",
                          reasons: ["数値基準"] }   // v4: 判定根拠チップ（任意・複数可）
                          // 選択肢は固定5種: 数値基準 / 質的誤反応 / ADL・生活場面 / 他職種情報 / 検査条件（疲労・失語等）
          },
          note: ""
        }
      ]
    }
  ]
}
```

**judgment（判定）は4段階**（セラピストが選択。自動判定しない）:

| 値 | ラベル | 色トークン |
|---|---|---|
| 0 | 正常域 | `--j0` |
| 1 | 境界 | `--j1` |
| 2 | 低下 | `--j2` |
| 3 | 顕著な低下 | `--j3` |
| null | 未実施 | `--j-none`（グレー） |

`window.Store` API（すべて同期）:
`init()` / `listCases()` / `createCase(label, memo)` / `updateCase(id, patch)` / `deleteCase(id)` /
`getCase(id)` / `addSession(caseId, session)` / `updateSession(caseId, sessionId, patch)` /
`deleteSession(caseId, sessionId)`（exportCase / importCase はv2で廃止）

### 施設基準（マイ基準）ストア（v3）

年齢別基準などマニュアル参照が必要な値を**施設側で一度だけ入力**し、以後はクリック参照・
ハイライト提案に使えるようにする。アプリは既定値を一切持たない（捏造禁止の原則は維持。
値の出典管理は入力した施設側の責任と明記する）。

localStorage キー: `cogmap.norms.v1`（**ケース非依存**・全ケース共通）
```js
{ version: 1, norms: {
    "<subtestId>": { memo: "例: 60代 28±3（施設マニュアルp.45）",
                     bands: [{judgment, min, max, label}] | null,   // 任意
                     updatedAt: "2026-07-04" }
} }
```
API: `Store.getNorm(subtestId)` / `setNorm(subtestId, {memo, bands})` / `deleteNorm(subtestId)`
提案の優先順位: **施設基準bands ＞ guide.bands**（施設基準がある項目はそちらでハイライト提案）。

## 9. プロファイル計算（`js/profile.js`）

```js
// window.Profile.compute(caseObj, opts) → プロファイル
// opts: { until: "2026-07-04" | null }  // その日付以前の最新セッションだけ使う（経過比較用）
{
  domains: {
    "processing_speed": {
      score: 1.8,          // Σ(judgment×weight)/Σweight（judgment=null と scoring:"reference" の結果は除外）
      flagged: true,       // weight>=0.6 かつ judgment>=2 の根拠が1つ以上ある
      level: 2,            // score<0.5→0, <1.25→1, <2.25→2, それ以上→3
      worst: 3,            // v4: 根拠中の最大judgment（平均で重度が薄まる問題への併記用）
      discordant: false,   // v4: 判定不一致。同一領域に judgment 0 と >=2 が混在、
                           //     または OT と ST の judgment が2段階以上乖離
      evidence: [          // 表示用の根拠リスト（weight降順）
        { assessmentId:"cat", subtestId:"cat_sdmt", subtestName:"SDMT（符号）",
          weight:1.0, judgment:2, date:"2026-07-04", discipline:"OT", raw:62.5, comment:"" }
      ]
    },
    "neglect": { score: null, evidence: [] }   // 根拠ゼロ → 未評価（グレー表示）
  },
  groups: { "注意・処理速度": { score: 1.2, evaluated: 5, total: 6 }, ... },  // score=評価済み領域の平均、未評価のみならnull
  coverage: { evaluated: 14, total: 22, gaps: ["neglect", ...] },             // 未評価領域リスト
  byDiscipline: { OT: ["cat","tmt"], ST: ["slta"] }                           // どの職種がどの検査を入れたか
}
```

- 同一検査を複数回実施している場合は**最新セッションのみ**採用（`until`指定時はその時点の最新）。
- `Profile.timeline(caseObj)` → 日付昇順で `[{date, groups: {...}, domains: {...(scoreのみ)}}]`
  （その日付までの累積最新でcomputeした結果。評価日が増えるごとに1点）。

## 10. 可視化（`js/viz.js`）— ワーカーC契約

依存ゼロ・SVG生成（canvasより印刷が綺麗）。`window.Viz`:

```js
Viz.radar(el, items, opts)
// items: [{ label:"注意・処理速度", value: 1.2|null, max: 3 }] 6軸想定（3〜8軸で動くこと）
// value=null の軸は点を打たず軸ラベルをグレーにする。opts: {size?: number}
// v2反転: **外側=0 正常域・中心=3 顕著な低下**（半径=(3−値)/3）。塗りは半透明。
// 目盛りリングラベル（0〜3）は白ハロー等で重なり回避し、データ多角形より上に描く。

Viz.domainBars(el, rows)
// rows: [{ label:"持続性注意", group:"注意・処理速度", score:1.8|null, level:0-3|null,
//          flagged:bool, evidenceCount:int }]
// v2反転: **正常=最長**（バー長=(3−score)/3）。目盛りは数値ルーラーではなく
// 「長いほど正常（右端=0 正常域）」の1行キャプション（狭幅でのラベル衝突回避のため）。
// level色分け、null=「未評価」バッジ（**バーの外側**に置き文字を重ねない）。group見出しで区切る。

Viz.matrix(el, data)
// data: { rows:[{id,name}], cols:[{id,name,discipline:"OT"|"ST"|"OT/ST"}],
//         cells:[[ {value:0-3|null, weight:0.3|0.6|1.0|null, tooltip:""} ]] }
// rows=領域、cols=実施済み検査。HTMLテーブル。セル= judgment色 × weight（1.0=●大, 0.6=●中, 0.3=●小）。
// weightあり・value=null（未実施）のセルは --j-none の輪郭のみの○（title「未実施（検査項目はこの領域に関与）」）。凡例に「○ 未実施」を含む。
// 「どの検査がどの機能を反映しているか」を一望する画面の心臓部。列ヘッダに職種バッジ。

Viz.timeline(el, series, opts)
// series: [{ label:"注意・処理速度", points:[{date:"2026-07-04", value:1.2}] }]
// v2反転: y軸は上=0 正常域・下=3 顕著な低下（「上がる=改善」に統一、レーダー/バーと整合）。凡例つき。日付x軸。
```

- 色はCSSカスタムプロパティ（下記）を `getComputedStyle` で参照。ハードコード禁止。
- 各関数は `el.innerHTML` を置き換える冪等レンダリング。ツールチップは `title` 属性で簡易に。

## 11. CSSトークン（ワーカーBが `css/style.css` の `:root` に定義）

```css
:root {
  --bg: #fafaf8;        /* 生成りがかった白 */
  --panel: #ffffff;
  --ink: #1a2433;       /* 濃紺の文字色 */
  --sub: #5c6b7f;
  --line: #d9dee6;
  --accent: #1e3a5f;    /* 深藍（見出し・タブ） */
  --j0: #7fb597;        /* 正常域: 落ち着いた緑 */
  --j1: #d9b23e;        /* 境界: 芥子 */
  --j2: #d97b4a;        /* 低下: テラコッタ */
  --j3: #b04a3c;        /* 顕著な低下: 深い赤茶 */
  --j-none: #c9cfd8;    /* 未評価グレー */
  --ot: #2e6e8e;        /* OTバッジ */
  --st: #7a5c8e;        /* STバッジ */
}
```

デザインはクリニカル・スイス（白地・グリッド・罫線・ウェイト階層）。装飾を盛らない。
印刷CSS（`@media print`）でプロファイル画面をA4縦1枚に収める。

## 12. 画面仕様（`index.html` + `js/app.js`、SPA・上部タブ）

1. **ケース** — ケース一覧・新規作成（匿名ラベル+メモ、PII禁止注意書き）・選択・削除。
   現在ケースはヘッダに常時表示。（JSONエクスポート/インポートはv2で廃止）
2. **評価入力** — 検査をカテゴリ別に選択（**選択リストに職種バッジは表示しない**。実施職種は
   セッションのOT/ST選択で入力）→ 実施日・職種・下位項目ごとに判定（0〜3のセグメントボタン、
   未実施可）＋生値（任意）＋コメント。**guideがある項目は「目安」テキスト＋出典を表示し、
   生値入力で該当バンドの判定ボタンをハイライト提案**（自動選択しない）。guide=nullの項目は
   「基準はマニュアル参照」と表示。保存で一覧に追加。入力済みセッションの一覧・編集・削除もここ。
   **v4（ブレ対策）**: 画面上部に4段階の**判定アンカー**（運用定義）を常時表示——
   0 正常域=基準・年齢/教育歴・観察所見から低下を支持しない ／ 1 境界=カットオフ近傍、
   生活影響が不明、または疲労・失語・麻痺等の交絡で断定できない（結論ではなく再評価・観察の指示）
   ／ 2 低下=基準未満または質的誤反応があり、ADL/訓練場面への影響が臨床的に想定される ／
   3 顕著な低下=明確な基準逸脱・課題不能・重度誤反応、または安全・自立度への強い影響。
   各下位項目に**判定根拠チップ**（§8の固定5種・任意・複数選択）。CBS等 higherIsWorse の
   検査は生値欄に「高得点ほど重い」を強調。
3. **プロファイル** — **v4: 最上部に臨床サマリー5行を固定表示**（忙しい現場で最初に読む場所）:
   ①主要な低下=level>=2をlevel降順・flagged優先で上位5 ②安全・ADLに直結=固定ウォッチリスト
   {neglect, attention_divided, exec_inhibition, memory_prospective, drive, praxis} のうち低下
   （未評価ならその旨） ③未評価の重要領域=ウォッチリスト優先＋**推奨検査**（その領域に
   weight>=0.6でマップされる収載検査の逆引き） ④判定不一致=discordantな領域 ⑤次の確認=
   低下領域のADLマップobserveから最大3件。
   その下に大分類レーダー（6軸）＋領域別バー（22行）。**数値でなく言葉を主表示**
   （「低下・根拠3件」。scoreの数値はサブ表示）し、worst>level の領域は「最悪: 顕著な低下」を
   併記。discordant領域に「不一致」バッジ。各バー click で根拠
   （どの検査のどの項目・職種・日付・judgment）を展開。coverage表示「評価済み 14 / 22 領域」
   ＋未評価領域チップ。**OT/ST実施内訳**も表示。
4. **マトリクス** — Viz.matrix。領域×実施済み検査の反映マップ。列ヘッダの職種バッジは
   **実際に実施したセッションの職種**を表示（検査マスタの想定職種ではない）。
5. **経過** — Viz.timeline（大分類6系列）。評価日が2日以上あるときのみ。
6. **ADLの視点** — level>=2 の領域について adl-map の内容（起きやすいこと/観察ポイント/
   工夫の候補）をカード表示。「候補の提示であり、個別の状態像に応じて判断してください」を明記。
7. **基準**（v3新設・#norms） — 収載全検査×下位項目の判定目安を一覧参照するリファレンス。
   検査ごとのアコーディオンで、目安テキスト・bands表・出典・confidence・「要人間確認」フラグを
   表示し、各項目に**施設基準（メモ＋任意の数値バンド）の閲覧・編集**を付ける（§8 v3ストア）。
   冒頭に「施設基準は自施設のマニュアル等で確認した値を各自の責任で入力・管理してください。
   本アプリは基準の既定値を提供しません」を明記。
8. **印刷** — プロファイル+マトリクス簡約のA4サマリー（window.print）。ヘッダに匿名ラベル・
   出力日・免責。

評価入力画面の各下位項目には「基準を見る」リンクを置き、クリックで**ポップオーバー**（目安
詳細＋出典＋施設基準の閲覧・その場編集）を開けるようにする——マニュアルをいちいち引かずに
入力の文脈のまま確認できることが目的。タブ順: ケース/評価入力/プロファイル/マトリクス/経過/
ADLの視点/基準/印刷。

共通フッター: 「本ツールは評価結果の整理・共有を支援するものであり、診断や重症度の自動判定は
行いません。判定は各検査マニュアルの基準に基づき評価者が入力してください。」

## 13. 起動・配布

- `起動.command`: shaping-qom方式を踏襲（ポート**8418**、127.0.0.1、python3 http.server、
  既存サーバー再利用、エラー時ウィンドウ保持）。ビルド不要なのでリポジトリ直下を配信。
- README.md: 目的・安全原則・使い方・OT⇔ST共有手順（エクスポート→USBや院内共有→インポート）。

## 13.5 v5 契約変更（2026-07-05 コードレビュー全量対応）

1. **js/util.js（新設・全jsの先頭でロード）**: `window.CogUtil = { esc(s), LEVEL_LABELS,
   levelOf(score|null)→0-3|null（閾値0.5/1.25/2.25・profile.jsと同一）, fmt1(n)（小数1桁） }`。
   esc/判定ラベル/閾値/表示桁の重複定義を全ファイルでこれに一本化。スコアの画面表示は小数1桁に統一。
   script順: data/*.js → js/util.js → store → profile → viz → app。
2. **Storeの書き込み失敗契約**: write/writeNorms は setItem を try/catch し、失敗時は
   `Store.lastError="storage_write_failed"` を立てて false。全ミューテータ（createCase/deleteCase/
   addSession/updateSession/deleteSession/setNorm/deleteNorm）は永続化失敗時 null/false を返す。
   init() は例外を投げない。app側は失敗時「保存できませんでした（ブラウザの保存領域を確認）」を
   flashで表示し、白画面・無言喪失を禁止。read()はケースの id/label/sessions を正規化
   （sessions欠落は[]補完）。sanitizeResultsは judgment を整数0-3以外null・rawを数値以外nullに。
   店内キャッシュ: db/normsはメモリキャッシュし、ミューテーション時のみ再パース/書き込み。
3. **最新セッションの選択キーを (assessmentId, discipline) に変更**（profile.js /
   app.jsのマトリクス用コピーも同一）。同一検査のOT実施とST実施は両方生存し、同一検査の
   OT/ST不一致検出が機能する。マトリクスの列は検査×職種（例: CAT[OT] と CAT[ST] は別列）。
   byDiscipline（実施内訳）は「judgment!=null が1件以上あるセッション」だけを数える。
4. **compute拡張**: domain に `referenceOnly:boolean`（根拠が全て参考=referenceで score null）。
   未評価チップは「（参考あり）」を付記し、根拠カードは「参考n件」を表示（矛盾表示の解消）。
   マトリクス/印刷のセル生成も scoring:"reference" を除外（プロファイルと整合）。
5. **施設基準バンド**: 保存時に範囲重複を検出してエラー（min/max null=開区間として判定）。
   bandForValue は防御として「最も狭いバンド」を採用。
6. **入力ガード**: 実施日 input に max=今日、保存時に未来日をエラー。編集中は検査セレクタを
   disabled。lastSessionDate/Disc は新規保存時のみ更新し、検査の discipline に含まれない
   lastSessionDisc は既定値に使わない。
7. **印刷**: 検査×大分類マトリクスは8列ごとに分割して縦に積む（A4クリップ防止）。
   @media print で .table-scroll は overflow:visible。印刷の領域テーブルにも「最悪」注記を出す。
8. **その他**: セッション一覧ソートは日付降順＋同日時は登録順で安定化。boot の二重レンダリング
   防止（route()は同一ハッシュの連続実行をスキップしない設計のまま、bootでの重複呼び出しを排除）。
   ポップオーバーは閉じ関数を要素に持たせ、route/強制除去時に必ず close() を呼ぶ。
   WATCHLIST は data/domains.js の `watch:true` フラグから導出（app.jsのハードコード廃止）。
   Store.updateCase（未使用）削除・listNorms は基準タブの一括読みに使用。起動.command は
   ポート再利用前に応答が CogMap 本体か（index.html の目印文字列）を確認する。

## 14. MVP後の候補（実装しない・READMEの「今後」に記載のみ）

- VPTA・CAS詳細・DEX質問紙の追加 / HDS-R・語流暢性課題の再収載（v2で除外） /
  病棟観察（Moss型）との統合 / 検査間の乖離検知 / Apps Script等での院内共有自動化 /
  FIM・ADL実測値との突合 / JSONエクスポート/インポートの復活（他端末共有が必要になった場合）
