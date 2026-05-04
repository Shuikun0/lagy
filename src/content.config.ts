import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.preprocess((val) => (val === '' || val == null ? undefined : val), z.coerce.date().optional()),
    draft: z.boolean().optional(),
    /** Decap CMS 用于文件名的 slug，可省略（由文件名决定 URL） */
    slug: z.string().optional(),
  }),
});

export const collections = { blog };
