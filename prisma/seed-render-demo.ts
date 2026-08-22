/**
 * Seeds a minimal but complete render set: one theme, three blocks and one
 * template that pins them.
 *
 * Without this, a fresh database has nothing the render engine can draw, which
 * makes the Site Generator impossible to try. Everything is created as a
 * published 1.0.0 so the generator can select it immediately.
 */
import { PrismaClient, PublishStatus } from '@prisma/client';

const prisma = new PrismaClient();

const THEME = {
  key: 'demo-clean',
  name: 'Demo Clean',
  description: 'Neutral light theme used to demonstrate the render engine.',
  schema: {
    tokens: {
      color: {
        bg: '#ffffff',
        surface: '#f5f6f8',
        ink: '#151820',
        muted: '#687080',
        accent: '#2563eb',
        'accent-ink': '#ffffff',
        border: '#e2e5ea',
      },
      font: {
        body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        heading: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      },
      space: { sm: '8px', md: '16px', lg: '32px', xl: '64px' },
      radius: { sm: '8px', md: '14px' },
    },
  },
};

const BLOCKS = [
  {
    key: 'hero',
    name: 'Hero',
    description: 'Headline, supporting text and one call to action.',
    defaults: {
      title: 'Заголовок',
      subtitle: '',
      ctaLabel: '',
      ctaHref: '',
    },
    schema: {
      fields: [
        { key: 'title', type: 'text', label: 'Заголовок', required: true },
        { key: 'subtitle', type: 'text', label: 'Подзаголовок' },
        { key: 'ctaLabel', type: 'text', label: 'Текст кнопки' },
        { key: 'ctaHref', type: 'url', label: 'Ссылка кнопки' },
      ],
      layout: {
        tag: 'section',
        class: 'hero',
        style: {
          padding: '{space.xl} {space.lg}',
          background: '{color.surface}',
          color: '{color.ink}',
        },
        children: [
          { tag: 'h1', text: { bind: 'title' } },
          {
            tag: 'p',
            class: 'lead',
            when: { bind: 'subtitle' },
            style: { color: '{color.muted}' },
            text: { bind: 'subtitle' },
          },
          {
            tag: 'a',
            class: 'cta',
            when: { bind: 'ctaLabel' },
            attrs: { href: { bind: 'ctaHref', fallback: '#' } },
            style: {
              background: '{color.accent}',
              color: '{color.accent-ink}',
              'border-radius': '{radius.sm}',
            },
            text: { bind: 'ctaLabel' },
          },
        ],
      },
      css: `& { text-align: center }
h1 { font-size: 44px; margin: 0 0 16px }
.lead { max-width: 620px; margin: 0 auto 24px; font-size: 18px }
.cta { display: inline-block; padding: 12px 24px; text-decoration: none; font-weight: 600 }`,
    },
  },
  {
    key: 'feature-list',
    name: 'Feature list',
    description: 'A titled grid of short items.',
    defaults: { title: '', items: [] },
    schema: {
      fields: [
        { key: 'title', type: 'text', label: 'Заголовок' },
        {
          key: 'items',
          type: 'list',
          label: 'Пункты',
          fields: [
            { key: 'title', type: 'text', label: 'Название', required: true },
            { key: 'text', type: 'text', label: 'Описание' },
          ],
        },
      ],
      layout: {
        tag: 'section',
        class: 'features',
        style: { padding: '{space.xl} {space.lg}', color: '{color.ink}' },
        children: [
          { tag: 'h2', when: { bind: 'title' }, text: { bind: 'title' } },
          {
            tag: 'ul',
            class: 'grid',
            children: [
              {
                tag: 'li',
                repeat: { bind: 'items' },
                style: { border: '1px solid {color.border}', 'border-radius': '{radius.md}' },
                children: [
                  { tag: 'h3', text: { bind: 'item.title' } },
                  {
                    tag: 'p',
                    when: { bind: 'item.text' },
                    style: { color: '{color.muted}' },
                    text: { bind: 'item.text' },
                  },
                ],
              },
            ],
          },
        ],
      },
      css: `& { max-width: 1080px; margin: 0 auto }
h2 { font-size: 30px; margin: 0 0 24px }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; list-style: none; margin: 0; padding: 0 }
.grid li { padding: 20px }
.grid h3 { font-size: 17px; margin: 0 0 8px }
.grid p { margin: 0; font-size: 14px }`,
    },
  },
  {
    key: 'contact-cta',
    name: 'Contact CTA',
    description: 'Closing block with contact details.',
    defaults: { title: 'Свяжитесь с нами', phone: '', email: '', address: '' },
    schema: {
      fields: [
        { key: 'title', type: 'text', label: 'Заголовок' },
        { key: 'phone', type: 'text', label: 'Телефон' },
        { key: 'email', type: 'text', label: 'E-mail' },
        { key: 'address', type: 'text', label: 'Адрес' },
      ],
      layout: {
        tag: 'section',
        class: 'contact',
        style: {
          padding: '{space.xl} {space.lg}',
          background: '{color.surface}',
          color: '{color.ink}',
        },
        children: [
          { tag: 'h2', text: { bind: 'title' } },
          {
            tag: 'dl',
            children: [
              { tag: 'dt', when: { bind: 'phone' }, text: 'Телефон' },
              { tag: 'dd', when: { bind: 'phone' }, text: { bind: 'phone' } },
              { tag: 'dt', when: { bind: 'email' }, text: 'E-mail' },
              { tag: 'dd', when: { bind: 'email' }, text: { bind: 'email' } },
              { tag: 'dt', when: { bind: 'address' }, text: 'Адрес' },
              { tag: 'dd', when: { bind: 'address' }, text: { bind: 'address' } },
            ],
          },
        ],
      },
      css: `& { text-align: center }
h2 { font-size: 28px; margin: 0 0 16px }
dl { display: inline-grid; grid-template-columns: auto auto; gap: 6px 16px; text-align: left; margin: 0 }
dt { font-weight: 600 }
dd { margin: 0 }`,
    },
  },
];

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (!admin) {
    throw new Error('Run "pnpm db:seed" first: the demo set needs an administrator to own it.');
  }

  const theme = await prisma.theme.upsert({
    where: { key: THEME.key },
    update: { name: THEME.name, description: THEME.description },
    create: {
      key: THEME.key,
      name: THEME.name,
      description: THEME.description,
      createdById: admin.id,
    },
  });

  const themeVersion = await prisma.themeVersion.upsert({
    where: { themeId_version: { themeId: theme.id, version: '1.0.0' } },
    update: { schema: THEME.schema, status: PublishStatus.PUBLISHED, publishedAt: new Date() },
    create: {
      themeId: theme.id,
      version: '1.0.0',
      major: 1,
      minor: 0,
      patch: 0,
      schema: THEME.schema,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date(),
      changelog: 'Initial demo theme.',
    },
  });

  const blockVersionIds: string[] = [];

  for (const block of BLOCKS) {
    const definition = await prisma.blockDefinition.upsert({
      where: { key: block.key },
      update: { name: block.name, description: block.description },
      create: {
        key: block.key,
        name: block.name,
        description: block.description,
        createdById: admin.id,
      },
    });

    const version = await prisma.blockVersion.upsert({
      where: { blockDefinitionId_version: { blockDefinitionId: definition.id, version: '1.0.0' } },
      update: {
        schema: block.schema,
        defaults: block.defaults,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        blockDefinitionId: definition.id,
        version: '1.0.0',
        major: 1,
        minor: 0,
        patch: 0,
        schema: block.schema,
        defaults: block.defaults,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        changelog: 'Initial demo block.',
      },
    });

    blockVersionIds.push(version.id);
  }

  const template = await prisma.template.upsert({
    where: { key: 'demo-landing' },
    update: { name: 'Demo Landing' },
    create: {
      key: 'demo-landing',
      name: 'Demo Landing',
      description: 'Landing template pinning the demo blocks and theme.',
      createdById: admin.id,
    },
  });

  await prisma.templateVersion.upsert({
    where: { templateId_version: { templateId: template.id, version: '1.0.0' } },
    update: {
      schema: { allowedBlockVersionIds: blockVersionIds, defaultThemeVersionId: themeVersion.id },
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      templateId: template.id,
      version: '1.0.0',
      major: 1,
      minor: 0,
      patch: 0,
      schema: { allowedBlockVersionIds: blockVersionIds, defaultThemeVersionId: themeVersion.id },
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date(),
      changelog: 'Initial demo template.',
    },
  });

  console.log(
    `Render demo ready: theme ${THEME.key}, ${BLOCKS.length} blocks, template demo-landing`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
