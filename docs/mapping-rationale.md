# CogMap マッピング根拠（v2 / v4追記）

最終更新: 2026-07-04（v4：データ層ワーカーD1 / 二重カウント監査・意欲系2検査・大分類改名。§6-7）
初版: 2026-07-04（調査ワーカーR1 / 神経心理学文献照合。§1-5）

本書は `data/assessments.js` の各下位項目→認知領域マッピング（domains / weight）の根拠と、
v1 からの変更点を記録する。weight は 1.0=その領域を直接測る主指標 / 0.6=強く関与 /
0.3=部分的に関与 の3値のみ。1.0 は「文献的にその領域を直接測ると言える」場合に限る。

出典・カットオフの一覧は `docs/cutoff-sources.md` を参照。

---

## 1. 構成変更（v1→v2）

| 種別 | id | 内容 |
|---|---|---|
| 削除 | `hdsr` | HDS-R。オーナー指示によりv2で収載外（MMSE/MoCAで代替）。 |
| 削除 | `fluency` | 語流暢性課題。オーナー指示によりv2で収載外（語流暢性は FAB 課題2に一部含意）。 |
| 追加 | `kanahiroi` | かなひろいテスト（category「注意」、CATの直後）。下位2項目。 |
| 追加 | `spta` | 標準高次動作性検査（SLTAの直後、discipline OT/ST）。13大項目を5系統に集約。 |
| 領域追加 | `praxis` | domains.js に「行為（失行）」を neglect 直後に追加（計22領域）。 |

検査数 21 / 下位項目 63（削除2検査4項目、追加2検査7項目）。

---

## 2. かなひろいテストの構成と根拠

実際の検査構成は「無意味綴り課題」＋「物語文課題」の2部からなる仮名抹消課題。
文字（あ・い・う・え・お）を拾いながら、後者では物語を読解する二重課題。
採点は見落とし数・正答数、および物語内容の把握の可否。

| 下位項目 | domains | 根拠 |
|---|---|---|
| `kanahiroi_nonsense` 無意味綴り課題 | attention_selective 1.0 / attention_sustained 0.3 | 無意味列からの目標文字の選択的走査。純粋な選択性注意課題。持続的走査も要する。 |
| `kanahiroi_story` 物語文課題 | attention_divided 1.0 / attention_selective 0.6 / lang_comprehension 0.3 | 文字拾い（選択）と内容把握（理解）を同時遂行する二重課題＝分配性注意が主。前頭葉性の注意制御の関与が指摘され、これは分配性注意/注意制御として表現。物語理解の要素で言語理解に部分的に関与。 |

「選択性・分配性注意＋前頭葉機能への関与」というオーナー指示に対し、前頭葉性の注意制御は
本ツールの領域体系では attention_divided（配分性注意＝二重課題性）に集約して表現した。

---

## 3. SPTA 13大項目→5系統への集約

原版 SPTA は13大項目（顔面動作／物品を使う顔面動作／上肢慣習的動作／手指構成模倣／
両手・客体のない動作／連続的動作／着衣動作／物品を使う動作／系列的動作／下肢・物品を使う動作／
描画・自発／描画・模倣／積木テスト）。臨床的な失行分類に沿って5系統へ集約した。

| 集約項目 | 原版の対応大項目 | domains | 根拠 |
|---|---|---|---|
| `spta_orofacial` 顔面・口腔動作 | 顔面動作＋物品を使う顔面動作 | praxis 1.0 | 口部顔面失行。行為の直接評価。 |
| `spta_gesture` 上肢の慣習的動作・模倣 | 上肢慣習的動作＋手指構成模倣＋両手・客体のない動作 | praxis 1.0 | 観念運動性失行（ジェスチャー・模倣）。 |
| `spta_object_serial` 物品使用・系列動作 | 物品を使う動作＋連続的動作＋系列的動作＋下肢・物品を使う動作 | praxis 1.0 | 観念性失行（物品の使用手順・系列）。 |
| `spta_dressing` 着衣動作 | 着衣動作 | praxis 1.0 / visuospatial 0.3 | 着衣失行。衣服-身体の空間対応の障害を含むため視空間に部分関与。 |
| `spta_construction` 描画・積木 | 描画（自発・模倣）＋積木テスト | construction 1.0 / visuospatial 0.6 / praxis 0.3 | 構成障害が主。視空間認知が強く関与し、行為の側面にも部分関与。 |

集約により失行の主要類型（口部顔面・観念運動性・観念性・着衣・構成）を過不足なく被覆する
（5±2の範囲）。構成系（描画・積木）は construction/visuospatial に重みを振り、失行検査でありながら
構成障害の情報も統合プロファイルに反映されるようにした。

---

## 4. マッピング再検証：v1→v2 で変更した箇所

全21検査・63項目を文献照合で再検証。主指標（1.0）の妥当性を確認し、以下を修正した。
記載のない項目は v1 の重みを妥当と判断し維持（検証済み）。

| 検査 | 項目 | 変更内容 | 一行理由 |
|---|---|---|---|
| TMT-J | `tmt_a` Part A | processing_speed 0.6→**1.0**、**visuospatial 0.3 追加** | 完成時間は代表的な処理速度指標であり、視覚的走査（視空間）も要する。選択性注意「だけ」ではない。 |
| TMT-J | `tmt_b` Part B | **exec_shift 0.6 追加**、**processing_speed 0.3 追加** | 転換性注意に加え、セット転換（遂行機能）・処理速度も反映する。 |
| CAT | `cat_cancel_detect` 抹消・検出 | **processing_speed 0.3 追加** | 時間制限のある抹消課題で処理速度も関与する。 |
| CAT | `cat_pasat` PASAT | **processing_speed 0.3 追加** | 一定ペースの連続加算課題でペース処理の速度成分を含む。 |
| CAT | `cat_pst` 上中下検査 | **attention_shift 0.3 追加** | 干渉抑制が主だが、注意の転換的側面も報告される。 |

注（TMT-J `tmt_b`）：Part Bの `processing_speed` を0.3に留めているのは、B−A差分（Part B所要時間からPart Aの
処理速度成分を差し引いて転換成分を取り出す）でセット転換の負荷を見る臨床慣行に合わせた意図的な設計である。
処理速度の主指標はPart A（1.0）が担い、Part Bでは副次的関与（0.3）に留めることで役割分担を反映している。

### 再検証したが変更なし（主指標の妥当性を確認した主な項目）

- MMSE/MoCA 総得点→intellect 1.0：総得点粒度では全般的知的機能の単一指標が妥当。
- CAT span（視覚性/聴覚性）→working_memory 1.0：スパンは即時記憶・注意容量の直接指標。
- CAT SDMT→processing_speed 1.0（+selective 0.6）：CATマニュアルは配分性の文脈で扱うが、
  国際的に SDMT は処理速度指標として確立。主指標は処理速度を維持。
- FAB→exec系4領域 0.6均等（+intellect 0.3）：6下位項目（類似・語列挙・運動系列・葛藤指示・
  Go/NoGo・把握行動）が概念化/流暢性/抑制/運動計画に均等分布。前頭葉総合指標として妥当。
- KWCST 達成カテゴリー数/保続性誤り→exec_shift 1.0：概念形成・セット転換の直接指標。
- BADS 各下位→exec_planning/exec_shift 中心：SPEC §6 の方針どおり。修正6要素の
  memory_prospective は SPEC 明示の 0.3 を維持。
- WMS-R/WAIS/RBMT/ROCFT/S-PA/SLTA/WAB/CBS/BIT/Kohs/RCPM/CAS：各主指標を文献照合し妥当と確認。
  WAIS-PRI は視空間・構成 0.6/0.6（積木・行列推理・パズル）で維持。
  RCPM は非言語推理（intellect 0.6 / visuospatial 0.6）で維持。

---

## 5. 領域体系上の表現の注記

- 「前頭葉機能」は単一領域ではなく、本体系では exec_*（遂行機能群）＋ attention_divided/working_memory
  に分散して表現する。かなひろい・FAB・TMT-B・CAT上中下などの前頭葉性負荷はこれらに割り付けた。
- CBS は「得点が高いほど無視が強い」向きの逆転尺度。guide.bands は高得点ほど重い judgment に対応させ、
  UI 側のハイライトが正しい向きになるようにしている（note にも明記）。

---

## 6. 二重カウント監査（v4）

ルール（SPEC §6・オーナー必須指示）：**合成指標が、同時入力されうる他の下位項目の構成要素を
集計したものなら `scoring:"reference"` を付ける**（プロファイル計算から除外・参考表示のみ）。
全23検査（v4で vitality/apathy 追加）・65項目を点検した。

### reference を付けた項目（3件）

| 検査 | 項目 | 判定 | 理由 |
|---|---|---|---|
| BADS | `bads_profile` 総プロフィール得点 | **reference** | 下位6検査のプロフィール得点の合計。同一の遂行機能領域（exec_planning/shift/inhibition）を下位項目と二重に押し上げる（SPEC 明示の確定例）。 |
| WAIS-IV | `wais_fsiq` 全検査IQ | **reference** | 4指標と同一の下位検査から算出される最上位合成得点。VCI（intellect 0.6）・PRI（intellect 0.3）も intellect を押すため、FSIQ 同時入力で intellect を二重計上する。 |
| WAB | `wab_aq` 失語指数（AQ） | **reference** | 自発話・話し言葉の理解・復唱・呼称から算出される合成指標。lang_expression / lang_comprehension を下位項目と二重に押し上げる。 |

### 点検したが reference を付けなかった項目（要判断・主なもの）

| 検査 | 項目 | 判定 | 理由 |
|---|---|---|---|
| WMS-R | `wmsr_delayed` 遅延再生指数 | 付けない | 言語性・視覚性記憶指数の「合成（足し上げ）」ではなく、遅延試行から算出される**並列の独立指数**（保持/忘却という別構成概念）。総合−下位の階層関係にない。同一記憶課題群を共有する重複は weight 0.6（1.0 ではない）に留めて過大評価を回避済み。General Memory 指数（言語+視覚の合成）は最初から非収載。 |
| RBMT | `rbmt_sps` 標準プロフィール点 | 付けない | 本ツールの RBMT 下位は SPS と展望記憶項目の2つのみ。SPS は memory_verbal/visual へ、展望記憶は memory_prospective へと**別領域**にマップされ、同一領域の二重押し上げが起きない。SPS が採点上は展望項目を含むが、押し上げ先の領域が異なるため二重カウントにならない。 |
| WAIS-IV | `wais_vci/pri/wmi/psi` 各指標 | 付けない | 収載している最下位（WAIS 個別下位検査は非収載）。指標同士は並列で、合成−構成の階層にない。上位の FSIQ のみ reference 化で足りる。 |
| WAB | `wab_spontaneous/comprehension/repetition/naming` | 付けない | AQ の構成要素（leaf）側。reference 化するのは合成側の AQ のみ。 |
| FAB | `fab_total` 総得点 | 付けない | 6下位項目の合計だが、本ツールは FAB 下位を個別収載しておらず総得点のみ。同時入力で競合する下位がないため二重計上は発生しない。 |
| MMSE/MoCA/RCPM/Kohs/SLTA各大項目 | 各総得点・大項目 | 付けない | 上位の合成指標を別途収載していない（総得点・大項目が leaf）。 |
| BIT | `bit_conventional` / `bit_behavioral` | 付けない | 一方が他方の合成ではなく、別項目群（通常検査 vs 行動検査）の並列合計。neglect 1.0 を2系統で測る妥当な複数指標であり、階層的二重カウントではない（平均に寄与）。 |
| ROCFT | `rocft_immediate` / `rocft_delayed` | 付けない | 即時再生・遅延再生は同一図形の別試行（並列指標）で、一方が他方の合成ではない。memory_visual を異なる遅延で測る複数指標として平均に寄与。 |
| CAS | `cas_interview/questionnaire/observation` | 付けない | 面接・質問紙・観察の並列3手法。いずれかが他の合成ではない。 |

**結論**：階層的な「総合＝下位の集計」で、かつ下位項目も本ツールに収載され同時入力されうるものは
`bads_profile` / `wais_fsiq` / `wab_aq` の3件のみ。これらに reference を付与した。並列指標（同一領域を
複数手法で測るもの）は weight（0.6等）で調整済みのため reference 化しない。

---

## 7. v4 変更点（2026-07-04・データ層ワーカーD1）

### 7-1. 大分類の改名：視空間・構成 → 視空間・行為

`domains.js` の group「視空間・構成」を**「視空間・行為」**へ改名（COG_GROUPS 配列＋
visuospatial/construction/neglect/praxis の4領域の group 値）。id・name は不変。**無視（neglect）・
失行（praxis）が「視空間の低下」と誤読される問題**への対策で、行為（失行）を含む群であることを
大分類名に明示した。※ `assessments.js` の ROCFT/Kohs の `category:"視空間・構成"` は検査一覧の
グルーピング用ラベルであり COG_GROUPS とは独立のため、本タスクの範囲外として変更していない
（整合性検査＝domain.group ⊂ COG_GROUPS には影響しない）。

### 7-2. 意欲系2検査の追加（drive 1.0）

| 検査 | 項目 | domains | 得点/向き | 根拠 |
|---|---|---|---|---|
| Vitality Index（vitality） | `vitality_total` | drive 1.0 | 0〜10・**高いほど良い** | 病棟観察系の意欲指標（5項目×0-2）。Toba 2002。順方向のため higherIsWorse なし。 |
| やる気スコア（apathy） | `apathy_total` | drive 1.0 | 0〜42・**高いほど重い** | 自己記入14項目×0-3。原版 Starkstein 1992／日本語版 岡田ら 1998。逆転尺度のため **raw.higherIsWorse:true**、bands は高得点＝高 judgment に対応（カットオフ16点）。 |

得点範囲・カットオフ・出典は WebSearch/WebFetch で一次〜二次照合の上で設定（詳細は
docs/cutoff-sources.md §5 v4追記）。CAS の直後に配置（category「意欲」）。
