#!/usr/bin/env bash
# 一键推送到 GitHub（仍需你提供一次凭据，工具无法代替你登录）。
#
# 用法 A（推荐）：先在终端登录 GitHub CLI，再执行
#   npm run push:github
#
# 用法 B：用令牌一行搞定（勿泄露、勿提交 token）
#   GITHUB_TOKEN=ghp_xxxx npm run push:github
#
# 令牌：GitHub → Settings → Developer settings → Personal access tokens
#       Classic：勾选 repo；Fine-grained：该仓库 Contents Read/Write

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO="${GITHUB_REPO:-Shuikun0/lagy}"
DEFAULT_REMOTE="https://github.com/${REPO}.git"

ensure_origin() {
  if git remote get-url origin >/dev/null 2>&1; then
    local cur
    cur="$(git remote get-url origin)"
    if [[ "$cur" != "$DEFAULT_REMOTE" && "$cur" != "https://github.com/${REPO}.git" ]]; then
      echo "当前 origin 为：$cur"
      echo "若要改成 ${DEFAULT_REMOTE}，请运行： git remote set-url origin ${DEFAULT_REMOTE}"
    fi
  else
    git remote add origin "$DEFAULT_REMOTE"
  fi
}

die_hint() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  任选一种方式后再运行：npm run push:github"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  1) 安装并登录 GitHub CLI："
  echo "       brew install gh && gh auth login"
  echo ""
  echo "  2) 或临时传入令牌（用完 unset GITHUB_TOKEN）："
  echo "       GITHUB_TOKEN=你的PAT npm run push:github"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
}

ensure_origin

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "→ 使用已登录的 GitHub CLI 推送…"
  git push -u origin main
  exit 0
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    echo "→ 使用 GITHUB_TOKEN 登录 gh 并写入系统钥匙串（推荐）…"
    printf '%s\n' "$GITHUB_TOKEN" | gh auth login --with-token --hostname github.com
    gh auth setup-git
    git push -u origin main
    exit 0
  fi
  echo "→ 使用 GITHUB_TOKEN 推送（未检测到 gh，可用 brew install gh 获得更好体验）…"
  git push "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git" HEAD:main
  git branch --set-upstream-to=origin/main main 2>/dev/null || true
  echo "✓ 已推送。以后推送可先：brew install gh && gh auth login"
  exit 0
fi

echo "✗ 未检测到 GitHub 登录信息。"
die_hint
