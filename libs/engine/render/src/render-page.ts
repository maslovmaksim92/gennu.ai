import { escapeHtml, sanitizeCss, sanitizeUrl } from './html';
import { renderBlock } from './render-block';
import { renderThemeTokens } from './tokens';
import type {
  RenderIssue,
  RenderOptions,
  RenderPageInput,
  RenderResult,
  RenderSiteInput,
} from './types';

/**
 * Minimal baseline so a site looks intentional before any theme is applied.
 * Deliberately tiny: the theme owns the design, this only removes browser noise.
 */
const BASE_CSS = `*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);color:var(--color-ink,#151820);background:var(--color-bg,#ffffff);line-height:1.55}
img{max-width:100%;height:auto;display:block}
a{color:var(--color-accent,#2563eb)}
h1,h2,h3,h4,h5,h6{font-family:var(--font-heading,inherit);line-height:1.2;margin:0 0 .5em}
p{margin:0 0 1em}`;

function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath) {
    return '';
  }

  const safe = sanitizeUrl(basePath);
  if (!safe || !safe.startsWith('/')) {
    return '';
  }

  return safe.endsWith('/') ? safe.slice(0, -1) : safe;
}

/** Renders one page of a site into a complete, self-contained HTML document. */
export function renderPage(
  site: RenderSiteInput,
  page: RenderPageInput,
  options: RenderOptions = {},
): RenderResult {
  const issues: RenderIssue[] = [];
  const bodyParts: string[] = [];
  const cssParts: string[] = [BASE_CSS];
  const seenCss = new Set<string>();

  const tokens = renderThemeTokens(site.theme);
  if (tokens) {
    cssParts.unshift(tokens);
  }

  const themeCss = site.theme?.css ? sanitizeCss(site.theme.css) : null;
  if (site.theme?.css && themeCss === null) {
    issues.push({ path: 'theme.css', message: 'Theme CSS was rejected as unsafe.' });
  }
  if (themeCss) {
    cssParts.push(themeCss);
  }

  for (const block of page.blocks) {
    const rendered = renderBlock(block);
    issues.push(...rendered.issues);

    if (rendered.html) {
      bodyParts.push(rendered.html);
    }

    if (rendered.css && !seenCss.has(rendered.css)) {
      seenCss.add(rendered.css);
      cssParts.push(rendered.css);
    }
  }

  const basePath = normalizeBasePath(options.basePath);
  const nav = site.pages.length > 1 ? renderNav(site, page, basePath, options.pageParam) : '';
  const lang = /^[a-z]{2}(-[A-Za-z]{2,8})?$/.test(options.lang ?? '') ? options.lang! : 'ru';
  const title = escapeHtml(`${page.name} — ${site.name}`.trim());
  const robots = options.noIndex ? '<meta name="robots" content="noindex,nofollow">' : '';

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${robots}
<title>${title}</title>
<style>
${cssParts.join('\n')}
</style>
</head>
<body>
${nav}${bodyParts.join('\n')}
</body>
</html>`;

  return { html, issues };
}

function renderNav(
  site: RenderSiteInput,
  current: RenderPageInput,
  basePath: string,
  pageParam: string | undefined,
): string {
  const links = site.pages
    .map((page) => {
      const target = pageParam
        ? `${basePath || '.'}?${pageParam}=${encodeURIComponent(page.slug)}`
        : `${basePath}${page.slug}`;
      const href = sanitizeUrl(target);
      if (!href) {
        return '';
      }

      const label = escapeHtml(page.name);
      return page.slug === current.slug
        ? `<span aria-current="page">${label}</span>`
        : `<a href="${escapeHtml(href)}">${label}</a>`;
    })
    .filter(Boolean)
    .join('');

  if (!links) {
    return '';
  }

  return `<nav class="site-nav" style="display:flex;gap:16px;padding:16px;border-bottom:1px solid rgba(0,0,0,.1)">${links}</nav>\n`;
}

/** Finds a page by slug, falling back to the first page of the site. */
export function selectPage(
  site: RenderSiteInput,
  slug: string | undefined,
): RenderPageInput | undefined {
  if (!site.pages.length) {
    return undefined;
  }

  if (!slug) {
    return site.pages[0];
  }

  const normalized = slug.startsWith('/') ? slug : `/${slug}`;
  return site.pages.find((page) => page.slug === normalized) ?? site.pages[0];
}
