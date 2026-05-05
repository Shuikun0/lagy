import { defineConfig } from 'astro/config';

/**
 * 本地默认按「项目站」路径构建：github.io/<仓库名>/
 * CI（GitHub Actions）会注入 SITE_URL / ASTRO_ROOT_BASE / ASTRO_BASE，见 .github/workflows/github-pages.yml
 */
const site = process.env.SITE_URL ?? 'https://Shuikun0.github.io';

const useRootBase = process.env.ASTRO_ROOT_BASE === '1';

/** @type {import('astro').AstroUserConfig} */
const cfg = {
  site,
  devToolbar: { enabled: false },
};

if (useRootBase) {
  // 自定义域名：站点在域名根路径，不设 base
} else {
  cfg.base = process.env.ASTRO_BASE || '/lagy';
}

if (process.env.ASTRO_POLL === '1') {
  cfg.vite = {
    server: {
      watch: { usePolling: true, interval: 300 },
    },
  };
}

export default defineConfig(cfg);
