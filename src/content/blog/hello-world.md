---
title: 你好，世界
description: 第一篇示例文章，说明如何在本项目中写作与发布。
pubDate: 2026-05-05
slug: hello-world
---

这是一篇 **Markdown** 文章。正文支持常见语法：列表、链接、[Astro 文档](https://docs.astro.build)、代码块等。

## 如何写一篇新文章

在 `src/content/blog/` 下新建 `.md` 文件，顶部写上 frontmatter：

```yaml
---
title: 标题
description: 摘要（用于列表和 RSS）
pubDate: 2026-05-05
updatedDate: 2026-05-06  # 可选
draft: true               # 可选；生产构建会隐藏草稿
---
```

保存后本地运行 `npm run dev` 即可预览；发布前执行 `npm run build`，将 `dist/` 上传到你的静态托管即可。

## 代码示例

```js
console.log('部署愉快');
```
