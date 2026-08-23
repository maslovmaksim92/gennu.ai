import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from '../integrations/crypto.service';

/** How many past messages of a chat session are replayed to the model. */
const HISTORY_TURNS = 20;

interface OpenAiIntegrationConfig {
  model?: string;
}

interface OpenAiSettings {
  apiKey: string;
  model: string;
}

interface OpenAiResponse {
  id?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}

export interface AiJsonResult<T> {
  data: T;
  model: string;
  responseId?: string;
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

    /**
     * The most recent turns, not the first ones.
     *
     * Ordering ascending and taking 20 would pin the window to the start of the
     * session: past twenty messages the assistant would keep re-reading the
     * opening and never see what the user just wrote. So take the newest and
     * put them back in chronological order for the model.
     */
    const recent = await this.prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: HISTORY_TURNS,
    });
    const history = recent.reverse();

    const settings = await this.settings();
    const data = await this.request(settings, [
      {
        role: 'system',
        content:
          'You are the Proto.ai admin assistant. Help with themes, blocks, platform operations, architecture and administration. Never claim to have changed platform state unless a dedicated tool/API operation was executed.',
      },
      ...history.map((item) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: item.content,
      })),
    ]);
    const text = this.outputText(data) || 'No text response';

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

  public async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<AiJsonResult<T>> {
    const settings = await this.settings();
    const data = await this.request(settings, [
      {
        role: 'system',
        content: `${systemPrompt} Return JSON only. Do not wrap the result in Markdown fences.`,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ]);
    const text = this.outputText(data);

    if (!text) {
      throw new BadRequestException('OpenAI returned an empty response.');
    }

    try {
      return {
        data: JSON.parse(this.stripJsonFence(text)) as T,
        model: settings.model,
        responseId: data.id,
      };
    } catch {
      throw new BadRequestException('OpenAI returned invalid JSON for site generation.');
    }
  }

  private async request(
    settings: OpenAiSettings,
    input: Array<{ role: string; content: string }>,
  ): Promise<OpenAiResponse> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model,
        input,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `OpenAI error: ${response.status}${body ? ` - ${body.slice(0, 500)}` : ''}`,
      );
    }

    return (await response.json()) as OpenAiResponse;
  }

  private outputText(data: OpenAiResponse): string {
    return (
      data.output_text ??
      data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')
        ?.text ??
      ''
    );
  }

  private stripJsonFence(value: string): string {
    return value
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  private async settings(): Promise<OpenAiSettings> {
    const integration = await this.prisma.integration.findFirst({
      where: {
        provider: {
          equals: 'OPENAI',
          mode: 'insensitive',
        },
      },
    });

    const config = (integration?.config ?? {}) as OpenAiIntegrationConfig;
    const apiKey = integration?.secretEncrypted
      ? this.crypto.decrypt(integration.secretEncrypted)
      : process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      throw new BadRequestException(
        'OpenAI integration is not configured. Save an API key in Admin > Integrations > OpenAI or set OPENAI_API_KEY.',
      );
    }

    return {
      apiKey,
      model: config.model?.trim() || process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-terra',
    };
  }
}
