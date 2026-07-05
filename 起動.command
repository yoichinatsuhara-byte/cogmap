#!/bin/bash
# CogMap 院内配布用ランチャー
# このスクリプトのあるディレクトリを 127.0.0.1 のみでローカル配信し、既定ブラウザで開く。
# 外部ネットワークには一切通信しない（SPEC §2 完全ローカル）。ビルドは不要。
# ダブルクリックで起動できることを前提に、エラー時はウィンドウを残して原因を表示する。

set -u

# 変数展開は日本語の直後に来る箇所で必ず ${VAR} と波括弧で囲む。
# macOS標準の /bin/bash（3.2系）は ja_JP.UTF-8 下で `$VAR` の直後に全角文字が
# 続くと変数名の一部と誤認して "unbound variable" で落ちることがあるため。

PORT=8418
HOST=127.0.0.1

# このファイル自身があるディレクトリを解決する（シンボリックリンク越しでも可）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR"

fail() {
  echo ""
  echo "エラー: $1"
  echo "このウィンドウを閉じて内容を担当者に伝えてください。"
  read -n 1 -s -r -p "何かキーを押すと終了します..."
  echo ""
  exit 1
}

if [ ! -f "$DIST_DIR/index.html" ]; then
  fail "index.html が見つかりません（${DIST_DIR}）。フォルダ構成を確認してください。"
fi

if ! command -v python3 >/dev/null 2>&1; then
  fail "python3 が見つかりません。このMacにはPython 3が必要です。"
fi

# 既にこのポートで応答があり、かつそれが CogMap 本体（index.html の目印文字列）で
# あれば、サーバーは起動済みとみなして使い回す。無関係なアプリが同じポートを
# 使っている場合に誤って再利用・そのまま開いてしまうのを防ぐための確認。
EXISTING_BODY="$(curl -s --max-time 1 "http://$HOST:$PORT/")"
if [ -n "$EXISTING_BODY" ] && printf '%s' "$EXISTING_BODY" | grep -q "CogMap"; then
  echo "既存のサーバー（ポート ${PORT}）を再利用します。"
elif [ -n "$EXISTING_BODY" ]; then
  fail "ポート ${PORT} は別のアプリが使用中です。起動.command 内のPORTを変更するか、該当アプリを終了してください。"
else
  echo "サーバーを起動しています（ポート ${PORT}、127.0.0.1のみ・外部通信なし）..."
  # no-cache配信: 素の http.server はヒューリスティックキャッシュで更新後も
  # 古いJSが配信され続けるため、Cache-Control: no-store を必ず付ける。
  (cd "$DIST_DIR" && nohup python3 -c '
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        http.server.SimpleHTTPRequestHandler.end_headers(self)
    def log_message(self, *a):
        pass
port = int(sys.argv[1])
http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
' "$PORT" >/dev/null 2>&1 &)

  # 起動待ち（最大約6秒）
  started=0
  for _ in $(seq 1 20); do
    if curl -s -o /dev/null --max-time 1 "http://$HOST:$PORT/"; then
      started=1
      break
    fi
    sleep 0.3
  done

  if [ "$started" -ne 1 ]; then
    fail "サーバーの起動を確認できませんでした（ポート ${PORT} が他のアプリで使用中の可能性があります）。"
  fi
fi

open "http://$HOST:$PORT/"

echo ""
echo "ブラウザで http://$HOST:$PORT/ を開きました。"
echo "このウィンドウは閉じて構いません（サーバーはバックグラウンドで動き続けます）。"
sleep 2
