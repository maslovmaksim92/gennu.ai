import { BadRequestException, ConflictException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';

export function assertDraft(status: PublishStatus): void {
  if (status !== PublishStatus.DRAFT) {
    throw new ConflictException(
      'Published or deprecated versions are immutable. Create a new version.',
    );
  }
}

export function assertCanPublish(status: PublishStatus): void {
  if (status !== PublishStatus.DRAFT) {
    throw new ConflictException('Only draft versions can be published.');
  }
}

export function parseSemanticVersion(value: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    throw new BadRequestException('Version must use MAJOR.MINOR.PATCH format.');
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}
