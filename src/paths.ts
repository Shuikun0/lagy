/** 与 `import.meta.env.BASE_URL` 一致的站内路径（兼容 `/` 与 `/repo`） */
export function getHomeHref(baseUrl: string): string {
  const b = (baseUrl || '/').replace(/\/?$/, '/');
  return `${b}home/`;
}

export function getPostHref(baseUrl: string, postId: string): string {
  const b = (baseUrl || '/').replace(/\/?$/, '/');
  return `${b}blog/${postId}/`;
}

/** `public/` 下文件的 URL，例如 `images/cover.jpg` → `/images/cover.jpg`（含子路径前缀） */
export function getPublicHref(baseUrl: string, pathInPublic: string): string {
  const b = (baseUrl || '/').replace(/\/?$/, '/');
  const p = pathInPublic.replace(/^\//, '');
  return `${b}${p}`;
}
