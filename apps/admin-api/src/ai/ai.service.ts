import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from '../integrations/crypto.service';
@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}
  private async key() {
    const row = await this.prisma.integration.findUnique({
      where: {
        provider: 'OPENAI',
      },
    });
    if (row?.secretEncrypted) return this.crypto.decrypt(row.secretEncrypted);
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    throw new BadRequestException('OpenAI integration is not configured');
  }
  async chat(userId: string, message: string, sessionId?: string) {
    let session = sessionId
      ? await this.prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            userId,
          },
        })
      : null;
    if (!session)
      session = await this.prisma.chatSession.create({
        data: {
          userId,
          mode: 'ADMIN_ASSISTANT',
          title: message.slice(0, 80),
        },
      });
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
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.key()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-terra',
        input: [
          {
            role: 'system',
            content:
              'You are the Proto.ai admin assistant. Help with themes, blocks, platform operations, architecture and administration. Never claim to have changed platform state unless a dedicated tool/API operation was executed.',
          },
          ...history.map((x) => ({
            role: x.role === 'assistant' ? 'assistant' : 'user',
            content: x.content,
          })),
        ],
      }),
    });
    if (!response.ok) throw new BadRequestException(`OpenAI error: ${response.status}`);
    const data: any = await response.json();
    const text =
      data.output_text ??
      data.output?.flatMap((x: any) => x.content ?? []).find((x: any) => x.type === 'output_text')
        ?.text ??
      'No text response';
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: text,
        metadata: {
          responseId: data.id,
        },
      },
    });
    return {
      sessionId: session.id,
      message: text,
    };
  }
}
