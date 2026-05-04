#!/usr/bin/env node
/**
 * Decap CMS + GitHub 所需的 OAuth 中转（不能把 client_secret 放进浏览器）。
 *
 * 1. 在 GitHub → Settings → Developer settings → OAuth Apps 新建应用：
 *    - Homepage URL: https://你的博客域名
 *    - Authorization callback URL: https://<本服务域名>/callback
 * 2. 部署本脚本（可用 subdomain，例如 oauth.blog.example.com），配置下方环境变量。
 * 3. Decap 的 config.yml 里 backend.base_url 指向本服务根地址（无尾部路径）。
 *
 * 运行：GITHUB_CLIENT_ID=… GITHUB_CLIENT_SECRET=… OAUTH_REDIRECT_URL=… CMS_SITE_ORIGIN=… node server.mjs
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
/** 必须与 GitHub OAuth App 里填写的 callback 完全一致，例如 https://oauth.blog.example.com/callback */
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URL;
/** 博客站点来源（含协议，无尾部斜杠），登录成功后会跳回 ${CMS_SITE_ORIGIN}/admin/#access_token=… */
const CMS_SITE_ORIGIN = process.env.CMS_SITE_ORIGIN?.replace(/\/$/, '');

function bail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !CMS_SITE_ORIGIN) {
  bail(
    '缺少环境变量：GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET、OAUTH_REDIRECT_URL、CMS_SITE_ORIGIN',
  );
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`GitHub token 交换失败：HTTP ${res.status}`);
  }
  return res.json();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/auth') {
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', CLIENT_ID);
    authorize.searchParams.set('scope', 'repo');
    authorize.searchParams.set('redirect_uri', REDIRECT_URI);
    res.writeHead(302, { Location: authorize.toString() });
    res.end();
    return;
  }

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const err = url.searchParams.get('error_description') || url.searchParams.get('error');
    if (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`GitHub OAuth 错误：${err}`);
      return;
    }
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('缺少 code 参数');
      return;
    }

    try {
      const data = await exchangeCode(code);
      if (data.error) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`GitHub 返回错误：${data.error_description || data.error}`);
        return;
      }
      const token = data.access_token;
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('未拿到 access_token');
        return;
      }
      const loc = `${CMS_SITE_ORIGIN}/admin/#access_token=${encodeURIComponent(token)}&provider=github`;
      res.writeHead(302, { Location: loc });
      res.end();
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(e instanceof Error ? e.message : '服务器错误');
    }
    return;
  }

  if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('decap oauth proxy ok');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`Decap OAuth proxy listening on :${PORT}`);
});
