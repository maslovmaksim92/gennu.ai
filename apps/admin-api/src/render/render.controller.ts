import { Controller, Get, Header, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PREVIEW_TTL_SECONDS, PreviewTokenService } from './preview-token.service';
import { RenderService } from './render.service';

@Controller('render')
export class RenderController {
  public constructor(
    private readonly render: RenderService,
    private readonly previewTokens: PreviewTokenService,
  ) {}

  /** Returns the structured render model, useful for debugging a generated site. */
  @Get('sites/:siteId/model')
  @UseGuards(JwtGuard, AdminGuard)
  public model(@Param('siteId') siteId: string) {
    return this.render.model(siteId);
  }

  /** Reports what the engine refused to render, without producing the document. */
  @Get('sites/:siteId/issues')
  @UseGuards(JwtGuard, AdminGuard)
  public async issues(@Param('siteId') siteId: string, @Query('page') page?: string) {
    const { issues } = await this.render.html(siteId, page, { noIndex: true });
    return { issues };
  }

  /** Mints a short-lived link the admin iframe can load directly. */
  @Post('sites/:siteId/preview-token')
  @UseGuards(JwtGuard, AdminGuard)
  public async previewToken(@Req() req: any, @Param('siteId') siteId: string) {
    await this.render.model(siteId);
    const token = await this.previewTokens.issue(siteId, req.user.sub);

    return {
      token,
      url: `/api/render/preview/${token}`,
      expiresIn: PREVIEW_TTL_SECONDS,
    };
  }

  /**
   * Serves the rendered page.
   *
   * The document is sandboxed by the caller and never indexed. `X-Frame-Options`
   * is deliberately not set: the admin embeds this route in an iframe.
   */
  @Get('preview/:token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  public async preview(
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
    @Query('page') page?: string,
  ): Promise<string> {
    const siteId = await this.previewTokens.siteIdFrom(token);
    const { html } = await this.render.html(siteId, page, {
      basePath: `/api/render/preview/${token}`,
      pageParam: 'page',
      noIndex: true,
    });

    // A preview may contain generated content, so it runs with no scripting,
    // no form submission and no plugins even though the engine emits none.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; img-src * data:; font-src *; sandbox",
    );

    return html;
  }
}
