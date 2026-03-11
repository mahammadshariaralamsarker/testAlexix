import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL || '',
    });
    this.client = new PrismaClient({ adapter } as any);
  }

  get user() {
    return this.client.user;
  }

  get escrowTransaction() {
    return this.client.escrowTransaction;
  }

  get webhookEvent() {
    return this.client.webhookEvent;
  }

  async onModuleInit() {
    await (this.client as any).$connect();
  }

  async onModuleDestroy() {
    await (this.client as any).$disconnect();
  }
}
