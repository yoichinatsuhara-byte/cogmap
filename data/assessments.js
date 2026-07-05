// CogMap データマスタ: 検査マスタ（SPEC §6）
// 判定の自動化はしない（SPEC §2）。raw は生値メモ用でアプリは判定を計算しない。
// カットオフ・年齢別基準は各検査マニュアル参照（note に断定は書かない）。
// weight は 1.0=主指標 / 0.6=強く関与 / 0.3=部分的に関与 の3値のみ。

window.COG_ASSESSMENTS = [
  {
    id: "mmse",
    name: "MMSE-J（精神状態短時間検査 改訂日本版）",
    shortName: "MMSE-J",
    discipline: ["OT", "ST"],
    category: "全般",
    note: "総得点による全般的認知機能のスクリーニング。一般に総得点の低下が認知機能低下の目安とされる（参考）。カットオフはマニュアル参照。",
    subtests: [
      {
        id: "mmse_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 30, step: 1 },
        domains: [
          { domain: "intellect", weight: 1.0 }
        ],
        note: "",
        guide: {
          text: "23/24点が認知症スクリーニングのカットオフとして広く用いられる（感度・特異度は対象集団に依存）。教育歴の影響に留意し、確定判定は臨床で行う。",
          source: "Folstein et al. 1975 / MMSE-J マニュアル・国内で広く用いられる23/24（詳細は docs/cutoff-sources.md）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 24, max: 30, label: "24〜30（カットオフ以上）" },
            { judgment: 2, min: 0, max: 23, label: "23以下（認知機能低下疑い・重症度は臨床判断で上書き）" }
          ]
        }
      }
    ]
  },
  {
    id: "moca",
    name: "日本語版MoCA（MoCA-J）",
    shortName: "MoCA-J",
    discipline: ["OT", "ST"],
    category: "全般",
    note: "総得点による全般的認知機能のスクリーニング。軽度の低下の検出に用いられる。カットオフはマニュアル参照。",
    subtests: [
      {
        id: "moca_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 30, step: 1 },
        domains: [
          { domain: "intellect", weight: 1.0 }
        ],
        note: "",
        guide: {
          text: "25/26点がMCI（軽度認知障害）スクリーニングのカットオフとして用いられる。教育歴12年以下は+1点補正の慣例あり。確定判定は臨床で行う。",
          source: "Nasreddine et al. 2005 / MoCA-J（鈴木ら 2010 等）25/26（詳細は docs/cutoff-sources.md）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 26, max: 30, label: "26〜30（カットオフ以上）" },
            { judgment: 2, min: 0, max: 25, label: "25以下（MCI疑い・重症度は臨床判断で上書き）" }
          ]
        }
      }
    ]
  },
  {
    id: "cat",
    name: "標準注意検査法（CAT）",
    shortName: "CAT",
    discipline: ["OT", "ST"],
    category: "注意",
    note: "基準はCATマニュアルの年齢帯データを参照。各下位検査のスコア様式もマニュアル参照。",
    subtests: [
      {
        id: "cat_span_visual",
        name: "Span（視覚性・Tapping Span）",
        raw: { label: "スパン", unit: "桁", min: 0, max: 9, step: 1 },
        domains: [
          { domain: "working_memory", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: "空間的順序を保持するスパン課題（Corsi型）。視空間性の短期保持を含む。",
        guide: {
          text: "年齢帯別基準あり（CATマニュアル参照）。年齢非依存の単一カットオフは設けない。",
          source: "CAT（標準注意検査法）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "cat_span_auditory",
        name: "Span（聴覚性・Digit Span）",
        raw: { label: "スパン", unit: "桁", min: 0, max: 9, step: 1 },
        domains: [
          { domain: "working_memory", weight: 1.0 }
        ],
        note: "数唱スパン。聴覚性の即時記憶・注意の広がりを反映。",
        guide: {
          text: "年齢帯別基準あり（CATマニュアル参照）。年齢非依存の単一カットオフは設けない。",
          source: "CAT（標準注意検査法）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "cat_cancel_detect",
        name: "抹消・検出課題",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "attention_selective", weight: 1.0 },
          { domain: "attention_sustained", weight: 0.3 },
          { domain: "processing_speed", weight: 0.3 }
        ],
        note: "所要時間・見落とし等のスコア様式はマニュアル参照。時間制限があり処理速度も関与する。",
        guide: {
          text: "年齢帯別基準あり（CATマニュアル参照）。年齢非依存の単一カットオフは設けない。",
          source: "CAT（標準注意検査法）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "cat_sdmt",
        name: "SDMT（符号）",
        raw: { label: "達成率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "processing_speed", weight: 1.0 },
          { domain: "attention_selective", weight: 0.6 }
        ],
        note: "符号-数字の変換速度。処理速度が主指標で、視覚的走査と選択性注意も関与。",
        guide: {
          text: "年齢帯別基準あり（CATマニュアル参照）。年齢非依存の単一カットオフは設けない。",
          source: "CAT（標準注意検査法）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "cat_mwt",
        name: "記憶更新検査（Memory Updating Test）",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "working_memory", weight: 1.0 }
        ],
        note: "系列末尾の数字を保持・更新する課題。ワーキングメモリの更新機能を直接反映。",
        guide: {
          text: "年齢帯別基準あり（CATマニュアル参照）。年齢非依存の単一カットオフは設けない。",
          source: "CAT（標準注意検査法）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "cat_pasat",
        name: "PASAT",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "attention_divided", weight: 1.0 },
          { domain: "working_memory", weight: 0.6 },
          { domain: "processing_speed", weight: 0.3 }
        ],
        note: "一定ペースで連続加算する課題。分配性注意が主、ワーキングメモリとペース処理速度も関与。",
        guide: {
          text: "年齢帯別基準あり（CATマニュアル参照）。年齢非依存の単一カットオフは設けない。",
          source: "CAT（標準注意検査法）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "cat_pst",
        name: "上中下検査（Position Stroop）",
        raw: null,
        domains: [
          { domain: "exec_inhibition", weight: 1.0 },
          { domain: "attention_selective", weight: 0.6 },
          { domain: "attention_shift", weight: 0.3 }
        ],
        note: "文字の意味と位置の干渉を制御する課題。干渉抑制が主で、注意の転換的側面も報告される。反応時間・誤反応数の基準はマニュアル参照。"
      },
      {
        id: "cat_cpt",
        name: "CPT（持続性注意課題）",
        raw: null,
        domains: [
          { domain: "attention_sustained", weight: 1.0 }
        ],
        note: "反応時間・見逃し/誤反応などスコア様式と基準はマニュアル参照。"
      }
    ]
  },
  {
    id: "kanahiroi",
    name: "かなひろいテスト",
    shortName: "かなひろい",
    discipline: ["OT", "ST"],
    category: "注意",
    note: "無意味綴り課題と物語文課題からなる仮名抹消課題。選択性・分配性注意と前頭葉機能（注意の制御）の評価に用いる。見落とし数・正答数・物語内容の把握で評価。年齢群別基準はマニュアル参照。",
    subtests: [
      {
        id: "kanahiroi_nonsense",
        name: "無意味綴り課題（見落とし・正答数）",
        raw: { label: "見落とし数", unit: "個", min: 0, max: 61, step: 1, higherIsWorse: true },
        domains: [
          { domain: "attention_selective", weight: 1.0 },
          { domain: "attention_sustained", weight: 0.3 }
        ],
        note: "無意味な仮名列から目標文字を拾う課題。文字の選択的走査（選択性注意）を反映。見落としが多いほど低下を示唆。",
        guide: {
          text: "年齢群別基準あり（マニュアル参照）。見落とし数の多さが選択性注意の低下を示唆。年齢非依存の単一カットオフは設けない。",
          source: "かなひろいテスト（金子満雄・老研版）年齢群別基準／原典年次は一次未確認のため要確認（詳細は docs/cutoff-sources.md・要人間確認）",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "kanahiroi_story",
        name: "物語文課題（見落とし・内容把握）",
        raw: { label: "見落とし数", unit: "個", min: 0, max: 61, step: 1, higherIsWorse: true },
        domains: [
          { domain: "attention_divided", weight: 1.0 },
          { domain: "attention_selective", weight: 0.6 },
          { domain: "lang_comprehension", weight: 0.3 }
        ],
        note: "物語を読解しながら目標文字を拾う二重課題。文字拾い（選択）と内容把握（理解）を同時に行うため分配性注意・前頭葉性の注意制御を反映。物語内容の把握の可否も併せて記録。",
        guide: {
          text: "年齢群別基準あり（マニュアル参照）。見落としの増加や物語内容の非把握が分配性注意・前頭葉機能低下を示唆。年齢非依存の単一カットオフは設けない。",
          source: "かなひろいテスト（金子満雄・老研版）年齢群別基準／原典年次は一次未確認のため要確認（詳細は docs/cutoff-sources.md・要人間確認）",
          confidence: "published",
          bands: null
        }
      }
    ]
  },
  {
    id: "tmt",
    name: "Trail Making Test 日本版（TMT-J）",
    shortName: "TMT-J",
    discipline: ["OT"],
    category: "注意",
    note: "所要時間（秒）で記録。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "tmt_a",
        name: "Part A",
        raw: { label: "所要時間", unit: "秒", min: 0, max: 600, step: 1, higherIsWorse: true },
        domains: [
          { domain: "attention_selective", weight: 1.0 },
          { domain: "processing_speed", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: "数字を順に結ぶ課題。視覚的探索（選択性注意）と処理速度をともに直接反映し、視覚的走査（視空間）も関与する。",
        guide: {
          text: "年齢群別基準あり（TMT-Jマニュアル参照）。所要時間が長いほど低下を示唆。年齢非依存の単一カットオフは設けない。",
          source: "TMT-J（Trail Making Test 日本版）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      },
      {
        id: "tmt_b",
        name: "Part B",
        raw: { label: "所要時間", unit: "秒", min: 0, max: 600, step: 1, higherIsWorse: true },
        domains: [
          { domain: "attention_shift", weight: 1.0 },
          { domain: "exec_shift", weight: 0.6 },
          { domain: "working_memory", weight: 0.6 },
          { domain: "processing_speed", weight: 0.3 }
        ],
        note: "数字と仮名を交互に結ぶ課題。転換性注意に加え、セット転換（遂行機能）・ワーキングメモリ・処理速度を反映する。",
        guide: {
          text: "年齢群別基準あり（TMT-Jマニュアル参照）。所要時間・B−A差やB/A比も参照。年齢非依存の単一カットオフは設けない。",
          source: "TMT-J（Trail Making Test 日本版）マニュアル 年齢帯別基準",
          confidence: "published",
          bands: null
        }
      }
    ]
  },
  {
    id: "bads",
    name: "遂行機能障害症候群の行動評価（BADS）",
    shortName: "BADS",
    discipline: ["OT"],
    category: "遂行",
    note: "各下位検査はプロフィール得点（0〜4）。年齢補正した標準化得点はマニュアル参照。",
    subtests: [
      {
        id: "bads_rule",
        name: "規則変換カード検査",
        raw: { label: "プロフィール得点", unit: "点", min: 0, max: 4, step: 1 },
        domains: [
          { domain: "exec_shift", weight: 1.0 },
          { domain: "exec_inhibition", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "bads_action",
        name: "行為計画検査",
        raw: { label: "プロフィール得点", unit: "点", min: 0, max: 4, step: 1 },
        domains: [
          { domain: "exec_planning", weight: 1.0 }
        ],
        note: ""
      },
      {
        id: "bads_key",
        name: "鍵探し検査",
        raw: { label: "プロフィール得点", unit: "点", min: 0, max: 4, step: 1 },
        domains: [
          { domain: "exec_planning", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "bads_time",
        name: "時間判断検査",
        raw: { label: "プロフィール得点", unit: "点", min: 0, max: 4, step: 1 },
        domains: [
          { domain: "exec_planning", weight: 0.3 },
          { domain: "intellect", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "bads_zoo",
        name: "動物園地図検査",
        raw: { label: "プロフィール得点", unit: "点", min: 0, max: 4, step: 1 },
        domains: [
          { domain: "exec_planning", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "bads_6elt",
        name: "修正6要素",
        raw: { label: "プロフィール得点", unit: "点", min: 0, max: 4, step: 1 },
        domains: [
          { domain: "exec_planning", weight: 1.0 },
          { domain: "attention_divided", weight: 0.6 },
          { domain: "memory_prospective", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "bads_profile",
        name: "総プロフィール得点",
        raw: { label: "総プロフィール得点", unit: "点", min: 0, max: 24, step: 1 },
        scoring: "reference",
        domains: [
          { domain: "exec_planning", weight: 1.0 },
          { domain: "exec_shift", weight: 0.6 },
          { domain: "exec_inhibition", weight: 0.3 }
        ],
        note: "下位6検査（規則変換・行為計画・鍵探し・時間判断・動物園地図・修正6要素）のプロフィール得点の合計。同一の遂行機能領域を下位項目と二重に押し上げるため scoring:\"reference\"（プロファイル計算から除外・参考表示）。標準化得点・区分はマニュアル参照。"
      }
    ]
  },
  {
    id: "fab",
    name: "前頭葉機能検査（FAB）",
    shortName: "FAB",
    discipline: ["OT", "ST"],
    category: "遂行",
    note: "総得点（0〜18）で記録。基準はマニュアル参照。",
    subtests: [
      {
        id: "fab_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 18, step: 1 },
        domains: [
          { domain: "exec_planning", weight: 0.6 },
          { domain: "exec_shift", weight: 0.6 },
          { domain: "exec_inhibition", weight: 0.6 },
          { domain: "exec_fluency", weight: 0.6 },
          { domain: "intellect", weight: 0.3 }
        ],
        note: "6下位項目（類似・語列挙・運動系列・葛藤指示・Go/NoGo・把握行動）の合計。概念化・語流暢性・抑制・運動プログラムを含む前頭葉機能の総合指標。",
        guide: {
          text: "11/12点前後がカットオフとして用いられる（12/13点の報告もあり要確認）。前頭葉以外の障害も加点に影響するため単独で断定しない。確定判定は臨床で行う。",
          source: "Dubois et al. 2000 / 国内報告（カットオフに幅あり・詳細は docs/cutoff-sources.md・要人間確認）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 12, max: 18, label: "12〜18（カットオフ以上・報告により12/13も）" },
            { judgment: 2, min: 0, max: 11, label: "11以下（前頭葉機能低下疑い・重症度は臨床判断で上書き）" }
          ]
        }
      }
    ]
  },
  {
    id: "kwcst",
    name: "慶應版ウィスコンシンカード分類検査（KWCST）",
    shortName: "KWCST",
    discipline: ["OT"],
    category: "遂行",
    note: "達成カテゴリー数・保続性誤りなどで評価。基準はマニュアル参照。",
    subtests: [
      {
        id: "kwcst_ca",
        name: "達成カテゴリー数",
        raw: { label: "達成カテゴリー数", unit: "個", min: 0, max: 6, step: 1 },
        domains: [
          { domain: "exec_shift", weight: 1.0 },
          { domain: "working_memory", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "kwcst_pe",
        name: "保続性誤り",
        raw: null,
        domains: [
          { domain: "exec_shift", weight: 1.0 },
          { domain: "exec_inhibition", weight: 0.6 }
        ],
        note: "保続性誤りの算出方法・基準はマニュアル参照。"
      }
    ]
  },
  {
    id: "rbmt",
    name: "リバーミード行動記憶検査（RBMT）",
    shortName: "RBMT",
    discipline: ["OT", "ST"],
    category: "記憶",
    note: "標準プロフィール点（0〜24）等で評価。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "rbmt_sps",
        name: "標準プロフィール点",
        raw: { label: "標準プロフィール点", unit: "点", min: 0, max: 24, step: 1 },
        domains: [
          { domain: "memory_verbal", weight: 0.6 },
          { domain: "memory_visual", weight: 0.6 }
        ],
        note: ""
      },
      {
        id: "rbmt_prospective",
        name: "展望記憶項目",
        raw: null,
        domains: [
          { domain: "memory_prospective", weight: 1.0 }
        ],
        note: "該当項目の採点方法はマニュアル参照。"
      }
    ]
  },
  {
    id: "wmsr",
    name: "ウェクスラー記憶検査（WMS-R）",
    shortName: "WMS-R",
    discipline: ["OT", "ST"],
    category: "記憶",
    note: "各指数は平均100・SD15の合成得点。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "wmsr_verbal",
        name: "言語性記憶指数",
        raw: { label: "指数", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "memory_verbal", weight: 1.0 }
        ],
        note: "",
        guide: {
          text: "平均100・SD15の指数。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WMS-Rマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wmsr_visual",
        name: "視覚性記憶指数",
        raw: { label: "指数", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "memory_visual", weight: 1.0 }
        ],
        note: "",
        guide: {
          text: "平均100・SD15の指数。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WMS-Rマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wmsr_attention",
        name: "注意/集中力指数",
        raw: { label: "指数", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "working_memory", weight: 1.0 },
          { domain: "attention_selective", weight: 0.6 }
        ],
        note: "数唱・視覚性記憶範囲・精神統制からなる指数。ワーキングメモリ／注意の制御を反映。",
        guide: {
          text: "平均100・SD15の指数。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WMS-Rマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wmsr_delayed",
        name: "遅延再生指数",
        raw: { label: "指数", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "memory_verbal", weight: 0.6 },
          { domain: "memory_visual", weight: 0.6 }
        ],
        note: "言語性・視覚性の遅延再生を合成した指数。",
        guide: {
          text: "平均100・SD15の指数。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WMS-Rマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      }
    ]
  },
  {
    id: "spa",
    name: "標準言語性対連合学習検査（S-PA）",
    shortName: "S-PA",
    discipline: ["ST"],
    category: "記憶",
    note: "有関係対語・無関係対語の再生数で評価。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "spa_related",
        name: "有関係対語",
        raw: { label: "再生数", unit: "対", min: 0, max: 10, step: 1 },
        domains: [
          { domain: "memory_verbal", weight: 1.0 }
        ],
        note: "試行ごとの再生数。基準はマニュアル参照。"
      },
      {
        id: "spa_unrelated",
        name: "無関係対語",
        raw: { label: "再生数", unit: "対", min: 0, max: 10, step: 1 },
        domains: [
          { domain: "memory_verbal", weight: 1.0 }
        ],
        note: "試行ごとの再生数。基準はマニュアル参照。"
      }
    ]
  },
  {
    id: "rocft",
    name: "Rey-Osterrieth複雑図形検査（ROCFT）",
    shortName: "ROCFT",
    discipline: ["OT"],
    category: "視空間・行為",
    note: "模写・再生を36点法で採点することが多い。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "rocft_copy",
        name: "模写",
        raw: { label: "得点", unit: "点", min: 0, max: 36, step: 0.5 },
        domains: [
          { domain: "construction", weight: 1.0 },
          { domain: "visuospatial", weight: 0.6 }
        ],
        note: ""
      },
      {
        id: "rocft_immediate",
        name: "即時再生",
        raw: { label: "得点", unit: "点", min: 0, max: 36, step: 0.5 },
        domains: [
          { domain: "memory_visual", weight: 1.0 },
          { domain: "construction", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "rocft_delayed",
        name: "遅延再生",
        raw: { label: "得点", unit: "点", min: 0, max: 36, step: 0.5 },
        domains: [
          { domain: "memory_visual", weight: 1.0 },
          { domain: "construction", weight: 0.3 }
        ],
        note: ""
      }
    ]
  },
  {
    id: "kohs",
    name: "コース立方体組み合わせテスト",
    shortName: "Kohs",
    discipline: ["OT"],
    category: "視空間・行為",
    note: "IQ換算値で評価。換算・基準はマニュアル参照。",
    subtests: [
      {
        id: "kohs_iq",
        name: "IQ換算値",
        raw: { label: "IQ換算値", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "construction", weight: 1.0 },
          { domain: "visuospatial", weight: 0.6 },
          { domain: "intellect", weight: 0.3 }
        ],
        note: "模様構成による非言語性IQ。構成能力・視空間認知を主に反映。",
        guide: {
          text: "平均100・SD15のIQ（85〜115に約68%）。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／コース立方体マニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      }
    ]
  },
  {
    id: "rcpm",
    name: "レーヴン色彩マトリックス検査（RCPM）",
    shortName: "RCPM",
    discipline: ["OT", "ST"],
    category: "全般",
    note: "非言語的推理の総得点（0〜36）で評価。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "rcpm_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 36, step: 1 },
        domains: [
          { domain: "intellect", weight: 0.6 },
          { domain: "visuospatial", weight: 0.6 }
        ],
        note: ""
      }
    ]
  },
  {
    id: "bit",
    name: "行動性無視検査 日本版（BIT）",
    shortName: "BIT",
    discipline: ["OT"],
    category: "半側空間無視",
    note: "通常検査計・行動検査計で評価。カットオフはマニュアル参照。",
    subtests: [
      {
        id: "bit_conventional",
        name: "通常検査計",
        raw: { label: "通常検査合計", unit: "点", min: 0, max: 141, step: 1 },
        domains: [
          { domain: "neglect", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: "日本版（満点141・カットオフ131）に統一。国際版は満点146・カットオフ129で異なるため、使用している検査版を必ず確認する。",
        guide: {
          text: "通常検査は日本版（満点141点）で131点以下が無視疑いのカットオフの目安（国際版は満点146点・129点以下の報告あり、使用版に応じて確認）。確定判定は臨床で行う。",
          source: "BIT日本版マニュアル（満点141・カットオフ131）／国際版 Halligan et al. 1991（満点146・カットオフ129、版により異なるため使用版を確認・詳細は docs/cutoff-sources.md・要人間確認）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 132, max: 141, label: "132以上（カットオフ以上）" },
            { judgment: 2, min: 0, max: 131, label: "131以下（無視の疑い・重症度は臨床判断で上書き）" }
          ]
        }
      },
      {
        id: "bit_behavioral",
        name: "行動検査計",
        raw: { label: "行動検査合計", unit: "点", min: 0, max: 81, step: 1 },
        domains: [
          { domain: "neglect", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: "ADL場面を模した行動検査（満点81点）。",
        guide: {
          text: "行動検査は67/68点付近がカットオフの目安（報告により差あり要確認）。確定判定は臨床で行う。",
          source: "BIT日本版マニュアル／国際版 Halligan et al. 1991（詳細は docs/cutoff-sources.md・要人間確認）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 68, max: 81, label: "68以上（カットオフ以上）" },
            { judgment: 2, min: 0, max: 67, label: "67以下（無視の疑い・重症度は臨床判断で上書き）" }
          ]
        }
      }
    ]
  },
  {
    id: "cbs",
    name: "Catherine Bergego Scale（CBS）",
    shortName: "CBS",
    discipline: ["OT"],
    category: "半側空間無視",
    note: "ADL場面の無視を10項目・各0〜3で評価（高値ほど無視が強い）。基準はマニュアル参照。",
    subtests: [
      {
        id: "cbs_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 30, step: 1, higherIsWorse: true },
        domains: [
          { domain: "neglect", weight: 1.0 }
        ],
        note: "得点が高いほど無視が強い（正常域とは向きが逆）ため判定入力時に注意。",
        guide: {
          text: "得点が高いほど無視が強い（他検査と向きが逆）。Azouviらの区分（0=無視なし／1〜10=軽度／11〜20=中等度／21〜30=重度）を目安とする。確定判定は臨床で行う。",
          source: "Bergego & Azouvi 1995 / CBS日本語版（石合ら 2005）重症度区分（詳細は docs/cutoff-sources.md）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 0, max: 0, label: "0（無視なし）" },
            { judgment: 1, min: 1, max: 10, label: "1〜10（軽度）" },
            { judgment: 2, min: 11, max: 20, label: "11〜20（中等度）" },
            { judgment: 3, min: 21, max: 30, label: "21〜30（重度）" }
          ]
        }
      }
    ]
  },
  {
    id: "slta",
    name: "標準失語症検査（SLTA）",
    shortName: "SLTA",
    discipline: ["ST"],
    category: "言語",
    note: "聴く・話す・読む・書く・計算の大項目を正答率（%）等で整理。段階評価・基準はマニュアル参照。",
    subtests: [
      {
        id: "slta_listen",
        name: "聴く",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "lang_comprehension", weight: 1.0 }
        ],
        note: ""
      },
      {
        id: "slta_speak",
        name: "話す",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "lang_expression", weight: 1.0 }
        ],
        note: ""
      },
      {
        id: "slta_read",
        name: "読む",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "lang_literacy", weight: 1.0 },
          { domain: "lang_comprehension", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "slta_write",
        name: "書く",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "lang_literacy", weight: 1.0 },
          { domain: "lang_expression", weight: 0.3 }
        ],
        note: ""
      },
      {
        id: "slta_calc",
        name: "計算",
        raw: { label: "正答率", unit: "%", min: 0, max: 100, step: 0.1 },
        domains: [
          { domain: "lang_literacy", weight: 1.0 }
        ],
        note: ""
      }
    ]
  },
  {
    id: "spta",
    name: "標準高次動作性検査（SPTA）",
    shortName: "SPTA",
    discipline: ["OT", "ST"],
    category: "行為（失行）",
    note: "失行の標準検査。原版は13大項目からなるが、本ツールでは臨床的に5系統へ集約している（集約対応は docs/mapping-rationale.md 参照）。各項目は誤反応の型（錯行為・保続・無反応等）で採点。基準はマニュアル参照。",
    subtests: [
      {
        id: "spta_orofacial",
        name: "顔面・口腔動作（顔面失行）",
        raw: null,
        domains: [
          { domain: "praxis", weight: 1.0 }
        ],
        note: "原版「顔面動作」「物品を使う顔面動作」を集約。口部顔面の慣習的・物品使用動作の失行を評価。"
      },
      {
        id: "spta_gesture",
        name: "上肢の慣習的動作・模倣（観念運動性失行）",
        raw: null,
        domains: [
          { domain: "praxis", weight: 1.0 }
        ],
        note: "原版「上肢慣習的動作」「手指構成模倣」「両手・客体のない動作」を集約。ジェスチャー・模倣の失行を評価。"
      },
      {
        id: "spta_object_serial",
        name: "物品使用・系列動作（観念性失行）",
        raw: null,
        domains: [
          { domain: "praxis", weight: 1.0 }
        ],
        note: "原版「上肢・物品を使う動作」「連続的動作」「系列的動作」「下肢・物品を使う動作」を集約。物品の使用手順・系列動作の失行を評価。"
      },
      {
        id: "spta_dressing",
        name: "着衣動作（着衣失行）",
        raw: null,
        domains: [
          { domain: "praxis", weight: 1.0 },
          { domain: "visuospatial", weight: 0.3 }
        ],
        note: "原版「上肢・着衣動作」。衣服と身体の空間的対応の障害を含むため視空間にも部分的に関与。"
      },
      {
        id: "spta_construction",
        name: "描画・積木（構成）",
        raw: null,
        domains: [
          { domain: "construction", weight: 1.0 },
          { domain: "visuospatial", weight: 0.6 },
          { domain: "praxis", weight: 0.3 }
        ],
        note: "原版「描画（自発・模倣）」「積木テスト」を集約。構成障害を主に反映し、視空間認知・行為にも関与。"
      }
    ]
  },
  {
    id: "wab",
    name: "WAB失語症検査 日本語版",
    shortName: "WAB",
    discipline: ["ST"],
    category: "言語",
    note: "失語指数（AQ）・下位項目で評価。下位項目の採点様式・基準はマニュアル参照。",
    subtests: [
      {
        id: "wab_aq",
        name: "失語指数（AQ）",
        raw: { label: "AQ", unit: null, min: 0, max: 100, step: 0.1 },
        scoring: "reference",
        domains: [
          { domain: "lang_comprehension", weight: 0.6 },
          { domain: "lang_expression", weight: 0.6 }
        ],
        note: "自発話・話し言葉の理解・復唱・呼称の下位項目から算出される合成指標。同一の言語領域を下位項目と二重に押し上げるため scoring:\"reference\"（プロファイル計算から除外・参考表示）。"
      },
      {
        id: "wab_spontaneous",
        name: "自発話",
        raw: null,
        domains: [
          { domain: "lang_expression", weight: 1.0 }
        ],
        note: "得点様式・基準はマニュアル参照。"
      },
      {
        id: "wab_comprehension",
        name: "話し言葉の理解",
        raw: null,
        domains: [
          { domain: "lang_comprehension", weight: 1.0 }
        ],
        note: "得点様式・基準はマニュアル参照。"
      },
      {
        id: "wab_repetition",
        name: "復唱",
        raw: null,
        domains: [
          { domain: "lang_expression", weight: 0.6 },
          { domain: "working_memory", weight: 0.3 }
        ],
        note: "得点様式・基準はマニュアル参照。"
      },
      {
        id: "wab_naming",
        name: "呼称",
        raw: null,
        domains: [
          { domain: "lang_expression", weight: 1.0 }
        ],
        note: "得点様式・基準はマニュアル参照。"
      }
    ]
  },
  {
    id: "wais",
    name: "ウェクスラー成人知能検査（WAIS-IV）",
    shortName: "WAIS-IV",
    discipline: ["OT", "ST"],
    category: "全般",
    note: "各合成得点は平均100・SD15。年齢別基準はマニュアル参照。",
    subtests: [
      {
        id: "wais_fsiq",
        name: "全検査IQ（FSIQ）",
        raw: { label: "合成得点", unit: null, min: 40, max: 160, step: 1 },
        scoring: "reference",
        domains: [
          { domain: "intellect", weight: 1.0 }
        ],
        note: "4指標（VCI・PRI・WMI・PSI）と同一の下位検査から算出される合成得点。VCI/PRIも intellect を押し上げるため、同時入力時に intellect を二重計上する。scoring:\"reference\"（プロファイル計算から除外・参考表示）。",
        guide: {
          text: "平均100・SD15の合成得点。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WAIS-IVマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wais_vci",
        name: "言語理解指標（VCI）",
        raw: { label: "合成得点", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "intellect", weight: 0.6 },
          { domain: "lang_comprehension", weight: 0.3 },
          { domain: "lang_expression", weight: 0.3 }
        ],
        note: "言語概念形成・言語推理（結晶性知能）を反映。失語の影響を受けるため言語系にも部分的に関与。",
        guide: {
          text: "平均100・SD15の合成得点。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WAIS-IVマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wais_pri",
        name: "知覚推理指標（PRI）",
        raw: { label: "合成得点", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "visuospatial", weight: 0.6 },
          { domain: "construction", weight: 0.6 },
          { domain: "intellect", weight: 0.3 }
        ],
        note: "積木・行列推理・パズルからなり、視空間認知・構成・非言語推理を反映。",
        guide: {
          text: "平均100・SD15の合成得点。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WAIS-IVマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wais_wmi",
        name: "ワーキングメモリ指標（WMI）",
        raw: { label: "合成得点", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "working_memory", weight: 1.0 }
        ],
        note: "",
        guide: {
          text: "平均100・SD15の合成得点。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WAIS-IVマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      },
      {
        id: "wais_psi",
        name: "処理速度指標（PSI）",
        raw: { label: "合成得点", unit: null, min: 40, max: 160, step: 1 },
        domains: [
          { domain: "processing_speed", weight: 1.0 }
        ],
        note: "",
        guide: {
          text: "平均100・SD15の合成得点。統計的慣例（±1/2/3SD）による目安であり、確定判定は臨床で行う。",
          source: "IQ・指数の統計的慣例（−1SD=85/−2SD=70/−3SD=55）／WAIS-IVマニュアル",
          confidence: "convention",
          bands: [
            { judgment: 0, min: 85, max: 160, label: "85以上（−1SD以内・正常域）" },
            { judgment: 1, min: 70, max: 84, label: "70〜84（−1〜−2SD・境界）" },
            { judgment: 2, min: 55, max: 69, label: "55〜69（−2〜−3SD・低下）" },
            { judgment: 3, min: 40, max: 54, label: "54以下（−3SD以下・顕著な低下）" }
          ]
        }
      }
    ]
  },
  {
    id: "cas",
    name: "標準意欲評価法（CAS）",
    shortName: "CAS",
    discipline: ["OT", "ST"],
    category: "意欲",
    note: "面接・質問紙・観察により意欲/発動性を評価。各評価の採点様式・基準はマニュアル参照。",
    subtests: [
      {
        id: "cas_interview",
        name: "面接による意欲評価",
        raw: null,
        domains: [
          { domain: "drive", weight: 1.0 }
        ],
        note: "採点様式・基準はマニュアル参照。"
      },
      {
        id: "cas_questionnaire",
        name: "質問紙法",
        raw: null,
        domains: [
          { domain: "drive", weight: 1.0 }
        ],
        note: "採点様式・基準はマニュアル参照。"
      },
      {
        id: "cas_observation",
        name: "日常生活行動の観察評価",
        raw: null,
        domains: [
          { domain: "drive", weight: 1.0 }
        ],
        note: "採点様式・基準はマニュアル参照。"
      }
    ]
  },
  {
    id: "vitality",
    name: "Vitality Index（意欲の指標・バイタリティインデックス）",
    shortName: "Vitality Index",
    discipline: ["OT", "ST"],
    category: "意欲",
    note: "起床・意思疎通・食事・排泄・リハビリ/活動の5項目を各0〜2点で観察評価し、0〜10点で意欲/発動性を把握する病棟観察系の指標（高得点ほど意欲が高い）。身体機能や急性疾患・発熱等で低下している項目は除外して評価する規定がある（詳細はマニュアル参照）。",
    subtests: [
      {
        id: "vitality_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 10, step: 1 },
        domains: [
          { domain: "drive", weight: 1.0 }
        ],
        note: "5項目（起床・意思疎通・食事・排泄・リハビリ/活動）各0〜2点の合計。得点が高いほど意欲が高い（他検査と同じ向き）。",
        guide: {
          text: "得点範囲は0〜10点で、得点が高いほど生活意欲が高い（低いほど意欲低下）。単一の確立したカットオフは公表されておらず、連続量として経過や集団比較に用いるのが一般的。判定バンドを設ける場合の閾値は自施設で定めること（要人間確認）。確定判定は臨床で行う。",
          source: "Toba K, et al. Vitality Index as a useful tool to assess elderly with dementia. Geriatr Gerontol Int. 2002;2:23-29（鳥羽研二ら）／日本老年医学会・LIFE 評価様式（詳細は docs/cutoff-sources.md）",
          confidence: "published",
          bands: null
        }
      }
    ]
  },
  {
    id: "apathy",
    name: "やる気スコア（Apathy Scale 日本語版）",
    shortName: "やる気スコア",
    discipline: ["OT", "ST"],
    category: "意欲",
    note: "自己記入式14項目・各0〜3点の4件法で意欲低下（アパシー）を評価。合計0〜42点で、得点が高いほどアパシーが重い（逆転尺度）。うつとの鑑別に用いられる。",
    subtests: [
      {
        id: "apathy_total",
        name: "総得点",
        raw: { label: "総得点", unit: "点", min: 0, max: 42, step: 1, higherIsWorse: true },
        domains: [
          { domain: "drive", weight: 1.0 }
        ],
        note: "14項目・各0〜3点の合計。得点が高いほどアパシーが重い（正常域とは向きが逆）ため判定入力時に注意。",
        guide: {
          text: "得点範囲は0〜42点で、得点が高いほどアパシーが重い（他検査と向きが逆）。日本語版（岡田ら）の脳卒中研究では16点以上を意欲低下（アパシー）の目安とする（16点で感度81.3%・特異度85.3%の報告）。原版（Starkstein）は14点を目安とする報告があり、採用値は自施設で統一すること（要人間確認）。確定判定は臨床で行う。",
          source: "Starkstein SE, et al. 1992（原版 Apathy Scale）／岡田和悟ら 1998「やる気スコアを用いた脳卒中後の意欲低下の評価」脳卒中 20:318-323（日本語版・カットオフ16点、詳細は docs/cutoff-sources.md・要人間確認）",
          confidence: "published",
          bands: [
            { judgment: 0, min: 0, max: 15, label: "0〜15（カットオフ未満・アパシー疑い未満）" },
            { judgment: 2, min: 16, max: 42, label: "16〜42（アパシー疑い・16点カットオフ／原版14点・重症度は臨床判断で上書き）" }
          ]
        }
      }
    ]
  }
];
