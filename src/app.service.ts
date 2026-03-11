import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🔐 Trustap Escrow Payment System is running!';
  }
}
