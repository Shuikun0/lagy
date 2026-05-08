/** 与首页列表相同的排序：置顶（pinned 数值小的靠前），其余按发布时间倒序 */
export function compareHomePosts<T extends { data: { pinned?: number; pubDate: Date } }>(a: T, b: T): number {
  const ap = a.data.pinned;
  const bp = b.data.pinned;
  const aPinned = typeof ap === 'number';
  const bPinned = typeof bp === 'number';
  if (aPinned && bPinned && ap !== bp) return ap - bp;
  if (aPinned && !bPinned) return -1;
  if (!aPinned && bPinned) return 1;
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}
