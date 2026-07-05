# CogMap カットオフ・基準の出典一覧（v2 guide）

最終更新: 2026-07-04（v4：データ層ワーカーD1 / vitality・apathy 追加）｜初版: 2026-07-04（調査ワーカーR1 / Web照合）

`data/assessments.js` の各下位項目 `guide` に設定した値と出典。SPEC §2-3 の原則に従い、
**判定の確定は常にセラピスト**。guide は「目安」の提示に留まり、生値入力時に該当バンドを
ハイライト提案するのみ（自動確定しない）。出典を確認できないものは guide=null（捏造禁止）。

- confidence:published … 公表カットオフ（原著・マニュアル・広く用いられる値）
- confidence:convention … IQ・指数系の統計的慣例（平均100・SD15、±1/2/3SD）
- **要人間確認** … 版差・報告差・年齢正規表など、値の確定に人手確認が要るもの

数値の確認は下記の一般公開情報（検査解説サイト・書誌）で行った。**臨床導入時は必ず各検査の
公式マニュアル／原著で最終確認すること**（本一覧は公表値の所在を示すもので、正規表の転記ではない）。

---

## 1. published（バンドあり）

| 検査 | 項目 | 値（バンド） | 出典表記 | confidence | 確認方法 | フラグ |
|---|---|---|---|---|---|---|
| MMSE-J | mmse_total | 24〜30=正常域 / 23以下=低下疑い（23/24カットオフ） | Folstein et al. 1975 / MMSE-J マニュアル・国内23/24（感度83%特異度93%） | published | urashita.com/archives/34631, kaigo.homes.co.jp（MMSE解説） | — |
| MoCA-J | moca_total | 26〜30=正常域 / 25以下=MCI疑い（25/26カットオフ、教育歴+1点補正） | Nasreddine et al. 2005 / MoCA-J（鈴木ら 2010 等）25/26（感度93%特異度87-89%） | published | ywooper.com/moca-j, stroke-lab.com/speciality/38007 | — |
| FAB | fab_total | 12〜18=カットオフ以上 / 11以下=前頭葉機能低下疑い（11/12） | Dubois et al. 2000 / 国内報告 | published | noguchilabo.com/frontal-assessment-battery, ippo-lab.com（FAB解説） | **要人間確認**：カットオフに幅（11/12 vs 12/13）・前頭葉外の影響も加点 |
| BIT日本版 | bit_conventional | 日本版基準に統一：満点141・132以上=カットオフ以上 / 131以下=無視疑い（国際版は満点146・129以下がカットオフで別基準） | BIT日本版マニュアル（満点141・カットオフ131）／国際版 Halligan et al. 1991（満点146・カットオフ129） | published | therabby.com/assessment/bit, chibatc.co.jp（BIT） | **要人間確認**：2026-07-04に日本版へ統一（旧版はraw.max=146と日本版カットオフ131が混在するバグだった）。国際版で運用する場合は満点146・カットオフ129に置き換えること |
| BIT日本版 | bit_behavioral | 68以上=カットオフ以上 / 67以下=無視疑い | BIT日本版マニュアル / 国際版 Halligan et al. 1991 | published | therabby.com/assessment/bit | **要人間確認**：行動検査カットオフ 67/68 に報告差 |
| CBS | cbs_total | 0=無視なし / 1-10=軽度 / 11-20=中等度 / 21-30=重度（逆転尺度） | Bergego & Azouvi 1995 / CBS日本語版（石合ら 2005） | published | stroke-lab.com/speciality/35888, jstage jans1981/25/4 | 逆転尺度（高得点=重度）。Azouvi区分。 |
| やる気スコア | apathy_total | 0〜42点（14項目×0-3）。0〜15=カットオフ未満 / 16〜42=アパシー疑い（逆転尺度・16点カットオフ、原版14点） | Starkstein SE et al. 1992（原版 Apathy Scale）／岡田和悟ら 1998「やる気スコアを用いた脳卒中後の意欲低下の評価」脳卒中 20(3):318-323 | published | strokedatabank.ncvc.go.jp（やる気スコア様式PDF）, comedi.jp/2362, bsd.neuroinf.jp（アパシー・脳科学辞典） | **要人間確認**：逆転尺度（高得点=重度・raw.higherIsWorse）。日本語版16点（感度81.3%/特異度85.3%）と原版14点で報告差。採用値は自施設で統一 |

---

## 2. convention（IQ・指数系、統計的慣例バンド）

平均100・SD15。−1SD=85 / −2SD=70 / −3SD=55 を境界に4段階へ対応。
（85以上=正常域 / 70〜84=境界 / 55〜69=低下 / 54以下=顕著な低下）

| 検査 | 項目 | 出典表記 | confidence | 確認方法 |
|---|---|---|---|---|
| WAIS-IV | wais_fsiq, wais_vci, wais_pri, wais_wmi, wais_psi | 統計的慣例（±1/2/3SD）／WAIS-IVマニュアル | convention | Wechsler尺度の一般的分類（平均100・SD15） |
| WMS-R | wmsr_verbal, wmsr_visual, wmsr_attention, wmsr_delayed | 統計的慣例（±1/2/3SD）／WMS-Rマニュアル | convention | 同上（各指数 平均100・SD15） |
| コース立方体 | kohs_iq | 統計的慣例（±1/2/3SD）／コース立方体マニュアル | convention | chibatc.co.jp, rehabilidata.com/kohs-block-design-test（IQ平均100・85〜115に約68%を確認） |

注：これらは検査固有の公表カットオフではなく、指数の分布に対する統計的慣例。confidence を
convention と明示。臨床的重症度は個別に上書き可。

---

## 3. published（テキストのみ・年齢群別基準／bands=null）

年齢群別の正規表はアプリに転記しない（著作権・分量）。guide.text で「年齢群別基準あり・
マニュアル参照」を示し、年齢非依存の単一カットオフは設けない。

| 検査 | 項目 | 出典表記 | confidence | フラグ |
|---|---|---|---|---|
| TMT-J | tmt_a, tmt_b | TMT-Jマニュアル 年齢帯別基準 | published | 年齢帯別（20-89歳）。B−A差・B/A比も参照。 |
| かなひろい | kanahiroi_nonsense, kanahiroi_story | 金子満雄（老研版）年齢群別基準・原典年次は一次未確認 | published | **要人間確認**：年齢群別の見落とし基準はマニュアルで確認、原典（発表年）は一次未確認のため要確認 |
| CAT | cat_span_visual, cat_span_auditory, cat_cancel_detect, cat_sdmt, cat_mwt, cat_pasat | CAT（標準注意検査法）マニュアル 年齢帯別基準 | published | 年齢帯別データ。生値の様式も版で異なる（CAT-R留意）。 |
| Vitality Index | vitality_total | Toba K et al. 2002 Geriatr Gerontol Int 2:23-29（鳥羽研二ら）／日本老年医学会・LIFE評価様式 | published | jpn-geriat-soc.or.jp/tool/pdf/tool_12.pdf, carenote.jp/vitality-index, onlinelibrary.wiley.com（Toba 2002・DOI:10.1046/j.1444-1586.2002.00016.x） | **要人間確認**：得点範囲0〜10（5項目×0-2）・高得点ほど意欲高＝順方向は確認済。単一の確立カットオフは公表なく連続量として使用。閾値を設ける場合は自施設で設定 |

---

## 4. guide=null（出典未確認または数値基準になじまない）

以下は guide を設定しない。各項目の `note` で「基準はマニュアル参照」を案内。

- CAT: cat_pst（上中下）, cat_cpt … 生値 raw=null（反応時間等）で単純バンド化になじまない。
- BADS: 全下位（プロフィール得点0-4、年齢補正標準化はマニュアル）。
- KWCST: kwcst_ca, kwcst_pe（年齢基準・保続の算出はマニュアル）。
- RBMT, WMS-R以外の記憶（rbmt_sps, rbmt_prospective, spa_related, spa_unrelated, rocft_*）… 年齢基準。
- SLTA 全下位, WAB 全下位（AQのカットオフ93.8は本調査で一次確認できず不採用。捏造回避のためnull）。
- RCPM（rcpm_total）… 年齢基準。
- SPTA 全下位（誤反応の型で採点。単純カットオフになじまない）。
- CAS 全下位（面接・質問紙・観察の質的評価）。

---

## 5. 全体サマリ

- guide 付与：**28 項目**（published バンドあり7 ＋ convention 10 ＋ published テキストのみ11）
- guide=null：37 項目
- 収載：検査23（v4で vitality・apathy 追加）／下位項目 65。
- **要人間確認**フラグ：FAB カットオフ幅、BIT 版差（満点・カットオフ）×2、かなひろい年齢群別基準、
  やる気スコア（16点 vs 14点の版差）、Vitality Index（単一カットオフ非公表）
- 不採用（捏造回避）：WAB AQ カットオフ 93.8（一次確認できず null 化）

### v4 追記（2026-07-04・意欲系2検査）

- **Vitality Index（vitality_total）**：Toba K et al. Vitality Index as a useful tool to assess elderly
  with dementia. Geriatr Gerontol Int. 2002;2:23-29（鳥羽研二ら）。5項目（起床・意思疎通・食事・排泄・
  リハビリ/活動）各0〜2点、合計0〜10点。**高得点ほど意欲が高い（順方向・higherIsWorseなし）**。
  身体機能低下・急性疾患等の項目は除外評価。単一の確立カットオフは公表がなく連続量として使用するため
  bands=null（閾値は自施設設定＝要人間確認）。確認：日本老年医学会PDF・carenote.jp・Wiley（原著書誌）。
- **やる気スコア（apathy_total）**：原版 Starkstein SE et al. 1992、日本語版 岡田和悟ら 1998
  「やる気スコアを用いた脳卒中後の意欲低下の評価」脳卒中 20(3):318-323。14項目・各0〜3点、合計0〜42点。
  **高得点ほどアパシーが重い（逆転尺度・raw.higherIsWorse:true）**。日本語版カットオフ16点（感度81.3%・
  特異度85.3%）、原版14点。bands（0〜15／16〜42）を設定。版差は要人間確認。確認：脳卒中データバンクPDF様式・
  comedi.jp・脳科学辞典。

導入時チェック：上記「要人間確認」項目は、使用している検査の版（BITは国際版/日本版、CATはCAT/CAT-R、
やる気スコアは日本語版16点/原版14点）に合わせて公式マニュアル・原著で満点・カットオフ・年齢群別基準を
確認してから運用すること。
