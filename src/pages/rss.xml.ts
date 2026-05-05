import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_NAME } from '../site';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog', ({ data }) => data.draft !== true)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  if (!site) {
    throw new Error('请在 astro.config.mjs 中设置 site（你的域名），RSS 需要正确的绝对链接');
  }

  return rss({
    title: SITE_NAME,
    description: SITE_NAME,
    site,
    items: posts.map((post) => ({
      link: `/blog/${post.id}/`,
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
    })),
    customData: `<language>zh-cn</language>`,
  });
};
