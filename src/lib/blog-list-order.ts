/**
 * 与首页列表相同的排序：置顶（pinned 数值小的靠前）→ 其余按发布时间倒序 →
 * 同日再按 dateOrder 升序（越小越靠前，缺省为 0）→ 最后按 id 稳定次序。
 */
export function compareHomePosts<
  T extends { id: string; data: { pinned?: number; pubDate: Date; dateOrder?: number } },
>(a: T, b: T): number {
  const ap = a.data.pinned;
  const bp = b.data.pinned;
  const aPinned = typeof ap === 'number';
  const bPinned = typeof bp === 'number';
  if (aPinned && bPinned && ap !== bp) return ap - bp;
  if (aPinned && !bPinned) return -1;
  if (!aPinned && bPinned) return 1;
  const pubCmp = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  if (pubCmp !== 0) return pubCmp;
  const ad = a.data.dateOrder ?? 0;
  const bd = b.data.dateOrder ?? 0;
  if (ad !== bd) return ad - bd;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
