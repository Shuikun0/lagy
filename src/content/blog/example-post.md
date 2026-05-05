---
title: 示例文章：排版与组件一览
description: 演示标题、列表、引用、代码块与链接，可作为写新文的模板。
pubDate: 2026-05-06
slug: example-post
---

这是一篇**示例正文**，用来确认本地预览与线上样式是否正常。你可以复制本文件，改 `slug` 和标题后另存为新文章。

## 列表示例

- 无序列表第一项
- 第二项，可夹 **粗体** 与 *斜体*

1. 有序步骤一
2. 步骤二：访问 [Astro 文档](https://docs.astro.build)

## 引用

> 把段落写成引用块，适合摘录或补充说明。

## 代码

行内代码：`npm run dev`。

```ts
type Post = {
  title: string;
  pubDate: Date;
};

const preview = true;
```

## 小结

写完保存后执行 `npm run dev` 预览；确认无误再 `git push`，GitHub Actions 会更新你设置的主域名（如 **blog.dogecoin33.com**）上的静态页。
