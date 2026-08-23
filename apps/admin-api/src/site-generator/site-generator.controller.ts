import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { GenerateSiteDto } from './site-generator.dto';
import { SiteGeneratorService } from './site-generator.service';

@Controller('site-generator')
@UseGuards(JwtGuard, AdminGuard)
export class SiteGeneratorController {
  public constructor(private readonly generator: SiteGeneratorService) {}

  @Post('generate')
  public generate(@Req() req: any, @Body() body: GenerateSiteDto) {
    return this.generator.generate(req.user.sub, body.templateVersionId, body.prompt);
  }
}
