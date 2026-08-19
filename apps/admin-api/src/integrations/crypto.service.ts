import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
@Injectable()
export class CryptoService {
  private key() {
    const raw = process.env.INTEGRATION_ENCRYPTION_KEY ?? '';
    if (!/^[0-9a-f]{64}$/i.test(raw))
      throw new Error('INTEGRATION_ENCRYPTION_KEY must be 64 hex chars');
    return Buffer.from(raw, 'hex');
  }
  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, body].map((x) => x.toString('base64url')).join('.');
  }
  decrypt(payload: string) {
    const [a, b, c] = payload.split('.').map((x) => Buffer.from(x, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', this.key(), a);
    decipher.setAuthTag(b);
    return Buffer.concat([decipher.update(c), decipher.final()]).toString('utf8');
  }
}
