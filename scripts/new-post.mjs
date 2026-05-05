#!/usr/bin/env node
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const slug = process.argv[2];
const titleArg = process.argv.slice(3).join(' ').trim();

if (!slug) {
  console.error(`
用法:
  npm run new:post -- <slug> [标题]

slug 只能用英文小写、数字和连字符（与 URL 一致），例如: my-note
示例:
  npm run new:post -- summer-trip "夏日游记"
`);
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('slug 格式不正确：仅允许小写字母、数字与连字符');
  process.exit(1);
}

const filePath = join(root, 'src/content/blog', `${slug}.md`);
if (existsSync(filePath)) {
  console.error(`文件已存在: ${filePath}`);
  process.exit(1);
}

const title = titleArg || slug.replace(/-/g, ' ');
const today = new Date().toISOString().slice(0, 10);

const body = `---
title: ${JSON.stringify(title)}
description: 在这里写一句摘要（列表页与 RSS 会用到）。
pubDate: ${today}
slug: ${slug}
draft: true
---

从这里开始写正文（Markdown）。预览满意后把上方 draft 改成 false，再推送发布。
`;

writeFileSync(filePath, body, 'utf8');
console.log(`已创建: ${filePath}`);
console.log('下一步：npm run dev:root（或双击 Bloge-Dev），在浏览器里看效果。');
