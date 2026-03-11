import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DisputeDto } from './dto/dispute.dto';
import { getTrustapConfig } from '../common/trustap.config';
import { firstValueFrom } from 'rxjs';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async createTransaction(dto: CreateTransactionDto) {
    const config = getTrustapConfig();
    const buyer = await this.prisma.user.findUnique({ where: { id: dto.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: dto.sellerId } });
    if (!buyer) throw new HttpException('Buyer not found', HttpStatus.NOT_FOUND);
    if (!seller) throw new HttpException('Seller not found', HttpStatus.NOT_FOUND);

    let trustapTransactionId = `mock_${Date.now()}`;
    let paymentUrl = '';

    try {
      const res = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/api/v1/me/transactions`,
          {
            amount: Math.round(dto.amount * 100),
            currency: dto.currency.toUpperCase(),
            description: dto.description || 'Escrow transaction',
            buyer: { email: buyer.email, name: buyer.name },
            seller: { email: seller.email, name: seller.name },
          },
          { headers: config.headers },
        ),
      );
      trustapTransactionId = String(res.data?.id || res.data?.transaction_id);
    } catch (_) {}

    const redirectUri = encodeURIComponent(
      process.env.TRUSTAP_REDIRECT_URI || 'http://localhost:3000/payment/success',
    );
    paymentUrl = `${config.baseUrl}/online/transactions/${trustapTransactionId}/guest_pay?redirect_uri=${redirectUri}`;

    const transaction = await this.prisma.escrowTransaction.create({
      data: {
        trustapTransactionId,
        amount: dto.amount,
        currency: dto.currency.toUpperCase(),
        description: dto.description,
        status: TransactionStatus.PENDING,
        buyerId: dto.buyerId,
        sellerId: dto.sellerId,
        paymentUrl,
      },
      include: { buyer: true, seller: true },
    });

    return { transaction, paymentUrl, message: 'Share paymentUrl with buyer to complete payment.' };
  }

  async getAllTransactions() {
    return this.prisma.escrowTransaction.findMany({
      include: { buyer: true, seller: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentLink(id: string) {
    const tx = await this.prisma.escrowTransaction.findUnique({ where: { id } });
    if (!tx) throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    return { transactionId: id, paymentUrl: tx.paymentUrl, status: tx.status };
  }
}
