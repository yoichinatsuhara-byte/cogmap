// CogMap データマスタ: 認知領域マスタ（SPEC §5）
// 判定の自動化はしない（SPEC §2）。id/name/group は他ファイルが参照するため変更禁止。

// window.COG_DOMAINS: 順序 = 表示順
window.COG_DOMAINS = [
  // group: 大分類（レーダーの6軸）。id/nameは変更禁止（他ファイルが参照）
  { id: "attention_sustained",  name: "持続性注意",        group: "注意・処理速度" },
  { id: "attention_selective",  name: "選択性注意",        group: "注意・処理速度" },
  { id: "attention_shift",      name: "転換性注意",        group: "注意・処理速度" },
  { id: "attention_divided",    name: "配分性注意",        group: "注意・処理速度", watch: true },
  { id: "working_memory",       name: "ワーキングメモリ",  group: "注意・処理速度" },
  { id: "processing_speed",     name: "処理速度",          group: "注意・処理速度" },
  { id: "memory_verbal",        name: "言語性記憶",        group: "記憶" },
  { id: "memory_visual",        name: "視覚性記憶",        group: "記憶" },
  { id: "memory_prospective",   name: "展望記憶",          group: "記憶", watch: true },
  { id: "exec_planning",        name: "計画・段取り",      group: "遂行機能" },
  { id: "exec_shift",           name: "概念形成・セット転換", group: "遂行機能" },
  { id: "exec_inhibition",      name: "抑制",              group: "遂行機能", watch: true },
  { id: "exec_fluency",         name: "流暢性・発散的思考", group: "遂行機能" },
  { id: "lang_comprehension",   name: "言語理解",          group: "言語" },
  { id: "lang_expression",      name: "言語表出",          group: "言語" },
  { id: "lang_literacy",        name: "読み書き・計算",    group: "言語" },
  { id: "visuospatial",         name: "視空間認知",        group: "視空間・行為" },
  { id: "construction",         name: "構成",              group: "視空間・行為" },
  { id: "neglect",              name: "半側空間無視",      group: "視空間・行為", watch: true },
  { id: "praxis",               name: "行為（失行）",      group: "視空間・行為", watch: true },   // v2追加
  { id: "intellect",            name: "全般的知的機能",    group: "全般・意欲" },
  { id: "drive",                name: "意欲・発動性",      group: "全般・意欲", watch: true },
];
window.COG_GROUPS = ["注意・処理速度","記憶","遂行機能","言語","視空間・行為","全般・意欲"];
