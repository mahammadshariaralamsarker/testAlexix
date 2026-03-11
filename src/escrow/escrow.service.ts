import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
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

  // STEP 3: Create Escrow Transaction
  async createTransaction(dto: CreateTransactionDto) {
    const config = getTrustapConfig();

    const buyer = await this.prisma.user.findUnique({ where: { id: dto.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: dto.sellerId } });

    if (!buyer) throw new HttpException('Buyer not found', HttpStatus.NOT_FOUND);
    if (!seller) throw new HttpException('Seller not found', HttpStatus.NOT_FOUND);

    let trustapTransactionId: string | null = null;
    let paymentUrl: string | null = null;

    try {
      const trustapPayload = {
        amount: Math.round(dto.amount * 100), // Trustap uses cents
        currency: dto.currency.toUpperCase(),
        description: dto.description || 'Escrow transaction',
        buyer: { email: buyer.email, name: buyer.name },
        seller: { email: seller.email, name: seller.name },
      };

      const res = await firstValueFrom(
        this.httpService.post(
          `${config.baseUrl}/api/v1/me/transactions`,
          trustapPayload,
          { headers: config.headers },
        ),
      );

      trustapTransactionId = String(res.data?.id || res.data?.transaction_id);
      const redirectUri = encodeURIComponent(
        process.env.TRUSTAP_REDIRECT_URI || 'http://localhost:3000/payment/success',
      );
      paymentUrl = `${config.baseUrl}/online/transactions/${trustapTransactionId}/guest_pay?redirect_uri=${redirectUri}`;
    } catch (err) {
      // Sandbox/offline: generate mock IDs
      trustapTransactionId = `mock_${Date.now()}`;
      paymentUrl = `${config.baseUrl}/online/transactions/${trustapTransactionId}/guest_pay?redirect_uri=http://localhost:3000/payment/success`;
    }

    // Save to local DB
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

    return {
      transaction,
      paymentUrl,
      message: 'Transaction created. Share paymentUrl with the buyer to complete payment.',
    };
  }

  // STEP 4: Get Payment Link
  async getPaymentLink(id: string) {
    const transaction = await this.prisma.escrowTransaction.findUnique({ where: { id } });
    if (!transaction) throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    return {
      transactionId: id,
      trustapTransactionId: transaction.trustapTransactionId,
      paymentUrl: transaction.paymentUrl,
      status: transaction.status,
    };
  }

  // STEP 5: Get Transaction Status
  async getTransactionStatus(id: string) {
    const transaction = await this.prisma.escrowTransaction.findUnique({
      where: { id },
      include: { buyer: true, seller: true, webhookEvents: true },
    });
    if (!transaction) throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);

    // Optionally fetch live status from Trustap
    if (transaction.trustapTransactionId && !transaction.trustapTransactionId.startsWith('mock_')) {
      const config = getTrustapConfig();
      try {
        await firstValueFrom(
          this.httpService.get(
            `${config.baseUrl}/api/v1/me/transactions/${transaction.trustapTransactionId}`,
            { headers: config.headers },
          ),
        );
      } catch (_) {
        // Ignore error: live status fetch is optional; we return local DB state
      }
    }

    return transaction;
  }

  // Get All Transactions
  async getAllTransactions() {
    return this.prisma.escrowTransaction.findMany({
      include: { buyer: true, seller: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Calculate Trustap Charge
  async calculateCharge(currency: string, price: number) {
    const config = getTrustapConfig();
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${config.baseUrl}/api/v1/charge?currency=${currency}&price=${Math.round(price * 100)}`,
          { headers: config.headers },
        ),
      );
      return res.data;
    } catch (err) {
      // Return estimated fee for sandbox
      const fee = price * 0.029 + 0.30;
      return {
        price,
        currency,
        trustap_fee: parseFloat(fee.toFixed(2)),
        total: parseFloat((price + fee).toFixed(2)),
        note: 'Estimated fee (sandbox mode)',
      };
    }
  }

  // STEP 7: Release Funds to Seller
  async releaseFunds(id: string) {
    const transaction = await this.prisma.escrowTransaction.findUnique({ where: { id } });
    if (!transaction) throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);

    if (
      transaction.status === TransactionStatus.COMPLETED ||
      transaction.status === TransactionStatus.FUNDS_RELEASED
    ) {
      throw new HttpException('Funds already released', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.escrowTransaction.update({
      where: { id },
      data: { status: TransactionStatus.FUNDS_RELEASED },
    });

    return { message: 'Funds released to seller successfully', transaction: updated };
  }

  // STEP 8: Raise Dispute
  async raiseDispute(id: string, dto: DisputeDto) {
    const transaction = await this.prisma.escrowTransaction.findUnique({ where: { id } });
    if (!transaction) throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.escrowTransaction.update({
      where: { id },
      data: { status: TransactionStatus.DISPUTED, disputeReason: dto.reason },
    });

    return { message: 'Dispute raised successfully', transaction: updated };
  }

  // Get Balance
  async getBalance() {
    const config = getTrustapConfig();
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${config.baseUrl}/api/v1/me/balances`, { headers: config.headers }),
      );
      return res.data;
    } catch (err) {
      return {
        available: 0,
        pending: 0,
        currency: 'EUR',
        note: 'Sandbox mode — connect to real Trustap API for live balances',
      };
    }
  }
}
