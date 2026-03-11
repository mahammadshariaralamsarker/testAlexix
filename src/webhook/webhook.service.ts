import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(payload: any) {
    const eventType: string = payload?.type || payload?.event || 'unknown';
    const trustapTransactionId: string =
      payload?.data?.transaction_id || payload?.transaction_id;
  }
}
