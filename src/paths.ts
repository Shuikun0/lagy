/** 与 `import.meta.env.BASE_URL` 一致的站内路径（兼容 `/` 与 `/repo`） */
export function getHomeHref(baseUrl: string): string {
  const b = baseUrl || '/';
  return b === '/' ? '/' : b.replace(/\/$/, '');
}

export function getPostHref(baseUrl: string, postId: string): string {
  const h = getHomeHref(baseUrl);
  return h === '/' ? `/blog/${postId}/` : `${h}/blog/${postId}/`;
}
