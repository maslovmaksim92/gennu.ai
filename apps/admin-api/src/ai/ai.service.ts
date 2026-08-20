import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from '../integrations/crypto.service';

interface OpenAiIntegrationConfig {
  model?: string;
}

interface OpenAiSettings {
  apiKey: string;
  model: string;
}

@Injectable()
export class AiService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  public async chat(userId: string, message: string, sessionId?: string) {
    let session = sessionId
      ? await this.prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            userId,
          },
        })
      : null;

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          userId,
          mode: 'ADMIN_ASSISTANT',
          title: message.slice(0, 80),
        },
      });
    }

    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
      },
    });

    const history = await this.prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 20,
    });

    const settings = await this.settings();
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model,
        input: [
          {
            role: 'system',
            content:
              'You are the Proto.ai admin assistant. Help with themes, blocks, platform operations, architecture and administration. Never claim to have changed platform state unless a dedicated tool/API operation was executed.',
          },
          ...history.map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`OpenAI error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const text =
      data.output_text ??
      data.output?.flatMap((item: any) => item.content ?? []).find((item: any) => item.type === 'output_text')
        ?.text ??
      'No text response';

    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: text,
        metadata: {
          responseId: data.id,
          model: settings.model,
        },
      },
    });

    return {
      sessionId: session.id,
      message: text,
    };
  }

  private async settings(): Promise<OpenAiSettings> {
    const integration = await this.prisma.integration.findUnique({
      where: {
        provider: 'OPENAI',
      },
    });

    const config = (integration?.config ?? {}) as OpenAiIntegrationConfig;
    const apiKey = integration?.secretEncrypted
      ? this.crypto.decrypt(integration.secretEncrypted)
      : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('OpenAI integration is not configured');
    }

    return {
      apiKey,
      model: config.model?.trim() || process.env.OPENAI_MODEL || 'gpt-5.6-terra',
    };
  }
}
