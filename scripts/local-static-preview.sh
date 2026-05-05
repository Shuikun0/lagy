#!/usr/bin/env bash
# 静态预览：dist 固定由 astro preview 提供；内容变更后在本脚本里按 Enter 重建，再到浏览器手动刷新。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PREVIEW_PID=""

cleanup() {
  if [[ -n "${PREVIEW_PID}" ]] && kill -0 "${PREVIEW_PID}" 2>/dev/null; then
    kill "${PREVIEW_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "  首次构建中…"
npm run build

echo "  启动静态预览（端口 4322）…"
npm run preview:root &
PREVIEW_PID=$!

sleep 2
open "http://127.0.0.1:4322/" 2>/dev/null || true

echo ""
echo "  地址：http://127.0.0.1:4322/"
echo "  改完内容后：在本窗口按 Enter → 重新构建 → 到浏览器按 ⌘R 或 F5 刷新。"
echo "  按 Ctrl+C 结束预览。"
echo ""

while true; do
  read -r || break
  echo "  正在构建…"
  npm run build
  echo "  构建完成，请到浏览器刷新。"
  echo ""
done
