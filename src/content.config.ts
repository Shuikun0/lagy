import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** 可选：首页列表副标题（不写则不显示） */
    listLine: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.preprocess((val) => (val === '' || val == null ? undefined : val), z.coerce.date().optional()),
    draft: z.boolean().optional(),
    /** Decap CMS 用于文件名的 slug，可省略（由文件名决定 URL） */
    slug: z.string().optional(),
    /** 正文已加密（PBKDF2 + AES-GCM），解密在浏览器完成 */
    encrypted: z.boolean().optional(),
    /** 可选密码提示，展示在解锁表单旁 */
    passwordHint: z.string().optional(),
    cipherText: z.string().optional(),
    cipherIv: z.string().optional(),
    cipherSalt: z.string().optional(),
  })
    .superRefine((data, ctx) => {
      if (data.encrypted === true) {
        if (!data.cipherText || !data.cipherIv || !data.cipherSalt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'encrypted: true 时需要 cipherText、cipherIv、cipherSalt',
            path: ['encrypted'],
          });
        }
      }
    }),
});

export const collections = { blog };
