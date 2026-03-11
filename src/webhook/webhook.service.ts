import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

export interface TrustapWebhookPayload {
  type?: string;
  event?: string;
  transaction_id?: string;
  data?: {
    transaction_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(payload: TrustapWebhookPayload) {
    const eventType: string = payload?.type || payload?.event || 'unknown';
    const trustapTransactionId: string =
      payload?.data?.transaction_id || payload?.transaction_id || '';

    let transaction = null;
    if (trustapTransactionId) {
      transaction = await this.prisma.escrowTransaction.findUnique({
        where: { trustapTransactionId },
      });
    }

    // Map event → status
    const statusMap: Record<string, TransactionStatus> = {
      'payment.received': TransactionStatus.PAYMENT_RECEIVED,
      'transaction.completed': TransactionStatus.COMPLETED,
      'dispute.raised': TransactionStatus.DISPUTED,
      'funds.released': TransactionStatus.FUNDS_RELEASED,
      'refund.issued': TransactionStatus.REFUNDED,
      'transaction.cancelled': TransactionStatus.CANCELLED,
      'escrow.funded': TransactionStatus.IN_ESCROW,
    };

    const newStatus = statusMap[eventType];

    if (transaction && newStatus) {
      await this.prisma.escrowTransaction.update({
        where: { id: transaction.id },
        data: { status: newStatus },
      });

      // Save webhook event to DB for audit
      await this.prisma.webhookEvent.create({
        data: {
          eventType,
          payload: payload as object,
          transactionId: transaction.id,
        },
      });
    }

    return { received: true, eventType, transactionId: transaction?.id || null };
  }
}
