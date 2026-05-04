#!/usr/bin/env bash
# 一键推送到 GitHub（优先顺序：gh 已登录 → .env.local 里的 GITHUB_TOKEN → 环境变量 GITHUB_TOKEN）
#
# 最省事：在项目根目录建 .env.local（复制 .env.local.example），写上 GITHUB_TOKEN=你的PAT
#   然后每次执行： ./push.sh   或   npm run push
#
# 令牌：https://github.com/settings/tokens/new （Classic，勾选 repo）

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_token_from_env_local() {
  local f="$ROOT/.env.local"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line//[:space:]}" ]] && continue
    if [[ "$line" =~ ^GITHUB_TOKEN=(.*)$ ]]; then
      local val="${BASH_REMATCH[1]}"
      val="${val#\"}"
      val="${val%\"}"
      val="${val#\'}"
      val="${val%\'}"
      export GITHUB_TOKEN="$val"
      return 0
    fi
  done <"$f"
}

REPO="${GITHUB_REPO:-Shuikun0/lagy}"
DEFAULT_REMOTE="https://github.com/${REPO}.git"

ensure_origin() {
  if git remote get-url origin >/dev/null 2>&1; then
    local cur
    cur="$(git remote get-url origin)"
    if [[ "$cur" != "$DEFAULT_REMOTE" ]]; then
      echo "提示：当前 origin 为 $cur（默认期望 $DEFAULT_REMOTE）"
    fi
  else
    git remote add origin "$DEFAULT_REMOTE"
  fi
}

die_hint() {
  echo ""
  echo "未配置推送凭据。任选其一："
  echo "  · 复制 .env.local.example 为 .env.local，填入 GITHUB_TOKEN=…，再运行 npm run push"
  echo "  · 或安装 GitHub CLI 并登录：brew install gh && gh auth login"
  echo "  · 或临时：GITHUB_TOKEN=… npm run push"
  exit 1
}

load_token_from_env_local
ensure_origin

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "→ 使用已登录的 GitHub CLI 推送…"
  git push -u origin main
  exit 0
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  if [[ -f "$ROOT/.env.local" ]]; then
    echo "→ 使用 .env.local 中的 GITHUB_TOKEN 推送…"
  fi
  if command -v gh >/dev/null 2>&1; then
    echo "→ 使用令牌登录 gh 并写入钥匙串（仅需一次）…"
    printf '%s\n' "$GITHUB_TOKEN" | gh auth login --with-token --hostname github.com 2>/dev/null || true
    gh auth setup-git 2>/dev/null || true
    if gh auth status >/dev/null 2>&1; then
      git push -u origin main
      exit 0
    fi
  fi
  echo "→ 使用 HTTPS + 令牌推送…"
  git push "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git" HEAD:main
  git branch --set-upstream-to=origin/main main 2>/dev/null || true
  echo "✓ 已推送。"
  exit 0
fi

echo "✗ 未检测到 gh 登录，也未找到 GITHUB_TOKEN（可用 .env.local）。"
die_hint
